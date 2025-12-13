import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js';
import { MeshSurfaceSampler } from 'three/addons/math/MeshSurfaceSampler.js';
import { Pane } from 'tweakpane';


import GridVertexShader from './Shader/GridShader/vertex.glsl';
import GridFragmentShader from './Shader/GridShader/fragment.glsl';

import BushVertexShader from './Shader/Bush/vertex.glsl';
import BushFragmentShader from './Shader/Bush/fragment.glsl';


/**
 * Base
 */
// Debug
const pane = new Pane({
    title: 'Debug Pane'
});
const debugLight = {
    azimuth: 45,       //left-right
    elevation: 45      //up-down
}

pane.addBinding(
    debugLight, 'azimuth', {
        min: -180,
        max: 180,
        step: 1,
        label: 'Light Azimuth (Left-Right)'
    }
);

pane.addBinding(
    debugLight, 'elevation', {
        min: 0,
        max: 90,
        step: 1,
        label: 'Light Elevation (Up-Down)'
    }
);

const lightDirection = new THREE.Vector3();

const updateLightDirection = () => {
    const az = THREE.MathUtils.degToRad(debugLight.azimuth);
    const el = THREE.MathUtils.degToRad(debugLight.elevation);

    lightDirection.set(
        Math.cos(el) * Math.cos(az),
        Math.sin(el),
        Math.cos(el) * Math.sin(az)
    ).normalize();
}


// Canvas
const canvas = document.querySelector('canvas.webgl');

// Scene
const scene = new THREE.Scene();
scene.background = new THREE.Color("#ffffff");

const axisHelper = new THREE.AxesHelper(2);
scene.add(axisHelper);

//Grid
const GridMaterial = new THREE.ShaderMaterial({
    transparent: true,
    side: THREE.DoubleSide,
    uniforms: {
        uSize: new THREE.Uniform(1.0),
        uThickness: new THREE.Uniform(1.5),
        uFadeDistance: new THREE.Uniform(20.0),
    },
    vertexShader: GridVertexShader,
    fragmentShader: GridFragmentShader
})

const gridPlane = new THREE.Mesh(
    new THREE.PlaneGeometry(200, 200),
    GridMaterial
);
gridPlane.rotation.x = - Math.PI * 0.5;
// scene.add(gridPlane);

const grid = new THREE.GridHelper(
  200,   // size
  200,   // divisions
  0x000000, // center line color
  0xcccccc  // grid line color
);
// scene.add(grid);

/**
 * Geometry
 */

const gltfLoader = new GLTFLoader();
const dracoLoader = new DRACOLoader();
dracoLoader.setDecoderPath('https://www.gstatic.com/draco/versioned/decoders/1.5.6/');
gltfLoader.setDRACOLoader(dracoLoader);

const BushEmitterModel = await gltfLoader.loadAsync(
    './Models/BushEmittercmp.glb'
);
const emitterMesh = BushEmitterModel.scene.children[0];
// emitterMesh.visible = false;
// scene.add(emitterMesh);

//Preparing geometry for surface sampling
const samplerGeometry = emitterMesh.geometry.clone();
samplerGeometry.applyMatrix4(emitterMesh.matrixWorld);
const nonIndexedGeometry = samplerGeometry.toNonIndexed();

const tempMesh = new THREE.Mesh(
    nonIndexedGeometry,
    new THREE.MeshBasicMaterial()
);

const sampler = new MeshSurfaceSampler(tempMesh).build();

// Geometry
let count = 20;

const planeGeometry = new THREE.PlaneGeometry(1, 1);
// Material
const material = new THREE.ShaderMaterial({
    transparent: true,
    side: THREE.DoubleSide,
    uniforms: {
        uLightDirection : new THREE.Uniform(lightDirection)
    },
    vertexShader: BushVertexShader,
    fragmentShader: BushFragmentShader,
});

// Instanced Mesh
const instancedBush = new THREE.InstancedMesh(planeGeometry, material, count);
scene.add(instancedBush);

const dummy = new THREE.Object3D();
const position = new THREE.Vector3();
const normal = new THREE.Vector3();
console.log(sampler);

const instanceNormals = new Float32Array(count * 3);


for (let i = 0; i < count; i++) {
    sampler.sample(position, normal);

    instanceNormals[i * 3 + 0] = normal.x;
    instanceNormals[i * 3 + 1] = normal.y;
    instanceNormals[i * 3 + 2] = normal.z;

    dummy.position.copy(position);
    const scale = Math.random() * 0.5 + 1.0;
    dummy.scale.set(scale, scale, scale);

    dummy.updateMatrix();
    instancedBush.setMatrixAt(i, dummy.matrix);

}

//attaching the instance normals as an attribute
instancedBush.geometry.setAttribute(
    'instanceNormal',
    new THREE.InstancedBufferAttribute(instanceNormals, 3)
);

instancedBush.instanceMatrix.needsUpdate = true;

/**
 * Sizes
 */
const sizes = {
    width: window.innerWidth,
    height: window.innerHeight
};

window.addEventListener('resize', () =>
{
    // Update sizes
    sizes.width = window.innerWidth;
    sizes.height = window.innerHeight;

    // Update camera
    camera.aspect = sizes.width / sizes.height;
    camera.updateProjectionMatrix();

    // Update renderer
    renderer.setSize(sizes.width, sizes.height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
});

/**
 * Camera
 */
// Base camera
const camera = new THREE.PerspectiveCamera(75, sizes.width / sizes.height, 0.1, 100);
camera.position.set(2, 2, 2);
scene.add(camera);

function updateGrid(camera) {
  gridPlane.position.x = Math.floor(camera.position.x);
  gridPlane.position.z = Math.floor(camera.position.z);
}

// Controls
const controls = new OrbitControls(camera, canvas);
controls.enableDamping = true;

/**
 * Renderer
 */
const renderer = new THREE.WebGLRenderer({
    canvas: canvas
});
renderer.setSize(sizes.width, sizes.height);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

/**
 * Animate
 */
const clock = new THREE.Clock();

const tick = () =>
{
    const elapsedTime = clock.getElapsedTime();

    updateLightDirection();
    material.uniforms.uLightDirection.value.copy(lightDirection);


    // Update controls
    controls.update();

    // Render
    renderer.render(scene, camera);
    updateGrid(camera);

    // Call tick again on the next frame
    window.requestAnimationFrame(tick);
};

tick();