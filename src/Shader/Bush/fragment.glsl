varying vec3 vInstanceNormal;

uniform vec3 uLightDirection;

void main(){
    vec3 n = normalize(vInstanceNormal);
    vec3 directionalLightDirection = normalize(uLightDirection);
    float ndl = dot(n, directionalLightDirection);
    ndl = clamp(ndl * 0.6 + 0.4, 0.0, 1.0);

    vec3 baseColor = vec3(0.25, 0.6, 0.35);
    gl_FragColor = vec4(baseColor * ndl, 1.0);
}