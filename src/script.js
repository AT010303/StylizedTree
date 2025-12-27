import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js';
import { MeshSurfaceSampler } from 'three/addons/math/MeshSurfaceSampler.js';
import { TextureLoader } from 'three/src/loaders/TextureLoader.js';
import { Pane } from 'tweakpane';

import Stats from 'stats.js';

import { FallingLeavesSystem } from './leaf.js';

import BushVertexShader from './Shader/Bush/vertex.glsl';
import BushFragmentShader from './Shader/Bush/fragment.glsl';

const stats = new Stats()
stats.showPanel(0) // 0: fps, 1: ms, 2: mb, 3+: custom
document.body.appendChild(stats.dom)


/**
 * Base
 */
// Debug
const pane = new Pane({
    title: 'Debug Pane'
});

const bushLight = pane.addFolder({
    title: 'Bush Light & Color',
    expanded: false
})

const bushWind = pane.addFolder({
    title: 'Bush Wind',
    expanded: false
});

const treeBark = pane.addFolder({
    title: 'Tree Bark',
    expanded: false
});

const debugLight = {
    azimuth: 120,       //left-right
    elevation: 60     //up-down
};

const treeRotation = {
    rotation : 4.75
}

const bushColor = {
    shadow : '#006969',
    mid: '#00cf27',
    highlight: '#9fff00'
};

bushLight.addBinding(
    debugLight, 'azimuth', {
        min: -180,
        max: 180,
        step: 1,
        label: 'Light Azimuth (Left-Right)'
    }
);

bushLight.addBinding(
    debugLight, 'elevation', {
        min: 0,
        max: 90,
        step: 1,
        label: 'Light Elevation (Up-Down)'
    }
);

const bushWindParams = {
    smallWindSpeed: 0.25,
    smallWindScale: 10.0,
    smallWindStrength: 1.5,
    largeWindSpeed: 0.2,
    largeWindScale: 2.5,
    largeWindStrength: 0.5
};

bushWind.addBinding(
    bushWindParams, 'smallWindSpeed', {
        min: 0.0,
        max: 1.0,
        step: 0.01,
        label: 'Small Wind Speed'
    }
);
bushWind.addBinding(
    bushWindParams, 'smallWindScale', {
        min: 0.0,
        max: 20.0,
        step: 0.1,
        label: 'Small Wind Scale'
    }
);

bushWind.addBinding(
    bushWindParams, 'smallWindStrength', {
        min: 0.0,
        max: 5.0,
        step: 0.1,
        label: 'Small Wind Strength'
    }
);

bushWind.addBinding(
    bushWindParams, 'largeWindSpeed', {
        min: 0.0,
        max: 1.0,
        step: 0.01,
        label: 'Large Wind Speed'
    }
);
bushWind.addBinding(
    bushWindParams, 'largeWindScale', {
        min: 0.0,
        max: 5.0,
        step: 0.1,
        label: 'Large Wind Scale'
    }
);

bushWind.addBinding(
    bushWindParams, 'largeWindStrength', {
        min: 0.0,
        max: 2.0,
        step: 0.1,
        label: 'Large Wind Strength'
    }
);

bushLight.addBinding(
    bushColor, 'shadow'
);
bushLight.addBinding(
    bushColor, 'mid'
);
bushLight.addBinding(
    bushColor, 'highlight'
);

