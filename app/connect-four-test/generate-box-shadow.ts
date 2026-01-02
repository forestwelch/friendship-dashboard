/**
 * Generate box-shadow CSS for filled pixelated circle
 * Based on midpoint circle algorithm - fills the entire circle
 */

export function generateBoxShadowCircle(
  radius: number,
  color: string,
  pixelSize: number = 1,
  filled: boolean = true
): string {
  const shadows: string[] = [];

  if (filled) {
    // Generate filled circle - optimized to avoid too many shadows
    // Use a more efficient approach: scan only necessary points
    // For blockier look, round coordinates to nearest pixelSize
    const radiusSquared = radius * radius;

    for (let py = -radius; py <= radius; py++) {
      for (let px = -radius; px <= radius; px++) {
        const distanceSquared = px * px + py * py;
        // Include point if it's within the circle
        if (distanceSquared <= radiusSquared) {
          // Round to nearest pixelSize for blockier appearance
          const roundedX = Math.round(px / pixelSize) * pixelSize;
          const roundedY = Math.round(py / pixelSize) * pixelSize;
          shadows.push(`${roundedX}px ${roundedY}px 0 0 ${color}`);
        }
      }
    }
  } else {
    // Generate outline only using midpoint circle algorithm
    let x = 0;
    let y = radius;
    let d = 1 - radius;

    const addPixel = (px: number, py: number) => {
      // Add all 8 symmetric points
      // Round to nearest pixelSize for blockier appearance
      const points = [
        [px, py],
        [-px, py],
        [px, -py],
        [-px, -py],
        [py, px],
        [-py, px],
        [py, -px],
        [-py, -px],
      ];

      points.forEach(([x, y]) => {
        const roundedX = Math.round((x * pixelSize) / pixelSize) * pixelSize;
        const roundedY = Math.round((y * pixelSize) / pixelSize) * pixelSize;
        shadows.push(`${roundedX}px ${roundedY}px 0 0 ${color}`);
      });
    };

    addPixel(x, y);

    while (x < y) {
      if (d < 0) {
        d += 2 * x + 3;
      } else {
        d += 2 * (x - y) + 5;
        y--;
      }
      x++;
      addPixel(x, y);
    }
  }

  return shadows.join(", ");
}
