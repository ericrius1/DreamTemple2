import { InputState } from "./input-manager"

export class KeyboardInput {
  private inputState: InputState

  constructor() {
    this.inputState = {
      forward: 0,
      right: 0,
      thrust: 0,
      jump: false,
    }

    this.setupEventListeners()
  }

  private setupEventListeners() {
    window.addEventListener("keydown", this.handleKeyDown.bind(this))
    window.addEventListener("keyup", this.handleKeyUp.bind(this))
  }

  private handleKeyDown(e: KeyboardEvent) {
    this.updateInputState(e.code, true)
  }

  private handleKeyUp(e: KeyboardEvent) {
    this.updateInputState(e.code, false)
  }

  private updateInputState(code: string, isPressed: boolean) {
    switch (code) {
      case "KeyW":
        this.inputState.forward = isPressed ? -1 : 0
        break
      case "KeyS":
        this.inputState.forward = isPressed ? 1 : 0
        break
      case "KeyA":
        this.inputState.right = isPressed ? -1 : 0
        break
      case "KeyD":
        this.inputState.right = isPressed ? 1 : 0
        break
      case "Space":
        this.inputState.jump = isPressed
        break
      case "KeyF":
        this.inputState.cast = isPressed
        break
      case "ShiftLeft":
        this.inputState.boost = isPressed
        break
    }
  }

  getInputState(): InputState {
    return this.inputState
  }
}
