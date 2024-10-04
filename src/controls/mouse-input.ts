import { InputState } from "./input-manager"
import { element } from "three"

export class MouseInput {
  private inputState: InputState
  private isLocked: boolean = false
  private containerEl: HTMLDivElement

  constructor() {
    this.containerEl = document.querySelector(
      "#canvas-container"
    ) as HTMLDivElement
    this.inputState = {
      forward: 0,
      right: 0,
      rotateHorizontal: 0,
      rotateVertical: 0,
      jump: false,
      cast: false,
    }

    this.setupEventListeners()
    this.containerEl.addEventListener("click", this.requestLock.bind(this))
    this.containerEl.addEventListener("pointerdown", () => {
      this.inputState.cast = true
    })
    this.containerEl.addEventListener("pointerup", () => {
      this.inputState.cast = false
    })
  }

  private setupEventListeners() {
    document.addEventListener(
      "pointerlockchange",
      this.handleLockChange.bind(this)
    )
    document.addEventListener("mousemove", this.handleMouseMove.bind(this))
  }

  private handleLockChange() {
    console.log("pointerLockChange")
    this.isLocked = document.pointerLockElement === this.containerEl
  }

  private handleMouseMove(e: MouseEvent) {
    if (this.isLocked) {
      this.inputState.rotateHorizontal = e.movementX
      this.inputState.rotateVertical = -e.movementY
    }
  }

  updateInputState() {
    this.inputState.rotateHorizontal *= 0.1
    this.inputState.rotateVertical *= 0.1
  }

  getInputState(): InputState {
    return this.inputState
  }

  requestLock() {
    if (!document.pointerLockElement) {
      this.containerEl.requestPointerLock().catch((error) => {
        console.warn("Pointer lock request failed:", error)
      })
    }
  }

  exitLock() {
    this.containerEl.exitPointerLock()
  }
}
