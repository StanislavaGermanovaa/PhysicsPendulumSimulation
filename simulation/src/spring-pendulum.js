import { initScene, loadModel } from './setup.js';
import { createOscillationChart, createEnergyChart } from './charts.js';
import { setupControlListeners, setControlsEnabled } from './controls.js';

const { scene, camera, renderer, controls } = initScene();

let root = null;
let sphere = null;
let spring = null;
let empty = null;

loadModel(scene, 'assets/springPendulum.glb', (loadedRoot) => {
    root = loadedRoot;
    sphere = root.getObjectByName("Sphere");
    spring = root.getObjectByName("Spring");
    empty = root.getObjectByName("Pivot_Cylinder");
}, (xhr) => {
    console.log((xhr.loaded / xhr.total * 100) + "% loaded");
});

function updateSphereSize(value) {
    if (sphere) {
        let scaleFactor = 0.2 + (value - 0.01) * (0.5 / 1.99);
        sphere.scale.set(scaleFactor, scaleFactor, scaleFactor);
    }
}

const { slider: massSlider, input: massInput } = setupControlListeners("mass-slider", "mass-input", updateSphereSize);

const equilibriumLength = 0.4;

function updateStringLength(amplitude) {
    if (spring && sphere) {
        const currentLength = equilibriumLength + amplitude;
        spring.scale.z = currentLength;
        sphere.position.y = -6 * currentLength;
    }
}

const { slider: lengthSlider, input: lengthInput } = setupControlListeners("amplitude-slider", "amplitude-input", updateStringLength);

let springConstant = parseFloat(document.getElementById("k-slider")?.value || 10);

const { slider: kSlider, input: kInput } = setupControlListeners("k-slider", "k-input", (value) => {
    springConstant = value;
});

let isAnimating = false;
let time = 0;
let pauseTime = 0;
let startTime = null;
let chartTimeOffset = 0;
let lastChartUpdateSecond = 0;

const startBtn = document.getElementById("start-btn");
startBtn.addEventListener("click", () => {
    if (!isAnimating) {
        isAnimating = true;
        startTime = performance.now() / 1000 - pauseTime;

        setControlsEnabled(["mass-slider", "amplitude-slider", "k-slider"], false);

        if (pauseTime === 0) {
            chartTimeOffset = 0;
            fillInitialChartData();
            lastChartUpdateSecond = chartTimeOffset;
        } else {
            lastChartUpdateSecond = parseFloat(chart.data.labels[chart.data.labels.length - 1]) || 0;
        }
    }
});

const pauseBtn = document.getElementById("pause-btn");
pauseBtn.addEventListener("click", () => {
    if (isAnimating) {
        isAnimating = false;
        pauseTime = time;
        setControlsEnabled(["mass-slider", "amplitude-slider", "k-slider"], false);
    }
});

const resetBtn = document.getElementById("reset-btn");
resetBtn.addEventListener("click", () => {
    isAnimating = false;
    time = 0;
    pauseTime = 0;
    startTime = null;
    lastChartUpdateSecond = 0;

    setControlsEnabled(["mass-slider", "amplitude-slider", "k-slider"], true);

    lengthSlider.value = 0;
    lengthInput.value = 0;
    const currentLength = equilibriumLength;
    if (spring) spring.scale.z = currentLength;
    if (sphere) sphere.position.y = -6 * currentLength;

    chart.data.labels = [];
    chart.data.datasets[0].data = [];
    chart.update();

    energyChart.data.datasets[0].data = [0, 0, 0, 0];
    energyChart.update();

    document.getElementById("period-value").textContent = "0.00";
});

function fillInitialChartData() {
    const mass = parseFloat(massSlider.value);
    const k = springConstant;
    const amplitude = parseFloat(lengthSlider.value);
    const omega = Math.sqrt(k / mass);

    if (chartTimeOffset === 0) {
        chart.data.labels = [];
        chart.data.datasets[0].data = [];
    }

    for (let i = 0; i < 50; i++) {
        const t = chartTimeOffset + i * 0.1;
        const x = amplitude * Math.cos(omega * t);
        chart.data.labels.push(t.toFixed(2));
        chart.data.datasets[0].data.push(parseFloat(x.toFixed(3)));
    }

    chartTimeOffset = parseFloat(chart.data.labels[chart.data.labels.length - 1]) + 0.1;
    lastChartUpdateSecond = chartTimeOffset;
    chart.update('none');
}

const chartCtx = document.getElementById("chart").getContext("2d");
const chart = createOscillationChart(chartCtx, "Хармонично трептене (пружина)", 'Отклонение (м)', -0.5, 0.5, 0.1, (value) => `${value} м`, (context) => `Отклонение: ${context.parsed.y} м`);

const energyChartCtx = document.getElementById("energyChart").getContext("2d");
const energyChart = createEnergyChart(energyChartCtx, 1);

function animate() {
    requestAnimationFrame(animate);

    if (isAnimating && startTime !== null) {
        const now = performance.now() / 1000;
        time = now - startTime;
    }

    if (root && isAnimating && sphere && spring && empty) {
        const mass = parseFloat(massSlider.value);
        const k = springConstant;
        const amplitude = parseFloat(lengthSlider.value);

        const omega = Math.sqrt(k / mass);
        const chartTime = time + chartTimeOffset;
        const x = amplitude * Math.cos(omega * chartTime);
        const velocity = -amplitude * omega * Math.sin(omega * chartTime);

        const currentLength = equilibriumLength + x;

        spring.scale.z = currentLength;
        sphere.position.y = -6 * currentLength;

        const potentialEnergy = 0.5 * k * x * x;
        const kineticEnergy = 0.5 * mass * velocity * velocity;
        const totalEnergy = potentialEnergy + kineticEnergy;

        const period = 2 * Math.PI * Math.sqrt(mass / k);
        document.getElementById("period-value").textContent = period.toFixed(2);

        energyChart.data.datasets[0].data = [
            potentialEnergy,
            kineticEnergy,
            totalEnergy,
            period
        ];
        energyChart.update('none');

        if (chartTime - lastChartUpdateSecond >= 0.1) {
            chart.data.labels.push(chartTime.toFixed(2));
            chart.data.datasets[0].data.push(parseFloat(x.toFixed(3)));

            if (chart.data.labels.length > 50) {
                chart.data.labels.shift();
                chart.data.datasets[0].data.shift();
            }

            chart.update('none');
            lastChartUpdateSecond = chartTime;
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
        timeLabels: chart.data.labels,
        displacementValues: chart.data.datasets[0].data,
        mass: mass,
        amplitude: amplitude,
        springConstant: k,
        period: period
    };

    localStorage.setItem('springPendulumResults', JSON.stringify(data));
    window.open('results/spring-pendulum-results.html', '_blank');
});

animate();