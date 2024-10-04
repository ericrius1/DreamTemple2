import * as THREE from "three"
import { Store } from "./store"

export async function createPlayer(store: Store) {
  const {
    camera,
    scene,
    gui,
    controls,
    registerUpdate,
    playerPosition,
    inputManager,
    gravity,
    playerVelocity,
  } = store

  const params = {
    firstPerson: true,
    gravity,
    playerSpeed: 3.33,
    boostSpeed: 10,
    physicsSteps: 5,
    maxThrust: 20,
    jumpStrength: 7,
    pause: false,

    maxPitch: Math.PI / 3,
    step: () => {
      const steps = params.physicsSteps
      for (let i = 0; i < steps; i++) {
        updatePlayer(0.016 / steps)
      }
    },
  }

  let player: PlayerMesh
  let engines: THREE.Mesh
  let playerIsOnGround = false
  const upVector = new THREE.Vector3(0, 1, 0)
  const cameraWorldDirection = new THREE.Vector3()
  const forwardVector = new THREE.Vector3(0, 0, 1)
  const tempVector = new THREE.Vector3()
  const tempVector2 = new THREE.Vector3()
  const tempBox = new THREE.Box3()
  const tempMat = new THREE.Matrix4()
  const tempSegment = new THREE.Line3()

  interface PlayerMesh extends THREE.Mesh {
    capsuleInfo?: {
      radius: number
      segment: THREE.Line3
    }
  }

  async function init() {
    player = new THREE.Mesh(
      new THREE.BoxGeometry(1.0, 2, 0.2),
      new THREE.MeshStandardMaterial()
    ) as PlayerMesh
    player.geometry.translate(0, -0.5, 0)
    player.capsuleInfo = {
      radius: 0.5,
      segment: new THREE.Line3(
        new THREE.Vector3(),
        new THREE.Vector3(0, -1.0, 0.0)
      ),
    }
    player.castShadow = player.receiveShadow = true
    player.material.shadowSide = 2

    setupGUI()
    scene.add(player)
    reset()
  }

  function reset() {
    playerVelocity.set(0, 0, 0)
    player.position.set(0, 2, 4)
    player.rotation.set(0, 0, 0)
    updateCameraPosition()
  }

  function updateCameraPosition() {
    camera.position.set(0, 0, 3)
    camera.position.sub(controls.target)
    controls.target.copy(player.position)
    camera.position.add(player.position)
    controls.update()
  }

  function setupGUI() {
    const physicsFolder = gui.addFolder("Player")
    physicsFolder.add(params, "physicsSteps", 0, 30, 1)
    physicsFolder.add(params, "gravity", -70, 0, 0.01)
    physicsFolder.add(params, "playerSpeed", 1, 100)
    physicsFolder.add(params, "pause")
    physicsFolder.add(params, "step")

    physicsFolder.open()

    gui.add({ reset }, "reset")
    gui.open()
  }

  async function updatePlayer(delta: number) {
    let collider = store.collisionWorld
    if (!collider) return
    const inputState = inputManager.getInputState()

    // move the player
    const angle = controls.getAzimuthalAngle()

    tempVector.set(0, 0, -1).applyAxisAngle(upVector, angle)
    player.position.addScaledVector(
      tempVector,
      -params.playerSpeed * delta * inputState.forward
    )
    if (inputState.boost) {
      player.position.addScaledVector(
        tempVector,
        -params.boostSpeed * delta * inputState.forward
      )
    }

    tempVector.set(1, 0, 0).applyAxisAngle(upVector, angle)
    player.position.addScaledVector(
      tempVector,
      params.playerSpeed * delta * inputState.right
    )

    player.updateMatrixWorld()

    handleCollisions(collider, delta)
    if (playerIsOnGround && inputState.jump) {
      playerVelocity.y = params.jumpStrength
      playerIsOnGround = false
    }

    if (playerIsOnGround) {
      playerVelocity.y = delta * params.gravity
    } else {
      playerVelocity.y += delta * params.gravity
    }

    const scaledVelocity = playerVelocity.clone().multiplyScalar(delta)
    player.position.add(scaledVelocity)

    // adjust the camera
    camera.position.sub(controls.target)
    controls.target.copy(player.position)
    camera.position.add(player.position)

    // Update player rotation to face the camera direction
    camera.getWorldDirection(cameraWorldDirection)
    cameraWorldDirection.y = 0 // Keep the player level
    cameraWorldDirection.normalize()

    const playerRotation = new THREE.Quaternion().setFromUnitVectors(
      forwardVector,
      cameraWorldDirection
    )
    player.quaternion.slerp(playerRotation, 0.1) // Smooth rotation

    playerPosition.copy(player.position)
  }

  function handleCollisions(collider: THREE.Mesh, delta: number) {
    // adjust player position based on collisions
    const capsuleInfo = player.capsuleInfo
    tempBox.makeEmpty()
    tempMat.copy(collider.matrixWorld).invert()
    tempSegment.copy(capsuleInfo.segment)

    // get the position of the capsule in the local space of the collider
    tempSegment.start.applyMatrix4(player.matrixWorld).applyMatrix4(tempMat)
    tempSegment.end.applyMatrix4(player.matrixWorld).applyMatrix4(tempMat)

    // get the axis aligned bounding box of the capsule
    tempBox.expandByPoint(tempSegment.start)
    tempBox.expandByPoint(tempSegment.end)

    tempBox.min.addScalar(-capsuleInfo.radius)
    tempBox.max.addScalar(capsuleInfo.radius)

    collider.geometry.boundsTree.shapecast({
      intersectsBounds: (box) => box.intersectsBox(tempBox),

      intersectsTriangle: (tri) => {
        // check if the triangle is intersecting the capsule and adjust the
        // capsule position if it is.
        const triPoint = tempVector
        const capsulePoint = tempVector2

        const distance = tri.closestPointToSegment(
          tempSegment,
          triPoint,
          capsulePoint
        )
        if (distance < capsuleInfo.radius) {
          const depth = capsuleInfo.radius - distance
          const direction = capsulePoint.sub(triPoint).normalize()

          tempSegment.start.addScaledVector(direction, depth)
          tempSegment.end.addScaledVector(direction, depth)
        }
      },
    })

    // get the adjusted position of the capsule collider in world space after checking
    // triangle collisions and moving it. capsuleInfo.segment.start is assumed to be
    // the origin of the player model.
    const newPosition = tempVector
    newPosition.copy(tempSegment.start).applyMatrix4(collider.matrixWorld)

    // check how much the collider was moved
    const deltaVector = tempVector2
    deltaVector.subVectors(newPosition, player.position)

    // if the player was primarily adjusted vertically we assume it's on something we should consider ground
    playerIsOnGround = deltaVector.y > Math.abs(delta * playerVelocity.y * 0.25)

    const offset = Math.max(0.0, deltaVector.length() - 1e-5)
    deltaVector.normalize().multiplyScalar(offset)

    // adjust the player model
    // console.log(deltaVector)
    player.position.add(deltaVector)

    if (!playerIsOnGround) {
      deltaVector.normalize()
      playerVelocity.addScaledVector(
        deltaVector,
        -deltaVector.dot(playerVelocity)
      )
    } else {
      playerVelocity.set(0, 0, 0)
    }
  }

  function update(delta: number) {
    const physicsSteps = params.physicsSteps
    if (params.pause) return

    if (params.firstPerson) {
      controls.minPolarAngle = 0.7
      controls.maxPolarAngle = Math.PI * 0.7
      controls.minDistance = 1e-4
      controls.maxDistance = 1e-4
    } else {
      controls.maxPolarAngle = Math.PI / 2
      controls.minDistance = 1
      controls.maxDistance = 2000
    }

    for (let i = 0; i < physicsSteps; i++) {
      updatePlayer(delta / physicsSteps)
    }

    // savePlayerPosition()

    controls.update()
  }

  await init()
  registerUpdate(update)
}
