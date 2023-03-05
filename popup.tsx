import cx from "classnames"
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
  const atLeastTwoSelection =
    Object.values(checkState).filter((v) => v).length >= 2
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
      if (!atLeastTwoSelection) return
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
    if (isSynced) {
      return
    }

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

  const isSynced = syncTabIds.length > 0
  // Get sync state from background

  return (
    <div className="flex flex-col">
      <input
        type="text"
        className="w-full px-2 py-3 mb-1 font-mono text-sm outline-none ring-1"
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
        className="flex flex-col flex-1 gap-1 p-1">
        {/* No tabs found */}
        {tabs.length === 0 && (
          <div className="py-3 font-mono text-sm text-center text-gray-500 select-none">
            No tabs found
          </div>
        )}

        {tabs.map((tab) => {
          const itemChecked = checkState[tab.id]

          return (
            <label key={tab.id} onClick={() => handleCheck(tab.id)}>
              <div
                className={cx(
                  "flex w-full px-1 py-1 hover:bg-zinc-100 items-center",
                  {
                    "bg-zinc-100": itemChecked && isSynced
                  }
                )}>
                <input
                  type="checkbox"
                  className="mr-2"
                  checked={itemChecked}
                  onChange={() => handleCheck(tab.id)}
                  disabled={isSynced}
                />

                <img src={tab.favIconUrl} className="w-4 h-4 mr-2" />

                {
                  // Show red dotted synced icon
                  itemChecked && isSynced && (
                    <span
                      className="block mr-2 rounded-full bg-rose-600 animate-pulse"
                      style={{
                        width: 8,
                        height: 8,
                        minWidth: 8,
                        minHeight: 8
                      }}
                    />
                  )
                }

                <span
                  className="overflow-hidden text-sm select-none whitespace-nowrap text-ellipsis"
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
            className="flex-1 px-4 py-2 font-bold text-white bg-blue-500 rounded hover:bg-blue-700 disabled:opacity-50"
            onClick={startSync}
            disabled={isSyncing || !atLeastTwoSelection}>
            {isSyncing ? "Syncing..." : "Sync"}
          </button>
        )}

        {isSynced && (
          <button
            className="flex-1 px-4 py-2 font-bold text-white bg-red-500 rounded hover:bg-red-700"
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
