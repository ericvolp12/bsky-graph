import React, { FC, useEffect } from "react";

import { MultiDirectedGraph } from "graphology";
import getNodeProgramImage from "sigma/rendering/webgl/programs/node.image";
import {
  SigmaContainer,
  useRegisterEvents,
  useLoadGraph,
} from "@react-sigma/core";
import "@react-sigma/core/lib/react-sigma.min.css";
import forceAtlas2 from "graphology-layout-forceatlas2";
import circular from "graphology-layout/circular";
import { CustomSearch } from "./CustomSearch";

interface Edge {
  source: string;
  target: string;
  weight: number;
}

interface Node {
  did: string;
  handle: string;
}

interface TempNode {
  key: number;
  did: string;
  label: string;
}

const DemoGraph: React.FC<{}> = () => {
  const [nodes, setNodes] = React.useState<Node[]>([]);
  const [edges, setEdges] = React.useState<Edge[]>([]);

  const SocialGraph: FC = () => {
    const loadGraph = useLoadGraph();
    const registerEvents = useRegisterEvents();
    const [graph, setGraph] = React.useState<MultiDirectedGraph | null>(null);
    const [hoveredNode, setHoveredNode] = React.useState<string | null>(null);

    useEffect(() => {
      if (edges.length > 0 && nodes.length > 0 && graph === null) {
        // Create the graph
        const newGraph = new MultiDirectedGraph();
        const totalEdges = edges.length;
        const totalNodes = nodes.length;
        const tempNodes: TempNode[] = [];

        for (let i = 0; i < totalNodes; i++) {
          if (i % 100 === 0) {
            console.log(`Adding node ${i} of ${totalNodes - 1}`);
          }
          const node = nodes[i];
          const tempNode = {
            key: i,
            did: node.did,
            label: node.handle,
          };
          const slimNode = {
            key: i,
            label: node.handle,
          };
          newGraph.addNode(i, slimNode);
          tempNodes.push(tempNode);
        }

        // First, find the minimum and maximum weights in the graph
        let minWeight = Infinity;
        let maxWeight = -Infinity;

        for (let i = 0; i < totalEdges; i++) {
          const edge = edges[i];
          minWeight = Math.min(minWeight, edge.weight);
          maxWeight = Math.max(maxWeight, edge.weight);
        }

        // Then, set the size of each edge based on its weight relative to the min and max weights
        for (let i = 0; i < totalEdges; i++) {
          if (i % 100 === 0) {
            console.log(`Adding edge ${i} of ${totalEdges - 1}`);
          }
          const edge = edges[i];

          // Calculate the size based on the logarithm of the edge weight relative to the range of weights
          const size =
            0.2 +
            ((Math.log(edge.weight) - Math.log(minWeight)) /
              (Math.log(maxWeight) - Math.log(minWeight))) *
              (6 - 0.2);

          newGraph.addEdge(
            tempNodes.find((node) => node.did === edge.source)?.key,
            tempNodes.find((node) => node.did === edge.target)?.key,
            {
              weight: edge.weight,
              size: parseFloat(size.toFixed(2)),
            }
          );
        }

        const degrees = newGraph.nodes().map((node) => newGraph.degree(node));
        const minDegree = Math.min(...degrees);
        const maxDegree = Math.max(...degrees);
        const skyBluePalette = [
          "#009ACD", // DeepSkyBlue3
          "#5B9BD5", // CornflowerBlue
          "#7EC0EE", // SkyBlue2
          "#87CEFA", // LightSkyBlue1
          "#4A708B", // SkyBlue4
          "#1E90FF", // DodgerBlue
          "#00BFFF", // DeepSkyBlue
          "#3CB371", // MediumSeaGreen
          "#FF7F50", // Coral
          "#FF4500", // OrangeRed
        ];
        const minSize = 1.5,
          maxSize = 15;
        console.log("Assigning attributes...");
        newGraph.forEachNode((node) => {
          const degree = newGraph.inDegreeWithoutSelfLoops(node);
          // Set the size based on the degree of the node relative to the min and max degrees
          let newNodeSize =
            minSize +
            Math.sqrt((degree - minDegree) / (maxDegree - minDegree)) *
              (maxSize - minSize);

          // Calculate the radius of the circle based on the size
          let radius = newNodeSize / 2;

          // Calculate the area of the circle based on the radius
          let area = Math.PI * radius * radius;

          // Round to 2 decimal places to conserve bits in the exported graph
          if (newNodeSize > 1) {
            newNodeSize = parseFloat(newNodeSize.toFixed(2));
            area = parseFloat(area.toFixed(2));
          }
          newGraph.setNodeAttribute(node, "size", newNodeSize);
          newGraph.setNodeAttribute(node, "area", area);
          // Set a random color
          newGraph.setNodeAttribute(
            node,
            "color",
            skyBluePalette[Math.floor(Math.random() * 10)]
          );
        });

        console.log("Assigning layout...");
        circular.assign(newGraph);
        const settings = forceAtlas2.inferSettings(newGraph);
        console.log("Running Force Atlas...");
        forceAtlas2.assign(newGraph, { settings, iterations: 600 });
        console.log("Done running Force Atlas");
        // Reduce precision on node x and y coordinates to conserve bits in the exported graph
        newGraph.forEachNode((node) => {
          const x = newGraph.getNodeAttribute(node, "x");
          const y = newGraph.getNodeAttribute(node, "y");
          newGraph.setNodeAttribute(node, "x", parseFloat(x.toFixed(3)));
          newGraph.setNodeAttribute(node, "y", parseFloat(y.toFixed(3)));
        });

        console.log(newGraph.export());
        setGraph(newGraph);
        loadGraph(newGraph);
      }
    }, []);

    return null;
  };

  async function fetchGraph() {
    const textGraph = await fetch("/social_graph.txt");
    const responseText = await textGraph.text();
    const lines = responseText.split("\n").filter((line) => line.trim() !== "");

    const newNodes: Node[] = [];
    const newEdges: Edge[] = [];

    lines.forEach((line, index) => {
      const [source, sourceHandle, target, targetHandle, weight] =
        line.split(" ");

      const sourceNode = { did: source, handle: sourceHandle };
      if (!newNodes.find((node) => node.did === source)) {
        newNodes.push(sourceNode);
      }

      const targetNode = { did: target, handle: targetHandle };
      if (!newNodes.find((node) => node.did === target)) {
        newNodes.push(targetNode);
      }

      newEdges.push({
        source,
        target,
        weight: parseInt(weight),
      });
    });

    setNodes(newNodes);
    setEdges(newEdges);
  }

  useEffect(() => {
    fetchGraph();
  }, []);

  return (
    <SigmaContainer
      graph={MultiDirectedGraph}
      style={{ height: "100vh" }}
      settings={{
        nodeProgramClasses: { image: getNodeProgramImage() },
        defaultNodeType: "image",
        defaultEdgeType: "arrow",
        labelDensity: 0.07,
        labelGridCellSize: 60,
        labelRenderedSizeThreshold: 5,
        labelFont: "Lato, sans-serif",
        zIndex: true,
      }}
    >
      <SocialGraph />
    </SigmaContainer>
  );
};

export default DemoGraph;
