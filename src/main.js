import * as THREE from 'three';
import './style.css';

const $ = (selector) => document.querySelector(selector);
const root = $('#game-root');
const ui = {
  status: $('#race-status'), speed: $('#speed-value'), gear: $('#gear-value'),
  lap: $('#lap-value'), position: $('#position-value'), progress: $('#lap-progress'),
  pulse: $('#pulse-state'), shield: $('#shield-state'), toast: $('#toast'),
  boot: $('#boot-screen'), finish: $('#finish-screen')
};

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x83cde8);
scene.fog = new THREE.Fog(0x83cde8, 105, 235);

const camera = new THREE.PerspectiveCamera(61, innerWidth / innerHeight, 0.1, 420);
camera.position.set(0, 22, 36);

const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
renderer.setPixelRatio(Math.min(devicePixelRatio, 1.8));
renderer.setSize(innerWidth, innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.17;
root.appendChild(renderer.domElement);

const clock = new THREE.Clock();
const world = new THREE.Group();
scene.add(world);

scene.add(new THREE.HemisphereLight(0xdaf7ff, 0x557342, 2.05));
const sun = new THREE.DirectionalLight(0xfff3d5, 3.1);
sun.position.set(-55, 85, 38);
sun.castShadow = true;
sun.shadow.mapSize.set(2048, 2048);
sun.shadow.camera.left = -90;
sun.shadow.camera.right = 90;
sun.shadow.camera.top = 90;
sun.shadow.camera.bottom = -90;
sun.shadow.bias = -0.00012;
scene.add(sun);

const fillLight = new THREE.DirectionalLight(0x7bdcff, 0.75);
fillLight.position.set(45, 25, -45);
scene.add(fillLight);

const mat = (color, roughness = 0.72, metalness = 0) =>
  new THREE.MeshStandardMaterial({ color, roughness, metalness });
const box = (parent, size, material, position, rotation = null, cast = true) => {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(...size), material);
  mesh.position.set(...position);
  if (rotation) mesh.rotation.set(...rotation);
  mesh.castShadow = cast;
  mesh.receiveShadow = true;
  parent.add(mesh);
  return mesh;
};

const waterUniforms = { uTime: { value: 0 } };
const ocean = new THREE.Mesh(
  new THREE.PlaneGeometry(440, 440, 100, 100),
  new THREE.ShaderMaterial({
    uniforms: waterUniforms,
    vertexShader: 'uniform float uTime; varying vec2 vUv; varying float vWave;\n      void main(){ vUv=uv; vec3 p=position; float a=sin(p.x*.13+uTime*.8)*.16; float b=cos(p.y*.11-uTime*.65)*.13; p.z += a+b; vWave=a+b; gl_Position=projectionMatrix*modelViewMatrix*vec4(p,1.0); }',
    fragmentShader: 'uniform float uTime; varying vec2 vUv; varying float vWave;\n      void main(){ float shimmer=sin(vUv.x*180.0+uTime*1.8)*cos(vUv.y*150.0-uTime)*.035; vec3 deep=vec3(.025,.28,.39); vec3 light=vec3(.08,.57,.68); float f=clamp(.45+vWave*.8+shimmer,0.0,1.0); gl_FragColor=vec4(mix(deep,light,f),1.0); }',
    side: THREE.DoubleSide
  })
);
ocean.rotation.x = -Math.PI / 2;
ocean.position.y = -1.55;
world.add(ocean);

const island = new THREE.Mesh(new THREE.CircleGeometry(1, 120), mat(0x72a94e, 1));
island.rotation.x = -Math.PI / 2;
island.scale.set(53, 35, 1);
island.position.y = -0.48;
island.receiveShadow = true;
world.add(island);

const beach = new THREE.Mesh(new THREE.CircleGeometry(1, 120), mat(0xe7cb8a, 1));
beach.rotation.x = -Math.PI / 2;
beach.scale.set(49.6, 32.5, 1);
beach.position.y = -0.405;
world.add(beach);

const grass = new THREE.Mesh(new THREE.CircleGeometry(1, 120), mat(0x6da64e, 1));
grass.rotation.x = -Math.PI / 2;
grass.scale.set(45.5, 29.2, 1);
grass.position.y = -0.34;
grass.receiveShadow = true;
world.add(grass);

