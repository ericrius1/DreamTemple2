import * as THREE from "three"
import { Effect, EffectComposer, EffectPass, RenderPass } from "postprocessing"
import { Store } from "./store"
import ditherFragment from "../src/shaders/postprocessing/dither.frag"
import mobiusFragment from "../src/shaders/postprocessing/mobius.frag"

export const PostProcess = (store: Store) => {
  store.composer = new EffectComposer(store.renderer)
  store.composer.addPass(new RenderPass(store.scene, store.camera))
  store.composer.addPass(new EffectPass(store.camera, new RetroEffect()))
}

class RetroEffect extends Effect {
  private uniforms: Map<string, THREE.Uniform>

  constructor() {
    const uniforms = new Map([
      ["colorNum", new THREE.Uniform(16.0)],
      ["pixelSize", new THREE.Uniform(8.0)],
      ["blending", new THREE.Uniform(true)],
      ["curve", new THREE.Uniform(0.25)],
    ])
    super("RetroEffect", ditherFragment, {
      uniforms,
    })
    this.uniforms = uniforms
  }
}

class MobiusEffect extends Effect {
  constructor() {
    const uniforms = new Map([])
    super("MobiusEffect", mobiusFragment, {
      uniforms,
    })
    this.uniforms = uniforms
  }
}
