import { useCallback, useMemo, useState } from "react"
import useSWR from "swr"
import browser from "webextension-polyfill"

import "./style.css"

function IndexPopup() {
  const { data: rawTabs = [] } = useSWR("tabs", async () => {
    return browser.tabs.query({ pinned: false })
  })
  const [checkState, setCheckState] = useState<Record<number, boolean>>({})
  const [search, setSearch] = useState("")

  const handleCheck = useCallback((id: number) => {
    setCheckState((prev) => ({ ...prev, [id]: !prev[id] }))
  }, [])

  const tabs = useMemo(() => {
    if (!search) return rawTabs

    return rawTabs.filter((tab) => {
      return (
        tab.title?.toLowerCase().includes(search.toLowerCase()) ||
        tab.url?.toLowerCase().includes(search.toLowerCase()) ||
        // always show checked tabs
        checkState[tab.id]
      )
    })
  }, [rawTabs, search])

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
              <div className="w-full flex py-1 hover:bg-slate-300 px-1">
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

      <button className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">
        Sync
      </button>
    </div>
  )
}

export default IndexPopup
