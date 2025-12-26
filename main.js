import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { DRACOLoader } from "three/addons/loaders/DRACOLoader.js";

let mixers = [];
const clock = new THREE.Clock();
let targetFOV = 70;
let nahomeMixer, roomMixer;

let videoTexture = null;
let projectScreenTexture = null;

let homeCamera, aboutCamera, roomCamera;

let currentAction;
let nahomeModel,
  blender,
  figma,
  illustrator,
  javascript,
  photoshop,
  react,
  bedroom;

let nahomeNeckBone,
  nahomeWaistBone,
  idle,
  handsForward,
  standUp,
  landing,
  backFlip,
  smiling,
  typing,
  blink,
  currentlyAnimating = false,
  raycaster = new THREE.Raycaster();

let screenLeft, screenMiddle, screenRight;

const foreground = document.getElementById("appsFore");
const middleGround = document.getElementById("appsMiddle");
const background = document.getElementById("appsBack");

let foreModels = [];
let middleModels = [];
let backModels = [];

/* --------------------------------------------------
   RENDERER / LIGHTS
-------------------------------------------------- */

function createRenderer(container, camera) {
  const renderer = new THREE.WebGLRenderer({
    alpha: true,
    antialias: true,
  });
  renderer.setSize(container.clientWidth, container.clientHeight);
  renderer.toneMapping = THREE.CineonToneMapping;
  renderer.toneMappingExposure = 2;
  renderer.shadowMap.enabled = true;
  renderer.setClearColor(0xffffff, 0);
  container.appendChild(renderer.domElement);

  window.addEventListener("resize", () => {
    camera.aspect = container.clientWidth / container.clientHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(container.clientWidth, container.clientHeight);
  });

  return renderer;
}

function addLights(scene) {
  const light = new THREE.HemisphereLight(0x000000, 0xffffff, 2);
  light.position.set(0, 10, -30);
  scene.add(light);
}

function addLightsAbout(scene) {
  const light = new THREE.HemisphereLight(0xffffff, 0xcf5e5e, 2.1);
  light.position.set(0, 10, 0);
  scene.add(light);
}

function addLightsRoom(scene) {
  const light = new THREE.HemisphereLight(0x000000, 0xffffff, 3);
  light.position.set(0, 10, 0);
  scene.add(light);
}

