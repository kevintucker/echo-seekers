// main.js — Three.js game engine
// Scene setup, room loading, player movement, interaction system

import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { PointerLockControls } from 'three/addons/controls/PointerLockControls.js';

import { worldState, enterRoom, addEvent, addMemory, addReputation } from './worldState.js';
import { narrateRoomEntry, narrateAction, getNPCDialogue, generateRoomMesh, generateRoomTexture } from './llmEngine.js';
import { MINIMAP_LAYOUT, ROOM_GRID_POS, DOOR_POSITIONS } from './dungeonGraph.js';

// ─────────────────────────────────────────────
// Scene globals
// ─────────────────────────────────────────────

let scene, camera, renderer, controls;
let clock, animationId;
let currentRoomId = 'entrance';
let currentRoomObjects = [];
let doorObjects = [];
let npcMesh = null;

const keys = { w: false, a: false, s: false, d: false };
const MOVE_SPEED = 6;
const velocity = new THREE.Vector3();
const direction = new THREE.Vector3();

let isTransitioning = false;
let doorPromptVisible = false;

// ─────────────────────────────────────────────
// Entry point — called from HTML after API keys collected
// ─────────────────────────────────────────────

window.initGame = async function () {
  // Collect API keys
  window._echoesConfig = {
    anthropicKey: document.getElementById('key-anthropic')?.value?.trim() || '',
    tripoKey:     document.getElementById('key-tripo')?.value?.trim()     || '',
    seedreamKey:  document.getElementById('key-seedream')?.value?.trim()  || '',
  };

  const isDemo = !window._echoesConfig.anthropicKey;

  // Hide config modal
  document.getElementById('config-modal').classList.add('hidden');

  // Show loading screen
  const loadingScreen = document.getElementById('loading-screen');
  loadingScreen.style.display = 'flex';

  await setLoadingProgress(10, 'initializing three.js...');
  initThreeJS();

  await setLoadingProgress(30, isDemo ? 'demo mode — loading sample assets...' : 'connecting to AI...');
  await new Promise(r => setTimeout(r, 400));

  await setLoadingProgress(60, 'building the dungeon...');
  buildMinimapUI();
  await loadRoom('entrance', false);

  await setLoadingProgress(90, 'awakening...');
  await new Promise(r => setTimeout(r, 300));

  await setLoadingProgress(100, 'ready.');
  await new Promise(r => setTimeout(r, 500));

  // Fade out loading screen
  loadingScreen.classList.add('fade-out');
  setTimeout(() => { loadingScreen.style.display = 'none'; }, 800);

  // Show click-to-start
  document.getElementById('click-to-start').classList.remove('hidden');
};

// ─────────────────────────────────────────────
// Three.js initialization
// ─────────────────────────────────────────────

function initThreeJS() {
  const canvas = document.getElementById('game-canvas');

  // Scene
  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x0a0806);
  scene.fog = new THREE.FogExp2(0x0a0806, 0.06);

  // Camera
  camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 100);
  camera.position.set(0, 1.7, 0);

  // Renderer
  renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 0.6;

  // Controls
  controls = new PointerLockControls(camera, document.body);

  document.getElementById('click-to-start').addEventListener('click', () => {
    controls.lock();
  });

  controls.addEventListener('lock', () => {
    document.getElementById('click-to-start').classList.add('hidden');
  });

  controls.addEventListener('unlock', () => {
    document.getElementById('click-to-start').classList.remove('hidden');
  });

  // Clock
  clock = new THREE.Clock();

  // Input
  document.addEventListener('keydown', e => {
    const k = e.key.toLowerCase();
    if (k === 'w' || k === 'arrowup')    keys.w = true;
    if (k === 'a' || k === 'arrowleft')  keys.a = true;
    if (k === 's' || k === 'arrowdown')  keys.s = true;
    if (k === 'd' || k === 'arrowright') keys.d = true;
    if (k === 'e') tryEnterDoor();
  });

  document.addEventListener('keyup', e => {
    const k = e.key.toLowerCase();
    if (k === 'w' || k === 'arrowup')    keys.w = false;
    if (k === 'a' || k === 'arrowleft')  keys.a = false;
    if (k === 's' || k === 'arrowdown')  keys.s = false;
    if (k === 'd' || k === 'arrowright') keys.d = false;
  });

  // Resize
  window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });

  // Start game loop
  animate();
}

