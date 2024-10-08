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
  private sizeX: number;
  private sizeY: number;
  private whiteTexture: THREE.Texture;
  private finalTarget: THREE.WebGLRenderTarget;
  private sourceScene: THREE.Scene;
  private paintbrush: THREE.Group;
  private brushParticles: THREE.Mesh[];

  constructor(store: Store, { mesh }: { mesh: THREE.Mesh }) {
    this.mesh = mesh;
    this.store = store;

    this.renderer = store.renderer;
    this.sizeX = 6.77; // should match aspect ratio of mesh
    this.sizeY = 4.33;

    this.store.textureLoader.load("/textures/white.webp", (texture) => {
      this.whiteTexture = texture;
      this.setupPipeline();
      this.mesh.material = new THREE.MeshBasicMaterial({ map: this.finalTarget.texture });

      this.store.registerUpdate(this.update.bind(this));
    });
  }

  setupPipeline() {
    this.sourceTarget = new THREE.WebGLRenderTarget(2048, 2048);
    this.targetA = new THREE.WebGLRenderTarget(2048, 2048);
    this.targetB = new THREE.WebGLRenderTarget(2048, 2048);
    this.finalTarget = new THREE.WebGLRenderTarget(2048, 2048);

    this.sourceScene = new THREE.Scene();
    this.paintbrush = new THREE.Group();
    const mainBrush = new THREE.Mesh(
      new THREE.SphereGeometry(0.05, 20, 20),
      new THREE.MeshBasicMaterial({ color: 0xff0000 })
    );
    this.paintbrush.add(mainBrush);

    this.brushParticles = [];
    for (let i = 0; i < 100; i++) {
      const particle = new THREE.Mesh(
        new THREE.SphereGeometry(0.01, 8, 8),
        new THREE.MeshBasicMaterial({ color: 0xff0000 })
      );
      this.brushParticles.push(particle);
      this.paintbrush.add(particle);
    }

    this.sourceScene.add(this.paintbrush);

    this.fboScene = new THREE.Scene();

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
        tPrev: { value: this.whiteTexture },
        uResolution: { value: new THREE.Vector4(this.sizeX, this.sizeY, 1, 1) },
        uTime: { value: 0 },
      },
      vertexShader: vertex,
      fragmentShader: fragmentFBO,
    });

    this.fboQuad = new THREE.Mesh(
      new THREE.PlaneGeometry(this.sizeX, this.sizeY),
      this.fboMaterial
    );
    this.fboScene.add(this.fboQuad);

    this.finalScene = new THREE.Scene();
    this.finalQuad = new THREE.Mesh(
      new THREE.PlaneGeometry(this.sizeX, this.sizeY),
      new THREE.MeshBasicMaterial({ map: this.targetA.texture })
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

      // Update brush particles
      const time = this.store.clock.getElapsedTime();
      this.brushParticles.forEach((particle, index) => {
        const angle = (index / this.brushParticles.length) * Math.PI * 2 + time * 2;
        const radius = 0.3 + Math.sin(time * 3 + index) * 0.1;
        particle.position.x = Math.cos(angle) * radius;
        particle.position.y = Math.sin(angle) * radius;
        particle.position.z = Math.sin(time * 5 + index) * 0.1;
      });
    } else {
      this.paintbrush.position.set(0, 0, 10);
    }

    this.renderer.setRenderTarget(this.sourceTarget);
    this.renderer.render(this.sourceScene, this.fboCamera);

    this.renderer.setRenderTarget(this.targetA);
    this.renderer.render(this.fboScene, this.fboCamera);
    this.fboMaterial.uniforms.uTime.value = this.store.clock.getElapsedTime();
    this.fboMaterial.uniforms.tDiffuse.value = this.sourceTarget.texture;
    this.fboMaterial.uniforms.tPrev.value = this.targetA.texture;

    this.renderer.setRenderTarget(this.finalTarget);
    (this.finalQuad.material as THREE.MeshBasicMaterial).map = this.targetA.texture;
    this.renderer.render(this.finalScene, this.fboCamera);

    let temp = this.targetA;
    this.targetA = this.targetB;
    this.targetB = temp;
    this.renderer.setRenderTarget(null);
  }
}
