function setupControlListeners(sliderId, inputId, onChange) {
    const slider = document.getElementById(sliderId);
    const input = document.getElementById(inputId);

    slider.addEventListener("input", (e) => {
        const value = parseFloat(e.target.value);
        input.value = value;
        onChange(value);
    });

    input.addEventListener("input", (e) => {
        const value = parseFloat(e.target.value);
        slider.value = value;
        onChange(value);
    });

    return { slider, input };
}

function setControlsEnabled(sliderIds, enabled) {
    sliderIds.forEach(id => {
        const slider = document.getElementById(id);
        const input = document.getElementById(id.replace("-slider", "-input"));
        if (slider) slider.disabled = !enabled;
        if (input) input.disabled = !enabled;
    });
}

export { setupControlListeners, setControlsEnabled };