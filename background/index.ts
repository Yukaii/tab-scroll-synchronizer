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
  const tabIds = state.syncTabIds

  stopSyncForTabs(tabIds)

  state.setSyncTabIds([])
})

onMessage("syncScrollPosition", (message) => {
  const state = store.getState()
  const senderTabId = message.sender.tabId

  const { scrollYPercent } = message.data

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

onMessage("getState", () => {
  const state = store.getState()

  return {
    syncTabIds: state.syncTabIds
  }
})
