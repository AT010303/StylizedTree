varying vec3 vInstanceNormal;
varying vec2 vUv;

uniform vec3 uLightDirection;
uniform sampler2D uAlphaMap;
uniform vec3 uShadowColor;
uniform vec3 uMidColor;
uniform vec3 uHighlightColor;

void main(){
    float alpha = texture2D(uAlphaMap, vUv).r;
    float a = smoothstep(0.5, 0.6, alpha);
    if(a < 0.01){
        discard;
    }

    vec3 surfaceNormal = normalize(vInstanceNormal);
    vec3 LightDirection = normalize(uLightDirection);
    float ndl = dot(surfaceNormal, LightDirection);
    ndl = (ndl + 1.0) * 0.5;
    ndl = max(ndl, 0.0);
    vec3 color = vec3(1.0);
    if(ndl < 0.5){
        color = mix(uShadowColor, uMidColor, ndl * 2.0);
    } else {
        color = mix(uMidColor, uHighlightColor, (ndl - 0.5) * 2.0);
    }
    
    csm_DiffuseColor = vec4(color,1.0);
}