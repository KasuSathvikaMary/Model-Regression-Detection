import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";

type FloatingCoreProps = {
  active?: boolean;
};

export default function FloatingCore({
  active = true,
}: FloatingCoreProps) {
  const coreRef = useRef<THREE.Group>(null);
  const particlesRef = useRef<THREE.Points>(null);

  /*
   * Deterministic pseudo-random function.
   * Avoids Math.random() during React render.
   */
  const random = (seed: number) => {
    const x =
      Math.sin(seed * 12.9898) *
      43758.5453;

    return x - Math.floor(x);
  };

  /*
   * Generate particles once.
   */
  const particlePositions = useMemo(() => {
    const count = 420;

    const positions = new Float32Array(
      count * 3
    );

    for (let i = 0; i < count; i++) {
      const r1 = random(i + 1);
      const r2 = random(i + 101);
      const r3 = random(i + 201);

      const radius =
        1.1 + r1 * 2.3;

      const theta =
        r2 * Math.PI * 2;

      const phi =
        Math.acos(2 * r3 - 1);

      positions[i * 3] =
        radius *
        Math.sin(phi) *
        Math.cos(theta);

      positions[i * 3 + 1] =
        radius *
        Math.sin(phi) *
        Math.sin(theta);

      positions[i * 3 + 2] =
        radius *
        Math.cos(phi);
    }

    return positions;
  }, []);

  /*
   * Animation
   */
  useFrame((state) => {
    const time =
      state.clock.elapsedTime;

    if (coreRef.current) {
      /*
       * Rotate faster while analysis is active.
       */
      const rotationSpeed = active
        ? 0.55
        : 0.25;

      coreRef.current.rotation.y =
        time * rotationSpeed;

      coreRef.current.rotation.x =
        Math.sin(time * 0.5) * 0.15;

      /*
       * Pulsing AI core.
       */
      const pulse =
        1 +
        Math.sin(
          time *
            (active ? 3 : 2)
        ) *
          (active ? 0.07 : 0.04);

      coreRef.current.scale.setScalar(
        pulse
      );
    }

    if (particlesRef.current) {
      particlesRef.current.rotation.y =
        time *
        (active ? 0.12 : 0.06);

      particlesRef.current.rotation.x =
        Math.sin(time * 0.15) * 0.08;
    }
  });

  return (
    <group ref={coreRef}>

      {/* =====================================
          OUTER AI ENERGY SHELL
      ===================================== */}

      <mesh>
        <icosahedronGeometry
          args={[0.72, 3]}
        />

        <meshStandardMaterial
          color="#00e5ff"
          emissive="#00e5ff"
          emissiveIntensity={
            active ? 3 : 2
          }
          wireframe
          transparent
          opacity={0.75}
        />
      </mesh>

      {/* =====================================
          PURPLE ENERGY SHELL
      ===================================== */}

      <mesh
        rotation={[
          0.5,
          0.8,
          0,
        ]}
      >
        <icosahedronGeometry
          args={[0.9, 2]}
        />

        <meshStandardMaterial
          color="#8b5cf6"
          emissive="#8b5cf6"
          emissiveIntensity={
            active ? 2.5 : 1.5
          }
          wireframe
          transparent
          opacity={0.35}
        />
      </mesh>

      {/* =====================================
          INNER AI CORE
      ===================================== */}

      <mesh>
        <sphereGeometry
          args={[0.32, 32, 32]}
        />

        <meshStandardMaterial
          color="#ffffff"
          emissive="#00e5ff"
          emissiveIntensity={
            active ? 7 : 5
          }
          roughness={0.15}
          metalness={0.2}
        />
      </mesh>

      {/* =====================================
          CORE GLOW
      ===================================== */}

      <mesh>
        <sphereGeometry
          args={[0.48, 32, 32]}
        />

        <meshBasicMaterial
          color="#00e5ff"
          transparent
          opacity={active ? 0.12 : 0.08}
        />
      </mesh>

      {/* =====================================
          CYAN ORBIT
      ===================================== */}

      <mesh
        rotation={[
          Math.PI / 2,
          0,
          0,
        ]}
      >
        <torusGeometry
          args={[
            0.85,
            0.012,
            12,
            100,
          ]}
        />

        <meshBasicMaterial
          color="#00e5ff"
          transparent
          opacity={active ? 0.9 : 0.7}
        />
      </mesh>

      {/* =====================================
          PURPLE ORBIT
      ===================================== */}

      <mesh
        rotation={[
          0.8,
          0.3,
          0.4,
        ]}
      >
        <torusGeometry
          args={[
            1.05,
            0.008,
            12,
            100,
          ]}
        />

        <meshBasicMaterial
          color="#8b5cf6"
          transparent
          opacity={active ? 0.7 : 0.5}
        />
      </mesh>

      {/* =====================================
          PARTICLE FIELD
      ===================================== */}

      <points
        ref={particlesRef}
      >
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            args={[
              particlePositions,
              3,
            ]}
          />
        </bufferGeometry>

        <pointsMaterial
          color="#00e5ff"
          size={
            active
              ? 0.045
              : 0.035
          }
          transparent
          opacity={
            active
              ? 0.8
              : 0.6
          }
          sizeAttenuation
          depthWrite={false}
        />
      </points>

    </group>
  );
}