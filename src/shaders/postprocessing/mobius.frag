precision highp float;

void mainImage(const in vec4 inputColor, const in vec2 uv, out vec4 outputColor) {
    vec4 color = texture2D(inputBuffer, uv);
    color.r +=.1;
    outputColor = color;
}