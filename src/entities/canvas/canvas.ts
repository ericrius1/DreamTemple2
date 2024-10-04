import * as THREE from "three";
import { Store } from "../../store";
import vertex from "./shaders/vertex.glsl";
import fragment from "./shaders/fragment.glsl";
import fragmentFBO from "./shaders/fbo.frag";
import { mapLinear } from "three/src/math/MathUtils";

export class Canvas {
  private mesh: THREE.Mesh;
  private store: Store;
  private sourceTarget: THREE.WebGLRenderTarget;
  private fboScene: THREE.Scene;
  private fboCamera: THREE.OrthographicCamera;
  private fboMaterial: THREE.ShaderMaterial;
  private targetA: THREE.WebGLRenderTarget;
  private targetB: THREE.WebGLRenderTarget;
  private fboQuad: THREE.Mesh;
  private finalScene: THREE.Scene;
  private finalQuad: THREE.Mesh;
  private renderer: THREE.WebGLRenderer;

  constructor(store, { mesh }: { mesh: THREE.Mesh }) {
    this.mesh = mesh;
    this.store = store;

    this.renderer = store.renderer;
    this.sizeX = 6.77;
    this.sizeY = 4.33;

    this.setupPipeline();

    // this.mesh = new THREE.Mesh(new THREE.PlaneGeometry(1, 1));
    // this.mesh.position.y += 2;
    // this.store.scene.add(this.mesh);
    this.mesh.material = new THREE.MeshBasicMaterial({ map: this.targetA.texture });

    this.store.registerUpdate(this.update.bind(this));
  }

  setupPipeline() {
    this.sourceTarget = new THREE.WebGLRenderTarget(this.store.width, this.store.height);
    this.targetA = new THREE.WebGLRenderTarget(2048, 2048);
    this.targetB = new THREE.WebGLRenderTarget(this.store.width, this.store.height);

    this.fboScene = new THREE.Scene();

    this.paintbrush = new THREE.Mesh(new THREE.SphereGeometry(0.1, 100, 100));
    this.paintbrush.z -= 0.5;
    this.fboScene.add(this.paintbrush);
    // this.fboCamera = new THREE.PerspectiveCamera(50, 1, 0.1, 10000);
    this.fboCamera = new THREE.OrthographicCamera(
      -this.sizeX / 2,
      this.sizeX / 2,
      this.sizeY / 2,
      -this.sizeY / 2,
      0,
      1
    );

    this.fboMaterial = new THREE.ShaderMaterial({
      uniforms: {
        tDiffuse: { value: null },
        resolution: {
          value: new THREE.Vector4(this.store.width, this.store.height, 1, 1),
        },
      },
      vertexShader: vertex,
      fragmentShader: fragmentFBO,
    });

    // this.fboQuad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), this.fboMaterial);
    // this.fboScene.add(this.fboQuad);
  }

  update() {
    if (
      this.store.intersection?.object === this.mesh &&
      this.store.inputManager.getInputState().cast
    ) {
      console.log("canvas intersected");
      const uv = this.store.intersection.uv;
      const mappedPointX = mapLinear(uv.x, 0, 1, -this.sizeX / 2, this.sizeX / 2);
      const mappedPointY = mapLinear(uv.y, 0, 1, -this.sizeY / 2, this.sizeY / 2);
      this.paintbrush.position.set(mappedPointX, mappedPointY, -0.5);
    }

    this.renderer.setRenderTarget(this.targetA);
    this.renderer.render(this.fboScene, this.fboCamera);

    this.renderer.setRenderTarget(null);

    // swap
    // let temp = this.targetA;
    // this.targetA = this.targetB;
    // this.targetB = temp;
  }
}
