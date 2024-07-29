import { CloudArrowDownIcon } from "@heroicons/react/24/solid";
import { FC, useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import ErrorMsg from "../threads/ErrorMsg";

interface Subject {
  cid: string;
  uri: string;
}
interface Post {
  uri: string;
  content: {
    createdAt: string;
    text: string;
  };
}
interface Repost {
  uri: string;
  content: {
    createdAt: string;
    subject: Subject;
  };
}
interface Like {
  uri: string;
  content: {
    createdAt: string;
    subject: Subject;
  };
}
interface Follow {
  uri: string;
  content: {
    createdAt: string;
    subject: string;
  };
}
interface Block {
  uri: string;
  content: {
    createdAt: string;
    subject: string;
  };
}
interface Profile {
  uri: string;
  content: {
    displayName: string;
    description: string;
  };
}

interface Repo {
  profile: Profile;
  posts: Post[];
  reposts: Repost[];
  likes: Like[];
  follows: Follow[];
  blocks: Block[];
}

const RepoWalker: FC<{}> = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [error, setError] = useState<string>("");
  const [repo, setRepo] = useState<Repo | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [downloading, setDownloading] = useState<boolean>(false);
  const [candidate, setCandidate] = useState<string>("");
  const [did, setDid] = useState<string>("");
  const [handles, setHandles] = useState<Map<string, string>>(new Map());

  useEffect(() => {
    document.title = "Bluesky Repo Walker";
  }, []);

  useEffect(() => {
    const userFromParams = searchParams.get("user");
    if (userFromParams !== null && did === "" && repo === null) {
      setCandidate(userFromParams);
      resolveHandleOrDid(userFromParams).then((repoDid) => {
        setDid(repoDid);
        getRepo(repoDid);
      });
    }
  }, [searchParams]);

  const getRepo = async (repoDid: string) => {
    setLoading(true);
    setError("");
    try {
      const resp = await fetch(`https://bsky-search.jazco.io/repo/${repoDid}`);

      // Check for non-200 status codes.
      if (!resp.ok) {
        let errorMsg = "An error occurred while fetching the repository.";
        try {
          const errorData = await resp.json();
          // Use the error message from the server if available.
          if ("error" in errorData) {
            errorMsg = errorData.error;
          }
        } catch (parseError: any) {
          // If parsing fails, use the generic error message.
        }
        throw new Error(errorMsg);
      }

      const repoData = await resp.json();
      if ("error" in repoData) {
        throw new Error(repoData.error);
      }

      const dids: Set<string> = new Set();
      if (repoData.likes && repoData.likes.length > 0) {
        for (let i = 0; i < repoData.likes.length; i++) {
          const like = repoData.likes[i];
          dids.add(like.content.subject.uri.split("/")[2]);
        }
      }
      if (repoData.follows && repoData.follows.length > 0) {
        for (let i = 0; i < repoData.follows.length; i++) {
          const follow = repoData.follows[i];
          dids.add(follow.content.subject);
        }
      }
      if (repoData.blocks && repoData.blocks.length > 0) {
        for (let i = 0; i < repoData.blocks.length; i++) {
          const block = repoData.blocks[i];
          dids.add(block.content.subject);
        }
      }
      if (repoData.reposts && repoData.reposts.length > 0) {
        for (let i = 0; i < repoData.reposts.length; i++) {
          const repost = repoData.reposts[i];
          dids.add(repost.content.subject.uri.split("/")[2]);
        }
      }

      // Resolve all the DIDs in a big batch.
      await resolveDidBatch(Array.from(dids));

      console.log(repoData);
      setRepo(repoData);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const resolveHandleOrDid = async (handleOrDid: string): Promise<string> => {
    setError("");
    let repoDid = "";
    if (handleOrDid.startsWith("did:")) {
      repoDid = handleOrDid;
    } else {
      try {
        const resp = await fetch(
          `https://plc.jazco.io/${handleOrDid.toLowerCase()}`
        );

        if (!resp.ok) {
          let errorMsg = "An error occurred while resolving the handle.";
          try {
            const errorData = await resp.json();
            if ("error" in errorData) {
              errorMsg = errorData.error;
              if (errorMsg === "redis: nil") {
                errorMsg = "Handle not found.";
              }
            }
          } catch (parseError: any) {
            // If parsing fails, use the generic error message.
          }
          throw new Error(errorMsg);
        }

        const didData = await resp.json();
        repoDid = didData.did;
      } catch (e: any) {
        setError(e.message);
        setLoading(false);
        return "";
      }
    }
    return repoDid;
  };

  const resolveDidBatch = async (dids: string[]) => {
    dids = dids.map((did) => did.toLowerCase());
    try {
      const resp = await fetch(`https://plc.jazco.io/batch/by_did`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(dids),
      });
      if (!resp.ok) {
        let errorMsg = "An error occurred while resolving the handle.";
        try {
          const errorData = await resp.json();
          if ("error" in errorData) {
            errorMsg = errorData.error;
            if (errorMsg === "redis: nil") {
              errorMsg = "Handle not found.";
            }
          }
        } catch (parseError: any) {
          // If parsing fails, use the generic error message.
        }
        throw new Error(errorMsg);
      }

      const didData: any[] = await resp.json();
      didData?.forEach((doc) => {
        handles.set(doc.did, doc.handle);
      });

      console.log(handles);

      setHandles(handles);
    } catch (e: any) {
      throw new Error(e.message);
    }
  };

  const handleButtonClick = async (e: any): Promise<string> => {
    e.preventDefault();
    setError("");
    let repoDid = "";
    if (candidate.startsWith("did:")) {
      repoDid = candidate;
    } else {
      try {
        const resp = await fetch(
          `https://plc.jazco.io/${candidate.toLowerCase()}`
        );

        if (!resp.ok) {
          let errorMsg = "An error occurred while resolving the handle.";
          try {
            const errorData = await resp.json();
            if ("error" in errorData) {
              errorMsg = errorData.error;
              if (errorMsg === "redis: nil") {
                errorMsg = "Handle not found.";
              }
            }
          } catch (parseError: any) {
            // If parsing fails, use the generic error message.
          }
          throw new Error(errorMsg);
        }

        const didData = await resp.json();
        repoDid = didData.did;
      } catch (e: any) {
        setError(e.message);
        setLoading(false);
        return "";
      }
    }
    return repoDid;
  };

  return (
    <div className="bg-white">
      <div className="mx-auto max-w-7xl py-4 sm:py-24 sm:px-6 lg:px-8">
        <div className="relative isolate overflow-hidden bg-gray-50 px-3 sm:px-6 py-4 sm:py-24 shadow-md sm:rounded-3xl">
          <div className="mx-auto max-w-7xl">
            {error && (
              <div className="text-left mb-2">
                <ErrorMsg error={error} />
              </div>
            )}
            <div>
              <h1 className="text-3xl font-bold text-gray-900 sm:text-4xl text-center">
                Bluesky Walker
              </h1>
              <p className="mt-4 text-lg leading-6 text-gray-500 text-center">
                A tool to help you explore the public contents of a Bluesky repo
              </p>
              <form
                className="mt-6 sm:flex sm:items-center max-w-2xl mx-auto"
                action="#"
              >
                <label htmlFor="threadURL" className="sr-only">
                  Thread URL
                </label>
                <div className="grid grid-cols-1 sm:flex-auto">
                  <input
                    type="text"
                    name="threadURL"
                    id="threadURL"
                    className="peer relative col-start-1 row-start-1 border-0 bg-transparent py-1.5 text-gray-900 placeholder:text-gray-400 focus:ring-0 sm:text-sm sm:leading-6"
                    placeholder="Enter a Bluesky Handle or DID"
                    value={candidate}
                    onChange={(e) => setCandidate(e.target.value)}
                  />
                  <div
                    className="col-start-1 col-end-3 row-start-1 rounded-md shadow-sm ring-1 ring-inset ring-gray-300 peer-focus:ring-2 peer-focus:ring-indigo-600"
                    aria-hidden="true"
                  />
                </div>
                <div className="mt-3 sm:ml-4 sm:mt-0 sm:flex-shrink-0 flex">
                  <button
                    onClick={async (e) => {
                      e.preventDefault();
                      setLoading(true);
                      const repoDid = await handleButtonClick(e);
                      setSearchParams({ user: candidate.toLowerCase() });
                      setDid(repoDid);
                      getRepo(repoDid);
                    }}
                    className="block mr-2 w-full rounded-md bg-indigo-600 px-3 py-2 text-center text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
                  >
                    {loading ? (
                      <svg
                        className="animate-spin h-5 w-5 text-white inline-block"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        />
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                        />
                      </svg>
                    ) : (
                      <span className="whitespace-nowrap">Explore Repo</span>
                    )}
                  </button>
                  <button
                    onClick={async (e) => {
                      e.preventDefault();
                      setDownloading(true);
                      const repoDid = await handleButtonClick(e);
                      const resp = await fetch(
                        `https://bsky.network/xrpc/com.atproto.sync.getRepo?did=${repoDid}`,
                        {
                          headers: {
                            "Content-Type": "application/vnd.ipld.car",
                          },
                        }
                      );

                      const blob = await resp.blob();
                      const url = window.URL.createObjectURL(blob);
                      const a = document.createElement("a");
                      a.href = url;
                      a.download = `${repoDid}.car`;
                      document.body.appendChild(a);
                      a.click();
                      a.remove();
                      setDownloading(false);
                    }}
                    className="block mr-2 w-full rounded-md bg-green-600 px-3 py-2 text-center text-sm font-semibold text-white shadow-sm hover:bg-green-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-green-600"
                  >
                    {downloading ? (
                      <svg
                        className="animate-spin h-5 w-5 text-white inline-block"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        />
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                        />
                      </svg>
                    ) : (
                      <CloudArrowDownIcon className="h-5 w-5 inline-block" />
                    )}
                  </button>
                </div>
              </form>
              {repo && (
                <div>
                  <div className="flex gap-2 justify-center">
                    <div className="mt-6 w-auto flex">
                      <div className="bg-white overflow-hidden shadow rounded-lg flex flex-wrap justify-center">
                        <div className="py-2 pl-6 pr-4">
                          <div className="mt-2 max-w-xl text-sm text-gray-900">
                            <p className="text-xl">
                              {repo?.profile.content.displayName}
                            </p>
                            <p>
                              {repo?.profile.content.description
                                .split("\n")
                                .map((line, idx) => (
                                  <span key={idx}>
                                    {line}
                                    <br />
                                  </span>
                                ))}
                            </p>
                          </div>
                        </div>
                        <div className="py-2 pr-6 pl-4">
                          <div className="mt-2 max-w-xl text-sm text-gray-900 text-left grid grid-cols-2">
                            <div>
                              <p>
                                <a href="#posts" className="hover:underline">
                                  Posts
                                </a>
                              </p>
                              <p>
                                <a href="#reposts" className="hover:underline">
                                  Reposts
                                </a>
                              </p>
                              <p>
                                <a href="#likes" className="hover:underline">
                                  Likes
                                </a>
                              </p>
                              <p>
                                <a href="#follows" className="hover:underline">
                                  Follows
                                </a>
                              </p>
                              <p>Blocks</p>
                            </div>
                            <div className="text-right">
                              <p>{repo?.posts.length.toLocaleString()}</p>
                              <p>{repo?.reposts.length.toLocaleString()}</p>
                              <p>{repo?.likes.length.toLocaleString()}</p>
                              <p>{repo?.follows.length.toLocaleString()}</p>
                              <p>{repo?.blocks.length.toLocaleString()}</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <div className="mt-6 max-w-xl flex overflow-hidden flex-col ">
                      <div className="p-5 mb-4 border border-gray-100 rounded-lg bg-white  ">
                        <a
                          id="posts"
                          href="#posts"
                          className="text-lg font-semibold text-gray-900 "
                        >
                          Posts
                        </a>
                        <ol className="mt-3 divide-y divider-gray-200 ">
                          {repo?.posts.map((post, idx) => (
                            <li key={idx}>
                              <a
                                href={`https://bsky.app/profile/${did}/post/${
                                  post.uri.split("/")[4]
                                }`}
                                target="_blank"
                                className="items-center block p-3 sm:flex hover:bg-gray-50 "
                              >
                                <div className="text-gray-600 ">
                                  <div className="text-base font-normal">
                                    <span className="font-medium text-gray-900 ">
                                      {handles.get(did)}
                                    </span>
                                  </div>
                                  <div className="text-sm font-normal">
                                    {post.content.text}
                                  </div>
                                  <span className="inline-flex items-center text-xs font-normal text-gray-500 ">
                                    {post.content.createdAt}
                                  </span>
                                </div>
                              </a>
                            </li>
                          ))}
                        </ol>
                      </div>
                      <div className="p-5 mb-4 border border-gray-100 rounded-lg bg-white  ">
                        <a
                          id="follows"
                          href="#follows"
                          className="text-lg font-semibold text-gray-900 "
                        >
                          Follows
                        </a>
                        <ol className="mt-3 divide-y divider-gray-200 ">
                          {repo?.follows.map((follow, idx) => (
                            <li key={idx}>
                              <a
                                href={`https://bsky.app/profile/${follow.content.subject}`}
                                target="_blank"
                                className="items-center block p-3 sm:flex hover:bg-gray-50 "
                              >
                                <div className="text-gray-600 ">
                                  <div className="text-base font-normal">
                                    <span className="font-medium text-gray-900 ">
                                      {handles.get(did)}
                                    </span>{" "}
                                    followed{" "}
                                    <span className="font-medium text-gray-900 ">
                                      {handles.has(follow.content.subject)
                                        ? handles.get(follow.content.subject)
                                        : follow.content.subject}
                                    </span>
                                  </div>
                                  <span className="inline-flex items-center text-xs font-normal text-gray-500 ">
                                    {follow.content.createdAt}
                                  </span>
                                </div>
                              </a>
                            </li>
                          ))}
                        </ol>
                      </div>
                      <div className="p-5 mb-4 border border-gray-100 rounded-lg bg-white  ">
                        <a
                          id="reposts"
                          href="#reposts"
                          className="text-lg font-semibold text-gray-900 "
                        >
                          Reposts
                        </a>
                        <ol className="mt-3 divide-y divider-gray-200 ">
                          {repo?.reposts.map((repost, idx) => (
                            <li key={idx}>
                              <a
                                href={`https://bsky.app/profile/${
                                  repost.content.subject.uri.split("/")[2]
                                }/post/${
                                  repost.content.subject.uri.split("/")[4]
                                }`}
                                target="_blank"
                                className="items-center block p-3 sm:flex hover:bg-gray-50 "
                              >
                                <div className="text-gray-600 ">
                                  <div className="text-base font-normal">
                                    <span className="font-medium text-gray-900 ">
                                      {handles.get(did)}
                                    </span>{" "}
                                    reposted a post by{" "}
                                    <span className="font-medium text-gray-900 ">
                                      {handles.has(
                                        repost.content.subject.uri.split("/")[2]
                                      )
                                        ? handles.get(
                                            repost.content.subject.uri.split(
                                              "/"
                                            )[2]
                                          )
                                        : repost.content.subject.uri.split(
                                            "/"
                                          )[2]}
                                    </span>
                                  </div>
                                  <span className="inline-flex items-center text-xs font-normal text-gray-500 ">
                                    {repost.content.createdAt}
                                  </span>
                                </div>
                              </a>
                            </li>
                          ))}
                        </ol>
                      </div>
                    </div>
                    <div className="mt-6 max-w-xl flex overflow-hidden flex-col">
                      <div className="p-5 mb-4 border border-gray-100 rounded-lg bg-white  ">
                        <a
                          id="likes"
                          href="#likes"
                          className="text-lg font-semibold text-gray-900 "
                        >
                          Likes
                        </a>
                        <ol className="mt-3 divide-y divider-gray-200 ">
                          {repo?.likes.map((like, idx) => (
                            <li key={idx}>
                              <a
                                href={`https://bsky.app/profile/${
                                  like.content.subject.uri.split("/")[2]
                                }/post/${
                                  like.content.subject.uri.split("/")[4]
                                }`}
                                target="_blank"
                                className="items-center block p-3 sm:flex hover:bg-gray-50 "
                              >
                                <div className="text-gray-600 ">
                                  <div className="text-base font-normal">
                                    <span className="font-medium text-gray-900 ">
                                      {handles.get(did)}
                                    </span>{" "}
                                    liked a post by{" "}
                                    <span className="font-medium text-gray-900 break-all">
                                      {handles.has(
                                        like.content.subject.uri.split("/")[2]
                                      )
                                        ? handles.get(
                                            like.content.subject.uri.split(
                                              "/"
                                            )[2]
                                          )
                                        : like.content.subject.uri.split(
                                            "/"
                                          )[2]}
                                    </span>
                                  </div>
                                  <span className="inline-flex items-center text-xs font-normal text-gray-500 ">
                                    {like.content.createdAt}
                                  </span>
                                </div>
                              </a>
                            </li>
                          ))}
                        </ol>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
          <footer className="text-center w-full">
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

export default RepoWalker;
