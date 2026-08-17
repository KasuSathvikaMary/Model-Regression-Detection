import { Line } from "@react-three/drei";
import { useMemo } from "react";
import NeuralNode, {
  type NodeData,
} from "./NeuralNode";

type NeuralNetworkProps = {
  analysisRunning?: boolean;
  selectedNodeId?: number | null;
  onSelectNode?: (node: NodeData) => void;
};

type Connection = {
  from: number;
  to: number;
  start: [number, number, number];
  end: [number, number, number];
};

type ConnectionProps = {
  start: [number, number, number];
  end: [number, number, number];
  active: boolean;
};

function NeuralConnection({
  start,
  end,
  active,
}: ConnectionProps) {
  const points = useMemo(
    () => [start, end] as [
      [number, number, number],
      [number, number, number]
    ],
    [start, end]
  );

  return (
    <Line
      points={points}
      color={
        active
          ? "#00f6ff"
          : "#496b86"
      }
      transparent
      opacity={
        active
          ? 0.95
          : 0.18
      }
      lineWidth={
        active
          ? 2.2
          : 0.7
      }
    />
  );
}

export default function NeuralNetwork({
  analysisRunning = false,
  selectedNodeId = null,
  onSelectNode,
}: NeuralNetworkProps) {
  /*
   * ---------------------------------------------------
   * NODE DATA
   * ---------------------------------------------------
   */

  const nodes = useMemo<NodeData[]>(() => {
    const result: NodeData[] = [];

    const layers = [
      {
        layer: 0,
        layerName: "INPUT",
        nodeNames: [
          "Geometry",
          "Topology",
          "Dimensions",
        ],
      },
      {
        layer: 1,
        layerName: "FEATURES",
        nodeNames: [
          "Shape",
          "Surface",
          "Volume",
          "Edges",
        ],
      },
      {
        layer: 2,
        layerName: "ANALYSIS",
        nodeNames: [
          "Pattern",
          "Deviation",
          "Similarity",
          "Drift",
        ],
      },
      {
        layer: 3,
        layerName: "OUTPUT",
        nodeNames: [
          "Health",
          "Warning",
          "Regression",
        ],
      },
    ];

    const xPositions = [
      -4.2,
      -1.4,
      1.4,
      4.2,
    ];

    let id = 1;

    layers.forEach((layerInfo) => {
      const count =
        layerInfo.nodeNames.length;

      layerInfo.nodeNames.forEach(
        (nodeName, index) => {
          const verticalSpacing = 1.15;

          const y =
            (index -
              (count - 1) / 2) *
            verticalSpacing;

          let status: NodeData["status"] =
            "HEALTHY";

          if (
            layerInfo.layer === 3 &&
            nodeName === "Warning"
          ) {
            status = "WARNING";
          }

          if (
            layerInfo.layer === 3 &&
            nodeName === "Regression"
          ) {
            status =
              "REGRESSION";
          }

          /*
           * Deterministic values.
           * No Math.random(), so React purity
           * linting will not complain.
           */
          const activation =
            0.58 +
            ((id * 17) % 35) /
              100;

          const drift =
            ((id * 13) % 15) / 100;

          const performance =
            0.78 +
            ((id * 11) % 20) /
              100;

          result.push({
            id,
            layer:
              layerInfo.layer,
            layerName:
              layerInfo.layerName,
            nodeName,
            position: [
              xPositions[
                layerInfo.layer
              ],
              y,
              0,
            ],
            activation:
              Number(
                activation.toFixed(2)
              ),
            drift:
              Number(
                drift.toFixed(2)
              ),
            performance:
              Number(
                performance.toFixed(2)
              ),
            status,
          });

          id++;
        }
      );
    });

    return result;
  }, []);

  /*
   * ---------------------------------------------------
   * CONNECTIONS
   * ---------------------------------------------------
   */

  const connections =
    useMemo<Connection[]>(() => {
      const result: Connection[] =
        [];

      for (
        let layer = 0;
        layer < 3;
        layer++
      ) {
        const currentNodes =
          nodes.filter(
            (node) =>
              node.layer === layer
          );

        const nextNodes =
          nodes.filter(
            (node) =>
              node.layer ===
              layer + 1
          );

        currentNodes.forEach(
          (currentNode) => {
            nextNodes.forEach(
              (nextNode) => {
                result.push({
                  from:
                    currentNode.id,
                  to:
                    nextNode.id,
                  start:
                    currentNode.position,
                  end:
                    nextNode.position,
                });
              }
            );
          }
        );
      }

      return result;
    }, [nodes]);

  /*
   * ---------------------------------------------------
   * SELECTED NODE
   * ---------------------------------------------------
   */

  const selectedNode =
    nodes.find(
      (node) =>
        node.id ===
        selectedNodeId
    );

  /*
   * ---------------------------------------------------
   * RENDER
   * ---------------------------------------------------
   */

  return (
    <group>
      {/* CONNECTIONS */}

      {connections.map(
        (connection, index) => {
          const active =
            analysisRunning ||
            (selectedNodeId !==
              null &&
              selectedNodeId !==
                undefined &&
              (
                connection.from ===
                  selectedNodeId ||
                connection.to ===
                  selectedNodeId
              ));

          return (
            <NeuralConnection
              key={`connection-${index}`}
              start={
                connection.start
              }
              end={
                connection.end
              }
              active={active}
            />
          );
        }
      )}

      {/* NODES */}

      {nodes.map((node) => {
        const connected =
          selectedNodeId !==
            null &&
          selectedNodeId !==
            undefined &&
          selectedNode !==
            undefined &&
          node.id !==
            selectedNodeId &&
          Math.abs(
            node.layer -
              selectedNode.layer
          ) === 1;

        return (
          <NeuralNode
            key={node.id}
            node={node}
            selected={
              node.id ===
              selectedNodeId
            }
            connected={
              connected
            }
            analysisRunning={
              analysisRunning
            }
            onSelect={(selected) => {
              console.log(
                "NeuralNetwork selected:",
                selected
              );

              onSelectNode?.(
                selected
              );
            }}
          />
        );
      })}
    </group>
  );
}