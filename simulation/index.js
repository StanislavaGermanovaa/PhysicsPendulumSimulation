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



//графика
let isAnimating = false;
let time = 0;
const g = 9.81;
let pauseTime = 0; // добавяме това
let startTime = null; // моментът на стартиране

const startBtn = document.getElementById("start-btn");

startBtn.addEventListener("click", () => {
    if (!isAnimating) {
        isAnimating = true;
        startTime = performance.now() / 1000 - pauseTime; // продължи от времето, когато беше паузирано
    }
});

const pauseBtn = document.getElementById("pause-btn");
const resetBtn = document.getElementById("reset-btn");

pauseBtn.addEventListener("click", () => {
    if (isAnimating) {
        isAnimating = false;
        pauseTime = performance.now() / 1000 - startTime; // запази времето, докъдето стигнахме
    }
});

resetBtn.addEventListener("click", () => {
    isAnimating = false;
    time = 0;
    pauseTime = 0;
    
    angle = 0;
    angleRad = 0;

    angleSlider.value = 0;
    angleInput.value = 0;

    if (empty) {
        empty.rotation.x = 0;
    }

    // Изчистваме графиката
    chartData.labels = [];
    chartData.datasets[0].data = [];
    angleChart.update();

    // Нулираме стойностите на енергията
    document.getElementById("potential-energy").textContent = "0.00";
    document.getElementById("kinetic-energy").textContent = "0.00";
    document.getElementById("total-energy").textContent = "0.00";
});



const chartCtx = document.getElementById("chart").getContext("2d");
const chartData = {
    labels: [],
    datasets: [{
        label: 'Графиката на хармонично трептене',
        data: [],
        borderColor: 'rgba(75, 192, 192, 1)',
        fill: false,
        tension: 0.1
    }]
};
const angleChart = new Chart(chartCtx, {
    type: 'line',
    data: chartData,
    options: {
        responsive: true,
        scales: {
            x: {
                title: { display: true, text: 'Време (s)' }
            },
            y: {
                min: -90,  // ⬅️ от -90 градуса
                max: 90,   // ⬆️ до +90 градуса
                title: { display: true, text: 'Ъгъл (°)' }
            }
        }
    }
});



function calculateEnergies() {
    // Масата на топчето
    const mass = parseFloat(massInput.value);  // kg
    console.log("Mass: ", mass);

    // Дължината на нишката
    const length = parseFloat(lengthInput.value);  // m
    console.log("Length: ", length);

    // Ъгълът на отклонение (в радиани)
    const angleDeg = parseFloat(angleInput.value);  
    const angle0 = angleDeg * Math.PI / 180;  
    console.log("Initial Angle (rad): ", angle0);

    const omega = Math.sqrt(g / length); 
    console.log("Omega: ", omega);

    // Текущото време от началото на симулацията
    let currentTime = performance.now() / 1000;
    let time = currentTime - startTime; 
    console.log("Time: ", time);

    // Текущият ъгъл на махалото
    let currentAngle = angle0 * Math.cos(omega * time);
    console.log("Current Angle: ", currentAngle);

    // Потенциална енергия
    let height = length * (1 - Math.cos(currentAngle));
    let potentialEnergy = mass * g * height;  
    console.log("Potential Energy: ", potentialEnergy);

    // Кинетична енергия
    let angularVelocity = omega * Math.sin(omega * time); 
    let linearVelocity = length * angularVelocity; 
    let kineticEnergy = 0.5 * mass * linearVelocity * linearVelocity;  
    console.log("Kinetic Energy: ", kineticEnergy);

    // Общата енергия
    let totalEnergy = potentialEnergy + kineticEnergy;  
    console.log("Total Energy: ", totalEnergy);

    // Обновяваме енергийни стойности в HTML
    document.getElementById("potential-energy").textContent = potentialEnergy.toFixed(2);
    document.getElementById("kinetic-energy").textContent = kineticEnergy.toFixed(2);
    document.getElementById("total-energy").textContent = totalEnergy.toFixed(2);
}


// Функция за анимация
function animate() {
    requestAnimationFrame(animate);

    if (root) {
        root.rotation.y += 0.005;

        if (isAnimating && empty) {
            let length = parseFloat(lengthInput.value);   // m
            let angleDeg = parseFloat(angleInput.value);  // градуси
            let angle0 = angleDeg * Math.PI / 180;        // началният ъгъл в радиани

            let omega = Math.sqrt(g / length);            // ъглова честота

            let currentTime = performance.now() / 1000;   // секунди
            time = currentTime - startTime;               // време от началото или продължението

            let currentAngle = angle0 * Math.cos(omega * time);

            empty.rotation.x = currentAngle;


            calculateEnergies();


            let currentAngleDeg = currentAngle * (180 / Math.PI);

        
            // === ➕ Добави към графиката ===
            chartData.labels.push(time.toFixed(2));
            chartData.datasets[0].data.push(currentAngleDeg.toFixed(2));
        
            // Ограничаваме до последните 100 точки
            if (chartData.labels.length > 500) {
                chartData.labels.shift();
                chartData.datasets[0].data.shift();
            }
        
            angleChart.update();
        }
    }

    controls.update();
    renderer.render(scene, camera);
}

// Стартираме анимацията
animate();
