import { MultiDirectedGraph } from "graphology";
import forceAtlas2 from "graphology-layout-forceatlas2";
import circular from "graphology-layout/circular";
import * as fs from "fs";
import louvain from "graphology-communities-louvain";
import iwanthue from "iwanthue";

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
  label: string;
  x?: number;
  y?: number;
  color?: string;
  size: number;
  positions: { x: number; y: number }[];
}

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

    const parsedWeight = parseInt(weight);
    if (parsedWeight > 1 && source !== target) {
      const sourceNode = { did: source, handle: sourceHandle };
      if (!nodesMap.has(source)) {
        nodesMap.set(source, sourceNode);
      }

      const targetNode = { did: target, handle: targetHandle };
      if (!nodesMap.has(target)) {
        nodesMap.set(target, targetNode);
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
    const graphNode = {
      key: i,
      label: node.handle,
    };
    graph.addNode(i, graphNode);
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
      const mutualityRatio =
        edge.weight / bothEdgeWeight + partnerEdge.weight / bothEdgeWeight;
      weight = mutualityRatio * bothEdgeWeight * (1 + Math.log(bothEdgeWeight));
    }

    // Calculate the size based on the logarithm of the edge weight relative to the range of weights
    const size =
      0.2 +
      ((Math.log(weight) - logMinWeight) / (logMaxWeight - logMinWeight)) *
        (6 - 0.2);

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
  louvain.assign(graph);
  log("Done assigning community partitions");

  // initialize clusters from graph data
  const communityClusters: { [key: string]: Cluster } = {};

  graph.forEachNode((_, atts) => {
    if (!communityClusters[atts.community]) {
      communityClusters[atts.community] = {
        label: atts.community,
        positions: [],
        size: 1,
      };
    } else {
      communityClusters[atts.community].size++;
    }
  });

  // Drop any clusters with fewer than 20 members, remove the cluster assignment from any nodes in those clusters
  for (const community in communityClusters) {
    if (communityClusters[community].size < 20) {
      graph.updateEachNodeAttributes((_, atts) => {
        if (atts.community === community) {
          delete atts.community;
        }
        return atts;
      });
      delete communityClusters[community];
    }
  }

  log(
    `Number of clusters: ${
      Object.keys(communityClusters).length
    }, number of members in each cluster: ${Object.values(communityClusters)
      .map((c) => c.size)
      .join(", ")} `
  );

  const palette = iwanthue(Object.keys(communityClusters).length, {
    seed: "bskyCommunities",
    colorSpace: "intense",
    clustering: "force-vector",
  });

  // create and assign one color by cluster
  for (const community in communityClusters) {
    communityClusters[community].color = palette.pop();
  }

  // change node appearance
  graph.forEachNode((_, atts) => {
    if (!atts.community) return;
    const cluster = communityClusters[atts.community];
    // node color depends on the cluster it belongs to
    if (cluster === undefined) return;
    atts.color = cluster.color;
    // store cluster's nodes positions to calculate cluster label position
    cluster.positions.push({ x: atts.x, y: atts.y });
  });

  // calculate the cluster's nodes barycenter to use this as cluster label position
  for (const community in communityClusters) {
    communityClusters[community].x =
      communityClusters[community].positions.reduce((acc, p) => acc + p.x, 0) /
      communityClusters[community].positions.length;
    communityClusters[community].y =
      communityClusters[community].positions.reduce((acc, p) => acc + p.y, 0) /
      communityClusters[community].positions.length;
  }

  log("Truncating node position assignments...");
  // Reduce precision on node x and y coordinates to conserve bits in the exported graph
  graph.updateEachNodeAttributes((_, attrs) => {
    attrs.x = parseFloat(attrs.x.toFixed(2));
    attrs.y = parseFloat(attrs.y.toFixed(2));
    return attrs;
  });
  log("Done truncating node position assignments");

  graph.setAttribute("lastUpdated", new Date().toISOString());

  log("Exporting graph...");
  // Write graph to file
  fs.writeFileSync(
    "../public/exported_graph_minified.json",
    JSON.stringify(graph.export())
  );
  log("Done exporting graph");
});
