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

let sphere = null;
let cylinder = null;

loader.load('assets/pendulum.glb', function(glb) {
    console.log(glb);
    root = glb.scene;
    root.scale.set(0.45, 0.45, 0.45);
    root.position.y = -0.7;
    scene.add(root);

    sphere = root.getObjectByName("Sphere");
    cylinder = root.getObjectByName("Cylinder004");


}, function(xhr) {
    console.log((xhr.loaded / xhr.total * 100) + "% loaded");
}, function(error) {
    console.log("An error occurred");
});

function updateSphereSize(value) {
    if (sphere) {
        let scaleFactor = 0.2 + (value - 0.01) * (0.5 / 1.99); // По-малка разлика в размера
        sphere.scale.set(scaleFactor, scaleFactor, scaleFactor);
    }
}

// Свързваме слайдера и инпута с функцията
const massSlider = document.getElementById("mass-slider");
const massInput = document.getElementById("mass-input");

massSlider.addEventListener("input", (event) => {
    let value = parseFloat(event.target.value);
    massInput.value = value;
    updateSphereSize(value);
});

massInput.addEventListener("input", (event) => {
    let value = parseFloat(event.target.value);
    massSlider.value = value;
    updateSphereSize(value);
});

function updateStringLength(length) {
    if (!cylinder || !sphere) {
        console.error("Липсва нишка или топче!");
        return;
    }

    // 1. Запазваме оригиналната позиция на горния край на нишката
    const topPosition = cylinder.position.clone();

    // 2. Променяме само скалата по ос Y на цилиндъра (нишката)
    // Това ще увеличи дължината на нишката, но без да променяме позицията на горния край
    cylinder.scale.y = length;

    // 3. Променяме позицията на топчето така, че да се мести надолу
    // Новата позиция на топчето трябва да е разстояние length от горния край на нишката
    sphere.position.set(topPosition.x, topPosition.y - length, topPosition.z);
}

// Свързваме слайдера и инпута с функцията
const lengthSlider = document.getElementById("length-slider");
const lengthInput = document.getElementById("length-input");

lengthSlider.addEventListener("input", (event) => {
    let value = parseFloat(event.target.value);
    lengthInput.value = value;
    updateStringLength(value);
});

lengthInput.addEventListener("input", (event) => {
    let value = parseFloat(event.target.value);
    lengthSlider.value = value;
    updateStringLength(value);
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
