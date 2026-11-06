/**
 * External dependencies.
 */
import { useEffect, useRef } from "react";
import { Alert, Button, Skeleton } from "@rtcamp/frappe-ui-react";
import { useFrappeGetCall } from "frappe-react-sdk";
import { Sparkles } from "lucide-react";
/**
 * Internal dependencies.
 */
import { Header } from "@/layout/header";
import { useUser } from "@/providers/user";
import { ReleaseCard } from "./releaseCard";
import type { ReleaseNotes } from "./types";

export default function WhatsNew() {
  const titleRef = useRef<HTMLHeadingElement>(null);
  const markReleaseNotesSeen = useUser(
    ({ actions }) => actions.markReleaseNotesSeen,
  );
  const { data, error, isLoading, mutate } = useFrappeGetCall<{
    message: ReleaseNotes;
  }>("next_pms.api.whats_new.get_release_notes");
  const notes = data?.message;

  useEffect(() => {
    titleRef.current?.focus();
  }, []);

  useEffect(() => {
    if (notes) {
      markReleaseNotesSeen();
    }
  }, [notes, markReleaseNotesSeen]);

  return (
    <>
      <Header>
        <h1
          ref={titleRef}
          tabIndex={-1}
          className="text-lg font-medium text-ink-gray-8 focus:outline-none"
        >
          What&apos;s new
        </h1>
        {notes && (
          <span className="pr-2 text-base text-ink-gray-5 max-md:w-full max-md:pr-0">
            You&apos;re on v{notes.current_version}
          </span>
        )}
      </Header>
      <div className="flex-1 overflow-y-auto">
        <div className="mx-auto flex max-w-[940px] flex-col gap-4 px-5 pt-5 pb-10 max-md:px-3">
          {isLoading &&
            [0, 1].map((index) => (
              <div
                key={index}
                className="flex flex-col gap-3 rounded-lg border border-outline-gray-1 px-5 py-4"
              >
                <Skeleton className="h-5 w-40" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-5/6" />
                <Skeleton className="h-4 w-2/3" />
              </div>
            ))}
          {error && (
            <Alert
              theme="red"
              dismissable={false}
              title="Couldn't load release notes."
              renderFooter={() => (
                <Button label="Retry" onClick={() => mutate()} />
              )}
            />
          )}
          {notes?.releases.length === 0 && (
            <div className="flex flex-col items-center gap-2 py-16 text-base text-ink-gray-5">
              <Sparkles aria-hidden="true" size={24} />
              No release notes yet
            </div>
          )}
          {notes?.releases.map((release, index) => (
            <ReleaseCard
              key={release.version}
              release={release}
              isLatest={index === 0}
            />
          ))}
        </div>
      </div>
    </>
  );
}
