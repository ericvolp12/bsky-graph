import React, { FC, useEffect } from "react";

import { MultiDirectedGraph } from "graphology";
import getNodeProgramImage from "sigma/rendering/webgl/programs/node.image";
import {
  SigmaContainer,
  useRegisterEvents,
  useLoadGraph,
} from "@react-sigma/core";
import "@react-sigma/core/lib/react-sigma.min.css";

import { CustomSearch } from "./CustomSearch";

const DemoGraph: React.FC<{}> = () => {
  const [graphDump, setGraphDump] = React.useState<any>(null);
  const [userCount, setUserCount] = React.useState<number>(0);
  const [edgeCount, setEdgeCount] = React.useState<number>(0);
  const [totalWeight, setTotalWeight] = React.useState<number>(0);
  const [hoveredNode, setHoveredNode] = React.useState<string | null>(null);

  const SocialGraph: FC = () => {
    const loadGraph = useLoadGraph();
    const registerEvents = useRegisterEvents();
    const [graph, setGraph] = React.useState<MultiDirectedGraph | null>(null);

    useEffect(() => {
      // Create the graph
      const newGraph = new MultiDirectedGraph();
      if (graphDump !== null) {
        newGraph.import(graphDump);
        setUserCount(newGraph.nodes().length);
        setEdgeCount(newGraph.edges().length);
        setTotalWeight(
          newGraph
            .edges()
            .reduce(
              (acc, edge) => acc + newGraph.getEdgeAttribute(edge, "weight"),
              0
            )
        );
        setGraph(newGraph);
        loadGraph(newGraph);
      }
    }, [loadGraph]);

    useEffect(() => {
      // Register the events
      registerEvents({
        enterNode: (event: any) => {
          setHoveredNode(event.node);
        },
        leaveNode: (_: any) => {
          setHoveredNode(null);
        },
      });
    }, [registerEvents, graph]);

    return null;
  };

  async function fetchGraph() {
    const textGraph = await fetch("/exported_graph_minified.json");
    const responseJSON = await textGraph.json();
    setGraphDump(responseJSON);
  }

  useEffect(() => {}, [hoveredNode]);

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
        <div className="bg-white shadow sm:rounded-lg pb-1">
          <dl className="mx-auto grid grid-cols-1 gap-px bg-gray-900/5 sm:grid-cols-2 lg:grid-cols-3">
            <div className="flex flex-wrap items-baseline bg-white text-center">
              <dt className="text-sm font-medium leading-6 text-gray-500 ml-auto mr-auto mt-4">
                Users Represented
              </dt>
              <dd className="w-full flex-none text-3xl font-medium leading-10 tracking-tight text-gray-900">
                {userCount.toLocaleString()}
              </dd>
            </div>
            <div className="flex flex-wrap items-baseline bg-white text-center">
              <dt className="text-sm font-medium leading-6 text-gray-500 ml-auto mr-auto mt-4">
                Connections Represented
              </dt>
              <dd className="w-full flex-none text-3xl font-medium leading-10 tracking-tight text-gray-900">
                {edgeCount.toLocaleString()}
              </dd>
            </div>
            <div className="flex flex-wrap items-baseline bg-white text-center">
              <dt className="text-sm font-medium leading-6 text-gray-500 ml-auto mr-auto mt-4">
                Interactions Represented
              </dt>
              <dd className="w-full flex-none text-3xl font-medium leading-10 tracking-tight text-gray-900">
                {totalWeight.toLocaleString()}
              </dd>
            </div>
          </dl>
          <div className="px-2 py-2 sm:p-2 w-fit ml-auto mr-auto mt-2">
            <CustomSearch style={{ width: "300px" }} />
          </div>
        </div>
      </div>
    </SigmaContainer>
  );
};

export default DemoGraph;
