import { FC } from "react";
import { CheckCircleIcon, XMarkIcon } from "@heroicons/react/24/solid";

interface SuccessMsgProps {
  Msg: string;
  dismiss?: () => void;
}

const SuccessMsg: FC<SuccessMsgProps> = ({ Msg: Msg, dismiss }) => {
  return (
    <div className="rounded-md bg-red-green p-4">
      <div className="flex">
        <div className="flex-shrink-0">
          <CheckCircleIcon
            className="h-5 w-5 text-green-400"
            aria-hidden="true"
          />
        </div>
        <div className="ml-3">
          <h3 className="text-sm font-medium text-green-800">Success</h3>
          <div
            className="mt-2 text-sm text-green-700"
            dangerouslySetInnerHTML={{
              __html: Msg.replaceAll("\n", "<br />"),
            }}
          ></div>
        </div>
        {dismiss && (
          <div className="ml-auto pl-3">
            <div className="-mx-1.5 -my-1.5">
              <button
                onClick={dismiss}
                type="button"
                className="inline-flex bg-green-50 rounded-md p-1.5 text-green-500 hover:bg-green-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-green-500"
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

export default SuccessMsg;
