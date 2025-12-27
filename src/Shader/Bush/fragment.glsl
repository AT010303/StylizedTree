precision highp float;

varying vec3 vInstanceNormal;
varying vec2 vUv;
varying vec3 vWorldPosition;

uniform vec3 uLightDirection;
uniform sampler2D uAlphaMap;
uniform vec3 uShadowColor;
uniform vec3 uMidColor;
uniform vec3 uHighlightColor;

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
    // ndl = ndl * 0.5 + 0.5; // remap from [-1.0, 1.0] to [0.0, 1.0]
    ndl = clamp(ndl * 0.6 + 0.4, 0.0, 1.0);  // remap [-1.0, 1.0] to [0.4, 1.0] range so nothing is pitch black

    // vec3 color1 = colorRamp(worldPositionNormalized);
    vec3 color2 = colorRamp(ndl);
    vec3 color = color2;
    
    gl_FragColor = vec4(color, 1.0);

    #include <tonemapping_fragment>
    #include <colorspace_fragment>
}