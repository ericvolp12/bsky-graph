import React, { FC, useEffect, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import { MultiDirectedGraph } from "graphology";
import { formatDistanceToNow, parseISO } from "date-fns";
import getNodeProgramImage from "sigma/rendering/webgl/programs/node.image";
import {
  SigmaContainer,
  useRegisterEvents,
  useLoadGraph,
  useSigmaContext,
} from "@react-sigma/core";
import "@react-sigma/core/lib/react-sigma.min.css";

import { CustomSearch } from "../CustomSearch";
import iwanthue from "iwanthue";
import circular from "graphology-layout/circular";
import forceAtlas2 from "graphology-layout-forceatlas2";

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
}

interface Node {
  key: number;
  size: number;
  label: string;
}

interface ThreadItem {
  id: string;
  key: string;
  text: string;
  parent_post_id: string | null;
  root_post_id: string | null;
  author_did: string;
  handle: string;
  created_at: string;
  has_embedded_media: boolean;
  depth: number;
}

function constructNodeMap(graph: MultiDirectedGraph): Map<string, Node> {
  const nodeMap = new Map<string, Node>();
  graph?.forEachNode((_, attrs) => {
    nodeMap.set(attrs.label, {
      key: attrs.key,
      size: attrs.size,
      label: attrs.label,
    });
  });
  return nodeMap;
}

