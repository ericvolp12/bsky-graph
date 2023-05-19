import { MultiDirectedGraph } from "graphology";
import forceAtlas2 from "graphology-layout-forceatlas2";
import circular from "graphology-layout/circular";
import * as fs from "fs";
import louvain from "graphology-communities-louvain";

interface Edge {
  source: string;
  target: string;
  weight: number;
}

interface Node {
  did: string;
  handle: string;
}

interface IndexNode {
  key: number;
  did: string;
  label: string;
}

interface Cluster {
  label?: string;
  idx: string;
  x?: number;
  y?: number;
  color?: string;
  prio?: number;
  size: number;
  representative?: string;
  positions: { x: number; y: number }[];
}

interface ClusterRepPrio {
  label: string;
  prio: number;
}

const clusterRepresentatives: Map<string, ClusterRepPrio> = new Map();

clusterRepresentatives.set("yui.bsky.social", {
  label: "Japanese Language Cluster",
  prio: 5,
});
clusterRepresentatives.set("shahbazi.bsky.social", {
  label: "Persian Language Cluster",
  prio: 5,
});
clusterRepresentatives.set("burum.bsky.social", {
  label: "Korean Language Cluster",
  prio: 5,
});
clusterRepresentatives.set("livialamblet.com", {
  label: "Brasil Supercluster",
  prio: 5,
});
clusterRepresentatives.set("hoax.bsky.social", {
  label: "Brasilian Swiftie Subcluster",
  prio: 4,
});
clusterRepresentatives.set("vedat.bsky.social", {
  label: "Turkish Language Minicluster",
  prio: 4,
});
clusterRepresentatives.set("awhurst.bsky.social", { label: "Web3", prio: 4 });
// clusterRepresentatives.set("wesbos.com", {
//   label: "Front-end Developers",
//   prio: 3,
// });
clusterRepresentatives.set("faineg.bsky.social", {
  label: "Alf Minicluster",
  prio: 3,
});
clusterRepresentatives.set("pfrazee.com", {
  label: "BSky English Language Metacluster",
  prio: 5,
});
clusterRepresentatives.set("lookitup.baby", {
  label: "Goose Metacluster",
  prio: 4,
});
clusterRepresentatives.set("nori.gay", {
  label: "Hellthread Metacluster",
  prio: 4,
});

clusterRepresentatives.set("andy.wrestlejoy.com", {
  label: "Wrestling Subcluster",
  prio: 3,
});

clusterRepresentatives.set("johnmichiemusic.com", {
  label: "Musician Subcluster",
  prio: 3,
});

clusterRepresentatives.set(
  "deepfates.com.deepfates.com.deepfates.com.deepfates.com.deepfates.com",
  { label: "TPOT", prio: 4 }
);
clusterRepresentatives.set("junlper.bsky.social", {
  label: "Trans + Queer Shitposters",
  prio: 4,
});
// clusterRepresentatives.set("itguyry.com", "BIPOC in Tech");

clusterRepresentatives.set("yap.zone", {
  label: "Furries",
  prio: 3,
});

clusterRepresentatives.set("maureenbug.bsky.social", {
  label: "Squid Cluster",
  prio: 3,
});

const filteredHandles = ["mattyglesias.bsky.social"];

// log logs a message with a timestamp in human-readale format
function log(msg: string) {
  console.log(`${new Date().toLocaleString()}: ${msg}`);
}

async function fetchGraph() {
  log("Fetching graph...");
  const textGraph = await fetch("http://10.0.6.32:6060/graph");
  const responseText = await textGraph.text();
  const lines = responseText.split("\n").filter((line) => line.trim() !== "");

  const nodesMap: Map<string, Node> = new Map();
  const edges: Edge[] = [];

  log("Parsing graph response...");
  lines.forEach((line, _) => {
    const [source, sourceHandle, target, targetHandle, weight] =
      line.split(" ");
    if (
      filteredHandles.includes(sourceHandle) ||
      filteredHandles.includes(targetHandle)
    ) {
      return;
    }
    const parsedWeight = parseInt(weight);
    if (parsedWeight > 1 && source !== target) {
      const sourceNode = { did: source, handle: sourceHandle };
      if (!nodesMap.has(source) && source !== "" && sourceHandle !== "") {
        nodesMap.set(source, sourceNode);
      } else if (source === "" || sourceHandle === "") {
        return;
      }

      const targetNode = { did: target, handle: targetHandle };
      if (!nodesMap.has(target) && target !== "" && targetHandle !== "") {
        nodesMap.set(target, targetNode);
      } else if (target === "" || targetHandle === "") {
        return;
      }

      edges.push({
        source,
        target,
        weight: parsedWeight,
      });
    }
  });

  // Sort the nodes by did so that the order is consistent
  const nodes: Node[] = Array.from(nodesMap.values()).sort((a, b) => {
    if (a.did < b.did) {
      return -1;
    } else if (a.did > b.did) {
      return 1;
    } else {
      return 0;
    }
  });
  log("Done parsing graph response");
  return { edges, nodes };
}

