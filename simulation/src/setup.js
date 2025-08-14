
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { OrbitControls } from 'OrbitControls';

export function initScene() {
    const canvas = document.querySelector('.webgl');
    const scene = new THREE.Scene();
    scene.background = new THREE.TextureLoader().load('assets/background.jpg');

    // Lights
    const light = new THREE.DirectionalLight(0xffffff, 1);
    light.position.set(2, 2, 5);
    scene.add(light);

    const pointLight = new THREE.PointLight(0xffffff, 2, 10);
    pointLight.position.set(0, 1, 0);
    scene.add(pointLight);

    const ambientLight = new THREE.AmbientLight(0x555555, 0.5);
    scene.add(ambientLight);

    // Sizes
    const sizes = { width: window.innerWidth, height: window.innerHeight };

    // Camera
    const camera = new THREE.PerspectiveCamera(75, sizes.width / sizes.height, 0.1, 100);
    camera.position.set(0, 1.5, 3.5);
    scene.add(camera);

    // Renderer
    const renderer = new THREE.WebGLRenderer({ canvas });
    renderer.setSize(sizes.width, sizes.height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.outputColorSpace = THREE.SRGBColorSpace;

    // Controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.target.set(0, 0.5, 0);
    controls.enableDamping = true;
    controls.dampingFactor = 0.25;
    controls.enableZoom = false;

    return { scene, camera, renderer, controls };
}

export function loadModel(scene, modelPath, onLoaded, onProgress = undefined, onError = (error) => console.log("An error occurred", error)) {
    const loader = new GLTFLoader();
    loader.load(modelPath, (glb) => {
        const root = glb.scene;
        root.scale.set(0.45, 0.45, 0.45);
        root.position.y = -0.7;
        scene.add(root);
        onLoaded(root);
    }, onProgress, onError);
}

export function startAnimate(renderer, scene, camera, controls, customAnimate = () => {}) {
    function animate() {
        requestAnimationFrame(animate);
        customAnimate();
        controls.update();
        renderer.render(scene, camera);
    }
    animate();
}