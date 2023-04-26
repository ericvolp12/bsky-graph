"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
var graphology_1 = require("graphology");
var graphology_layout_forceatlas2_1 = require("graphology-layout-forceatlas2");
var circular_1 = require("graphology-layout/circular");
function fetchGraph() {
    return __awaiter(this, void 0, void 0, function () {
        var textGraph, responseText, lines, nodes, edges;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    console.log("Fetching graph...");
                    return [4 /*yield*/, fetch("http://localhost:6060/graph")];
                case 1:
                    textGraph = _a.sent();
                    return [4 /*yield*/, textGraph.text()];
                case 2:
                    responseText = _a.sent();
                    lines = responseText.split("\n").filter(function (line) { return line.trim() !== ""; });
                    nodes = [];
                    edges = [];
                    console.log("Parsing graph response...");
                    lines.forEach(function (line, _) {
                        var _a = line.split(" "), source = _a[0], sourceHandle = _a[1], target = _a[2], targetHandle = _a[3], weight = _a[4];
                        var sourceNode = { did: source, handle: sourceHandle };
                        if (!nodes.find(function (node) { return node.did === source; })) {
                            nodes.push(sourceNode);
                        }
                        var targetNode = { did: target, handle: targetHandle };
                        if (!nodes.find(function (node) { return node.did === target; })) {
                            nodes.push(targetNode);
                        }
                        edges.push({
                            source: source,
                            target: target,
                            weight: parseInt(weight),
                        });
                    });
                    console.log("Done parsing graph response");
                    return [2 /*return*/, { edges: edges, nodes: nodes }];
            }
        });
    });
}
fetchGraph().then(function (graphData) {
    var _a, _b;
    var edges = graphData.edges, nodes = graphData.nodes;
    // Create the graph
    var graph = new graphology_1.MultiDirectedGraph();
    var totalEdges = edges.length;
    var totalNodes = nodes.length;
    var tempNodes = [];
    console.log("Adding nodes...");
    for (var i = 0; i < totalNodes; i++) {
        if (i % 1000 === 0) {
            console.log("Adding node ".concat(i, " of ").concat(totalNodes - 1));
        }
        var node = nodes[i];
        var tempNode = {
            key: i,
            did: node.did,
            label: node.handle,
        };
        var slimNode = {
            key: i,
            label: node.handle,
        };
        graph.addNode(i, slimNode);
        tempNodes.push(tempNode);
    }
    console.log("Done adding nodes");
    // First, find the minimum and maximum weights in the graph
    var minWeight = Infinity;
    var maxWeight = -Infinity;
    for (var i = 0; i < totalEdges; i++) {
        var edge = edges[i];
        minWeight = Math.min(minWeight, edge.weight);
        maxWeight = Math.max(maxWeight, edge.weight);
    }
    console.log("Adding edges...");
    var _loop_1 = function (i) {
        if (i % 1000 === 0) {
            console.log("Adding edge ".concat(i, " of ").concat(totalEdges - 1));
        }
        var edge = edges[i];
        // Calculate the size based on the logarithm of the edge weight relative to the range of weights
        var size = 0.2 +
            ((Math.log(edge.weight) - Math.log(minWeight)) /
                (Math.log(maxWeight) - Math.log(minWeight))) *
                (6 - 0.2);
        graph.addEdge((_a = tempNodes.find(function (node) { return node.did === edge.source; })) === null || _a === void 0 ? void 0 : _a.key, (_b = tempNodes.find(function (node) { return node.did === edge.target; })) === null || _b === void 0 ? void 0 : _b.key, {
            weight: edge.weight,
            size: parseFloat(size.toFixed(2)),
        });
    };
    // Then, set the size of each edge based on its weight relative to the min and max weights
    for (var i = 0; i < totalEdges; i++) {
        _loop_1(i);
    }
    console.log("Done adding edges");
    var degrees = graph.nodes().map(function (node) { return graph.degree(node); });
    var minDegree = Math.min.apply(Math, degrees);
    var maxDegree = Math.max.apply(Math, degrees);
    var skyBluePalette = [
        "#009ACD",
        "#5B9BD5",
        "#7EC0EE",
        "#87CEFA",
        "#4A708B",
        "#1E90FF",
        "#00BFFF",
        "#3CB371",
        "#FF7F50",
        "#FF4500", // OrangeRed
    ];
    var minSize = 1.5, maxSize = 15;
    console.log("Assigning attributes...");
    graph.forEachNode(function (node) {
        var degree = graph.inDegreeWithoutSelfLoops(node);
        // Set the size based on the degree of the node relative to the min and max degrees
        var newNodeSize = minSize +
            Math.sqrt((degree - minDegree) / (maxDegree - minDegree)) *
                (maxSize - minSize);
        // Calculate the radius of the circle based on the size
        var radius = newNodeSize / 2;
        // Calculate the area of the circle based on the radius
        var area = Math.PI * radius * radius;
        // Round to 2 decimal places to conserve bits in the exported graph
        if (newNodeSize > 1) {
            newNodeSize = parseFloat(newNodeSize.toFixed(2));
            area = parseFloat(area.toFixed(2));
        }
        graph.setNodeAttribute(node, "size", newNodeSize);
        graph.setNodeAttribute(node, "area", area);
        // Set a random color
        graph.setNodeAttribute(node, "color", skyBluePalette[Math.floor(Math.random() * 10)]);
    });
    console.log("Assigning layout...");
    circular_1.default.assign(graph);
    var settings = graphology_layout_forceatlas2_1.default.inferSettings(graph);
    console.log("Running Force Atlas...");
    graphology_layout_forceatlas2_1.default.assign(graph, { settings: settings, iterations: 600 });
    console.log("Done running Force Atlas");
    // Reduce precision on node x and y coordinates to conserve bits in the exported graph
    graph.forEachNode(function (node) {
        var x = graph.getNodeAttribute(node, "x");
        var y = graph.getNodeAttribute(node, "y");
        graph.setNodeAttribute(node, "x", parseFloat(x.toFixed(3)));
        graph.setNodeAttribute(node, "y", parseFloat(y.toFixed(3)));
    });
    console.log("Exporting graph...");
    console.log(graph.export());
});
