import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import ErrorMsg from "./ErrorMsg";
import { UserMinusIcon } from "@heroicons/react/24/solid";
import SuccessMsg from "./SuccessMsg";

const OptOut: React.FC<{}> = () => {
  const [username, setUsername] = React.useState<string>("");
  const [appPassword, setAppPassword] = React.useState<string>("");
  const [error, setError] = React.useState<string>("");
  const [success, setSuccess] = React.useState<string>("");

  useEffect(() => {
    document.title = "Opt Out of the Bluesky Atlas";
  }, []);

  return (
    <div className="bg-white">
      <div className="mx-auto max-w-7xl py-24 sm:px-6 sm:py-32 lg:px-8">
        <div className="relative isolate overflow-hidden bg-gray-50 px-6 py-24 text-center shadow-md sm:rounded-3xl sm:px-16">
          <div className="mx-auto max-w-md sm:max-w-3xl">
            {error && (
              <div className="text-left mb-2">
                <ErrorMsg error={error} dismiss={() => setError("")} />
              </div>
            )}
            {success && (
              <div className="text-left mb-2">
                <SuccessMsg Msg={success} dismiss={() => setSuccess("")} />
              </div>
            )}
            <div>
              <div className="text-center">
                <UserMinusIcon className="mx-auto h-12 w-12 text-gray-800" />
                <h2 className="mt-2 text-base font-semibold leading-6 text-gray-900">
                  Opt Out of the Atlas
                </h2>
                <p className="mt-3 text-sm text-gray-500">
                  Opting Out from the Atlas will remove your Bluesky Handle and
                  DID from any future Atlas updates.
                </p>
                <p className="mt-3 text-sm text-gray-500">
                  Atlas updates are infrequent (usually around once a week) so
                  it may take some time for your Handle to be removed from the
                  currently visible graph.
                </p>
                <p className="mt-3 text-sm text-gray-500">
                  Generate an AppPassword for use{" "}
                  <a href="https://bsky.app/settings/app-passwords">here</a> and
                  enter it below so we can confirm your identity before opting
                  out.
                </p>
              </div>
              <form className="mt-6 sm:flex sm:items-center" action="#">
                <label htmlFor="username" className="sr-only">
                  BSky Username or Email Address
                </label>
                <div className="grid grid-cols-1 sm:flex-auto mx-2">
                  <input
                    type="text"
                    name="username"
                    id="username"
                    className="peer relative col-start-1 row-start-1 border-0 bg-transparent py-1.5 text-gray-900 placeholder:text-gray-400 focus:ring-0 sm:text-sm sm:leading-6"
                    placeholder="BSky Username or Email Address"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                  />
                  <div
                    className="col-start-1 col-end-3 row-start-1 rounded-md shadow-sm ring-1 ring-inset ring-gray-300 peer-focus:ring-2 peer-focus:ring-indigo-600"
                    aria-hidden="true"
                  />
                </div>
                <div className="grid grid-cols-1 sm:flex-auto">
                  <input
                    name="appPassword"
                    id="appPassword"
                    type="password"
                    className="peer relative col-start-1 row-start-1 border-0 bg-transparent py-1.5 text-gray-900 placeholder:text-gray-400 focus:ring-0 sm:text-sm sm:leading-6"
                    placeholder="BSky AppPassword"
                    value={appPassword}
                    onChange={(e) => setAppPassword(e.target.value)}
                  />
                  <div
                    className="col-start-1 col-end-3 row-start-1 rounded-md shadow-sm ring-1 ring-inset ring-gray-300 peer-focus:ring-2 peer-focus:ring-indigo-600"
                    aria-hidden="true"
                  />
                </div>
                <div className="mt-3 sm:ml-4 sm:mt-0 sm:flex-shrink-0">
                  <button
                    onClick={(e) => {
                      // Make a request to https://bsky-search.jazco.io/opt_out with the username and appPassword in the body
                      e.preventDefault();
                      fetch("https://bsky-search.jazco.io/opt_out", {
                        method: "POST",
                        headers: {
                          "Content-Type": "application/json",
                        },
                        body: JSON.stringify({
                          username,
                          appPassword,
                        }),
                      })
                        .then((res) => res.json())
                        .then((res) => {
                          if (res.error) {
                            setError(res.error);
                          } else {
                            setSuccess(res.message);
                          }
                        });
                    }}
                    className="block w-full rounded-md bg-indigo-600 px-3 py-2 text-center text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
                  >
                    Opt Out
                  </button>
                </div>
              </form>
              <p className="mt-3 text-sm text-gray-500">
                Feel free to delete your App Password after you have opted out,
                the opt-out flag is stored in the Atlas's database and your app
                password is only used to validate your identity with the BSky
                API before being deleted prior to returning a response to this
                page.
              </p>
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

export default OptOut;
