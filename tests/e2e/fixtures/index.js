// fixtures/index.js
import { test as baseTest } from "@playwright/test";
import * as projectFixtures from "./projectFixtures.js";
import * as taskFixtures from "./taskFixtures.js";
import * as timesheetFixtures from "./timesheetFixtures.js";
import * as teamFixtures from "./teamFixtures.js";

export const test = baseTest
  // define the one-and-only testCaseIDs fixture
  .extend({
    // override default so you can do `test.use({ testCaseIDs: ["TC4"] })`
    testCaseIDs: [[], { option: true }],
  })
  // layer in each domain fixture
  .extend(projectFixtures)
  .extend(taskFixtures)
  .extend(timesheetFixtures)
  .extend(teamFixtures);

export const expect = test.expect;
