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
    this.sizeX = 6.77; // should match aspect ratio of mesh
    this.sizeY = 4.33;

    this.setupPipeline();
    this.mesh.material = new THREE.MeshBasicMaterial({ map: this.sourceTarget.texture });

    this.store.registerUpdate(this.update.bind(this));
  }

  setupPipeline() {
    this.sourceTarget = new THREE.WebGLRenderTarget(2048, 2048);
    this.targetA = new THREE.WebGLRenderTarget(2048, 2048);
    this.targetB = new THREE.WebGLRenderTarget(2048, 2048);
    this.finalTarget = new THREE.WebGLRenderTarget(2048, 2048);

    this.sourceScene = new THREE.Scene();
    this.fboScene = new THREE.Scene();

    this.paintbrush = new THREE.Mesh(new THREE.SphereGeometry(0.1, 100, 100));
    this.paintbrush.z -= 0.5;
    this.sourceScene.add(this.paintbrush);

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
        tPrev: { value: null },
        resolution: {
          value: new THREE.Vector4(this.store.width, this.store.height, 1, 1),
        },
      },
      vertexShader: vertex,
      fragmentShader: fragmentFBO,
    });

    this.finalScene = new THREE.Scene();
    this.finalQuad = new THREE.Mesh(
      new THREE.PlaneGeometry(this.sizeX, this.sizeY),
      new THREE.MeshBasicMaterial({ map: null })
    );
    this.finalScene.add(this.finalQuad);
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

    this.renderer.setRenderTarget(this.sourceTarget);
    this.renderer.render(this.sourceScene, this.fboCamera);

    this.renderer.setRenderTarget(this.targetA);
    this.fboMaterial.uniforms.tDiffuse.value = this.sourceTarget.texture;
    this.fboMaterial.uniforms.tPrev.value = this.targetA.texture;
    this.renderer.render(this.fboScene, this.fboCamera);

    this.finalQuad.material.map = this.targetA.texture;
    this.renderer.setRenderTarget(this.finalTarget);
    this.renderer.render(this.finalScene, this.fboCamera);

    this.renderer.setRenderTarget(null);

    // swap
    let temp = this.targetA;
    this.targetA = this.targetB;
    this.targetB = temp;
  }
}
