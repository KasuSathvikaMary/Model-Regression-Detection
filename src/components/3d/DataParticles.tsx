import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";

type DataParticlesProps = {
  running?: boolean;
};

type Particle = {
  start: THREE.Vector3;
  end: THREE.Vector3;
  speed: number;
  offset: number;
};

export default function DataParticles({
  running = true,
}: DataParticlesProps) {
  const groupRef = useRef<THREE.Group>(null);

  /*
   * Fixed particle configuration.
   *
   * We intentionally avoid Math.random() here because
   * React's purity rules don't allow impure functions
   * during render.
   */
  const particles = useMemo<Particle[]>(() => {
    const result: Particle[] = [];

    const layers = [
      -2.8,
      -1.2,
      0.4,
      2.0,
    ];

    const offsets = [
      0.05,
      0.18,
      0.32,
      0.47,
      0.63,
      0.78,
      0.91,
    ];

    const speeds = [
      0.18,
      0.22,
      0.26,
      0.30,
      0.34,
      0.20,
      0.28,
    ];

    for (
      let layer = 0;
      layer < layers.length - 1;
      layer++
    ) {
      for (let i = 0; i < 5; i++) {
        const startY =
          -1.8 + i * 0.9;

        const endY =
          -1.8 +
          ((i + layer) % 5) *
            0.9;

        const start =
          new THREE.Vector3(
            layers[layer],
            startY,
            0
          );

        const end =
          new THREE.Vector3(
            layers[layer + 1],
            endY,
            0
          );

        result.push({
          start,
          end,
          speed:
            speeds[
              (i + layer) %
                speeds.length
            ],
          offset:
            offsets[
              (i + layer * 2) %
                offsets.length
            ],
        });
      }
    }

    return result;
  }, []);

  /*
   * Create the particle meshes once.
   */
  const particleMeshes = useMemo(() => {
    return particles.map(() => {
      const geometry =
        new THREE.SphereGeometry(
          0.045,
          8,
          8
        );

      const material =
        new THREE.MeshBasicMaterial({
          color: "#00e5ff",
        });

      return new THREE.Mesh(
        geometry,
        material
      );
    });
  }, [particles]);

  /*
   * Animate particles.
   */
  useFrame((state) => {
    if (!groupRef.current) {
      return;
    }

    const elapsed =
      state.clock.elapsedTime;

    particleMeshes.forEach(
      (mesh, index) => {
        const particle =
          particles[index];

        if (!running) {
          mesh.visible = false;
          return;
        }

        mesh.visible = true;

        const progress =
          (elapsed *
            particle.speed +
            particle.offset) %
          1;

        mesh.position.lerpVectors(
          particle.start,
          particle.end,
          progress
        );

        /*
         * Small pulsing effect.
         */
        const pulse =
          0.8 +
          Math.sin(
            elapsed * 8 + index
          ) *
            0.2;

        mesh.scale.setScalar(
          pulse
        );
      }
    );
  });

  return (
    <group ref={groupRef}>
      {particleMeshes.map(
        (mesh, index) => (
          <primitive
            key={index}
            object={mesh}
          />
        )
      )}
    </group>
  );
}