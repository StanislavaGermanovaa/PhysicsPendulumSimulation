import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { OrbitControls } from 'OrbitControls';

// Избираме canvas елемента от HTML, в който ще се рендираме сцената
const canvas = document.querySelector('.webgl');

// Създаваме сцена
const scene = new THREE.Scene();

const textureLoader = new THREE.TextureLoader();
const backgroundTexture = textureLoader.load('assets/background.jpg');

scene.background = backgroundTexture;

// Зареждане на GLB модел за махалото
const loader = new GLTFLoader();
let root = null;

loader.load('assets/pendulum.glb', function(glb) {
    console.log(glb);
    root = glb.scene;
    root.scale.set(0.45, 0.45, 0.45);
    root.position.y = -0.7;
    scene.add(root);
}, function(xhr) {
    console.log((xhr.loaded / xhr.total * 100) + "% loaded");
}, function(error) {
    console.log("An error occurred");
});

// Добавяне на осветление
const light = new THREE.DirectionalLight(0xffffff, 1);
light.position.set(2, 2, 5);
scene.add(light)

// Централна светлина за осветяване на махалото
const pointLight = new THREE.PointLight(0xffffff, 2, 10);
pointLight.position.set(0, 1, 0);
scene.add(pointLight);

// Околна светлина за мек ефект
const ambientLight = new THREE.AmbientLight(0x555555, 0.5);
scene.add(ambientLight);

// Размери на прозореца
const sizes = {
    width: window.innerWidth,
    height: window.innerHeight
};

// Създаваме перспектива на камерата
const camera = new THREE.PerspectiveCamera(75, sizes.width / sizes.height, 0.1, 100);
camera.position.set(0, 1.5, 3.5);
scene.add(camera);

// Създаване на WebGL рендерер
const renderer = new THREE.WebGLRenderer({
    canvas: canvas
});

renderer.setSize(sizes.width, sizes.height);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
renderer.outputColorSpace = THREE.SRGBColorSpace;

// Добавяне на контрол за мишката
const controls = new OrbitControls(camera, renderer.domElement);
controls.target.set(0, 0.5, 0);
controls.enableDamping = true;
controls.dampingFactor = 0.25;
controls.enableZoom = false;

// Функция за анимация
function animate() {
    requestAnimationFrame(animate);

    if (root) {
        root.rotation.y += 0.005;
    }

    controls.update();
    renderer.render(scene, camera);
}

// Стартираме анимацията
animate();
