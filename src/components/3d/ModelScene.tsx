import { Canvas } from "@react-three/fiber";
import { OrbitControls, Stars } from "@react-three/drei";
import NeuralNetwork from "./NeuralNetwork";
import type { NodeData } from "./NeuralNode";

export type ModelSceneProps = {
  running?: boolean;
  selectedNodeId?: number | null;
  onSelectNode?: (node: NodeData) => void;
};

export default function ModelScene({
  running = false,
  selectedNodeId = null,
  onSelectNode,
}: ModelSceneProps) {
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        position: "relative",
      }}
    >
      <Canvas
        camera={{
          position: [0, 0, 12],
          fov: 50,
        }}
        dpr={[1, 2]}
        gl={{
          antialias: true,
          alpha: true,
        }}
      >
        {/* Lighting */}
        <ambientLight intensity={1.2} />

        <pointLight
          position={[5, 5, 8]}
          intensity={25}
          color="#00e5ff"
        />

        <pointLight
          position={[-5, -3, 5]}
          intensity={20}
          color="#8b5cf6"
        />

        <pointLight
          position={[0, 0, 3]}
          intensity={15}
          color="#ff2bd6"
        />

        {/* Background stars */}
        <Stars
          radius={60}
          depth={35}
          count={1800}
          factor={2}
          saturation={0}
          fade
          speed={running ? 1.5 : 0.4}
        />

        {/* Neural Network */}
        <NeuralNetwork
          analysisRunning={running}
          selectedNodeId={selectedNodeId}
          onSelectNode={onSelectNode}
        />

        {/* Controls */}
        <OrbitControls
          enableZoom
          enablePan={false}
          autoRotate
          autoRotateSpeed={
            running ? 1.2 : 0.35
          }
          minDistance={7}
          maxDistance={18}
        />
      </Canvas>
    </div>
  );
}