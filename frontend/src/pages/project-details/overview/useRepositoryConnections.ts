import { computed, reactive } from "vue";
import { toast } from "frappe-ui";
import { useProjectDetails } from "@/pages/project-details/useProjectDetails";
import { errorMessage } from "@/utils/errors";

/**
 * The Project's repository connections and their writes. Each write saves the whole
 * child table at once, as React, outside the Overview's edit mode. Writes run one
 * at a time, each from the latest rows, so two quick changes can't overwrite each
 * other.
 */
export function useRepositoryConnections() {
  const { doc, setValue } = useProjectDetails();

  const rows = computed(
    () => doc.value?.custom_project_repository_connections ?? [],
  );
  const connectedIds = computed(
    () =>
      new Set(
        rows.value
          .map((row) => row.github_repository)
          .filter((id): id is string => Boolean(id)),
      ),
  );

  /** Keys of the writes queued or running, e.g. `add:<repository>`. */
  const busy = reactive(new Set<string>());
  let queue: Promise<unknown> = Promise.resolve();

  function current() {
    return rows.value.map((row) => ({
      name: row.name,
      github_repository: row.github_repository ?? "",
    }));
  }

  /** Runs `write` after the queued ones; resolves whether it succeeded. A key already queued is ignored. */
  function enqueue(key: string, write: () => Promise<unknown>) {
    if (busy.has(key)) return Promise.resolve(false);
    busy.add(key);
    const run = queue.then(async () => {
      try {
        await write();
        return true;
      } catch (error) {
        toast.error(errorMessage(error));
        return false;
      } finally {
        busy.delete(key);
      }
    });
    queue = run;
    return run;
  }

  function add(repositoryId: string) {
    return enqueue(`add:${repositoryId}`, async () => {
      if (connectedIds.value.has(repositoryId)) return;
      await setValue({
        custom_project_repository_connections: [
          ...current(),
          { github_repository: repositoryId },
        ],
      });
    });
  }

  function unlink(rowName: string) {
    return enqueue(`unlink:${rowName}`, () =>
      setValue({
        custom_project_repository_connections: current().filter(
          (row) => row.name !== rowName,
        ),
      }),
    );
  }

  return {
    rows,
    connectedIds,
    isBusy: (key: string) => busy.has(key),
    add,
    unlink,
  };
}
