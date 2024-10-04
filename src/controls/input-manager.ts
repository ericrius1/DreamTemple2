import { KeyboardInput } from "./keyboard-input"
import { GamepadInput } from "./gamepad-input"
import { MouseInput } from "./mouse-input"
import { Store } from "../store"
import * as THREE from "three"

const vec = new THREE.Vector2()

export interface InputState {
  forward: number
  right: number
  rotateHorizontal: number
  rotateVertical: number
  thrust: number
  jump: boolean
  cast: boolean
  boost: boolean
}

export class InputManager {
  private keyboardInput: KeyboardInput
  private gamepadInput: GamepadInput
  private mouseInput: MouseInput
  private cursor: HTMLElement
  private store: Store
  constructor(store: Store) {
    this.keyboardInput = new KeyboardInput()
    this.gamepadInput = new GamepadInput()
    this.mouseInput = new MouseInput()
    this.store = store
    this.cursor = document.querySelector(".cursor")

    store.registerUpdate(() => {
      this.mouseInput.updateInputState()
      this.checkIntersections()
    })
  }

  checkIntersections() {
    const raycaster = this.store.raycaster
    raycaster.setFromCamera(vec, this.store.camera)
    const intersects = raycaster.intersectObjects(this.store.interactables)
    if (intersects.length > 0) {
      this.cursor.classList.add("hovered")
    } else {
      this.cursor.classList.remove("hovered")
    }
  }

  getInputState(): InputState {
    const keyboardState = this.keyboardInput.getInputState()
    const gamepadState = this.gamepadInput.getInputState()
    const mouseState = this.mouseInput.getInputState()
    return {
      forward: keyboardState.forward || gamepadState.forward,
      right: keyboardState.right || gamepadState.right,
      thrust: keyboardState.thrust || gamepadState.thrust,
      rotateHorizontal:
        mouseState.rotateHorizontal || gamepadState.rotateHorizontal,
      rotateVertical: mouseState.rotateVertical || gamepadState.rotateVertical,
      jump: keyboardState.jump || gamepadState.jump,
      cast: keyboardState.cast || gamepadState.cast,
      boost: keyboardState.boost || gamepadState.boost,
    }
  }
}
