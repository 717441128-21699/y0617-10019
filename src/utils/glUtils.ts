import { UPDATE_VERT, UPDATE_FRAG, RENDER_VERT, RENDER_FRAG } from "@/shaders";

export function createShader(
  gl: WebGL2RenderingContext,
  type: number,
  source: string
): WebGLShader | null {
  const shader = gl.createShader(type);
  if (!shader) return null;
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    console.error("Shader compile error:", gl.getShaderInfoLog(shader));
    gl.deleteShader(shader);
    return null;
  }
  return shader;
}

export function createProgram(
  gl: WebGL2RenderingContext,
  vsSource: string,
  fsSource: string | null,
  tfVaryings: string[] | null = null
): WebGLProgram | null {
  const vs = createShader(gl, gl.VERTEX_SHADER, vsSource);
  if (!vs) return null;

  let fs: WebGLShader | null = null;
  if (fsSource) {
    fs = createShader(gl, gl.FRAGMENT_SHADER, fsSource);
    if (!fs) {
      gl.deleteShader(vs);
      return null;
    }
  }

  const program = gl.createProgram();
  if (!program) {
    gl.deleteShader(vs);
    if (fs) gl.deleteShader(fs);
    return null;
  }

  gl.attachShader(program, vs);
  if (fs) gl.attachShader(program, fs);

  if (tfVaryings) {
    gl.transformFeedbackVaryings(program, tfVaryings, gl.INTERLEAVED_ATTRIBS);
  }

  gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    console.error("Program link error:", gl.getProgramInfoLog(program));
    gl.deleteProgram(program);
    gl.deleteShader(vs);
    if (fs) gl.deleteShader(fs);
    return null;
  }

  return program;
}

const FLOATS_PER_PARTICLE = 8;
const BYTES_PER_PARTICLE = FLOATS_PER_PARTICLE * 4;

const ATTRIBS = [
  { name: "aPosition", size: 2, offset: 0 },
  { name: "aVelocity", size: 2, offset: 2 },
  { name: "aLife", size: 1, offset: 4 },
  { name: "aMaxLife", size: 1, offset: 5 },
  { name: "aSeed", size: 1, offset: 6 },
];

export interface ParticleEngine {
  update: (deltaTime: number, time: number) => void;
  render: () => void;
  triggerExplosion: (x: number, y: number, engineTime: number, strength?: number) => void;
  resize: (width: number, height: number) => void;
  setUniforms: (uniforms: Record<string, Float32Array | number>) => void;
  getActiveCount: () => number;
  destroy: () => void;
}

