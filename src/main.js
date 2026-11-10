import * as THREE from 'three';
import './style.css';

const root = document.querySelector('#game-root');
const statusEl = document.querySelector('#race-status');
const speedEl = document.querySelector('#speed-value');
const gearEl = document.querySelector('#gear-value');
const lapEl = document.querySelector('#lap-value');
const positionEl = document.querySelector('#position-value');
const lapProgressEl = document.querySelector('#lap-progress');
const pulseStateEl = document.querySelector('#pulse-state');
const shieldStateEl = document.querySelector('#shield-state');
const toastEl = document.querySelector('#toast');
const bootScreen = document.querySelector('#boot-screen');
const finishScreen = document.querySelector('#finish-screen');

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x080d16);
scene.fog = new THREE.Fog(0x080d16, 55, 145);

const camera = new THREE.PerspectiveCamera(58, window.innerWidth / window.innerHeight, 0.1, 260);
camera.position.set(12, 12, 18);

const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.15;
root.appendChild(renderer.domElement);

const clock = new THREE.Clock();
const world = new THREE.Group();
scene.add(world);

scene.add(new THREE.HemisphereLight(0xa7c9ff, 0x111a24, 1.8));
const sun = new THREE.DirectionalLight(0xffffff, 2.2);
sun.position.set(-24, 42, 20);
sun.castShadow = true;
sun.shadow.mapSize.set(2048, 2048);
sun.shadow.camera.left = -65;
sun.shadow.camera.right = 65;
sun.shadow.camera.top = 65;
sun.shadow.camera.bottom = -65;
scene.add(sun);

const cyanLight = new THREE.PointLight(0x14d9e9, 48, 55, 2);
cyanLight.position.set(-25, 8, -4);
scene.add(cyanLight);
const violetLight = new THREE.PointLight(0x8a55ff, 38, 48, 2);
violetLight.position.set(25, 7, 6);
scene.add(violetLight);

const mat = (color, roughness = 0.65, metalness = 0) => new THREE.MeshStandardMaterial({ color, roughness, metalness });
const ground = new THREE.Mesh(new THREE.PlaneGeometry(260, 260), mat(0x111b27, 0.95));
ground.rotation.x = -Math.PI / 2;
ground.position.y = -0.18;
ground.receiveShadow = true;
world.add(ground);

const track = new THREE.Mesh(
  new THREE.RingGeometry(20.3, 34.2, 180),
  new THREE.MeshStandardMaterial({ color: 0x252d38, roughness: 0.88, metalness: 0.08, side: THREE.DoubleSide })
);
track.rotation.x = -Math.PI / 2;
track.scale.z = 0.66;
track.position.y = 0.015;
track.receiveShadow = true;
world.add(track);

const centerRx = 27.25;
const centerRz = centerRx * 0.66;
const curvePoints = [];
for (let i = 0; i < 180; i++) {
  const a = (i / 180) * Math.PI * 2;
  curvePoints.push(new THREE.Vector3(centerRx * Math.cos(a), 0.16, centerRz * Math.sin(a)));
}
const trackCurve = new THREE.CatmullRomCurve3(curvePoints, true, 'centripetal');
const edgeMat = new THREE.MeshStandardMaterial({ color: 0x19d8e8, emissive: 0x087b8d, emissiveIntensity: 1.4, metalness: 0.5, roughness: 0.3 });
const innerCurvePoints = [];
const outerCurvePoints = [];
for (let i = 0; i < 180; i++) {
  const a = (i / 180) * Math.PI * 2;
  innerCurvePoints.push(new THREE.Vector3(20.6 * Math.cos(a), 0.11, 13.6 * Math.sin(a)));
  outerCurvePoints.push(new THREE.Vector3(34 * Math.cos(a), 0.11, 22.4 * Math.sin(a)));
}
world.add(new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(innerCurvePoints, true), 220, 0.12, 6, true), edgeMat));
world.add(new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(outerCurvePoints, true), 220, 0.12, 6, true), edgeMat));