// ─────────────────────────────────────────────
// Game loop
// ─────────────────────────────────────────────

function animate() {
  animationId = requestAnimationFrame(animate);

  const delta = clock.getDelta();

  // Movement
  if (controls.isLocked) {
    velocity.x -= velocity.x * 10 * delta;
    velocity.z -= velocity.z * 10 * delta;

    direction.z = Number(keys.w) - Number(keys.s);
    direction.x = Number(keys.d) - Number(keys.a);
    direction.normalize();

    if (keys.w || keys.s) velocity.z -= direction.z * MOVE_SPEED * delta * 60;
    if (keys.a || keys.d) velocity.x -= direction.x * MOVE_SPEED * delta * 60;

    controls.moveRight(-velocity.x * delta);
    controls.moveForward(-velocity.z * delta);

    // Floor clamp
    camera.position.y = 1.7;
  }

  // Animate torches / NPC
  animateLights(delta);
  checkDoorProximity();

  renderer.render(scene, camera);
}

// ─────────────────────────────────────────────
// Room loading
// ─────────────────────────────────────────────

async function loadRoom(roomId, withTransition = true) {
  if (isTransitioning) return;
  isTransitioning = true;

  const roomData = worldState.rooms[roomId];
  if (!roomData) { isTransitioning = false; return; }

  // Transition flash
  if (withTransition) {
    const t = document.getElementById('transition');
    t.classList.add('flash');
    await new Promise(r => setTimeout(r, 400));
  }

  // Clear previous room
  clearRoom();

  // Reset camera position
  camera.position.set(0, 1.7, 0);
  camera.lookAt(0, 1.7, -5);

  // Update world state
  currentRoomId = roomId;
  enterRoom(roomId);

  // Build the room geometry
  await buildRoom(roomId, roomData);

  // Un-flash
  if (withTransition) {
    const t = document.getElementById('transition');
    t.classList.remove('flash');
    await new Promise(r => setTimeout(r, 100));
  }

  // Update minimap
  updateMinimapUI(roomId);

  // Show room name
  showRoomName(roomData.displayName);

  // Get AI narration (async, non-blocking for non-critical path)
  narrateRoomEntry(roomId).then(result => {
    showRoomDescription(result.description);
    if (result.whisper) {
      setTimeout(() => showWhisper(result.whisper), 3000);
    }
    // If charred event exists, apply visual
    if (roomData.events.includes('charred')) {
      applyCharEffect();
    }
    // NPC dialogue
    if (roomData.hasNPC) {
      setTimeout(() => triggerNPCDialogue(roomId), 2000);
    }
  });

  isTransitioning = false;
}

function clearRoom() {
  currentRoomObjects.forEach(obj => {
    scene.remove(obj);
    obj.geometry?.dispose();
    if (obj.material) {
      Array.isArray(obj.material)
        ? obj.material.forEach(m => m.dispose())
        : obj.material.dispose();
    }
  });
  currentRoomObjects = [];
  doorObjects = [];
  if (npcMesh) { scene.remove(npcMesh); npcMesh = null; }
}

async function buildRoom(roomId, roomData) {
  // ── Ambient light
  const ambient = new THREE.AmbientLight(0x1a1208, 0.3);
  scene.add(ambient);
  currentRoomObjects.push(ambient);

  // ── Room geometry (procedural fallback — always works without a .glb)
  buildProceduralRoom(roomId, roomData);

  // ── Try loading GLTF if available
  const loader = new GLTFLoader();
  const meshUrl = `assets/rooms/${roomData.meshFile}`;
  loader.load(
    meshUrl,
    (gltf) => {
      const model = gltf.scene;
      model.traverse(child => {
        if (child.isMesh) {
          child.castShadow = true;
          child.receiveShadow = true;
        }
      });
      scene.add(model);
      currentRoomObjects.push(model);
    },
    undefined,
    () => {} // Silently fail — procedural room is already shown
  );

  // ── Doors
  buildDoors(roomId);

  // ── NPC
  if (roomData.hasNPC) buildNPC();
}

