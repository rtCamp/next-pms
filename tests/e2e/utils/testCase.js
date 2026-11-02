import path from "path";
import { readJSONFile } from "./fileUtils";
import { deleteDocument, getDocList } from "./api/apiClient";

/** The id of the project a create payload seeded, looked up by its name. */
export const findProjectId = async (projectPayload) => {
  const [project] = await getDocList(
    "Project",
    [["project_name", "=", projectPayload.project_name]],
    { fields: ["name"] },
  );
  if (!project) {
    throw new Error(
      `globalSetup did not create "${projectPayload.project_name}"`,
    );
  }
  return project.name;
};

/** Deletes every `doctype` record matching `filters`. */
export const clearDocs = async (doctype, filters) => {
  for (const { name } of await getDocList(doctype, filters, { strict: true })) {
    await deleteDocument(doctype, name);
  }
};

/**
 * A test case's data stub plus the id of the project seeded for it. The stub
 * only gets its project id at teardown, so the project is looked up by name.
 *
 * A case that creates records while it runs passes `reset(projectId, data)`, which
 * clears what an earlier attempt left behind: a retry would otherwise find
 * duplicates and fail the same way every time. It runs for every project the case
 * seeds (payloadCreateProject2 and so on), as a retry leaves records in each.
 */
export const loadTestCase = async (jsonDir, tc, reset) => {
  const data = (await readJSONFile(path.join(jsonDir, `${tc}.json`)))[tc];
  const projectId = await findProjectId(data.payloadCreateProject);
  if (reset) {
    for (const key of Object.keys(data)) {
      if (!/^payloadCreateProject\w*$/.test(key)) continue;
      const id =
        key === "payloadCreateProject"
          ? projectId
          : await findProjectId(data[key]);
      await reset(id, data);
    }
  }
  return { data, projectId };
};

/**
 * The queued in-app notifications a user received for one document. They are
 * written by a job that runs on a 15-minute cron, so only a site running that
 * job every minute (E2E_FAST_SCHEDULER=1) can wait for them.
 */
export const notificationsFor = (user, doctype, name) =>
  getDocList(
    "NextPMS Notifications",
    [
      ["user", "=", user],
      ["linked_doctype", "=", doctype],
      ["linked_document", "=", name],
    ],
    { fields: ["title", "label"] },
  );
