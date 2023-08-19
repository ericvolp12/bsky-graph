import { FC, useEffect, useState } from "react";
import ErrorMsg from "../threads/ErrorMsg";
import { useSearchParams } from "react-router-dom";

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

  const resolveDid = async (did: string): Promise<string> => {
    did = did.toLowerCase();
    if (handles.has(did)) {
      return handles.get(did) as string;
    }

    try {
      const resp = await fetch(`https://plc.jazco.io/${did}`);
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
      handles.set(did, didData.handle);
      return didData.handle;
    } catch (e: any) {
      throw new Error(e.message);
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

  return (
    <div className="bg-white">
      <div className="mx-auto max-w-7xl py-4 sm:py-24 sm:px-6 lg:px-8">
        <div className="relative isolate overflow-hidden bg-gray-50 px-3 sm:px-16 py-4 sm:py-24 text-center shadow-md sm:rounded-3xl">
          <div className="mx-auto max-w-7xl">
            {error && (
              <div className="text-left mb-2">
                <ErrorMsg error={error} />
              </div>
            )}
            <div>
              <h1 className="text-3xl font-extrabold text-gray-900 sm:text-4xl">
                Bluesky Walker
              </h1>
              <p className="mt-4 text-lg leading-6 text-gray-500">
                This is a simple tool to help you explore a Bluesky repo.
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
                    placeholder="Enter a BlueSky Handle or DID"
                    value={candidate}
                    onChange={(e) => setCandidate(e.target.value)}
                  />
                  <div
                    className="col-start-1 col-end-3 row-start-1 rounded-md shadow-sm ring-1 ring-inset ring-gray-300 peer-focus:ring-2 peer-focus:ring-indigo-600"
                    aria-hidden="true"
                  />
                </div>
                <div className="mt-3 sm:ml-4 sm:mt-0 sm:flex-shrink-0">
                  <button
                    onClick={async (e) => {
                      e.preventDefault();
                      setError("");
                      let repoDid = "";
                      setSearchParams({ user: candidate.toLowerCase() });
                      if (candidate.startsWith("did:")) {
                        repoDid = candidate;
                      } else {
                        try {
                          const resp = await fetch(
                            `https://plc.jazco.io/${candidate.toLowerCase()}`
                          );

                          if (!resp.ok) {
                            let errorMsg =
                              "An error occurred while resolving the handle.";
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
                          console.log(didData);
                          repoDid = didData.did;
                        } catch (e: any) {
                          setError(e.message);
                          setLoading(false);
                          return;
                        }
                      }
                      setDid(repoDid);
                      getRepo(repoDid);
                    }}
                    className="block w-full rounded-md bg-indigo-600 px-3 py-2 text-center text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
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
                      "Walk Repo"
                    )}
                  </button>
                </div>
              </form>
              {repo && (
                <div>
                  <div className="flex gap-2 justify-center">
                    <div className="mt-6 w-auto flex">
                      <div className="bg-white overflow-hidden shadow rounded-lg">
                        <div className="px-4 py-5 sm:p-6 sm:px-10">
                          <h3 className="text-lg leading-6 font-medium text-gray-500">
                            Profile
                          </h3>
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
                      </div>
                    </div>
                    <div className="mt-6 w-auto flex">
                      <div className="bg-white overflow-hidden shadow rounded-lg px-5">
                        <div className="px-4 py-5 sm:p-6">
                          <h3 className="text-lg leading-6 font-medium text-gray-500">
                            Stats
                          </h3>
                          <div className="mt-2 max-w-xl text-sm text-gray-900 text-left">
                            <p className="text-xl">
                              <a href="#posts" className="hover:underline">
                                Posts
                              </a>
                              : {repo?.posts.length.toLocaleString()}
                            </p>
                            <p className="text-xl">
                              <a href="#reposts" className="hover:underline">
                                Reposts
                              </a>
                              : {repo?.reposts.length.toLocaleString()}
                            </p>
                            <p className="text-xl">
                              <a href="#likes" className="hover:underline">
                                Likes
                              </a>
                              : {repo?.likes.length.toLocaleString()}
                            </p>
                            <p className="text-xl">
                              <a href="#follows" className="hover:underline">
                                Follows
                              </a>
                              : {repo?.follows.length.toLocaleString()}
                            </p>
                            <p className="text-xl">
                              Blocks: {repo?.blocks.length.toLocaleString()}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-wrap">
                    <div className="mt-6 max-w-xl flex overflow-hidden flex-col basis-1/2">
                      <h3 className="text-2xl font-medium text-gray-900 text-left">
                        <a id="posts" href="#posts">
                          Posts
                        </a>
                      </h3>
                      <ol className="border-l border-neutral-300 dark:border-neutral-500 mt-2 ml-2">
                        {repo?.posts.map((post, idx) => (
                          <li key={idx}>
                            <div className="flex-start flex items-center pt-3">
                              <div className="-ml-[5px] mr-3 h-[9px] w-[9px] rounded-full bg-neutral-300"></div>
                              <p className="text-sm text-gray-400 ">
                                <a
                                  href={`https://bsky.app/profile/${
                                    post.uri.split("/")[2]
                                  }/post/${post.uri.split("/")[4]}`}
                                  className="hover:underline"
                                  target="_blank"
                                >
                                  {post.content.createdAt}
                                </a>
                              </p>
                            </div>
                            <div className="mb-6 ml-4 mt-2 text-left">
                              <p className="mb-3 text-gray-800 break-normal">
                                {post.content.text}
                              </p>
                            </div>
                          </li>
                        ))}
                      </ol>
                      <h3 className="text-2xl font-medium text-gray-900 text-left">
                        <a id="follows" href="#follows">
                          Follows
                        </a>
                      </h3>
                      <ol className="border-l border-neutral-300 dark:border-neutral-500 mt-2 ml-2">
                        {repo?.follows.map((follow, idx) => (
                          <li key={idx}>
                            <div className="flex-start flex items-center pt-3">
                              <div className="-ml-[5px] mr-3 h-[9px] w-[9px] rounded-full bg-neutral-300"></div>
                              <p className="text-sm text-gray-400 ">
                                <a
                                  href={`https://bsky.app/profile/${follow.content.subject}`}
                                  className="hover:underline"
                                  target="_blank"
                                >
                                  {follow.content.createdAt}
                                </a>
                              </p>
                            </div>
                            <div className="mb-6 ml-4 mt-2 text-left">
                              <p className="mb-3 text-gray-800 break-normal">
                                Followed{" "}
                                {handles.has(follow.content.subject)
                                  ? handles.get(follow.content.subject)
                                  : follow.content.subject}
                              </p>
                            </div>
                          </li>
                        ))}
                      </ol>
                      <h3 className="text-2xl font-medium text-gray-900 text-left">
                        <a id="reposts" href="#reposts">
                          Reposts
                        </a>
                      </h3>
                      <ol className="border-l border-neutral-300 dark:border-neutral-500 mt-2 ml-2">
                        {repo?.reposts.map((repost, idx) => (
                          <li key={idx}>
                            <div className="flex-start flex items-center pt-3">
                              <div className="-ml-[5px] mr-3 h-[9px] w-[9px] rounded-full bg-neutral-300"></div>
                              <p className="text-sm text-gray-400 ">
                                <a
                                  href={`https://bsky.app/profile/${
                                    repost.content.subject.uri.split("/")[2]
                                  }/post/${
                                    repost.content.subject.uri.split("/")[4]
                                  }`}
                                  className="hover:underline"
                                  target="_blank"
                                >
                                  {repost.content.createdAt}
                                </a>
                              </p>
                            </div>
                            <div className="mb-6 ml-4 mt-2 text-left">
                              <p className="mb-3 text-gray-800 break-normal">
                                Post by{" "}
                                {handles.has(
                                  repost.content.subject.uri.split("/")[2]
                                )
                                  ? handles.get(
                                      repost.content.subject.uri.split("/")[2]
                                    )
                                  : repost.content.subject.uri.split("/")[2]}
                              </p>
                            </div>
                          </li>
                        ))}
                      </ol>
                    </div>
                    <div className="mt-6 max-w-xl flex overflow-hidden flex-col basis-1/2">
                      <h3 className="text-2xl font-medium text-gray-900 text-right">
                        <a id="likes" href="#likes">
                          Likes
                        </a>
                      </h3>
                      <ol className="border-r border-neutral-300 dark:border-neutral-500 mt-2 mr-2">
                        {repo?.likes.map((like, idx) => (
                          <li key={idx}>
                            <div className="items-center pt-3 text-right flex justify-end ml-auto">
                              <p className="text-sm text-gray-400">
                                <a
                                  href={`https://bsky.app/profile/${
                                    like.content.subject.uri.split("/")[2]
                                  }/post/${
                                    like.content.subject.uri.split("/")[4]
                                  }`}
                                  className="hover:underline"
                                  target="_blank"
                                >
                                  {like.content.createdAt}
                                </a>
                              </p>
                              <div className="-mr-[5px] ml-3 h-[9px] w-[9px] rounded-full bg-neutral-300"></div>
                            </div>
                            <div className="mb-6 mr-4 mt-2 text-right">
                              <p className="mb-3 text-gray-800 break-normal">
                                Post by{" "}
                                {handles.has(
                                  like.content.subject.uri.split("/")[2]
                                )
                                  ? handles.get(
                                      like.content.subject.uri.split("/")[2]
                                    )
                                  : like.content.subject.uri.split("/")[2]}
                              </p>
                            </div>
                          </li>
                        ))}
                      </ol>
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