// A slightly raised grassy island lip gives the course a sculpted silhouette.
const islandRim = new THREE.Mesh(
  new THREE.TorusGeometry(1, 1, 12, 160),
  mat(0x548e45, 1)
);
islandRim.rotation.x = Math.PI / 2;
islandRim.scale.set(50.5, 33.2, 1);
islandRim.position.y = -0.22;
world.add(islandRim);

const road = { innerX: 21.8, innerZ: 14.35, outerX: 34.9, outerZ: 22.95 };
const center = { x: 28.35, z: 18.65 };
const makeOvalBand = (innerX, innerZ, outerX, outerZ, y, material, segments = 220) => {
  const positions = [];
  const indices = [];
  for (let i = 0; i <= segments; i++) {
    const a = (i / segments) * Math.PI * 2;
    positions.push(innerX * Math.cos(a), y, innerZ * Math.sin(a));
    positions.push(outerX * Math.cos(a), y, outerZ * Math.sin(a));
    if (i < segments) {
      const n = i * 2;
      indices.push(n, n + 2, n + 1, n + 1, n + 2, n + 3);
    }
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  const mesh = new THREE.Mesh(geometry, material);
  mesh.receiveShadow = true;
  world.add(mesh);
  return mesh;
};

makeOvalBand(road.innerX, road.innerZ, road.outerX, road.outerZ, 0.02, mat(0x333a3d, 0.96));
makeOvalBand(road.innerX - 0.5, road.innerZ - 0.33, road.innerX, road.innerZ, 0.11, mat(0xf4f0d8, 0.9));
makeOvalBand(road.outerX, road.outerZ, road.outerX + 0.55, road.outerZ + 0.36, 0.11, mat(0xf4f0d8, 0.9));

// Red-and-cream curb blocks around both edges.
const curbRed = mat(0xe85b4f, 0.82);
const curbCream = mat(0xfff0d4, 0.85);
for (const edge of ['inner', 'outer']) {
  for (let i = 0; i < 176; i++) {
    const a = (i / 176) * Math.PI * 2;
    const rx = edge === 'inner' ? road.innerX - 0.22 : road.outerX + 0.26;
    const rz = edge === 'inner' ? road.innerZ - 0.15 : road.outerZ + 0.17;
    const curb = new THREE.Mesh(new THREE.BoxGeometry(0.78, 0.16, 0.52), i % 2 ? curbRed : curbCream);
    curb.position.set(rx * Math.cos(a), 0.12, rz * Math.sin(a));
    curb.rotation.y = Math.atan2(-rx * Math.sin(a), rz * Math.cos(a));
    curb.castShadow = true;
    world.add(curb);
  }
}

// Broken white lane markers and a bold start/finish stripe.
const lineMat = new THREE.MeshStandardMaterial({ color: 0xe2e9dd, roughness: 0.9, emissive: 0x1a2525, emissiveIntensity: 0.12 });
for (let i = 0; i < 72; i++) {
  const a = (i / 72) * Math.PI * 2;
  const mark = new THREE.Mesh(new THREE.BoxGeometry(0.17, 0.035, 1.05), lineMat);
  mark.position.set(center.x * Math.cos(a), 0.075, center.z * Math.sin(a));
  mark.rotation.y = Math.atan2(-center.x * Math.sin(a), center.z * Math.cos(a));
  world.add(mark);
}
const startGroup = new THREE.Group();
for (let i = 0; i < 16; i++) {
  const tile = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.08, 0.72), i % 2 ? mat(0xfaf6df) : mat(0x202b34));
  tile.position.set(-6 + i * 0.8, 0.15, -center.z);
  startGroup.add(tile);
}
world.add(startGroup);

const treeMaterials = [mat(0x287247), mat(0x3d8b4f), mat(0x4b9a55), mat(0x1e6848)];
const trunkMat = mat(0x8b5b32);
const leafMat = mat(0x23784a);
const palmLeafMat = [mat(0x2a8b51), mat(0x48a95c), mat(0x176b49)];
const rockMats = [mat(0x878a78), mat(0x6c7568), mat(0xa3a18a)];

function createPine(scale = 1) {
  const group = new THREE.Group();
  const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.35, 2.1, 7), trunkMat);
  trunk.position.y = 1.0;
  trunk.castShadow = true;
  group.add(trunk);
  for (let i = 0; i < 3; i++) {
    const crown = new THREE.Mesh(new THREE.ConeGeometry(1.25 - i * 0.18, 2.35, 7), treeMaterials[(i + Math.floor(scale * 10)) % treeMaterials.length]);
    crown.position.y = 2.05 + i * 1.0;
    crown.rotation.y = i * 0.35;
    crown.castShadow = true;
    group.add(crown);
  }
  group.scale.setScalar(scale);
  return group;
}

