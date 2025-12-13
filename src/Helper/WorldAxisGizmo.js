import * as THREE from 'three';

export default class WorldAxisGizmo {
    constructor(renderer, mainCamera, options = {}) {
        this.renderer = renderer;
        this.mainCamera = mainCamera;

        this.size = options.size ?? 0.18;
        this.margin = options.margin ?? 10;

        this.scene = new THREE.Scene();
        this.axes = new THREE.AxesHelper(1.5);
        this.scene.add(this.axes);

        this.camera = new THREE.OrthographicCamera(-2, 2, 2, -2, 0.1, 10);
        this.camera.position.set(0, 0, 5);
        this.camera.lookAt(0, 0, 0);

        this.axes.material.depthTest = false;
        this.axes.material.transparent = true;
        this.axes.material.opacity = 0.85;
    }

    render(viewportWidth, viewportHeight) {
        // Sync orientation
        this.axes.quaternion.copy(this.mainCamera.quaternion);

        const sizePx = Math.min(viewportWidth, viewportHeight) * this.size;

        this.renderer.clearDepth();
        this.renderer.setScissorTest(true);

        this.renderer.setScissor(
            viewportWidth - sizePx - this.margin,
            this.margin,
            sizePx,
            sizePx
        );

        this.renderer.setViewport(
            viewportWidth - sizePx - this.margin,
            this.margin,
            sizePx,
            sizePx
        );

        this.renderer.render(this.scene, this.camera);
        this.renderer.setScissorTest(false);
    }
}