function buildProceduralRoom(roomId, roomData) {
  const roomColors = {
    entrance: { wall: 0x1a1614, floor: 0x0f0d0b, torch: 0xc06020 },
    altar:    { wall: 0x1e1a16, floor: 0x141210, torch: 0xd0a030 },
    throne:   { wall: 0x1c1818, floor: 0x121010, torch: 0xa08030 },
    crypt:    { wall: 0x141618, floor: 0x0c0e10, torch: 0x4060a0 },
    forge:    { wall: 0x201410, floor: 0x180e08, torch: 0xff4010 },
    garden:   { wall: 0x141a10, floor: 0x101408, torch: 0x40a020 },
    library:  { wall: 0x181610, floor: 0x100e08, torch: 0xe0c060 },
  };
  const c = roomColors[roomId] || roomColors.entrance;

  const wallMat = new THREE.MeshLambertMaterial({ color: c.wall });
  const floorMat = new THREE.MeshLambertMaterial({ color: c.floor });

  const size = 16;
  const height = 7;

  // Floor
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(size, size), floorMat);
  floor.rotation.x = -Math.PI / 2;
  floor.receiveShadow = true;
  scene.add(floor);
  currentRoomObjects.push(floor);

  // Ceiling
  const ceiling = new THREE.Mesh(new THREE.PlaneGeometry(size, size), wallMat);
  ceiling.rotation.x = Math.PI / 2;
  ceiling.position.y = height;
  scene.add(ceiling);
  currentRoomObjects.push(ceiling);

  // Walls
  const wallGeom = new THREE.PlaneGeometry(size, height);
  const walls = [
    { pos: [0, height / 2, -size / 2], rot: [0, 0, 0] },
    { pos: [0, height / 2, size / 2],  rot: [0, Math.PI, 0] },
    { pos: [-size / 2, height / 2, 0], rot: [0, Math.PI / 2, 0] },
    { pos: [size / 2, height / 2, 0],  rot: [0, -Math.PI / 2, 0] },
  ];
  walls.forEach(({ pos, rot }) => {
    const wall = new THREE.Mesh(wallGeom, wallMat);
    wall.position.set(...pos);
    wall.rotation.set(...rot);
    wall.receiveShadow = true;
    scene.add(wall);
    currentRoomObjects.push(wall);
  });

  // Torches
  const torchPositions = [[-6, 2.5, -7.5], [6, 2.5, -7.5], [-7.5, 2.5, 0], [7.5, 2.5, 0]];
  torchPositions.forEach(([x, y, z]) => {
    // Torch mesh
    const torch = new THREE.Mesh(
      new THREE.CylinderGeometry(0.04, 0.04, 0.3, 6),
      new THREE.MeshLambertMaterial({ color: 0x4a2800 })
    );
    torch.position.set(x, y, z);
    scene.add(torch);
    currentRoomObjects.push(torch);

    // Flame
    const flame = new THREE.Mesh(
      new THREE.SphereGeometry(0.08, 6, 6),
      new THREE.MeshBasicMaterial({ color: c.torch })
    );
    flame.position.set(x, y + 0.2, z);
    flame.userData.isFlame = true;
    scene.add(flame);
    currentRoomObjects.push(flame);

    // Point light
    const light = new THREE.PointLight(c.torch, 0.8, 8, 2);
    light.position.set(x, y + 0.2, z);
    light.castShadow = true;
    light.userData.isTorchLight = true;
    scene.add(light);
    currentRoomObjects.push(light);
  });

  // Room-specific props
  buildRoomProps(roomId, wallMat);
}