const TreeVisContainer: React.FC<{}> = () => {
  // Router info
  const [searchParams, setSearchParams] = useSearchParams();

  // Graph raw data
  const [graphDump, setGraphDump] = React.useState<MultiDirectedGraph | null>(
    null
  );

  // Graph stats
  const [postCount, setPostCount] = React.useState<number>(0);
  const [userCount, setUserCount] = React.useState<number>(0);

  // Selected Node properties
  const [selectedNode, setSelectedNode] = React.useState<string | null>(null);
  const [selectedNodeCount, setSelectedNodeCount] = React.useState<number>(-1);
  const [selectedNodeEdges, setSelectedNodeEdges] = React.useState<
    string[] | null
  >(null);

  const previousSelectedNode: string | null = usePrevious<string | null>(
    selectedNode
  );

  // Graph State
  const [graph, setGraph] = React.useState<MultiDirectedGraph | null>(null);
  const [graphShouldUpdate, setGraphShouldUpdate] =
    React.useState<boolean>(true);
  const [nodeMap, setNodeMap] = React.useState<Map<string, Node>>(new Map());

  const ThreadTree: React.FC = () => {
    const loadGraph = useLoadGraph();
    const registerEvents = useRegisterEvents();
    const { sigma, container } = useSigmaContext();

    useEffect(() => {
      // Create the graph
      let newGraph = new MultiDirectedGraph();
      if (graphDump !== null && (graph === null || graphShouldUpdate)) {
        setGraphShouldUpdate(false);
        newGraph = graphDump;

        // Construct the edge and node maps
        const newNodeMap = constructNodeMap(newGraph);
        setNodeMap(newNodeMap);

        const palette = iwanthue(10, {
          seed: "bskyThreadTree",
          colorSpace: "intense",
          clustering: "force-vector",
        });

        // Set the color of each node to the color of its cluster
        newGraph?.updateEachNodeAttributes((_, attr) => {
          attr.color = palette[Math.floor(Math.random() * 10)];
          return attr;
        });

        setPostCount(newGraph.order);
        setUserCount(newGraph.size);

        newGraph?.forEachNode((_, attr) => {
          attr["old-color"] = attr.color;
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
        graph?.updateEachNodeAttributes((_, attrs) => {
          attrs.highlighted = false;
          attrs.hidden = false;
          attrs.color = "rgba(0,0,0,0.1)";

          return attrs;
        });

        // Re-color all nodes connected to selected node
        graph?.forEachNeighbor(selectedNode, (_, attrs) => {
          attrs.hidden = false;
          attrs.color = attrs["old-color"];
        });

        graph?.forEachEdge(selectedNode, (_, attrs) => {
          attrs.hidden = false;
          attrs.color = "#ff5254";
        });

        // Re-color selected node and highlight it
        graph?.updateNodeAttributes(selectedNode, (attrs) => {
          attrs.color = attrs["old-color"];
          attrs.highlighted = true;
          attrs.hidden = false;
          return attrs;
        });

        // Update selected node count and weight for display
        setSelectedNodeCount(graph?.degree(selectedNode) || 0);
        setSelectedNodeEdges(graph?.edges(selectedNode) || null);
        sigma.refresh();
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
        setSelectedNodeCount(-1);
        setSelectedNodeEdges(null);
        sigma.refresh();
      }
    }, [selectedNode]);

    useEffect(() => {
      // Register the events
      registerEvents({
        clickNode: (event: any) => {
          const nodeLabel = graph?.getNodeAttribute(event.node, "label");
          let newParams: { s?: string; ml?: string } = {
            s: `${nodeLabel}`,
          };
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
        afterRender: () => {},
        clickStage: (_: any) => {
          setSearchParams({});
        },
      });
    }, [registerEvents]);

    return null;
  };

  async function fetchGraph() {
    const textGraph = await fetch("/goosethread.json");
    const responseJSON = await textGraph.json();
    const nodesMap: Map<string, ThreadItem> = new Map();
    const edges: Edge[] = [];

    responseJSON.forEach((post: ThreadItem) => {
      if (!nodesMap.has(post.id)) {
        nodesMap.set(post.id, {
          ...post,
          key: post.id,
        });
      }

      edges.push({
        source: post.id,
        target: post.parent_post_id || "root",
      });
    });

    // Sort the nodes by did so that the order is consistent
    const nodes: ThreadItem[] = Array.from(nodesMap.values()).sort((a, b) => {
      if (a.id < b.id) {
        return -1;
      } else if (a.id > b.id) {
        return 1;
      } else {
        return 0;
      }
    });

    const graph = new MultiDirectedGraph();
    const totalEdges = edges.length;
    const totalNodes = nodes.length;

    const maxDepth = Math.max(...nodes.map((node) => node.depth));
    const maxSize = 5;
    const minSize = 1;

    console.log("Adding nodes...");
    for (let i = 0; i < totalNodes; i++) {
      const node = nodes[i];
      // Split node text on a newline every 30 characters
      graph.addNode(node.id, {
        ...node,
        size:
          minSize +
          (maxSize - minSize) * ((maxDepth - node.depth + 1) / maxDepth),
        label: node.text,
      });
    }

    console.log("Adding edges...");
    for (let i = 0; i < totalEdges; i++) {
      const edge = edges[i];
      if (edge.target === "root") {
        continue;
      }
      graph.addEdge(edge.source, edge.target);
    }

    circular.assign(graph);
    const settings = forceAtlas2.inferSettings(graph);
    const iterationCount = 600;
    console.log(`Running ${iterationCount} Force Atlas simulations...`);
    forceAtlas2.assign(graph, { settings, iterations: iterationCount });
    console.log("Done running Force Atlas");

    graph.setAttribute("lastUpdated", new Date().toISOString());

    setGraphDump(graph);
  }

  useEffect(() => {
    const selectedUserFromParams = searchParams.get("s");
    if (selectedUserFromParams !== null) {
      const selectedNodeKey = nodeMap.get(selectedUserFromParams)?.key;
      if (selectedNodeKey !== undefined) {
        setSelectedNode(selectedNodeKey.toString());
      }
    } else {
      setSelectedNode(null);
    }
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
        labelDensity: 0.2,
        labelGridCellSize: 60,
        labelRenderedSizeThreshold: 1,
        labelFont: "Lato, sans-serif",
        zIndex: true,
      }}
    >
      <ThreadTree />

      <div className="left-1/2 bottom-8 lg:tall:bottom-20 transform -translate-x-1/2 w-5/6 lg:w-fit z-50 absolute">
        <div className="bg-white shadow sm:rounded-lg pb-1">
          <dl className="mx-auto grid gap-px bg-gray-900/5 grid-cols-3">
            <div className="flex flex-col items-baseline bg-white text-center">
              <dt className="text-sm font-medium leading-6 text-gray-500 ml-auto mr-auto mt-4">
                Users{" "}
                <span className="hidden lg:inline-block">Represented</span>
              </dt>
              <dd className="lg:text-3xl mr-auto ml-auto text-lg font-medium leading-10 tracking-tight text-gray-900">
                {selectedNodeCount >= 0
                  ? selectedNodeCount.toLocaleString()
                  : postCount.toLocaleString()}
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
                  : userCount.toLocaleString()}
              </dd>
            </div>
          </dl>
          <div className="px-2 py-2 sm:p-2 w-fit ml-auto mr-auto mt-2 grid grid-flow-row-dense grid-cols-3 ">
            <div className="col-span-2 mt-auto mb-auto ">
              <CustomSearch
                onLocate={(node) => {
                  const nodeLabel = graph?.getNodeAttribute(node, "label");
                  let newParams: { s?: string; ml?: string } = {
                    s: `${nodeLabel}`,
                  };
                  setSearchParams(newParams);
                }}
              />
            </div>
          </div>
        </div>
      </div>
      <footer className="bg-white absolute bottom-0 text-center w-full z-50">
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

export default TreeVisContainer;
