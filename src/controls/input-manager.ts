import { KeyboardInput } from "./keyboard-input"
import { GamepadInput } from "./gamepad-input"
import { MouseInput } from "./mouse-input"
import { Store } from "../store"

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

  constructor(store: Store) {
    this.keyboardInput = new KeyboardInput()
    this.gamepadInput = new GamepadInput()
    this.mouseInput = new MouseInput()

    store.registerUpdate(() => {
      this.mouseInput.updateInputState()
    })
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
