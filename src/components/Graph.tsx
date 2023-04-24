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
  const [graphDump, setGraphDump] = React.useState<any>(null);

  const SocialGraph: FC = () => {
    const loadGraph = useLoadGraph();
    const registerEvents = useRegisterEvents();
    const [graph, setGraph] = React.useState<MultiDirectedGraph | null>(null);
    const [hoveredNode, setHoveredNode] = React.useState<string | null>(null);

    useEffect(() => {
      // Create the graph
      const newGraph = new MultiDirectedGraph();
      if (graphDump !== null) {
        newGraph.import(graphDump);
        setGraph(newGraph);
        loadGraph(newGraph);
      }
    }, [loadGraph]);

    useEffect(() => {
      // Register the events
      registerEvents({
        enterNode: (event) => {
          // graph?.forEachEdge(event.node, (edge) => {
          //   graph.setEdgeAttribute(edge, "color", "#FF0000");
          // });
        },
        leaveNode: (event) => {},
      });
    }, [registerEvents, graph]);

    return null;
  };

  async function fetchGraph() {
    const textGraph = await fetch("/exported_graph_minified.json");
    const responseJSON = await textGraph.json();
    setGraphDump(responseJSON);
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
        <CustomSearch style={{ width: "300px" }} />
      </div>
    </SigmaContainer>
  );
};

export default DemoGraph;
