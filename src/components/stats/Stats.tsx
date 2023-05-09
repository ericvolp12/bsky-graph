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

interface AuthorStatsResponse {
  total_authors: number;
  mean_post_count: number;
  percentiles: Percentile[];
  brackets: Bracket[];
  updated_at: string;
}

const Stats: FC<{}> = () => {
  const [stats, setStats] = useState<AuthorStatsResponse | null>(null);
  const [error, setError] = useState<string>("");

  useEffect(() => {
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
                      Aggregate stats for all authors in Jaz's BlueSky index.
                    </div>
                  </div>
                </div>
                <dl className="grid grid-cols-1 gap-x-8 gap-y-2 lg:gap-y-16 text-center lg:grid-cols-6 max-w-lg mx-auto">
                  {stats && (
                    <div className="mx-auto flex max-w-xs flex-col lg:gap-y-4 gap-y-1 col-span-3">
                      <dt className="text-base leading-7 text-gray-600">
                        Total Authors
                      </dt>
                      <dd className="order-first text-3xl font-semibold tracking-tight text-gray-900 sm:text-5xl">
                        {stats.total_authors.toLocaleString()}
                      </dd>
                    </div>
                  )}
                  {stats && (
                    <div className="mx-auto flex max-w-xs flex-col lg:gap-y-4 gap-y-1 col-span-3">
                      <dt className="text-base leading-7 text-gray-600">
                        Mean Post Count
                      </dt>
                      <dd className="order-first text-3xl font-semibold tracking-tight text-gray-900 sm:text-5xl">
                        {stats.mean_post_count.toLocaleString()}
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
                    <dl className="grid grid-cols-1 gap-x-8 gap-y-2 lg:gap-y-16 text-center lg:grid-cols-5">
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
