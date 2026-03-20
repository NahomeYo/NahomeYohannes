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
  bedroomModel,
  chairModel;

let chairInitialPosition = null;
let chairInitialRotation = null;
let chairOffscreenPosition = null;
const chairOffscreenYOffset = 8;

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
let algorithmsEl = null;
let scrollProgress;

let cssScene, cssRenderer;
let videoCSS3DObject, projectsCSS3DObject, galleryCSS3DObject, algorithmsCSS3DObject;

let appsContainer = [];
let scrollTriggered = false;
let aboutSectionEl = null;
let projectsSectionEl = null;

let targetCameraPosition = null;
let targetCameraRotation = null;
let manualCameraOverride = false;
let screenState = null;
let projectEntryCameraPosition = null;
let projectEntryCameraRotation = null;
let wasInProjects = false;
let projectsUnlocked = false;

let lastFrameTime = 0;
const targetFPS = 60;
const frameInterval = 1000 / targetFPS;

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

if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', cleanupEventListeners);
}

let lastVideoScreenPosition = new THREE.Vector3();
let lastProjectsScreenPosition = new THREE.Vector3();
let lastGalleryScreenPosition = new THREE.Vector3();
let lastAlgorithmsScreenPosition = new THREE.Vector3();
let lastVideoScreenQuaternion = new THREE.Quaternion();
let lastProjectsScreenQuaternion = new THREE.Quaternion();
let lastGalleryScreenQuaternion = new THREE.Quaternion();
let lastAlgorithmsScreenQuaternion = new THREE.Quaternion();
const positionUpdateThreshold = 0.01;

function mountAlgorithmsPanel() {
  if (algorithmsEl) return;

  algorithmsEl = document.querySelector('.algorithmns');
}

let lastCameraPosition = new THREE.Vector3();
let lastCameraRotation = new THREE.Euler();
let sceneNeedsRender = true;
let cssSceneNeedsRender = true;
let bedroomSceneNeedsRender = true;
let animationFramesSinceLastRender = 0;
const maxFramesBetweenRenders = 3;
let hasLoadingCompleted = false;
const aboutCameraNarrowViewport = typeof window !== "undefined"
  ? window.matchMedia("(max-width: 75rem)")
  : { matches: false };

function updateScrollProgress() {
  const doc = document.documentElement;
  const max = doc.scrollHeight - window.innerHeight;
  scrollProgress = max > 0 ? window.scrollY / max : 0;
}

