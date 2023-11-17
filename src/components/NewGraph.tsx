import React, { useEffect } from "react";
import { Graph, CosmosInputNode, CosmosInputLink, GraphConfigInterface } from '@cosmograph/cosmos'
import iwanthue from "iwanthue";

const isLocal = document.location.hostname === "localhost";

const NewGraphContainer: React.FC<{}> = () => {
    // Graph raw data
    const [graphDump, setGraphDump] = React.useState<any>(null);

    async function fetchGraph() {
        let fetchURL = "https://s3.jazco.io/exported_graph_minified.json";
        if (isLocal) {
            fetchURL = "https://s3.jazco.io/exported_graph_minified_test.json";
        }

        const textGraph = await fetch(fetchURL);
        const responseJSON = await textGraph.json();
        setGraphDump(responseJSON);
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
    // knownClusterColorMappings.set("TPOT", "#01aee3");
    knownClusterColorMappings.set("Trans + Queer Shitposters", "#7b61ff");
    knownClusterColorMappings.set("Alf Minicluster", "#f00006");
    knownClusterColorMappings.set("Furries", "#1ae828");
    knownClusterColorMappings.set("Squid Cluster", "#220e7d");
    knownClusterColorMappings.set("Ukrainian Cluster", "#ffd700");
    knownClusterColorMappings.set("Italian Cluster", "#008C45");
    knownClusterColorMappings.set("Gay Himbo Cluster", "#b45b00");
    knownClusterColorMappings.set("Portugal Cluster", "#008eef");
    knownClusterColorMappings.set("Education Cluster", "#0185e3");

    useEffect(() => {
        if (graphDump) {
            const canvas = document.querySelector('canvas')
            if (!canvas) {
                return;
            }

            let clusters = graphDump.attributes.clusters;

            const palette = iwanthue(
                Object.keys(graphDump.attributes.clusters).length -
                Object.keys(knownClusterColorMappings).length,
                {
                    seed: "bskyCommunityClusters3",
                    colorSpace: "intense",
                    clustering: "force-vector",
                }
            );

            // create and assign one color by cluster
            for (const community in clusters) {
                const cluster = clusters[community];
                if (cluster.label !== undefined) {
                    cluster.color =
                        knownClusterColorMappings.get(cluster.label) ?? palette.pop();
                } else {
                    cluster.color = palette.pop();
                }
            }

            const config: GraphConfigInterface<CosmosInputNode, CosmosInputLink> = {
                // simulation: {
                //     gravity: 0.1,
                //     linkDistance: 1,
                //     linkSpring: 0.3,
                //     repulsion: 0.4,
                // },
                backgroundColor: "#A0A0A0",
                linkColor: "#FFFFFF",
                disableSimulation: true,
                renderLinks: true,
                spaceSize: 8196,
                nodeSize: (n: any) => n.size,
                nodeColor: (n: any) => n.color,
                linkWidth: (l: any) => l.weight / 100,
            }

            const graph = new Graph(canvas, config)
            let nodes: any[] = [];
            let links: any[] = [];

            graphDump.nodes.forEach((node: any) => {
                let n = {
                    id: node.key,
                    x: node.attributes.x,
                    y: node.attributes.y,
                    color: node.attributes.color,
                    size: node.attributes.size * 40,
                };
                if (node.attributes.community !== undefined && clusters[node.attributes.community] !== undefined) {
                    n.color = clusters[node.attributes.community].color;
                }
                nodes.push(n);
            });
            graphDump.edges.forEach((edge: any) => {
                links.push({
                    source: edge.source,
                    target: edge.target,
                    weight: edge.attributes.weight,
                });
            });
            graph.setData(nodes, links);
        }
    }, [graphDump]);


    useEffect(() => {
        fetchGraph();
    }, []);

    return (
        <div className="overflow-hidden">
            <canvas id="graph-canvas" />
        </div>
    );
};

export default NewGraphContainer;
