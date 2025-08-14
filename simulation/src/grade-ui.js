export function initGradeUI() {
  const gradeSelect = document.getElementById("grade-select");
  const massSlider = document.getElementById("mass-slider");
  const massInput = document.getElementById("mass-input");

  function getGradeFromURL() {
    const params = new URLSearchParams(window.location.search);
    return params.get('grade') || '7';
  }

  function applyGradeSettings(grade) {
    const isGrade7 = grade === '7';
    const isGrade9 = grade === '9';

    document.querySelectorAll('.grade-7-only').forEach(el => {
      el.style.display = isGrade7 ? 'block' : 'none';
    });
    document.querySelectorAll('.grade-9-only').forEach(el => {
      el.style.display = isGrade9 ? 'block' : 'none';
    });

    const isSimplePendulum = window.location.pathname.includes("simple-pendulum");

    if (massSlider && massInput) {
      if (isGrade9 && isSimplePendulum) {
        massSlider.value = 1;
        massInput.value = 1;
        massSlider.disabled = true;
        massInput.disabled = true;
      } else {
        massSlider.disabled = false;
        massInput.disabled = false;
      }
    }

    gradeSelect.value = grade;
    window.currentGrade = grade;
  }


  gradeSelect.addEventListener("change", () => {
    applyGradeSettings(gradeSelect.value);
  });

  document.addEventListener("DOMContentLoaded", () => {
    const grade = getGradeFromURL();
    applyGradeSettings(grade);
  });
}
