import * as THREE from "./libs/three/build/three.module.js";
import { GLTFLoader } from "./libs/three/examples/jsm/loaders/GLTFLoader.js";
import { DRACOLoader } from "./libs/three/examples/jsm/loaders/DRACOLoader.js";
import { CSS3DRenderer, CSS3DObject } from "./libs/three/examples/jsm/renderers/CSS3DRenderer.js";

let mixers = [];
const clock = new THREE.Clock();
let nahomeMixer;
let pendingAnimations = [];

let FOV = 50;
let near = 0.1;

let homeCamera;

let nahomeModel,
  blender,
  figma,
  illustrator,
  javascript,
  photoshop,
  react,
  bedroomModel;

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
  runToJump,
  raycaster = new THREE.Raycaster();

let blenderAction, figmaAction, illustratorAction, javaAction, photoshopAction, reactAction;

let screenLeft, screenMiddle, screenRight;
let videoEl = null;
let projectsEl = null;
let galleryEl = null;
let scrollProgress;

let cssScene, cssRenderer;
let videoCSS3DObject, projectsCSS3DObject, galleryCSS3DObject;

let appsContainer = [];
let scrollTriggered = false;
let aboutTriggerY = 700;
let projectTriggerY = 3200;

function updateSectionTriggers() {
  const aboutEl = document.querySelector('.about');
  const projectsEl = document.querySelector('.projects');
  if (aboutEl) aboutTriggerY = Math.max(0, aboutEl.offsetTop - 100);
  if (projectsEl) projectTriggerY = Math.max(0, projectsEl.offsetTop - 100);
}

let targetCameraPosition = null;
let targetCameraRotation = null;
let manualCameraOverride = false;
let screenState = null;

// Performance optimization variables
let lastFrameTime = 0;
const targetFPS = 60;
const frameInterval = 1000 / targetFPS;

// Event listener cleanup management
let attachedEventListeners = [];

function addEventListenerWithCleanup(element, event, handler, options = null) {
  element.addEventListener(event, handler, options);
  attachedEventListeners.push({ element, event, handler, options });
}

function cleanupEventListeners() {
  attachedEventListeners.forEach(({ element, event, handler, options }) => {
    if (element && element.removeEventListener) {
      element.removeEventListener(event, handler, options);
    }
  });
  attachedEventListeners = [];
}

// Add cleanup on page unload
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', cleanupEventListeners);
}

// Position caching for CSS3D objects
let lastVideoScreenPosition = new THREE.Vector3();
let lastProjectsScreenPosition = new THREE.Vector3();
let lastGalleryScreenPosition = new THREE.Vector3();
let lastVideoScreenQuaternion = new THREE.Quaternion();
let lastProjectsScreenQuaternion = new THREE.Quaternion();
let lastGalleryScreenQuaternion = new THREE.Quaternion();
const positionUpdateThreshold = 0.01;

// Render state tracking
let lastCameraPosition = new THREE.Vector3();
let lastCameraRotation = new THREE.Euler();
let sceneNeedsRender = true;
let cssSceneNeedsRender = true;
let bedroomSceneNeedsRender = true;
let animationFramesSinceLastRender = 0;
const maxFramesBetweenRenders = 3;

function updateScrollProgress() {
  const doc = document.documentElement;
  const max = doc.scrollHeight - window.innerHeight;
  scrollProgress = max > 0 ? window.scrollY / max : 0;
}

addEventListenerWithCleanup(window, "scroll", updateScrollProgress, { passive: true });
addEventListenerWithCleanup(window, "resize", updateScrollProgress);

function startAllAnimations() {
  pendingAnimations.forEach(action => {
    if (action && typeof action.play === 'function') {
      action.play();
    }
  });
  pendingAnimations = [];
}

addEventListenerWithCleanup(window, 'loadingComplete', startAllAnimations);

