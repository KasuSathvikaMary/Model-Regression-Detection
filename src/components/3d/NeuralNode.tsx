import { useFrame } from "@react-three/fiber";
import { useRef, useState } from "react";
import * as THREE from "three";

export type NodeStatus =
  | "HEALTHY"
  | "WARNING"
  | "REGRESSION";

export type NodeData = {
  id: number;
  layer: number;
  layerName: string;
  nodeName: string;
  position: [number, number, number];
  activation: number;
  drift: number;
  performance: number;
  status: NodeStatus;
};

type NeuralNodeProps = {
  node: NodeData;
  selected: boolean;
  connected: boolean;
  analysisRunning: boolean;
  onSelect: (node: NodeData) => void;
};

export default function NeuralNode({
  node,
  selected,
  connected,
  analysisRunning,
  onSelect,
}: NeuralNodeProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const [hovered, setHovered] = useState(false);

  useFrame((state) => {
    if (!meshRef.current) return;

    const time = state.clock.elapsedTime;

    const pulse =
      Math.sin(time * 3 + node.id) * 0.08;

    let scale = 1 + pulse;

    if (connected) {
      scale =
        1.2 +
        Math.sin(time * 5) * 0.08;
    }

    if (hovered) {
      scale = 1.35;
    }

    if (selected) {
      scale =
        1.6 +
        Math.sin(time * 7) * 0.1;
    }

    meshRef.current.scale.setScalar(scale);

    meshRef.current.rotation.y =
      time * 0.5;
  });

  let color = "#22d3ee";

  if (node.status === "WARNING") {
    color = "#facc15";
  }

  if (node.status === "REGRESSION") {
    color = "#fb7185";
  }

  if (selected) {
    color = "#ffffff";
  }

  return (
    <group position={node.position}>
      {(selected ||
        connected ||
        analysisRunning) && (
        <mesh>
          <sphereGeometry
            args={[
              selected
                ? 0.34
                : 0.27,
              16,
              16,
            ]}
          />

          <meshBasicMaterial
            color={color}
            transparent
            opacity={
              selected
                ? 0.18
                : 0.08
            }
          />
        </mesh>
      )}

      <mesh
        ref={meshRef}
        onClick={(event) => {
          event.stopPropagation();

          console.log(
            "NODE CLICKED:",
            node.id,
            node.nodeName
          );

          onSelect(node);
        }}
        onPointerDown={(event) => {
          event.stopPropagation();
        }}
        onPointerOver={(event) => {
          event.stopPropagation();

          setHovered(true);
          document.body.style.cursor =
            "pointer";
        }}
        onPointerOut={() => {
          setHovered(false);
          document.body.style.cursor =
            "default";
        }}
      >
        <sphereGeometry
          args={[0.18, 32, 32]}
        />

        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={
            selected
              ? 8
              : connected
                ? 5
                : hovered
                  ? 4
                  : 2
          }
          metalness={0.2}
          roughness={0.25}
        />
      </mesh>
    </group>
  );
}