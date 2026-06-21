/* eslint-disable react-hooks/purity, react-hooks/immutability */
"use client";

import { useRef, useMemo } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import { EffectComposer, Bloom } from "@react-three/postprocessing";
import * as THREE from "three";
import { makeTryzubShape } from "./tryzubShape";
import styles from "./BookScene.module.scss";

/* ─── Tryzub ─────────────────────────────────────────────── */
function TryzubMesh({ z }: { z: number }) {
  const meshRef = useRef<THREE.Mesh>(null);
  const geo = useMemo(() => {
    const g = new THREE.ExtrudeGeometry(makeTryzubShape(0.14), {
      depth: 0.055,
      bevelEnabled: true,
      bevelThickness: 0.015,
      bevelSize: 0.010,
      bevelSegments: 4,
    });
    g.center();
    return g;
  }, []);

  const mat = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: 0xd4a020,
        roughness: 0.08,
        metalness: 1.0,
        emissive: new THREE.Color(0xd4a020),
        emissiveIntensity: 0.4,
      }),
    []
  );

  useFrame(({ clock }) => {
    if (mat) mat.emissiveIntensity = 0.38 + Math.sin(clock.getElapsedTime() * 2.4) * 0.18;
  });

  return (
    <mesh ref={meshRef} geometry={geo} material={mat} position={[0, 0.25, z + 0.045]} />
  );
}

/* ─── Book ───────────────────────────────────────────────── */
const BW = 1.7, BH = 2.3, BD = 0.42;

function Book() {
  const groupRef = useRef<THREE.Group>(null);

  const mCover = useMemo(() => new THREE.MeshStandardMaterial({ color: 0x07121f, roughness: 0.22, metalness: 0.35 }), []);
  const mPages = useMemo(() => new THREE.MeshStandardMaterial({ color: 0xd5c9b2, roughness: 0.92, metalness: 0.0 }), []);
  const mSpine = useMemo(() => new THREE.MeshStandardMaterial({ color: 0x050e18, roughness: 0.38, metalness: 0.5  }), []);
  const fMat   = useMemo(() => new THREE.MeshStandardMaterial({ color: 0xc8a843, roughness: 0.06, metalness: 1.0, emissive: new THREE.Color(0xc8a843), emissiveIntensity: 0.2 }), []);

  useFrame(({ clock }) => {
    if (!groupRef.current) return;
    const t = clock.getElapsedTime();
    groupRef.current.position.y = 1.4 + Math.sin(t * 0.7) * 0.1;
    groupRef.current.rotation.y = Math.sin(t * 0.28) * 0.13;
  });

  const mg = 0.13, ft = 0.028, fd = 0.008;

  return (
    <group ref={groupRef} position={[0, 1.4, 0]}>
      {/* Book body */}
      <mesh castShadow materials={[mPages, mSpine, mPages, mPages, mCover, mCover]}>
        <boxGeometry args={[BW, BH, BD]} />
      </mesh>

      {/* Gold frame – top */}
      <mesh material={fMat} position={[0, BH/2 - mg - ft/2, BD/2 + fd/2]}>
        <boxGeometry args={[BW - 2*mg, ft, fd]} />
      </mesh>
      {/* bottom */}
      <mesh material={fMat} position={[0, -(BH/2 - mg - ft/2), BD/2 + fd/2]}>
        <boxGeometry args={[BW - 2*mg, ft, fd]} />
      </mesh>
      {/* left */}
      <mesh material={fMat} position={[-(BW/2 - mg - ft/2), 0, BD/2 + fd/2]}>
        <boxGeometry args={[ft, BH - 2*mg, fd]} />
      </mesh>
      {/* right */}
      <mesh material={fMat} position={[BW/2 - mg - ft/2, 0, BD/2 + fd/2]}>
        <boxGeometry args={[ft, BH - 2*mg, fd]} />
      </mesh>

      {/* Corner dots */}
      {([-1, 1] as const).flatMap(sx =>
        ([-1, 1] as const).map(sy => (
          <mesh key={`${sx}${sy}`} material={fMat}
            position={[sx*(BW/2 - mg - 0.01), sy*(BH/2 - mg - 0.01), BD/2 + fd/2]}
            rotation={[Math.PI/2, 0, 0]}>
            <cylinderGeometry args={[0.022, 0.022, fd, 12]} />
          </mesh>
        ))
      )}

      {/* Tryzub */}
      <TryzubMesh z={BD/2} />

      {/* Spine decorative lines */}
      {[0.5, -0.5].map(y => (
        <mesh key={y} position={[-BW/2 + 0.002, y, 0]} rotation={[0, Math.PI/2, 0]}
          material={new THREE.MeshStandardMaterial({ color: 0xc8a843, roughness: 0.08, metalness: 1 })}>
          <boxGeometry args={[BD - 0.04, 0.018, 0.005]} />
        </mesh>
      ))}
    </group>
  );
}