export function createParticleEngine(
  gl: WebGL2RenderingContext,
  maxParticles: number
): ParticleEngine | null {
  const updateProgram = createProgram(
    gl,
    UPDATE_VERT,
    UPDATE_FRAG,
    ["vPosition", "vVelocity", "vLife", "vMaxLife", "vSeed"]
  );
  if (!updateProgram) return null;

  const renderProgram = createProgram(gl, RENDER_VERT, RENDER_FRAG);
  if (!renderProgram) return null;

  const updateUniforms = getUniformLocations(gl, updateProgram, [
    "uDeltaTime", "uTime", "uResolution", "uGravity", "uWind",
    "uTurbulence", "uEmissionRate", "uExplosionPos", "uExplosionTime",
    "uExplosionStrength",
  ]);

  const renderUniforms = getUniformLocations(gl, renderProgram, [
    "uResolution", "uColorStart", "uColorEnd", "uParticleSize",
  ]);

  const updateAttribs = getAttribLocations(gl, updateProgram, [
    "aPosition", "aVelocity", "aLife", "aMaxLife", "aSeed",
  ]);

  const renderAttribs = getAttribLocations(gl, renderProgram, [
    "aPosition", "aVelocity", "aLife", "aMaxLife", "aSeed",
  ]);

  const particleData = new Float32Array(maxParticles * FLOATS_PER_PARTICLE);
  for (let i = 0; i < maxParticles; i++) {
    const offset = i * FLOATS_PER_PARTICLE;
    particleData[offset] = -9999;
    particleData[offset + 1] = -9999;
    particleData[offset + 2] = 0;
    particleData[offset + 3] = 0;
    particleData[offset + 4] = 0;
    particleData[offset + 5] = 1.0 + Math.random() * 3.0;
    particleData[offset + 6] = Math.random() * 10000.0;
    particleData[offset + 7] = 0;
  }

  const vao0 = gl.createVertexArray();
  const vao1 = gl.createVertexArray();
  const vbo0 = gl.createBuffer();
  const vbo1 = gl.createBuffer();
  const tf0 = gl.createTransformFeedback();
  const tf1 = gl.createTransformFeedback();

  gl.bindBuffer(gl.ARRAY_BUFFER, vbo0);
  gl.bufferData(gl.ARRAY_BUFFER, particleData, gl.DYNAMIC_COPY);
  gl.bindBuffer(gl.ARRAY_BUFFER, vbo1);
  gl.bufferData(gl.ARRAY_BUFFER, maxParticles * BYTES_PER_PARTICLE, gl.DYNAMIC_COPY);

  setupVAO(gl, vao0, vbo0, updateAttribs);
  setupVAO(gl, vao1, vbo1, updateAttribs);

  gl.bindTransformFeedback(gl.TRANSFORM_FEEDBACK, tf0);
  gl.bindBufferBase(gl.TRANSFORM_FEEDBACK_BUFFER, 0, vbo0);
  gl.bindTransformFeedback(gl.TRANSFORM_FEEDBACK, tf1);
  gl.bindBufferBase(gl.TRANSFORM_FEEDBACK_BUFFER, 0, vbo1);
  gl.bindTransformFeedback(gl.TRANSFORM_FEEDBACK, null);

  const renderVAO0 = gl.createVertexArray();
  const renderVAO1 = gl.createVertexArray();
  setupVAO(gl, renderVAO0, vbo0, renderAttribs);
  setupVAO(gl, renderVAO1, vbo1, renderAttribs);

  let currentReadIndex = 0;
  let explosionTime = -10.0;
  let explosionStrength = 0.0;
  let explosionPos = [0, 0];
  let resolution = [gl.canvas.width, gl.canvas.height];
  let activeCount = 0;
  let frameCount = 0;
  const sampleBuffer = new Float32Array(maxParticles * FLOATS_PER_PARTICLE);

  const uniforms: Record<string, Float32Array | number> = {};

  function swap() {
    currentReadIndex = 1 - currentReadIndex;
  }

  function update(deltaTime: number, time: number) {
    gl.useProgram(updateProgram);
    gl.uniform1f(updateUniforms.uDeltaTime, deltaTime);
    gl.uniform1f(updateUniforms.uTime, time);
    gl.uniform2f(updateUniforms.uResolution, resolution[0], resolution[1]);
    gl.uniform2f(updateUniforms.uGravity, uniforms.uGravity?.[0] ?? 0, uniforms.uGravity?.[1] ?? -2.0);
    gl.uniform2f(updateUniforms.uWind, uniforms.uWind?.[0] ?? 0.5, uniforms.uWind?.[1] ?? 0);
    gl.uniform1f(updateUniforms.uTurbulence, (uniforms.uTurbulence as number) ?? 0.4);
    gl.uniform1f(updateUniforms.uEmissionRate, (uniforms.uEmissionRate as number) ?? 0.5);
    gl.uniform2f(updateUniforms.uExplosionPos, explosionPos[0], explosionPos[1]);
    gl.uniform1f(updateUniforms.uExplosionTime, explosionTime);
    gl.uniform1f(updateUniforms.uExplosionStrength, explosionStrength);

    const readVAO = currentReadIndex === 0 ? vao0 : vao1;
    const writeTF = currentReadIndex === 0 ? tf1 : tf0;

    gl.bindVertexArray(readVAO);
    gl.bindTransformFeedback(gl.TRANSFORM_FEEDBACK, writeTF);

    gl.enable(gl.RASTERIZER_DISCARD);
    gl.beginTransformFeedback(gl.POINTS);
    gl.drawArrays(gl.POINTS, 0, maxParticles);
    gl.endTransformFeedback();
    gl.disable(gl.RASTERIZER_DISCARD);

    gl.bindTransformFeedback(gl.TRANSFORM_FEEDBACK, null);

    swap();

    if (time - explosionTime > 1.0) {
      explosionStrength = 0;
    }

    frameCount++;
    if (frameCount % 30 === 0) {
      const readBuffer = currentReadIndex === 0 ? vbo0 : vbo1;
      gl.bindBuffer(gl.ARRAY_BUFFER, readBuffer);
      gl.getBufferSubData(gl.ARRAY_BUFFER, 0, sampleBuffer);
      activeCount = 0;
      for (let i = 0; i < maxParticles; i++) {
        if (sampleBuffer[i * FLOATS_PER_PARTICLE + 4] > 0) activeCount++;
      }
      gl.bindBuffer(gl.ARRAY_BUFFER, null);
    }
  }

  function render() {
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.useProgram(renderProgram);

    gl.uniform2f(renderUniforms.uResolution, resolution[0], resolution[1]);
    const cs = uniforms.uColorStart ?? new Float32Array([0, 0.95, 0.85, 1]);
    const ce = uniforms.uColorEnd ?? new Float32Array([0.1, 0.2, 0.9, 0]);
    gl.uniform4f(renderUniforms.uColorStart, cs[0], cs[1], cs[2], cs[3]);
    gl.uniform4f(renderUniforms.uColorEnd, ce[0], ce[1], ce[2], ce[3]);
    gl.uniform1f(renderUniforms.uParticleSize, (uniforms.uParticleSize as number) ?? 4.0);

    const readRenderVAO = currentReadIndex === 0 ? renderVAO0 : renderVAO1;
    gl.bindVertexArray(readRenderVAO);

    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE);

    gl.drawArrays(gl.POINTS, 0, maxParticles);

    gl.disable(gl.BLEND);
    gl.bindVertexArray(null);
  }

  function triggerExplosion(x: number, y: number, engineTime: number, strength: number = 8000) {
    explosionPos = [x, resolution[1] - y];
    explosionTime = engineTime;
    explosionStrength = strength;
  }

  function resize(width: number, height: number) {
    resolution = [width, height];
    gl.viewport(0, 0, width, height);
  }

  function setUniforms(newUniforms: Record<string, Float32Array | number>) {
    Object.assign(uniforms, newUniforms);
  }

  function getActiveCount() {
    return activeCount;
  }

  function destroy() {
    gl.deleteProgram(updateProgram);
    gl.deleteProgram(renderProgram);
    gl.deleteVertexArray(vao0);
    gl.deleteVertexArray(vao1);
    gl.deleteVertexArray(renderVAO0);
    gl.deleteVertexArray(renderVAO1);
    gl.deleteBuffer(vbo0);
    gl.deleteBuffer(vbo1);
    gl.deleteTransformFeedback(tf0);
    gl.deleteTransformFeedback(tf1);
  }

  return {
    update,
    render,
    triggerExplosion,
    resize,
    setUniforms,
    getActiveCount,
    destroy,
  };
}

