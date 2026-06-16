export const UPDATE_VERT = `#version 300 es
precision highp float;

#define MAX_EXPLOSIONS 8

in vec2 aPosition;
in vec2 aVelocity;
in float aLife;
in float aMaxLife;
in float aSeed;
in float aExplosionId;
in float aPad;

uniform float uDeltaTime;
uniform float uTime;
uniform vec2 uResolution;
uniform vec2 uGravity;
uniform vec2 uWind;
uniform float uTurbulence;
uniform float uEmissionRate;

uniform vec2  uExpPos[MAX_EXPLOSIONS];
uniform float uExpTime[MAX_EXPLOSIONS];
uniform float uExpStrength[MAX_EXPLOSIONS];
uniform float uExpRadius[MAX_EXPLOSIONS];
uniform float uExpDuration[MAX_EXPLOSIONS];
uniform int   uExpCount;

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

vec2 noise2D(vec2 p) {
    return vec2(
        fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453) * 2.0 - 1.0,
        fract(sin(dot(p, vec2(269.5, 183.3))) * 43758.5453) * 2.0 - 1.0
    );
}

bool explosionActive(int i) {
    if (i >= uExpCount) return false;
    float t = uTime - uExpTime[i];
    return uExpStrength[i] > 0.0 && t >= 0.0 && t < uExpDuration[i];
}

float getExplosionIdFloat(int i) {
    return float(i + 1) * 10000.0 + uExpTime[i] * 100.0;
}

float getHighestExplosionId() {
    float maxId = 0.0;
    for (int i = 0; i < MAX_EXPLOSIONS; i++) {
        if (i >= uExpCount) break;
        if (explosionActive(i)) {
            float id = getExplosionIdFloat(i);
            if (id > maxId) maxId = id;
        }
    }
    return maxId;
}

void main() {
    float dt = uDeltaTime;
    float particleExplId = aExplosionId;

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

    float highestExpId = getHighestExplosionId();

    float burstTotal = 0.0;
    vec2 burstPos = vec2(0.0);
    float burstStrength = 0.0;
    float burstRadius = 0.0;
    float burstDuration = 0.0;
    float burstExpId = 0.0;

    if (highestExpId > particleExplId) {
        for (int i = 0; i < MAX_EXPLOSIONS; i++) {
            if (i >= uExpCount) break;
            if (!explosionActive(i)) continue;
            float expId = getExplosionIdFloat(i);
            if (expId <= particleExplId) continue;

            float t = uTime - uExpTime[i];
            if (t > 0.12) continue;

            float tNorm = t / 0.12;
            float envelope = (1.0 - tNorm) * (1.0 - tNorm);
            float prob = min(1.0, uExpStrength[i] * 0.000016) * envelope;
            float r = hash(aSeed + expId * 0.017 + float(i) * 97.3);

            if (r < prob) {
                burstTotal += 1.0;
                burstPos = uExpPos[i];
                burstStrength = uExpStrength[i];
                burstRadius = uExpRadius[i];
                burstDuration = uExpDuration[i];
                burstExpId = expId;
            }
        }
    }

    bool forcedBurst = burstTotal > 0.5;

    if (forcedBurst) {
        float s = aSeed + burstExpId * 0.037;
        float angle = hash(s * 3.1 + burstExpId * 0.017) * 6.2831853;
        float speedMin = 80.0 + burstStrength * 0.012;
        float speedMax = 260.0 + burstStrength * 0.07;
        float speed = hash(s * 1.7 + burstExpId * 0.071) * (speedMax - speedMin) + speedMin;
        newPos = burstPos;
        newVel = vec2(cos(angle), sin(angle)) * speed;
        newLife = 1.0;
        newMaxLife = hash(s * 2.9 + burstExpId * 0.0117) * 1.4 + 0.8;
        newSeed = s;
        newExplId = burstExpId;
    } else if (dead) {
        float s = aSeed;
        float respawned = 0.0;

        float bestExpId = -1.0;
        int bestIdx = -1;
        for (int i = 0; i < MAX_EXPLOSIONS; i++) {
            if (i >= uExpCount) break;
            if (!explosionActive(i)) continue;
            float expId = getExplosionIdFloat(i);
            if (expId <= particleExplId) continue;
            if (expId > bestExpId) {
                bestExpId = expId;
                bestIdx = i;
            }
        }

        if (bestIdx >= 0) {
            float consumeProb = min(1.0, uExpStrength[bestIdx] * 0.00007);
            float r = hash(s + bestExpId * 0.1317);
            if (r < consumeProb) {
                float angle = hash(s + bestExpId * 0.0173) * 6.2831853;
                float speedMin = 60.0 + uExpStrength[bestIdx] * 0.01;
                float speedMax = 220.0 + uExpStrength[bestIdx] * 0.05;
                float speed = hash(s + bestExpId * 0.0071) * (speedMax - speedMin) + speedMin;
                newPos = uExpPos[bestIdx];
                newVel = vec2(cos(angle), sin(angle)) * speed;
                newLife = 1.0;
                newMaxLife = hash(s + bestExpId * 0.0117) * 1.6 + 0.7;
                newSeed = s + bestExpId * 0.1013;
                newExplId = bestExpId;
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

        for (int i = 0; i < MAX_EXPLOSIONS; i++) {
            if (i >= uExpCount) break;
            if (!explosionActive(i)) continue;
            vec2 toParticle = aPosition - uExpPos[i];
            float dist = length(toParticle);
            if (dist < 0.5 || dist > uExpRadius[i] * 3.0) continue;
            float t = uTime - uExpTime[i];
            float dur = max(uExpDuration[i], 0.01);
            float decayT = exp(-t * 3.0 / dur);
            float decayD = exp(-dist / max(uExpRadius[i], 1.0));
            float force = uExpStrength[i] * 0.15 * decayT * decayD;
            acceleration += (toParticle / dist) * force;
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
in float aPad;

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
