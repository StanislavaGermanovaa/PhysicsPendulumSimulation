import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { OrbitControls } from 'OrbitControls';

const canvas = document.querySelector('.webgl');
const scene = new THREE.Scene();

const textureLoader = new THREE.TextureLoader();
scene.background = textureLoader.load('assets/background.jpg');

const loader = new GLTFLoader();
let root = null;
let sphere = null;
let cylinder = null;
let empty = null;

loader.load('assets/pendulum.glb', (glb) => {
    root = glb.scene;
    root.scale.set(0.45, 0.45, 0.45);
    root.position.y = -0.7;
    scene.add(root);

    sphere = root.getObjectByName("Sphere");
    cylinder = root.getObjectByName("Cylinder004");
    empty = root.getObjectByName("Pivot_Cylinder");
}, (xhr) => {
    console.log(`${(xhr.loaded / xhr.total * 100).toFixed(2)}% loaded`);
}, () => {
    console.log("An error occurred");
});

function updateSphereSize(value) {
    if (!sphere) return;
    const scaleFactor = 0.2 + (value - 0.01) * (0.5 / 1.99);
    sphere.scale.set(scaleFactor, scaleFactor, scaleFactor);
}

const massSlider = document.getElementById("mass-slider");
const massInput = document.getElementById("mass-input");

massSlider.addEventListener("input", (e) => {
    const value = parseFloat(e.target.value);
    massInput.value = value;
    updateSphereSize(value);
});
massInput.addEventListener("input", (e) => {
    const value = parseFloat(e.target.value);
    massSlider.value = value;
    updateSphereSize(value);
});

function updateStringLength(length) {
    if (!cylinder || !sphere) return;
    const originalScaleY = cylinder.scale.y;
    cylinder.scale.y = -length; // обратен знак, както в оригинала
    sphere.position.y = originalScaleY + cylinder.scale.y - sphere.scale.y / 2;
}

const lengthSlider = document.getElementById("length-slider");
const lengthInput = document.getElementById("length-input");

lengthSlider.addEventListener("input", (e) => {
    const value = parseFloat(e.target.value);
    lengthInput.value = value;
    updateStringLength(value);
    updatePeriodDisplay();
});
lengthInput.addEventListener("input", (e) => {
    const value = parseFloat(e.target.value);
    lengthSlider.value = value;
    updateStringLength(value);
    updatePeriodDisplay();
});

let angle = 0;
let angleRad = 0;

const angleSlider = document.getElementById("angle-slider");
const angleInput = document.getElementById("angle-input");

function syncAngleInputs(value) {
    angleSlider.value = value;
    angleInput.value = value;
    angle = value;
    angleRad = angle * (Math.PI / 180);
    if (empty) empty.rotation.x = angleRad;
}

angleSlider.addEventListener("input", (e) => syncAngleInputs(parseInt(e.target.value)));
angleInput.addEventListener("input", (e) => syncAngleInputs(parseInt(e.target.value)));

const light = new THREE.DirectionalLight(0xffffff, 1);
light.position.set(2, 2, 5);
scene.add(light);

const pointLight = new THREE.PointLight(0xffffff, 2, 10);
pointLight.position.set(0, 1, 0);
scene.add(pointLight);

const ambientLight = new THREE.AmbientLight(0x555555, 0.5);
scene.add(ambientLight);

const sizes = { width: window.innerWidth, height: window.innerHeight };

const camera = new THREE.PerspectiveCamera(75, sizes.width / sizes.height, 0.1, 100);
camera.position.set(0, 1.5, 3.5);
scene.add(camera);

const renderer = new THREE.WebGLRenderer({ canvas });
renderer.setSize(sizes.width, sizes.height);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
renderer.outputColorSpace = THREE.SRGBColorSpace;

const controls = new OrbitControls(camera, renderer.domElement);
controls.target.set(0, 0.5, 0);
controls.enableDamping = true;
controls.dampingFactor = 0.25;
controls.enableZoom = false;

let isAnimating = false;
let time = 0;
const g = 9.81;
let pauseTime = 0;
let startTime = null;

let theta = 0;
let omegaSim = 0;
const dt = 1 / 60;