function createPalm(scale = 1) {
  const group = new THREE.Group();
  const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.39, 4.6, 8), trunkMat);
  trunk.position.y = 2.25;
  trunk.rotation.z = -0.08;
  trunk.castShadow = true;
  group.add(trunk);
  const crown = new THREE.Vector3(0, 4.5, 0);
  for (let i = 0; i < 8; i++) {
    const angle = (i / 8) * Math.PI * 2;
    const leaf = new THREE.Group();
    const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.085, 3.2, 5), palmLeafMat[i % 3]);
    stem.position.set(0, -0.28, 1.35);
    stem.rotation.x = Math.PI / 2.8;
    leaf.add(stem);
    const blade = new THREE.Mesh(new THREE.ConeGeometry(0.42, 2.2, 5), palmLeafMat[(i + 1) % 3]);
    blade.position.set(0, -0.75, 2.35);
    blade.rotation.x = Math.PI / 2.1;
    leaf.add(blade);
    leaf.rotation.y = angle;
    leaf.position.copy(crown);
    leaf.traverse((o) => { if (o.isMesh) o.castShadow = true; });
    group.add(leaf);
  }
  group.scale.setScalar(scale);
  return group;
}

function createRock(scale = 1) {
  const rock = new THREE.Mesh(new THREE.DodecahedronGeometry(1, 0), rockMats[Math.floor(Math.random() * rockMats.length)]);
  rock.scale.set(1.3 * scale, 0.72 * scale, 1.0 * scale);
  rock.rotation.set(Math.random() * 0.3, Math.random() * 3, Math.random() * 0.25);
  rock.castShadow = true;
  rock.receiveShadow = true;
  return rock;
}

function placeScenery() {
  // Far island silhouettes and chunky green headlands.
  for (let i = 0; i < 13; i++) {
    const a = (i / 13) * Math.PI * 2;
    const hill = new THREE.Mesh(new THREE.IcosahedronGeometry(1, 1), treeMaterials[i % treeMaterials.length]);
    hill.scale.set(8 + (i % 3) * 2, 3.4 + (i % 4), 5.5 + (i % 2) * 2);
    hill.position.set(43 * Math.cos(a), 1.4, 28 * Math.sin(a));
    hill.rotation.y = a;
    hill.castShadow = true;
    world.add(hill);
  }
  // Palm trees around the sandy shoreline.
  for (let i = 0; i < 30; i++) {
    const a = (i / 30) * Math.PI * 2 + 0.05;
    const r = 44 + (i % 3) * 1.25;
    const palm = createPalm(0.7 + (i % 4) * 0.11);
    palm.position.set(r * Math.cos(a), -0.25, r * 0.66 * Math.sin(a));
    palm.rotation.y = a + 0.8;
    world.add(palm);
  }
  // Mixed tropical trees and rocks on both sides of the course.
  for (let i = 0; i < 42; i++) {
    const a = (i / 42) * Math.PI * 2;
    const inner = i % 2 === 0;
    const r = inner ? 15.5 + (i % 4) * 1.2 : 39 + (i % 4) * 1.3;
    const zScale = inner ? 0.66 : 0.66;
    const tree = createPine(0.65 + (i % 5) * 0.12);
    tree.position.set(r * Math.cos(a), -0.12, r * zScale * Math.sin(a));
    tree.rotation.y = i * 0.74;
    world.add(tree);
    if (i % 2 === 0) {
      const rock = createRock(0.65 + (i % 3) * 0.2);
      rock.position.set((r + 2.0) * Math.cos(a + 0.1), 0.0, (r + 2) * zScale * Math.sin(a + 0.1));
      world.add(rock);
    }
  }
  // Cheerful course flags, banners and a few lookout huts.
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * Math.PI * 2 + 0.2;
    const x = 36.7 * Math.cos(a);
    const z = 24.1 * Math.sin(a);
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.09, 4.1, 8), mat(0xe9e5d6));
    pole.position.set(x, 2.05, z);
    pole.castShadow = true;
    world.add(pole);
    const flag = new THREE.Mesh(new THREE.PlaneGeometry(1.5, 0.82), mat(i % 2 ? 0xffbd49 : 0x25cbd2, 0.6));
    flag.position.set(x + 0.7, 3.35, z);
    flag.rotation.y = -a;
    world.add(flag);
  }
}
placeScenery();

