import * as THREE from "three"
import { Store } from "../../store"
import vertex from "./shaders/vertex.glsl"
import fragment from "./shaders/fragment.glsl"
import fragmentFBO from "./shaders/fbo.frag"

export class Canvas {
  private mesh: THREE.Mesh
  private store: Store
  private sourceTarget: THREE.WebGLRenderTarget
  private fboScene: THREE.Scene
  private fboCamera: THREE.OrthographicCamera
  private fboMaterial: THREE.ShaderMaterial
  constructor(store, { mesh }: { mesh: THREE.Mesh }) {
    this.mesh = mesh
    this.store = store

    this.setupPipeline()
    this.mesh.material = this.fboMaterial

    this.store.registerUpdate(this.update.bind(this))
  }

  setupPipeline() {
    this.sourceTarget = new THREE.WebGLRenderTarget(
      this.store.width,
      this.store.height
    )

    this.fboScene = new THREE.Scene()
    this.fboCamera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1)
    this.fboMaterial = new THREE.ShaderMaterial({
      uniforms: {
        tDiffuse: { value: this.sourceTarget.texture },
        resolution: {
          value: new THREE.Vector4(this.store.width, this.store.height, 1, 1),
        },
      },
      vertexShader: vertex,
      fragmentShader: fragmentFBO,
    })
  }

  update() {
    if (
      this.store.intersection?.object === this.mesh &&
      this.store.inputManager.getInputState().cast
    ) {
      console.log("canvas intersected")
    }
  }
}
