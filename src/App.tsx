import GraphContainer from "./components/Graph";
import "./App.css";
import { RouterProvider, createBrowserRouter } from "react-router-dom";
import TreeVisContainer from "./components/threads/TreeVis";
import ThreadSearch from "./components/threads/ThreadSearch";
import Stats from "./components/stats/Stats";
import OptOut from "./components/opt_out/OptOut";
import RepoWalker from "./components/repo_walker/RepoWalker";

const router = createBrowserRouter([
  {
    path: "/",
    element: <GraphContainer />,
  },
  {
    path: "/thread",
    element: <ThreadSearch />,
  },
  {
    path: "/thread/view",
    element: <TreeVisContainer />,
  },
  {
    path: "/stats",
    element: <Stats />,
  },
  {
    path: "/opt_out",
    element: <OptOut />,
  },
  {
    path: "/walker",
    element: <RepoWalker />,
  },
]);

function App() {
  return (
    <>
      <RouterProvider router={router} />
    </>
  );
}

export default App;
