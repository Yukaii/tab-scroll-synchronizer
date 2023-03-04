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

const onScrollHandler = debounce(throttle(_onScrollHandler, 150), 200)

onMessage("startSyncForTab", () => {
  window.addEventListener("scroll", onScrollHandler)
})

onMessage("stopSyncForTab", () => {
  window.removeEventListener("scroll", onScrollHandler)
})

onMessage("syncScrollPositionForTab", (message) => {
  const { scrollYPercent } = message.data

  scrolling = true

  window.scrollTo({
    top: scrollYPercent * document.body.scrollHeight,
    behavior: "smooth"
  })

  window.setTimeout(() => {
    scrolling = false
  }, 200)
})
