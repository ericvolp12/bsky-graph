import React, { FC, useEffect, useRef } from "react";

import { MultiDirectedGraph } from "graphology";
import getNodeProgramImage from "sigma/rendering/webgl/programs/node.image";
import {
  SigmaContainer,
  useRegisterEvents,
  useLoadGraph,
} from "@react-sigma/core";
import "@react-sigma/core/lib/react-sigma.min.css";

import { CustomSearch } from "./CustomSearch";

// Hook
function usePrevious<T>(value: T): T {
  // The ref object is a generic container whose current property is mutable ...
  // ... and can hold any value, similar to an instance property on a class
  const ref: any = useRef<T>();
  // Store current value in ref
  useEffect(() => {
    ref.current = value;
  }, [value]); // Only re-run if value changes
  // Return previous value (happens before update in useEffect above)
  return ref.current;
}

const DemoGraph: React.FC<{}> = () => {
  const [graphDump, setGraphDump] = React.useState<any>(null);
  const [userCount, setUserCount] = React.useState<number>(0);
  const [edgeCount, setEdgeCount] = React.useState<number>(0);
  const [totalWeight, setTotalWeight] = React.useState<number>(0);
  const [selectedNode, setSelectedNode] = React.useState<string | null>(null);
  const previousSelectedNode: string | null = usePrevious<string | null>(
    selectedNode
  );
  const [graph, setGraph] = React.useState<MultiDirectedGraph | null>(null);
  const [graphShouldUpdate, setGraphShouldUpdate] =
    React.useState<boolean>(true);

  const SocialGraph: FC = () => {
    const loadGraph = useLoadGraph();
    const registerEvents = useRegisterEvents();

    useEffect(() => {
      // Create the graph
      const newGraph = new MultiDirectedGraph();
      if (graphDump !== null && (graph === null || graphShouldUpdate)) {
        setGraphShouldUpdate(false);
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
        newGraph?.nodes().forEach((node) => {
          newGraph?.setNodeAttribute(
            node,
            "old-color",
            newGraph.getNodeAttribute(node, "color")
          );
        });
        setGraph(newGraph);
        loadGraph(newGraph);
      }
    }, [loadGraph]);

    // Select Node Effect
    useEffect(() => {
      if (
        graph !== null &&
        selectedNode !== null &&
        selectedNode !== previousSelectedNode
      ) {
        graph?.edges().forEach((edge) => {
          graph?.setEdgeAttribute(edge, "hidden", true);
        });
        graph?.edges(selectedNode).forEach((edge) => {
          graph?.setEdgeAttribute(edge, "hidden", false);
        });

        graph?.nodes().forEach((node) => {
          graph?.setNodeAttribute(node, "color", "rgba(0, 0, 0, 0.1)");
        });

        graph.setNodeAttribute(
          selectedNode,
          "color",
          graph.getNodeAttribute(selectedNode, "old-color")
        );

        graph?.neighbors(selectedNode).forEach((node) => {
          const oldColor = graph.getNodeAttribute(node, "old-color");
          graph?.setNodeAttribute(node, "color", oldColor);
        });

        console.log(
          `Selected node: ${selectedNode}, previous: ${previousSelectedNode}`
        );
      } else if (graph !== null && selectedNode === null) {
        graph?.edges().forEach((edge) => {
          graph?.setEdgeAttribute(edge, "hidden", false);
        });
        graph?.nodes().forEach((node) => {
          const oldColor = graph.getNodeAttribute(node, "old-color");
          graph?.setNodeAttribute(node, "color", oldColor);
        });
      }
    }, [selectedNode]);

    useEffect(() => {
      // Register the events
      registerEvents({
        clickNode: (event: any) => {
          setSelectedNode(event.node);
        },
        clickStage: (event: any) => {
          setSelectedNode(null);
        },
      });
    }, [registerEvents]);

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