treeBark.addBinding(
    treeRotation, 'rotation', {
        min: 0,
        max: Math.PI * 2,
        step: 0.01,
        label: 'Tree Rotation'
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

//land
const landGeometry = new THREE.PlaneGeometry(200, 200);
const landMaterial = new THREE.MeshStandardMaterial({
    color: new THREE.Color("#ffffff"),
    roughness: 0.0,
    metalness: 0.0,
    side: THREE.DoubleSide
});
const landMesh = new THREE.Mesh(landGeometry, landMaterial);
landMesh.rotation.x = - Math.PI * 0.5;
landMesh.position.y = -0.01;
landMesh.receiveShadow = true;
scene.add(landMesh);


const gltfLoader = new GLTFLoader();
const dracoLoader = new DRACOLoader();
dracoLoader.setDecoderPath('https://www.gstatic.com/draco/versioned/decoders/1.5.6/');
gltfLoader.setDRACOLoader(dracoLoader);

const BushEmitterModel = await gltfLoader.loadAsync(
    './Models/BushEmittercmp.glb'
);
const emitterMesh = BushEmitterModel.scene.children[0];

//Preparing geometry for surface sampling
const samplerGeometry = emitterMesh.geometry.clone();
samplerGeometry.applyMatrix4(emitterMesh.matrixWorld);
const nonIndexedGeometry = samplerGeometry.toNonIndexed();

const tempMesh = new THREE.Mesh(
    nonIndexedGeometry,
    new THREE.MeshBasicMaterial()
);

const mulberry32 = (seed) => {
    return function () {
        let t = seed += 0x6D2B79F5;
        t = Math.imul(t ^ (t >>> 15), t | 1);
        t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
}

const sampler = new MeshSurfaceSampler(tempMesh).setRandomGenerator(mulberry32(12345)).build();

// Geometry
let count = 25;

const planeGeometry = new THREE.PlaneGeometry(1, 1);
// Material
const textureLoader = new TextureLoader();
const leaveAlphaTexture = await textureLoader.loadAsync('./Textures/Leave_alpha.png');

const material = new THREE.ShaderMaterial({
    side: THREE.DoubleSide,
    uniforms: {
        uTime: new THREE.Uniform(0.0),
        uLightDirection : new THREE.Uniform(lightDirection),
        uAlphaMap: new THREE.Uniform(leaveAlphaTexture),
        uShadowColor: new THREE.Uniform(new THREE.Color(bushColor.shadow)),
        uMidColor: new THREE.Uniform(new THREE.Color(bushColor.mid)),
        uHighlightColor: new THREE.Uniform(new THREE.Color(bushColor.highlight)),

        uSmallWindSpeed: new THREE.Uniform(bushWindParams.smallWindSpeed),
        uSmallWindScale: new THREE.Uniform(bushWindParams.smallWindScale),
        uSmallWindStrength: new THREE.Uniform(bushWindParams.smallWindStrength),

        uLargeWindSpeed: new THREE.Uniform(bushWindParams.largeWindSpeed),
        uLargeWindScale: new THREE.Uniform(bushWindParams.largeWindScale),
        uLargeWindStrength: new THREE.Uniform(bushWindParams.largeWindStrength),
    },
    vertexShader: BushVertexShader,
    fragmentShader: BushFragmentShader,
    depthTest: true,
    depthWrite: true,
    transparent: false,
});


bushLight.on('change', ()=> {
    material.uniforms.uShadowColor.value.set(bushColor.shadow);
    material.uniforms.uMidColor.value.set(bushColor.mid);
    material.uniforms.uHighlightColor.value.set(bushColor.highlight);
})

bushWind.on('change', ()=> {
    material.uniforms.uSmallWindSpeed.value = bushWindParams.smallWindSpeed;
    material.uniforms.uSmallWindScale.value = bushWindParams.smallWindScale;
    material.uniforms.uSmallWindStrength.value = bushWindParams.smallWindStrength;

    material.uniforms.uLargeWindSpeed.value = bushWindParams.largeWindSpeed;
    material.uniforms.uLargeWindScale.value = bushWindParams.largeWindScale;
    material.uniforms.uLargeWindStrength.value = bushWindParams.largeWindStrength;
});

const createBush = ({
    position = new THREE.Vector3(),
    leafCount = 25,
    scale = 1.0
}) => {

    const instancedBush = new THREE.InstancedMesh(
        planeGeometry, 
        material, 
        leafCount
    );

    instancedBush.position.copy(position);

    const instanceNormals = new Float32Array(count * 3);
    const dummy = new THREE.Object3D();
    const positionL = new THREE.Vector3();
    const normal = new THREE.Vector3();

    for(let i=0; i<leafCount; i++){
        sampler.sample(positionL, normal);

        dummy.position.copy(positionL).add(position);
        const s = Math.random() * 0.5 + scale;
        dummy.scale.set(s, s, s);

        dummy.updateMatrix();
        instancedBush.setMatrixAt(i, dummy.matrix);

        instanceNormals[i * 3 + 0] = normal.x;
        instanceNormals[i * 3 + 1] = normal.y;
        instanceNormals[i * 3 + 2] = normal.z;
    }

    instancedBush.geometry.setAttribute(
        'instanceNormal',
        new THREE.InstancedBufferAttribute(instanceNormals, 3)
    );
    instancedBush.instanceMatrix.needsUpdate = true;
    instancedBush.castShadow = true;
    instancedBush.receiveShadow = true;
    instancedBush.frustumCulled = false;
    scene.add(instancedBush);
    return instancedBush;
}
//Dummy bush for testing shaders
// createBush({ position: new THREE.Vector3( 0, 2,  0.00), leafCount: 25, scale: 1.5});

createBush({ position: new THREE.Vector3( 1.25, 2.25,  0.00), leafCount: 15, scale: 1.0});
createBush({ position: new THREE.Vector3(-1.80, 2.35, -0.20), leafCount: 25, scale: 0.8});
createBush({ position: new THREE.Vector3( 0.25, 3.00,  0.00), leafCount: 20, scale: 1.2});
createBush({ position: new THREE.Vector3(-1.00, 4.00,  1.00), leafCount: 30, scale: 1.0});
createBush({ position: new THREE.Vector3( 1.00, 4.00,  0.00), leafCount: 20, scale: 0.8});
createBush({ position: new THREE.Vector3( 2.00, 4.00, -0.50), leafCount: 25, scale: 1.0});
createBush({ position: new THREE.Vector3(-2.00, 4.00,  0.50), leafCount: 25, scale: 1.2});
createBush({ position: new THREE.Vector3(-1.00, 5.00, -0.50), leafCount: 10, scale: 1.0});
createBush({ position: new THREE.Vector3( 1.00, 5.00,  0.50), leafCount: 20, scale: 0.6});
createBush({ position: new THREE.Vector3( 0.00, 6.00,  0.50), leafCount: 15, scale: 1.0});
createBush({ position: new THREE.Vector3( 1.50, 6.00,  0.50), leafCount: 20, scale: 0.8});
createBush({ position: new THREE.Vector3(-1.50, 6.00,  0.50), leafCount: 15, scale: 1.0});
createBush({ position: new THREE.Vector3( 0.50, 7.00,  0.50), leafCount: 15, scale: 0.7});
createBush({ position: new THREE.Vector3(-0.50, 7.00, -0.50), leafCount: 10, scale: 0.7});
createBush({ position: new THREE.Vector3( 0.00, 8.00,  0.50), leafCount: 15, scale: 1.0});



//leafs
const treeBounds = {
    yMin: 1.0,
    yMax: 7.5,   // The highest bush is around
    xRange: 6.0, // Spans from -3 to 3 roughly
    zRange: 2.0
};

const leaf = await gltfLoader.loadAsync('./Models/leaf2.glb');
const leafGeometry = leaf.scene.children[0].geometry;
const fallingLeaves = new FallingLeavesSystem(
    scene,  
    leafGeometry,
    treeBounds,
    bushColor.highlight
);


//Branches
const tree = await gltfLoader.loadAsync('./Models/Branchescmp.glb');
const treeMesh = tree.scene.children[0];
const treeMaterial = new THREE.MeshStandardMaterial({
    color: new THREE.Color("#64401d"),
    roughness: 1.0,
    metalness: 0.0
});
treeMesh.material = treeMaterial;
treeMesh.castShadow = true;
treeMesh.scale.set(0.15, 0.15, 0.15);
treeMesh.position.y = 0.135;
treeMesh.position.x = 0.0;
treeMesh.rotation.y = treeRotation.rotation;
scene.add(treeMesh);


//lights
const ambientLight = new THREE.AmbientLight(0xffffff, 2.0);
scene.add(ambientLight);
const directionalLight = new THREE.DirectionalLight(0xffffff, 3.0);
directionalLight.position.set(-15, 15, 7);
directionalLight.castShadow = true;
directionalLight.shadow.radius = 15;
directionalLight.shadow.mapSize.set(1024, 1024);

const d = 50;
directionalLight.shadow.camera.left = -d;
directionalLight.shadow.camera.right = d;
directionalLight.shadow.camera.top = d;
directionalLight.shadow.camera.bottom = -d;
directionalLight.shadow.camera.near = 1;
directionalLight.shadow.camera.far = 100;
directionalLight.shadow.bias = -0.0001;
directionalLight.shadow.normalBias = 0.03;

scene.add(directionalLight);

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
const camera = new THREE.PerspectiveCamera(45, sizes.width / sizes.height, 0.01, 1000);
camera.position.set(0, 5, 30);
scene.add(camera);

// Controls
const controls = new OrbitControls(camera, canvas);
controls.enableDamping = true;
controls.minDistance = 5;
controls.maxDistance = 100;
controls.maxPolarAngle = Math.PI / 1.807;
controls.target.set(0, 5, 0);
controls.panSpeed = 0.0

/**
 * Renderer
 */ 
const renderer = new THREE.WebGLRenderer({
    canvas: canvas
});
renderer.setSize(sizes.width, sizes.height);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.VSMShadowMap;


/**
 * Animate
 */
const clock = new THREE.Clock();

const tick = () =>
{
    stats.begin();
    const elapsedTime = clock.getElapsedTime();

    updateLightDirection();
    material.uniforms.uLightDirection.value.copy(lightDirection);
    material.uniforms.uTime.value = elapsedTime;

    treeMesh.rotation.y = treeRotation.rotation;

    if(fallingLeaves) fallingLeaves.update(0.01); // Fixed timestep for leafe scale consistency

    // Update controls
    controls.update();

    // Render
    renderer.render(scene, camera);

    // Call tick again on the next frame
    window.requestAnimationFrame(tick);
    stats.end();
};

tick();