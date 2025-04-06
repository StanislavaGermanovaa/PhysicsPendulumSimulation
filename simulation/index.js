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
let empty = null;


loader.load('assets/pendulum.glb', function(glb) {
    console.log(glb);
    root = glb.scene;
    root.scale.set(0.45, 0.45, 0.45);
    root.position.y = -0.7;
    scene.add(root);

    sphere = root.getObjectByName("Sphere");
    cylinder = root.getObjectByName("Cylinder004");
    empty = root.getObjectByName("Pivot_Cylinder");



}, function(xhr) {
    console.log((xhr.loaded / xhr.total * 100) + "% loaded");
}, function(error) {
    console.log("An error occurred");
});

function updateSphereSize(value) {
    if (sphere) {
        let scaleFactor = 0.2 + (value - 0.01) * (0.5 / 1.99);
        sphere.scale.set(scaleFactor, scaleFactor, scaleFactor);

    }
    console.log(cylinder.position);
console.log("Y: " + cylinder.position.y);
}

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
    if (cylinder && sphere) {
        const topPosition = cylinder.scale.clone();
        
        // Мащабираме височината на нишката
        cylinder.scale.y = length * -1;
        const cylinderEndY = (topPosition.y) + cylinder.scale.y;
        sphere.position.y = cylinderEndY - sphere.scale.y / 2;
    }
}

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


//ъгъл

let angle = 0; 
let angleRad = angle * (Math.PI / 180);  

const angleSlider = document.getElementById("angle-slider");
const angleInput = document.getElementById("angle-input");

angleSlider.addEventListener("input", (event) => {
    let value = parseInt(event.target.value);  
    angleInput.value = value; 
    angle = value; 
    angleRad = angle * (Math.PI / 180); 
    updatePendulumPosition(); 
});

angleInput.addEventListener("input", (event) => {
    let value = parseInt(event.target.value);  
    angleSlider.value = value; 
    angle = value; 
    angleRad = angle * (Math.PI / 180);  
    updatePendulumPosition(); 
});



function updatePendulumPosition() {
    if (sphere && cylinder) {
        empty.rotation.x = angleRad; 

        // const pendulumLength = Math.abs(cylinder.scale.y); // Дължината на нишката
        // const pivotPoint = cylinder.position;

        // // Въртене на цилиндъра около неговия пивот
        // cylinder.rotation.x = angleRad; 
        // sphere.rotation.x = angleRad;
        
        // // Позиционираме топчето спрямо въртенето на цилиндъра
        // sphere.position.z = pivotPoint.z - Math.sin(angleRad) * pendulumLength;
        // sphere.position.y = pivotPoint.y - pendulumLength * Math.cos(angleRad); // Премахваме 4.7, за да е коректно спрямо ъгъла

        // // Ако е необходимо да добавим изместване (например ако искаме да го преместим малко нагоре):
        // sphere.position.y += 4.5;

    }
}





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
