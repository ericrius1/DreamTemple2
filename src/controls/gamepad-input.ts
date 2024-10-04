import { InputState } from "./InputManager"

export class GamepadInput {
  private inputState: InputState

  constructor() {
    this.inputState = {
      forward: 0,
      backward: 0,
      left: false,
      right: false,
      thrust: 0,
      rotateHorizontal: 0,
      rotateVertical: 0,
      jump: false,
      cast: false,
    }

    this.setupGamepadPolling()
  }

  private setupGamepadPolling() {
    const pollGamepad = () => {
      const gamepad = navigator.getGamepads()[0]
      if (gamepad) {
        this.updateInputState(gamepad)
      }
      requestAnimationFrame(pollGamepad)
    }

    pollGamepad()
  }

  private updateInputState(gamepad: Gamepad) {
    // Log pressed buttons
    gamepad.buttons.forEach((button, index) => {
      if (button.pressed) {
        // console.log(`Button ${index} pressed`)
      }
    })
    // Log joystick values
    const [leftStickX, leftStickY, rightStickX, rightStickY] = gamepad.axes
    console
      .log
      //   `Left stick X: ${leftStickX.toFixed(2)}, Y: ${leftStickY.toFixed(2)}`
      ()
    console
      .log
      //   `Right stick X: ${rightStickX.toFixed(2)}, Y: ${rightStickY.toFixed(2)}`
      ()

    this.inputState.forward = Math.abs(leftStickY) > 0.2 ? leftStickY : 0
    this.inputState.right = Math.abs(leftStickX) > 0.5 ? leftStickX : 0

    this.inputState.cast = gamepad.buttons[2].pressed
    this.inputState.jump = gamepad.buttons[0].pressed
    this.inputState.thrust = gamepad.buttons[6].value
    this.inputState.rotateHorizontal = rightStickX
    this.inputState.rotateVertical = rightStickY

    this.inputState.rotateHorizontal =
      Math.abs(rightStickX) > 0.2 ? rightStickX : 0
    this.inputState.rotateVertical =
      Math.abs(rightStickY) > 0.2 ? rightStickY : 0
  }

  getInputState(): InputState {
    return this.inputState
  }
}
