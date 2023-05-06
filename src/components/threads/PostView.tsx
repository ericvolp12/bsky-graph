import { FC } from "react";
import { SelectedNode } from "./TreeVis";

interface PostViewProps {
  node: SelectedNode;
}

const PostView: FC<PostViewProps> = ({ node }) => {
  return (
    <div className="bg-white shadow sm:rounded-lg">
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
      </div>
    </div>
  );
};

export default PostView;
