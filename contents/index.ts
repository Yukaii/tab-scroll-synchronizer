import debounce from "lodash/debounce"
import throttle from "lodash/throttle"
import { onMessage, sendMessage } from "webext-bridge"

export {}

let scrolling = false

const _onScrollHandler = () => {
  if (scrolling) return

  sendMessage("syncScrollPosition", {
    scrollYPercent: window.scrollY / document.body.scrollHeight
  })
}

const onScrollHandler = throttle(_onScrollHandler, 50)

onMessage("startSyncForTab", () => {
  window.addEventListener("scroll", onScrollHandler)
})

onMessage("stopSyncForTab", () => {
  window.removeEventListener("scroll", onScrollHandler)
})

const afterApplyScroll = debounce(() => {
  scrolling = false
}, 200)

onMessage("syncScrollPositionForTab", (message) => {
  const { scrollYPercent } = message.data

  scrolling = true

  console.debug("scrolling to", scrollYPercent)

  window.scrollTo({
    top: scrollYPercent * document.body.scrollHeight,
    behavior: "auto"
  })

  afterApplyScroll()
})
