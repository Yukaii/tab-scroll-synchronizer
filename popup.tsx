import { useCallback, useMemo, useState } from "react"
import useSWR from "swr"
import useSWRMutation from "swr/mutation"
import { sendMessage } from "webext-bridge"
import browser from "webextension-polyfill"

import "./style.css"

function IndexPopup() {
  const { data: rawTabs = [] } = useSWR("tabs", async () => {
    return browser.tabs.query({ pinned: false })
  })
  const [checkState, setCheckState] = useState<Record<number, boolean>>({})
  const [search, setSearch] = useState("")
  const {
    data: { syncTabIds = [], recentTabIds = [] } = {},
    mutate: mutateSyncTabs
  } = useSWR(
    "syncState",
    async () => {
      return sendMessage("getState", undefined, "background")
    },
    {
      onSuccess: (data) => {
        setCheckState(
          data.syncTabIds.reduce((acc, id) => ({ ...acc, [id]: true }), {})
        )
      }
    }
  )

  const { trigger: stopSync, isMutating } = useSWRMutation(
    "stopSync",
    async () => {
      return sendMessage("stopSync", undefined, "background")
    },
    {
      onSuccess: () => {
        mutateSyncTabs()
      }
    }
  )

  const { trigger: startSync, isMutating: isSyncing } = useSWRMutation(
    "startSync",
    async () => {
      const tabIds = Object.keys(checkState)
        .filter((id) => checkState[Number(id)])
        .map(Number)

      return sendMessage("startSync", { tabIds }, "background")
    },
    {
      onSuccess: () => {
        mutateSyncTabs()
      }
    }
  )

  const handleCheck = useCallback((id: number) => {
    setCheckState((prev) => ({ ...prev, [id]: !prev[id] }))
  }, [])

  const recentTabId = recentTabIds[1]
  const recentTab = rawTabs.find((tab) => tab.id === recentTabId)
  const recentTabDomain = recentTab ? new URL(recentTab.url).hostname : ""

  const sorter = useCallback(
    (a: browser.Tabs.Tab, b: browser.Tabs.Tab) => {
      if (a.id === recentTabId) return -1
      if (b.id === recentTabId) return 1

      const aDomain = new URL(a.url).hostname
      const bDomain = new URL(b.url).hostname

      if (aDomain === recentTabDomain) return -1
      if (bDomain === recentTabDomain) return 1

      return 0
    },
    [recentTabId, recentTabDomain]
  )

  const tabs = useMemo(() => {
    if (!search) return rawTabs.sort(sorter)

    return rawTabs.sort(sorter).filter((tab) => {
      return (
        tab.title?.toLowerCase().includes(search.toLowerCase()) ||
        tab.url?.toLowerCase().includes(search.toLowerCase()) ||
        // always show checked tabs
        checkState[tab.id]
      )
    })
  }, [rawTabs, search, checkState, sorter])

  // Get sync state from background

  return (
    <div className="flex flex-col pt-1">
      <input
        type="text"
        className="w-full p-1 outline-none ring-1 mb-1"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Filter tabs by title or url"
      />

      <div
        style={{
          minWidth: 250,
          width: 250,
          height: 400,
          maxHeight: 400,
          overflow: "auto"
        }}
        className="p-1 flex flex-col gap-1 flex-1">
        {/* No tabs found */}
        {tabs.length === 0 && (
          <div className="text-center text-gray-500">No tabs found</div>
        )}

        {tabs.map((tab) => {
          return (
            <label key={tab.id} onClick={() => handleCheck(tab.id)}>
              <div className="w-full flex py-1 hover:bg-zinc-100 px-1">
                <input
                  type="checkbox"
                  className="mr-2"
                  checked={checkState[tab.id]}
                  onChange={() => handleCheck(tab.id)}
                />

                <img src={tab.favIconUrl} className="w-4 h-4 mr-2" />
                <span
                  className="text-sm whitespace-nowrap text-ellipsis overflow-hidden select-none"
                  title={tab.title}>
                  {tab.title}
                </span>
              </div>
            </label>
          )
        })}
      </div>

      {/* Control buttons */}
      <div className="flex justify-center">
        {syncTabIds.length === 0 && (
          <button
            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded flex-1"
            onClick={startSync}
            disabled={isSyncing}>
            {isSyncing ? "Syncing..." : "Sync"}
          </button>
        )}

        {syncTabIds.length > 0 && (
          <button
            className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded flex-1"
            onClick={stopSync}
            disabled={isMutating}>
            {isMutating ? "Breaking..." : "Break"}
          </button>
        )}
      </div>
    </div>
  )
}

export default IndexPopup