function getSectionState() {
  if (!aboutSectionEl || !projectsSectionEl) {
    aboutSectionEl = document.querySelector('.about');
    projectsSectionEl = document.querySelector('.projects');
  }

  if (!aboutSectionEl || !projectsSectionEl) {
    return { inHome: true, inAbout: false, inProjects: false };
  }

  const aboutTop = aboutSectionEl.getBoundingClientRect().top + window.scrollY;
  const projectsTop = projectsSectionEl.getBoundingClientRect().top + window.scrollY;
  // Trigger section state when the section is visibly entered, not only
  // after its top reaches the very top of the viewport.
  const currentY = window.scrollY + window.innerHeight * 0.2;

  return {
    inHome: currentY < aboutTop,
    inAbout: currentY >= aboutTop && currentY < projectsTop,
    inProjects: currentY >= projectsTop,
  };
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

function onLoadingComplete() {
  hasLoadingCompleted = true;
  startAllAnimations();
}

addEventListenerWithCleanup(window, 'loadingComplete', onLoadingComplete);
if (typeof window !== "undefined" && window.__loadingCompleteFired) {
  onLoadingComplete();
}

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

        if (modelPath.includes("chair.glb")) {
          chairModel = root;
          chairInitialPosition = root.position.clone();
          chairInitialRotation = root.rotation.clone();
          chairOffscreenPosition = chairInitialPosition.clone();
          chairOffscreenPosition.y += chairOffscreenYOffset;
          chairModel.position.copy(chairOffscreenPosition);
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

  if (algorithmsEl && screenLeft) {
    const algorithmsPanelWidth = 1440;
    const algorithmsPanelHeight = 1024;

    algorithmsEl.style.width = `${algorithmsPanelWidth}px`;
    algorithmsEl.style.height = `${algorithmsPanelHeight}px`;
    algorithmsEl.style.opacity = '1';
    algorithmsEl.style.pointerEvents = 'auto';

    algorithmsCSS3DObject = new CSS3DObject(algorithmsEl);
    algorithmsCSS3DObject.element.style.pointerEvents = 'auto';

    const leftBox = new THREE.Box3().setFromObject(screenLeft);
    const leftSize = new THREE.Vector3();
    leftBox.getSize(leftSize);

    const scaleX = leftSize.x / algorithmsPanelWidth;
    const scaleY = leftSize.y / algorithmsPanelHeight;
    algorithmsCSS3DObject.scale.set(scaleX * 1.3, scaleY, 1);

    const screenPos = new THREE.Vector3();
    const screenQuat = new THREE.Quaternion();
    screenLeft.getWorldPosition(screenPos);
    screenLeft.getWorldQuaternion(screenQuat);

    const algorithmsRotationOffsetX = new THREE.Quaternion().setFromAxisAngle(
      new THREE.Vector3(1, 0, 0),
      THREE.MathUtils.degToRad(-90)
    );
    const algorithmsRotationOffsetZ = new THREE.Quaternion().setFromAxisAngle(
      new THREE.Vector3(0, 0, 1),
      THREE.MathUtils.degToRad(180)
    );
    screenQuat.multiply(algorithmsRotationOffsetX);
    screenQuat.multiply(algorithmsRotationOffsetZ);

    algorithmsCSS3DObject.position.copy(screenPos);
    algorithmsCSS3DObject.quaternion.copy(screenQuat);

    cssScene.add(algorithmsCSS3DObject);

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

    const projectsRotationOffsetX = new THREE.Quaternion().setFromAxisAngle(
      new THREE.Vector3(1, 0, 0),
      THREE.MathUtils.degToRad(-90)
    );
    const projectsRotationOffsetZ = new THREE.Quaternion().setFromAxisAngle(
      new THREE.Vector3(0, 0, 1),
      THREE.MathUtils.degToRad(180)
    );
    screenQuat.multiply(projectsRotationOffsetX);
    screenQuat.multiply(projectsRotationOffsetZ);

    projectsCSS3DObject.position.copy(screenPos);
    projectsCSS3DObject.quaternion.copy(screenQuat);

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
    await addModel(scene, "./chair.glb");
  } catch (err) {
    console.error("chair.glb failed to load:", err);
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

  mountAlgorithmsPanel();
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

  const projectsHeader = document.querySelector('.projects-header');
  const projectCategories = document.querySelectorAll(".projects-buttons .primaryButton");

  const setProjectControlsEnabled = (enabled) => {
    projectsUnlocked = enabled;
    projectCategories.forEach((el) => {
      el.setAttribute('aria-disabled', enabled ? 'false' : 'true');
    });
  };

  setProjectControlsEnabled(true);

  if (projectCategories) {
    projectCategories.forEach((el, index) => {
      addEventListenerWithCleanup(el, 'click', () => {
        if (!projectsUnlocked) return;

        if (index === 0) {
          screenState = 0;
        }
        if (index === 1) {
          screenState = 1;
        }
        if (index === 2) {
          screenState = 2;
        }
      });
    });
  }

  const setActiveScreenDom = (activeScreen) => {
    if (algorithmsCSS3DObject?.element) {
      algorithmsCSS3DObject.element.style.pointerEvents = activeScreen === 0 ? 'auto' : 'none';
    }
    if (projectsCSS3DObject?.element) {
      projectsCSS3DObject.element.style.pointerEvents = activeScreen === 1 ? 'auto' : 'none';
    }
    if (galleryCSS3DObject?.element) {
      galleryCSS3DObject.element.style.pointerEvents = activeScreen === 2 ? 'auto' : 'none';
    }
  };

  setActiveScreenDom(null);

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

    if (!hasLoadingCompleted) {
      renderer.render(scene, homeCamera);
      cssRenderer.render(cssScene, homeCamera);
      bedRoomRenderer.render(bedRoomScene, homeCamera);
      return;
    }

    if (runToJump && runToJump.isRunning()) {
      const progress = runToJump.time / runToJump.getClip().duration;
      const homeCameraX = aboutCameraNarrowViewport.matches ? -1.3 : -1.6;
      nahomeModel.position.z = THREE.MathUtils.lerp(-8, 0, progress);
      nahomeModel.position.y = THREE.MathUtils.lerp(-2, 0, progress);
      homeCamera.position.lerp(new THREE.Vector3(homeCameraX, 1.380, 2.820), progress);
      homeCamera.rotation.x = THREE.MathUtils.lerp(homeCamera.rotation.x, 0, progress);
      homeCamera.rotation.y = THREE.MathUtils.lerp(homeCamera.rotation.y, THREE.MathUtils.degToRad(-17.00), progress);
      homeCamera.rotation.z = THREE.MathUtils.lerp(homeCamera.rotation.z, 0, progress);
    }

    const { inHome, inAbout, inProjects } = getSectionState();

    if (projectsHeader) {
      projectsHeader.classList.toggle('in-view', inProjects);
    }
    setProjectControlsEnabled(inProjects);

    if (inProjects && !wasInProjects) {
      projectEntryCameraPosition = homeCamera.position.clone();
      projectEntryCameraRotation = new THREE.Vector3(
        homeCamera.rotation.x,
        homeCamera.rotation.y,
        homeCamera.rotation.z
      );
      screenState = null;
      manualCameraOverride = false;
    }
    wasInProjects = inProjects;

  if (nahomeModel && bedroomModel && appsContainer && appsContainer.length) {

      if (!inHome) {

        appsContainer.forEach((child) => {
          child.position.y = 100;
        });
      }

      if (inHome && scrollTriggered) {
        scrollTriggered = false;

        [blenderAction, figmaAction, illustratorAction, javaAction, photoshopAction, reactAction].forEach(a => {
          if (a && !a.isRunning()) a.reset().play();
        });

        const homeCameraX = aboutCameraNarrowViewport.matches ? -1.3 : -1.6;
        targetCameraPosition = new THREE.Vector3(homeCameraX, 1.380, 2.820);
        targetCameraRotation = new THREE.Vector3(0, THREE.MathUtils.degToRad(-17.00), 0);

        if (typing) typing.stop();
        if (idle) idle.stop();
        if (smiling) smiling.stop();
        if (runToJump) runToJump.play();

        nahomeModel.position.lerp(new THREE.Vector3(0, 0, 0), 0.08);
        nahomeModel.rotation.y = THREE.MathUtils.lerp(nahomeModel.rotation.y, 0, 0.08);
        bedroomModel.position.set(-10, 0, 0);
      }

      if (inAbout) {
        if (typing && typing.isRunning()) {
          typing.fadeOut(0.2);
          typing.stop();
        }
        if (idle && !idle.isRunning()) {
          idle.reset();
          idle.fadeIn(0.2);
          idle.play();
        }
      }

      if (inProjects) {
        if (typing && !typing.isRunning()) {
          if (idle && idle.isRunning()) idle.fadeOut(0.2);
          if (smiling && smiling.isRunning()) smiling.fadeOut(0.2);
          if (idle) idle.stop();
          if (smiling) smiling.stop();
          typing.reset();
          typing.fadeIn(0.2);
          typing.play();
        }
      }

      if (inAbout && !scrollTriggered) {
        scrollTriggered = true;

        if (runToJump) runToJump.stop();
        if (typing) typing.stop();

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

        const aboutCameraX = aboutCameraNarrowViewport.matches ? -0.2 : -0.4;
        targetCameraPosition = new THREE.Vector3(aboutCameraX, 1.560, 1.460);
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

        const aboutCameraX = aboutCameraNarrowViewport.matches ? -0.2 : -0.4;
        targetCameraPosition = new THREE.Vector3(aboutCameraX, 1.560, 1.460);
        targetCameraRotation = new THREE.Vector3(0, 0, 0);
      }

      if (inProjects) {
        if (chairModel) {
          const chairProjectPosition = new THREE.Vector3(0, 0, 0.1);
          chairModel.position.lerp(chairProjectPosition, 0.08);

          const chairProjectRotationX = nahomeModel ? nahomeModel.rotation.x : 0;
          const chairProjectRotationY = nahomeModel ? nahomeModel.rotation.y : 0;
          const chairProjectRotationZ = nahomeModel ? nahomeModel.rotation.z : 0;

          chairModel.rotation.x = THREE.MathUtils.lerp(chairModel.rotation.x, chairProjectRotationX, 0.08);
          chairModel.rotation.y = THREE.MathUtils.lerp(chairModel.rotation.y, chairProjectRotationY, 0.08);
          chairModel.rotation.z = THREE.MathUtils.lerp(chairModel.rotation.z, chairProjectRotationZ, 0.08);
        }

        if (typing && !typing.isRunning()) {
          if (idle && idle.isRunning()) idle.fadeOut(0.3);
          if (smiling && smiling.isRunning()) smiling.fadeOut(0.3);
          typing.reset();
          typing.fadeIn(0.3);
          typing.play();
        }

        if (screenState === 0) {
          if (screenLeft && projectsScreenContainer && cssRenderer && container) {
            setActiveScreenDom(0);

            projectsScreenContainer.style.zIndex = '9998';
            projectsScreenContainer.style.pointerEvents = 'auto';
            cssRenderer.domElement.style.zIndex = '9998';
            cssRenderer.domElement.style.pointerEvents = 'auto';

            const screenLeftPos = getWorldPositionCached(screenLeft, 'screenLeftFocus');
            const offsetX = 0.5;
            const offsetZ = 0.5;

            homeCamera.updateProjectionMatrix();

            targetCameraPosition = new THREE.Vector3(
              screenLeftPos.x + offsetX,
              screenLeftPos.y,
              screenLeftPos.z + offsetZ
            );
            targetCameraRotation = new THREE.Vector3(
              homeCamera.rotation.x,
              THREE.MathUtils.degToRad(45),
              homeCamera.rotation.z,
            );
          }
        } else if (screenState === 1) {
          if (screenMiddle && projectsScreenContainer && cssRenderer && container) {
            setActiveScreenDom(1);

            projectsScreenContainer.style.zIndex = '9998';
            projectsScreenContainer.style.pointerEvents = 'auto';
            cssRenderer.domElement.style.zIndex = '9998';
            cssRenderer.domElement.style.pointerEvents = 'auto';

            const screenMiddlePos = getWorldPositionCached(screenMiddle, 'screenMiddle');
            const offsetX = 0;
            const offsetZ = 0.75;

            homeCamera.updateProjectionMatrix();

            targetCameraPosition = new THREE.Vector3(
              screenMiddlePos.x + offsetX,
              screenMiddlePos.y,
              screenMiddlePos.z + offsetZ
            );
            targetCameraRotation = new THREE.Vector3(
              homeCamera.rotation.x,
              THREE.MathUtils.degToRad(0),
              homeCamera.rotation.z,
            );
          }
        } else if (screenState === 2) {
          if (screenRight && projectsScreenContainer && cssRenderer && container) {
            setActiveScreenDom(2);

            projectsScreenContainer.style.zIndex = '9999';
            projectsScreenContainer.style.pointerEvents = 'auto';
            cssRenderer.domElement.style.zIndex = '9999';
            cssRenderer.domElement.style.pointerEvents = 'auto';

            const screenRightPos = getWorldPositionCached(screenRight, 'screenRight');
            const offsetX = 0;
            const offsetZ = 0.75;

            homeCamera.updateProjectionMatrix();

            targetCameraPosition = new THREE.Vector3(
              screenRightPos.x + offsetX,
              screenRightPos.y,
              screenRightPos.z + offsetZ
            );
            targetCameraRotation = new THREE.Vector3(
              homeCamera.rotation.x,
              THREE.MathUtils.degToRad(0),
              homeCamera.rotation.z,
            );
          }
        } else if (manualCameraOverride === false) {
          setActiveScreenDom(null);
          targetCameraPosition = new THREE.Vector3(2.980, 1.080, 1.460);
          targetCameraRotation = new THREE.Vector3(0, THREE.MathUtils.degToRad(52.60), 0);
        } else {
          setActiveScreenDom(null);
          if (nahomeNeckBone) {
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
        if (chairModel && chairOffscreenPosition) {
          chairModel.position.lerp(chairOffscreenPosition, 0.08);
          if (chairInitialRotation) {
            chairModel.rotation.x = THREE.MathUtils.lerp(chairModel.rotation.x, chairInitialRotation.x, 0.08);
            chairModel.rotation.y = THREE.MathUtils.lerp(chairModel.rotation.y, chairInitialRotation.y, 0.08);
            chairModel.rotation.z = THREE.MathUtils.lerp(chairModel.rotation.z, chairInitialRotation.z, 0.08);
          }
        }

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

    if (projectsCSS3DObject && screenMiddle) {
      const screenPos = getWorldPositionCached(screenMiddle, 'screenMiddle');
      const screenQuat = getWorldQuaternionCached(screenMiddle, 'screenMiddle');

      if (screenPos.distanceTo(lastProjectsScreenPosition) > positionUpdateThreshold ||
        screenQuat.angleTo(lastProjectsScreenQuaternion) > 0.01) {
        const projectsRotationOffsetX = new THREE.Quaternion().setFromAxisAngle(
          new THREE.Vector3(1, 0, 0),
          THREE.MathUtils.degToRad(-90)
        );
        const projectsRotationOffsetZ = new THREE.Quaternion().setFromAxisAngle(
          new THREE.Vector3(0, 0, 1),
          THREE.MathUtils.degToRad(180)
        );
        screenQuat.multiply(projectsRotationOffsetX);
        screenQuat.multiply(projectsRotationOffsetZ);

        projectsCSS3DObject.position.copy(screenPos);
        projectsCSS3DObject.quaternion.copy(screenQuat);

        lastProjectsScreenPosition.copy(screenPos);
        lastProjectsScreenQuaternion.copy(screenQuat);
        cssSceneNeedsRender = true;
      }
    }

    if (algorithmsCSS3DObject && screenLeft) {
      const screenPos = getWorldPositionCached(screenLeft, 'screenLeftAlgorithms');
      const screenQuat = getWorldQuaternionCached(screenLeft, 'screenLeftAlgorithms');

      if (screenPos.distanceTo(lastAlgorithmsScreenPosition) > positionUpdateThreshold ||
        screenQuat.angleTo(lastAlgorithmsScreenQuaternion) > 0.01) {
        const algorithmsRotationOffsetX = new THREE.Quaternion().setFromAxisAngle(
          new THREE.Vector3(1, 0, 0),
          THREE.MathUtils.degToRad(-90)
        );
        const algorithmsRotationOffsetZ = new THREE.Quaternion().setFromAxisAngle(
          new THREE.Vector3(0, 0, 1),
          THREE.MathUtils.degToRad(180)
        );
        screenQuat.multiply(algorithmsRotationOffsetX);
        screenQuat.multiply(algorithmsRotationOffsetZ);

        algorithmsCSS3DObject.position.copy(screenPos);
        algorithmsCSS3DObject.quaternion.copy(screenQuat);

        lastAlgorithmsScreenPosition.copy(screenPos);
        lastAlgorithmsScreenQuaternion.copy(screenQuat);
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

    if (cameraPositionChanged || cameraRotationChanged) {
      sceneNeedsRender = true;
      cssSceneNeedsRender = true;
      bedroomSceneNeedsRender = true;
    }

    animationFramesSinceLastRender++;
    if (animationFramesSinceLastRender >= maxFramesBetweenRenders) {
      sceneNeedsRender = true;
      cssSceneNeedsRender = true;
      bedroomSceneNeedsRender = true;
      animationFramesSinceLastRender = 0;
    }

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

    if (renderedAnyScene || cameraPositionChanged || cameraRotationChanged) {
      lastCameraPosition.copy(cameraPosition);
      lastCameraRotation.copy(cameraRotation);
    }
  }

  requestAnimationFrame(() => {
    window.dispatchEvent(new Event("sceneReady"));
  });

  animate();
}

export function initHome() {
  homeInit();
}

export function initAbout(container) {
  if (!container) return;
  aboutInit(container);
}

function setupSectionBoundaries() {
  aboutSectionEl = document.querySelector('.about');
  projectsSectionEl = document.querySelector('.projects');
}

setupSectionBoundaries();
