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
import { Coordinates } from "sigma/types";
import "@react-sigma/core/lib/react-sigma.min.css";

import iwanthue from "iwanthue";
import Loading from "./Loading";

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

interface Cluster {
  label?: string;
  idx: string;
  x?: number;
  y?: number;
  color?: string;
  size: number;
  positions: { x: number; y: number }[];
}

const knownClusterColorMappings: Map<string, string> = new Map();

knownClusterColorMappings.set("Japanese Language Cluster", "#BC002D");
knownClusterColorMappings.set("Persian Language Cluster", "#c66b00");
knownClusterColorMappings.set("Korean Language Cluster", "#0e448f");
knownClusterColorMappings.set("Brasil Supercluster", "#009739");
knownClusterColorMappings.set("Brasilian Swiftie Subcluster", "#6e1799");
knownClusterColorMappings.set("Turkish Language Minicluster", "#743232");
knownClusterColorMappings.set("Web3", "#eac72d");
knownClusterColorMappings.set("Musician Subcluster", "#e051a9");
knownClusterColorMappings.set("Wrestling Subcluster", "#db1fbf");
knownClusterColorMappings.set("Hellthread Metacluster", "#f07b3c");
knownClusterColorMappings.set("Front-end Developers", "#cf8d46");
knownClusterColorMappings.set("BSky English Language Metacluster", "#018b7c");
knownClusterColorMappings.set("Goose Metacluster", "#870566	");
knownClusterColorMappings.set("TPOT", "#01aee3");
knownClusterColorMappings.set("Trans + Queer Shitposters", "#7b61ff");
knownClusterColorMappings.set("Alf Minicluster", "#f00006");
knownClusterColorMappings.set("Furries", "#1ae828");
knownClusterColorMappings.set("Squid Cluster", "#220e7d");
knownClusterColorMappings.set("Ukrainian Cluster", "#ffd700");
knownClusterColorMappings.set("Italian Cluster", "#008C45");
knownClusterColorMappings.set("Gay Himbo Cluster", "#b45b00");

