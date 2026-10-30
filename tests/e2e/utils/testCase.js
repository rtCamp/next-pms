import path from "path";
import { readJSONFile } from "./fileUtils";
import { getDocList } from "./api/apiClient";

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

/**
 * A test case's data stub plus the id of the project seeded for it. The stub
 * only gets its project id at teardown, so the project is looked up by name.
 */
export const loadTestCase = async (jsonDir, tc) => {
  const data = (await readJSONFile(path.join(jsonDir, `${tc}.json`)))[tc];
  return { data, projectId: await findProjectId(data.payloadCreateProject) };
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
