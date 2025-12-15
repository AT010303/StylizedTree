attribute vec3 instanceNormal;

varying vec3 vInstanceNormal;
varying vec2 vUv;
varying vec3 vWorldPosition;

uniform float uTime;

uniform float uSmallWindSpeed;
uniform float uSmallWindScale;
uniform float uSmallWindStrength;

uniform float uLargeWindSpeed;
uniform float uLargeWindScale;
uniform float uLargeWindStrength;


// Simplex / FBM helpers
float hash(vec3 p) {
    p = fract(p * 0.3183099 + vec3(0.1));
    p *= 17.0;
    return fract(p.x * p.y * p.z * (p.x + p.y + p.z));
}

float noise(vec3 p) {
    vec3 i = floor(p);
    vec3 f = fract(p);

    f = f * f * (3.0 - 2.0 * f);

    float n = mix(
        mix(mix(hash(i + vec3(0,0,0)), hash(i + vec3(1,0,0)), f.x),
            mix(hash(i + vec3(0,1,0)), hash(i + vec3(1,1,0)), f.x), f.y),
        mix(mix(hash(i + vec3(0,0,1)), hash(i + vec3(1,0,1)), f.x),
            mix(hash(i + vec3(0,1,1)), hash(i + vec3(1,1,1)), f.x), f.y),
        f.z
    );

    return n;
}

float fbm(vec3 p) {
    float value = 0.0;
    float amp = 0.5;
    for(int i = 0; i < 4; i++) {
        value += amp * noise(p);
        p *= 2.0;
        amp *= 0.5;
    }
    return value;
}


void main(){

    mat4 m = modelMatrix;

    #ifdef USE_INSTANCING
        m = instanceMatrix;
    #endif

    // Object position in world space (translation only)
    vec3 worldPosition = m[3].xyz;

    float scaleX = length(m[0].xyz);
    float scaleY = length(m[1].xyz);

    // Camera right and up vectors (from view matrix)
    vec3 cameraRight = vec3(
        viewMatrix[0][0],
        viewMatrix[1][0],
        viewMatrix[2][0]
    );

    vec3 cameraUp = vec3(
        viewMatrix[0][1],
        viewMatrix[1][1],
        viewMatrix[2][1]
    );

    float heightMask = clamp(position.y + 0.5, 0.0, 1.0);
    heightMask = pow(heightMask, 1.5);

    float smallNoise = fbm(
        (worldPosition + position) * uSmallWindScale + vec3(uTime * uSmallWindSpeed)
    ) - 0.5;

    float largeNoise = fbm(
        (worldPosition + position) * uLargeWindScale + vec3(uTime * uLargeWindSpeed)
    ) - 0.5;

    float wind = smallNoise * uSmallWindStrength + largeNoise * uLargeWindStrength;
    wind *= heightMask;

    //wind offset
    vec3 windOffset = cameraRight * wind * 0.25 + cameraUp * wind * 0.35;

    // build billbpard vertex position
    vec3 billboardVertexPosition = worldPosition
        + (cameraRight * position.x * scaleX)
        + (cameraUp * position.y * scaleY)
        + windOffset;


    gl_Position = projectionMatrix * viewMatrix * vec4(billboardVertexPosition, 1.0);

    vInstanceNormal = instanceNormal;
    vUv = uv;
    vWorldPosition = billboardVertexPosition;

}