import {
  createRawShaderBackground,
  initRawShaderBackgrounds,
  type ShaderHandle,
  type ShaderInputDefinitions,
} from "@/lib/utils/starwind/shader-runtime";

const fragmentShaderSource = /* glsl */ `
  precision highp float;
  uniform vec2 uResolution;
  uniform float uTime;
  uniform float uVeilHeight;
  uniform float uHemStrength;
  uniform float uAuroraDrift;
  uniform float uVeilScale;
  uniform float uVeilBrightness;
  uniform vec3 uPrimaryVeilColor;
  uniform vec3 uSecondaryVeilColor;
  uniform vec3 uGlintColor;
  uniform vec3 uThemeBackground;
  uniform float uThemeIsDark;

  float hash(float p) {
    return fract(sin(p * 127.1) * 43758.5453);
  }

  float noise(float p) {
    float i = floor(p);
    float f = fract(p);
    return mix(hash(i), hash(i + 1.0), f * f * (3.0 - 2.0 * f));
  }

  void main() {
    vec2 p = (2.0 * gl_FragCoord.xy - uResolution.xy) / max(uResolution.y, 1.0);
    float t = uTime * uAuroraDrift * 0.25;
    float x = p.x * uVeilScale * 0.65;
    vec3 light = vec3(0.0);
    float coverage = 0.0;
    for (int i = 0; i < 3; i++) {
      float fi = float(i);
      float phase = fi * 1.9;
      float wave = sin(x * 1.1 + phase + t * 0.65) * 0.25;
      wave += sin(x * 2.35 - t * 0.42 + phase) * 0.09;
      float base = -0.36 + fi * 0.22 + wave + p.x * 0.16;
      float height = p.y - base;
      float fold = noise(x * 7.0 + sin(x * 2.0 + t) * 1.4 + phase - t);
      float fine = noise(x * 42.0 + phase - t * 1.5);
      float threads = 0.35 + fold * 0.5 + fine * 0.15;
      float curtain = exp(-max(height, 0.0) * (2.8 + fold * 2.0) / uVeilHeight);
      curtain *= smoothstep(-0.045, 0.09, height) * threads;
      float hem = exp(-pow(height / 0.034, 2.0)) * (0.45 + fold * 0.55) * uHemStrength;
      float haze = exp(-pow(height / 0.24, 2.0)) * 0.13;
      float envelope = exp(-pow((p.x - 0.25 + fi * 0.3) * 0.52, 2.0));
      float energy = (curtain * 0.88 + hem * 0.34 + haze) * envelope;
      vec3 pigment = mix(uPrimaryVeilColor, uSecondaryVeilColor, clamp(fi * 0.34 + height * 0.48, 0.0, 1.0));
      light += pigment * energy;
      light += uGlintColor * hem * envelope * 0.065;
      coverage += energy;
    }
    vec3 dark = uThemeBackground + light * uVeilBrightness;
    dark = dark / (1.0 + light * 0.45 * uVeilBrightness);
    vec3 pigment = light / max(coverage, 0.001);
    vec3 pale = mix(uThemeBackground, pigment * 0.68, clamp(coverage * uVeilBrightness * 0.65, 0.0, 0.76));
    gl_FragColor = vec4(mix(pale, dark, uThemeIsDark), 1.0);
  }
`;

const shaderInputs = {
  veilHeight: {
    attribute: "data-shader-veil-height",
    default: 1,
    min: 0.35,
    max: 2.5,
    type: "number",
    uniform: "uVeilHeight",
  },
  hemStrength: {
    attribute: "data-shader-hem-strength",
    default: 1,
    min: 0,
    max: 2,
    type: "number",
    uniform: "uHemStrength",
  },

  auroraDrift: {
    attribute: "data-shader-aurora-drift",
    default: 0.4,
    max: 3,
    min: 0,
    type: "number",
    uniform: "uAuroraDrift",
  },
  glintColor: {
    attribute: "data-shader-glint-color",
    default: [0.98, 0.63, 0.28],
    type: "color",
    uniform: "uGlintColor",
  },
  primaryVeilColor: {
    attribute: "data-shader-primary-veil-color",
    default: [0.08, 0.88, 0.72],
    type: "color",
    uniform: "uPrimaryVeilColor",
  },
  secondaryVeilColor: {
    attribute: "data-shader-secondary-veil-color",
    default: [0.47, 0.34, 0.96],
    type: "color",
    uniform: "uSecondaryVeilColor",
  },
  veilBrightness: {
    attribute: "data-shader-veil-brightness",
    default: 0.9,
    max: 2,
    min: 0,
    type: "number",
    uniform: "uVeilBrightness",
  },
  veilScale: {
    attribute: "data-shader-veil-scale",
    default: 2.2,
    max: 6,
    min: 0.5,
    type: "number",
    uniform: "uVeilScale",
  },
} satisfies ShaderInputDefinitions;

/** Creates the background with live controls and shared lifecycle handling. */
export function createShaderAuroraVeilBackground(canvas: HTMLCanvasElement): ShaderHandle | null {
  return createRawShaderBackground(canvas, {
    fragmentShaderSource,
    enableThemeColors: true,
    rootSelector: "[data-shader-aurora-veil]",
    defaults: {
      maxDpr: 1.5,
      maxFps: 60,
    },
    inputs: shaderInputs,
  });
}

/** Initializes each mounted background once. */
export function initShaderAuroraVeilBackgrounds() {
  initRawShaderBackgrounds("[data-shader-aurora-veil-canvas]", createShaderAuroraVeilBackground);
}
