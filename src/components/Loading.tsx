import { FC } from "react";

interface LoadingProps {
  message: string;
}

const Loading: FC<LoadingProps> = ({ message }) => {
  return (
    <div className="absolute top-0 left-0 w-screen h-screen bg-white z-10">
      <div className="flex flex-col items-center justify-center h-full">
        <div className="flex flex-col items-center justify-center">
          <div className="text-2xl font-bold text-gray-900 text-center">
            {message}
          </div>
        </div>
        <div className="mt-6 flex items-center justify-center gap-x-6">
          <svg
            className="animate-spin h-5 w-5 text-gray-900"
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
        </div>
      </div>
    </div>
  );
};

export default Loading;
