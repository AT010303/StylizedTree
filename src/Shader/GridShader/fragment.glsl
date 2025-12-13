varying vec3 vWorldPosition;
uniform float uSize;
uniform float uThickness;
uniform float uFadeDistance;

float gridLine(float coord){
    float line = abs(fract(coord - 0.5) - 0.5) / fwidth(coord);
    return 1.0 - smoothstep(0.0, uThickness, line);
}

void main() {
      float gx = gridLine(vWorldPosition.x / uSize);
      float gz = gridLine(vWorldPosition.z / uSize);
      float grid = max(gx, gz);

      float dist = length(vWorldPosition.xz);
      float fade = 1.0 - smoothstep(0.0, uFadeDistance, dist);

      float alpha = grid * fade;
      gl_FragColor = vec4(vec3(0.7), alpha);
    }