function addModel(scene, modelPath) {
  return new Promise((resolve, reject) => {
    const loader = new GLTFLoader();
    const draco = new DRACOLoader();
    draco.setDecoderPath("https://www.gstatic.com/draco/v1/decoders/");
    loader.setDRACOLoader(draco);

    loader.load(
      modelPath,
      (gltf) => {
        const root = gltf.scene;
        scene.add(root);

        if (modelPath.includes("nahomeRig.glb")) {
          root.traverse((child) => {
            if (child.name === "mixamorigNeck") {
              nahomeNeckBone = child;
            }

            if (child.name === "mixamorigSpine") {
              nahomeWaistBone = child;
            }

            if (child.isMesh) {
              child.castShadow = true;
              child.receiveShadow = true;
            }
          });

          nahomeMixer = new THREE.AnimationMixer(root);
          const clips = gltf.animations;

          idle = nahomeMixer.clipAction(
            THREE.AnimationClip.findByName(clips, "idle")
          );
          handsForward = nahomeMixer.clipAction(
            THREE.AnimationClip.findByName(clips, "handsForward")
          );
          standUp = nahomeMixer.clipAction(
            THREE.AnimationClip.findByName(clips, "sitToStand")
          );
          landing = nahomeMixer.clipAction(
            THREE.AnimationClip.findByName(clips, "fallToIdle")
          );
          backFlip = nahomeMixer.clipAction(
            THREE.AnimationClip.findByName(clips, "flip")
          );
          smiling = nahomeMixer.clipAction(
            THREE.AnimationClip.findByName(clips, "smile")
          );
          blink = nahomeMixer.clipAction(
            THREE.AnimationClip.findByName(clips, "blink")
          );

          currentAction = idle;
          currentAction.play();

          mixers.push(nahomeMixer);
          nahomeModel = root;
        }

        if (modelPath.includes("apps.glb")) {
          root.traverse((child) => {
            if (child.name.includes("blender")) {
              middleModels.push(child);
              blender = child;
              child.position.x += 1;
              child.position.y += 0.25;
            }

            if (child.name.includes("figmaglb")) {
              middleModels.push(child);
              figma = child;
              child.position.x += 1;
              child.position.y += 0.25;
            }

            if (child.name.includes("illustratorglb")) {
              illustrator = child;
              foreModels.push(child);
              child.position.x += 1;
              child.position.y += 0.5;
            }

            if (child.name.includes("javascriptglb")) {
              javascript = child;
              backModels.push(child);
              child.position.x += 2;
              child.position.y += 0.5;
            }

            if (child.name.includes("photoshopglb")) {
              photoshop = child;
              child.position.x -= 1;
              foreModels.push(child);
            }

            if (child.name.includes("reactglb")) {
              react = child;
              backModels.push(child);
              child.position.x -= 2.5;
            }
          });
        }

        if (modelPath.includes("bedRoom.glb")) {
          roomMixer = new THREE.AnimationMixer(root);
          const clips = gltf.animations;

          typing = roomMixer.clipAction(
            THREE.AnimationClip.findByName(clips, "typingAction")
          );

          root.traverse((child) => {
            if (!child.isMesh) return;
            if (child.name === "screen001") screenLeft = child;
            if (child.name === "screen002") screenMiddle = child;
            if (child.name === "screen003") screenRight = child;
          });

          const videoDOM = document.getElementById("theOffice");
          if (videoDOM) {
            videoDOM.muted = true;
            videoDOM.loop = true;
            videoDOM.playsInline = true;

            videoDOM.play().catch(() => {});

            videoTexture = new THREE.VideoTexture(videoDOM);
            videoTexture.colorSpace = THREE.SRGBColorSpace;
            videoTexture.minFilter = THREE.LinearFilter;
            videoTexture.magFilter = THREE.LinearFilter;
            videoTexture.generateMipmaps = false;
          }

          const officeScreenMat = new THREE.MeshBasicMaterial({
            map: videoTexture ?? null,
            toneMapped: false,
          });

          const projectsEl = document.querySelector(".projects-inner");

          if (projectsEl) {
            const canvas = document.createElement("canvas");
            canvas.width = 1920;
            canvas.height = 1080;

            projectScreenTexture = new THREE.CanvasTexture(canvas);
            projectScreenTexture.colorSpace = THREE.SRGBColorSpace;
            projectScreenTexture.minFilter = THREE.LinearFilter;
            projectScreenTexture.magFilter = THREE.LinearFilter;
            projectScreenTexture.generateMipmaps = false;
          }

          const projectScreenMat = new THREE.MeshBasicMaterial({
            map: projectScreenTexture ?? null,
            toneMapped: false,
            transparent: false,
          });

          if (screenLeft) screenLeft.material = officeScreenMat;
          if (screenRight) screenRight.material = officeScreenMat;
          if (screenMiddle) screenMiddle.material = officeScreenMat;

          typing?.play();
          mixers.push(roomMixer);
          bedroom = root;
        }

        resolve(root);
      },
      undefined,
      (err) => reject(err)
    );
  });
}

function switchAnimation(newAction) {
  if (!newAction || currentAction === newAction) return;

  if (currentAction) {
    currentAction.fadeOut(0.25);
  }

  currentAction = newAction;

  if (newAction.loop === THREE.LoopOnce) {
    currentAction.reset();
  }

  currentAction.fadeIn(0.25).play();
}

async function homeInit() {
  const container = document.getElementById("nahomeScreen");
  const scene = new THREE.Scene();

  homeCamera = new THREE.PerspectiveCamera(
    50,
    container.clientWidth / container.clientHeight,
    0.1,
    2000
  );

  homeCamera.position.set(0, 1.500, 3.500);
  homeCamera.rotation.x = THREE.MathUtils.degToRad(-8.40);
  homeCamera.rotation.y = 0;
  homeCamera.rotation.z = 0;

  const renderer = createRenderer(container, homeCamera);
  addLights(scene);

  [nahomeModel, blender, figma, illustrator, javascript, photoshop, react] =
    await Promise.all([
      addModel(scene, "./nahomeRig.glb"),
      addModel(scene, "./apps.glb"),
    ]);

  const nahome = nahomeModel;
  nahome.position.set(0, 0, 0);

  function animate() {
    requestAnimationFrame(animate);

    const delta = clock.getDelta();

    mixers.forEach((m) => m.update(delta));

    renderer.render(scene, homeCamera);
  }

  animate();
}

function createLayer(container) {
  const scene = new THREE.Scene();

  const renderer = new THREE.WebGLRenderer({
    alpha: true,
    antialias: true,
  });

  renderer.setSize(container.clientWidth, container.clientHeight);
  container.appendChild(renderer.domElement);

  addLights(scene);

  return {
    scene,
    renderer,
  };
}

function addModelsToLayer(models, scene) {
  models.forEach((model) => {
    scene.add(model);
  });
}

