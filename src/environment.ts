import * as THREE from "three"
import { RGBELoader } from "three/addons/loaders/RGBELoader"
import {
  color,
  positionView,
  float,
  positionWorld,
  uniform,
  triNoise3D,
  fog,
} from "three/tsl"

export const Environment = async (store) => {
  const { scene, camera, gui, renderer } = store
  const groundColor = color(0xd0dee7)

  // scene.add(new THREE.HemisphereLight(0xffa07a, 0x4b0082, 0.2)) // Light Salmon sky, Indigo ground, increased intensity for sunset vibe
  scene.add(new THREE.AmbientLight(0xffffff, 0.2))

  // Create a small render target for the cube camera
  const cubeRenderTarget = new THREE.WebGLCubeRenderTarget(128)
  // Create a cube camera
  const cubeCamera = new THREE.CubeCamera(0.1, 1000, cubeRenderTarget)
  scene.add(cubeCamera)
  // Position the cube camera
  cubeCamera.position.set(0, 3, 0)
  // Render the cube camera once
  cubeCamera.update(renderer, scene)

  const hemisphereLight = new THREE.HemisphereLight(0x8080ff, 0x404040, 0.5)
  scene.add(hemisphereLight)

  const movieRoomFolder = gui.addFolder("Movie Room Light")
  movieRoomFolder
    .add(hemisphereLight, "intensity", 0, 1, 0.01)
    .name("Intensity")
  movieRoomFolder.addColor(hemisphereLight, "color").name("Sky Color")
  movieRoomFolder.addColor(hemisphereLight, "groundColor").name("Ground Color")
  // apply custom fog
}