function createRenderer(container, camera, composer = null) {
  const renderer = new THREE.WebGLRenderer({
    alpha: true,
    antialias: true,
  });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.toneMapping = THREE.CineonToneMapping;
  renderer.toneMappingExposure = 2;
  renderer.shadowMap.enabled = true;
  renderer.setClearColor(0xffffff, 0);
  renderer.domElement.style.position = 'absolute';
  renderer.domElement.style.top = '0';
  renderer.domElement.style.left = '0';
  renderer.domElement.style.zIndex = '0';
  renderer.domElement.style.pointerEvents = 'none';
  container.appendChild(renderer.domElement);

  addEventListenerWithCleanup(window, "resize", () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
    if (composer) {
      composer.setSize(window.innerWidth, window.innerHeight);
    }
  });

  return renderer;
}

function addLights(scene) {
  const light = new THREE.AmbientLight(0xffffff);
  light.intensity = 1;
  light.position.set(0, 0, 0);
  scene.add(light);

  const pointLight = new THREE.PointLight(0xff5100, 1000, 0);
  pointLight.distance = 0;
  pointLight.position.set(0, 8, -8);
  pointLight.castShadow = true;
  scene.add(pointLight);
}

function addModel(scene, modelPath) {
  return new Promise((resolve, reject) => {
    const loader = new GLTFLoader();
    try {
      const draco = new DRACOLoader();
      draco.setDecoderPath("https://www.gstatic.com/draco/v1/decoders/");
      loader.setDRACOLoader(draco);
    } catch (dracoError) {
    }

    const resolvedPath = new URL(modelPath, import.meta.url).href;
    loader.load(
      resolvedPath,
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
          runToJump = nahomeMixer.clipAction(
            THREE.AnimationClip.findByName(clips, "runToJump")
          );
          typing = nahomeMixer.clipAction(
            THREE.AnimationClip.findByName(clips, "typing")
          );

          runToJump.play();
          runToJump.loop = THREE.LoopOnce;
          runToJump.clampWhenFinished = true;
          pendingAnimations.push(runToJump);

          mixers.push(nahomeMixer);
          nahomeModel = root;
        }

        if (modelPath.includes("apps.glb")) {
          const appMixer = new THREE.AnimationMixer(root);
          const clips = gltf.animations;

          root.traverse((child) => {
            if (child.name.includes("blender")) {
              blender = child;
              blenderAction = appMixer.clipAction(
                THREE.AnimationClip.findByName(clips, "blenderAction")
              );
              blenderAction.loop = THREE.LoopOnce;
              blenderAction.clampWhenFinished = true;
              pendingAnimations.push(blenderAction);
            }

            if (child.name.includes("figma")) {
              figma = child;
              figmaAction = appMixer.clipAction(
                THREE.AnimationClip.findByName(clips, "figmaAction")
              );
              figmaAction.loop = THREE.LoopOnce;
              figmaAction.clampWhenFinished = true;
              pendingAnimations.push(figmaAction);
            }

            if (child.name.includes("illustrator")) {
              illustrator = child;
              illustratorAction = appMixer.clipAction(
                THREE.AnimationClip.findByName(clips, "illustratorAction")
              );
              illustratorAction.loop = THREE.LoopOnce;
              illustratorAction.clampWhenFinished = true;
              pendingAnimations.push(illustratorAction);
            }

            if (child.name.includes("javascript")) {
              javascript = child;
              javaAction = appMixer.clipAction(
                THREE.AnimationClip.findByName(clips, "javaAction")
              );
              javaAction.loop = THREE.LoopOnce;
              javaAction.clampWhenFinished = true;
              pendingAnimations.push(javaAction);
            }

            if (child.name.includes("photoshop")) {
              photoshop = child;
              photoshopAction = appMixer.clipAction(
                THREE.AnimationClip.findByName(clips, "photoshopAction")
              );
              photoshopAction.loop = THREE.LoopOnce;
              photoshopAction.clampWhenFinished = true;
              pendingAnimations.push(photoshopAction);
            }

            if (child.name.includes("react")) {
              react = child;
              reactAction = appMixer.clipAction(
                THREE.AnimationClip.findByName(clips, "reactAction")
              );
              reactAction.loop = THREE.LoopOnce;
              reactAction.clampWhenFinished = true;
              pendingAnimations.push(reactAction);
            }
          });

          mixers.push(appMixer);
        }

        if (modelPath.includes("bedRoom.glb")) {
          root.rotation.x = THREE.MathUtils.degToRad(0);
          root.rotation.y = THREE.MathUtils.degToRad(180.00);
          root.rotation.z = THREE.MathUtils.degToRad(0);
          bedroomModel = root;

          root.traverse((child) => {
            if (child.isMesh) {
              if (child.name === "leftScreen") {
                screenLeft = child;
              } else if (child.name === "middleScreen") {
                screenMiddle = child;
              } else if (child.name === "rightScreen") {
                screenRight = child;
              }
            }
          });
        }

        resolve(root);
      },
      undefined,
      (err) => {
        console.error(`Failed to load model: ${resolvedPath}`, err);
        reject(err);
      }
    );
  });
}

