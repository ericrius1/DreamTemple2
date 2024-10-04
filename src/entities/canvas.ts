import * as THREE from "three"
import { Store } from "../store"

export class Canvas {
  private mesh: THREE.Mesh
  private store: Store

  constructor(store, { mesh }: { mesh: THREE.Mesh; store: Store }) {
    this.mesh = mesh
    this.store = store
    this.mesh.material = new THREE.MeshStandardMaterial()

    this.store.registerUpdate(this.update.bind(this))
  }

  private update() {
    const raycaster = this.store.raycaster
    raycaster.setFromCamera(new THREE.Vector2(), this.store.camera)

    const intersects = raycaster.intersectObject(this.mesh)
    if (intersects.length > 0) {
      // Collision detected with this canvas
      console.log("Canvas hit at point:", intersects[0].uv)
      // Add your painting logic here
    }
  }
}