function buildRoomProps(roomId, mat) {
  const darkMat = new THREE.MeshLambertMaterial({ color: 0x0a0806 });
  const stoneMat = new THREE.MeshLambertMaterial({ color: 0x2a2522 });

  if (roomId === 'altar') {
    // Altar block
    const altar = new THREE.Mesh(new THREE.BoxGeometry(1.5, 1, 2.5), stoneMat);
    altar.position.set(0, 0.5, -5);
    altar.castShadow = true;
    scene.add(altar);
    currentRoomObjects.push(altar);
    // Glow above altar
    const glow = new THREE.PointLight(0xd0a030, 0.5, 4);
    glow.position.set(0, 2, -5);
    scene.add(glow);
    currentRoomObjects.push(glow);
  }

  if (roomId === 'throne') {
    // Throne
    const seat = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.4, 1.2), darkMat);
    seat.position.set(0, 0.2, -6);
    scene.add(seat);
    currentRoomObjects.push(seat);
    const back = new THREE.Mesh(new THREE.BoxGeometry(1.5, 2.5, 0.2), darkMat);
    back.position.set(0, 1.45, -6.6);
    scene.add(back);
    currentRoomObjects.push(back);
    // Throne light
    const throneLight = new THREE.SpotLight(0x8060a0, 1, 10, Math.PI / 6);
    throneLight.position.set(0, 6, -4);
    throneLight.target.position.set(0, 0, -6);
    scene.add(throneLight);
    scene.add(throneLight.target);
    currentRoomObjects.push(throneLight, throneLight.target);
  }

  if (roomId === 'forge') {
    // Forge furnace
    const furnace = new THREE.Mesh(new THREE.BoxGeometry(2, 2, 1.5), stoneMat);
    furnace.position.set(-4, 1, -5);
    scene.add(furnace);
    currentRoomObjects.push(furnace);
    const forgeFire = new THREE.PointLight(0xff4010, 2, 6);
    forgeFire.position.set(-4, 2.2, -5);
    forgeFire.userData.isTorchLight = true;
    scene.add(forgeFire);
    currentRoomObjects.push(forgeFire);
    // Anvil
    const anvil = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.5, 0.4), darkMat);
    anvil.position.set(0, 0.25, -3);
    scene.add(anvil);
    currentRoomObjects.push(anvil);
  }

  if (roomId === 'library') {
    // Bookshelves
    for (let i = -1; i <= 1; i++) {
      const shelf = new THREE.Mesh(new THREE.BoxGeometry(0.3, 4, 3), darkMat);
      shelf.position.set(-7.8, 2, i * 3.5);
      scene.add(shelf);
      currentRoomObjects.push(shelf);
    }
  }
}

function buildDoors(roomId) {
  const doors = DOOR_POSITIONS[roomId] || [];
  doors.forEach(door => {
    const doorGeom = new THREE.PlaneGeometry(2, 3);
    const doorMat = new THREE.MeshBasicMaterial({
      color: 0xc9a84c,
      transparent: true,
      opacity: 0.15,
      side: THREE.DoubleSide,
    });
    const doorMesh = new THREE.Mesh(doorGeom, doorMat);
    doorMesh.position.set(...door.position);
    doorMesh.position.y = 1.5;

    // Face toward center
    doorMesh.lookAt(0, 1.5, 0);

    // Label
    const canvas = document.createElement('canvas');
    canvas.width = 256; canvas.height = 64;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = 'rgba(0,0,0,0)';
    ctx.fillRect(0, 0, 256, 64);
    ctx.font = '500 18px "Cinzel", serif';
    ctx.fillStyle = '#c9a84c';
    ctx.textAlign = 'center';
    ctx.fillText(door.label, 128, 38);
    const tex = new THREE.CanvasTexture(canvas);
    const labelMesh = new THREE.Mesh(
      new THREE.PlaneGeometry(3, 0.75),
      new THREE.MeshBasicMaterial({ map: tex, transparent: true, side: THREE.DoubleSide })
    );
    labelMesh.position.copy(doorMesh.position);
    labelMesh.position.y = 3.4;
    labelMesh.lookAt(0, 3.4, 0);

    doorMesh.userData.isDoor = true;
    doorMesh.userData.targetRoom = door.target;

    scene.add(doorMesh, labelMesh);
    currentRoomObjects.push(doorMesh, labelMesh);
    doorObjects.push(doorMesh);
  });
}

