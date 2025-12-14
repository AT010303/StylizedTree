varying vec3 vInstanceNormal;
varying vec2 vUv;

uniform vec3 uLightDirection;
uniform sampler2D uAlphaMap;
uniform vec3 uShadowColor;
uniform vec3 uMidColor;
uniform vec3 uHighlightColor;

vec3 ambientLight(vec3 lightColor, float lightIntensity){
    return lightColor * lightIntensity;
}

vec3 colorRamp(float t){
    if(t<0.5){
        return mix(uShadowColor, uMidColor, t * 2.0);
    } else {
        return mix(uMidColor, uHighlightColor, (t - 0.5) * 2.0);
    }
}

void main(){

    float alpha = texture2D(uAlphaMap, vUv).r;
    float a = smoothstep(0.4, 0.6, alpha);
    if(a < 0.01){
        discard;
    }

    vec3 surfaceNormal = normalize(vInstanceNormal);
    vec3 directionalLightDirection = normalize(uLightDirection);
    float ndl = dot(surfaceNormal, directionalLightDirection); // dot of normal and light direction
    ndl = clamp(ndl * 0.6 + 0.4, 0.0, 1.0);  // remap [-1.0, 1.0] to [0.4, 1.0] range so nothing is pitch black

    vec3 color = colorRamp(ndl);

    vec3 light = vec3(0.0);
    light += ambientLight(
        vec3(1.0), // light color
        0.3           // light intensity
    );
    color += uMidColor * light;       // adding because we dont want BSDF like material effect 
    // for real lighing we would multiply but we want to keep it stylized so we add

    gl_FragColor = vec4(color, 1.0);

    #include <tonemapping_fragment>
    #include <colorspace_fragment>
}