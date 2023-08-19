import GraphContainer from "./components/Graph";
import "./App.css";
import {
  Link,
  RouterProvider,
  createBrowserRouter,
  useLocation,
} from "react-router-dom";
import TreeVisContainer from "./components/threads/TreeVis";
import ThreadSearch from "./components/threads/ThreadSearch";
import Stats from "./components/stats/Stats";
import OptOut from "./components/opt_out/OptOut";
import RepoWalker from "./components/repo_walker/RepoWalker";

const NavList: React.FC = () => {
  let location = useLocation();

  const inactive = "font-bold underline-offset-1 underline opacity-50";

  const active = (path: string[]) => {
    let isActive = false;
    if (path.some((p) => location.pathname === p)) {
      isActive = true;
    }

    return isActive ? "font-bold underline-offset-1 underline" : inactive;
  };

  return (
    <header className="bg-white fixed top-0 text-center w-full z-50">
      <div className="mx-auto max-w-7xl px-2 align-middle">
        <span className="footer-text text-xs">
          <Link to="/" className={active(["/"])}>
            atlas
          </Link>
          {" | "}
          <Link to="/thread" className={active(["/thread", "/thread/view"])}>
            thread vis
          </Link>
          {" | "}
          <Link to="/stats" className={active(["/stats"])}>
            stats
          </Link>
          {" | "}
          <Link to="/walker" className={active(["/walker"])}>
            repo explorer
          </Link>
        </span>
      </div>
    </header>
  );
};

const router = createBrowserRouter([
  {
    path: "/",
    element: (
      <>
        <NavList />
        <GraphContainer />
      </>
    ),
  },
  {
    path: "/thread",
    element: (
      <>
        <NavList />
        <ThreadSearch />
      </>
    ),
  },
  {
    path: "/thread/view",
    element: (
      <>
        <NavList />
        <TreeVisContainer />
      </>
    ),
  },
  {
    path: "/stats",
    element: (
      <>
        <NavList />
        <Stats />
      </>
    ),
  },
  {
    path: "/opt_out",
    element: (
      <>
        <NavList />
        <OptOut />
      </>
    ),
  },
  {
    path: "/walker",
    element: (
      <>
        <NavList />
        <RepoWalker />
      </>
    ),
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