function buildNPC() {
  // Simple NPC — a floating orb of light with a humanoid suggestion
  const npcGroup = new THREE.Group();
  npcGroup.position.set(0, 0, -5.5);

  const bodyMat = new THREE.MeshLambertMaterial({ color: 0x2a1a3a, emissive: 0x1a0a2a });
  const body = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.3, 1.4, 8), bodyMat);
  body.position.y = 0.7;
  npcGroup.add(body);

  const head = new THREE.Mesh(new THREE.SphereGeometry(0.22, 8, 8), bodyMat);
  head.position.y = 1.6;
  npcGroup.add(head);

  // Soul glow
  const soulLight = new THREE.PointLight(0x8040d0, 0.6, 3);
  soulLight.position.y = 1.6;
  soulLight.userData.isNPCLight = true;
  npcGroup.add(soulLight);

  scene.add(npcGroup);
  npcMesh = npcGroup;
  currentRoomObjects.push(npcGroup);
}

// ─────────────────────────────────────────────
// Animations
// ─────────────────────────────────────────────

let torchTimer = 0;
function animateLights(delta) {
  torchTimer += delta;
  scene.children.forEach(obj => {
    if (obj.userData?.isTorchLight) {
      obj.intensity = 0.7 + Math.sin(torchTimer * 3 + obj.id) * 0.15;
    }
    if (obj.userData?.isFlame) {
      obj.scale.y = 1 + Math.sin(torchTimer * 4 + obj.id * 0.5) * 0.2;
    }
    if (obj.userData?.isNPCLight) {
      obj.intensity = 0.5 + Math.sin(torchTimer * 1.5) * 0.15;
    }
  });
  if (npcMesh) {
    npcMesh.position.y = Math.sin(torchTimer * 0.8) * 0.06;
    npcMesh.rotation.y = torchTimer * 0.2;
  }
}

// ─────────────────────────────────────────────
// Door proximity check
// ─────────────────────────────────────────────

let nearDoor = null;
function checkDoorProximity() {
  const playerPos = camera.position;
  nearDoor = null;
  let closest = 2.5;

  doorObjects.forEach(door => {
    const dist = playerPos.distanceTo(door.position);
    if (dist < closest) {
      closest = dist;
      nearDoor = door;
    }
  });

  const prompt = document.getElementById('door-prompt');
  if (nearDoor && !doorPromptVisible) {
    doorPromptVisible = true;
    prompt.classList.add('visible');
  } else if (!nearDoor && doorPromptVisible) {
    doorPromptVisible = false;
    prompt.classList.remove('visible');
  }
}

function tryEnterDoor() {
  if (nearDoor && !isTransitioning) {
    loadRoom(nearDoor.userData.targetRoom);
  }
}

// ─────────────────────────────────────────────
// Visual effects
// ─────────────────────────────────────────────

function applyCharEffect() {
  scene.traverse(obj => {
    if (obj.isMesh && obj.material && !obj.userData.isDoor) {
      const m = obj.material;
      if (m.color) {
        m.color.multiplyScalar(0.4);
        m.color.r += 0.05;
      }
    }
  });
}

// ─────────────────────────────────────────────
// HUD helpers
// ─────────────────────────────────────────────

let nameTimeout, descTimeout;
function showRoomName(name) {
  const el = document.getElementById('room-name');
  el.textContent = name;
  el.classList.remove('visible');
  clearTimeout(nameTimeout);
  setTimeout(() => el.classList.add('visible'), 100);
  nameTimeout = setTimeout(() => el.classList.remove('visible'), 6000);
}

