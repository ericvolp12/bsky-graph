import { FC, useEffect, useState } from "react";
import ErrorMsg from "../threads/ErrorMsg";
import { formatDistanceToNow, parseISO } from "date-fns";

interface Percentile {
  percentile: number;
  count: number;
}

interface Bracket {
  min: number;
  count: number;
}

interface TopPoster {
  handle: string;
  did: string;
  post_count: number;
}

interface AuthorStatsResponse {
  total_authors: number;
  total_users: number;
  total_posts: number;
  hellthread_posts: number;
  mean_post_count: number;
  percentiles: Percentile[];
  brackets: Bracket[];
  updated_at: string;
  top_posters: TopPoster[];
}

const badgeClasses = [
  "bg-yellow-200 text-yellow-900",
  "bg-slate-200 text-slate-800",
  "bg-orange-200 text-orange-800",
  "bg-emerald-50 text-emerald-800",
];

const Stats: FC<{}> = () => {
  const [stats, setStats] = useState<AuthorStatsResponse | null>(null);
  const [error, setError] = useState<string>("");
  const [showTopPosters, setShowTopPosters] = useState<boolean>(false);

  useEffect(() => {
    document.title = "Stats for BlueSky by Jaz (jaz.bsky.social)";
  }, []);

  const getMillionString = (num: number) => {
    if (num < 1000000) return num.toLocaleString();
    return `${(num / 1000000).toFixed(2)}M`;
  };

  const refreshStats = () => {
    fetch("https://bsky-search.jazco.io/stats")
      .then((res) => res.json())
      .then((res: AuthorStatsResponse) => {
        // If the response has an updated_at from the future, set it to a second ago
        if (res.updated_at > new Date().toISOString()) {
          res.updated_at = new Date(Date.now() - 1000).toISOString();
        }
        setStats(res);
      })
      .catch((err) => {
        setError(err.message);
      });
  };

  useEffect(() => {
    refreshStats();
    // Refresh stats every 5 minutes
    const interval = setInterval(() => {
      refreshStats();
    }, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="bg-white">
      <div className="mx-auto max-w-7xl lg:py-24 sm:px-6 sm:py-32 lg:px-8">
        <div className="relative isolate overflow-hidden bg-gray-50 px-6 py-24 text-center shadow-md sm:rounded-3xl sm:px-16">
          <div className="mx-auto max-w-7xl">
            {error && (
              <div className="text-left mb-2">
                <ErrorMsg error={error} />
              </div>
            )}
            <div>
              <div className="text-3xl font-bold text-gray-900  sm:text-4xl">
                BlueSky Post Count and Author Stats
              </div>
              <div className="lg:mt-8 mt-2">
                <div className="py-8 mt-2 text-center">
                  <div className="mx-auto max-w-7xl px-6 lg:px-8">
                    <div className="text-gray-700 text-lg font-semibold">
                      Aggregate stats for all posts in Jaz's BlueSky index.
                    </div>
                  </div>
                </div>
                <dl className="grid grid-cols-1 gap-x-8 gap-y-2 lg:gap-y-16 text-center lg:grid-cols-5 max-w-5xl mx-auto">
                  {stats && (
                    <div className="mx-auto flex max-w-xs flex-col lg:gap-y-4 gap-y-1">
                      <dt className="text-base leading-7 text-gray-600">
                        Users
                      </dt>
                      <dd className="order-first text-3xl font-semibold tracking-tight text-gray-900 sm:text-5xl">
                        {stats.total_users.toLocaleString()}
                      </dd>
                    </div>
                  )}
                  {stats && (
                    <div className="mx-auto flex max-w-xs flex-col lg:gap-y-4 gap-y-1">
                      <dt className="text-base leading-7 text-gray-600">
                        Post Authors
                      </dt>
                      <dd className="order-first text-3xl font-semibold tracking-tight text-gray-900 sm:text-5xl">
                        {stats.total_authors.toLocaleString()}
                      </dd>
                    </div>
                  )}
                  {stats && (
                    <div className="mx-auto flex max-w-xs flex-col lg:gap-y-4 gap-y-1">
                      <dt className="text-base leading-7 text-gray-600">
                        Mean Post Count
                      </dt>
                      <dd className="order-first text-3xl font-semibold tracking-tight text-gray-900 sm:text-5xl">
                        {stats.mean_post_count.toFixed(2)}
                      </dd>
                    </div>
                  )}
                  {stats && (
                    <div className="mx-auto flex max-w-xs flex-col lg:gap-y-4 gap-y-1">
                      <dt className="text-base leading-7 text-gray-600">
                        Total Posts
                      </dt>
                      <dd className="order-first text-3xl font-semibold tracking-tight text-gray-900 sm:text-5xl">
                        {getMillionString(stats.total_posts)}
                      </dd>
                    </div>
                  )}
                  {stats && (
                    <div className="mx-auto flex max-w-xs flex-col lg:gap-y-4 gap-y-1">
                      <dt className="text-base leading-7 text-gray-600">
                        Hellthread Posts
                      </dt>
                      <dd className="order-first text-3xl font-semibold tracking-tight text-gray-900 sm:text-5xl">
                        {getMillionString(stats.hellthread_posts)}
                      </dd>
                    </div>
                  )}
                </dl>
                <div className="py-8 mt-2 text-center">
                  <div className="mx-auto max-w-7xl px-6 lg:px-8">
                    <div className="text-gray-700 text-lg font-semibold">
                      Posts per User Percentiles
                    </div>
                  </div>
                  <div className="lg:mt-8 mt-2">
                    <dl className="grid grid-cols-1 gap-x-8 gap-y-2 lg:gap-y-16 text-center lg:grid-cols-6">
                      {stats &&
                        stats.percentiles.map((p, idx) => (
                          <div
                            className="mx-auto flex max-w-xs flex-col lg:gap-y-4 gap-y-1"
                            key={`p-${idx}`}
                          >
                            <dt className="text-base leading-7 text-gray-600">
                              {p.percentile * 100}th Percentile
                            </dt>
                            <dd className="order-first text-3xl font-semibold tracking-tight text-gray-900 sm:text-5xl">
                              {p.count.toLocaleString()}
                            </dd>
                          </div>
                        ))}
                    </dl>
                  </div>
                </div>
                <div className="py-8 mt-2 text-center">
                  <div className="mx-auto max-w-7xl px-6 lg:px-8">
                    <div className="text-gray-700 text-lg font-semibold">
                      Users with More Than <span className="italic">n</span>{" "}
                      Posts
                    </div>
                  </div>
                  <div className="lg:mt-8 mt-2">
                    <dl className="grid grid-cols-1 gap-x-8 gap-y-2 lg:gap-y-16 text-center lg:grid-cols-6">
                      {stats &&
                        stats.brackets.map((b, idx) => (
                          <div
                            className="mx-auto flex max-w-xs flex-col lg:gap-y-4 gap-y-1"
                            key={`b-${idx}`}
                          >
                            <dt className="text-base leading-7 text-gray-600">
                              {`>${b.min}`}
                            </dt>
                            <dd className="order-first text-3xl font-semibold tracking-tight text-gray-900 sm:text-5xl">
                              {b.count.toLocaleString()}
                            </dd>
                          </div>
                        ))}
                    </dl>
                  </div>
                </div>

                <div className="py-8 mt-2 text-center flex mx-auto flex-col w-fit">
                  <div className="flex justify-center align-middle">
                    <span className="ml-2 text-xl font-semibold text-gray-900">
                      Top 25 Poasters
                    </span>

                    <button
                      type="button"
                      onClick={() => {
                        setShowTopPosters(!showTopPosters);
                      }}
                      className={
                        `ml-2 mr-6 relative inline-flex items-center rounded-md  px-3 py-2 text-xs font-semibold text-white shadow-sm  focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2` +
                        (showTopPosters
                          ? " bg-indigo-600 hover:bg-indigo-500 focus-visible:outline-indigo-600"
                          : " bg-green-500 hover:bg-green-600 focus-visible:ring-green-500")
                      }
                    >
                      {showTopPosters ? "Hide" : "Show"}
                    </button>
                  </div>
                  {stats && showTopPosters && (
                    <div className="flex-shrink">
                      <ul
                        role="list"
                        className="divide-y divide-gray-200 overflow-auto flex-shrink"
                      >
                        {stats.top_posters.map((poster, idx) => (
                          <li
                            key={poster.did}
                            className="px-4 py-3 sm:px-6 flex-shrink"
                          >
                            <div className="flex items-center justify-between">
                              <div className="text-sm font-medium text-gray-900 truncate">
                                {idx + 1}.
                              </div>
                              <div className="text-sm font-medium text-gray-900 truncate px-4">
                                <a
                                  href={`https://staging.bsky.app/profile/${poster.handle}`}
                                  target="_blank"
                                >
                                  {poster.handle}
                                </a>
                              </div>
                              <div className="ml-2 flex-shrink-0 flex">
                                <span
                                  className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                    badgeClasses[
                                      idx < badgeClasses.length
                                        ? idx
                                        : badgeClasses.length - 1
                                    ]
                                  }`}
                                >
                                  {poster.post_count.toLocaleString()}
                                </span>
                              </div>
                            </div>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            </div>
            <div className="text-center mb-4">
              <div className="mx-auto max-w-7xl px-6 lg:px-8 space-y-2">
                <div className="text-gray-500 text-xs">
                  Post Data Collection started May 1st, 2023
                </div>
                <div className="text-gray-500 text-xs">
                  Total User Count is directly from the BlueSky API
                </div>
                <div className="text-gray-500 text-xs">
                  Large bot accounts are excluded from statistics and Top
                  Posters
                </div>
              </div>
            </div>
          </div>
          <footer className="text-center w-full -mb-20">
            <div className="mx-auto max-w-7xl px-2">
              <span className="footer-text text-xs">
                Built by{" "}
                <a
                  href="https://staging.bsky.app/profile/jaz.bsky.social"
                  target="_blank"
                  className="font-bold underline-offset-1 underline"
                >
                  jaz
                </a>
                {" 🏳️‍⚧️"}
              </span>
              <span className="footer-text text-xs">
                {" | "}
                {stats
                  ? formatDistanceToNow(parseISO(stats.updated_at), {
                      addSuffix: true,
                    })
                  : "loading..."}{" "}
                <img src="/update-icon.svg" className="inline-block h-4 w-4" />
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

export default Stats;
