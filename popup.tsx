import cx from "classnames"
import { useCallback, useEffect, useMemo, useState } from "react"
import useSWR from "swr"
import useSWRMutation from "swr/mutation"
import { sendMessage } from "webext-bridge"
import browser from "webextension-polyfill"

import "./style.css"

function AboutPage({ onClose }: { onClose: () => void }): JSX.Element {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault()
        e.stopPropagation()

        onClose()
      }
    }

    window.addEventListener("keydown", handleKeyDown)

    return () => {
      window.removeEventListener("keydown", handleKeyDown)
    }
  }, [])

  return (
    <div className="absolute top-0 left-0 flex flex-col w-screen h-screen p-4 overflow-auto text-sm text-gray-700 bg-white">
      {/* Close button */}
      <span className="absolute cursor-pointer right-4 top-4" onClick={onClose}>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 16 16"
          width="16"
          height="16"
          fill="currentColor">
          <path d="M3.72 3.72a.75.75 0 0 1 1.06 0L8 6.94l3.22-3.22a.749.749 0 0 1 1.275.326.749.749 0 0 1-.215.734L9.06 8l3.22 3.22a.749.749 0 0 1-.326 1.275.749.749 0 0 1-.734-.215L8 9.06l-3.22 3.22a.751.751 0 0 1-1.042-.018.751.751 0 0 1-.018-1.042L6.94 8 3.72 4.78a.75.75 0 0 1 0-1.06Z"></path>
        </svg>
      </span>

      <h1 className="text-2xl font-bold">Tab Scroll Synchronizer</h1>

      <p className="mt-4">
        Tab Scroll Synchronizer is a browser extension that allows you to
        synchronize the scroll position of multiple tabs.
      </p>

      <p className="mt-4">
        For example, if you have multiple tabs open to the same website, one is
        translated into another language, and you want to keep the scroll
        position in sync, you can use this extension to do so.
      </p>

      <p className="mt-4">
        This extension is open source and available on{" "}
        <a
          href="https://github.com/Yukaii/tab-scroll-synchronizer"
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-500 underline">
          GitHub
        </a>
        .
      </p>

      <p className="mt-4">
        Author:{" "}
        <a
          href="https://yukai.tw"
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-500 underline">
          Yukai
        </a>
        <br />
        The idea is from{" "}
        <a
          href="https://linktr.ee/mashbean"
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-500 underline">
          Mashbean
        </a>
        <br />
        License: MIT
      </p>

      <div className="mt-4">
        <a
          href="https://github.com/Yukaii/tab-scroll-synchronizer"
          target="_blank"
          rel="noopener noreferrer">
          <button className="px-4 py-2 font-bold text-white bg-blue-500 rounded">
            Learn more
          </button>
        </a>
      </div>
    </div>
  )
}

function IndexPopup() {
  const { data: rawTabs = [] } = useSWR("tabs", async () => {
    return browser.tabs.query({ pinned: false })
  })
  const [checkState, setCheckState] = useState<Record<number, boolean>>({})
  const atLeastTwoSelection =
    Object.values(checkState).filter((v) => v).length >= 2
  const [search, setSearch] = useState("")

  const [showAbout, setShowAbout] = useState(false)

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
  const isSynced = syncTabIds.length > 0

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
      // in sync state, show checked tabs first
      if (isSynced) {
        if (checkState[a.id] && !checkState[b.id]) return -1
        if (!checkState[a.id] && checkState[b.id]) return 1
      }

      if (a.id === recentTabId) return -1
      if (b.id === recentTabId) return 1

      const aDomain = new URL(a.url).hostname
      const bDomain = new URL(b.url).hostname

      if (aDomain === recentTabDomain) return -1
      if (bDomain === recentTabDomain) return 1

      return 0
    },
    [recentTabId, recentTabDomain, isSynced, checkState]
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

  return (
    <>
      <div className="flex flex-col">
        <div className="flex items-center border-b border-gray-200">
          <input
            type="text"
            className="w-full px-2 py-3 mb-1 font-mono text-sm outline-none"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Filter tabs by title or url"
          />

          {/* About with question mark */}
          <a
            href="#"
            onClick={(e) => {
              e.preventDefault()
              setShowAbout(true)
            }}
            className="px-2 py-3 text-gray-500 hover:text-gray-400"
            title="About">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 16 16"
              width="16"
              height="16"
              fill="currentColor">
              <path d="M0 8a8 8 0 1 1 16 0A8 8 0 0 1 0 8Zm8-6.5a6.5 6.5 0 1 0 0 13 6.5 6.5 0 0 0 0-13ZM6.92 6.085h.001a.749.749 0 1 1-1.342-.67c.169-.339.436-.701.849-.977C6.845 4.16 7.369 4 8 4a2.756 2.756 0 0 1 1.637.525c.503.377.863.965.863 1.725 0 .448-.115.83-.329 1.15-.205.307-.47.513-.692.662-.109.072-.22.138-.313.195l-.006.004a6.24 6.24 0 0 0-.26.16.952.952 0 0 0-.276.245.75.75 0 0 1-1.248-.832c.184-.264.42-.489.692-.661.103-.067.207-.132.313-.195l.007-.004c.1-.061.182-.11.258-.161a.969.969 0 0 0 .277-.245C8.96 6.514 9 6.427 9 6.25a.612.612 0 0 0-.262-.525A1.27 1.27 0 0 0 8 5.5c-.369 0-.595.09-.74.187a1.01 1.01 0 0 0-.34.398ZM9 11a1 1 0 1 1-2 0 1 1 0 0 1 2 0Z"></path>
            </svg>
          </a>
        </div>

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
              {!atLeastTwoSelection
                ? "Select at least 2 tabs to sync"
                : isSyncing
                ? "Syncing..."
                : "Sync"}
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

      {/* About popup */}
      {showAbout && <AboutPage onClose={() => setShowAbout(false)} />}
    </>
  )
}

export default IndexPopup
