import * as THREE from "three"

export class Canvas {
  constructor({ mesh }: { mesh: THREE.Mesh }) {
    // give this mesh a canvas material which can be painted on with different brushes etc

    this.mesh = mesh
    this.mesh.material = new THREE.MeshStandardMaterial()
  }
}
