varying vec2 vUv;
uniform sampler2D tDiffuse;
uniform sampler2D tPrev;

void main() {
    vec4 color = texture2D(tDiffuse, vUv);
    vec4 prev = texture2D(tPrev, vUv);
    gl_FragColor = color + prev;
}
