// One fixture, read by the Settings cases that change settings (TC382 to TC387): an
// employee with System Manager to sign in as, so the shared accounts' own settings and
// timesheets stay as they are.
module.exports = {
  TC382: {
    payloadCreateWeekEmployees: {
      // No days off listed, so today is always a working day for the timesheet it opens.
      SetAdmin: {
        managed: false,
        holidayList: "E2E No Weekly Off",
        user: { roles: ["System Manager"] },
      },
    },
  },
};
