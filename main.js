import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js';

const foreground = document.getElementById('appsFore');
const middleground = document.getElementById('appsMiddle');
const background = document.getElementById('appsBack');

const containers = [foreground, middleground, background];
const modelPaths = [
    "./models/foreground.glb",
    "./models/middleground.glb",
    "./models/background.glb"
];

// RENDERER
function createRenderer(container, camera) {
    const width = container.clientWidth;
    const height = container.clientHeight;

    const renderer = new THREE.WebGLRenderer({ alpha: true });
    renderer.setSize(width, height);
    renderer.toneMapping = THREE.ReinhardToneMapping;
    renderer.toneMappingExposure = 3;
    renderer.shadowMap.enabled = true;
    container.appendChild(renderer.domElement);

    window.addEventListener('resize', () => {
        const newWidth = container.clientWidth;
        const newHeight = container.clientHeight;
        camera.aspect = newWidth / newHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(newWidth, newHeight);
    });

    return renderer;
}

// LIGHTS
function addLights(scene) {
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.5);
    scene.add(directionalLight);
}

// MODEL
function addModel(scene, modelPath) {
    const gltfLoader = new GLTFLoader()

    const dracoLoader = new DRACOLoader();
    dracoLoader.setDecoderPath('https://www.gstatic.com/draco/v1/decoders/');
    gltfLoader.setDRACOLoader(dracoLoader);

    return new Promise((resolve) => {
        const localMeshes = [];

        gltfLoader.load(modelPath, (gltf) => {
            let root = gltf.scene;
            scene.add(root);

            root.traverse((child) => {
                if (child.isMesh) {
                    child.castShadow = true;
                    child.receiveShadow = true;
                    child.geometry.center;
                }

                if (child.name === "figmaGlb" || child.name === "rStudioGlb" || child.name === "indesignGlb" || child.name === "visualStudioGlb" || child.name === "blenderGlb" || child.name === "photoshopGlb" || child.name === "illustratorGlb") {
                    localMeshes.push(child);
                }
            });

            resolve(localMeshes);
        });
    })
}

// MAIN
async function appsInit() {
    for (let index = 0; index < containers.length; index++) {
        const container = containers[index];

        // CAMERA
        function createCamera(container) {
            const width = container.clientWidth;
            const height = container.clientHeight;
            const FOV = 50;
            const aspect = width / height;
            const near = 0.1;
            const far = 2000.0;

            const camera = new THREE.PerspectiveCamera(FOV, aspect, near, far);
            camera.position.set(0, 0, 0);
            camera.rotation.set(0, 0, 0);
            return camera;
        }

        const scene = new THREE.Scene();

        const camera = createCamera(container);
        const renderer = createRenderer(container, camera);
        const controls = new OrbitControls(camera, renderer.domElement);
        controls.enableDamping = true;
        controls.dampingFactor = 0.05;

        addLights(scene);
        const floatingMeshes = await addModel(scene, modelPaths[index]);

        function animate() {
            const time = Date.now() * 0.002;

            if (floatingMeshes.length > 0) {
                floatingMeshes.forEach((mesh, i) => {
                    const floatHeight = Math.sin(time + i) * 0.25;
                    mesh.position.y = floatHeight;
                    mesh.rotation.z += 0.005;
                });
            }

            controls.update();
            renderer.render(scene, camera);
            requestAnimationFrame(animate);
        }

        animate();
    }
}

async function roomInit() {
    const container = document.getElementById('room');

    const scene = new THREE.Scene();

    function createCamera(container) {
        const width = container.clientWidth;
        const height = container.clientHeight;
        const FOV = 50;
        const aspect = width / height;
        const near = 0.1;
        const far = 2000.0;

        function degToRad(deg) {
            return deg * (Math.PI / 180);
        }

        const camera = new THREE.PerspectiveCamera(FOV, aspect, near, far);
        camera.position.set(-0.620, 1.400, -0.840);
        camera.rotation.set(degToRad(9.20), degToRad(-159.20), degToRad(3.40))
        return camera;
    }

    const camera = createCamera(container);
    const renderer = createRenderer(container, camera);

    addLights(scene);
    await addModel(scene, './models/room.glb');

    function animate() {
        renderer.render(scene, camera);
        requestAnimationFrame(animate);
    }
    animate();
}

export default function init() {
    appsInit();
    roomInit();
}
