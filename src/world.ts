import * as THREE from "three"
import { StaticGeometryGenerator, MeshBVH, MeshBVHHelper } from "three-mesh-bvh"
import { Store } from "./store"
import { Canvas } from "./entities/canvas"

const params = {
  displayCollider: false,
  displayBVH: false,
  visualizeDepth: 10,
}

export function loadWorld(store: Store) {
  let environment: THREE.Group
  let collider: THREE.Mesh
  let visualizer: MeshBVHHelper
  const { scene, gui, gltfLoader } = store
  setupGUI()

  return new Promise((resolve, reject) => {
    gltfLoader.load(
      "/glb/dreamtemple.glb",
      async (res) => {
        const gltfScene = res.scene
        gltfScene.traverse(async (obj) => {
          if (obj instanceof THREE.Mesh) {
            obj.castShadow = true
            obj.receiveShadow = true
          }
          if (obj instanceof THREE.Light) {
            obj.castShadow = true
            if (
              obj instanceof THREE.DirectionalLight ||
              obj instanceof THREE.SpotLight
            ) {
              obj.shadow.bias = -0.001
            }
          }
          if (obj.name.includes("Canvas")) {
            new Canvas(store, { mesh: obj })
          }
        })
        environment = gltfScene

        const staticGenerator = new StaticGeometryGenerator(environment)
        staticGenerator.attributes = ["position"]

        const mergedGeometry = staticGenerator.generate()
        mergedGeometry.boundsTree = new MeshBVH(mergedGeometry)

        collider = new THREE.Mesh(mergedGeometry)
        collider.material.wireframe = true
        collider.material.opacity = 0.5
        collider.material.transparent = true
        collider.visible = false

        store["collisionWorld"] = collider

        visualizer = new MeshBVHHelper(collider, params.visualizeDepth)
        visualizer.opacity = 0.8
        visualizer.visible = false
        scene.add(visualizer)
        scene.add(collider)
        scene.add(environment)
        resolve(undefined)
      },
      undefined,
      reject
    )
  })

  function setupGUI() {
    const visFolder = gui.addFolder("Visualization")
    visFolder.add(params, "displayCollider").onChange((v) => {
      collider.visible = v
    })
    visFolder.add(params, "displayBVH").onChange((v) => {
      visualizer.visible = v
    })
    visFolder.add(params, "visualizeDepth", 1, 20, 1).onChange((v) => {
      visualizer.depth = v
      visualizer.update()
    })
    visFolder.open()
    gui.open()
  }
}