/* ─── Pedestal ───────────────────────────────────────────── */
function Pedestal() {
  const glowRef = useRef<THREE.MeshStandardMaterial>(null);
  const lightRef = useRef<THREE.PointLight>(null);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    if (glowRef.current)  glowRef.current.emissiveIntensity = 2.5 + Math.sin(t * 1.6) * 0.7;
    if (lightRef.current) lightRef.current.intensity = 5.0 + Math.sin(t * 1.6) * 1.2;
  });

  return (
    <group>
      <pointLight ref={lightRef} color={0xd4a020} intensity={5} distance={8} decay={2} position={[0, 0.1, 0]} />

      {/* Base disk */}
      <mesh receiveShadow>
        <cylinderGeometry args={[1.6, 1.35, 0.1, 80]} />
        <meshStandardMaterial color={0x0a0900} roughness={0.18} metalness={0.9} />
      </mesh>

      {/* Plinth */}
      <mesh position={[0, 0.19, 0]}>
        <cylinderGeometry args={[0.72, 0.92, 0.28, 40]} />
        <meshStandardMaterial color={0x0e0c01} roughness={0.28} metalness={0.8} />
      </mesh>

      {/* Outer gold ring */}
      <mesh rotation={[Math.PI/2, 0, 0]} position={[0, 0.052, 0]}>
        <torusGeometry args={[1.52, 0.032, 14, 90]} />
        <meshStandardMaterial color={0xd4a020} roughness={0.04} metalness={1} emissive={new THREE.Color(0xd4a020)} emissiveIntensity={0.7} />
      </mesh>

      {/* Inner ring */}
      <mesh rotation={[Math.PI/2, 0, 0]} position={[0, 0.054, 0]}>
        <torusGeometry args={[1.12, 0.016, 10, 90]} />
        <meshStandardMaterial color={0xc8a843} roughness={0.1} metalness={1} emissive={new THREE.Color(0xc8a843)} emissiveIntensity={0.35} />
      </mesh>

      {/* Glow disk */}
      <mesh position={[0, 0.334, 0]}>
        <cylinderGeometry args={[0.7, 0.7, 0.008, 64]} />
        <meshStandardMaterial ref={glowRef} color={0xd4a020} emissive={new THREE.Color(0xd4a020)} emissiveIntensity={2.8} transparent opacity={0.65} roughness={0} metalness={0} depthWrite={false} />
      </mesh>
    </group>
  );
}

