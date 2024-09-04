import { FC, useEffect, useState } from "react";
import ErrorMsg from "../threads/ErrorMsg";
import { parseISO } from "date-fns";
import { DailyDatapoint, DailyBarChart } from "./Charts";
import CountUp from "react-countup";

interface Percentile {
  percentile: number;
  count: number;
}

interface FollowerPercentile {
  percentile: number;
  value: number;
}

interface Bracket {
  min: number;
  count: number;
}

interface AuthorStatsResponse {
  total_authors: number;
  total_users: number;
  total_posts: number;
  mean_post_count: number;
  percentiles: Percentile[];
  follower_percentiles: FollowerPercentile[];
  brackets: Bracket[];
  updated_at: string;
  daily_data: DailyDatapoint[];
}

const Stats: FC<{}> = () => {
  const [stats, setStats] = useState<AuthorStatsResponse | null>(null);
  const [error, setError] = useState<string>("");

  useEffect(() => {
    document.title = "Stats for Bluesky by Jaz (jaz.bsky.social)";
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
        // Filter daily_data up to the last full day
        res.daily_data = res.daily_data.filter((d) => {
          return (
            new Date(d.date).getTime() <
            new Date(new Date().toDateString()).getTime()
          );
        });
        res.daily_data = res.daily_data.sort((a, b) => {
          return new Date(a.date).getTime() - new Date(b.date).getTime();
        });
        res.daily_data = res.daily_data.map((d) => {
          if (d.num_images_with_alt_text && d.num_images) {
            d.alt_text_ratio = d.num_images_with_alt_text / d.num_images;
          }
          return d;
        });
        setStats(res);
      })
      .catch((err) => {
        setError(err.message);
      });
  };

  useEffect(() => {
    refreshStats();
    // Refresh stats every 30 seconds
    const interval = setInterval(() => {
      refreshStats();
    }, 30 * 1000);

    return () => clearInterval(interval);
  }, []);

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
              <div className="text-3xl font-bold text-gray-900  sm:text-4xl">
                Bluesky Post Count and Author Stats
              </div>
              <div className="lg:mt-8 mt-2">
                <div className="py-8 mt-2 text-center">
                  <div className="mx-auto max-w-7xl px-6 lg:px-8">
                    <div className="text-gray-700 text-lg font-semibold">
                      Aggregate stats for all posts in Jaz's Bluesky index.
                    </div>
                    <div className="text-gray-600 text-sm font-semibold mt-8">
                      WARNING: Since the recent massive influx of activity, the only accurate stats are for the total number of users and may not be updated as regularly.
                    </div>
                  </div>
                </div>
                <dl className="grid grid-cols-2 gap-x-8 gap-y-2 lg:gap-y-16 text-center lg:grid-cols-4 max-w-5xl mx-auto">
                  {stats && (
                    <div className="mx-auto flex max-w-xs flex-col lg:gap-y-4 gap-y-1">
                      <dt className="text-base leading-7 text-gray-600">
                        Users
                      </dt>
                      <dd className="order-first text-3xl font-semibold tracking-tight text-gray-900 sm:text-5xl">
                        <CountUp preserveValue={true} end={stats.total_users} />
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
                </dl>
                <div className="py-8 mt-2 space-y-8">
                  <DailyBarChart
                    data={stats?.daily_data || []}
                    columnFilter={["num_likers"]}
                    title="Daily Likers"
                    startOffset={90}
                  />
                  <DailyBarChart
                    data={stats?.daily_data || []}
                    columnFilter={["num_posters"]}
                    title="Daily Posters"
                    startOffset={90}
                  />
                  <DailyBarChart
                    data={stats?.daily_data || []}
                    columnFilter={["num_followers"]}
                    title="Daily Followers"
                    startOffset={90}
                  />
                </div>
                <div className="py-8 mt-2 text-center">
                  <div className="mx-auto max-w-7xl px-6 lg:px-8">
                    <div className="text-gray-700 text-lg font-semibold">
                      Posts per User Percentiles
                    </div>
                  </div>
                  <div className="lg:mt-8 mt-2">
                    <dl className="grid grid-cols-5 gap-x-2 lg:gap-x-8 gap-y-2 lg:gap-y-16 text-center lg:grid-cols-10 justify-center">
                      {stats &&
                        stats.percentiles.map((p, idx) => (
                          <div
                            className="mx-auto flex max-w-xs flex-col lg:gap-y-4 gap-y-1"
                            key={`p-${idx}`}
                          >
                            <dt className="text-base leading-7 text-gray-600">
                              {p.percentile * 100}th
                              <span className="hidden sm:block">
                                Percentile
                              </span>
                            </dt>
                            <dd className="order-first text-xl font-semibold tracking-tight text-gray-900 sm:text-3xl">
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
                      Followers per User Percentiles
                    </div>
                  </div>
                  <div className="lg:mt-8 mt-2">
                    <dl className="grid grid-cols-5 gap-x-2 lg:gap-x-8 gap-y-2 lg:gap-y-16 text-center lg:grid-cols-10 justify-center">
                      {stats &&
                        stats.follower_percentiles.map((p, idx) => (
                          <div
                            className="mx-auto flex max-w-xs flex-col lg:gap-y-4 gap-y-1"
                            key={`p-${idx}`}
                          >
                            <dt className="text-base leading-7 text-gray-600">
                              {p.percentile * 100}th
                              <span className="hidden sm:block">
                                Percentile
                              </span>
                            </dt>
                            <dd className="order-first text-xl font-semibold tracking-tight text-gray-900 sm:text-3xl">
                              {Math.floor(p.value).toLocaleString()}
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
                    <dl className="grid grid-cols-3 gap-x-8 gap-y-2 lg:gap-y-16 text-center lg:grid-cols-6">
                      {stats &&
                        stats.brackets.map((b, idx) => (
                          <div
                            className="mx-auto flex max-w-xs flex-col lg:gap-y-4 gap-y-1"
                            key={`b-${idx}`}
                          >
                            <dt className="text-base leading-7 text-gray-600">
                              {`>${b.min}`}
                            </dt>
                            <dd className="order-first text-3xl font-semibold tracking-tight text-gray-900 sm:text-4xl">
                              {b.count.toLocaleString()}
                            </dd>
                          </div>
                        ))}
                    </dl>
                  </div>
                </div>

                <div className="py-8 mt-2 space-y-8">
                  <DailyBarChart
                    data={stats?.daily_data || []}
                    columnFilter={["num_likes", "num_posts", "num_follows"]}
                    title="Daily Records"
                    startOffset={90}
                  />
                </div>
              </div>
            </div>
            <div className="text-center mb-4">
              <div className="mx-auto max-w-7xl px-6 lg:px-8 space-y-2">
                <div className="text-gray-500 text-xs">
                  Post Data Collection started May 1st, 2023
                </div>
                <div className="text-gray-500 text-xs">
                  Total User Count is directly from the Bluesky API
                </div>
                <div className="text-gray-500 text-xs">
                  Large bot accounts are excluded from statistics and Top
                  Posters
                </div>
              </div>
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
                {stats
                  ? parseISO(stats.updated_at).toLocaleString()
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
