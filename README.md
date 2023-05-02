# [BSky Atlas](https://bsky.jazco.dev)

The BSky Atlas is a visualization of data built by the Graph Builder in [`bsky-experiments`](https://github.com/ericvolp12/bsky-experiments).

The site itself is hosted through [Cloudflare Pages](https://pages.cloudflare.com/) and is fully static until this repo is bumped with new data.

## Exporter

The `exporter` directory contains a TypeScript file that grabs the current snapshot of the Atlas Graph from `http://localhost:6060/graph`.

This endpoint is supported by the `graph-builder` container and provides a `.txt` dump of the current state of the social graph from memory.

This file can grow to be quite large (10s of MBs easily) and will only continue to grow, so we don't store it in that format.

The exporter filters the incoming data, drops low-weight edges and nodes, then creats a layout as follows:

1. Place all nodes in a giant circle
2. Run ForceAtlas2 on the nodes for 600 iterations
3. Run Louvain Community Detection on the resulting graph
4. Filter out any communities with fewer than 50 members
5. Identify communities that have Representatives present and assign them labels

After these steps, we export the graph in Graphology's JSON format to `public/exported_graph_minified.json` which is `gzipped` by Cloudflare on deployment, heavily compressing the repetitive JSON.

### Running the Exporter

Run `yarn install` with `node 18+` to grab dependencies.

Assuming you have an instance of the `graph-builder` running at `http://localhost:6060`, you can run `yarn start` inside the `exporter` directory to grab a snapshot, run the simulations, and build the graph.

## Visualization

The visualization is the primary part of this project and is powered by `Vite`, `React`, and `SigmaJS/Graphology`.

The components that make up the visualization are in the `src/components` folder and are a bit messy at the moment.

- `Graph.tsx` includes the graph rendering logic, MootList, etc.
- `CustomSearch.tsx` is a forked verison of the `Search` component provided by `React-Sigma` with lots of custom styling and functionality for better UX.

### Running the Visualization

This project ships with the latest graph snapshot in the `main` branch, so you can visualize the current version of the graph right now!

Ensure you're using `node 18+` and install dependencies with: `yarn install`

Start the development server and make it accessible to hosts on your network with: `yarn dev --host`

Build the static JS site with `yarn build` and you can serve the contents of the `dist` folder from any static file host.
