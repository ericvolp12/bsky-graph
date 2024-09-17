import GraphContainer from "./components/Graph";
import "./App.css";
import {
  Link,
  RouterProvider,
  createBrowserRouter,
  useLocation,
  Navigate,
} from "react-router-dom";
import Stats from "./components/stats/Stats";
import OptOut from "./components/opt_out/OptOut";
import RepoWalker from "./components/repo_walker/RepoWalker";
import NewGraphContainer from "./components/NewGraph";
import RepoCleanup from "./components/repocleanup/RepoCleanup";

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
          <Link to="/atlas" className={active(["/atlas"])}>
            atlas
          </Link>
          {" | "}
          <Link to="/stats" className={active(["/", "/stats"])}>
            stats
          </Link>
          {" | "}
          <Link to="/walker" className={active(["/walker"])}>
            repo explorer
          </Link>
          {" | "}
          <Link to="/cleanup" className={active(["/cleanup"])}>
            cleanup
          </Link>
        </span>
      </div>
    </header>
  );
};

const router = createBrowserRouter([
  {
    path: "/atlas",
    element: (
      <>
        <NavList />
        <GraphContainer />
      </>
    ),
  },
  {
    path: "/newgraph",
    element: (
      <>
        <NavList />
        <NewGraphContainer />
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
    path: "/",
    element: (
      <>
        <Navigate to="/stats" />
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
  {
    path: "/cleanup",
    element: (
      <>
        <NavList />
        <RepoCleanup />
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
