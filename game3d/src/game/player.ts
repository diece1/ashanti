import * as THREE from "three";
import RAPIER from "@dimforge/rapier3d-compat";

export interface PlayerInput {
  forward: number;
  right: number;
  jump: boolean;
}

export class PlayerController {
  readonly root = new THREE.Group();
  readonly body: RAPIER.RigidBody;
  readonly collider: RAPIER.Collider;
  private readonly controller: RAPIER.KinematicCharacterController;
  private readonly legs: THREE.Mesh[] = [];
  private verticalSpeed = 0;
  private grounded = false;
  private walkCycle = 0;
  private readonly world: RAPIER.World;

  constructor(
    scene: THREE.Scene,
    world: RAPIER.World,
    start: THREE.Vector3,
  ) {
    this.world = world;
    const skin = new THREE.MeshStandardMaterial({ color: 0x75472f, flatShading: true });
    const tunic = new THREE.MeshStandardMaterial({ color: 0x283e35, flatShading: true });
    const cape = new THREE.MeshStandardMaterial({ color: 0x9d3029, flatShading: true });
    const gold = new THREE.MeshStandardMaterial({ color: 0xd7a64e, metalness: 0.12, flatShading: true });
    const hair = new THREE.MeshStandardMaterial({ color: 0x171816, flatShading: true });
    const addPart = (geometry: THREE.BufferGeometry, material: THREE.Material, position: THREE.Vector3): THREE.Mesh => {
      const part = new THREE.Mesh(geometry, material);
      part.position.copy(position);
      part.castShadow = true;
      part.receiveShadow = true;
      this.root.add(part);
      return part;
    };

    addPart(new THREE.CapsuleGeometry(0.34, 0.68, 3, 6), tunic, new THREE.Vector3(0, 1.05, 0));
    addPart(new THREE.SphereGeometry(0.3, 8, 6), skin, new THREE.Vector3(0, 1.84, -0.01));
    addPart(new THREE.SphereGeometry(0.305, 8, 4), hair, new THREE.Vector3(0, 2.02, 0.015));
    addPart(new THREE.ConeGeometry(0.53, 1.05, 5), cape, new THREE.Vector3(0, 0.98, 0.42));
    addPart(new THREE.TorusGeometry(0.32, 0.06, 4, 8), gold, new THREE.Vector3(0, 0.74, 0));
    for (const side of [-1, 1]) {
      const leg = addPart(
        new THREE.CapsuleGeometry(0.12, 0.48, 2, 5),
        tunic,
        new THREE.Vector3(side * 0.17, 0.31, 0),
      );
      this.legs.push(leg);
      addPart(
        new THREE.CylinderGeometry(0.09, 0.12, 0.65, 5),
        skin,
        new THREE.Vector3(side * 0.43, 1.12, 0),
      );
    }
    addPart(
      new THREE.CylinderGeometry(0.035, 0.055, 1.25, 5),
      gold,
      new THREE.Vector3(0.62, 1.2, -0.13),
    ).rotation.z = -0.28;

    this.root.traverse((object) => {
      if (object instanceof THREE.Mesh) object.frustumCulled = true;
    });
    scene.add(this.root);

    this.body = world.createRigidBody(
      RAPIER.RigidBodyDesc.kinematicPositionBased().setTranslation(start.x, start.y, start.z),
    );
    this.collider = world.createCollider(
      RAPIER.ColliderDesc.capsule(0.55, 0.32).setFriction(0),
      this.body,
    );
    this.controller = world.createCharacterController(0.02);
    this.controller.setSlideEnabled(true);
    this.controller.setMaxSlopeClimbAngle(Math.PI / 4);
    this.controller.setMinSlopeSlideAngle(Math.PI / 3);
    this.controller.enableAutostep(0.35, 0.2, true);
    this.syncModel();
  }

  get position(): THREE.Vector3 {
    const p = this.body.translation();
    return new THREE.Vector3(p.x, p.y, p.z);
  }

  get isGrounded(): boolean {
    return this.grounded;
  }

  reset(start: THREE.Vector3): void {
    this.body.setTranslation({ x: start.x, y: start.y, z: start.z }, true);
    this.body.setNextKinematicTranslation({ x: start.x, y: start.y, z: start.z });
    this.verticalSpeed = 0;
    this.grounded = false;
    this.syncModel();
  }

  update(
    delta: number,
    input: PlayerInput,
    cameraForward: THREE.Vector3,
    cameraRight: THREE.Vector3,
  ): void {
    const direction = cameraForward.clone().multiplyScalar(input.forward)
      .add(cameraRight.clone().multiplyScalar(input.right));
    if (direction.lengthSq() > 1) direction.normalize();

    if (input.jump && this.grounded) {
      this.verticalSpeed = 8.5;
      this.grounded = false;
    } else {
      this.verticalSpeed = Math.max(-28, this.verticalSpeed - 23 * delta);
    }

    const speed = 5.6;
    const desired = {
      x: direction.x * speed * delta,
      y: this.verticalSpeed * delta,
      z: direction.z * speed * delta,
    };
    this.controller.computeColliderMovement(this.collider, desired);
    const movement = this.controller.computedMovement();
    const current = this.body.translation();
    const next = {
      x: current.x + movement.x,
      y: current.y + movement.y,
      z: current.z + movement.z,
    };
    this.body.setNextKinematicTranslation(next);
    this.world.timestep = delta;
    this.world.step();
    this.grounded = this.controller.computedGrounded();
    if (this.grounded && this.verticalSpeed < 0) this.verticalSpeed = 0;
    this.syncModel();

    const moving = direction.lengthSq() > 0.02;
    if (moving) {
      this.root.rotation.y = Math.atan2(-direction.x, -direction.z);
      this.walkCycle += delta * (input.forward > 0 ? 10 : 7);
    }
    const stride = moving && this.grounded ? Math.sin(this.walkCycle) * 0.52 : 0;
    this.legs[0].rotation.x = stride;
    this.legs[1].rotation.x = -stride;
    this.root.position.y += moving && this.grounded ? Math.abs(Math.sin(this.walkCycle * 2)) * 0.035 : 0;
  }

  dispose(): void {
    this.world.removeRigidBody(this.body);
    this.root.removeFromParent();
    this.root.traverse((object) => {
      if (!(object instanceof THREE.Mesh)) return;
      object.geometry.dispose();
      const materials = Array.isArray(object.material) ? object.material : [object.material];
      materials.forEach((material) => material.dispose());
    });
  }

  private syncModel(): void {
    const position = this.body.translation();
    this.root.position.set(position.x, position.y - 0.9, position.z);
  }
}
