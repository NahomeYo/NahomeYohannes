import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { DRACOLoader } from "three/addons/loaders/DRACOLoader.js";

let mixers = [];
const clock = new THREE.Clock();
let targetFOV = 65;
let camera;
let nahomeMixer;

let currentAction;
let nahomeModel, blender, figma, illustrator, javascript, photoshop, react;

let
    nahomeNeckBone,
    nahomeWaistBone,
    idle, handsForward, standUp, landing, backFlip, smiling, blink,
    currentlyAnimating = false,
    raycaster = new THREE.Raycaster();

const foreground = document.getElementById('appsFore');
const middleground = document.getElementById('appsMiddle');
const background = document.getElementById('appsBack');

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
    const dir = new THREE.HemisphereLight(0x943754, 0x80ceff, 1.0);
    dir.position.set(0, 0, 0);
    dir.castShadow = true;
    dir.receiveShadow = false;
    scene.add(dir);

    const pointLight = new THREE.PointLight(0xffbfb8, 300, 0, 1.5);
    pointLight.position.set(0, 30, 0);
    pointLight.castShadow = true;
    pointLight.receiveShadow = true;
    scene.add(pointLight);
}

/* --------------------------------------------------
   MODEL LOADING
-------------------------------------------------- */

function addModel(scene, modelPath) {
    return new Promise((resolve, reject) => {
        const loader = new GLTFLoader();
        const draco = new DRACOLoader();
        draco.setDecoderPath("https://www.gstatic.com/draco/v1/decoders/");
        loader.setDRACOLoader(draco);

        loader.load(modelPath, (gltf) => {
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
                    if (child.name.includes("blenderglb")) {
                        middleModels.push(child);
                        blender = child;
                        child.position.x -= 2;
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

            resolve(root);
        },
            undefined,
            (err) => reject(err)
        );
    });
}

/* --------------------------------------------------
   ANIMATIONS / INPUT
-------------------------------------------------- */

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

async function roomInit() {
    const container = document.getElementById("nahomeScreen");
    const scene = new THREE.Scene();

    camera = new THREE.PerspectiveCamera(
        targetFOV,
        container.clientWidth / container.clientHeight,
        0.1,
        1000
    );

    camera.position.set(0, 0, 3);
    camera.lookAt(0, 0, 0);

    const renderer = createRenderer(container, camera);
    addLights(scene);

    [nahomeModel, blender, figma, illustrator, javascript, photoshop, react] = await Promise.all([
        addModel(scene, "./nahomeRig.glb"),
        addModel(scene, "./apps.glb"),
    ]);

    // Initial positions and rotations
    if (nahomeModel) {
        nahomeModel.position.set(0, 0.5, -1);
    }

    // Ship path
    const points = [
        new THREE.Vector3(-10, 0, 0),
        new THREE.Vector3(-18, 6, 5),
        new THREE.Vector3(1, 6, 20),
        new THREE.Vector3(25, 5, 12),
        new THREE.Vector3(24, 5, -12),
        new THREE.Vector3(8, 5, -22),
        new THREE.Vector3(-10, 5, 0),
        new THREE.Vector3(-10, 0, 0),
    ];

    const path = new THREE.CatmullRomCurve3(points);

    function animate() {
        requestAnimationFrame(animate);

        const delta = clock.getDelta();

        mixers.forEach((m) => m.update(delta));

        renderer.render(scene, camera);
    }

    animate();
}

function createLayer(container) {
    const scene = new THREE.Scene();

    const renderer = new THREE.WebGLRenderer({
        alpha: true,
        antialias: true
    });

    renderer.setSize(container.clientWidth, container.clientHeight);
    container.appendChild(renderer.domElement);

    addLights(scene);

    return { scene, renderer };
}

function addModelsToLayer(models, scene) {
    models.forEach((model) => {
        scene.add(model);
    });
}

async function appsInit() {
    if (!camera) {
        requestAnimationFrame(appsInit);
        return;
    }

    const foreLayer = createLayer(foreground);
    const middleLayer = createLayer(middleground);
    const backLayer = createLayer(background);

    addModelsToLayer(foreModels, foreLayer.scene);
    addModelsToLayer(middleModels, middleLayer.scene);
    addModelsToLayer(backModels, backLayer.scene);

    const appLayers = [foreModels, middleModels, backModels];

    function animate() {
        requestAnimationFrame(animate);

        foreLayer.renderer.render(foreLayer.scene, camera);
        middleLayer.renderer.render(middleLayer.scene, camera);
        backLayer.renderer.render(backLayer.scene, camera);

        const time = Date.now() * 0.001;

        appLayers.forEach((layer, i) => {
            layer.forEach((mesh) => {
                const floatHeight = Math.sin(time + i) * 0.1;
                mesh.position.y += floatHeight;
                mesh.rotation.z += 0.005;
            });
        });
    }

    animate();
}

export default function init() {
    roomInit().then(() => {
        appsInit();
    })
}