function createArch(x, z, color = 0x18ced1) {
  const group = new THREE.Group();
  const frameMat = mat(0xedf2dc, 0.5, 0.08);
  const glowMat = new THREE.MeshStandardMaterial({ color, emissive: color, emissiveIntensity: 1.2 });
  for (const side of [-1, 1]) {
    const leg = new THREE.Mesh(new THREE.BoxGeometry(0.45, 5.2, 0.45), frameMat);
    leg.position.set(side * 5.3, 2.6, 0);
    leg.castShadow = true;
    group.add(leg);
  }
  const top = new THREE.Mesh(new THREE.BoxGeometry(11, 0.55, 0.65), glowMat);
  top.position.y = 5.15;
  group.add(top);
  const sign = new THREE.Mesh(new THREE.BoxGeometry(5.3, 0.9, 0.3), mat(0x153f49));
  sign.position.set(0, 4.2, 0);
  group.add(sign);
  for (let i = -2; i <= 2; i++) {
    const light = new THREE.Mesh(new THREE.SphereGeometry(0.12, 10, 8), glowMat);
    light.position.set(i * 0.7, 4.2, 0.2);
    group.add(light);
  }
  group.position.set(x, 0.1, z);
  world.add(group);
  return group;
}
createArch(0, -center.z - 3, 0x22e2db);

const trackLights = [];
for (let i = 0; i < 24; i++) {
  const a = (i / 24) * Math.PI * 2;
  const post = new THREE.Group();
  const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.16, 4.6, 8), mat(0x6c7770, 0.6, 0.25));
  pole.position.y = 2.3;
  post.add(pole);
  const lamp = new THREE.Mesh(new THREE.SphereGeometry(0.26, 12, 8), new THREE.MeshStandardMaterial({ color: 0xffefbb, emissive: 0xffc963, emissiveIntensity: 1.7 }));
  lamp.position.y = 4.65;
  post.add(lamp);
  post.position.set(37.1 * Math.cos(a), 0, 24.4 * Math.sin(a));
  world.add(post);
  trackLights.push(post);
}

const starGeo = new THREE.BufferGeometry();
const starPositions = [];
for (let i = 0; i < 250; i++) starPositions.push((Math.random() - 0.5) * 300, 35 + Math.random() * 80, (Math.random() - 0.5) * 300);
starGeo.setAttribute('position', new THREE.Float32BufferAttribute(starPositions, 3));
const distantBirds = new THREE.Points(starGeo, new THREE.PointsMaterial({ color: 0xf5ffff, size: 0.5, transparent: true, opacity: 0.8 }));
scene.add(distantBirds);

const glowCyan = new THREE.MeshStandardMaterial({ color: 0x5df6ec, emissive: 0x0b9d9c, emissiveIntensity: 1.3, metalness: 0.35, roughness: 0.25 });
const tireMat = mat(0x151b20, 0.94);
const rimMat = new THREE.MeshStandardMaterial({ color: 0xe8d9b5, metalness: 0.72, roughness: 0.24 });
const darkTrim = mat(0x202b31, 0.56, 0.35);