function showRoomDescription(desc) {
  const el = document.getElementById('room-desc');
  el.textContent = desc;
  el.classList.remove('visible');
  clearTimeout(descTimeout);
  setTimeout(() => el.classList.add('visible'), 400);
  descTimeout = setTimeout(() => el.classList.remove('visible'), 8000);
}

function showWhisper(text) {
  const el = document.getElementById('room-desc');
  el.textContent = `"${text}"`;
  el.classList.add('visible');
  setTimeout(() => el.classList.remove('visible'), 5000);
}

async function triggerNPCDialogue(roomId) {
  const line = await getNPCDialogue(roomId);
  if (line) showRoomDescription(line);
}

// ─────────────────────────────────────────────
// Minimap
// ─────────────────────────────────────────────

function buildMinimapUI() {
  const grid = document.getElementById('minimap-grid');
  grid.innerHTML = '';

  MINIMAP_LAYOUT.forEach((row, r) => {
    row.forEach((id, c) => {
      const cell = document.createElement('div');
      cell.className = 'map-cell' + (id ? '' : ' empty');
      if (id) {
        cell.dataset.roomId = id;
        const lbl = document.createElement('div');
        lbl.className = 'map-cell-label';
        lbl.textContent = worldState.rooms[id]?.displayName?.split(' ')[1] || id;
        cell.appendChild(lbl);
        cell.addEventListener('click', () => {
          if (worldState.rooms[id]?.visited) loadRoom(id);
        });
      }
      grid.appendChild(cell);
    });
  });
}

function updateMinimapUI(activeRoomId) {
  document.querySelectorAll('.map-cell[data-room-id]').forEach(cell => {
    const id = cell.dataset.roomId;
    const room = worldState.rooms[id];
    cell.classList.remove('active', 'visited', 'charred');
    if (id === activeRoomId) cell.classList.add('active');
    else if (room?.visited) {
      cell.classList.add(room.events.includes('charred') ? 'charred' : 'visited');
    }
  });
}

// ─────────────────────────────────────────────
// Player action handler (called from HTML buttons)
// ─────────────────────────────────────────────

window.performAction = async function (action) {
  const roomData = worldState.rooms[currentRoomId];
  if (!roomData) return;

  // Disable buttons briefly
  document.querySelectorAll('.action-btn').forEach(b => b.setAttribute('disabled', ''));

  const result = await narrateAction(currentRoomId, action);
  showRoomDescription(result.consequence);

  // Apply visual change for burn
  if (action === 'burn' && !roomData.events.includes('charred')) {
    addReputation('arsonist', 3);
    applyCharEffect();
    // Dim the lights dramatically
    scene.children.forEach(obj => {
      if (obj.userData?.isTorchLight) obj.intensity *= 0.3;
    });
    // Add smoke particles
    addSmokeParticles();
  }

  if (action === 'examine') addReputation('explorer', 2);
  if (action === 'linger')  addReputation('wanderer', 2);

  setTimeout(() => {
    document.querySelectorAll('.action-btn').forEach(b => b.removeAttribute('disabled'));
  }, 2000);
};

// ─────────────────────────────────────────────
// Smoke particles (post-burn visual)
// ─────────────────────────────────────────────

function addSmokeParticles() {
  const count = 40;
  const positions = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    positions[i * 3]     = (Math.random() - 0.5) * 12;
    positions[i * 3 + 1] = Math.random() * 5;
    positions[i * 3 + 2] = (Math.random() - 0.5) * 12;
  }
  const geom = new THREE.BufferGeometry();
  geom.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  const mat = new THREE.PointsMaterial({ color: 0x1a1610, size: 0.15, transparent: true, opacity: 0.5 });
  const particles = new THREE.Points(geom, mat);
  particles.userData.isSmoke = true;
  scene.add(particles);
  currentRoomObjects.push(particles);
}

// ─────────────────────────────────────────────
// Loading progress
// ─────────────────────────────────────────────

function setLoadingProgress(pct, status) {
  document.getElementById('loading-bar').style.width = pct + '%';
  document.getElementById('loading-status').textContent = status;
  return new Promise(r => setTimeout(r, 80));
}
