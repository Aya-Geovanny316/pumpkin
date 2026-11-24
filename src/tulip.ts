import * as THREE from 'three';
import { CONFIG, type TulipConfig } from './config';
import { organicFragment, petalVertex } from './shaders';

const pink = (index: number) => new THREE.Color(CONFIG.petalColors[index % CONFIG.petalColors.length]);
const green = (index: number) => new THREE.Color(CONFIG.stemColors[index % CONFIG.stemColors.length]);

function organicMaterial(color: THREE.Color, shadow: THREE.Color, time: { value: number }, growth: { value: number }) {
  return new THREE.ShaderMaterial({
    uniforms: {
      uColor: { value: color },
      uShadow: { value: shadow },
      uTime: time,
      uGrowth: growth,
      uBreeze: { value: CONFIG.motion.breeze }
    },
    vertexShader: petalVertex,
    fragmentShader: organicFragment,
    side: THREE.DoubleSide
  });
}

function makeTubeStem(height: number, lean: number, phase: number, time: { value: number }) {
  const points: THREE.Vector3[] = [];
  for (let i = 0; i <= 12; i += 1) {
    const t = i / 12;
    points.push(new THREE.Vector3(lean * t * t, height * t, Math.sin(phase + t * 1.6) * 0.07 * t));
  }
  const curve = new THREE.CatmullRomCurve3(points);
  const geometry = new THREE.TubeGeometry(curve, 18, 0.045, 6, false);
  const material = organicMaterial(green(1), green(2), time, { value: 1 });
  return new THREE.Mesh(geometry, material);
}

