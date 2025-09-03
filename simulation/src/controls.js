export function setupControlListeners(sliderId, inputId, onChange) {
    const slider = document.getElementById(sliderId);
    const input = document.getElementById(inputId);

    const minValue = parseFloat(slider.min);
    const maxValue = parseFloat(slider.max);
    const step = parseFloat(slider.step);

    slider.addEventListener("input", (e) => {
        const value = parseFloat(e.target.value);
        input.value = value.toFixed(2);
        onChange(value);
    });

    input.addEventListener("input", (e) => {
        const value = e.target.value;

        if (value === "" || /^\d*\.?\d*$/.test(value)) {
            return;
        }

        alert("Моля, въведете само числа!");
        input.value = slider.value;
        onChange(parseFloat(slider.value));
    });

    input.addEventListener("blur", () => {
        let value = input.value.trim();

        if (value === "") {
            input.value = slider.value;
            onChange(parseFloat(slider.value));
            return;
        }

        value = parseFloat(value);

        if (isNaN(value)) {
            alert("Моля, въведете валидно число!");
            input.value = slider.value;
            onChange(parseFloat(slider.value));
            return;
        }

        if (value < minValue || value > maxValue) {
            alert(`Стойността трябва да е между ${minValue} и ${maxValue}!`);
            value = Math.min(Math.max(value, minValue), maxValue);
        }

        value = Math.round(value / step) * step;
        input.value = value.toFixed(2);
        slider.value = value;
        onChange(value);
    });

    input.addEventListener("keydown", (e) => {
        if (e.key === "Enter") {
            let value = input.value.trim();

            if (value === "") {
                alert("Моля, въведете валидно число!");
                input.value = slider.value;
                onChange(parseFloat(slider.value));
                return;
            }

            value = parseFloat(value);

            if (isNaN(value)) {
                alert("Моля, въведете валидно число!");
                input.value = slider.value;
                onChange(parseFloat(slider.value));
                return;
            }

            if (value < minValue || value > maxValue) {
                alert(`Стойността трябва да е между ${minValue} и ${maxValue}!`);
                value = Math.min(Math.max(value, minValue), maxValue);
            }

            value = Math.round(value / step) * step;
            input.value = value.toFixed(2);
            slider.value = value;
            onChange(value);
        }
    });

    return { slider, input };
}

export function setControlsEnabled(sliderIds, enabled) {
    sliderIds.forEach(id => {
        const slider = document.getElementById(id);
        const input = document.getElementById(id.replace("-slider", "-input"));
        if (slider) slider.disabled = !enabled;
        if (input) input.disabled = !enabled;
    });
}