function setupCSS3DObjects() {
  if (bedroomModel && bedroomModel.parent) {
    bedroomModel.parent.updateMatrixWorld(true);
  }

  if (videoEl && screenLeft) {
    videoEl.loop = true;
    videoEl.muted = true;

    videoEl.style.width = '1440px';
    videoEl.style.height = '1024px';
    videoEl.style.opacity = '1';
    videoEl.style.background = '#000000';

    videoCSS3DObject = new CSS3DObject(videoEl);
    videoCSS3DObject.element.style.pointerEvents = 'auto';

    const leftBox = new THREE.Box3().setFromObject(screenLeft);
    const leftSize = new THREE.Vector3();
    leftBox.getSize(leftSize);

    const scaleX = leftSize.x / 1440;
    const scaleY = leftSize.y / 1024;
    videoCSS3DObject.scale.set(scaleX, scaleY, 1);

    const screenPos = new THREE.Vector3();
    const screenQuat = new THREE.Quaternion();
    screenLeft.getWorldPosition(screenPos);
    screenLeft.getWorldQuaternion(screenQuat);

    const rotationOffset = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), Math.PI);
    screenQuat.multiply(rotationOffset);

    videoCSS3DObject.position.copy(screenPos);
    videoCSS3DObject.quaternion.copy(screenQuat);

    cssScene.add(videoCSS3DObject);

    screenLeft.material.opacity = 0.3;
    screenLeft.material.transparent = true;
  }

  if (projectsEl && screenMiddle) {
    projectsEl.style.width = '1440px';
    projectsEl.style.height = '1024px';
    projectsEl.style.opacity = '1';

    projectsCSS3DObject = new CSS3DObject(projectsEl);
    projectsCSS3DObject.element.style.pointerEvents = 'auto';

    const middleBox = new THREE.Box3().setFromObject(screenMiddle);
    const middleSize = new THREE.Vector3();
    middleBox.getSize(middleSize);

    const scaleX = middleSize.x / 1440;
    const scaleY = middleSize.y / 1024;
    projectsCSS3DObject.scale.set(scaleX, scaleY, 1);

    const screenPos = new THREE.Vector3();
    const screenQuat = new THREE.Quaternion();
    screenMiddle.getWorldPosition(screenPos);
    screenMiddle.getWorldQuaternion(screenQuat);

    const rotationOffset = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), THREE.MathUtils.degToRad(90));
    screenQuat.multiply(rotationOffset);

    projectsCSS3DObject.position.copy(screenPos);
    projectsCSS3DObject.quaternion.copy(screenQuat);

    projectsCSS3DObject.scale.x *= -1;

    cssScene.add(projectsCSS3DObject);

    screenMiddle.material.opacity = 0.3;
    screenMiddle.material.transparent = true;

    setTimeout(attachProjectEventListeners, 0);
  }

  if (galleryEl && screenRight) {
    galleryEl.style.width = '1440px';
    galleryEl.style.height = '1024px';
    galleryEl.style.opacity = '1';

    galleryCSS3DObject = new CSS3DObject(galleryEl);
    galleryCSS3DObject.element.style.pointerEvents = 'auto';

    const rightBox = new THREE.Box3().setFromObject(screenRight);
    const rightSize = new THREE.Vector3();
    rightBox.getSize(rightSize);

    const scaleX = rightSize.x / 1440;
    const scaleY = rightSize.y / 1024;
    galleryCSS3DObject.scale.set(scaleX, scaleY, 1);

    const screenPos = new THREE.Vector3();
    const screenQuat = new THREE.Quaternion();
    screenRight.getWorldPosition(screenPos);
    
    screenRight.getWorldQuaternion(screenQuat);

    galleryCSS3DObject.position.copy(screenPos);
    galleryCSS3DObject.quaternion.copy(screenQuat);

    galleryCSS3DObject.scale.x *= -1.1;

    cssScene.add(galleryCSS3DObject);
  }

  function attachProjectEventListeners() {
    const folderItems = document.querySelectorAll('.folder-item');

    folderItems.forEach((folder, index) => {
      const folderId = folder.getAttribute('data-folder');

      const clickHandler = function () {
        const popup = document.getElementById('popup-' + folderId);
        if (popup) {
          popup.classList.add('active');
        }
      };

      addEventListenerWithCleanup(folder, 'click', clickHandler);
    });

    document.querySelectorAll('.appContainer').forEach(thumbnail => {
      const clickHandler = function () {
        const projectId = this.getAttribute('data-project');
        const textViewer = document.getElementById('textViewer-' + projectId);
        if (textViewer) {
          textViewer.classList.add('active');
        }
      };

      addEventListenerWithCleanup(thumbnail, 'click', clickHandler);
    });

    document.querySelectorAll('.text-viewer-close').forEach(closeBtn => {
      const clickHandler = function () {
        const textViewer = this.closest('.text-viewer');
        if (textViewer) {
          textViewer.classList.remove('active');
        }
      };

      addEventListenerWithCleanup(closeBtn, 'click', clickHandler);
    });

    document.querySelectorAll('.window-close').forEach(closeBtn => {
      const clickHandler = function (e) {
        e.stopPropagation();
        const folderId = this.getAttribute('data-folder');
        const popup = document.getElementById('popup-' + folderId);
        if (popup) {
          popup.classList.remove('active');
        }
      };

      addEventListenerWithCleanup(closeBtn, 'click', clickHandler);
    });

    document.querySelectorAll('.folder-popup').forEach(popup => {
      const clickHandler = function (e) {
        if (e.target === this) {
          this.classList.remove('active');
        }
      };

      addEventListenerWithCleanup(popup, 'click', clickHandler);
    });
  }
}

