import { initScene, loadModel } from './setup.js';
import { createOscillationChart, createEnergyChart } from './charts.js';
import { setupControlListeners, setControlsEnabled } from './controls.js';

const { scene, camera, renderer, controls } = initScene();

let root = null, sphere = null, cylinder = null, empty = null;

loadModel(scene, 'assets/pendulum.glb', (loadedRoot) => {
    root = loadedRoot;
    sphere = root.getObjectByName("Sphere");
    cylinder = root.getObjectByName("Cylinder004");
    empty = root.getObjectByName("Pivot_Cylinder");
});

function updateSphereSize(value) {
    if (!sphere) return;
    const scaleFactor = 0.2 + (value - 0.01) * (0.5 / 1.99);
    sphere.scale.set(scaleFactor, scaleFactor, scaleFactor);
}

const { slider: massSlider, input: massInput } = setupControlListeners("mass-slider", "mass-input", updateSphereSize);

function updateStringLength(length) {
    if (!cylinder || !sphere) return;
    const originalScaleY = cylinder.scale.y;
    cylinder.scale.y = -length;
    sphere.position.y = originalScaleY + cylinder.scale.y - sphere.scale.y / 2;
}

const { slider: lengthSlider, input: lengthInput } = setupControlListeners("length-slider", "length-input", (value) => {
    updateStringLength(value);
    updatePeriodDisplay();
});

let angle = 0, angleRad = 0;

function syncAngleInputs(value) {
    angleSlider.value = value;
    angleInput.value = value;
    angle = value;
    angleRad = angle * (Math.PI / 180);
    if (empty) empty.rotation.x = angleRad;
}

const { slider: angleSlider, input: angleInput } = setupControlListeners("angle-slider", "angle-input", (value) => syncAngleInputs(parseInt(value)));

let isAnimating = false;
let time = 0, pauseTime = 0, startTime = null;
let theta = 0;
const g = 9.81;
let startFromEquilibrium = true;
let constantTotalEnergy = null;
let chartTimeOffset = 0;
let lastChartUpdateSecond = -1;

const startBtn = document.getElementById("start-btn");
startBtn.addEventListener("click", () => {
    if (!isAnimating) {
        isAnimating = true;
        const initialAngleDeg = parseFloat(angleInput.value);
        const initialAngleRad = initialAngleDeg * Math.PI / 180;

        setControlsEnabled(["mass-slider", "length-slider", "angle-slider"], false);
        if (startFromEquilibrium) {
            theta = 0;
            const length = parseFloat(lengthInput.value);
            const mass = parseFloat(massInput.value);
            const height0 = length * (1 - Math.cos(initialAngleRad));
            constantTotalEnergy = mass * g * height0;
        } else {
            theta = initialAngleRad;
        }
        if (startTime === null) {
            startTime = performance.now() / 1000;
            chartTimeOffset = 0;
            fillInitialChartData();
            lastChartUpdateSecond = chartTimeOffset;
        } else {
            startTime = performance.now() / 1000 - pauseTime;
            lastChartUpdateSecond = parseFloat(angleChart.data.labels[angleChart.data.labels.length - 1]) || 0;
        }
    }
});

const pauseBtn = document.getElementById("pause-btn");
pauseBtn.addEventListener("click", () => {
    if (isAnimating) {
        isAnimating = false;
        pauseTime = performance.now() / 1000 - startTime;
        setControlsEnabled(["mass-slider", "length-slider", "angle-slider"], false);
    }
});

const resetBtn = document.getElementById("reset-btn");
resetBtn.addEventListener("click", () => {
    isAnimating = false;
    time = 0;
    pauseTime = 0;
    startTime = null;
    theta = 0;
    constantTotalEnergy = null;
    lastChartUpdateSecond = -1;

    setControlsEnabled(["mass-slider", "length-slider", "angle-slider"], true);
    syncAngleInputs(0);
    if (empty) empty.rotation.x = 0;

    angleChart.data.labels.length = 0;
    angleChart.data.datasets[0].data = [];
    angleChart.update();

    energyChart.data.datasets[0].data = [0, 0, 0, 0];
    energyChart.update();

    ["potential-energy", "kinetic-energy", "total-energy"].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.textContent = "0.00";
    });

    updatePeriodDisplay();
});

