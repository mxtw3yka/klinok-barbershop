const comparisonRange = document.querySelector("#before-after-range");
const comparisonFrame = document.querySelector(".before-after-frame");

if (comparisonRange && comparisonFrame) {
  const updateComparison = () => {
    comparisonFrame.style.setProperty("--reveal", `${comparisonRange.value}%`);
  };

  const updateFromPointer = (event) => {
    const bounds = comparisonFrame.getBoundingClientRect();
    const position = (event.clientX - bounds.left) / bounds.width;
    comparisonRange.value = String(Math.round(Math.max(0, Math.min(1, position)) * 100));
    comparisonRange.dispatchEvent(new Event("input", { bubbles: true }));
  };

  let activePointerId = null;

  comparisonFrame.addEventListener("pointerdown", (event) => {
    if (!event.isPrimary) return;
    event.preventDefault();
    activePointerId = event.pointerId;
    comparisonFrame.setPointerCapture(event.pointerId);
    comparisonRange.focus({ preventScroll: true });
    updateFromPointer(event);
  });

  comparisonFrame.addEventListener("pointermove", (event) => {
    if (event.pointerId === activePointerId) updateFromPointer(event);
  });

  const stopDragging = (event) => {
    if (event.pointerId !== activePointerId) return;
    activePointerId = null;
    comparisonFrame.releasePointerCapture(event.pointerId);
  };

  comparisonFrame.addEventListener("pointerup", stopDragging);
  comparisonFrame.addEventListener("pointercancel", stopDragging);
  comparisonRange.addEventListener("input", updateComparison);
  comparisonRange.addEventListener("change", updateComparison);
  updateComparison();
}