async function appsInit() {
  if (!homeCamera) {
    requestAnimationFrame(appsInit);
    return;
  }

  const foreLayer = createLayer(foreground);
  const middleLayer = createLayer(middleGround);
  const backLayer = createLayer(background);

  addModelsToLayer(foreModels, foreLayer.scene);
  addModelsToLayer(middleModels, middleLayer.scene);
  addModelsToLayer(backModels, backLayer.scene);

  const appLayers = [foreModels, middleModels, backModels];

  function animate() {
    requestAnimationFrame(animate);

    foreLayer.renderer.render(foreLayer.scene, homeCamera);
    middleLayer.renderer.render(middleLayer.scene, homeCamera);
    backLayer.renderer.render(backLayer.scene, homeCamera);

    const time = Date.now() * 0.001;

    appLayers.forEach((layer, i) => {
      layer.forEach((mesh) => {
        mesh.position.y += Math.sin(time + i) * 0.005;
        mesh.rotation.y += 0.005;
      });
    });
  }

  animate();
}

async function aboutInit(container) {
  const scene = new THREE.Scene();

  aboutCamera = new THREE.PerspectiveCamera(
    26.9,
    container.clientWidth / container.clientHeight,
    0.7,
    1000
  );

  aboutCamera.position.set(0, 0.14, 0);

  addLightsAbout(scene);

  const renderer = createRenderer(container, aboutCamera);

  const nahome = await addModel(scene, "./nahomeRig.glb");
  nahome.position.set(0, -1.52, -1.601);

  currentAction = smiling;
  currentAction.play();

  function animate() {
    requestAnimationFrame(animate);

    const delta = clock.getDelta();

    mixers.forEach((m) => m.update(delta));

    renderer.render(scene, aboutCamera);
  }

  animate();
}

async function roomInit() {
  const container = document.getElementById("bedroomCanvas");
  const scene = new THREE.Scene();

  roomCamera = new THREE.PerspectiveCamera(
    50.0,
    container.clientWidth / container.clientHeight,
    0.1,
    2000
  );

  addLightsRoom(scene);

  roomCamera.position.set(0, 1.16, 0);
  roomCamera.rotation.x = 0;
  roomCamera.rotation.y = THREE.MathUtils.degToRad(180);
  roomCamera.rotation.z = 0;

  const renderer = createRenderer(container, roomCamera);

  bedroom = await addModel(scene, "./bedRoom.glb");
  const bedroomModel = bedroom;
  bedroomModel.position.set(0, 0, 0);

  function animate() {
    requestAnimationFrame(animate);

    const delta = clock.getDelta();

    mixers.forEach((m) => m.update(delta));

    renderer.render(scene, roomCamera);
  }

  animate();
}

document.addEventListener("mousemove", function (e) {
  var mousecoords = getMousePos(e);
  if (nahomeNeckBone && nahomeWaistBone) {
    moveJoint(mousecoords, nahomeNeckBone, 50);
    moveJoint(mousecoords, nahomeWaistBone, 30);
  }
});

function getMousePos(e) {
  return {
    x: e.clientX,
    y: e.clientY,
  };
}

function moveJoint(mouse, joint, degreeLimit) {
  let degrees = getMouseDegrees(mouse.x, mouse.y, degreeLimit);
  joint.rotation.y = THREE.MathUtils.degToRad(degrees.x);
  joint.rotation.x = THREE.MathUtils.degToRad(degrees.y);
}

function getMouseDegrees(x, y, degreeLimit) {
  let dx = 0,
    dy = 0,
    xdiff,
    xPercentage,
    ydiff,
    yPercentage;

  let w = {
    x: window.innerWidth,
    y: window.innerHeight,
  };

  if (x <= w.x / 2) {
    xdiff = w.x / 2 - x;
    xPercentage = (xdiff / (w.x / 2)) * 100;
    dx = ((degreeLimit * xPercentage) / 100) * -1;
  }

  if (x >= w.x / 2) {
    xdiff = x - w.x / 2;
    xPercentage = (xdiff / (w.x / 2)) * 100;
    dx = (degreeLimit * xPercentage) / 100;
  }

  if (y <= w.y / 2) {
    ydiff = w.y / 2 - y;
    yPercentage = (ydiff / (w.y / 2)) * 100;
    dy = ((degreeLimit * 0.5 * yPercentage) / 100) * -1;
  }

  if (y >= w.y / 2) {
    ydiff = y - w.y / 2;
    yPercentage = (ydiff / (w.y / 2)) * 100;
    dy = (degreeLimit * yPercentage) / 100;
  }
  return {
    x: dx,
    y: dy,
  };
}

export function initHome() {
  homeInit().then(() => {
    appsInit();
  });
}

export function initAbout(container) {
  if (!container) return;
  aboutInit(container);
}

export function initRoom() {
  roomInit();
}
