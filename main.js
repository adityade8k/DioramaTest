import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { PointerLockControls } from "three/addons/controls/PointerLockControls.js";

const CAMERA_Y_POSITION = 1.7;
const MODEL_SCALE = 0.2;

const MODEL_POSITION_X = 0;
const MODEL_POSITION_Y = 0;
const MODEL_POSITION_Z = 0;

const MODEL_ROTATION_X = 0;
const MODEL_ROTATION_Y = 0;
const MODEL_ROTATION_Z = 0;

const MOVE_SPEED = 15.2;
const LOOK_START_POSITION = new THREE.Vector3(0, CAMERA_Y_POSITION, 3);

const canvas = document.querySelector("#scene-canvas");
const statusElement = document.querySelector("#status");

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x161616);

const camera = new THREE.PerspectiveCamera(
  70,
  window.innerWidth / window.innerHeight,
  0.05,
  1000,
);
camera.position.copy(LOOK_START_POSITION);

const renderer = new THREE.WebGLRenderer({
  canvas,
  antialias: true,
  powerPreference: "high-performance",
});
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1;

const controls = new PointerLockControls(camera, document.body);
const clock = new THREE.Clock();
const loader = new GLTFLoader();
const keys = new Set();

let loadedEnvironment = null;

scene.add(new THREE.HemisphereLight(0xffffff, 0x444444, 1.6));

const sun = new THREE.DirectionalLight(0xffffff, 2.4);
sun.position.set(4, 8, 3);
scene.add(sun);

loader.load(
  "./scene.gltf",
  (gltf) => {
    loadedEnvironment = gltf.scene;
    loadedEnvironment.position.set(
      MODEL_POSITION_X,
      MODEL_POSITION_Y,
      MODEL_POSITION_Z,
    );
    loadedEnvironment.rotation.set(
      MODEL_ROTATION_X,
      MODEL_ROTATION_Y,
      MODEL_ROTATION_Z,
    );
    loadedEnvironment.scale.setScalar(MODEL_SCALE);

    loadedEnvironment.traverse((child) => {
      if (child.isMesh) {
        child.castShadow = false;
        child.receiveShadow = true;
        if (child.material) {
          child.material.needsUpdate = true;
        }
      }
    });

    scene.add(loadedEnvironment);
    statusElement.textContent = "Press Space to lock controls";
  },
  undefined,
  (error) => {
    console.error("Unable to load scene.glb", error);
    statusElement.textContent = "Unable to load scene.glb";
  },
);

controls.addEventListener("lock", () => {
  statusElement.textContent = "WASD to move. Space unlocks.";
});

controls.addEventListener("unlock", () => {
  statusElement.textContent = "Press Space to lock controls";
});

window.addEventListener("keydown", (event) => {
  if (event.code === "Space") {
    event.preventDefault();
    if (event.repeat) {
      return;
    }

    if (controls.isLocked) {
      controls.unlock();
    } else {
      controls.lock();
    }
    return;
  }

  keys.add(event.code);
});

window.addEventListener("keyup", (event) => {
  keys.delete(event.code);
});

window.addEventListener("blur", () => {
  keys.clear();
});

window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

function updateMovement(delta) {
  if (!controls.isLocked) {
    return;
  }

  const forward =
    Number(keys.has("KeyW") || keys.has("ArrowUp")) -
    Number(keys.has("KeyS") || keys.has("ArrowDown"));
  const right =
    Number(keys.has("KeyD") || keys.has("ArrowRight")) -
    Number(keys.has("KeyA") || keys.has("ArrowLeft"));

  if (forward !== 0) {
    controls.moveForward(forward * MOVE_SPEED * delta);
  }

  if (right !== 0) {
    controls.moveRight(right * MOVE_SPEED * delta);
  }

  camera.position.y = CAMERA_Y_POSITION;
}

function animate() {
  requestAnimationFrame(animate);
  updateMovement(clock.getDelta());
  renderer.render(scene, camera);
}

animate();
