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

let targetCameraPosition = null;
let targetCameraRotation = null;
let manualCameraOverride = false;
let screenState = null;

function updateScrollProgress() {
  const doc = document.documentElement;
  const max = doc.scrollHeight - window.innerHeight;
  scrollProgress = max > 0 ? window.scrollY / max : 0;
}

window.addEventListener("scroll", updateScrollProgress, { passive: true });
window.addEventListener("resize", updateScrollProgress);

function startAllAnimations() {
  pendingAnimations.forEach(action => {
    if (action && typeof action.play === 'function') {
      action.play();
    }
  });
  pendingAnimations = [];
}

window.addEventListener('loadingComplete', startAllAnimations);

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

  window.addEventListener("resize", () => {
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
          console.log('Loading bedroom model...');
          root.rotation.x = THREE.MathUtils.degToRad(0);
          root.rotation.y = THREE.MathUtils.degToRad(180.00);
          root.rotation.z = THREE.MathUtils.degToRad(0);
          root.position.set(-10, 0, 0);
          bedroomModel = root;
          console.log('Bedroom model loaded:', bedroomModel);

          // Find all screen meshes first
          const screenMeshes = [];
          root.traverse((child) => {
            if (child.isMesh && child.name.toLowerCase().includes('screen')) {
              screenMeshes.push(child);
            }
          });

          // Sort screens by name to ensure consistent ordering
          screenMeshes.sort((a, b) => a.name.localeCompare(b.name));
          console.log('Found screen meshes (sorted):', screenMeshes.map(s => s.name));

          // Assign screens: first=left, second=middle, third=right
          if (screenMeshes.length >= 3) {
            screenLeft = screenMeshes[0];    // First screen (video)
            screenMiddle = screenMeshes[1];  // Second screen (projects)  
            screenRight = screenMeshes[2];   // Third screen (gallery)
            console.log('Screen assignments:');
            console.log('  screenLeft (video):', screenLeft.name);
            console.log('  screenMiddle (projects):', screenMiddle.name);
            console.log('  screenRight (gallery):', screenRight.name);
          }
        }

        resolve(root);
      },
      undefined,
      (err) => {
        reject(err);
      }
    );
  });
}