const laneMat = new THREE.MeshStandardMaterial({ color: 0xb7c5d6, emissive: 0x263c51, emissiveIntensity: 0.45 });
for (let i = 0; i < 52; i++) {
  const a = (i / 52) * Math.PI * 2;
  const dash = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.035, 1.15), laneMat);
  dash.position.set(centerRx * Math.cos(a), 0.12, centerRz * Math.sin(a));
  dash.rotation.y = Math.atan2(-centerRx * Math.sin(a), centerRz * Math.cos(a));
  world.add(dash);
}

const startLine = new THREE.Group();
for (let i = 0; i < 14; i++) {
  const tile = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.05, 0.65), mat(i % 2 ? 0xf1f5f9 : 0x0c1421, 0.8));
  tile.position.set(-6.3 + i * 0.92, 0.19, -centerRz);
  startLine.add(tile);
}
world.add(startLine);

const postMat = mat(0x182637, 0.55, 0.35);
const glowMat = new THREE.MeshStandardMaterial({ color: 0x23e4f3, emissive: 0x0ba6bc, emissiveIntensity: 2.5 });
for (let i = 0; i < 28; i++) {
  const a = (i / 28) * Math.PI * 2;
  const x = 39.5 * Math.cos(a);
  const z = 26 * Math.sin(a);
  const post = new THREE.Group();
  const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.17, 3.4, 8), postMat);
  stem.position.y = 1.7;
  stem.castShadow = true;
  post.add(stem);
  const cap = new THREE.Mesh(new THREE.SphereGeometry(0.28, 12, 8), glowMat);
  cap.position.y = 3.45;
  post.add(cap);
  post.position.set(x, 0, z);
  world.add(post);
}

const starPositions = [];
for (let i = 0; i < 420; i++) {
  starPositions.push((Math.random() - 0.5) * 190, 10 + Math.random() * 65, (Math.random() - 0.5) * 190);
}
const starGeo = new THREE.BufferGeometry();
starGeo.setAttribute('position', new THREE.Float32BufferAttribute(starPositions, 3));
const stars = new THREE.Points(starGeo, new THREE.PointsMaterial({ color: 0x8cb6d8, size: 0.24, transparent: true, opacity: 0.66 }));
scene.add(stars);

function createCar(color, accent, isPlayer = false) {
  const car = new THREE.Group();
  const bodyMat = mat(color, 0.34, 0.5);
  const accentMat = new THREE.MeshStandardMaterial({ color: accent, emissive: accent, emissiveIntensity: isPlayer ? 1.2 : 0.35, metalness: 0.55, roughness: 0.28 });
  const darkMat = mat(0x101722, 0.6, 0.12);
  const glassMat = new THREE.MeshStandardMaterial({ color: 0x162b3c, metalness: 0.75, roughness: 0.18, transparent: true, opacity: 0.9 });
  const body = new THREE.Mesh(new THREE.BoxGeometry(1.75, 0.58, 3.25), bodyMat);
  body.position.y = 0.62;
  body.castShadow = true;
  car.add(body);
  const nose = new THREE.Mesh(new THREE.BoxGeometry(1.48, 0.26, 0.72), bodyMat);
  nose.position.set(0, 0.55, 1.58);
  car.add(nose);
  const cabin = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.64, 1.42), glassMat);
  cabin.position.set(0, 1.12, -0.12);
  cabin.castShadow = true;
  car.add(cabin);
  const roof = new THREE.Mesh(new THREE.BoxGeometry(1.25, 0.12, 1.5), accentMat);
  roof.position.set(0, 1.48, -0.12);
  car.add(roof);
  const spoiler = new THREE.Mesh(new THREE.BoxGeometry(1.85, 0.11, 0.28), accentMat);
  spoiler.position.set(0, 1.0, -1.58);
  car.add(spoiler);
  const bumper = new THREE.Mesh(new THREE.BoxGeometry(1.82, 0.2, 0.22), darkMat);
  bumper.position.set(0, 0.36, -1.66);
  car.add(bumper);
  for (const x of [-0.91, 0.91]) {
    for (const z of [-1.08, 1.08]) {
      const wheel = new THREE.Mesh(new THREE.CylinderGeometry(0.37, 0.37, 0.3, 16), darkMat);
      wheel.rotation.z = Math.PI / 2;
      wheel.position.set(x, 0.37, z);
      wheel.castShadow = true;
      car.add(wheel);
      const hub = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.14, 0.32, 12), accentMat);
      hub.rotation.z = Math.PI / 2;
      hub.position.set(x, 0.37, z);
      car.add(hub);
    }
  }
  for (const x of [-0.57, 0.57]) {
    const headlight = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.13, 0.06), glowMat);
    headlight.position.set(x, 0.67, 1.64);
    car.add(headlight);
  }
  const underglow = new THREE.PointLight(accent, isPlayer ? 7 : 2, 5, 2);
  underglow.position.y = 0.2;
  car.add(underglow);
  return car;
}