function createBuggy(bodyColor, trimColor, isPlayer = false) {
  const car = new THREE.Group();
  const bodyMat = new THREE.MeshStandardMaterial({ color: bodyColor, roughness: 0.32, metalness: 0.36 });
  const trimMat = new THREE.MeshStandardMaterial({ color: trimColor, roughness: 0.3, metalness: 0.35, emissive: trimColor, emissiveIntensity: isPlayer ? 0.3 : 0.08 });
  const glassMat = new THREE.MeshStandardMaterial({ color: 0x8ed5dc, roughness: 0.16, metalness: 0.48, transparent: true, opacity: 0.84 });
  const chassis = new THREE.Mesh(new THREE.BoxGeometry(2.0, 0.5, 3.55), darkTrim);
  chassis.position.y = 0.62;
  chassis.castShadow = true;
  car.add(chassis);
  const lowerBody = new THREE.Mesh(new THREE.BoxGeometry(2.12, 0.52, 3.1), bodyMat);
  lowerBody.position.set(0, 0.85, 0);
  lowerBody.castShadow = true;
  car.add(lowerBody);
  const hood = new THREE.Mesh(new THREE.BoxGeometry(1.92, 0.34, 1.12), bodyMat);
  hood.position.set(0, 1.13, 1.1);
  hood.castShadow = true;
  car.add(hood);
  const nose = new THREE.Mesh(new THREE.BoxGeometry(1.7, 0.22, 0.6), trimMat);
  nose.position.set(0, 0.8, 1.72);
  car.add(nose);
  const bumper = new THREE.Mesh(new THREE.BoxGeometry(2.28, 0.18, 0.28), darkTrim);
  bumper.position.set(0, 0.49, 1.89);
  car.add(bumper);
  const rearBumper = bumper.clone();
  rearBumper.position.z = -1.9;
  car.add(rearBumper);

  // Open buggy cabin with a visible roll cage and bucket seats.
  const cabin = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.66, 1.32), glassMat);
  cabin.position.set(0, 1.47, -0.25);
  cabin.castShadow = true;
  car.add(cabin);
  for (const x of [-0.78, 0.78]) {
    const rail = new THREE.Mesh(new THREE.CylinderGeometry(0.075, 0.075, 1.6, 8), trimMat);
    rail.position.set(x, 1.54, -0.18);
    rail.rotation.z = x > 0 ? -0.1 : 0.1;
    car.add(rail);
    const sideStep = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.15, 1.5), darkTrim);
    sideStep.position.set(x * 1.22, 0.58, -0.05);
    car.add(sideStep);
  }
  for (const z of [-0.9, 0.78]) {
    const bar = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 1.7, 8), trimMat);
    bar.position.set(0, 1.65, z);
    bar.rotation.z = Math.PI / 2;
    car.add(bar);
  }
  const seat = new THREE.Mesh(new THREE.BoxGeometry(0.48, 0.5, 0.4), mat(0x26313b));
  seat.position.set(0, 1.25, -0.47);
  car.add(seat);
  const driverHead = new THREE.Mesh(new THREE.SphereGeometry(0.22, 14, 12), mat(isPlayer ? 0xf1c18d : 0xd8ad85));
  driverHead.position.set(0, 1.76, -0.15);
  car.add(driverHead);
  const helmet = new THREE.Mesh(new THREE.SphereGeometry(0.25, 14, 12), trimMat);
  helmet.scale.set(1.05, 0.72, 1.05);
  helmet.position.set(0, 1.88, -0.18);
  car.add(helmet);

  const spoiler = new THREE.Mesh(new THREE.BoxGeometry(2.0, 0.14, 0.35), trimMat);
  spoiler.position.set(0, 1.48, -1.72);
  car.add(spoiler);
  for (const x of [-0.7, 0.7]) {
    const support = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.48, 0.12), darkTrim);
    support.position.set(x, 1.25, -1.68);
    car.add(support);
  }
  const wheelPivots = [];
  for (const x of [-1.02, 1.02]) {
    for (const z of [-1.18, 1.2]) {
      const wheelPivot = new THREE.Group();
      wheelPivot.position.set(x, 0.48, z);
      const tire = new THREE.Mesh(new THREE.CylinderGeometry(0.43, 0.43, 0.34, 18), tireMat);
      tire.rotation.z = Math.PI / 2;
      tire.castShadow = true;
      wheelPivot.add(tire);
      const rim = new THREE.Mesh(new THREE.CylinderGeometry(0.245, 0.245, 0.36, 14), rimMat);
      rim.rotation.z = Math.PI / 2;
      wheelPivot.add(rim);
      const hub = new THREE.Mesh(new THREE.CylinderGeometry(0.095, 0.095, 0.38, 12), trimMat);
      hub.rotation.z = Math.PI / 2;
      wheelPivot.add(hub);
      for (let t = 0; t < 8; t++) {
        const tread = new THREE.Mesh(new THREE.BoxGeometry(0.37, 0.065, 0.11), darkTrim);
        tread.position.set(0, Math.sin((t / 8) * Math.PI * 2) * 0.405, Math.cos((t / 8) * Math.PI * 2) * 0.405);
        wheelPivot.add(tread);
      }
      car.add(wheelPivot);
      wheelPivots.push(wheelPivot);
      const shock = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.055, 0.55, 8), trimMat);
      shock.position.set(x * 0.75, 0.55, z);
      shock.rotation.z = x > 0 ? -0.28 : 0.28;
      car.add(shock);
    }
  }
  for (const x of [-0.68, 0.68]) {
    const headlamp = new THREE.Mesh(new THREE.SphereGeometry(0.17, 12, 10), new THREE.MeshStandardMaterial({ color: 0xfff3c2, emissive: 0xffd86c, emissiveIntensity: 1.65 }));
    headlamp.position.set(x, 1.02, 1.66);
    car.add(headlamp);
    const tail = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.12, 0.08), mat(0xff433d, 0.4, 0.1));
    tail.position.set(x, 0.94, -1.78);
    car.add(tail);
  }
  const underglow = new THREE.PointLight(trimColor, isPlayer ? 3.4 : 1.1, 6, 2);
  underglow.position.y = 0.18;
  car.add(underglow);
  car.userData.wheels = wheelPivots;
  car.userData.baseY = 0.08;
  return car;
}

