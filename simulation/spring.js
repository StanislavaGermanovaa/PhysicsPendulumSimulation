import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { OrbitControls } from 'OrbitControls';

const canvas = document.querySelector('.webgl');

const scene = new THREE.Scene();

const textureLoader = new THREE.TextureLoader();
const backgroundTexture = textureLoader.load('assets/background.jpg');

scene.background = backgroundTexture;

const loader = new GLTFLoader();
let root = null;

let sphere = null;
let spring = null;
let empty = null;

loader.load('assets/springPendulum.glb', function(glb) {
    root = glb.scene;
    root.scale.set(0.45, 0.45, 0.45);
    root.position.y = -0.7;
    scene.add(root);

    sphere = root.getObjectByName("Sphere");
    spring = root.getObjectByName("Spring");
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
    if (spring && sphere) {

        spring.scale.z = length;

        sphere.position.y = length*(-6);
       
    }
}

const lengthSlider = document.getElementById("amplitude-slider");
const lengthInput = document.getElementById("amplitude-input");

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

const kSlider = document.getElementById("k-slider");
const kInput = document.getElementById("k-input");

let springConstant = parseFloat(kSlider.value);

kSlider.addEventListener("input", (event) => {
    springConstant = parseFloat(event.target.value);
    kInput.value = springConstant;
});

kInput.addEventListener("input", (event) => {
    springConstant = parseFloat(event.target.value);
    kSlider.value = springConstant;
});

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

let isAnimating = false;
let time = 0;
let animationId = null;

let prevPositionY = null;
let prevTime = null;

const potentialEnergyElem = document.getElementById('potential-energy');
const kineticEnergyElem = document.getElementById('kinetic-energy');
const totalEnergyElem = document.getElementById('total-energy');

const startBtn = document.getElementById("start-btn");
const pauseBtn = document.getElementById("pause-btn");
const resetBtn = document.getElementById("reset-btn");

startBtn.addEventListener("click", () => {
    if (!isAnimating) {
        isAnimating = true;
    }
});

pauseBtn.addEventListener("click", () => {
    isAnimating = false;
    cancelAnimationFrame(animationId);
});

resetBtn.addEventListener("click", () => {
    isAnimating = false;
    time = 0;
    cancelAnimationFrame(animationId);

    let length = parseFloat(lengthSlider.value);
    
    if (spring) spring.scale.z = length;
    if (sphere) sphere.position.y = -6 * length;

    chartData.labels = [];
    chartData.datasets[0].data = [];
    chart.update();

    potentialEnergyElem.textContent = '0.00';
    kineticEnergyElem.textContent = '0.00';
    totalEnergyElem.textContent = '0.00';
    document.getElementById('period-value').textContent = '0.00';
});




const chartCtx = document.getElementById("chart").getContext("2d");
const chartData = {
    labels: [],
    datasets: [{
        label: "Преместване",
        data: [],
        borderColor: 'rgba(75, 192, 192, 1)',
        fill: false,
        tension: 0.1
    }]
};

const chart = new Chart(chartCtx, {
    type: 'line',
    data: chartData,
    options: {
        responsive: true,
        scales: {
            x: {
                display: false
            },
            y: {
                title: { display: true, text: 'Позиция (m)' },
                min: -1,
                max: 1
            }
        },
        plugins: {
            tooltip: {
                callbacks: {
                    title: function(tooltipItems) {
                        return "Време: " + tooltipItems[0].label + " s";
                    },
                    label: function(tooltipItem) {
                        return "Позиция: " + tooltipItem.formattedValue + " m";
                    }
                }
            },
            legend: {
                display: false
            }
        }
    }
});


let lastChartUpdateSecond = 0;

function animate() {
    requestAnimationFrame(animate);

    if (root) {
        if (isAnimating && sphere && spring && empty) {
            let length = parseFloat(lengthSlider.value);
            let timeNow = performance.now() / 1000;

            let mass = parseFloat(massSlider.value);
            let k = springConstant;

            let period = 2 * Math.PI * Math.sqrt(mass / k);

            let omega = Math.sqrt(k / mass);
            let amplitude = parseFloat(lengthSlider.value) / 2;

            let currentLength = length + Math.sin(timeNow * omega) * amplitude;

            spring.scale.z = currentLength;
            sphere.position.y = -6 * currentLength;

            let x = (-sphere.position.y / 6) - length;

            if (prevPositionY !== null && prevTime !== null) {
                let dt = timeNow - prevTime;
                let velocity = (sphere.position.y - prevPositionY) / dt;

                let potentialEnergy = 0.5 * k * x * x;
                let kineticEnergy = 0.5 * mass * velocity * velocity;
                let totalEnergy = potentialEnergy + kineticEnergy;

                document.getElementById('potential-energy').textContent = potentialEnergy.toFixed(3);
                document.getElementById('kinetic-energy').textContent = kineticEnergy.toFixed(3);
                document.getElementById('total-energy').textContent = totalEnergy.toFixed(3);
                document.getElementById('period-value').textContent = period.toFixed(3);
            }

            let now = performance.now() / 1000; 
            let dtChart = now - lastChartUpdateSecond;

            if (dtChart >= 0.1) {
                let yPosition = (-sphere.position.y / 6);  
                chartData.labels.push(now.toFixed(2));
                chartData.datasets[0].data.push(yPosition.toFixed(3));

                if (chartData.labels.length > 50) {
                    chartData.labels.shift();
                    chartData.datasets[0].data.shift();
                }

                chart.update('none');
                lastChartUpdateSecond = now;
            }

            prevPositionY = sphere.position.y;
            prevTime = timeNow;
        }


    }
    controls.update();
    renderer.render(scene, camera);
}



document.getElementById("view-results-btn").addEventListener("click", () => {
    const amplitude = parseFloat(lengthInput.value);
    const mass = parseFloat(massInput.value);
    const k = parseFloat(kInput.value);
    const period = 2 * Math.PI * Math.sqrt(mass / k);

    const data = {
        timeLabels: chartData.labels,
        displacementValues: chartData.datasets[0].data,
        mass: mass,
        amplitude: amplitude,
        springConstant: k,
        period: period
    };

    localStorage.setItem('springPendulumResults', JSON.stringify(data));
    window.open('results/spring-pendulum-results.html', '_blank');
});


animate();