const player = createCar(0x0daabd, 0x2ff4ff, true);
world.add(player);
const rivals = [
  { mesh: createCar(0xe34b64, 0xff9aab), progress: -0.4, base: 0.31, slowUntil: 0 },
  { mesh: createCar(0xffa126, 0xffd28a), progress: -0.8, base: 0.285, slowUntil: 0 },
  { mesh: createCar(0x8561e8, 0xc4a9ff), progress: -1.2, base: 0.3, slowUntil: 0 }
];
rivals.forEach((r) => world.add(r.mesh));

const shield = new THREE.Mesh(
  new THREE.SphereGeometry(2.05, 24, 16),
  new THREE.MeshBasicMaterial({ color: 0x52cfff, wireframe: true, transparent: true, opacity: 0.44 })
);
shield.visible = false;
world.add(shield);

const pulseGeometry = new THREE.TorusGeometry(1.4, 0.08, 8, 48);
const pulseMaterial = new THREE.MeshBasicMaterial({ color: 0x70f7ff, transparent: true, opacity: 0.9 });
const pulseRing = new THREE.Mesh(pulseGeometry, pulseMaterial);
pulseRing.rotation.x = Math.PI / 2;
pulseRing.visible = false;
world.add(pulseRing);

const playerState = {
  progress: 0,
  speed: 0,
  lane: 0,
  pulseReadyAt: 0,
  shieldReadyAt: 0,
  shieldUntil: 0,
  pulseUntil: 0,
  pulseHit: false,
  maxSpeed: 0,
  running: false,
  finished: false
};
const keys = new Set();
let toastTimeout;
let lastToast = '';
let soundOn = false;

function showToast(message) {
  if (lastToast === message) return;
  lastToast = message;
  toastEl.textContent = message;
  toastEl.classList.add('visible');
  clearTimeout(toastTimeout);
  toastTimeout = setTimeout(() => {
    toastEl.classList.remove('visible');
    lastToast = '';
  }, 1450);
}

function pointOnTrack(progress, lane = 0) {
  const a = progress % (Math.PI * 2);
  const rx = centerRx + lane;
  const rz = centerRz + lane * 0.66;
  const x = rx * Math.cos(a);
  const z = rz * Math.sin(a);
  const dx = -rx * Math.sin(a);
  const dz = rz * Math.cos(a);
  return { x, z, yaw: Math.atan2(dx, dz) };
}

function placeCar(mesh, progress, lane = 0) {
  const p = pointOnTrack(progress, lane);
  mesh.position.set(p.x, 0.1, p.z);
  mesh.rotation.y = p.yaw;
}

placeCar(player, 0.12, 0);
rivals.forEach((r, index) => placeCar(r.mesh, r.progress, index === 0 ? -1.4 : index === 1 ? 1.1 : 2.6));

function activatePulse(now) {
  if (!playerState.running || now < playerState.pulseReadyAt) return;
  playerState.pulseReadyAt = now + 4.2;
  playerState.pulseUntil = now + 0.72;
  playerState.pulseHit = false;
  showToast('PHASE PULSE RELEASED');
  const playerPos = player.position;
  for (const rival of rivals) {
    const distance = playerPos.distanceTo(rival.mesh.position);
    if (distance < 9.4) {
      rival.slowUntil = now + 1.35;
      playerState.pulseHit = true;
    }
  }
  pulseRing.position.set(player.position.x, 0.28, player.position.z);
  pulseRing.scale.setScalar(0.5);
  pulseRing.visible = true;
}