const player = createBuggy(0x12b9bb, 0xefff5d, true);
world.add(player);
const rivals = [
  { mesh: createBuggy(0xe34d4d, 0xffd45b), progress: -0.45, base: 0.285, slowUntil: 0, lane: -1.7 },
  { mesh: createBuggy(0x7655d9, 0x4fe2ff), progress: -0.91, base: 0.272, slowUntil: 0, lane: 1.7 },
  { mesh: createBuggy(0xff9a32, 0xffe1a0), progress: -1.35, base: 0.278, slowUntil: 0, lane: 2.8 }
];
rivals.forEach(r => world.add(r.mesh));

const shield = new THREE.Mesh(
  new THREE.SphereGeometry(2.2, 26, 18),
  new THREE.MeshPhysicalMaterial({ color: 0x5deaff, roughness: 0.08, metalness: 0.1, transparent: true, opacity: 0.17, transmission: 0.18, wireframe: true })
);
shield.visible = false;
world.add(shield);

const pulseRing = new THREE.Mesh(
  new THREE.TorusGeometry(1.3, 0.13, 10, 56),
  new THREE.MeshBasicMaterial({ color: 0xefff5d, transparent: true, opacity: 0.95 })
);
pulseRing.rotation.x = Math.PI / 2;
pulseRing.visible = false;
world.add(pulseRing);

const dustParticles = [];
const dustGeo = new THREE.SphereGeometry(0.16, 7, 6);
const dustMat = new THREE.MeshBasicMaterial({ color: 0xd8c49a, transparent: true, opacity: 0.32 });
function puffDust() {
  const p = new THREE.Mesh(dustGeo, dustMat.clone());
  p.position.copy(player.position);
  p.position.y = 0.28;
  p.position.x += (Math.random() - 0.5) * 1.3;
  p.position.z -= 1.3;
  p.userData.life = 0.65;
  p.userData.velocity = new THREE.Vector3((Math.random() - 0.5) * 1.3, 0.5 + Math.random() * 0.6, -1.2 - Math.random());
  world.add(p);
  dustParticles.push(p);
}

const state = {
  progress: 0, speed: 0, lane: 0, pulseReadyAt: 0, shieldReadyAt: 0,
  shieldUntil: 0, pulseUntil: 0, maxSpeed: 0, running: false, finished: false,
  dustClock: 0
};
const keys = new Set();
let toastTimer;
let lastToast = '';

const trackRx = 28.35;
const trackRz = 18.65;
function pointOnTrack(progress, lane = 0) {
  const a = progress % (Math.PI * 2);
  const rx = trackRx + lane;
  const rz = trackRz + lane * 0.66;
  return { x: rx * Math.cos(a), z: rz * Math.sin(a), yaw: Math.atan2(-rx * Math.sin(a), rz * Math.cos(a)) };
}
function placeCar(mesh, progress, lane = 0) {
  const p = pointOnTrack(progress, lane);
  mesh.position.set(p.x, mesh.userData.baseY ?? 0.08, p.z);
  mesh.rotation.y = p.yaw;
}
function showToast(message) {
  if (lastToast === message) return;
  lastToast = message;
  ui.toast.textContent = message;
  ui.toast.classList.add('visible');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { ui.toast.classList.remove('visible'); lastToast = ''; }, 1450);
}
function ordinal(n) { return n === 1 ? '1ST' : n === 2 ? '2ND' : n === 3 ? '3RD' : n + 'TH'; }

function activatePulse(now) {
  if (!state.running || now < state.pulseReadyAt) return;
  state.pulseReadyAt = now + 4.8;
  state.pulseUntil = now + 0.78;
  showToast('WILD PULSE!');
  for (const rival of rivals) {
    if (player.position.distanceTo(rival.mesh.position) < 10.5) rival.slowUntil = now + 1.45;
  }
  pulseRing.position.set(player.position.x, 0.28, player.position.z);
  pulseRing.scale.setScalar(0.55);
  pulseRing.visible = true;
}
function activateShield(now) {
  if (!state.running || now < state.shieldReadyAt) return;
  state.shieldReadyAt = now + 6.0;
  state.shieldUntil = now + 1.7;
  showToast('TURBO SHIELD!');
}