function constructEdgeMap(graph: MultiDirectedGraph): Map<string, Edge> {
  const edgeMap = new Map<string, Edge>();
  graph?.forEachEdge((edge, attrs, source, target) => {
    if (source !== undefined && target !== undefined && attrs.weight !== null) {
      edgeMap.set(edge, {
        source: source,
        target: target,
        weight: attrs.weight,
        ogWeight: attrs.ogWeight,
      });
    }
  });
  return edgeMap;
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

const isLocal =
  document.location.hostname === "localhost" ||
  document.location.hostname.endsWith(".bsky-graph.pages.dev");

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
  const [selectedNodeCount, setSelectedNodeCount] = React.useState<number>(-1);
  const [inWeight, setInWeight] = React.useState<number>(-1);
  const [outWeight, setOutWeight] = React.useState<number>(-1);
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
  const [loading, setLoading] = React.useState<boolean>(true);

  const [edgeMap, setEdgeMap] = React.useState<Map<string, Edge>>(new Map());
  const [nodeMap, setNodeMap] = React.useState<Map<string, Node>>(new Map());

  const [clusters, setClusters] = React.useState<Cluster[]>([]);
  const [showClusterLabels, setShowClusterLabels] =
    React.useState<boolean>(true);

  const SocialGraph: React.FC = () => {
    const loadGraph = useLoadGraph();
    const registerEvents = useRegisterEvents();
    const { sigma, container } = useSigmaContext();

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

        const communityClusters = newGraph.getAttribute("clusters");

        if (communityClusters === null) {
          return;
        }
        const palette = iwanthue(
          Object.keys(communityClusters).length -
            Object.keys(knownClusterColorMappings).length,
          {
            seed: "bskyCommunityClusters3",
            colorSpace: "intense",
            clustering: "force-vector",
          }
        );

        // create and assign one color by cluster
        for (const community in communityClusters) {
          const cluster = communityClusters[community];
          if (cluster.label !== undefined) {
            cluster.color =
              knownClusterColorMappings.get(cluster.label) ?? palette.pop();
          } else {
            cluster.color = palette.pop();
          }
        }

        // Set the color of each node to the color of its cluster
        newGraph?.updateEachNodeAttributes((_, attr) => {
          if (
            attr.community !== undefined &&
            attr.community in communityClusters
          ) {
            attr.color = communityClusters[attr.community].color;
          }
          return attr;
        });

        newGraph.setAttribute("clusters", communityClusters);

        setUserCount(newGraph.order);
        setEdgeCount(newGraph.size);
        setTotalWeight(
          newGraph.reduceEdges(
            (acc, edge) => acc + newGraph.getEdgeAttribute(edge, "ogWeight"),
            0
          )
        );

        newGraph?.forEachNode((_, attr) => {
          attr["old-color"] = attr.color;
        });

        // Initialize cluster positions
        const newClusters: Cluster[] = [];
        for (const community in communityClusters) {
          const cluster = communityClusters[community];
          // adapt the position to viewport coordinates
          const viewportPos = sigma.graphToViewport(cluster as Coordinates);
          newClusters.push({
            label: cluster.label,
            idx: cluster.idx,
            x: viewportPos.x,
            y: viewportPos.y,
            color: cluster.color,
            size: cluster.size,
            positions: cluster.positions,
          });
        }
        setClusters(newClusters);
        setGraph(newGraph);
        loadGraph(newGraph);
        setLoading(false);
      }
    }, [loadGraph]);

    // Render Cluster Labels
    const renderClusterLabels = () => {
      if (graph === null) {
        return;
      }
      // create the clustersLabel layer
      const communityClusters = graph.getAttribute("clusters");

      // Initialize cluster positions
      for (const community in communityClusters) {
        const cluster = communityClusters[community];
        // adapt the position to viewport coordinates
        const viewportPos = sigma.graphToViewport(cluster as Coordinates);
        const clusterLabel = document.getElementById(`cluster-${cluster.idx}`);
        // update position from the viewport
        if (clusterLabel !== null) {
          clusterLabel.style.top = `${viewportPos.y.toFixed(2)}px`;
          clusterLabel.style.left = `${viewportPos.x.toFixed(2)}px`;
        }
      }
    };

    // Select Node Effect
    useEffect(() => {
      if (
        graph !== null &&
        selectedNode !== null &&
        (selectedNode !== previousSelectedNode ||
          showSecondDegreeNeighbors !== previousSecondDegreeNeighbors)
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
          if (showSecondDegreeNeighbors) {
            attrs.hidden = true;
          } else {
            attrs.hidden = false;
            attrs.color = "rgba(0,0,0,0.1)";
          }
          return attrs;
        });

        // Get all neighbors of selected node
        const neighbors = graph?.neighbors(selectedNode);

        // Re-color all nodes connected to selected node
        graph?.forEachNeighbor(selectedNode, (node, attrs) => {
          attrs.hidden = false;
          attrs.color = attrs["old-color"];
          // Set all 2nd degree neighbors to a light grey
          if (showSecondDegreeNeighbors) {
            graph?.forEachNeighbor(node, (neighbor, neighborAttrs) => {
              if (!neighbors?.includes(neighbor)) {
                neighborAttrs.hidden = false;
                neighborAttrs.color = "rgba(0,0,0,0.1)";
              }
              // Show 2nd degree neighbor edges
              graph?.forEachEdge(node, neighbor, (_, attrs) => {
                attrs.hidden = false;
              });
            });
          }
        });

        // Re-show edges connected to selected node
        graph?.forEachInEdge(selectedNode, (_, attrs) => {
          attrs.hidden = false;
          attrs.color = "#4b33ff";
        });

        graph?.forEachOutEdge(selectedNode, (_, attrs) => {
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
        setInWeight(
          graph?.reduceInEdges(
            selectedNode,
            (acc, edge) => acc + graph.getEdgeAttribute(edge, "ogWeight"),
            0
          ) || 0
        );
        setOutWeight(
          graph?.reduceOutEdges(
            selectedNode,
            (acc, edge) => acc + graph.getEdgeAttribute(edge, "ogWeight"),
            0
          ) || 0
        );
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
        setInWeight(-1);
        setOutWeight(-1);
        sigma.refresh();
      }
    }, [selectedNode, showSecondDegreeNeighbors]);

    useEffect(() => {
      renderClusterLabels();
      // Register the events
      registerEvents({
        clickNode: (event: any) => {
          const nodeID = graph?.getNodeAttribute(event.node, "key");
          let newParams: { s?: string } = {
            s: `${nodeID}`,
          };
          setSearchParams(newParams);
          setSelectedNode(nodeID);
        },
        afterRender: () => {
          renderClusterLabels();
        },
        clickStage: (_: any) => {
          setSearchParams({});
          setSelectedNode(null);
        },
      });
    }, [registerEvents]);

    return null;
  };

  async function fetchGraph() {
    let fetchURL = "https://s3.jazco.io/exported_graph_minified.json";
    if (isLocal) {
      fetchURL = "https://s3.jazco.io/exported_graph_minified_test.json";
    }

    const textGraph = await fetch(fetchURL);
    const responseJSON = await textGraph.json();
    setGraphDump(responseJSON);
  }

  useEffect(() => {
    const selectedNodeIDFromParams = searchParams.get("s");
    if (selectedNodeIDFromParams !== null) {
      const selectedNodeKey = nodeMap.get(selectedNodeIDFromParams)?.key;
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
    <div className="overflow-hidden">
      {loading && <Loading message="Loading Graph" />}
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
        <div className="overflow-hidden w-screen h-screen absolute top-0 left-0">
          {clusters.map((cluster) => {
            if (cluster.label !== undefined) {
              return (
                <div
                  key={cluster.idx}
                  id={`cluster-${cluster.idx}`}
                  hidden={!showClusterLabels}
                  className="clusterLabel absolute md:text-3xl text-xl"
                  style={{
                    color: `${cluster.color}`,
                    top: `${cluster.y}px`,
                    left: `${cluster.x}px`,
                    zIndex: 3,
                  }}
                >
                  {cluster.label}
                </div>
              );
            }
          })}
        </div>
        <SocialGraph />
        <div className="left-1/2 bottom-10 lg:tall:bottom-20 transform -translate-x-1/2 w-5/6 lg:w-fit z-50 fixed">
          <div className="bg-white shadow sm:rounded-lg py-1">
            <dl className="mx-auto grid gap-px bg-gray-900/5 grid-cols-3 mb-5">
              <div className="flex flex-col items-baseline bg-white text-center">
                <dt className="text-sm font-medium leading-6 text-gray-500 ml-auto mr-auto mt-4">
                  Users{" "}
                  <span className="hidden lg:inline-block">Represented</span>
                </dt>
                <dd className="lg:text-3xl mr-auto ml-auto text-lg font-medium leading-10 tracking-tight text-gray-900">
                  {selectedNodeCount >= 0
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
                  {inWeight >= 0 && outWeight >= 0
                    ? `${inWeight.toLocaleString()}/${outWeight.toLocaleString()}`
                    : totalWeight.toLocaleString()}
                </dd>
              </div>
            </dl>
          </div>
        </div>
      </SigmaContainer>
      <footer className="bg-white fixed bottom-0 text-center w-full z-50">
        <div className="mx-auto max-w-7xl px-2">
          <span className="footer-text text-xs">
            Built by{" "}
            <a
              href="https://bsky.app/profile/jaz.bsky.social"
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
    </div>
  );
};

export default GraphContainer;
