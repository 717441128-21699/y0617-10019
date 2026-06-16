export const UPDATE_VERT = `#version 300 es
precision highp float;

in vec2 aPosition;
in vec2 aVelocity;
in float aLife;
in float aMaxLife;
in float aSeed;

uniform float uDeltaTime;
uniform float uTime;
uniform vec2 uResolution;
uniform vec2 uGravity;
uniform vec2 uWind;
uniform float uTurbulence;
uniform float uEmissionRate;
uniform vec2 uExplosionPos;
uniform float uExplosionTime;
uniform float uExplosionStrength;

out vec2 vPosition;
out vec2 vVelocity;
out float vLife;
out float vMaxLife;
out float vSeed;

float hash(float n) {
    return fract(sin(n) * 43758.5453123);
}

vec2 noise2D(vec2 p) {
    return vec2(
        fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453),
        fract(sin(dot(p, vec2(269.5, 183.3))) * 43758.5453)
    ) * 2.0 - 1.0;
}

void main() {
    float dt = uDeltaTime;
    float newLife = aLife - dt / max(aMaxLife, 0.01);

    if (newLife <= 0.0) {
        float s = aSeed;
        float respawnChance = uEmissionRate * dt;

        if (hash(s + floor(uTime * 60.0)) < respawnChance) {
            float angle = hash(s + uTime * 1.7) * 6.2831853;
            float speed = hash(s + uTime * 2.3) * 150.0 + 30.0;
            vPosition = uResolution * 0.5;
            vVelocity = vec2(cos(angle), sin(angle)) * speed;
            vLife = 1.0;
            vMaxLife = hash(s + uTime * 3.1) * 3.0 + 1.0;
            vSeed = s;
        } else {
            vPosition = vec2(-9999.0);
            vVelocity = vec2(0.0);
            vLife = 0.0;
            vMaxLife = aMaxLife;
            vSeed = aSeed;
        }
    } else {
        vec2 turb = noise2D(aPosition * 0.003 + uTime * 0.5) * uTurbulence * 200.0;
        vec2 gravity = uGravity * 200.0;
        vec2 wind = uWind * 100.0;
        vec2 acceleration = gravity + wind + turb;

        float timeSinceExplosion = uTime - uExplosionTime;
        if (timeSinceExplosion < 0.8 && timeSinceExplosion >= 0.0 && uExplosionStrength > 0.0) {
            vec2 toParticle = aPosition - uExplosionPos;
            float dist = length(toParticle);
            if (dist > 1.0) {
                float force = uExplosionStrength * exp(-dist * 0.005) * exp(-timeSinceExplosion * 3.0);
                acceleration += normalize(toParticle) * force;
            }
        }

        vec2 newVelocity = aVelocity + acceleration * dt;
        newVelocity *= 0.998;
        vec2 newPosition = aPosition + newVelocity * dt;

        vPosition = newPosition;
        vVelocity = newVelocity;
        vLife = newLife;
        vMaxLife = aMaxLife;
        vSeed = aSeed;
    }
}
`;

export const UPDATE_FRAG = `#version 300 es
precision highp float;
out vec4 fragColor;
void main() {
    fragColor = vec4(0.0);
}
`;

export const RENDER_VERT = `#version 300 es
precision highp float;

in vec2 aPosition;
in vec2 aVelocity;
in float aLife;
in float aMaxLife;
in float aSeed;

uniform vec2 uResolution;
uniform vec4 uColorStart;
uniform vec4 uColorEnd;
uniform float uParticleSize;

out vec4 vColor;
out float vLife;

void main() {
    vec2 clipPos = (aPosition / uResolution) * 2.0 - 1.0;
    clipPos.y = -clipPos.y;
    gl_Position = vec4(clipPos, 0.0, 1.0);

    float lifeRatio = clamp(aLife, 0.0, 1.0);
    gl_PointSize = uParticleSize * (0.3 + 0.7 * lifeRatio);

    vColor = mix(uColorEnd, uColorStart, lifeRatio);
    vColor.a *= lifeRatio * 0.85;
    vLife = lifeRatio;
}
`;

export const RENDER_FRAG = `#version 300 es
precision highp float;

in vec4 vColor;
in float vLife;
out vec4 fragColor;

void main() {
    vec2 coord = gl_PointCoord - 0.5;
    float dist = length(coord);
    if (dist > 0.5) discard;

    float core = exp(-dist * dist * 20.0);
    float glow = exp(-dist * dist * 8.0);
    float alpha = mix(glow, core, 0.5) * vColor.a;

    vec3 color = vColor.rgb + vec3(core * 0.3);
    fragColor = vec4(color, alpha);
}
`;