function updateHud(now) {
  const lap = Math.min(3, Math.floor(state.progress / (Math.PI * 2)) + 1);
  const fraction = (state.progress % (Math.PI * 2)) / (Math.PI * 2);
  const place = 1 + rivals.filter(r => r.progress > state.progress).length;
  ui.speed.textContent = String(Math.round(state.speed * 1.9)).padStart(3, '0');
  ui.gear.textContent = String(Math.min(5, Math.max(1, Math.floor(state.speed / 22) + 1)));
  ui.lap.textContent = lap + ' / 3';
  ui.position.textContent = ordinal(place);
  ui.progress.style.width = (fraction * 100) + '%';
  ui.pulse.textContent = now >= state.pulseReadyAt ? 'READY · E' : 'RECHARGING';
  ui.shield.textContent = now >= state.shieldReadyAt ? 'READY · SPACE' : 'RECHARGING';
}

function resetRace() {
  state.progress = 0; state.speed = 0; state.lane = 0; state.maxSpeed = 0;
  state.pulseReadyAt = 0; state.shieldReadyAt = 0; state.shieldUntil = 0; state.pulseUntil = 0;
  rivals[0].progress = -0.45; rivals[1].progress = -0.91; rivals[2].progress = -1.35;
  rivals.forEach(r => { r.slowUntil = 0; placeCar(r.mesh, r.progress, r.lane); });
  placeCar(player, 0, 0);
  dustParticles.forEach(p => world.remove(p));
  dustParticles.length = 0;
}
function startRace() {
  resetRace();
  state.running = true;
  state.finished = false;
  ui.boot.classList.add('hidden');
  ui.finish.classList.add('hidden');
  ui.status.textContent = 'RACE IN PROGRESS';
  showToast('3… 2… 1… GO!');
}
function finishRace() {
  state.running = false;
  state.finished = true;
  const place = 1 + rivals.filter(r => r.progress > state.progress).length;
  $('#finish-title').innerHTML = place === 1 ? 'ISLAND<br /><em>CHAMPION</em>' : 'RACE<br /><em>COMPLETE</em>';
  $('#finish-copy').textContent = place === 1 ? 'You own the island. What a ride!' : 'The island is waiting for your next run.';
  $('#finish-position').textContent = ordinal(place);
  $('#finish-speed').textContent = String(Math.round(state.maxSpeed * 1.9)).padStart(3, '0') + ' KM/H';
  ui.finish.classList.remove('hidden');
  ui.status.textContent = 'RACE COMPLETE';
}

