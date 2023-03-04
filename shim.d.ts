import { ProtocolWithReturn } from "webext-bridge"

declare module "webext-bridge" {
  export interface ProtocolMap {
    foo: { title: string }
    // to specify the return type of the message,
    // use the `ProtocolWithReturn` type wrapper
    bar: ProtocolWithReturn<CustomDataType, CustomReturnType>

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
  }
}