// If "enriched" is set, leave DIDs in the node data

const enriched = process.argv.length >= 3 && process.argv[2] === "enriched";

log(`Starting exporter${enriched ? " in enriched mode" : ""}...`);

fetchGraph().then((graphData: { edges: Edge[]; nodes: Node[] }) => {
  const { edges, nodes } = graphData;
  // Create the graph
  const graph = new MultiDirectedGraph();
  const totalEdges = edges.length;
  const totalNodes = nodes.length;
  const indexNodes: Map<string, IndexNode> = new Map();

  log("Adding nodes...");
  for (let i = 0; i < totalNodes; i++) {
    if (i % 1000 === 0) {
      log(`Adding node ${i} of ${totalNodes - 1}`);
    }
    const node = nodes[i];
    const indexNode = {
      key: i,
      did: node.did,
      label: node.handle,
    };

    if (enriched) {
      const graphNode = {
        key: i,
        label: node.handle,
        did: node.did,
      };
      graph.addNode(i, graphNode);
    } else {
      const graphNode = {
        key: i,
        label: node.handle,
      };
      graph.addNode(i, graphNode);
    }

    indexNodes.set(node.did, indexNode);
  }

  log("Done adding nodes");

  // Create a map of edges for quick reverse lookups
  const edgeMap: Map<string, Edge> = new Map();
  for (let i = 0; i < totalEdges; i++) {
    const edge = edges[i];
    edgeMap.set(`${edge.source}-${edge.target}`, edge);
  }

  // First, find the minimum and maximum weights in the graph
  let minWeight = Infinity;
  let maxWeight = -Infinity;
  let totalWeight = 0;

  for (let i = 0; i < totalEdges; i++) {
    const edge = edges[i];
    minWeight = Math.min(minWeight, edge.weight);
    maxWeight = Math.max(maxWeight, edge.weight);
    totalWeight += edge.weight;
  }

  const logMinWeight = Math.log(minWeight);
  const logMaxWeight = Math.log(maxWeight);
  const minEdgeSize = 0.2;
  const maxEdgeSize = 4;

  log("Adding edges...");
  // Then, set the size of each edge based on its weight relative to the min and max weights
  for (let i = 0; i < totalEdges; i++) {
    if (i % 1000 === 0) {
      log(`Adding edge ${i} of ${totalEdges - 1}`);
    }
    const edge = edges[i];

    let weight = edge.weight;
    const partnerEdge = edgeMap.get(`${edge.target}-${edge.source}`);
    if (partnerEdge !== undefined) {
      const bothEdgeWeight = edge.weight + partnerEdge.weight;
      const mutualityFactor =
        (edge.weight / bothEdgeWeight) * (partnerEdge.weight / bothEdgeWeight);
      weight =
        mutualityFactor * bothEdgeWeight * (1 + Math.log(bothEdgeWeight));
    }

    // Calculate the size based on the logarithm of the edge weight relative to the range of weights
    const size =
      minEdgeSize +
      ((Math.log(weight) - logMinWeight) / (logMaxWeight - logMinWeight)) *
        (maxEdgeSize - minEdgeSize);

    graph.addEdge(
      indexNodes.get(edge.source)?.key,
      indexNodes.get(edge.target)?.key,
      {
        ogWeight: edge.weight,
        weight: parseFloat(weight.toFixed(2)),
        size: parseFloat(size.toFixed(2)),
      }
    );
  }

  log("Done adding edges");

  const degrees = graph.nodes().map((node) => graph.degree(node));
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
  log("Assigning attributes...");
  graph.forEachNode((node) => {
    const degree = graph.inDegreeWithoutSelfLoops(node);
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
    newNodeSize = parseFloat(newNodeSize.toFixed(2));
    area = parseFloat(area.toFixed(2));

    graph.setNodeAttribute(node, "size", newNodeSize);
    graph.setNodeAttribute(node, "area", area);

    // Set a random color
    graph.setNodeAttribute(
      node,
      "color",
      skyBluePalette[Math.floor(Math.random() * 10)]
    );
  });

  // Log total number of nodes, edges, and graph weight
  log(
    `Users: ${graph.order.toLocaleString()} Connections: ${graph.size.toLocaleString()} Interactions: ${totalWeight.toLocaleString()}`
  );

  log("Assigning layout...");
  circular.assign(graph);
  const settings = forceAtlas2.inferSettings(graph);
  const iterationCount = 600;
  log(`Running ${iterationCount} Force Atlas simulations...`);
  forceAtlas2.assign(graph, { settings, iterations: iterationCount });
  log("Done running Force Atlas");

  log("Assigning community partitions...");
  // To directly assign communities as a node attribute
  louvain.assign(graph, {
    resolution: 1.08,
  });
  log("Done assigning community partitions");

  // initialize clusters from graph data
  const communityClusters: { [key: string]: Cluster } = {};

  graph.forEachNode((_, atts) => {
    const idx = atts.community;
    // If this node is in a community that hasn't been seen yet, create a new cluster
    if (!communityClusters[idx]) {
      communityClusters[idx] = {
        idx: idx,
        positions: [],
        size: 1,
      };
    } else {
      // Otherwise, increment the size of the cluster
      communityClusters[idx].size++;
    }
    const repClusterPrio = clusterRepresentatives.get(atts.label);
    // If this node is the representative of its cluster, set the cluster representative
    if (repClusterPrio !== undefined) {
      // If the cluster already has a representative, check if this rep's cluster has a higher priority
      const currentPrio = communityClusters[idx].prio;
      if (currentPrio === undefined || repClusterPrio.prio > currentPrio) {
        communityClusters[idx].representative = atts.label;
        communityClusters[idx].prio = repClusterPrio.prio;
        communityClusters[idx].label = repClusterPrio.label;
      }
    }
  });

  // Drop any clusters with fewer than 50 members, remove the cluster assignment from any nodes in those clusters
  for (const community in communityClusters) {
    if (communityClusters[community].size < 50) {
      graph.updateEachNodeAttributes((_, atts) => {
        if (atts.community === community) {
          delete atts.community;
        }
        return atts;
      });
      delete communityClusters[community];
    }
  }

  log("Truncating node position assignments...");
  // Reduce precision on node x and y coordinates to conserve bits in the exported graph
  graph.updateEachNodeAttributes((_, attrs) => {
    attrs.x = parseFloat(attrs.x.toFixed(2));
    attrs.y = parseFloat(attrs.y.toFixed(2));
    return attrs;
  });
  log("Done truncating node position assignments");

  graph.forEachNode((_, atts) => {
    if (!atts.community) return;
    const cluster = communityClusters[atts.community];
    if (cluster === undefined) return;
    // store cluster's nodes positions to calculate cluster label position
    cluster.positions.push({ x: atts.x, y: atts.y });
  });

  // calculate the cluster's nodes barycenter to use this as cluster label position
  for (const community in communityClusters) {
    communityClusters[community].x = parseFloat(
      (
        communityClusters[community].positions.reduce(
          (acc, p) => acc + p.x,
          0
        ) / communityClusters[community].positions.length
      ).toFixed(2)
    );
    communityClusters[community].y = parseFloat(
      (
        communityClusters[community].positions.reduce(
          (acc, p) => acc + p.y,
          0
        ) / communityClusters[community].positions.length
      ).toFixed(2)
    );
  }

  graph.setAttribute("clusters", communityClusters);

  log(`Number of clusters: ${Object.keys(communityClusters).length}`);
  for (const communityIdx in communityClusters) {
    const community = communityClusters[communityIdx];
    log(
      `Cluster ${
        community.label || community.idx
      }, size: ${community.size.toLocaleString()}, representative: ${
        community.representative || "N/A"
      }`
    );
  }

  graph.setAttribute("lastUpdated", new Date().toISOString());

  log("Exporting graph...");
  const outputPath = enriched
    ? "./out/exported_graph_enriched.json"
    : "./out/exported_graph_minified.json";

  // Write graph to file
  fs.writeFileSync(outputPath, JSON.stringify(graph.export()));
  log("Done exporting graph");
});
