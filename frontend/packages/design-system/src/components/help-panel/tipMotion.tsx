/**
 * External dependencies.
 */
import { useState } from "react";
import { Dialog } from "@base-ui/react/dialog";
import { Button } from "@rtcamp/frappe-ui-react";
import { Close } from "@rtcamp/frappe-ui-react/icons";

/**
 * Internal dependencies.
 */
import type { HelpTip } from "./types";
import MotionPlayer from "../motion-player";

type TipMotionProps = {
  motion: NonNullable<HelpTip["motion"]>;
  title: string;
};

export default function TipMotion({ motion, title }: TipMotionProps) {
  const [expanded, setExpanded] = useState(false);
  return (
    <>
      <MotionPlayer
        load={motion}
        label={title}
        paused={expanded}
        onExpand={() => setExpanded(true)}
      />
      <Dialog.Root open={expanded} onOpenChange={setExpanded}>
        <Dialog.Portal>
          <Dialog.Backdrop
            forceRender
            className="dialog-backdrop fixed inset-0 z-11 bg-black-overlay-200 backdrop-blur-md"
          />
          <Dialog.Popup className="dialog-content fixed left-1/2 top-1/2 z-11 flex w-[min(calc(100%_-_4rem),calc((100dvh_-_10rem)_*_16_/_9))] max-w-7xl -translate-x-1/2 -translate-y-1/2 flex-col gap-6 rounded-xl bg-surface-modal px-4 pb-6 pt-5 shadow-xl outline-none sm:px-6">
            <div className="flex items-center justify-between">
              <Dialog.Title className="text-2xl font-semibold leading-6 text-ink-gray-9">
                {title}
              </Dialog.Title>
              <Dialog.Close
                aria-label="Close"
                render={<Button variant="ghost" icon={Close} />}
              />
            </div>
            <MotionPlayer
              load={motion}
              label={title}
              onCollapse={() => setExpanded(false)}
            />
          </Dialog.Popup>
        </Dialog.Portal>
      </Dialog.Root>
    </>
  );
}
