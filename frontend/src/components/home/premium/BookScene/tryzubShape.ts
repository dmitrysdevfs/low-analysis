import * as THREE from "three";

// Stylised Ukrainian trident — symmetric outline, Y-up coordinate system
export function makeTryzubShape(S = 0.14): THREE.Shape {
  const s = new THREE.Shape();

  s.moveTo(0, 3.5 * S);
  s.lineTo(0.24 * S, 2.9 * S);
  s.lineTo(0.24 * S, 2.0 * S);
  s.lineTo(0.95 * S, 2.0 * S);
  s.lineTo(0.95 * S, 2.2 * S);
  s.lineTo(1.2 * S, 2.2 * S);
  s.lineTo(1.2 * S, 3.1 * S);
  s.lineTo(1.45 * S, 2.9 * S);
  s.lineTo(1.55 * S, 2.2 * S);
  s.lineTo(1.8 * S, 2.2 * S);
  s.lineTo(1.8 * S, 1.8 * S);
  s.lineTo(1.55 * S, 1.8 * S);
  s.lineTo(1.55 * S, 1.1 * S);
  s.lineTo(1.8 * S, 1.1 * S);
  s.lineTo(1.8 * S, 0.75 * S);
  s.lineTo(1.55 * S, 0.75 * S);
  s.lineTo(0.3 * S, 0.75 * S);
  s.lineTo(0.3 * S, -0.4 * S);
  s.lineTo(0.7 * S, -0.4 * S);
  s.lineTo(0.7 * S, -0.85 * S);
  s.lineTo(0, -0.85 * S);
  // mirror left
  s.lineTo(-0.7 * S, -0.85 * S);
  s.lineTo(-0.7 * S, -0.4 * S);
  s.lineTo(-0.3 * S, -0.4 * S);
  s.lineTo(-0.3 * S, 0.75 * S);
  s.lineTo(-1.55 * S, 0.75 * S);
  s.lineTo(-1.8 * S, 0.75 * S);
  s.lineTo(-1.8 * S, 1.1 * S);
  s.lineTo(-1.55 * S, 1.1 * S);
  s.lineTo(-1.55 * S, 1.8 * S);
  s.lineTo(-1.8 * S, 1.8 * S);
  s.lineTo(-1.8 * S, 2.2 * S);
  s.lineTo(-1.55 * S, 2.2 * S);
  s.lineTo(-1.45 * S, 2.9 * S);
  s.lineTo(-1.2 * S, 3.1 * S);
  s.lineTo(-1.2 * S, 2.2 * S);
  s.lineTo(-0.95 * S, 2.2 * S);
  s.lineTo(-0.95 * S, 2.0 * S);
  s.lineTo(-0.24 * S, 2.0 * S);
  s.lineTo(-0.24 * S, 2.9 * S);
  s.closePath();

  return s;
}