function fillInitialChartData() {
    const length = parseFloat(lengthInput.value);
    const initialAngleDeg = parseFloat(angleInput.value);
    const initialAngleRad = initialAngleDeg * Math.PI / 180;
    const omega = Math.sqrt(g / length);

    if (chartTimeOffset === 0) {
        angleChart.data.labels = [];
        angleChart.data.datasets[0].data = [];
    }

    for (let i = 0; i < 50; i++) {
        const t = chartTimeOffset + i * 0.1;
        const theta_t = initialAngleRad * Math.cos(omega * t);
        const displacementM = length * Math.sin(theta_t);
        angleChart.data.labels.push(t.toFixed(2));
        angleChart.data.datasets[0].data.push(parseFloat(displacementM.toFixed(3)));
    }

    chartTimeOffset = parseFloat(angleChart.data.labels[angleChart.data.labels.length - 1]) + 0.1;
    lastChartUpdateSecond = chartTimeOffset;
    angleChart.update();
}

function updatePeriodDisplay() {
    const length = parseFloat(lengthInput.value);
    const period = 2 * Math.PI * Math.sqrt(length / g);
    document.getElementById("period-value").textContent = period.toFixed(2);
}

const chartCtx = document.getElementById("chart").getContext("2d");
const angleChart = createOscillationChart(chartCtx, 'Хармонично трептене', 'Амплитуда (м)', -2.5, 2.5, 0.5, (value) => `${value.toFixed(2)} м`, (context) => `Амплитуда: ${context.parsed.y.toFixed(3)} м`);

const energyChartCtx = document.getElementById("energyChart").getContext("2d");
const energyChart = createEnergyChart(energyChartCtx);

function animate() {
    requestAnimationFrame(animate);

    if (root && isAnimating && empty) {
        const length = parseFloat(lengthInput.value);
        const mass = parseFloat(massInput.value);
        const initialAngleDeg = parseFloat(angleInput.value);
        const initialAngleRad = initialAngleDeg * Math.PI / 180;

        const omega = Math.sqrt(g / length);

        const now = performance.now() / 1000;
        time = startTime !== null ? now - startTime : time;
        const chartTime = time + chartTimeOffset;

        theta = initialAngleRad * Math.cos(omega * chartTime);
        empty.rotation.x = theta;

        const height = length * (1 - Math.cos(theta));
        const potentialEnergy = mass * g * height;
        const totalEnergy = constantTotalEnergy !== null ? constantTotalEnergy : potentialEnergy;
        const kineticEnergy = Math.max(0, totalEnergy - potentialEnergy);

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

        if (chartTime - lastChartUpdateSecond >= 0.1) {
            const displacementM = length * Math.sin(theta);
            angleChart.data.labels.push(chartTime.toFixed(2));
            angleChart.data.datasets[0].data.push(parseFloat(displacementM.toFixed(3)));

            if (angleChart.data.labels.length > 50) {
                angleChart.data.labels.shift();
                angleChart.data.datasets[0].data.shift();
            }

            angleChart.update('none');
            lastChartUpdateSecond = chartTime;
        }
    }

    controls.update();
    renderer.render(scene, camera);
}

document.getElementById("view-results-btn").addEventListener("click", () => {
    const length = parseFloat(lengthInput.value);
    const period = 2 * Math.PI * Math.sqrt(length / g);

    const data = {
        timeLabels: angleChart.data.labels,
        angleValues: angleChart.data.datasets[0].data,
        mass: parseFloat(massInput.value),
        length: length,
        period: period,
        initialAngle: parseFloat(angleInput.value)
    };

    localStorage.setItem('pendulumResults', JSON.stringify(data));
    window.open('results/simple-pendulum.html', '_blank');
});

updatePeriodDisplay();
animate();