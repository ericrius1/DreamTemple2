import * as THREE from "three"
import { Store } from "../store"

export class Canvas {
  private mesh: THREE.Mesh
  private store: Store
  constructor(store, { mesh }: { mesh: THREE.Mesh }) {
    this.mesh = mesh
    this.store = store
    this.mesh.material = new THREE.MeshStandardMaterial()

    this.store.registerUpdate(this.update.bind(this))
    this.cursor = document.querySelector(".cursor")
  }

  update() {}
}