function makeLeaf(length: number, width: number, side: number, phase: number, time: { value: number }) {
  const segments = 14;
  const across = 5;
  const positions: number[] = [];
  const indices: number[] = [];
  for (let i = 0; i <= segments; i += 1) {
    const u = i / segments;
    for (let j = 0; j <= across; j += 1) {
      const v = j / across * 2 - 1;
      const taper = Math.sin(Math.PI * Math.pow(u, 0.72));
      const y = u * length;
      const x = side * v * width * taper * (0.9 - u * 0.25);
      const z = Math.sin(u * Math.PI) * 0.18 * (1 - Math.abs(v)) + Math.sin(phase + u * 3.0) * 0.018;
      positions.push(x, y, z);
    }
  }
  for (let i = 0; i < segments; i += 1) {
    for (let j = 0; j < across; j += 1) {
      const a = i * (across + 1) + j;
      const b = a + 1;
      const c = a + across + 1;
      const d = c + 1;
      indices.push(a, c, b, b, c, d);
    }
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  return new THREE.Mesh(geometry, organicMaterial(green(0), green(2), time, { value: 1 }));
}

function makePetal(height: number, width: number, angle: number, open: number, colorIndex: number, phase: number, time: { value: number }) {
  const vertical = 16;
  const horizontal = 8;
  const positions: number[] = [];
  const indices: number[] = [];
  for (let i = 0; i <= vertical; i += 1) {
    const u = i / vertical;
      // A broad lower cup and a softly rounded shoulder give the petal the
      // closed, cupped silhouette of a real tulip instead of a flat fan.
      const shoulder = Math.pow(Math.sin(Math.PI * Math.pow(u, 0.62)), 0.38);
    for (let j = 0; j <= horizontal; j += 1) {
      const v = j / horizontal * 2 - 1;
      const edge = 1 - Math.pow(Math.abs(v), 2.2) * 0.2;
      const curl = Math.pow(u, 1.85) * open * (0.25 + Math.abs(v) * 0.28);
      const x = v * width * shoulder * edge;
      const y = u * height + Math.sin(u * Math.PI) * 0.1;
      const frontBulge = Math.cos(v * Math.PI / 2) * (0.16 + 0.12 * Math.sin(u * Math.PI));
      const z = frontBulge + curl + Math.sin(phase + u * 2.1) * 0.012;
      positions.push(x, y, z);
    }
  }
  for (let i = 0; i < vertical; i += 1) {
    for (let j = 0; j < horizontal; j += 1) {
      const a = i * (horizontal + 1) + j;
      const b = a + 1;
      const c = a + horizontal + 1;
      const d = c + 1;
      indices.push(a, b, c, b, d, c);
    }
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  const material = organicMaterial(pink(colorIndex), new THREE.Color(CONFIG.petalColors[4]), time, { value: 1 });
  const mesh = new THREE.Mesh(geometry, material);
  mesh.rotation.y = angle;
  mesh.rotation.x = (0.08 + Math.abs(Math.sin(angle)) * 0.05) * (angle > Math.PI ? -1 : 1);
  return mesh;
}

function makeGerberaPetal(length: number, width: number, angle: number, colorIndex: number, phase: number, time: { value: number }) {
  const segments = 8;
  const positions: number[] = [];
  const indices: number[] = [];
  for (let i = 0; i <= segments; i += 1) {
    const u = i / segments;
    const taper = Math.sin(Math.PI * u) ** 0.32;
    positions.push(-width * taper * 0.5, u * length, Math.sin(u * Math.PI) * 0.045);
    positions.push(width * taper * 0.5, u * length, Math.sin(u * Math.PI) * 0.045);
  }
  for (let i = 0; i < segments; i += 1) {
    const a = i * 2;
    indices.push(a, a + 1, a + 2, a + 1, a + 3, a + 2);
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  const petal = new THREE.Mesh(geometry, organicMaterial(pink(colorIndex), new THREE.Color(CONFIG.petalColors[4]), time, { value: 1 }));
  petal.rotation.y = angle;
  petal.rotation.z = Math.PI / 2;
  petal.rotation.x = 0.12 + Math.sin(phase) * 0.04;
  return petal;
}

export type Tulip = THREE.Group & { userData: { config: TulipConfig; bloom: number; index: number; homeY: number } };

export function createTulip(config: TulipConfig, index: number, time: { value: number }) {
  const root = new THREE.Group() as Tulip;
  root.position.set(config.x, -3.35, config.z);
  root.scale.setScalar(config.scale);
  root.rotation.z = config.lean;
  root.userData = { config, bloom: 0, index, homeY: -3.35 };

  const stem = makeTubeStem(config.height, config.lean, config.phase, time);
  stem.name = 'stem';
  root.add(stem);

  const leafLeft = makeLeaf(1.55, 0.46, -1, config.phase, time);
  leafLeft.name = 'leaf-left';
  leafLeft.position.set(0.02, config.height * 0.28, 0);
  leafLeft.rotation.z = -0.22;
  root.add(leafLeft);
  const leafRight = makeLeaf(1.3, 0.4, 1, config.phase + 1, time);
  leafRight.name = 'leaf-right';
  leafRight.position.set(-0.02, config.height * 0.44, 0.02);
  leafRight.rotation.z = 0.34;
  root.add(leafRight);
  const leafBack = makeLeaf(1.7, 0.34, 1, config.phase + 2.1, time);
  leafBack.name = 'leaf-back';
  leafBack.position.set(0.02, config.height * 0.18, -0.08);
  leafBack.rotation.z = -0.06;
  leafBack.rotation.y = 0.28;
  root.add(leafBack);

  const flower = new THREE.Group();
  flower.name = 'flower';
  flower.position.y = config.height;
  flower.rotation.z = config.lean * 0.6;
  if (config.kind === 'gerbera') {
    const center = new THREE.Mesh(new THREE.SphereGeometry(0.25, 12, 8), organicMaterial(new THREE.Color('#D95791'), new THREE.Color('#702345'), time, { value: 1 }));
    center.position.y = 0.08;
    flower.add(center);
    for (let petalIndex = 0; petalIndex < 24; petalIndex += 1) {
      const petal = makeGerberaPetal(0.94, 0.2, (petalIndex / 24) * Math.PI * 2, index + petalIndex, config.phase + petalIndex, time);
      petal.name = `petal-${petalIndex}`;
      petal.position.y = 0.02;
      flower.add(petal);
    }
  } else {
    for (let petalIndex = 0; petalIndex < 6; petalIndex += 1) {
      const petal = makePetal(1.24, 0.68, (petalIndex / 6) * Math.PI * 2, 0.28 + (petalIndex % 2) * 0.06, index + petalIndex, config.phase + petalIndex, time);
      petal.name = `petal-${petalIndex}`;
      flower.add(petal);
    }
  }
  root.add(flower);
  return root;
}

export function setTulipGrowth(tulip: Tulip, value: number) {
  const stem = tulip.getObjectByName('stem');
  const flower = tulip.getObjectByName('flower');
  const leaves = [tulip.getObjectByName('leaf-left'), tulip.getObjectByName('leaf-right'), tulip.getObjectByName('leaf-back')];
  const stemValue = Math.min(1, value * 1.5);
  if (stem) stem.scale.y = stemValue;
  leaves.forEach((leaf, index) => {
    if (!leaf) return;
    const leafValue = Math.max(0, Math.min(1, value * 2 - 0.4 - index * 0.08));
    leaf.scale.set(leafValue, leafValue, leafValue);
    leaf.rotation.z += (index ? 1 : -1) * 0.001;
  });
  if (flower) {
    const flowerValue = Math.max(0, Math.min(1, value * 1.45 - 0.52));
    flower.scale.setScalar(Math.max(0.01, flowerValue));
    flower.rotation.x = (1 - flowerValue) * 0.4;
    flower.children.forEach((child, index) => {
      child.rotation.x = (1 - flowerValue) * (0.22 + index * 0.028);
    });
  }
  tulip.userData.bloom = value;
}

export function disposeTulip(tulip: Tulip) {
  tulip.traverse((object) => {
    if (!(object instanceof THREE.Mesh)) return;
    object.geometry.dispose();
    if (Array.isArray(object.material)) object.material.forEach(material => material.dispose());
    else object.material.dispose();
  });
}