function update(dt, now) {
  if (!state.running) return;
  const accelerating = keys.has('ArrowUp') || keys.has('w') || keys.has('W') || keys.has('accelerate');
  const braking = keys.has('ArrowDown') || keys.has('s') || keys.has('S') || keys.has('brake');
  const left = keys.has('ArrowLeft') || keys.has('a') || keys.has('A') || keys.has('left');
  const right = keys.has('ArrowRight') || keys.has('d') || keys.has('D') || keys.has('right');

  if (accelerating) state.speed += 44 * dt;
  else state.speed -= 7.5 * dt;
  if (braking) state.speed -= 46 * dt;
  state.speed = THREE.MathUtils.clamp(state.speed, 0, 108);
  if (left) state.lane -= 7.4 * dt;
  if (right) state.lane += 7.4 * dt;
  state.lane = THREE.MathUtils.clamp(state.lane, -4.4, 4.4);
  const speedFactor = 0.3 + state.speed / 105;
  state.progress += (state.speed / 235) * dt;
  state.maxSpeed = Math.max(state.maxSpeed, state.speed);

  for (const rival of rivals) rival.progress += rival.base * (now < rival.slowUntil ? 0.25 : 1) * dt;

  placeCar(player, state.progress, state.lane);
  rivals.forEach(r => placeCar(r.mesh, r.progress, r.lane));
  const steer = (right ? 1 : 0) - (left ? 1 : 0);
  player.rotation.z = THREE.MathUtils.lerp(player.rotation.z, -steer * 0.075 * speedFactor, 0.16);
  player.position.y = 0.08 + Math.sin(now * 19) * Math.min(0.055, state.speed / 1800);
  player.userData.wheels.forEach(w => { w.rotation.x -= state.speed * dt * 0.12; });
  rivals.forEach(r => r.mesh.userData.wheels.forEach(w => { w.rotation.x -= r.base * 40 * dt; }));

  if (state.speed > 48 && (left || right)) {
    state.dustClock += dt;
    if (state.dustClock > 0.09) { puffDust(); state.dustClock = 0; }
  }
  for (let i = dustParticles.length - 1; i >= 0; i--) {
    const p = dustParticles[i];
    p.userData.life -= dt;
    p.position.addScaledVector(p.userData.velocity, dt);
    p.scale.multiplyScalar(1 + dt * 0.8);
    p.material.opacity = Math.max(0, p.userData.life / 0.65) * 0.32;
    if (p.userData.life <= 0) { world.remove(p); p.material.dispose(); dustParticles.splice(i, 1); }
  }

  shield.visible = now < state.shieldUntil;
  shield.position.set(player.position.x, 1.15, player.position.z);
  shield.rotation.y += dt * 1.1;
  if (pulseRing.visible) {
    const leftTime = THREE.MathUtils.clamp((state.pulseUntil - now) / 0.78, 0, 1);
    pulseRing.position.set(player.position.x, 0.22, player.position.z);
    pulseRing.scale.setScalar(0.65 + (1 - leftTime) * 4.7);
    pulseRing.material.opacity = leftTime * 0.95;
    if (now >= state.pulseUntil) pulseRing.visible = false;
  }

  const p = pointOnTrack(state.progress, state.lane);
  const offset = new THREE.Vector3(0, 7.8, -14.2).applyAxisAngle(new THREE.Vector3(0, 1, 0), p.yaw);
  const desired = new THREE.Vector3(player.position.x, 0, player.position.z).add(offset);
  camera.position.lerp(desired, 1 - Math.pow(0.0004, dt));
  camera.lookAt(player.position.x, 1.0, player.position.z);
  updateHud(now);
  if (state.progress >= Math.PI * 6) finishRace();
}

const startTime = performance.now();
function animate() {
  const dt = Math.min(clock.getDelta(), 0.04);
  const now = performance.now() / 1000;
  waterUniforms.uTime.value = now;
  update(dt, now);
  if (!state.running) {
    if (!state.finished) {
      const t = (performance.now() - startTime) * 0.000075;
      camera.position.lerp(new THREE.Vector3(62, 53, 70), 0.008);
      camera.lookAt(0, 0, 0);
      placeCar(player, t, 0);
      rivals.forEach(r => placeCar(r.mesh, t - 0.55 + r.progress, r.lane));
    }
  }
  renderer.render(scene, camera);
}
renderer.setAnimationLoop(animate);

window.addEventListener('keydown', event => {
  if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(event.key)) event.preventDefault();
  keys.add(event.key);
  if (event.key === 'e' || event.key === 'E') activatePulse(performance.now() / 1000);
  if (event.key === ' ') activateShield(performance.now() / 1000);
});
window.addEventListener('keyup', event => keys.delete(event.key));
window.addEventListener('blur', () => keys.clear());

document.querySelectorAll('[data-control]').forEach(button => {
  const control = button.dataset.control;
  const down = event => { event.preventDefault(); keys.add(control); };
  const up = event => { event.preventDefault(); keys.delete(control); };
  button.addEventListener('pointerdown', down);
  button.addEventListener('pointerup', up);
  button.addEventListener('pointerleave', up);
  button.addEventListener('pointercancel', up);
  if (control === 'pulse') button.addEventListener('click', () => activatePulse(performance.now() / 1000));
  if (control === 'shield') button.addEventListener('click', () => activateShield(performance.now() / 1000));
});
$('#start-button').addEventListener('click', startRace);
$('#restart-button').addEventListener('click', startRace);

let audioContext;
$('#sound-toggle').addEventListener('click', event => {
  const enabled = event.currentTarget.classList.toggle('active');
  event.currentTarget.title = enabled ? 'Sound setting on' : 'Sound is off';
  showToast(enabled ? 'SOUND SETTING ON' : 'SOUND OFF');
});

window.addEventListener('resize', () => {
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight);
  renderer.setPixelRatio(Math.min(devicePixelRatio, 1.8));
});
placeCar(player, 0.12);
rivals.forEach(r => placeCar(r.mesh, r.progress, r.lane));
updateHud(0);