async function homeInit() {
  const container = document.getElementById("nahomeScreen");
  const projectsScreenContainer = document.getElementById("projectsScreen");
  const bedRoomSceneContainer = document.getElementById("bedRoomScene");

  const scene = new THREE.Scene();
  homeCamera = new THREE.PerspectiveCamera(
    FOV,
    window.innerWidth / window.innerHeight,
    near,
    2000
  );
  const renderer = createRenderer(container, homeCamera);
  addLights(scene);

  const bedRoomScene = new THREE.Scene();
  const bedRoomRenderer = createRenderer(bedRoomSceneContainer, homeCamera);
  addLights(bedRoomScene);

  updateSectionTriggers();
  addEventListenerWithCleanup(window, 'resize', updateSectionTriggers);
  addEventListenerWithCleanup(window, 'load', updateSectionTriggers);
  setTimeout(updateSectionTriggers, 0);

  // Load models
  try {
    await addModel(scene, "./nahomeRig.glb");
  } catch (err) {
    console.error("nahomeRig.glb failed to load:", err);
  }
  try {
    await addModel(scene, "./apps.glb");
  } catch (err) {
    console.error("apps.glb failed to load:", err);
  }
  try {
    await addModel(bedRoomScene, "./bedRoom.glb");
  } catch (err) {
    console.error("bedRoom.glb failed to load:", err);
  }

  if (nahomeModel) {
    nahomeModel.position.set(0, -2, -8);
    nahomeModel.rotation.x = 0;
    nahomeModel.rotation.y = 0;
    nahomeModel.rotation.z = 0;
  }

  // Set initial position for bedroom model to avoid visual jump
  if (bedroomModel) {
    bedroomModel.position.set(-10, 0, 0);
  }

  appsContainer = [blender, figma, illustrator, javascript, photoshop, react].filter(Boolean);

  videoEl = document.getElementById('theOffice');
  projectsEl = document.querySelector('.projects-inner');
  galleryEl = document.querySelector('.gallery');

  cssScene = new THREE.Scene();
  cssRenderer = new CSS3DRenderer();
  cssRenderer.setSize(window.innerWidth, window.innerHeight);
  cssRenderer.domElement.style.position = 'absolute';
  cssRenderer.domElement.style.top = '0';
  cssRenderer.domElement.style.left = '0';
  cssRenderer.domElement.style.zIndex = '1';
  cssRenderer.domElement.style.pointerEvents = 'auto';
  projectsScreenContainer.appendChild(cssRenderer.domElement);

  // Make cssRenderer globally accessible
  window.cssRenderer = cssRenderer;

  setupCSS3DObjects();

  addEventListenerWithCleanup(window, 'resize', () => {
    homeCamera.aspect = window.innerWidth / window.innerHeight;
    homeCamera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
    cssRenderer.setSize(window.innerWidth, window.innerHeight);
    bedRoomRenderer.setSize(window.innerWidth, window.innerHeight);
  });

  function applyOrangeTint(model) {
    if (!model) return;
    model.traverse((child) => {
      if (child.isMesh && child.material) {
        if (Array.isArray(child.material)) {
          child.material.forEach(mat => {
            mat.emissive = new THREE.Color(0xff3c00);
            mat.emissiveIntensity = 0.05;
            mat.needsUpdate = true;
          });
        } else {
          child.material.emissive = new THREE.Color(0xff3c00);
          child.material.emissiveIntensity = 0.05;
          child.material.needsUpdate = true;
        }
      }
    });
  }

  applyOrangeTint(nahomeModel);
  appsContainer.forEach((app) => {
    applyOrangeTint(app);
  });
  applyOrangeTint(bedroomModel);

  const projectsHeader = document.querySelector('.headerLine');
  const projectCategories = document.querySelectorAll(".projects-header h3");

  if (projectsHeader) {
    addEventListenerWithCleanup(projectsHeader, 'click', () => {
      manualCameraOverride = true;
      projectsHeader.classList.add('dissapear');
      // Add 'expanded' class to the .projects-header span
      const projectsHeaderSpan = document.querySelector('.projects-header span');
      if (projectsHeaderSpan) {
        projectsHeaderSpan.classList.add('expanded');
      }
    });
  }

  if (projectCategories) {
    projectCategories.forEach((el, index) => {
      addEventListenerWithCleanup(el, 'click', () => {
        if (index === 0) {
          screenState = 1;
        }
        if (index === 1) {
          screenState = 2;
        }
      });
    });
  }

  function animate() {
    requestAnimationFrame(animate);

    const now = performance.now();
    if (now - lastFrameTime < frameInterval) {
      return;
    }
    lastFrameTime = now;

    const matrixCache = new Map();
    const getWorldPositionCached = (object, key) => {
      if (!matrixCache.has(key + '_pos')) {
        const pos = new THREE.Vector3();
        object.getWorldPosition(pos);
        matrixCache.set(key + '_pos', pos);
      }
      return matrixCache.get(key + '_pos');
    };

    const getWorldQuaternionCached = (object, key) => {
      if (!matrixCache.has(key + '_quat')) {
        const quat = new THREE.Quaternion();
        object.getWorldQuaternion(quat);
        matrixCache.set(key + '_quat', quat);
      }
      return matrixCache.get(key + '_quat');
    };

    const delta = clock.getDelta();
    mixers.forEach((m) => m.update(delta));

    if (runToJump && runToJump.isRunning()) {
      const progress = runToJump.time / runToJump.getClip().duration;
      nahomeModel.position.z = THREE.MathUtils.lerp(-8, 0, progress);
      nahomeModel.position.y = THREE.MathUtils.lerp(-2, 0, progress);
      homeCamera.position.lerp(new THREE.Vector3(-1.600, 1.380, 2.820), progress);
      homeCamera.rotation.x = THREE.MathUtils.lerp(homeCamera.rotation.x, 0, progress);
      homeCamera.rotation.y = THREE.MathUtils.lerp(homeCamera.rotation.y, THREE.MathUtils.degToRad(-17.00), progress);
      homeCamera.rotation.z = THREE.MathUtils.lerp(homeCamera.rotation.z, 0, progress);
    }

    const inHome = window.scrollY < aboutTriggerY;
    const inAbout = window.scrollY >= aboutTriggerY && window.scrollY < projectTriggerY;
    const inProjects = window.scrollY >= projectTriggerY;

    if (nahomeModel && bedroomModel && appsContainer && appsContainer.length) {
      // --- APPS VISIBILITY & MOVEMENT ---
      if (!inHome) {
        // Move apps up out of view (e.g., y = 100)
        appsContainer.forEach((child) => {
          child.position.y = 100;
        });
      }

      if (inHome && scrollTriggered) {
        scrollTriggered = false;

        [blenderAction, figmaAction, illustratorAction, javaAction, photoshopAction, reactAction].forEach(a => {
          if (a && !a.isRunning()) a.reset().play();
        });

        targetCameraPosition = new THREE.Vector3(-1.600, 1.380, 2.820);
        targetCameraRotation = new THREE.Vector3(0, THREE.MathUtils.degToRad(-17.00), 0);

        if (typing) typing.stop();
        if (idle) idle.stop();
        if (smiling) smiling.stop();
        if (runToJump) runToJump.play();

        nahomeModel.position.lerp(new THREE.Vector3(0, 0, 0), 0.08);
        nahomeModel.rotation.y = THREE.MathUtils.lerp(nahomeModel.rotation.y, 0, 0.08);
        bedroomModel.position.set(-10, 0, 0);
      }

      // --- NAHOME MODEL ANIMATION STATE CONTROL ---
      if (inAbout) {
        // Only idle/smiling should play, typing must be fully stopped
        if (typing && typing.isRunning()) {
          typing.fadeOut(0.2);
          setTimeout(() => { if (typing) typing.stop(); }, 200);
        }
        if (idle && !idle.isRunning()) {
          idle.reset();
          idle.fadeIn(0.2);
          idle.play();
        }
      }

      if (inProjects) {
        // Only typing should play, idle/smiling must be fully stopped
        if (typing && !typing.isRunning()) {
          if (idle && idle.isRunning()) idle.fadeOut(0.2);
          if (smiling && smiling.isRunning()) smiling.fadeOut(0.2);
          setTimeout(() => {
            if (idle) idle.stop();
            if (smiling) smiling.stop();
            typing.reset();
            typing.fadeIn(0.2);
            typing.play();
          }, 200);
        }
      }

      if (inAbout && !scrollTriggered) {
        scrollTriggered = true;

        if (runToJump) runToJump.stop();
        if (typing) typing.stop();
        // Use crossfade for smooth transition to idle/smiling
        if (idle && !idle.isRunning()) {
          idle.reset();
          idle.fadeIn(0.3);
          idle.play();
        }
        if (smiling && !smiling.isRunning()) {
          smiling.reset();
          smiling.fadeIn(0.3);
          smiling.play();
        }
        if (typing && typing.isRunning()) {
          typing.fadeOut(0.3);
        }

        nahomeModel.position.set(0, 0, 0);

        targetCameraPosition = new THREE.Vector3(0, 1.560, 1.460);
        targetCameraRotation = new THREE.Vector3(0, 0, 0);
      }

      if (inAbout) {
        if (typing && typing.isRunning()) {
          typing.fadeOut(0.3);
        }
        if (idle && !idle.isRunning()) {
          idle.reset();
          idle.fadeIn(0.3);
          idle.play();
        }
        if (smiling && !smiling.isRunning()) {
          smiling.reset();
          smiling.fadeIn(0.3);
          smiling.play();
        }

        targetCameraPosition = new THREE.Vector3(0, 1.560, 1.460);
        targetCameraRotation = new THREE.Vector3(0, 0, 0);
      }

      if (inProjects) {
        // Crossfade from idle/smiling to typing
        if (typing && !typing.isRunning()) {
          if (idle && idle.isRunning()) idle.fadeOut(0.3);
          if (smiling && smiling.isRunning()) smiling.fadeOut(0.3);
          typing.reset();
          typing.fadeIn(0.3);
          typing.play();
        }

        if (screenState === 1) {
          if (screenMiddle && projectsScreenContainer && cssRenderer && container) {

            projectsScreenContainer.style.zIndex = '9998 !important';
            projectsScreenContainer.style.pointerEvents = 'auto';
            cssRenderer.domElement.style.zIndex = '9998 !important';
            cssRenderer.domElement.style.pointerEvents = 'auto';

            // Use cached position calculation
            const screenMiddlePos = getWorldPositionCached(screenMiddle, 'screenMiddle');

            const offsetZ = 0.75;

            homeCamera.updateProjectionMatrix();

            targetCameraPosition = new THREE.Vector3(
              screenMiddlePos.x,
              screenMiddlePos.y,
              screenMiddlePos.z + offsetZ
            );
          }
        } else if (screenState === 2) {
          if (screenRight && projectsScreenContainer && cssRenderer && container) {

            projectsScreenContainer.style.zIndex = '9999';
            projectsScreenContainer.style.pointerEvents = 'auto';
            cssRenderer.domElement.style.zIndex = '9999';
            cssRenderer.domElement.style.pointerEvents = 'auto';

            const screenRightPos = getWorldPositionCached(screenRight, 'screenRight');

            const offsetZ = 0.75;

            homeCamera.updateProjectionMatrix();

            targetCameraPosition = new THREE.Vector3(
              screenRightPos.x,
              screenRightPos.y,
              screenRightPos.z + offsetZ
            );
          }
        } else if (manualCameraOverride === false) {
          targetCameraPosition = new THREE.Vector3(2.980, 1.080, 1.460);
          targetCameraRotation = new THREE.Vector3(0, THREE.MathUtils.degToRad(52.60), 0);
        } else {
          if (nahomeNeckBone) {
            // Use cached position calculation
            const neckWorldPos = getWorldPositionCached(nahomeNeckBone, 'neckBone');

            const offsetX = 0;
            const offsetY = 1;
            const offsetZ = 1.2;

            targetCameraPosition = new THREE.Vector3(
              neckWorldPos.x + offsetX,
              neckWorldPos.y + offsetY,
              neckWorldPos.z + offsetZ
            );

            homeCamera.lookAt(neckWorldPos);
            targetCameraRotation = new THREE.Vector3(THREE.MathUtils.degToRad(0), 0, 0);
          }
        }

        bedroomModel.position.lerp(new THREE.Vector3(0, 0, 0), 0.08);
        nahomeModel.position.lerp(new THREE.Vector3(0, 0, -0.980), 0.08);
        nahomeModel.rotation.y = THREE.MathUtils.lerp(nahomeModel.rotation.y, THREE.MathUtils.degToRad(-180.00), 0.08);
      } else {
        manualCameraOverride = false;
        bedroomModel.position.lerp(new THREE.Vector3(-10, 0, 0), 0.08);
        nahomeModel.position.lerp(new THREE.Vector3(0, 0, 0), 0.08);
        nahomeModel.rotation.y = THREE.MathUtils.lerp(nahomeModel.rotation.y, 0, 0.08);
      }
    }

    if (targetCameraPosition && targetCameraRotation) {
      homeCamera.position.lerp(targetCameraPosition, 0.08);
      homeCamera.rotation.x = THREE.MathUtils.lerp(homeCamera.rotation.x, targetCameraRotation.x, 0.08);
      homeCamera.rotation.y = THREE.MathUtils.lerp(homeCamera.rotation.y, targetCameraRotation.y, 0.08);
      homeCamera.rotation.z = THREE.MathUtils.lerp(homeCamera.rotation.z, targetCameraRotation.z, 0.08);
    }

    homeCamera.updateProjectionMatrix();

    bedRoomScene.updateMatrixWorld(true);

    // Optimized CSS3D updates - only update when positions change significantly
    if (videoCSS3DObject && screenLeft) {
      // Use cached calculations
      const screenPos = getWorldPositionCached(screenLeft, 'screenLeft');
      const screenQuat = getWorldQuaternionCached(screenLeft, 'screenLeft');

      // Only update if position changed significantly
      if (screenPos.distanceTo(lastVideoScreenPosition) > positionUpdateThreshold ||
        screenQuat.angleTo(lastVideoScreenQuaternion) > 0.01) {
        const rotationOffset = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), Math.PI);
        screenQuat.multiply(rotationOffset);

        videoCSS3DObject.position.copy(screenPos);
        videoCSS3DObject.quaternion.copy(screenQuat);

        lastVideoScreenPosition.copy(screenPos);
        lastVideoScreenQuaternion.copy(screenQuat);
        cssSceneNeedsRender = true;
      }
    }

    if (projectsCSS3DObject && screenMiddle) {
      const screenPos = getWorldPositionCached(screenMiddle, 'screenMiddle');
      const screenQuat = getWorldQuaternionCached(screenMiddle, 'screenMiddle');

      if (screenPos.distanceTo(lastProjectsScreenPosition) > positionUpdateThreshold ||
        screenQuat.angleTo(lastProjectsScreenQuaternion) > 0.01) {
        const rotationOffset = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), THREE.MathUtils.degToRad(5));
        screenQuat.multiply(rotationOffset);

        projectsCSS3DObject.position.copy(screenPos);
        projectsCSS3DObject.quaternion.copy(screenQuat);

        lastProjectsScreenPosition.copy(screenPos);
        lastProjectsScreenQuaternion.copy(screenQuat);
        cssSceneNeedsRender = true;
      }
    }

    if (galleryCSS3DObject && screenRight) {
      const screenPos = getWorldPositionCached(screenRight, 'screenRight');
      const screenQuat = getWorldQuaternionCached(screenRight, 'screenRight');

      if (screenPos.distanceTo(lastGalleryScreenPosition) > positionUpdateThreshold ||
        screenQuat.angleTo(lastGalleryScreenQuaternion) > 0.01) {

        galleryCSS3DObject.position.copy(screenPos);
        galleryCSS3DObject.quaternion.copy(screenQuat);

        lastGalleryScreenPosition.copy(screenPos);
        lastGalleryScreenQuaternion.copy(screenQuat);
        cssSceneNeedsRender = true;
      }
    }

    const cameraPosition = homeCamera.position;
    const cameraRotation = homeCamera.rotation;
    const cameraPositionChanged = cameraPosition.distanceTo(lastCameraPosition) > 0.001;
    const cameraRotationChanged = Math.abs(cameraRotation.x - lastCameraRotation.x) > 0.001 ||
      Math.abs(cameraRotation.y - lastCameraRotation.y) > 0.001 ||
      Math.abs(cameraRotation.z - lastCameraRotation.z) > 0.001;

    // Mark scenes for rendering based on changes
    if (cameraPositionChanged || cameraRotationChanged) {
      sceneNeedsRender = true;
      cssSceneNeedsRender = true;
      bedroomSceneNeedsRender = true;
    }

    // Force render periodically to prevent visual glitches
    animationFramesSinceLastRender++;
    if (animationFramesSinceLastRender >= maxFramesBetweenRenders) {
      sceneNeedsRender = true;
      cssSceneNeedsRender = true;
      bedroomSceneNeedsRender = true;
      animationFramesSinceLastRender = 0;
    }

    // Conditional rendering
    let renderedAnyScene = false;

    if (sceneNeedsRender) {
      renderer.render(scene, homeCamera);
      sceneNeedsRender = false;
      renderedAnyScene = true;
    }

    if (cssSceneNeedsRender) {
      cssRenderer.render(cssScene, homeCamera);
      cssSceneNeedsRender = false;
      renderedAnyScene = true;
    }

    if (bedroomSceneNeedsRender) {
      bedRoomRenderer.render(bedRoomScene, homeCamera);
      bedroomSceneNeedsRender = false;
      renderedAnyScene = true;
    }

    // Update camera tracking if we rendered
    if (renderedAnyScene || cameraPositionChanged || cameraRotationChanged) {
      lastCameraPosition.copy(cameraPosition);
      lastCameraRotation.copy(cameraRotation);
    }
  }

  animate();
}

export function initHome() {
  homeInit();
}

export function initAbout(container) {
  if (!container) return;
  aboutInit(container);
}
