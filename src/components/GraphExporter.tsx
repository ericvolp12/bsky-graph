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

const DemoGraph: React.FC<{}> = () => {
  const [nodes, setNodes] = React.useState<string[]>([]);
  const [edges, setEdges] = React.useState<Edge[]>([]);

  const SocialGraph: FC = () => {
    const loadGraph = useLoadGraph();
    const registerEvents = useRegisterEvents();
    const [graph, setGraph] = React.useState<MultiDirectedGraph | null>(null);
    const [hoveredNode, setHoveredNode] = React.useState<string | null>(null);

    useEffect(() => {
      // Create the graph
      const newGraph = new MultiDirectedGraph();
      const totalEdges = edges.length;
      const totalNodes = nodes.length;

      for (let i = 0; i < totalNodes; i++) {
        if (i % 100 === 0) {
          console.log(`Adding node ${i} of ${totalNodes - 1}`);
        }
        const node = nodes[i];
        newGraph.addNode(node, {
          key: node,
          label: node,
        });
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

        // Calculate the size based on the edge weight relative to the range of weights
        const size =
          1 + ((edge.weight - minWeight) / (maxWeight - minWeight)) * (10 - 1);

        newGraph.addEdge(edge.source, edge.target, {
          weight: edge.weight,
          size: size,
        });
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
      const minSize = 2,
        maxSize = 15;
      console.log("Assigning attributes...");
      newGraph.forEachNode((node) => {
        const degree = newGraph.degree(node);
        newGraph.setNodeAttribute(
          node,
          "size",
          minSize +
            ((degree - minDegree) / (maxDegree - minDegree)) *
              (maxSize - minSize)
        );
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
      console.log(newGraph.export());
      setGraph(newGraph);
      loadGraph(newGraph);
    }, [loadGraph]);

    useEffect(() => {
      // Register the events
      registerEvents({
        enterNode: (event) => {
          graph?.forEachEdge(event.node, (edge) => {
            graph.setEdgeAttribute(edge, "color", "#FF0000");
          });
        },
        leaveNode: (event) => {},
      });
    }, [registerEvents, graph]);

    return null;
  };

  async function fetchGraph() {
    const textGraph = await fetch("/social_graph.txt");
    const responseText = await textGraph.text();
    const lines = responseText.split("\n").filter((line) => line.trim() !== "");

    const newNodes: string[] = [];
    const newEdges: Edge[] = [];

    lines.forEach((line, index) => {
      const [source, target, weight] = line.split(" ");
      if (!newNodes.includes(source)) {
        newNodes.push(source);
      }
      if (!newNodes.includes(target)) {
        newNodes.push(target);
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
      <div className="fixed left-1/2 bottom-40 transform -translate-x-1/2">
        <CustomSearch style={{ width: "200px" }} />
      </div>
    </SigmaContainer>
  );
};

export default DemoGraph;