function setupCSS3DObjects() {
  console.log('Setting up CSS3D objects...');
  console.log('Screens found - Left:', !!screenLeft, 'Middle:', !!screenMiddle, 'Right:', !!screenRight);
  console.log('DOM elements - Video:', !!videoEl, 'Projects:', !!projectsEl, 'Gallery:', !!galleryEl);

  // Update bedroom scene matrices before positioning CSS3D objects
  if (bedroomModel && bedroomModel.parent) {
    bedroomModel.parent.updateMatrixWorld(true);
  }

  if (videoEl && screenLeft) {
    videoEl.loop = true;
    videoEl.muted = true;
    videoEl.play().catch(err => console.log('Video autoplay prevented:', err));

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

    // Position the CSS3D object initially
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

    // Position the CSS3D object initially at screenMiddle
    const screenPos = new THREE.Vector3();
    const screenQuat = new THREE.Quaternion();
    screenMiddle.getWorldPosition(screenPos);
    screenMiddle.getWorldQuaternion(screenQuat);

    const rotationOffset = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), THREE.MathUtils.degToRad(90));
    screenQuat.multiply(rotationOffset);

    projectsCSS3DObject.position.copy(screenPos);
    projectsCSS3DObject.quaternion.copy(screenQuat);

    // Flip horizontally (only once during setup)
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

    // Position the CSS3D object initially at screenRight
    const screenPos = new THREE.Vector3();
    const screenQuat = new THREE.Quaternion();
    screenRight.getWorldPosition(screenPos);
    screenRight.getWorldQuaternion(screenQuat);

    const rotationOffset = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), Math.PI - THREE.MathUtils.degToRad(30));
    screenQuat.multiply(rotationOffset);

    galleryCSS3DObject.position.copy(screenPos);
    galleryCSS3DObject.quaternion.copy(screenQuat);

    cssScene.add(galleryCSS3DObject);

    screenRight.material.opacity = 0.3;
    screenRight.material.transparent = true;
  }

  function attachProjectEventListeners() {
    console.log('Attaching project event listeners...');
    
    const folderItems = document.querySelectorAll('.folder-item');
    console.log('Found folder items:', folderItems.length);
    
    folderItems.forEach((folder, index) => {
      const folderId = folder.getAttribute('data-folder');
      console.log(`Folder ${index}: data-folder="${folderId}"`);
      
      folder.addEventListener('click', function () {
        console.log('Folder clicked, folderId:', folderId);
        const popup = document.getElementById('popup-' + folderId);
        console.log('Popup element found:', !!popup);
        if (popup) {
          popup.classList.add('active');
          console.log('Added active class to popup');
        }
      });
    });

    document.querySelectorAll('.appContainer').forEach(thumbnail => {
      thumbnail.addEventListener('click', function () {
        const projectId = this.getAttribute('data-project');
        const textViewer = document.getElementById('textViewer-' + projectId);
        if (textViewer) {
          textViewer.classList.add('active');
        }
      });
    });

    document.querySelectorAll('.text-viewer-close').forEach(closeBtn => {
      closeBtn.addEventListener('click', function () {
        const textViewer = this.closest('.text-viewer');
        if (textViewer) {
          textViewer.classList.remove('active');
        }
      });
    });

    document.querySelectorAll('.window-close').forEach(closeBtn => {
      closeBtn.addEventListener('click', function (e) {
        e.stopPropagation();
        const folderId = this.getAttribute('data-folder');
        const popup = document.getElementById('popup-' + folderId);
        if (popup) {
          popup.classList.remove('active');
        }
      });
    });

    document.querySelectorAll('.folder-popup').forEach(popup => {
      popup.addEventListener('click', function (e) {
        if (e.target === this) {
          this.classList.remove('active');
        }
      });
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
  await addModel(scene, "./nahomeRig.glb");
  await addModel(scene, "./apps.glb");
  await addModel(bedRoomScene, "./bedRoom.glb");

  if (nahomeModel) {
    nahomeModel.position.set(0, -2, -8);
    nahomeModel.rotation.x = 0;
    nahomeModel.rotation.y = 0;
    nahomeModel.rotation.z = 0;
  }

  if (bedroomModel) {
    bedroomModel.position.set(0, 0, 0);
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

  window.addEventListener('resize', () => {
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
    projectsHeader.addEventListener('click', () => {
      manualCameraOverride = true;
      projectsHeader.classList.add('dissapear');
    });
  }

  if (projectCategories) {
    projectCategories.forEach((el, index) => {
      el.addEventListener('click', () => {
        console.log('Category clicked:', index, 'Setting screenState to:', index === 0 ? 1 : 2);
        if (index === 0) {
          screenState = 1;
          console.log('ScreenState set to 1: Projects screen will have zIndex 9999');
        }
        if (index === 1) {
          screenState = 2;
          console.log('ScreenState set to 2: Gallery screen will have zIndex 9999');
        }
      })
    });
  }

  function animate() {
    requestAnimationFrame(animate);

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
      if (inHome && scrollTriggered) {
        scrollTriggered = false;

        appsContainer.forEach((child) => {
          child.position.x = 0;
        });
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
      }

      if (inAbout && !scrollTriggered) {
        scrollTriggered = true;
        appsContainer.forEach((child) => {
          child.position.x = THREE.MathUtils.lerp(child.position.x, -10, 0.75);
        });

        if (runToJump) runToJump.stop();
        if (typing) typing.stop();
        if (idle) idle.play();
        if (smiling) smiling.play();

        nahomeModel.position.set(0, 0, 0);

        targetCameraPosition = new THREE.Vector3(0, 1.560, 1.460);
        targetCameraRotation = new THREE.Vector3(0, 0, 0);
      }

      if (inAbout) {
        if (typing && typing.isRunning()) {
          typing.stop();
        }
        if (idle && !idle.isRunning()) idle.play();
        if (smiling && !smiling.isRunning()) smiling.play();

        targetCameraPosition = new THREE.Vector3(0, 1.560, 1.460);
        targetCameraRotation = new THREE.Vector3(0, 0, 0);
      }

      if (inProjects) {
        if (!typing || !typing.isRunning()) {
          if (idle) idle.stop();
          if (smiling) smiling.stop();
          if (typing) typing.play();
        }

        if (screenState === 1) {
          if (screenMiddle && projectsScreenContainer && cssRenderer && container) {

            projectsScreenContainer.style.zIndex = '9999 !important';
            projectsScreenContainer.style.pointerEvents = 'auto';
            cssRenderer.domElement.style.zIndex = '9999 !important';
            cssRenderer.domElement.style.pointerEvents = 'auto';

            const screenMiddlePos = new THREE.Vector3();
            screenMiddle.getWorldPosition(screenMiddlePos);

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

            const screenRightPos = new THREE.Vector3();
            screenRight.getWorldPosition(screenRightPos);

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
            const neckWorldPos = new THREE.Vector3();
            nahomeNeckBone.getWorldPosition(neckWorldPos);

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

        if (bedroomModel) {
          bedroomModel.position.lerp(new THREE.Vector3(0, 0, 0), 0.08);
        }
        nahomeModel.position.lerp(new THREE.Vector3(0, 0, -0.980), 0.08);
        nahomeModel.rotation.y = THREE.MathUtils.lerp(nahomeModel.rotation.y, THREE.MathUtils.degToRad(-180.00), 0.08);
      } else {
        manualCameraOverride = false;
        if (bedroomModel) {
          bedroomModel.position.lerp(new THREE.Vector3(-8, 0, 0), 0.08);
        }
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

    if (videoCSS3DObject && screenLeft) {
      const screenPos = new THREE.Vector3();
      const screenQuat = new THREE.Quaternion();
      screenLeft.getWorldPosition(screenPos);
      screenLeft.getWorldQuaternion(screenQuat);

      const rotationOffset = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), Math.PI);
      screenQuat.multiply(rotationOffset);

      videoCSS3DObject.position.copy(screenPos);
      videoCSS3DObject.quaternion.copy(screenQuat);
    }

    if (projectsCSS3DObject && screenMiddle) {
      const screenPos = new THREE.Vector3();
      const screenQuat = new THREE.Quaternion();
      screenMiddle.getWorldPosition(screenPos);
      screenMiddle.getWorldQuaternion(screenQuat);

      const rotationOffset = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), THREE.MathUtils.degToRad(5));
      screenQuat.multiply(rotationOffset);

      projectsCSS3DObject.position.copy(screenPos);
      projectsCSS3DObject.quaternion.copy(screenQuat);
    }

    if (galleryCSS3DObject && screenRight) {
      const screenPos = new THREE.Vector3();
      const screenQuat = new THREE.Quaternion();
      screenRight.getWorldPosition(screenPos);
      screenRight.getWorldQuaternion(screenQuat);

      const rotationOffset = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), THREE.MathUtils.degToRad(-23));
      screenQuat.multiply(rotationOffset);

      galleryCSS3DObject.position.copy(screenPos);
      galleryCSS3DObject.quaternion.copy(screenQuat);
      galleryCSS3DObject.scale.set(-0.0005, galleryCSS3DObject.scale.y, galleryCSS3DObject.scale.z);
    }

    renderer.render(scene, homeCamera);
    cssRenderer.render(cssScene, homeCamera);
    bedRoomRenderer.render(bedRoomScene, homeCamera);
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