import { FC } from "react";
import { SelectedNode } from "./TreeVis";

interface PostViewProps {
  node: SelectedNode;
}

const PostView: FC<PostViewProps> = ({ node }) => {
  let sentiment = "";
  let score = "";
  if (node.sentiment && node.sentiment_confidence) {
    const score_string = node.sentiment_confidence.toLocaleString();
    if (node.sentiment.includes("p") && node.sentiment_confidence > 0.65) {
      sentiment = "Positive";
      score = `+${score_string}`;
    } else if (
      node.sentiment.includes("n") &&
      node.sentiment_confidence > 0.65
    ) {
      sentiment = "Negative";
      score = `-${score_string}`;
    }
    // } else if (
    //   node.sentiment.includes("u") &&
    //   node.sentiment_confidence > 0.65
    // ) {
    //   sentiment = "Neutral";
    //   score = `~${score_string}`;
    // }
  }

  return (
    <div
      className={`shadow sm:rounded-lg ${
        sentiment === "Positive"
          ? "bg-green-50"
          : sentiment === "Negative"
          ? "bg-red-50"
          : "bg-white"
      }`}
    >
      <div className="px-3 py-4 sm:p-6">
        <h3 className="text-base font-semibold leading-6 text-gray-900">
          <a
            href={`https://staging.bsky.app/profile/${node.author_did}`}
            className="text-indigo-500 hover:text-indigo-600"
            target="_blank"
          >
            {node.author_handle}
          </a>
        </h3>
        {node.created_at ? (
          <div className="mt-1 max-w-sm text-xs text-gray-400">
            {new Date(node.created_at).toLocaleString()}
          </div>
        ) : (
          ""
        )}
        <div className="mt-1 max-w-sm text-sm text-gray-600 break-words">
          {node.text}
        </div>
        <div className="mt-2 max-w-sm text-xs text-gray-400">
          <span>
            <a
              href={`https://staging.bsky.app/profile/${node.author_did}/post/${node.id}`}
              className="text-blue-500 hover:text-blue-600"
              target="_blank"
            >
              View Post
            </a>
          </span>
          <span>{node.has_media ? " | Post has Attached Media" : ""}</span>
        </div>
        {sentiment !== "" ? (
          <div className="mt-2 max-w-sm text-xs text-gray-400">
            Sentiment:{" "}
            <span
              className={`tracking-wide font-semibold ${
                sentiment === "Positive"
                  ? "text-green-400"
                  : sentiment === "Negative"
                  ? "text-red-400"
                  : "text-gray-500"
              }`}
            >
              {score}
            </span>
          </div>
        ) : (
          ""
        )}
      </div>
    </div>
  );
};

export default PostView;
