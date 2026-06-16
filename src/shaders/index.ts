export const UPDATE_VERT = `#version 300 es
precision highp float;

in vec2 aPosition;
in vec2 aVelocity;
in float aLife;
in float aMaxLife;
in float aSeed;
in float aExplosionId;

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
uniform float uExplosionId;
uniform vec4 uColorStart;
uniform vec4 uColorEnd;

out vec2 vPosition;
out vec2 vVelocity;
out float vLife;
out float vMaxLife;
out float vSeed;
out float vExplosionId;
out float vPad;

float hash(float n) {
    return fract(sin(n) * 43758.5453123);
}

float hash2(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
}

vec2 noise2D(vec2 p) {
    return vec2(
        fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453) * 2.0 - 1.0,
        fract(sin(dot(p, vec2(269.5, 183.3))) * 43758.5453) * 2.0 - 1.0
    );
}

void main() {
    float dt = uDeltaTime;
    float currentExplosionId = uExplosionId;
    float particleExplId = aExplosionId;
    float timeSinceExplosion = uTime - uExplosionTime;
    bool explosionActive = (uExplosionStrength > 0.0) && (timeSinceExplosion < 1.2);
    bool notConsumedByExplosion = (particleExplId < currentExplosionId);

    float newLife = aLife - dt / max(aMaxLife, 0.01);
    vec2 newPos = aPosition;
    vec2 newVel = aVelocity;
    float newMaxLife = aMaxLife;
    float newSeed = aSeed;
    float newExplId = particleExplId;

    bool offscreen =
        (aPosition.x < -uResolution.x * 2.0) ||
        (aPosition.x >  uResolution.x * 3.0) ||
        (aPosition.y < -uResolution.y * 4.0) ||
        (aPosition.y >  uResolution.y * 4.0);
    bool dead = (newLife <= 0.0) || offscreen;

    bool inBurstWindow = (uExplosionStrength > 0.0) && (timeSinceExplosion < 0.12) && notConsumedByExplosion;
    float burstProb = 0.0;
    if (inBurstWindow) {
        float tNorm = timeSinceExplosion / 0.12;
        float envelope = (1.0 - tNorm) * (1.0 - tNorm);
        burstProb = min(1.0, uExplosionStrength * 0.000018) * envelope;
    }
    bool forcedBurst = false;
    if (burstProb > 0.0) {
        float rb = hash(aSeed + currentExplosionId * 91.1 + floor(uTime * 240.0));
        if (rb < burstProb) forcedBurst = true;
    }

    if (forcedBurst) {
        float s = aSeed + currentExplosionId * 37.0;
        float angle = hash(s * 3.1 + currentExplosionId * 17.3) * 6.2831853;
        float speedMin = 120.0 + uExplosionStrength * 0.02;
        float speedMax = 320.0 + uExplosionStrength * 0.08;
        float speed = hash(s * 1.7 + currentExplosionId * 7.1) * (speedMax - speedMin) + speedMin;
        newPos = uExplosionPos;
        newVel = vec2(cos(angle), sin(angle)) * speed;
        newLife = 1.0;
        newMaxLife = hash(s * 2.9 + currentExplosionId * 11.7) * 1.6 + 0.9;
        newSeed = s;
        newExplId = currentExplosionId;
    } else if (dead) {
        float s = aSeed;
        float respawned = 0.0;

        if (explosionActive && notConsumedByExplosion) {
            float t = hash(s + currentExplosionId * 131.7);
            float consumeProb = min(1.0, uExplosionStrength * 0.00008);
            if (t < consumeProb) {
                float angle = hash(s + currentExplosionId * 17.3) * 6.2831853;
                float speedMin = 80.0 + uExplosionStrength * 0.015;
                float speedMax = 250.0 + uExplosionStrength * 0.06;
                float speed = hash(s + currentExplosionId * 7.1) * (speedMax - speedMin) + speedMin;
                newPos = uExplosionPos;
                newVel = vec2(cos(angle), sin(angle)) * speed;
                newLife = 1.0;
                newMaxLife = hash(s + currentExplosionId * 11.7) * 1.8 + 0.8;
                newSeed = s + currentExplosionId * 101.3;
                newExplId = currentExplosionId;
                respawned = 1.0;
            }
        }

        if (respawned < 0.5) {
            float continuousChance = uEmissionRate * dt * 20.0;
            float c = hash(s + floor(uTime * 120.0) * 0.01);
            if (c < continuousChance) {
                float angle = hash(s + uTime * 1.731) * 6.2831853;
                float speed = hash(s + uTime * 2.311) * 120.0 + 20.0;
                newPos = uResolution * 0.5;
                newVel = vec2(cos(angle), sin(angle)) * speed;
                newLife = 1.0;
                newMaxLife = hash(s + uTime * 3.171) * 3.0 + 1.5;
                newSeed = s;
                newExplId = particleExplId;
                respawned = 1.0;
            }
        }

        if (respawned < 0.5) {
            newPos = vec2(-99999.0);
            newVel = vec2(0.0);
            newLife = 0.0;
            newMaxLife = aMaxLife;
            newSeed = s + 7.77;
            newExplId = particleExplId;
        }
    } else {
        vec2 turb = noise2D(aPosition * 0.0025 + uTime * 0.4) * uTurbulence * 220.0;
        vec2 gravity = uGravity * 220.0;
        vec2 wind = uWind * 110.0;
        vec2 acceleration = gravity + wind + turb;

        if (explosionActive) {
            vec2 toParticle = aPosition - uExplosionPos;
            float dist = length(toParticle);
            if (dist > 0.5) {
                float decayT = exp(-timeSinceExplosion * 2.8);
                float decayD = exp(-dist * 0.0045);
                float force = uExplosionStrength * 0.12 * decayT * decayD;
                acceleration += (toParticle / dist) * force;
            }
        }

        vec2 updatedVel = aVelocity + acceleration * dt;
        float damp = 1.0 - dt * 0.35;
        if (damp < 0.92) damp = 0.92;
        updatedVel *= damp;
        vec2 updatedPos = aPosition + updatedVel * dt;

        newPos = updatedPos;
        newVel = updatedVel;
        newLife = newLife;
        newMaxLife = aMaxLife;
        newSeed = aSeed;
        newExplId = aExplosionId;
    }

    vPosition = newPos;
    vVelocity = newVel;
    vLife = newLife;
    vMaxLife = newMaxLife;
    vSeed = newSeed;
    vExplosionId = newExplId;
    vPad = 0.0;

    gl_Position = vec4(0.0);
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
in float aExplosionId;

uniform vec2 uResolution;
uniform vec4 uColorStart;
uniform vec4 uColorEnd;
uniform float uParticleSize;

out vec4 vColor;
out float vLife;

void main() {
    if (aPosition.x < -10000.0 || aLife <= 0.0) {
        gl_Position = vec4(-10.0, -10.0, -10.0, 1.0);
        gl_PointSize = 0.0;
        vColor = vec4(0.0);
        vLife = 0.0;
        return;
    }

    vec2 clipPos = (aPosition / uResolution) * 2.0 - 1.0;
    clipPos.y = -clipPos.y;
    gl_Position = vec4(clipPos, 0.0, 1.0);

    float lifeRatio = clamp(aLife, 0.0, 1.0);
    float sizeFactor = (0.25 + 0.75 * lifeRatio);
    gl_PointSize = uParticleSize * sizeFactor;

    vec4 color = mix(uColorEnd, uColorStart, lifeRatio);
    color.a *= lifeRatio;
    vColor = color;
    vLife = lifeRatio;
}
`;

export const RENDER_FRAG = `#version 300 es
precision highp float;

in vec4 vColor;
in float vLife;
out vec4 fragColor;

void main() {
    if (vColor.a <= 0.001) discard;

    vec2 coord = gl_PointCoord - 0.5;
    float dist = length(coord);
    if (dist > 0.5) discard;

    float glow = exp(-dist * dist * 12.0);
    float core = smoothstep(0.5, 0.0, dist);
    float alpha = (core * 0.55 + glow * 0.7) * vColor.a;

    vec3 color = vColor.rgb * (0.6 + 0.7 * core);

    fragColor = vec4(color, alpha);
}
`;