function activateShield(now) {
  if (!playerState.running || now < playerState.shieldReadyAt) return;
  playerState.shieldReadyAt = now + 5.4;
  playerState.shieldUntil = now + 1.55;
  showToast('ION SHIELD ACTIVE');
}

function ordinal(n) {
  return n === 1 ? '1ST' : n === 2 ? '2ND' : n === 3 ? '3RD' : n + 'TH';
}

function updateHud(now) {
  const lap = Math.min(3, Math.floor(playerState.progress / (Math.PI * 2)) + 1);
  const lapFraction = (playerState.progress % (Math.PI * 2)) / (Math.PI * 2);
  const position = 1 + rivals.filter((r) => r.progress > playerState.progress).length;
  speedEl.textContent = String(Math.round(playerState.speed * 1.85)).padStart(3, '0');
  gearEl.textContent = String(Math.min(5, Math.max(1, Math.floor(playerState.speed / 24) + 1)));
  lapEl.textContent = lap + ' / 3';
  positionEl.textContent = ordinal(position);
  lapProgressEl.style.width = (lapFraction * 100) + '%';
  pulseStateEl.textContent = now >= playerState.pulseReadyAt ? 'READY · E' : 'RECHARGING';
  shieldStateEl.textContent = now >= playerState.shieldReadyAt ? 'READY · SPACE' : 'RECHARGING';
}

function startRace() {
  playerState.running = true;
  playerState.finished = false;
  playerState.progress = 0;
  playerState.speed = 0;
  playerState.lane = 0;
  playerState.maxSpeed = 0;
  playerState.pulseReadyAt = 0;
  playerState.shieldReadyAt = 0;
  rivals[0].progress = -0.4;
  rivals[1].progress = -0.8;
  rivals[2].progress = -1.2;
  rivals.forEach((r, i) => {
    r.slowUntil = 0;
    placeCar(r.mesh, r.progress, [-1.4, 1.1, 2.6][i]);
  });
  placeCar(player, 0, 0);
  bootScreen.classList.add('hidden');
  finishScreen.classList.add('hidden');
  statusEl.textContent = 'RACE IN PROGRESS';
  showToast('GREEN LIGHT — GO!');
}

function finishRace() {
  playerState.running = false;
  playerState.finished = true;
  const position = 1 + rivals.filter((r) => r.progress > playerState.progress).length;
  document.querySelector('#finish-title').innerHTML = position === 1 ? 'CIRCUIT<br /><em>MASTER</em>' : 'RACE<br /><em>COMPLETE</em>';
  document.querySelector('#finish-copy').textContent = position === 1 ? 'A flawless run. You own this circuit.' : 'Every lap is a new chance to take the lead.';
  document.querySelector('#finish-position').textContent = ordinal(position);
  document.querySelector('#finish-speed').textContent = String(Math.round(playerState.maxSpeed * 1.85)).padStart(3, '0') + ' KM/H';
  finishScreen.classList.remove('hidden');
  statusEl.textContent = 'RACE COMPLETE';
}

