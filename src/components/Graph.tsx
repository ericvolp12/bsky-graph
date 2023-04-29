import React, { FC, useEffect, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import { MultiDirectedGraph } from "graphology";
import { formatDistanceToNow, parseISO } from "date-fns";
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

interface Edge {
  source: string;
  target: string;
  weight: number;
  ogWeight: number;
}

interface Node {
  key: number;
  size: number;
  label: string;
}

interface MootNode {
  node: string;
  label: string;
  weight: number;
}

function constructEdgeMap(graph: MultiDirectedGraph): Map<string, Edge> {
  const edgeMap = new Map<string, Edge>();
  graph?.edges().forEach((edge) => {
    const source = graph?.source(edge);
    const target = graph?.target(edge);
    const weight = graph?.getEdgeAttribute(edge, "weight");
    const ogWeight = graph?.getEdgeAttribute(edge, "ogWeight");
    if (source !== undefined && target !== undefined && weight !== null) {
      edgeMap.set(edge, {
        source: source,
        target: target,
        weight: weight,
        ogWeight: ogWeight,
      });
    }
  });
  return edgeMap;
}

function constructNodeMap(graph: MultiDirectedGraph): Map<string, Node> {
  const nodeMap = new Map<string, Node>();
  graph?.nodes().forEach((node) => {
    const key = graph?.getNodeAttribute(node, "key");
    const size = graph?.getNodeAttribute(node, "size");
    const label = graph?.getNodeAttribute(node, "label");
    if (key !== undefined && size !== undefined && label !== undefined) {
      nodeMap.set(label, {
        key: key,
        size: size,
        label: label,
      });
    }
  });
  return nodeMap;
}

const GraphContainer: React.FC<{}> = () => {
  // Router info
  const [searchParams, setSearchParams] = useSearchParams();

  // Graph raw data
  const [graphDump, setGraphDump] = React.useState<any>(null);

  // Graph stats
  const [userCount, setUserCount] = React.useState<number>(0);
  const [edgeCount, setEdgeCount] = React.useState<number>(0);
  const [totalWeight, setTotalWeight] = React.useState<number>(0);

  // Selected Node properties
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
  const previousSecondDegreeNeighbors: boolean = usePrevious<boolean>(
    showSecondDegreeNeighbors
  );

  // Graph State
  const [graph, setGraph] = React.useState<MultiDirectedGraph | null>(null);
  const [graphShouldUpdate, setGraphShouldUpdate] =
    React.useState<boolean>(true);

  // Moot List State
  const [mootList, setMootList] = React.useState<MootNode[]>([]);
  const [showMootList, setShowMootList] = React.useState<boolean>(true);

  const [edgeMap, setEdgeMap] = React.useState<Map<string, Edge>>(new Map());
  const [nodeMap, setNodeMap] = React.useState<Map<string, Node>>(new Map());

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

        // Construct the edge and node maps
        const newEdgeMap = constructEdgeMap(newGraph);
        const newNodeMap = constructNodeMap(newGraph);
        setEdgeMap(newEdgeMap);
        setNodeMap(newNodeMap);

        setUserCount(newGraph.nodes().length);
        setEdgeCount(newGraph.edges().length);
        setTotalWeight(
          newGraph
            .edges()
            .reduce(
              (acc, edge) => acc + newGraph.getEdgeAttribute(edge, "ogWeight"),
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
        ((selectedNode !== null && selectedNode !== previousSelectedNode) ||
          showSecondDegreeNeighbors !== previousSecondDegreeNeighbors)
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

        // Build the MootList, an ordered list of neighbors by weight
        const mootList: MootNode[] = [];
        neighbors?.forEach((neighbor) => {
          if (neighbor !== selectedNode) {
            const weight = graph?.getEdgeAttribute(
              graph?.edges(selectedNode, neighbor)[0],
              "weight"
            );
            if (weight !== undefined) {
              mootList.push({
                node: neighbor,
                weight: weight,
                label: graph.getNodeAttribute(neighbor, "label"),
              });
            }
          }
        });
        mootList.sort((a, b) => b.weight - a.weight);

        setMootList(mootList);

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
              (acc, edge) => acc + graph.getEdgeAttribute(edge, "ogWeight"),
              0
            ) || 0
        );
        setOutWeight(
          graph
            ?.outEdges(selectedNode)
            .reduce(
              (acc, edge) => acc + graph.getEdgeAttribute(edge, "ogWeight"),
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
    }, [selectedNode, showSecondDegreeNeighbors]);

    useEffect(() => {
      // Register the events
      registerEvents({
        clickNode: (event: any) => {
          const nodeLabel = graph?.getNodeAttribute(event.node, "label");
          let newParams: { s?: string; ml?: string } = {
            s: `${nodeLabel}`,
          };
          if (showMootList) {
            newParams.ml = `${showMootList}`;
          }
          setSearchParams(newParams);
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
          setSearchParams({});
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
    const selectedUserFromParams = searchParams.get("s");
    const showMootListFromParams = searchParams.get("ml");
    if (selectedUserFromParams !== null) {
      const selectedNodeKey = nodeMap.get(selectedUserFromParams)?.key;
      if (selectedNodeKey !== undefined) {
        setSelectedNode(selectedNodeKey.toString());
      }
    } else {
      setSelectedNode(null);
    }
    setShowMootList(showMootListFromParams === "true");
  }, [searchParams, nodeMap]);

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
      {selectedNode !== null && mootList.length > 0 && (
        <div className="overflow-hidden bg-white shadow sm:rounded-md fixed left-1/2 top-5 transform -translate-x-1/2 w-5/6 lg:tall:w-fit lg:tall:left-12 lg:tall:translate-x-0 lg:tall:mt-auto lg:tall-mb:auto">
          <div className="border-b border-gray-200 bg-white px-4 py-5 sm:px-6">
            <div className="-ml-4 -mt-2 flex flex-wrap items-center justify-between sm:flex-nowrap">
              <div className="ml-4 mt-2">
                <h3 className="text-base font-semibold leading-6 text-gray-900">
                  Moot List
                </h3>
              </div>
              <div className="ml-4 mt-2 flex-shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    setShowMootList(!showMootList);
                    let newParams: { s?: string; ml?: string } = {
                      s: `${graph?.getNodeAttribute(selectedNode, "label")}`,
                    };
                    if (!showMootList) {
                      newParams.ml = `${!showMootList}`;
                    }
                    setSearchParams(newParams);
                  }}
                  className={
                    `relative inline-flex items-center rounded-md  px-3 py-2 text-xs font-semibold text-white shadow-sm  focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2` +
                    (showMootList
                      ? " bg-indigo-600 hover:bg-indigo-500 focus-visible:outline-indigo-600"
                      : " bg-green-500 hover:bg-green-600 focus-visible:ring-green-500")
                  }
                >
                  {showMootList ? "Hide" : "Show"}
                </button>
              </div>
            </div>
            <div className="mt-2 max-w-xl text-sm text-gray-500">
              <p>
                These are the top 10 moots that{" "}
                <a
                  className="font-bold underline-offset-1 underline"
                  href={`https://staging.bsky.app/profile/${graph?.getNodeAttribute(
                    selectedNode,
                    "label"
                  )}`}
                  target="_blank"
                >
                  {graph?.getNodeAttribute(selectedNode, "label")}
                </a>{" "}
                has interacted with.
              </p>
            </div>
          </div>
          <ul
            role="list"
            className="divide-y divide-gray-200 max-h-96 md:max-h-screen overflow-scroll"
          >
            {showMootList &&
              mootList.slice(0, 10).map((moot) => (
                <li key={moot.node} className="px-4 py-3 sm:px-6">
                  <div className="flex items-center justify-between">
                    <div className="text-sm font-medium text-gray-900 truncate">
                      <a
                        href={`https://staging.bsky.app/profile/${moot.label}`}
                        target="_blank"
                      >
                        {moot.label}
                      </a>
                    </div>
                    <div className="ml-2 flex-shrink-0 flex">
                      <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                        {moot.weight}
                      </span>
                    </div>
                  </div>
                </li>
              ))}
          </ul>
        </div>
      )}
      <SocialGraph />
      <div className="fixed left-1/2 bottom-8 lg:tall:bottom-20 transform -translate-x-1/2 w-5/6 lg:w-fit">
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
          <div className="px-2 py-2 sm:p-2 w-fit ml-auto mr-auto mt-2 grid grid-flow-row-dense grid-cols-3">
            <div className="col-span-2">
              <CustomSearch
                onLocate={(node) => {
                  const nodeLabel = graph?.getNodeAttribute(node, "label");
                  let newParams: { s?: string; ml?: string } = {
                    s: `${nodeLabel}`,
                  };
                  if (showMootList) {
                    newParams.ml = `${showMootList}`;
                  }
                  setSearchParams(newParams);
                }}
              />
            </div>
            <div className="relative flex gap-x-3 ml-4 mt-auto mb-auto w-full">
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
              <div className="md:text-sm text-xs leading-6">
                <label
                  htmlFor="neighbors"
                  className="font-medium text-gray-900"
                >
                  2°<span className="hidden md:inline"> Neighbors</span>
                  <span className="md:hidden">Neigh...</span>
                </label>
              </div>
            </div>
          </div>
        </div>
      </div>
      <footer className="bg-white fixed bottom-0 text-center w-full">
        <div className="mx-auto max-w-7xl px-2">
          <span className="footer-text text-xs">
            Built by{" "}
            <a
              href="https://staging.bsky.app/profile/jaz.bsky.social"
              target="_blank"
              className="font-bold underline-offset-1 underline"
            >
              jaz
            </a>
            {" 🏳️‍⚧️"}
          </span>
          <span className="footer-text text-xs">
            {" | "}
            {graph
              ? formatDistanceToNow(
                  parseISO(graph?.getAttribute("lastUpdated")),
                  { addSuffix: true }
                )
              : "loading..."}{" "}
            <img src="/update-icon.svg" className="inline-block h-4 w-4" />
            {" | "}
            <a
              href="https://github.com/ericvolp12/bsky-experiments"
              target="_blank"
            >
              <img
                src="/github.svg"
                className="inline-block h-3.5 w-4 mb-0.5"
              />
            </a>
          </span>
        </div>
      </footer>
    </SigmaContainer>
  );
};

export default GraphContainer;