const startBtn = document.getElementById("start-btn");
startBtn.addEventListener("click", () => {
    if (!isAnimating) {
        isAnimating = true;
        theta = parseFloat(angleInput.value) * Math.PI / 180;
        omegaSim = 0;
        startTime = performance.now() / 1000 - pauseTime;
    }
});

const pauseBtn = document.getElementById("pause-btn");
pauseBtn.addEventListener("click", () => {
    if (isAnimating) {
        isAnimating = false;
        pauseTime = performance.now() / 1000 - startTime;
    }
});

const resetBtn = document.getElementById("reset-btn");
resetBtn.addEventListener("click", () => {
    isAnimating = false;
    time = 0;
    pauseTime = 0;
    theta = 0;
    omegaSim = 0;
    startTime = null;
    lastChartUpdateSecond = -1;
    syncAngleInputs(0);

    if (empty) empty.rotation.x = 0;

    chartData.labels.length = 0;
    chartData.datasets[0].data.length = 0;
    angleChart.update();

    energyChart.data.datasets[0].data = [0, 0, 0, 0];
    energyChart.update();

    ["potential-energy", "kinetic-energy", "total-energy"].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.textContent = "0.00";
    });

    document.getElementById("period-value").textContent = "0.00";
});


const zeroLinePlugin = {
  id: 'zeroLinePlugin',
  afterDraw(chart) {
    const {ctx, chartArea: {left, right, top, bottom}, scales: {y}} = chart;
    const yZero = y.getPixelForValue(0);

    if (yZero < top || yZero > bottom) {
      return;
    }

    ctx.save();
    ctx.beginPath();
    ctx.lineWidth = 2;
    ctx.strokeStyle = 'black';
    ctx.moveTo(left, yZero);
    ctx.lineTo(right, yZero);
    ctx.stroke();
    ctx.restore();
  }
};

const chartCtx = document.getElementById("chart").getContext("2d");

const chartData = {
    labels: [],
    datasets: [{
        label: 'Хармонично трептене',
        data: [],
        borderColor: 'lightblue',
        borderWidth: 2,
        pointStyle: 'cross',
        pointRadius: [],
        pointBackgroundColor: 'red',
        fill: false,
        tension: 0.3
    }]
};

const angleChart = new Chart(chartCtx, {
    type: 'line',
    data: chartData,
    options: {
        responsive: true,
        animation: false,
        scales: {
            x: {
                title: {
                    display: true,
                    text: 'Време (s)'
                },
                ticks: {
                    stepSize: 1,          
                    callback: function (value) {
                        if (Number.isInteger(value)) {
                            return `${value} s`;
                        }
                        return '';
                    }
                },
                grid: {
                    color: '#dddddd'
                }
            },
            y: {
                beginAtZero: false,
                suggestedMin: -10,
                suggestedMax: 10,
                title: {
                    display: true,
                    text: 'Амплитуда (см)'
                },
                ticks: {
                    callback: function (value) {
                        return `${value} см`;
                    }
                },
                grid: {
                    color: '#dddddd'
                },
                afterDataLimits: (scale) => {
                    const allValues = scale.chart.data.datasets[0].data.map(Number);
                    const max = Math.max(...allValues);
                    const min = Math.min(...allValues);
                    const buffer = 5;
                    scale.max = Math.ceil(max + buffer);
                    scale.min = Math.floor(min - buffer);
                }
            }
        },
        plugins: {
            legend: {
                display: true,
                position: 'bottom'
            },
            tooltip: {
                callbacks: {
                    title: function (context) {
                        return `Време: ${context[0].label} s`;
                    },
                    label: function (context) {
                        return `Амплитуда: ${context.parsed.y} см`;
                    }
                }
            }
        }
    },
    plugins: [zeroLinePlugin]
});


function updatePeriodDisplay() {
    const length = parseFloat(lengthInput.value);
    const period = 2 * Math.PI * Math.sqrt(length / g);
    document.getElementById("period-value").textContent = period.toFixed(2);
}


const energyChartCtx = document.getElementById("energyChart").getContext("2d");

