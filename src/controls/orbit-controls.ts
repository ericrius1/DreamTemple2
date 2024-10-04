import {
  EventDispatcher,
  Matrix4,
  MOUSE,
  OrthographicCamera,
  PerspectiveCamera,
  Quaternion,
  Spherical,
  TOUCH,
  Vector2,
  Vector3,
  Ray,
  Plane,
} from "three"
import { InputManager } from "./input-manager"

const joystickSensitivity = 0.01

const moduloWrapAround = (offset: number, capacity: number) =>
  ((offset % capacity) + capacity) % capacity

class OrbitControls extends EventDispatcher {
  object: PerspectiveCamera | OrthographicCamera
  domElement: HTMLElement | undefined
  // Set to false to disable this control
  enabled = true
  // "target" sets the location of focus, where the object orbits around
  target = new Vector3()
  // How far you can dolly in and out ( PerspectiveCamera only )
  minDistance = 0
  maxDistance = Infinity

  // How far you can orbit vertically, upper and lower limits.
  // Range is 0 to Math.PI radians.
  minPolarAngle = 0 // radians
  maxPolarAngle = Math.PI // radians
  // How far you can orbit horizontally, upper and lower limits.
  // If set, the interval [ min, max ] must be a sub-interval of [ - 2 PI, 2 PI ], with ( max - min < 2 PI )
  minAzimuthAngle = -Infinity // radians
  maxAzimuthAngle = Infinity // radians
  // Set to true to enable damping (inertia)
  // If damping is enabled, you must call controls.update() in your animation loop
  enableDamping = false
  dampingFactor = 0.05
  // This option actually enables dollying in and out; left as "zoom" for backwards compatibility.
  // Set to false to disable zooming
  enableZoom = true
  zoomSpeed = 1.0
  // Set to false to disable rotating
  enableRotate = true
  rotateSpeed = 1.0

  // The four arrow keys
  keys = {
    LEFT: "ArrowLeft",
    UP: "ArrowUp",
    RIGHT: "ArrowRight",
    BOTTOM: "ArrowDown",
  }
  // Mouse buttons
  mouseButtons: Partial<{
    LEFT: MOUSE
    MIDDLE: MOUSE
    RIGHT: MOUSE
  }> = {
    LEFT: MOUSE.ROTATE,
    MIDDLE: MOUSE.DOLLY,
    RIGHT: MOUSE.PAN,
  }

  target0: Vector3
  position0: Vector3
  zoom0: number
  // the target DOM element for key events
  _domElementKeyEvents: any = null

  getPolarAngle: () => number
  getAzimuthalAngle: () => number
  setPolarAngle: (x: number) => void
  setAzimuthalAngle: (x: number) => void
  getDistance: () => number

  saveState: () => void
  reset: () => void
  update: () => void
  connect: (domElement: HTMLElement) => void
  dispose: () => void

