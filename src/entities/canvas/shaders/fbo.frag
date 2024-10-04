precision highp float;

uniform vec4 uResolution;


varying vec2 vUv;
uniform sampler2D tDiffuse;
uniform sampler2D tPrev;


float rand(vec2 n) { 
	return fract(sin(dot(n, vec2(12.9898, 4.1414))) * 43758.5453);
}

float noise(vec2 p){
	vec2 ip = floor(p);
	vec2 u = fract(p);
	u = u*u*(3.0-2.0*u);
	
	float res = mix(
		mix(rand(ip),rand(ip+vec2(1.0,0.0)),u.x),
		mix(rand(ip+vec2(0.0,1.0)),rand(ip+vec2(1.0,1.0)),u.x),u.y);
	return res*res;
}

float fbm(vec2 x, int numOctaves) {
	float v = 0.0;
	float a = 0.5;
	vec2 shift = vec2(100);
	// Rotate to reduce axial bias
    mat2 rot = mat2(cos(0.5), sin(0.5), -sin(0.5), cos(0.50));
	for (int i = 0; i < numOctaves; ++i) {
		v += a * noise(x);
		x = rot * x * 2.0 + shift;
		a *= 0.5;
	}
	return v;
}

float blendDarken(float base, float blend) {
	return min(blend,base);
}

vec3 blendDarken(vec3 base, vec3 blend) {
	return vec3(blendDarken(base.r,blend.r),blendDarken(base.g,blend.g),blendDarken(base.b,blend.b));
}

vec3 blendDarken(vec3 base, vec3 blend, float opacity) {
	return (blendDarken(base, blend) * opacity + base * (1.0 - opacity));
}


vec3 bgColor = vec3(1., 1.,1.);
void main() {
    vec4 color = texture2D(tDiffuse, vUv);
    vec4 prev = texture2D(tPrev, vUv);
    // gl_FragColor = prev;
    // gl_FragColor = prev * 0.99;   texel


    vec2 aspect = vec2(1., uResolution.y/uResolution.x);

    vec2 disp = fbm(vUv * 33., 7) * aspect * 0.005;

    vec4 texel1 = texture2D(tPrev, vUv);
    vec4 texel2 = texture2D(tPrev, vec2(vUv.x +disp.x, vUv.y));
    vec4 texel3 = texture2D(tPrev, vec2(vUv.x -disp.x, vUv.y));
    vec4 texel4 = texture2D(tPrev, vec2(vUv.x, vUv.y + disp.y));
    vec4 texel5 = texture2D(tPrev, vec2(vUv.x, vUv.y - disp.y));
	vec3 floodColor = texel1.rgb;
	floodColor = blendDarken(floodColor, texel2.rgb);
	floodColor = blendDarken(floodColor, texel3.rgb);
	floodColor = blendDarken(floodColor, texel4.rgb);
	floodColor = blendDarken(floodColor, texel5.rgb);


	vec3 waterColor = blendDarken(prev.rgb, floodColor * (1. + 0.01),0.2);

    // gl_FragColor =  texel2 ;
	gl_FragColor = vec4(waterColor, 1.);
}