const energyChart = new Chart(energyChartCtx, {
    type: 'bar',
    data: {
        labels: ['Потенциална', 'Кинетична', 'Обща'],
        datasets: [{
            label: 'Енергии и период',
            data: [0, 0, 0],
            backgroundColor: [
                'rgba(255, 99, 132, 0.6)',
                'rgba(54, 162, 235, 0.6)',
                'rgba(255, 206, 86, 0.6)',
                'rgba(75, 192, 192, 0.6)'
            ],
            borderColor: [
                'rgba(255, 99, 132, 1)',
                'rgba(54, 162, 235, 1)',
                'rgba(255, 206, 86, 1)',
                'rgba(75, 192, 192, 1)'
            ],
            borderWidth: 1
        }]
    },
    options: {
        responsive: false,
        scales: {
            y: {
                beginAtZero: true,
                title: {
                    display: true,
                    text: 'Стойност'
                }
            }
        },
        plugins: {
            legend: {
                display: false 
            },
            tooltip: {
                callbacks: {
                    label: function(context) {
                        const index = context.dataIndex;
                        const value = context.parsed.y.toFixed(2);
                        const units = [' J', ' J', ' J', ' s']; 
                        return `${context.label}: ${value}${units[index]}`;
                    }
                }
            }
        }
    }
});




let lastChartUpdateSecond = -1;


function animate() {
    requestAnimationFrame(animate);

    if (root) {
        if (isAnimating && empty) {
            const length = parseFloat(lengthInput.value);       
            const mass = parseFloat(massInput.value);         
            const initialAngleDeg = parseFloat(angleInput.value); 
            const initialAngleRad = initialAngleDeg * Math.PI / 180;

            const alpha = -(g / length) * Math.sin(theta);
            omegaSim += alpha * dt;
            theta += omegaSim * dt;

            empty.rotation.x = theta;

            const height = length * (1 - Math.cos(theta));
            const potentialEnergy = mass * g * height;
            const linearVelocity = length * omegaSim;
            const kineticEnergy = 0.5 * mass * linearVelocity ** 2;
            const totalEnergy = potentialEnergy + kineticEnergy;

            const potEl = document.getElementById("potential-energy");
            const kinEl = document.getElementById("kinetic-energy");
            const totalEl = document.getElementById("total-energy");

            if (potEl) potEl.textContent = potentialEnergy.toFixed(2);
            if (kinEl) kinEl.textContent = kineticEnergy.toFixed(2);
            if (totalEl) totalEl.textContent = totalEnergy.toFixed(2);

            energyChart.data.datasets[0].data[0] = potentialEnergy;
            energyChart.data.datasets[0].data[1] = kineticEnergy;
            energyChart.data.datasets[0].data[2] = totalEnergy;

            const period = 2 * Math.PI * Math.sqrt(length / g);
            energyChart.data.datasets[0].data[3] = period;
            energyChart.update('none');

            const now = performance.now() / 1000;
            time = now - startTime;

            const omega = 2 * Math.PI / period;
            const amplitudeMeters = length * Math.sin(initialAngleRad); 
            const amplitudeCm = amplitudeMeters * 100;
            const displacementCm = amplitudeCm * Math.cos(omega * time);

            if (time - lastChartUpdateSecond >= 0.1) {
                chartData.labels.push(time.toFixed(2));
                chartData.datasets[0].data.push(displacementCm.toFixed(2));

                if (chartData.labels.length > 50) {
                    chartData.labels.shift();
                    chartData.datasets[0].data.shift();
                }

                angleChart.update('none');
                lastChartUpdateSecond = time;
            }
        }
    }

    controls.update();
    renderer.render(scene, camera);
}



document.getElementById("view-results-btn").addEventListener("click", () => {
    const length = parseFloat(lengthInput.value);
    const period = 2 * Math.PI * Math.sqrt(length / g);

const data = {
    timeLabels: chartData.labels,
    angleValues: chartData.datasets[0].data,
    mass: parseFloat(massInput.value),
    length: length,
    period: period,
    initialAngle: parseFloat(angleInput.value)
};

    localStorage.setItem('pendulumResults', JSON.stringify(data));

    window.open('results/simple-pendulum.html', '_blank');
});

animate();

