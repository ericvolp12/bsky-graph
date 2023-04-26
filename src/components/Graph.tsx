import React, { FC, useEffect, useRef } from "react";

import { MultiDirectedGraph } from "graphology";
import getNodeProgramImage from "sigma/rendering/webgl/programs/node.image";
import {
  SigmaContainer,
  useRegisterEvents,
  useLoadGraph,
  useSigma,
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
  const [selectedNodeCount, setSelectedNodeCount] = React.useState<number>(0);
  const [inWeight, setInWeight] = React.useState<number>(0);
  const [outWeight, setOutWeight] = React.useState<number>(0);
  const [selectedNodeEdges, setSelectedNodeEdges] = React.useState<
    string[] | null
  >(null);
  const [showSecondDegreeNeighbors, setShowSecondDegreeNeighbors] =
    React.useState<boolean>(false);

  const previousSelectedNode: string | null = usePrevious<string | null>(
    selectedNode
  );
  const [graph, setGraph] = React.useState<MultiDirectedGraph | null>(null);
  const [graphShouldUpdate, setGraphShouldUpdate] =
    React.useState<boolean>(true);

  const SocialGraph: FC = () => {
    const loadGraph = useLoadGraph();
    const registerEvents = useRegisterEvents();
    const sigma = useSigma();

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
        // Hide all edges
        graph?.edges().forEach((edge) => {
          graph?.setEdgeAttribute(edge, "hidden", true);
          // Set all edges to a light gray
          graph?.setEdgeAttribute(edge, "color", "#e0e0e0");
        });

        // Hide or fade all nodes
        graph?.nodes().forEach((node) => {
          graph?.setNodeAttribute(node, "highlighted", false);
          if (showSecondDegreeNeighbors) {
            graph?.setNodeAttribute(node, "hidden", true);
          } else {
            graph?.setNodeAttribute(node, "color", "rgba(0,0,0,0.1)");
          }
        });

        // Get all neighbors of selected node
        const neighbors = graph?.neighbors(selectedNode);

        // Re-color all nodes connected to selected node
        graph?.neighbors(selectedNode).forEach((node) => {
          const oldColor = graph.getNodeAttribute(node, "old-color");
          graph?.setNodeAttribute(node, "hidden", false);
          graph?.setNodeAttribute(node, "color", oldColor);
          // Set all 2nd degree neighbors to a light grey
          if (showSecondDegreeNeighbors) {
            graph?.neighbors(node).forEach((neighbor) => {
              if (!neighbors?.includes(neighbor)) {
                graph?.setNodeAttribute(neighbor, "hidden", false);
                graph?.setNodeAttribute(neighbor, "color", "rgba(0,0,0,0.1)");
              }
              // Show 2nd degree neighbor edges
              graph?.edges(node, neighbor).forEach((edge) => {
                graph?.setEdgeAttribute(edge, "hidden", false);
              });
            });
          }
        });

        // Re-show edges connected to selected node
        graph?.inEdges(selectedNode).forEach((edge) => {
          graph?.setEdgeAttribute(edge, "hidden", false);
          // Make in-edges a soft sky-blue
          graph?.setEdgeAttribute(edge, "color", "#4b33ff");
        });

        graph?.outEdges(selectedNode).forEach((edge) => {
          graph?.setEdgeAttribute(edge, "hidden", false);
          // Make out a burnt orange
          graph?.setEdgeAttribute(edge, "color", "#ff5254");
        });

        // Re-color selected node and highlight it
        graph.setNodeAttribute(
          selectedNode,
          "color",
          graph.getNodeAttribute(selectedNode, "old-color")
        );
        graph.setNodeAttribute(selectedNode, "highlighted", true);
        graph.setNodeAttribute(selectedNode, "hidden", false);

        // Update selected node count and weight for display
        setSelectedNodeCount(graph?.neighbors(selectedNode).length || 0);
        setInWeight(
          graph
            ?.inEdges(selectedNode)
            .reduce(
              (acc, edge) => acc + graph.getEdgeAttribute(edge, "weight"),
              0
            ) || 0
        );
        setOutWeight(
          graph
            ?.outEdges(selectedNode)
            .reduce(
              (acc, edge) => acc + graph.getEdgeAttribute(edge, "weight"),
              0
            ) || 0
        );
        setSelectedNodeEdges(graph?.edges(selectedNode) || null);
      } else if (graph !== null && selectedNode === null) {
        graph?.edges().forEach((edge) => {
          graph?.setEdgeAttribute(edge, "hidden", false);
          graph?.setEdgeAttribute(edge, "color", "#e0e0e0");
        });
        graph?.nodes().forEach((node) => {
          const oldColor = graph.getNodeAttribute(node, "old-color");
          graph?.setNodeAttribute(node, "color", oldColor);
          graph?.setNodeAttribute(node, "highlighted", false);
          graph?.setNodeAttribute(node, "hidden", false);
        });
        setSelectedNodeCount(0);
        setSelectedNodeEdges(null);
        setInWeight(0);
        setOutWeight(0);
      }
      sigma.refresh();
    }, [selectedNode]);

    useEffect(() => {
      // Register the events
      registerEvents({
        clickNode: (event: any) => {
          setSelectedNode(event.node);
        },
        doubleClickNode: (event: any) => {
          window.open(
            `https://staging.bsky.app/profile/${graph?.getNodeAttribute(
              event.node,
              "label"
            )}`,
            "_blank"
          );
        },
        clickStage: (_: any) => {
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
      <div className="fixed left-1/2 bottom-5 md:bottom-20 transform -translate-x-1/2">
        <div className="bg-white shadow sm:rounded-lg pb-1">
          <dl className="mx-auto grid gap-px bg-gray-900/5 grid-cols-3">
            <div className="flex flex-col items-baseline bg-white text-center">
              <dt className="text-sm font-medium leading-6 text-gray-500 ml-auto mr-auto mt-4">
                Users{" "}
                <span className="hidden lg:inline-block">Represented</span>
              </dt>
              <dd className="lg:text-3xl mr-auto ml-auto text-lg font-medium leading-10 tracking-tight text-gray-900">
                {selectedNodeCount > 0
                  ? selectedNodeCount.toLocaleString()
                  : userCount.toLocaleString()}
              </dd>
            </div>
            <div className="flex flex-col items-baseline bg-white text-center">
              <dt className="text-sm font-medium leading-6 text-gray-500 ml-auto mr-auto mt-4">
                Connections{" "}
                <span className="hidden lg:inline-block">Represented</span>
              </dt>
              <dd className="lg:text-3xl mr-auto ml-auto text-lg font-medium leading-10 tracking-tight text-gray-900">
                {selectedNodeEdges
                  ? selectedNodeEdges.length.toLocaleString()
                  : edgeCount.toLocaleString()}
              </dd>
            </div>
            <div className="flex flex-col items-baseline bg-white text-center">
              <dt className="text-sm font-medium leading-6 text-gray-500 ml-auto mr-auto mt-4 px-4">
                Interactions{" "}
                <span className="hidden lg:inline-block">Represented</span>
              </dt>
              <dd className="lg:text-3xl mr-auto ml-auto text-lg font-medium leading-10 tracking-tight text-gray-900">
                {inWeight > 0 && outWeight > 0
                  ? `${inWeight.toLocaleString()} / ${outWeight.toLocaleString()}`
                  : totalWeight.toLocaleString()}
              </dd>
            </div>
          </dl>
          <div className="px-2 py-2 sm:p-2 w-fit ml-auto mr-auto mt-2 flex">
            <CustomSearch
              style={{ width: "300px" }}
              onLocate={setSelectedNode}
            />
            <div className="relative flex gap-x-3 ml-4 mt-auto mb-auto">
              <div className="flex h-6 items-center">
                <input
                  id="neighbors"
                  name="neighbors"
                  type="checkbox"
                  className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-600"
                  checked={showSecondDegreeNeighbors}
                  onChange={() =>
                    setShowSecondDegreeNeighbors(!showSecondDegreeNeighbors)
                  }
                />
              </div>
              <div className="text-sm leading-6">
                <label
                  htmlFor="neighbors"
                  className="font-medium text-gray-900"
                >
                  2nd° Neighbors
                </label>
              </div>
            </div>
          </div>
        </div>
      </div>
    </SigmaContainer>
  );
};

export default DemoGraph;