function update(dt, now) {
  if (!playerState.running) return;

  const accelerating = keys.has('ArrowUp') || keys.has('w') || keys.has('W') || keys.has('accelerate');
  const braking = keys.has('ArrowDown') || keys.has('s') || keys.has('S') || keys.has('brake');
  const left = keys.has('ArrowLeft') || keys.has('a') || keys.has('A') || keys.has('left');
  const right = keys.has('ArrowRight') || keys.has('d') || keys.has('D') || keys.has('right');

  if (accelerating) playerState.speed += 34 * dt;
  else playerState.speed -= 9.5 * dt;
  if (braking) playerState.speed -= 42 * dt;
  playerState.speed = THREE.MathUtils.clamp(playerState.speed, 0, 106);
  if (left) playerState.lane -= 7.2 * dt;
  if (right) playerState.lane += 7.2 * dt;
  playerState.lane = THREE.MathUtils.clamp(playerState.lane, -3.9, 3.9);

  const speedFactor = 0.35 + playerState.speed / 106;
  playerState.progress += (playerState.speed / 245) * dt;
  playerState.maxSpeed = Math.max(playerState.maxSpeed, playerState.speed);

  rivals.forEach((r) => {
    const slowed = now < r.slowUntil;
    r.progress += r.base * (slowed ? 0.28 : 1) * dt;
  });

  placeCar(player, playerState.progress, playerState.lane);
  rivals.forEach((r, i) => placeCar(r.mesh, r.progress, [-1.4, 1.1, 2.6][i]));

  const steerLean = (right ? 1 : 0) - (left ? 1 : 0);
  player.rotation.z = THREE.MathUtils.lerp(player.rotation.z, -steerLean * 0.065 * speedFactor, 0.12);
  player.rotation.x = THREE.MathUtils.lerp(player.rotation.x, braking ? 0.025 : 0, 0.08);

  shield.visible = now < playerState.shieldUntil;
  shield.position.set(player.position.x, 1.12, player.position.z);
  shield.rotation.y += dt * 0.8;

  if (pulseRing.visible) {
    const pulseProgress = THREE.MathUtils.clamp((playerState.pulseUntil - now) / 0.72, 0, 1);
    pulseRing.position.set(player.position.x, 0.22, player.position.z);
    pulseRing.scale.setScalar(0.65 + (1 - pulseProgress) * 4.2);
    pulseMaterial.opacity = pulseProgress * 0.9;
    if (now >= playerState.pulseUntil) pulseRing.visible = false;
  }

  const p = pointOnTrack(playerState.progress, playerState.lane);
  const cameraOffset = new THREE.Vector3(0, 5.9, -10.8).applyAxisAngle(new THREE.Vector3(0, 1, 0), p.yaw);
  const desiredCamera = new THREE.Vector3(player.position.x, 0, player.position.z).add(cameraOffset);
  camera.position.lerp(desiredCamera, 1 - Math.pow(0.001, dt));
  camera.lookAt(player.position.x, 0.85, player.position.z);

  updateHud(now);
  if (playerState.progress >= Math.PI * 6) finishRace();
}

function animate() {
  const dt = Math.min(clock.getDelta(), 0.04);
  const now = performance.now() / 1000;
  update(dt, now);
  if (!playerState.running) {
    camera.position.lerp(new THREE.Vector3(42, 34, 48), 0.012);
    camera.lookAt(0, 0, 0);
    if (!playerState.finished) {
      const t = performance.now() * 0.00013;
      player.position.set(centerRx * Math.cos(t), 0.1, centerRz * Math.sin(t));
      player.rotation.y = Math.PI / 2 - t;
      rivals.forEach((r, i) => placeCar(r.mesh, t - 0.8 - i * 0.85, [-1.4, 1.1, 2.6][i]));
    }
  }
  stars.rotation.y += dt * 0.002;
  renderer.render(scene, camera);
}
renderer.setAnimationLoop(animate);

window.addEventListener('keydown', (event) => {
  const key = event.key;
  if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(key)) event.preventDefault();
  keys.add(key);
  if (key === 'e' || key === 'E') activatePulse(performance.now() / 1000);
  if (key === ' ') activateShield(performance.now() / 1000);
});
window.addEventListener('keyup', (event) => keys.delete(event.key));
window.addEventListener('blur', () => keys.clear());

document.querySelectorAll('[data-control]').forEach((button) => {
  const control = button.dataset.control;
  const down = (event) => { event.preventDefault(); keys.add(control); };
  const up = (event) => { event.preventDefault(); keys.delete(control); };
  button.addEventListener('pointerdown', down);
  button.addEventListener('pointerup', up);
  button.addEventListener('pointerleave', up);
  button.addEventListener('pointercancel', up);
  if (control === 'pulse') button.addEventListener('click', () => activatePulse(performance.now() / 1000));
  if (control === 'shield') button.addEventListener('click', () => activateShield(performance.now() / 1000));
});

document.querySelector('#start-button').addEventListener('click', startRace);
document.querySelector('#restart-button').addEventListener('click', startRace);
document.querySelector('#sound-toggle').addEventListener('click', (event) => {
  soundOn = !soundOn;
  event.currentTarget.classList.toggle('active', soundOn);
  event.currentTarget.title = soundOn ? 'Sound on (game audio coming soon)' : 'Sound is off';
  showToast(soundOn ? 'SOUND SETTING SAVED' : 'SOUND OFF');
});

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
});

updateHud(0);