attribute vec3 instanceNormal;

varying vec3 vInstanceNormal;
varying vec2 vUv;
varying vec3 vWorldPosition;

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

    // build billbpard vertex position
    vec3 billboardVertexPosition = worldPosition
        + (cameraRight * position.x * scaleX)
        + (cameraUp * position.y * scaleY);


    gl_Position = projectionMatrix * viewMatrix * vec4(billboardVertexPosition, 1.0);

    vInstanceNormal = instanceNormal;
    vUv = uv;
    vWorldPosition = billboardVertexPosition;

}