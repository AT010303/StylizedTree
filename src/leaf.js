import * as THREE from 'three';

export class FallingLeavesSystem {
    constructor(scene, geometry, bounds) {
        this.count = 20; // density
        this.scene = scene;
        this.bounds = bounds; // leaves spawn area {yMin, yMax, xRange, zRange}
        

        this.material = new THREE.MeshStandardMaterial({
            color: new THREE.Color(0x7eb325),
        });

        this.mesh = new THREE.InstancedMesh(geometry, this.material, this.count);
        this.mesh.castShadow = true;
        this.scene.add(this.mesh);

        //Physics Data
        this.dummy = new THREE.Object3D();
        this.particles = [];

        for (let i = 0; i < this.count; i++) {
            this.particles.push({
                pos: new THREE.Vector3(),
                vel: new THREE.Vector3(),
                rot: new THREE.Euler(),
                rotSpeed: new THREE.Vector3(),
                scale: 1.0,
            });
            // Initialize random positions
            this.respawn(this.particles[i]);
            // Randomize Y start so they don't all fall at once
            this.particles[i].pos.y = Math.random() * (bounds.yMax - bounds.yMin) + bounds.yMin;
        }
    }

    respawn(p) {
        // Spawn somewhere in the tree canopy
        p.pos.x = (Math.random() - 0.5) * this.bounds.xRange;
        p.pos.y = this.bounds.yMax - (Math.random()); // Start near top
        p.pos.z = (Math.random() - 0.5) * this.bounds.zRange;

        // Reset velocity (falling down, drifting slightly)
        p.vel.set(
            (Math.random() + 0.25) * 0.05,  // X drift
            -(Math.random() * 0.01 + 0.02), // Y Fall speed
            (Math.random() - 0.2 ) * 0.05   // Z drift
        );

        // Random spin
        p.rot.set(Math.random() * 3, Math.random() * 3, Math.random() * 3);
        p.rotSpeed.set(
            (Math.random() - 0.5) * 0.1,
            (Math.random() - 0.5) * 0.1,
            (Math.random() - 0.5) * 0.1
        );
        
        p.scale = 0.0; // Start scale at 0 for "pop in" effect
    }

    update(dt) {
        for (let i = 0; i < this.count; i++) {
            const p = this.particles[i];

            // Move
            p.pos.add(p.vel);
            p.rot.x += p.rotSpeed.x;
            p.rot.y += p.rotSpeed.y;
            p.rot.z += p.rotSpeed.z;

            // Grow in effect
            if (p.scale < 0.8) p.scale += dt * 2.0;

            // Wind Sway (Simulated in JS to match your shader wind)
            p.pos.x += Math.sin(p.pos.y) * 0.001;

            // Update Instance
            this.dummy.position.copy(p.pos);
            this.dummy.rotation.copy(p.rot);
            const s = p.scale;
            this.dummy.scale.set(s, s, s);
            this.dummy.updateMatrix();
            
            this.mesh.setMatrixAt(i, this.dummy.matrix);

            // Respawn if too low
            if (p.pos.y < 0.0) { // Ground level
                this.respawn(p);
            }
        }
        this.mesh.instanceMatrix.needsUpdate = true;
    }
}