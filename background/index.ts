import { isInternalEndpoint, onMessage, sendMessage } from "webext-bridge"

import { store } from "./store"

function startSyncForTabs(tabIds: number[]) {
  tabIds.forEach((tabId) => {
    sendMessage("startSyncForTab", undefined, {
      tabId,
      context: "content-script"
    })
  })
}

function stopSyncForTabs(tabIds: number[]) {
  tabIds.forEach((tabId) => {
    sendMessage("stopSyncForTab", undefined, {
      tabId,
      context: "content-script"
    })
  })
}

onMessage("startSync", (message) => {
  const state = store.getState()
  const { tabIds = [] } = message.data

  // stop sync for all tabs
  if (state.syncTabIds.length) {
    stopSyncForTabs(state.syncTabIds)
  }

  state.setSyncTabIds(tabIds)
  startSyncForTabs(tabIds)
})

onMessage("stopSync", (message) => {
  const state = store.getState()

  const { tabIds = [] } = message.data
  state.setSyncTabIds([])
  stopSyncForTabs(tabIds)
})

onMessage("syncScrollPosition", (message) => {
  const state = store.getState()
  const senderTabId = message.sender.tabId

  const { scrollYPercent } = message.data

  console.log("syncScrollPosition", scrollYPercent)
  console.log("senderTabId", senderTabId)

  const otherTabs = state.syncTabIds.filter((tabId) => tabId !== senderTabId)

  otherTabs.forEach((tabId) => {
    sendMessage(
      "syncScrollPositionForTab",
      { scrollYPercent },
      {
        tabId,
        context: "content-script"
      }
    )
  })
})
