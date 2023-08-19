import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import ErrorMsg from "./ErrorMsg";

const ThreadSearch: React.FC<{}> = () => {
  const [threadURL, setThreadURL] = React.useState<string>("");
  const [error, setError] = React.useState<string>("");
  const navigate = useNavigate();

  useEffect(() => {
    document.title =
      "Thread Visualizer Search for BlueSky by Jaz (jaz.bsky.social)";
  }, []);

  return (
    <div className="bg-white">
      <div className="mx-auto max-w-7xl py-4 sm:py-24 sm:px-6 lg:px-8">
        <div className="relative isolate overflow-hidden bg-gray-50 px-6 py-24 text-center shadow-md sm:rounded-3xl sm:px-16">
          <div className="mx-auto max-w-md sm:max-w-3xl">
            {error && (
              <div className="text-left mb-2">
                <ErrorMsg error={error} />
              </div>
            )}
            <div>
              <div className="text-center">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 576 512"
                  className="w-10 h-12 text-center mx-auto"
                >
                  <path d="M0 80C0 53.5 21.5 32 48 32h96c26.5 0 48 21.5 48 48V96H384V80c0-26.5 21.5-48 48-48h96c26.5 0 48 21.5 48 48v96c0 26.5-21.5 48-48 48H432c-26.5 0-48-21.5-48-48V160H192v16c0 1.7-.1 3.4-.3 5L272 288h96c26.5 0 48 21.5 48 48v96c0 26.5-21.5 48-48 48H272c-26.5 0-48-21.5-48-48V336c0-1.7 .1-3.4 .3-5L144 224H48c-26.5 0-48-21.5-48-48V80z" />
                </svg>
                <h2 className="mt-2 text-base font-semibold leading-6 text-gray-900">
                  Visualize a Thread
                </h2>
                <p className="mt-1 text-sm text-gray-500">
                  Enter the URL of the thread you'd like to visualize as a Graph
                </p>
              </div>
              <form className="mt-6 sm:flex sm:items-center" action="#">
                <label htmlFor="threadURL" className="sr-only">
                  Thread URL
                </label>
                <div className="grid grid-cols-1 sm:flex-auto">
                  <input
                    type="text"
                    name="threadURL"
                    id="threadURL"
                    className="peer relative col-start-1 row-start-1 border-0 bg-transparent py-1.5 text-gray-900 placeholder:text-gray-400 focus:ring-0 sm:text-sm sm:leading-6"
                    placeholder="Enter a BlueSky Post URL"
                    value={threadURL}
                    onChange={(e) => setThreadURL(e.target.value)}
                  />
                  <div
                    className="col-start-1 col-end-3 row-start-1 rounded-md shadow-sm ring-1 ring-inset ring-gray-300 peer-focus:ring-2 peer-focus:ring-indigo-600"
                    aria-hidden="true"
                  />
                </div>
                <div className="mt-3 sm:ml-4 sm:mt-0 sm:flex-shrink-0">
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      // Parse User Handle or DID and Post ID from Thread URL
                      if (!threadURL) {
                        setError("Please enter a valid URL");
                        return;
                      }
                      try {
                        const url = new URL(threadURL);
                        const path = url.pathname.split("/");
                        const postID = path[path.length - 1];
                        const author = path[path.length - 3];
                        if (!postID || !author) {
                          setError(
                            "Couldn't parse Post ID and Author from URL"
                          );
                          return;
                        }
                        if (author.startsWith("did:plc:")) {
                          navigate(
                            `/thread/view?author_did=${author}&post=${postID}`
                          );
                        } else {
                          navigate(
                            `/thread/view?author_handle=${author}&post=${postID}`
                          );
                        }
                      } catch (e) {
                        setError(`Please enter a valid URL: ${e}`);
                        return;
                      }
                    }}
                    className="block w-full rounded-md bg-indigo-600 px-3 py-2 text-center text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
                  >
                    Visualize Thread
                  </button>
                </div>
              </form>
            </div>
          </div>
          <footer className="text-center w-full mt-4">
            <div className="mx-auto max-w-7xl px-2">
              <span className="footer-text text-xs">
                Built by{" "}
                <a
                  href="https://bsky.app/profile/jaz.bsky.social"
                  target="_blank"
                  className="font-bold underline-offset-1 underline"
                >
                  jaz
                </a>
                {" 🏳️‍⚧️"}
              </span>
              <span className="footer-text text-xs">
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
      </div>
    </div>
  );
};

export default ThreadSearch;
