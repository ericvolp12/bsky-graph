import {
  SigmaContainer,
  useLoadGraph,
  useRegisterEvents,
  useSigmaContext,
} from "@react-sigma/core";
import "@react-sigma/core/lib/react-sigma.min.css";
import { formatDistanceToNow, parseISO } from "date-fns";
import { MultiDirectedGraph } from "graphology";
import React, { useEffect, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import getNodeProgramImage from "sigma/rendering/webgl/programs/node.image";

import forceAtlas2 from "graphology-layout-forceatlas2";
import circular from "graphology-layout/circular";
import iwanthue from "iwanthue";
import ErrorMsg from "./ErrorMsg";
import PostView from "./PostView";
import { Coordinates } from "sigma/types";
import { AuthorSearch } from "./AuthorSearch";
import Loading from "../Loading";

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

interface SearchParams {
  author?: string;
  post?: string;
  selectdPost?: string;
  selectedAuthor?: string;
}

interface Post {
  id: string;
  text: string;
  parent_post_id: string | null;
  root_post_id: string | null;
  author_did: string;
  created_at: string;
  has_embedded_media: boolean;
}

interface ThreadItem {
  key: string;
  author_handle: string;
  post: Post;
  depth: number;
}

export interface SelectedNode {
  id: string;
  text: string;
  author_handle: string;
  author_did: string;
  has_media: boolean;
  x: number;
  y: number;
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
  const [error, setError] = React.useState<string | null>(null);
  const [httpStatus, setHttpStatus] = React.useState<number | null>(null);

  // Graph raw data
  const [graphDump, setGraphDump] = React.useState<MultiDirectedGraph | null>(
    null
  );

  // Graph stats
  const [postCount, setPostCount] = React.useState<number>(0);
  const [userCount, setUserCount] = React.useState<number>(0);

  // Selected Node properties
  const [selectedNode, setSelectedNode] = React.useState<SelectedNode | null>(
    null
  );
  const [hoveredNode, setHoveredNode] = React.useState<SelectedNode | null>(
    null
  );
  const [selectedAuthor, setSelectedAuthor] = React.useState<string | null>(
    null
  );
  const previousSelectedAuthor: string | null = usePrevious<string | null>(
    selectedAuthor
  );
  const [rootNode, setRootNode] = React.useState<string | null>(null);
  const [colorMap, setColorMap] = React.useState<Map<string, string> | null>(
    null
  );

  const [selectedNodeCount, setSelectedNodeCount] = React.useState<number>(-1);
  const [selectedNodeEdges, setSelectedNodeEdges] = React.useState<
    string[] | null
  >(null);

  // Graph State
  const [graph, setGraph] = React.useState<MultiDirectedGraph | null>(null);
  const [graphShouldUpdate, setGraphShouldUpdate] =
    React.useState<boolean>(true);
  const [nodeMap, setNodeMap] = React.useState<Map<string, Node>>(new Map());
  const [loading, setLoading] = React.useState<boolean>(true);

  const ThreadTree: React.FC = () => {
    const loadGraph = useLoadGraph();
    const registerEvents = useRegisterEvents();
    const { sigma, container } = useSigmaContext();

    sigma.settings.hoverRenderer = () => {};

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

        const userSet = new Set<string>();

        // Assign a random color to each node author by did
        const newColorMap = new Map<string, string>();
        newGraph?.forEachNode((_, attrs) => {
          if (!newColorMap.has(attrs.post.author_did)) {
            newColorMap.set(
              attrs.post.author_did,
              palette[Math.floor(Math.random() * 10)]
            );
          }
          userSet.add(attrs.post.author_did);
        });

        // Set the color of each node to the color of its cluster
        newGraph?.updateEachNodeAttributes((_, attr) => {
          attr.color = newColorMap.get(attr.post.author_did);
          return attr;
        });

        setPostCount(newGraph.order);
        setUserCount(userSet.size);

        newGraph?.forEachNode((_, attr) => {
          attr["old-color"] = attr.color;
        });

        setGraph(newGraph);
        setColorMap(newColorMap);
        loadGraph(newGraph);
        setLoading(false);
      }
    }, [loadGraph]);

    useEffect(() => {
      const selectedAuthorFromParams = searchParams.get("selectedAuthor");
      if (selectedAuthorFromParams !== null && selectedAuthor === null) {
        setSelectedAuthor(selectedAuthorFromParams);
      }
    }, [searchParams]);

    useEffect(() => {
      if (graph === null) {
        return;
      }
      graph.updateEachNodeAttributes((_, attr) => {
        if (selectedAuthor !== null) {
          if (attr.author_handle === selectedAuthor) {
            attr.color =
              colorMap?.get(attr.post.author_did) || "rgba(0,0,0,0.1)";
          } else {
            attr.color = "rgba(0,0,0,0.1)";
          }
        } else {
          attr.color = colorMap?.get(attr.post.author_did) || "rgba(0,0,0,0.1)";
        }
        return attr;
      });
      sigma.refresh();
    }, [selectedAuthor]);

    useEffect(() => {
      if (rootNode) {
        const attrs = graph?.getNodeAttributes(rootNode);
        if (attrs !== undefined) {
          const viewportPos = sigma.graphToViewport(attrs as Coordinates);
          const nodeLabel = document.getElementById("rootNodeLabel");
          // update position from the viewport
          if (nodeLabel !== null && attrs !== undefined) {
            nodeLabel.style.top = `${(
              viewportPos.y -
              (attrs.size * 2 + 10)
            ).toFixed(2)}px`;
            nodeLabel.style.left = `${viewportPos.x.toFixed(2)}px`;
          }
        }
      }
      // Register the events
      registerEvents({
        clickNode: ({ event, node, preventSigmaDefault }: any) => {
          if (hoveredNode && hoveredNode.id === node) {
            setSelectedNode(hoveredNode);
            return;
          }
          const post = graph?.getNodeAttribute(node, "post");
          setSelectedNode({
            id: node,
            text: post.text,
            author_handle: graph?.getNodeAttribute(node, "author_handle"),
            author_did: post.author_did,
            has_media: post.has_embedded_media,
            x: event.x,
            y: event.y,
          });
        },
        enterNode({ event, node, preventSigmaDefault }: any) {
          const post = graph?.getNodeAttribute(node, "post");
          setHoveredNode({
            id: node,
            text: post.text,
            author_handle: graph?.getNodeAttribute(node, "author_handle"),
            author_did: post.author_did,
            has_media: post.has_embedded_media,
            x: event.x,
            y: event.y,
          });
        },
        leaveNode(event: any) {
          setHoveredNode(null);
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
        afterRender: () => {
          if (selectedNode) {
            const attrs = graph?.getNodeAttributes(selectedNode.id);
            if (attrs === undefined) {
              return;
            }
            const viewportPos = sigma.graphToViewport(attrs as Coordinates);
            setSelectedNode({
              ...selectedNode,
              x: viewportPos.x,
              y: viewportPos.y,
            });
          }
          if (rootNode) {
            const attrs = graph?.getNodeAttributes(rootNode);
            const viewportPos = sigma.graphToViewport(attrs as Coordinates);
            const nodeLabel = document.getElementById("rootNodeLabel");
            // update position from the viewport
            if (nodeLabel !== null && attrs !== undefined) {
              nodeLabel.style.top = `${(
                viewportPos.y -
                (attrs.size * 2 + 10)
              ).toFixed(2)}px`;
              nodeLabel.style.left = `${viewportPos.x.toFixed(2)}px`;
            }
          }
        },
        clickStage: (_: any) => {
          setSelectedNode(null);
        },
      });
    }, [registerEvents]);

    return null;
  };

  async function fetchGraph(authorHandle: string, postId: string) {
    const response = await fetch(
      `http://10.0.6.32:8080/thread?authorHandle=${authorHandle}&postID=${postId}`
    );
    if (response.status !== 200) {
      console.error("Error fetching thread");
      setError(`Error fetching thread: ${response.status}`);
      setHttpStatus(response.status);
      return;
    }

    const responseJSON = await response.json();
    const nodesMap: Map<string, ThreadItem> = new Map();
    const edges: Edge[] = [];

    responseJSON.forEach((post: ThreadItem) => {
      if (!nodesMap.has(post.post.id)) {
        nodesMap.set(post.post.id, {
          ...post,
          key: post.post.id,
        });
      }

      let source = post.post.parent_post_id;
      if (source != null && nodesMap.get(source) === undefined) {
        return;
      }

      edges.push({
        source: post.post.parent_post_id || "root",
        target: post.post.id,
      });
    });

    // Sort the nodes by did so that the order is consistent
    const nodes: ThreadItem[] = Array.from(nodesMap.values()).sort((a, b) => {
      if (a.post.id < b.post.id) {
        return -1;
      } else if (a.post.id > b.post.id) {
        return 1;
      } else {
        return 0;
      }
    });

    const graph = new MultiDirectedGraph();
    const totalEdges = edges.length;
    const totalNodes = nodes.length;

    const maxDepth = Math.max(...nodes.map((node) => node.depth));
    const maxSize = 6;
    const minSize = 1;

    console.log("Adding nodes...");
    for (let i = 0; i < totalNodes; i++) {
      const node = nodes[i];
      // Split node text on a newline every 30 characters
      let size =
        minSize +
        (maxSize - minSize) * ((maxDepth - node.depth + 1) / maxDepth);
      if (node.depth === 0) {
        size = maxSize + 3;
        setRootNode(node.post.id);
      }
      graph.addNode(node.post.id, {
        ...node,
        size,
        label: node.post.text.substring(0, 15) + "...",
      });
    }

    console.log("Adding edges...");
    for (let i = 0; i < totalEdges; i++) {
      const edge = edges[i];
      if (edge.source === "root") {
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
    const authorHandle = searchParams.get("author");
    const postID = searchParams.get("post");
    if (authorHandle === null || postID === null) {
      return;
    }
    // Don't rerender the whole graph if we're just changing the selected author
    const selectedAuthorFromParams = searchParams.get("selectedAuthor");
    console.log("Fired");

    if (
      selectedAuthorFromParams !== null &&
      (selectedAuthorFromParams === selectedAuthor ||
        searchParams.get("selectedAuthor") === previousSelectedAuthor)
    ) {
      console.log(`Not fetching: ${selectedAuthorFromParams}`);
      return;
    }
    fetchGraph(authorHandle, postID);
  }, [searchParams]);

  return (
    <div>
      {error && (
        <main className="grid min-h-full place-items-center bg-white px-6 py-24 sm:py-32 lg:px-8">
          <div className="text-center">
            <p className="text-base font-semibold text-indigo-600">
              {httpStatus}
            </p>
            <h1 className="mt-4 text-3xl font-bold tracking-tight text-gray-900 sm:text-5xl">
              We Failed to Load your Graph
            </h1>
            <p className="mt-6 text-base leading-7 text-gray-600">
              Sorry, we were unable to load the thread you're looking for.
            </p>
            <div className="mt-10 flex items-center justify-center gap-x-6 text-left">
              <ErrorMsg error={error} />
            </div>
          </div>
        </main>
      )}
      {selectedNode && (
        <div
          className="absolute postView z-50"
          style={{
            top: `${selectedNode.y - 20}px`,
            left: `${selectedNode.x + 20}px`,
          }}
        >
          <PostView node={selectedNode} />
        </div>
      )}
      {!selectedNode && hoveredNode && (
        <div
          className="absolute postView z-50"
          style={{
            top: `${hoveredNode.y - 20}px`,
            left: `${hoveredNode.x + 20}px`,
          }}
        >
          <PostView node={hoveredNode} />
        </div>
      )}
      {loading && <Loading message="Loading Thread" />}
      {!error && (
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
          {rootNode && (
            <div className="overflow-hidden w-screen h-screen absolute top-0 left-0">
              <div
                id="rootNodeLabel"
                className="clusterLabel absolute md:text-3xl text-xl"
                style={{
                  color: "#BC002D",
                  top: "0px",
                  left: "0px",
                  zIndex: 3,
                }}
              >
                Thread Starts Here
              </div>
            </div>
          )}
          <ThreadTree />

          <div className="left-1/2 bottom-10 lg:tall:bottom-20 transform -translate-x-1/2 w-5/6 lg:w-fit z-50 fixed">
            <div className="bg-white shadow sm:rounded-lg pb-1">
              <dl className="mx-auto grid gap-px bg-gray-900/5 grid-cols-2">
                <div className="flex flex-col items-baseline bg-white text-center">
                  <dt className="text-sm font-medium leading-6 text-gray-500 ml-auto mr-auto mt-4">
                    Users
                  </dt>
                  <dd className="lg:text-3xl mr-auto ml-auto text-lg font-medium leading-10 tracking-tight text-gray-900">
                    {selectedNodeCount >= 0
                      ? selectedNodeCount.toLocaleString()
                      : userCount.toLocaleString()}
                  </dd>
                </div>
                <div className="flex flex-col items-baseline bg-white text-center">
                  <dt className="text-sm font-medium leading-6 text-gray-500 ml-auto mr-auto mt-4">
                    Posts{" "}
                  </dt>
                  <dd className="lg:text-3xl mr-auto ml-auto text-lg font-medium leading-10 tracking-tight text-gray-900">
                    {selectedNodeEdges
                      ? selectedNodeEdges.length.toLocaleString()
                      : postCount.toLocaleString()}
                  </dd>
                </div>
              </dl>
              <div className="px-2 py-2 sm:p-2 w-full ml-auto mr-auto mt-2 grid grid-flow-row-dense grid-cols-3 ">
                <div className="col-span-2 mt-auto mb-auto pl-10">
                  <AuthorSearch
                    onLocate={(node) => {
                      const author = searchParams.get("author") || "";
                      const post = searchParams.get("post") || "";
                      const attrs = graph?.getNodeAttributes(node);
                      if (attrs !== undefined) {
                        const newParams: any = {
                          author,
                          post,
                          selectedAuthor: attrs.author_handle,
                        };
                        setSelectedAuthor(attrs.author_handle);
                        setSearchParams(newParams);
                      }
                    }}
                  />
                </div>
                <div className="col-span-1 mt-auto mb-auto mr-auto pl-4">
                  <button
                    type="button"
                    className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-500 hover:bg-indigo-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-600"
                    onClick={() => {
                      const author = searchParams.get("author") || "";
                      const post = searchParams.get("post") || "";
                      const newParams: any = {
                        author,
                        post,
                      };
                      setSelectedAuthor(null);
                      setSearchParams(newParams);
                    }}
                  >
                    Reset
                  </button>
                </div>
              </div>
            </div>
          </div>
        </SigmaContainer>
      )}
      <footer className="bg-white fixed bottom-0 text-center w-full z-50">
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
    </div>
  );
};

export default TreeVisContainer;
