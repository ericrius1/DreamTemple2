import GUI from "three/addons/libs/lil-gui.module.min.js"
import * as THREE from "three"
import { OrbitControls } from "./controls/orbit-controls"
import { InputManager } from "./controls/input-manager"
import { Launcher } from "./launcher"
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js"
import { DRACOLoader } from "three/addons/loaders/DRACOLoader.js"
import { EffectComposer } from "postprocessing"

type UpdateFunction = (delta: number) => void

export interface Store {
  scene: THREE.Scene
  camera: THREE.PerspectiveCamera
  renderer: THREE.WebGLRenderer
  gui: GUI
  controls: OrbitControls | null
  registerUpdate: (cb: UpdateFunction) => void
  updateFunctions: UpdateFunction[]
  playerPosition: THREE.Vector3
  collisionWorld: THREE.Mesh | null
  inputManager: InputManager | null
  gltfLoader: THREE.GLTFLoader
  textureLoader: THREE.TextureLoader
  clock: THREE.Clock
  launcher: Launcher | null
  gravity: number
  playerVelocity: THREE.Vector3
  composer: EffectComposer | null
}

export function createGlobalStore(): Store {
  let store: Store = {
    scene: new THREE.Scene(),
    camera: new THREE.PerspectiveCamera(
      50,
      window.innerWidth / window.innerHeight,
      0.1,
      10000
    ),
    renderer: new THREE.WebGLRenderer({ antialias: true }),
    gui: new GUI(),
    controls: null,
    registerUpdate: (cb) => {
      store.updateFunctions.push(cb)
    },
    updateFunctions: [],
    playerPosition: new THREE.Vector3(0, 0, 0),
    playerVelocity: new THREE.Vector3(0, 0, 0),
    collisionWorld: null,
    inputManager: null,
    gltfLoader: new GLTFLoader(),
    textureLoader: new THREE.TextureLoader(),
    clock: new THREE.Clock(),
    launcher: null,
    gravity: -9.8,
    postProcessing: null,
  }

  // Add Draco loader to GLTFLoader
  const dracoLoader = new DRACOLoader()
  dracoLoader.setDecoderPath("/draco/")
  store.gltfLoader.setDRACOLoader(dracoLoader)

  store.inputManager = new InputManager(store)
  store.controls = new OrbitControls(
    store.camera,
    store.inputManager,
    store.renderer.domElement
  )
  store.controls.enableDamping = true
  store.renderer.setSize(window.innerWidth, window.innerHeight)
  // store.renderer.setPixelRatio(1)
  // store.renderer.toneMapping = THREE.ReinhardToneMapping
  store.renderer.toneMappingExposure = 10
  store.renderer.shadowMap.enabled = true
  store.renderer.shadowMap.type = THREE.PCFSoftShadowMap

  store.gui
    .add({ toneMapping: THREE.ACESFilmicToneMapping }, "toneMapping", {
      Linear: THREE.LinearToneMapping,
      "ACES Filmic": THREE.ACESFilmicToneMapping,
      reinhard: THREE.ReinhardToneMapping,
    })
    .onChange((v) => {
      console.log(v)
      store.renderer.toneMapping = Number(v)
      store.renderer.toneMappingExposure = 1.5
    })
  document
    .querySelector("#canvas-container")
    ?.appendChild(store.renderer.domElement)

  return store
}
