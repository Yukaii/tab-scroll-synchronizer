import { ProtocolWithReturn } from "webext-bridge"

declare module "webext-bridge" {
  export interface ProtocolMap {
    startSync: {
      tabIds: number[]
    }

    stopSync: {
      tabIds: number[]
    }

    startSyncForTab: void

    syncScrollPosition: {
      scrollYPercent: number
    }

    syncScrollPositionForTab: {
      scrollYPercent: number
    }

    getState: ProtocolWithReturn<
      void,
      {
        syncTabIds: number[]
      }
    >
  }
}
