import Stats from "stats.js"
import { createPlayer } from "./player"
import { Environment } from "./environment"
import { createGlobalStore } from "./store"
import { createUI } from "./ui"
import { PostProcess } from "./postprocess"
import { HandInput } from "./controls/hand-input"
import { loadWorld } from "./world"
const store = createGlobalStore()
store.renderer.setAnimationLoop(animate)
createUI(store)
let stats = new Stats()
document.body.appendChild(stats.dom)

await loadWorld(store)
await Environment(store)
createPlayer(store)
// PostProcess(store)
new HandInput()

function animate() {
  const delta = Math.min(0.1, store.clock.getDelta())
  store.updateFunctions.forEach((cb) => {
    cb(delta)
  })
  stats.update()
  if (store.composer) {
    store.composer.render()
  } else {
    store.renderer.render(store.scene, store.camera)
  }
}

window.addEventListener(
  "resize",
  function () {
    store.camera.aspect = window.innerWidth / window.innerHeight
    store.camera.updateProjectionMatrix()

    store.renderer.setSize(window.innerWidth, window.innerHeight)
    store.height = window.innerHeight
    store.width = window.innerWidth
  },
  false
)
