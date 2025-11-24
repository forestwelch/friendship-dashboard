/**
 * Generate pixelated circle polygon points using midpoint circle algorithm
 * Based on techniques from pixel circle generators
 */

export function generatePixelCirclePolygon(
  radius: number,
  centerX: number = 50,
  centerY: number = 50,
  stepSize: number = 1
): string {
  const points: Array<[number, number]> = [];
  
  // Midpoint circle algorithm - generates points in one octant, then mirrors
  let x = 0;
  let y = radius;
  let d = 1 - radius;
  
  // Helper to add point (normalized to percentage)
  const addPoint = (px: number, py: number) => {
    points.push([centerX + px, centerY + py]);
    points.push([centerX - px, centerY + py]);
    points.push([centerX + px, centerY - py]);
    points.push([centerX - px, centerY - py]);
    points.push([centerX + py, centerY + px]);
    points.push([centerX - py, centerY + px]);
    points.push([centerX + py, centerY - px]);
    points.push([centerX - py, centerY - px]);
  };
  
  addPoint(x, y);
  
  while (x < y) {
    if (d < 0) {
      d += 2 * x + 3;
    } else {
      d += 2 * (x - y) + 5;
      y--;
    }
    x++;
    
    // Only add points at step intervals for pixelation
    if (x % stepSize === 0 || y % stepSize === 0) {
      addPoint(x, y);
    }
  }
  
  // Sort points by angle to create proper polygon
  points.sort((a, b) => {
    const angleA = Math.atan2(a[1] - centerY, a[0] - centerX);
    const angleB = Math.atan2(b[1] - centerY, b[0] - centerX);
    return angleA - angleB;
  });
  
  // Remove duplicates and convert to percentage string
  const uniquePoints = Array.from(
    new Map(points.map(p => [`${p[0]},${p[1]}`, p])).values()
  );
  
  return uniquePoints.map(p => `${p[0]}% ${p[1]}%`).join(", ");
}

/**
 * Generate a simpler stepped circle polygon
 * Creates visible pixelated steps
 */
export function generateSteppedCirclePolygon(
  steps: number = 16
): string {
  const points: string[] = [];
  const stepAngle = (Math.PI * 2) / steps;
  
  for (let i = 0; i < steps; i++) {
    const angle = i * stepAngle;
    // Use stepped radius to create pixelation
    const radius = 50;
    const x = 50 + radius * Math.cos(angle);
    const y = 50 + radius * Math.sin(angle);
    points.push(`${x}% ${y}%`);
  }
  
  return points.join(", ");
}

