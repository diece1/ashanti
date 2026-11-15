import * as THREE from "three";
import RAPIER from "@dimforge/rapier3d-compat";
import type { Chapter } from "./chapters";

export interface Collectible {
  mesh: THREE.Mesh;
  taken: boolean;
}

export interface Environment {
  root: THREE.Group;
  rigidBodies: RAPIER.RigidBody[];
  collectibles: Collectible[];
  exit: THREE.Vector3;
  occluders: THREE.Object3D[];
  dispose(world: RAPIER.World, scene: THREE.Scene): void;
}

function randomFor(seed: number): () => number {
  let value = seed >>> 0;
  return () => {
    value += 0x6d2b79f5;
    let t = value;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function makeMaterial(color: number, roughness = 1): THREE.MeshStandardMaterial {
  return new THREE.MeshStandardMaterial({ color, roughness, flatShading: true });
}

function disposeTree(root: THREE.Object3D): void {
  root.traverse((object) => {
    if (!(object instanceof THREE.Mesh)) return;
    object.geometry.dispose();
    const materials = Array.isArray(object.material) ? object.material : [object.material];
    materials.forEach((material) => material.dispose());
  });
}

export function createEnvironment(
  scene: THREE.Scene,
  physics: RAPIER.World,
  chapter: Chapter,
): Environment {
  const random = randomFor(chapter.id * 911 + 247);
  const root = new THREE.Group();
  root.name = `chapter-${chapter.id}`;
  scene.add(root);
  const rigidBodies: RAPIER.RigidBody[] = [];
  const occluders: THREE.Object3D[] = [];
  const collectibles: Collectible[] = [];
  const addStaticBox = (position: THREE.Vector3, half: THREE.Vector3): void => {
    const body = physics.createRigidBody(
      RAPIER.RigidBodyDesc.fixed().setTranslation(position.x, position.y, position.z),
    );
    physics.createCollider(
      RAPIER.ColliderDesc.cuboid(half.x, half.y, half.z).setFriction(0.9),
      body,
    );
    rigidBodies.push(body);
  };
  const addMesh = (
    geometry: THREE.BufferGeometry,
    material: THREE.Material,
    position: THREE.Vector3,
    scale = new THREE.Vector3(1, 1, 1),
  ): THREE.Mesh => {
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.copy(position);
    mesh.scale.copy(scale);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    root.add(mesh);
    return mesh;
  };

  const groundMaterial = makeMaterial(chapter.palette.ground);
  const ground = addMesh(
    new THREE.BoxGeometry(190, 2, 190),
    groundMaterial,
    new THREE.Vector3(0, -1, 0),
  );
  ground.receiveShadow = true;
  addStaticBox(new THREE.Vector3(0, -1, 0), new THREE.Vector3(95, 1, 95));

  const path = addMesh(
    new THREE.PlaneGeometry(13, 135),
    makeMaterial(chapter.palette.path),
    new THREE.Vector3(0, 0.015, -5),
  );
  path.rotation.x = -Math.PI / 2;
  path.receiveShadow = true;

  const river = addMesh(
    new THREE.PlaneGeometry(178, 11),
    new THREE.MeshStandardMaterial({
      color: chapter.palette.water,
      roughness: 0.28,
      metalness: 0.08,
      transparent: true,
      opacity: 0.88,
    }),
    new THREE.Vector3(0, 0.04, -24),
  );
  river.rotation.x = -Math.PI / 2;

  const bridgeMaterial = makeMaterial(chapter.palette.path, 0.85);
  for (let i = 0; i < 7; i++) {
    const z = -29 + i * 1.55;
    addMesh(
      new THREE.BoxGeometry(9, 0.35, 1.35),
      bridgeMaterial,
      new THREE.Vector3(0, 0.28, z),
    );
  }
  addStaticBox(new THREE.Vector3(0, 0.2, -24), new THREE.Vector3(4.5, 0.2, 5.5));

  const trunkMaterial = makeMaterial(0x513a28);
  const leafMaterial = makeMaterial(chapter.palette.foliage);
  const canopyMaterial = makeMaterial(chapter.palette.accent);
  const trunkGeometry = new THREE.CylinderGeometry(0.28, 0.52, 4.8, 6);
  const canopyGeometry = new THREE.ConeGeometry(3.1, 6.2, 7, 1);
  const canopySmallGeometry = new THREE.ConeGeometry(2.4, 4.4, 7, 1);
  const count = 124;
  const trunks = new THREE.InstancedMesh(trunkGeometry, trunkMaterial, count);
  const canopies = new THREE.InstancedMesh(canopyGeometry, leafMaterial, count);
  const tops = new THREE.InstancedMesh(canopySmallGeometry, canopyMaterial, count);
  trunks.castShadow = canopies.castShadow = tops.castShadow = true;
  trunks.receiveShadow = true;
  const dummy = new THREE.Object3D();
  let treeCount = 0;
  for (let i = 0; i < count * 2 && treeCount < count; i++) {
    const x = (random() * 2 - 1) * 84;
    const z = (random() * 2 - 1) * 82;
    if (Math.abs(x) < 10 || (Math.abs(z + 24) < 9 && Math.abs(x) < 10)) continue;
    const scale = 0.72 + random() * 0.78;
    dummy.position.set(x, 2.4 * scale, z);
    dummy.scale.setScalar(scale);
    dummy.rotation.y = random() * Math.PI;
    dummy.updateMatrix();
    trunks.setMatrixAt(treeCount, dummy.matrix);
    dummy.position.y = 5.1 * scale;
    dummy.scale.setScalar(scale);
    dummy.updateMatrix();
    canopies.setMatrixAt(treeCount, dummy.matrix);
    dummy.position.y = 7.6 * scale;
    dummy.scale.setScalar(scale * 0.82);
    dummy.updateMatrix();
    tops.setMatrixAt(treeCount, dummy.matrix);
    if (treeCount < 46 && Math.abs(x) < 30) {
      const body = physics.createRigidBody(
        RAPIER.RigidBodyDesc.fixed().setTranslation(x, 2.1 * scale, z),
      );
      physics.createCollider(
        RAPIER.ColliderDesc.cylinder(2.1 * scale, 0.42 * scale),
        body,
      );
      rigidBodies.push(body);
    }
    treeCount++;
  }
  trunks.count = canopies.count = tops.count = treeCount;
  trunks.instanceMatrix.needsUpdate = canopies.instanceMatrix.needsUpdate = true;
  tops.instanceMatrix.needsUpdate = true;
  root.add(trunks, canopies, tops);
  occluders.push(trunks, canopies, tops);

  const rockGeometry = new THREE.DodecahedronGeometry(1.7, 0);
  const rockMaterial = makeMaterial(0x657067);
  const rocks = new THREE.InstancedMesh(rockGeometry, rockMaterial, 34);
  rocks.castShadow = true;
  rocks.receiveShadow = true;
  for (let i = 0; i < rocks.count; i++) {
    const side = i % 2 ? -1 : 1;
    const x = side * (11 + random() * 54);
    const z = -78 + random() * 154;
    const sx = 0.6 + random() * 1.5;
    dummy.position.set(x, 0.5 + random() * 0.5, z);
    dummy.scale.set(sx, 0.6 + random(), 0.7 + random() * 1.2);
    dummy.rotation.set(random(), random() * Math.PI, random() * 0.18);
    dummy.updateMatrix();
    rocks.setMatrixAt(i, dummy.matrix);
  }
  rocks.instanceMatrix.needsUpdate = true;
  root.add(rocks);
  occluders.push(rocks);

  const pillarMaterial = makeMaterial(chapter.palette.path);
  if ([1, 4, 6, 7].includes(chapter.id)) {
    for (const x of [-7, 7]) {
      const pillar = addMesh(
        new THREE.CylinderGeometry(1, 1.25, 8, 6),
        pillarMaterial,
        new THREE.Vector3(x, 4, -69),
      );
      addStaticBox(new THREE.Vector3(x, 4, -69), new THREE.Vector3(1, 4, 1));
      occluders.push(pillar);
    }
    addMesh(
      new THREE.BoxGeometry(16, 1.5, 2),
      pillarMaterial,
      new THREE.Vector3(0, 8.3, -69),
    );
  } else {
    const altar = addMesh(
      new THREE.CylinderGeometry(3, 4, 1.4, 7),
      pillarMaterial,
      new THREE.Vector3(0, 0.7, -69),
    );
    altar.material = new THREE.MeshStandardMaterial({
      color: chapter.palette.accent,
      emissive: chapter.palette.accent,
      emissiveIntensity: 0.18,
      flatShading: true,
    });
  }

  const exit = new THREE.Vector3(0, 0, -72);
  const exitRing = addMesh(
    new THREE.TorusGeometry(2.8, 0.24, 6, 12),
    new THREE.MeshStandardMaterial({
      color: chapter.palette.accent,
      emissive: chapter.palette.accent,
      emissiveIntensity: 0.55,
      flatShading: true,
    }),
    new THREE.Vector3(0, 3.2, -71),
  );
  exitRing.rotation.x = Math.PI / 2;

  const soulGeometry = new THREE.OctahedronGeometry(0.5, 0);
  const soulMaterial = new THREE.MeshStandardMaterial({
    color: chapter.palette.accent,
    emissive: chapter.palette.accent,
    emissiveIntensity: 0.65,
    flatShading: true,
  });
  for (const z of [38, 12, -9, -44]) {
    const x = (random() - 0.5) * 5;
    const mesh = addMesh(
      soulGeometry,
      soulMaterial,
      new THREE.Vector3(x, 1.25, z),
    );
    collectibles.push({ mesh, taken: false });
  }

  const dispose = (currentWorld: RAPIER.World, currentScene: THREE.Scene): void => {
    rigidBodies.forEach((body) => currentWorld.removeRigidBody(body));
    currentScene.remove(root);
    disposeTree(root);
  };
  return { root, rigidBodies, collectibles, exit, occluders, dispose };
}
