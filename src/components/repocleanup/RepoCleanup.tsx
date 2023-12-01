import { FC, useEffect, useState } from "react";
import ErrorMsg from "../threads/ErrorMsg";

declare interface CleanupOldRecordsRequest {
    identifier: string;
    app_password: string;
    cleanup_types: string[];
    delete_until_days_ago: number;
    actually_delete_stuff: boolean;
}

declare interface JobSubmissionResponse {
    num_enqueued: number;
    dry_run: boolean;
    message?: string;
    job_id?: string;
}

declare interface RepoCleanupJob {
    job_id: string;
    repo: string;
    refresh_token: string;
    cleanup_types: string[];
    delete_older_than: string;
    num_deleted: number;
    num_deleted_today: number;
    est_num_remaining: number;
    job_state: string;
    created_at: string;
    updated_at: string;
    last_deleted_at: {
        Valid: boolean;
        Time: string;
    };
}

declare interface CleanupStats {
    total_num_deleted: number;
    num_jobs: number;
    num_repos: number;
}

const endpoint = "https://bsky-search.jazco.io/repo/cleanup";

const RepoCleanup: FC<{}> = () => {
    const [error, setError] = useState<string>("");
    const [loading, setLoading] = useState<string>("");
    const [resp, setResp] = useState<JobSubmissionResponse | null>(null);
    const [job, setJob] = useState<RepoCleanupJob | null>(null);
    const [stats, setStats] = useState<CleanupStats | null>(null);

    const [identifier, setIdentifier] = useState<string>("");
    const [appPass, setAppPass] = useState<string>("");
    const [typesToDelete, setTypesToDelete] = useState<string[]>([
        "post",
        "post_with_media",
        "like",
        "repost",
    ]);
    const [daysToRetain, setDaysToRetain] = useState<number>(30);
    const [jobID, setJobID] = useState<string>("");

    useEffect(() => {
        document.title = "Repo Cleaner for ATProto by Jaz (jaz.bsky.social)";
        getStats();
    }, []);

    const validateForm = (): boolean => {
        if (identifier === "") {
            setError("Identifier is required");
            return false;
        }
        if (appPass === "") {
            setError("App Password is required");
            return false;
        }
        if (
            !RegExp(
                /^[a-zA-Z0-9]{4}-[a-zA-Z0-9]{4}-[a-zA-Z0-9]{4}-[a-zA-Z0-9]{4}$/
            ).test(appPass)
        ) {
            setError(
                "Invalid App Password, make sure you're generating one at https://bsky.app/settings/app-passwords"
            );
            return false;
        }
        return true;
    };

    const getStats = async () => {
        await fetch(`${endpoint}/stats`)
            .then((res) => res.json())
            .then((data) => {
                console.log(data);
                if (data.error) {
                    setError(data.error);
                } else {
                    setStats(data as CleanupStats);
                }
            })
            .catch((err) => {
                console.log(err);
                setError(err.error);
            });
    }

    const submitCleanup = async (actually_delete_stuff: boolean) => {
        setLoading(actually_delete_stuff ? "delete" : "preview");
        await fetch(endpoint, {
            method: "POST",
            body: JSON.stringify({
                identifier: identifier,
                app_password: appPass,
                cleanup_types: typesToDelete,
                delete_until_days_ago: daysToRetain,
                actually_delete_stuff: actually_delete_stuff,
            } as CleanupOldRecordsRequest),
        })
            .then((res) => res.json())
            .then((data) => {
                console.log(data);
                if (data.error) {
                    setError(data.error);
                } else {
                    setResp(data as JobSubmissionResponse);
                    if (data.job_id !== undefined && data.job_id !== "") {
                        setJobID(data.job_id as string);
                        getJobStatus(data.job_id);
                    }
                }
            })
            .catch((err) => {
                console.log(err);
                setError(err.error);
            });
        setLoading("");
    };

    const getJobStatus = async (opt_job_id?: string) => {
        setLoading("status");
        await fetch(`${endpoint}?job_id=${opt_job_id || jobID}`)
            .then((res) => res.json())
            .then((data) => {
                console.log(data);
                if (data.error) {
                    setError(data.error);
                } else {
                    setJob(data as RepoCleanupJob);
                }
            })
            .catch((err) => {
                console.log(err);
                setError(err.error);
            });
        setLoading("");
    };

    const cancelJob = async () => {
        setLoading("cancel");
        await fetch(`${endpoint}?job_id=${jobID}`, {
            method: "DELETE",
        })
            .then((res) => res.json())
            .then((data) => {
                console.log(data);
                if (data.error) {
                    setError(data.error);
                } else {
                    getJobStatus(jobID);
                }
            })
            .catch((err) => {
                console.log(err);
                setError(err.error);
            });
        setLoading("");
    }

    const onCheck = (
        e: React.ChangeEvent<HTMLInputElement>,
        checkTarget: string
    ) => {
        if (e.target.checked) {
            setTypesToDelete([...typesToDelete, checkTarget]);
        } else {
            setTypesToDelete(typesToDelete.filter((type) => type !== checkTarget));
        }
    };

    return (
        <div className="bg-white">
            <div className="mx-auto max-w-7xl py-4 sm:pt-24 sm:px-6 lg:px-8">
                <div className="relative isolate overflow-hidden bg-gray-50 px-3 sm:px-16 py-4 sm:pt-24 text-center shadow-md sm:rounded-3xl">
                    <div className="mx-auto max-w-7xl">
                        {error && (
                            <div className="text-left mb-2">
                                <ErrorMsg error={error} />
                            </div>
                        )}
                        <div>
                            <div className="text-3xl font-bold text-gray-900  sm:text-4xl">
                                Profile Cleaner
                            </div>
                            <p className="mt-4 text-lg leading-6 text-gray-500 text-center">
                                A tool to clean up old posts, likes, and reposts from your
                                Bluesky account
                            </p>
                        </div>
                        <form
                            className="mt-6 flex items-center max-w-2xl mx-auto flex-col"
                            action="#"
                        >
                            <div className="grid w-full max-w-md">
                                <label htmlFor="identifier" className="sr-only">
                                    Handle/Email/DID
                                </label>
                                <div className="grid grid-cols-1 sm:flex-auto">
                                    <input
                                        type="text"
                                        name="identifier"
                                        id="identifier"
                                        className="peer relative col-start-1 row-start-1 border-0 bg-transparent py-1.5 text-gray-900 placeholder:text-gray-400 focus:ring-0 sm:text-sm sm:leading-6"
                                        placeholder="Enter a Bluesky Email, Handle, or DID"
                                        value={identifier}
                                        onChange={(e) => setIdentifier(e.target.value)}
                                    />
                                    <div
                                        className="col-start-1 col-end-3 row-start-1 rounded-md shadow-sm ring-1 ring-inset ring-gray-300 peer-focus:ring-2 peer-focus:ring-indigo-600"
                                        aria-hidden="true"
                                    />
                                </div>
                            </div>
                            <div className="grid w-full max-w-md mt-3">
                                <label htmlFor="appPass" className="sr-only">
                                    App Password
                                </label>
                                <div className="grid grid-cols-1 sm:flex-auto">
                                    <input
                                        type="password"
                                        name="appPass"
                                        id="appPass"
                                        className="peer relative col-start-1 row-start-1 border-0 bg-transparent py-1.5 text-gray-900 placeholder:text-gray-400 focus:ring-0 sm:text-sm sm:leading-6"
                                        placeholder="Enter your auto-generated App Password"
                                        value={appPass}
                                        onChange={(e) => setAppPass(e.target.value)}
                                    />
                                    <div
                                        className="col-start-1 col-end-3 row-start-1 rounded-md shadow-sm ring-1 ring-inset ring-gray-300 peer-focus:ring-2 peer-focus:ring-indigo-600"
                                        aria-hidden="true"
                                    />
                                </div>
                                <div className="text-left">
                                    <span className="text-xs text-gray-500">
                                        Create a single-purpose{" "}
                                        <a
                                            className="underline text-indigo-600 hover:text-indigo-500"
                                            target="_blank"
                                            href="https://bsky.app/settings/app-passwords"
                                        >
                                            App Password Here
                                        </a>{" "}
                                        and delete it once your job is finished running
                                    </span>
                                </div>
                            </div>
                            <fieldset className="mt-4">
                                <legend className="text-base font-semibold leading-6 text-gray-900 mb-2">
                                    Records to Delete
                                </legend>
                                <div className="space-x-6 ml-2 flex flex-row">
                                    <div className="relative flex ">
                                        <div className="flex h-6 items-center">
                                            <input
                                                id="posts"
                                                aria-describedby="posts-description"
                                                name="posts"
                                                type="checkbox"
                                                className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-600"
                                                checked={typesToDelete.includes("post")}
                                                onChange={(e) => {
                                                    onCheck(e, "post");
                                                }}
                                            />
                                        </div>
                                        <div className="ml-3 text-sm leading-6">
                                            <label
                                                htmlFor="posts"
                                                className="font-medium text-gray-900"
                                            >
                                                Posts without Images
                                            </label>
                                        </div>
                                    </div>
                                    <div className="relative flex ">
                                        <div className="flex h-6 items-center">
                                            <input
                                                id="post_with_media"
                                                aria-describedby="post_with_media-description"
                                                name="post_with_media"
                                                type="checkbox"
                                                className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-600"
                                                checked={typesToDelete.includes("post_with_media")}
                                                onChange={(e) => {
                                                    onCheck(e, "post_with_media");
                                                }}
                                            />
                                        </div>
                                        <div className="ml-3 text-sm leading-6">
                                            <label
                                                htmlFor="post_with_media"
                                                className="font-medium text-gray-900"
                                            >
                                                Posts with Images
                                            </label>
                                        </div>
                                    </div>
                                    <div className="relative flex ">
                                        <div className="flex h-6 items-center">
                                            <input
                                                id="reposts"
                                                aria-describedby="reposts-description"
                                                name="reposts"
                                                type="checkbox"
                                                className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-600"
                                                checked={typesToDelete.includes("repost")}
                                                onChange={(e) => {
                                                    onCheck(e, "repost");
                                                }}
                                            />
                                        </div>
                                        <div className="ml-3 text-sm leading-6">
                                            <label
                                                htmlFor="reposts"
                                                className="font-medium text-gray-900"
                                            >
                                                Reposts
                                            </label>
                                        </div>
                                    </div>
                                    <div className="relative flex ">
                                        <div className="flex h-6 items-center">
                                            <input
                                                id="likes"
                                                aria-describedby="likes-description"
                                                name="likes"
                                                type="checkbox"
                                                className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-600"
                                                checked={typesToDelete.includes("like")}
                                                onChange={(e) => {
                                                    onCheck(e, "like");
                                                }}
                                            />
                                        </div>
                                        <div className="ml-3 text-sm leading-6">
                                            <label
                                                htmlFor="likes"
                                                className="font-medium text-gray-900"
                                            >
                                                Likes
                                            </label>
                                        </div>
                                    </div>
                                </div>
                            </fieldset>
                            <div className="mt-4 text-base font-semibold leading-6 text-gray-900 mb-2 flex">
                                <span>Delete all records older than</span>
                                <input
                                    type="number"
                                    name="daysToRetain"
                                    id="daysToRetain"
                                    className="inline-flex mx-2 w-16 rounded-md border-0 py-1 -mt-1 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                                    placeholder="30"
                                    onChange={(e) => setDaysToRetain(parseInt(e.target.value))}
                                    value={daysToRetain}
                                />
                                <span> days</span>
                            </div>
                            <div className="mt-3 text-sm w-full leading-6 text-gray-500 text-center">
                                <p className="text-xl text-gray-700 mb-2">Things to Keep in Mind</p>
                                <p>Bluesky has creation rate limits of ~1,300 posts/likes/reposts per hour and ~11,000 per day</p>
                                <p>Deleting content counts as 1/3 of a post/like/repost</p>
                                <p>This tool deletes up to 4,000 records per hour and 30,000 per day</p>
                                <p>You should still be able to like/post/repost normally unless you're <i>very</i> active</p>
                                <p>If you start getting "Rate Limit" related errors, you can come back and cancel your job</p>
                            </div>
                            {resp && (
                                <div className="flex gap-2 justify-center">
                                    <div className="w-auto flex">
                                        <div className="max-w-xl text-sm text-gray-700">
                                            <p className="text-xl">
                                                Records to Delete: {resp.num_enqueued}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            )}
                            <div className="mt-4 sm:ml-4 sm:flex-shrink-0 flex">
                                <button
                                    onClick={async (e) => {
                                        setError("");
                                        e.preventDefault();
                                        validateForm();
                                        submitCleanup(false);
                                    }}
                                    className="block mr-2 w-full rounded-md bg-indigo-600 px-3 py-2 text-center text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
                                >
                                    {loading === "preview" ? (
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
                                        <span className="whitespace-nowrap">Preview</span>
                                    )}
                                </button>
                                <button
                                    onClick={async (e) => {
                                        setError("");
                                        e.preventDefault();
                                        validateForm();
                                        submitCleanup(true);
                                    }}
                                    className="block mr-2 w-full rounded-md bg-red-600 px-3 py-2 text-center text-sm font-semibold text-white shadow-sm hover:bg-red-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-600"
                                >
                                    {loading === "delete" ? (
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
                                        <span className="whitespace-nowrap">Submit Job</span>
                                    )}
                                </button>
                            </div>
                        </form>
                        <div>
                            <p className="mt-6 text-lg leading-6 text-gray-500 text-center">
                                Job Status
                            </p>
                            <form
                                className="mt-6 sm:flex sm:items-center max-w-2xl mx-auto"
                                action="#"
                            >
                                <label htmlFor="jobID" className="sr-only">
                                    Job ID
                                </label>
                                <div className="grid grid-cols-1 sm:flex-auto">
                                    <input
                                        type="text"
                                        name="jobID"
                                        id="jobID"
                                        className="peer relative col-start-1 row-start-1 border-0 bg-transparent py-1.5 text-gray-900 placeholder:text-gray-400 focus:ring-0 sm:text-sm sm:leading-6"
                                        placeholder="Existing Job ID"
                                        value={jobID}
                                        onChange={(e) => setJobID(e.target.value)}
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
                                            getJobStatus();
                                        }}
                                        className="block mr-2 w-full rounded-md bg-indigo-600 px-3 py-2 text-center text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
                                    >
                                        {loading === "status" ? (
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
                                            <span className="whitespace-nowrap">Check Status</span>
                                        )}
                                    </button>
                                    <button
                                        onClick={async (e) => {
                                            e.preventDefault();
                                            cancelJob();
                                        }}
                                        className="block mr-2 w-full rounded-md bg-red-600 px-3 py-2 text-center text-sm font-semibold text-white shadow-sm hover:bg-red-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-600"
                                    >
                                        {loading === "cancel" ? (
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
                                            <span className="whitespace-nowrap">Cancel Job</span>
                                        )}
                                    </button>
                                </div>
                            </form>
                            {job && (
                                <div className="flex gap-2 justify-center">
                                    <div className="mt-6 w-auto flex">
                                        <div className="py-2 pr-6 pl-4">
                                            <div className="mt-2 max-w-xl text-sm text-gray-900 text-left grid grid-cols-2">
                                                <div>
                                                    <p>Job State:</p>
                                                    <p>Records Deleted:</p>
                                                    <p>Records Pending Deletion:</p>
                                                    <p>Deletion Cutoff Date:</p>
                                                    <p>Last Updated:</p>
                                                </div>
                                                <div className="text-right">
                                                    <p>{job.job_state}</p>
                                                    <p>{job.num_deleted}</p>
                                                    <p>{job.est_num_remaining}</p>
                                                    <p>{new Date(job.delete_older_than).toLocaleString()}</p>
                                                    <p>{new Date(job.updated_at).toLocaleString()}</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                    <footer className="text-center w-full mt-10">
                        <div className="mx-auto max-w-7xl px-2">
                            <span className="footer-text text-xs">
                                This tool has deleted {stats?.total_num_deleted.toLocaleString()} records across{" "}
                                {stats?.num_repos.toLocaleString()} accounts
                            </span>
                        </div>
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
                                    href="https://github.com/ericvolp12/bsky-experiments/blob/main/pkg/search/endpoints/repocleanup.go"
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

export default RepoCleanup;
