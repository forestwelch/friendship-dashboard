type FocusDirection = "up" | "down" | "left" | "right";

export function useFocusManager() {
  // Find all focusable elements
  const getFocusableElements = (): HTMLElement[] => {
    const selector = 'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';
    return Array.from(document.querySelectorAll(selector)) as HTMLElement[];
  };

  // Calculate distance between two elements
  const getDistance = (rect1: DOMRect, rect2: DOMRect) => {
    const x1 = rect1.left + rect1.width / 2;
    const y1 = rect1.top + rect1.height / 2;
    const x2 = rect2.left + rect2.width / 2;
    const y2 = rect2.top + rect2.height / 2;
    return Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
  };

  // Find nearest element in direction
  const findNearestElement = (
    current: HTMLElement,
    direction: FocusDirection
  ): HTMLElement | null => {
    const currentRect = current.getBoundingClientRect();
    const candidates = getFocusableElements().filter((el) => el !== current);

    let nearest: HTMLElement | null = null;
    let minDistance = Infinity;

    candidates.forEach((candidate) => {
      const rect = candidate.getBoundingClientRect();

      // Check if candidate is in the correct direction
      let isValid = false;
      switch (direction) {
        case "up":
          isValid = rect.bottom <= currentRect.top;
          break;
        case "down":
          isValid = rect.top >= currentRect.bottom;
          break;
        case "left":
          isValid = rect.right <= currentRect.left;
          break;
        case "right":
          isValid = rect.left >= currentRect.right;
          break;
      }

      if (isValid) {
        const distance = getDistance(currentRect, rect);
        if (distance < minDistance) {
          minDistance = distance;
          nearest = candidate;
        }
      }
    });

    return nearest;
  };

  // Move focus
  const moveFocus = (direction: FocusDirection) => {
    const current = document.activeElement as HTMLElement;
    if (!current || current === document.body) {
      const first = getFocusableElements()[0];
      first?.focus();
      return;
    }

    const next = findNearestElement(current, direction);
    if (next) {
      next.focus();
    }
  };

  return { moveFocus };
}
