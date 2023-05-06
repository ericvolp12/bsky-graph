import GraphContainer from "./components/Graph";
import "./App.css";
import { RouterProvider, createBrowserRouter } from "react-router-dom";
import TreeVisContainer from "./components/threads/TreeVis";
import ThreadSearch from "./components/threads/ThreadSearch";

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
]);

function App() {
  return (
    <>
      <RouterProvider router={router} />
    </>
  );
}

export default App;