/* ─── Particles ──────────────────────────────────────────── */
function Particles() {
  const N = 450, SN = 50;
  const dustRef  = useRef<THREE.Points>(null);
  const sparkRef = useRef<THREE.Points>(null);

  const { dustGeo, dustVel, sparkGeo } = useMemo(() => {
    const pos = new Float32Array(N * 3);
    const vel = new Float32Array(N);
    for (let i = 0; i < N; i++) {
      const a = Math.random() * Math.PI * 2;
      const r = 0.4 + Math.random() * 2.4;
      pos[i*3] = Math.cos(a)*r; pos[i*3+1] = -0.3 + Math.random() * 5.3; pos[i*3+2] = Math.sin(a)*r;
      vel[i] = 0.002 + Math.random() * 0.003;
    }
    const dg = new THREE.BufferGeometry();
    dg.setAttribute("position", new THREE.BufferAttribute(pos, 3));

    const sp = new Float32Array(SN * 3);
    for (let i = 0; i < SN; i++) {
      const a = (i/SN) * Math.PI * 2;
      const r = 1.2 + Math.random() * 0.35;
      sp[i*3] = Math.cos(a)*r; sp[i*3+1] = Math.random() * 0.4; sp[i*3+2] = Math.sin(a)*r;
    }
    const sg = new THREE.BufferGeometry();
    sg.setAttribute("position", new THREE.BufferAttribute(sp, 3));

    return { dustGeo: dg, dustVel: vel, sparkGeo: sg };
  }, []);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    const da = dustGeo.attributes.position.array as Float32Array;
    for (let i = 0; i < N; i++) {
      da[i*3+1] += dustVel[i];
      if (da[i*3+1] > 5) da[i*3+1] = -0.3;
    }
    dustGeo.attributes.position.needsUpdate = true;
    if (dustRef.current) dustRef.current.rotation.y += 0.0007;

    const sa = sparkGeo.attributes.position.array as Float32Array;
    for (let i = 0; i < SN; i++) {
      const ang = (i/SN) * Math.PI * 2 + t * 0.18;
      const r   = 1.2 + Math.sin(t * 3 + i) * 0.2;
      sa[i*3] = Math.cos(ang)*r; sa[i*3+2] = Math.sin(ang)*r;
      sa[i*3+1] = 0.15 + Math.abs(Math.sin(t * 4 + i * 0.8)) * 0.4;
    }
    sparkGeo.attributes.position.needsUpdate = true;
  });

  const dustMat  = useMemo(() => new THREE.PointsMaterial({ color: 0xd4a020, size: 0.035, transparent: true, opacity: 0.50, sizeAttenuation: true, blending: THREE.AdditiveBlending, depthWrite: false }), []);
  const sparkMat = useMemo(() => new THREE.PointsMaterial({ color: 0xffd060, size: 0.10,  transparent: true, opacity: 0.85, sizeAttenuation: true, blending: THREE.AdditiveBlending, depthWrite: false }), []);

  return (
    <>
      <points ref={dustRef}  geometry={dustGeo}  material={dustMat}  />
      <points ref={sparkRef} geometry={sparkGeo} material={sparkMat} />
    </>
  );
}

/* ─── Scene ──────────────────────────────────────────────── */
function Scene() {
  return (
    <>
      <ambientLight color={0x0d1e33} intensity={2.0} />
      <pointLight color={0x2255aa}  intensity={2.5} distance={14} decay={1.5} position={[4, 5, 6]} />
      <pointLight color={0xc8a843}  intensity={2.0} distance={10} decay={2}   position={[-3, 4, -5]} />
      <spotLight  color={0xfff4dd}  intensity={3.5} distance={18} angle={0.28} penumbra={0.6} decay={1.5}
        position={[0, 9, 5]} target-position={[0, 1.5, 0]} castShadow />

      <Pedestal />
      <Book />
      <Particles />

      {/* Shadow receiver */}
      <mesh rotation={[-Math.PI/2, 0, 0]} position={[0, -0.06, 0]} receiveShadow>
        <circleGeometry args={[4, 48]} />
        <shadowMaterial opacity={0.45} />
      </mesh>

      <OrbitControls
        enableDamping dampingFactor={0.045}
        target={[0, 1.2, 0]}
        minDistance={3.5} maxDistance={14}
        maxPolarAngle={Math.PI * 0.62}
        autoRotate autoRotateSpeed={0.35}
      />

      <EffectComposer>
        <Bloom luminanceThreshold={0.80} luminanceSmoothing={0.5} intensity={0.75} radius={0.5} />
      </EffectComposer>
    </>
  );
}

/* ─── Canvas export ──────────────────────────────────────── */
export default function BookCanvas() {
  return (
    <Canvas
      className={styles.canvas}
      camera={{ fov: 42, position: [0, 2.4, 7.5], near: 0.1, far: 100 }}
      shadows
      gl={{ antialias: true, toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: 1.15, outputColorSpace: THREE.SRGBColorSpace }}
      scene={{ background: new THREE.Color(0x06101c), fog: new THREE.FogExp2(0x06101c, 0.055) }}
    >
      <Scene />
    </Canvas>
  );
}
