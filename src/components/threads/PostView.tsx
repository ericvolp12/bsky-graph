import { FC } from "react";

interface PostViewProps {
  author_handle: string;
  text: string;
}

const PostView: FC<PostViewProps> = ({ author_handle, text }) => {
  return (
    <div className="bg-white shadow sm:rounded-lg">
      <div className="px-4 py-5 sm:p-6">
        <h3 className="text-base font-semibold leading-6 text-gray-900">
          {author_handle}
        </h3>
        <div className="mt-2 max-w-sm text-sm text-gray-500 break-words">
          <p>{text}</p>
        </div>
      </div>
    </div>
  );
};

export default PostView;