function getUniformLocations(
  gl: WebGL2RenderingContext,
  program: WebGLProgram,
  names: string[]
): Record<string, WebGLUniformLocation | null> {
  const locations: Record<string, WebGLUniformLocation | null> = {};
  for (const name of names) {
    locations[name] = gl.getUniformLocation(program, name);
  }
  return locations;
}

function getAttribLocations(
  gl: WebGL2RenderingContext,
  program: WebGLProgram,
  names: string[]
): Record<string, number> {
  const locations: Record<string, number> = {};
  for (const name of names) {
    locations[name] = gl.getAttribLocation(program, name);
  }
  return locations;
}

function setupVAO(
  gl: WebGL2RenderingContext,
  vao: WebGLVertexArrayObject,
  vbo: WebGLBuffer,
  attribs: Record<string, number>
) {
  gl.bindVertexArray(vao);
  gl.bindBuffer(gl.ARRAY_BUFFER, vbo);

  const stride = FLOATS_PER_PARTICLE * 4;
  for (const attr of ATTRIBS) {
    const loc = attribs[attr.name];
    if (loc >= 0) {
      gl.enableVertexAttribArray(loc);
      gl.vertexAttribPointer(loc, attr.size, gl.FLOAT, false, stride, attr.offset * 4);
    }
  }

  gl.bindVertexArray(null);
  gl.bindBuffer(gl.ARRAY_BUFFER, null);
}
