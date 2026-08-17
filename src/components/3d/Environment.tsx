import { Stars } from "@react-three/drei";

export default function Environment() {
  return (
    <>
      {/* Ambient lighting */}
      <ambientLight intensity={0.35} />

      {/* Cyan key light */}
      <pointLight
        position={[4, 5, 6]}
        intensity={25}
        distance={20}
        color="#00e5ff"
      />

      {/* Purple secondary light */}
      <pointLight
        position={[-5, -3, 4]}
        intensity={20}
        distance={18}
        color="#8b5cf6"
      />

      {/* Background stars */}
      <Stars
        radius={70}
        depth={45}
        count={2500}
        factor={2.2}
        saturation={0}
        fade
        speed={0.7}
      />
    </>
  );
}