import { FC } from "react";
import { XCircleIcon, XMarkIcon } from "@heroicons/react/24/solid";

interface ErrorMsgProps {
  error: string;
  dismiss?: () => void;
}

const ErrorMsg: FC<ErrorMsgProps> = ({ error, dismiss }) => {
  return (
    <div className="rounded-md bg-red-50 p-4">
      <div className="flex">
        <div className="flex-shrink-0">
          <XCircleIcon className="h-5 w-5 text-red-400" aria-hidden="true" />
        </div>
        <div className="ml-3">
          <h3 className="text-sm font-medium text-red-800">Error</h3>
          <div
            className="mt-2 text-sm text-red-700"
            dangerouslySetInnerHTML={{
              __html: error.replaceAll("\n", "<br />"),
            }}
          ></div>
        </div>
        {dismiss && (
          <div className="ml-auto pl-3">
            <div className="-mx-1.5 -my-1.5">
              <button
                onClick={dismiss}
                type="button"
                className="inline-flex bg-red-50 rounded-md p-1.5 text-red-500 hover:bg-red-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-500"
              >
                <span className="sr-only">Dismiss</span>
                <XMarkIcon className="h-5 w-5" aria-hidden="true" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ErrorMsg;