  constructor(
    object: PerspectiveCamera | OrthographicCamera,
    inputManager: InputManager,
    domElement?: HTMLElement
  ) {
    super()

    this.object = object
    this.domElement = domElement

    // for reset
    this.target0 = this.target.clone()
    this.position0 = this.object.position.clone()
    this.zoom0 = this.object.zoom

    //
    // public methods
    //

    this.getPolarAngle = (): number => spherical.phi

    this.getAzimuthalAngle = (): number => spherical.theta

    this.setPolarAngle = (value: number): void => {
      // use modulo wrapping to safeguard value
      let phi = moduloWrapAround(value, 2 * Math.PI)
      let currentPhi = spherical.phi

      // convert to the equivalent shortest angle
      if (currentPhi < 0) currentPhi += 2 * Math.PI
      if (phi < 0) phi += 2 * Math.PI
      let phiDist = Math.abs(phi - currentPhi)
      if (2 * Math.PI - phiDist < phiDist) {
        if (phi < currentPhi) {
          phi += 2 * Math.PI
        } else {
          currentPhi += 2 * Math.PI
        }
      }
      sphericalDelta.phi = phi - currentPhi
      scope.update()
    }

    this.setAzimuthalAngle = (value: number): void => {
      // use modulo wrapping to safeguard value
      let theta = moduloWrapAround(value, 2 * Math.PI)
      let currentTheta = spherical.theta

      // convert to the equivalent shortest angle
      if (currentTheta < 0) currentTheta += 2 * Math.PI
      if (theta < 0) theta += 2 * Math.PI
      let thetaDist = Math.abs(theta - currentTheta)
      if (2 * Math.PI - thetaDist < thetaDist) {
        if (theta < currentTheta) {
          theta += 2 * Math.PI
        } else {
          currentTheta += 2 * Math.PI
        }
      }
      sphericalDelta.theta = theta - currentTheta
      scope.update()
    }

    this.getDistance = (): number =>
      scope.object.position.distanceTo(scope.target)

    this.saveState = (): void => {
      scope.target0.copy(scope.target)
      scope.position0.copy(scope.object.position)
      scope.zoom0 = scope.object.zoom
    }

    this.reset = (): void => {
      scope.target.copy(scope.target0)
      scope.object.position.copy(scope.position0)
      scope.object.zoom = scope.zoom0
      scope.object.updateProjectionMatrix()

      // @ts-ignore
      scope.dispatchEvent(changeEvent)

      scope.update()

      state = STATE.NONE
    }

    // this method is exposed, but perhaps it would be better if we can make it private...
    this.update = ((): (() => void) => {
      const offset = new Vector3()
      const up = new Vector3(0, 1, 0)

      // so camera.up is the orbit axis
      const quat = new Quaternion().setFromUnitVectors(object.up, up)
      const quatInverse = quat.clone().invert()

      const lastPosition = new Vector3()
      const lastQuaternion = new Quaternion()

      const twoPI = 2 * Math.PI

      return function update(): boolean {
        const position = scope.object.position

        // update new up direction
        quat.setFromUnitVectors(object.up, up)
        quatInverse.copy(quat).invert()

        offset.copy(position).sub(scope.target)

        // rotate offset to "y-axis-is-up" space
        offset.applyQuaternion(quat)

        // angle from z-axis around y-axis
        spherical.setFromVector3(offset)

        const inputState = inputManager.getInputState()
        rotateLeft(inputState.rotateHorizontal * joystickSensitivity)
        rotateUp(inputState.rotateVertical * -joystickSensitivity)

        if (scope.enableDamping) {
          spherical.theta += sphericalDelta.theta * scope.dampingFactor
          spherical.phi += sphericalDelta.phi * scope.dampingFactor
        } else {
          spherical.theta += sphericalDelta.theta
          spherical.phi += sphericalDelta.phi
        }

        // restrict theta to be between desired limits

        let min = scope.minAzimuthAngle
        let max = scope.maxAzimuthAngle

        if (isFinite(min) && isFinite(max)) {
          if (min < -Math.PI) min += twoPI
          else if (min > Math.PI) min -= twoPI

          if (max < -Math.PI) max += twoPI
          else if (max > Math.PI) max -= twoPI

          if (min <= max) {
            spherical.theta = Math.max(min, Math.min(max, spherical.theta))
          } else {
            spherical.theta =
              spherical.theta > (min + max) / 2
                ? Math.max(min, spherical.theta)
                : Math.min(max, spherical.theta)
          }
        }

        // restrict phi to be between desired limits
        spherical.phi = Math.max(
          scope.minPolarAngle,
          Math.min(scope.maxPolarAngle, spherical.phi)
        )
        spherical.makeSafe()

        spherical.radius = clampDistance(spherical.radius * scale)

        offset.setFromSpherical(spherical)

        // rotate offset back to "camera-up-vector-is-up" space
        offset.applyQuaternion(quatInverse)

        position.copy(scope.target).add(offset)

        scope.object.lookAt(scope.target)

        if (scope.enableDamping === true) {
          sphericalDelta.theta *= 1 - scope.dampingFactor
          sphericalDelta.phi *= 1 - scope.dampingFactor
        } else {
          sphericalDelta.set(0, 0, 0)
        }

        // adjust camera position

        scale = 1

        // update condition is:
        // min(camera displacement, camera rotation in radians)^2 > EPS
        // using small-angle approximation cos(x/2) = 1 - x^2 / 8

        return false
      }
    })()

    // https://github.com/mrdoob/three.js/issues/20575
    this.connect = (domElement: HTMLElement): void => {
      scope.domElement = domElement
      // disables touch scroll
      // touch-action needs to be defined for pointer events to work on mobile
      // https://stackoverflow.com/a/48254578
      scope.domElement.style.touchAction = "none"
      scope.domElement.addEventListener("contextmenu", onContextMenu)
      scope.domElement.addEventListener("wheel", onMouseWheel)
      // scope.domElement?.ownerDocument.addEventListener(
      //   "pointermove",
      //   onPointerMove
      // )
    }

    this.dispose = (): void => {
      // Enabling touch scroll
      if (scope.domElement) {
        scope.domElement.style.touchAction = "auto"
      }
      scope.domElement?.removeEventListener("contextmenu", onContextMenu)
      scope.domElement?.removeEventListener("wheel", onMouseWheel)
      scope.domElement?.removeEventListener("pointermove", onPointerMove)
      scope.domElement?.ownerDocument.removeEventListener(
        "pointermove",
        onPointerMove
      )

      //scope.dispatchEvent( { type: 'dispose' } ); // should this be added here?
    }

    //
    // internals
    //

    const scope = this

    const changeEvent = { type: "change" }
    const startEvent = { type: "start" }
    const endEvent = { type: "end" }

    const STATE = {
      NONE: -1,
      ROTATE: 0,
      DOLLY: 1,
      TOUCH_ROTATE: 3,
      TOUCH_DOLLY_ROTATE: 6,
    }

    let state = STATE.ROTATE

    const EPS = 0.000001

    // current position in spherical coordinates
    const spherical = new Spherical()
    const sphericalDelta = new Spherical()

    let scale = 1

    const rotateStart = new Vector2()
    const rotateEnd = new Vector2()
    const rotateDelta = new Vector2()

    const dollyStart = new Vector2()
    const dollyEnd = new Vector2()
    const dollyDelta = new Vector2()

    const dollyDirection = new Vector3()
    const mouse = new Vector2()
    let performCursorZoom = false

    const pointers: PointerEvent[] = []
    const pointerPositions: { [key: string]: Vector2 } = {}

    function getZoomScale(): number {
      return Math.pow(0.95, scope.zoomSpeed)
    }

    function rotateLeft(angle: number): void {
      sphericalDelta.theta -= angle
    }

    function rotateUp(angle: number): void {
      sphericalDelta.phi -= angle
    }

    function dollyOut(dollyScale: number) {
      if (
        (scope.object instanceof PerspectiveCamera &&
          scope.object.isPerspectiveCamera) ||
        (scope.object instanceof OrthographicCamera &&
          scope.object.isOrthographicCamera)
      ) {
        scale /= dollyScale
      } else {
        console.warn(
          "WARNING: OrbitControls.js encountered an unknown camera type - dolly/zoom disabled."
        )
        scope.enableZoom = false
      }
    }

    function dollyIn(dollyScale: number) {
      if (
        (scope.object instanceof PerspectiveCamera &&
          scope.object.isPerspectiveCamera) ||
        (scope.object instanceof OrthographicCamera &&
          scope.object.isOrthographicCamera)
      ) {
        scale *= dollyScale
      } else {
        console.warn(
          "WARNING: OrbitControls.js encountered an unknown camera type - dolly/zoom disabled."
        )
        scope.enableZoom = false
      }
    }

    function clampDistance(dist: number): number {
      return Math.max(scope.minDistance, Math.min(scope.maxDistance, dist))
    }

    function handleMouseMoveRotate(event: MouseEvent) {
      rotateEnd.set(event.clientX, event.clientY)
      rotateDelta
        .subVectors(rotateEnd, rotateStart)
        .multiplyScalar(scope.rotateSpeed)

      const element = scope.domElement

      if (element) {
        rotateLeft((2 * Math.PI * rotateDelta.x) / element.clientHeight) // yes, height
        rotateUp((2 * Math.PI * rotateDelta.y) / element.clientHeight)
      }
      rotateStart.copy(rotateEnd)
      scope.update()
    }

    function handleMouseMoveDolly(event: MouseEvent) {
      dollyEnd.set(event.clientX, event.clientY)
      dollyDelta.subVectors(dollyEnd, dollyStart)

      if (dollyDelta.y > 0) {
        dollyOut(getZoomScale())
      } else if (dollyDelta.y < 0) {
        dollyIn(getZoomScale())
      }

      dollyStart.copy(dollyEnd)
      scope.update()
    }

    function handleMouseWheel(event: WheelEvent) {
      if (event.deltaY < 0) {
        dollyIn(getZoomScale())
      } else if (event.deltaY > 0) {
        dollyOut(getZoomScale())
      }

      scope.update()
    }

    function onPointerMove(event: PointerEvent) {
      if (scope.enabled === false) return

      onMouseMove(event)
    }

    function onMouseMove(event: MouseEvent) {
      if (scope.enabled === false) return
      switch (state) {
        case STATE.ROTATE:
          if (scope.enableRotate === false) return
          handleMouseMoveRotate(event)
          break

        case STATE.DOLLY:
          if (scope.enableZoom === false) return
          handleMouseMoveDolly(event)
          break
      }
    }

    function onMouseWheel(event: WheelEvent) {
      if (
        scope.enabled === false ||
        scope.enableZoom === false ||
        (state !== STATE.NONE && state !== STATE.ROTATE)
      ) {
        return
      }

      event.preventDefault()

      // @ts-ignore
      scope.dispatchEvent(startEvent)

      handleMouseWheel(event)

      // @ts-ignore
      scope.dispatchEvent(endEvent)
    }

    function onContextMenu(event: Event) {
      if (scope.enabled === false) return
      event.preventDefault()
    }

    // connect events
    if (domElement !== undefined) this.connect(domElement)
    // force an update at start
    this.update()
  }
}

export { OrbitControls }
