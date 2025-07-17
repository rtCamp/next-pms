# Playwright E2E Test Automation Framework

## Table of Contents

- [Overview](#overview)
- [Prerequisites](#prerequisites)
- [Environment & Variables](#environment--variables)
- [How to Run Tests](#how-to-run-tests)
- [API Credentials](#api-credentials)
- [Directory Structure](#directory-structure)
- [Test Case Sheet](#test-case-sheet)
- [Known Issues and Bugs](#known-issues-and-bugs)
- [Skipped Tests & Reasons](#skipped-tests--reasons)
- [Test Data & Configuration](#test-data--configuration)
- [Reporting](#reporting)

## Overview

This famework includes end-to-end UI automated tests for Next PMS, built using the Playwright framework. Roles covered:

- Employee
- Reporting Manager

## Prerequisites

Before running the tests, ensure the following prerequisites are met:

1. Node.js is installed. You can download it from [Node.js official site](https://nodejs.org/).
2. Clone the repository and navigate to `tests/e2e/`:
   ```bash
   git clone https://github.com/rtCamp/next-pms.git
   cd next-pms/tests/e2e/
   ```
3. Install dependencies:
   ```bash
   npm install
   npx playwright install
   ```
4. Create a `.env` file by copying `.env.example`:
   ```bash
   cp .env.example .env
   ```
   Request the QA team to provide the required values.

## Environment & Variables

- The tests run on the **QE** environment on github CI.
- For local execution, environment variables are read from the `.env` file. Ensure you do **not** commit `.env` file to the repository. Also make sure that local execution is performed on next-pms staging site and not QE site.
- For GitHub workflow, GitHub Secrets are used. We have created a `Stage` environment in GitHub repo for managing environment variables.

## How to Run Tests

1. Execute tests:
   ```bash
   npm run e2e:tests
   ```
2. Execute tests with CLI parameters:
   ```bash
   npm run e2e:tests -- --headed
   ```

## API Credentials

- Admin's login credentials are used in API requests.
- The concerned variables in `.env` are:
  ```env
  ADMIN_MAN_EMAIL=<admin-email>
  ADMIN_MAN_PASS=<admin-password>
  ```

## Directory Structure

```
project-root/
│── tests/
│   ├── e2e/
│   │   ├── allure-results/                     # Auto-generated Allure test execution reports
│   │   ├── auth/                               # Auto-generated authentication state files
│   │   │   ├── admin-API.json                  # Admin API authentication state
│   │   │   ├── employee-API.json               # Employee API authentication state
│   │   │   ├── employee-w[0-6].json            # Employee worker authentication states
│   │   │   ├── employee2-API.json              # Employee2 API authentication state
│   │   │   ├── employee2-w[7-8].json           # Employee2 worker authentication states
│   │   │   ├── employee3-API.json              # Employee3 API authentication state
│   │   │   ├── employee3-w[9-10].json          # Employee3 worker authentication states
│   │   │   ├── manager-API.json                # Manager API authentication state
│   │   │   ├── manager-w[0-2,9-17].json        # Manager worker authentication states
│   │   ├── data/                               # Stores shared test data for employees and managers
│   │   │   ├── employee/
│   │   │   │   ├── timesheet.js                # Timesheet test data scripts
│   │   │   ├── json-files/                     # Test case data files
│   │   │   │   ├── TC*.json                    # Individual test case data files
│   │   │   ├── manager/
│   │   │   │   ├── task.js                     # Task test data scripts
│   │   │   │   ├── tasks-to-delete.json        # Tasks scheduled for deletion
│   │   │   │   ├── team.js                     # Team test data scripts
│   │   ├── globals/                            # Global setup and teardown scripts for tests
│   │   │   ├── globalSetup.js                  # Global test setup configuration
│   │   │   ├── globalTeardown.js               # Global test teardown configuration
│   │   ├── helpers/                            # Helpers for various test operations
│   │   │   ├── employeeHelper.js               # Employee-related test helpers
│   │   │   ├── leaveHelper.js                  # Leave management helpers
│   │   │   ├── storageStateHelper.js           # Authentication state helpers
│   │   │   ├── teamTabHelper.js                # Team tab functionality helpers
│   │   │   ├── timesheetHelper.js              # Timesheet functionality helpers
│   │   ├── pageObjects/                        # Page Object Model implementation
│   │   │   ├── loginPage.js                    # Login page objects
│   │   │   ├── resourceManagement/             # Resource management page objects
│   │   │   │   ├── project.js                  # Project management page objects
│   │   │   │   ├── team.js                     # Team management page objects
│   │   │   │   ├── timeline.js                 # Timeline view page objects
│   │   │   ├── sidebar.js                      # Sidebar navigation page objects
│   │   │   ├── taskPage.js                     # Task management page objects
│   │   │   ├── teamPage.js                     # Team page objects
│   │   │   ├── timesheetPage.js                # Timesheet page objects
│   │   ├── playwright-report/                  # Auto-generated Playwright test execution reports
│   │   ├── scripts/                            # Utility scripts
│   │   │   ├── list-tests.js                   # Script to list all test cases that needs to be run
│   │   ├── specs/                              # Test case specifications
│   │   │   ├── employee/                       # Test cases related to employee
│   │   │   │   ├── team.spec.js                # Employee team functionality tests
│   │   │   │   ├── timesheet.spec.js           # Employee timesheet functionality tests
│   │   │   ├── employee2/                      # Test cases for employee with data manipulation
│   │   │   │   ├── timesheet2.spec.js          # Employee2 timesheet functionality tests
│   │   │   ├── employee3/                      # Test cases for employee3
│   │   │   │   ├── timesheet3.spec.js          # Employee3 timesheet functionality tests
│   │   │   ├── manager/                        # Test cases related to manager
│   │   │   │   ├── resourceManagement.spec.js  # Manager resource management tests
│   │   │   │   ├── task.spec.js                # Manager task management tests
│   │   │   │   ├── team.spec.js                # Manager team management tests
│   │   ├── test-results/                       # Auto-generated test results folder
│   │   ├── utils/                              # Utilities used in the test framework
│   │   │   ├── api/                            # API utility functions
│   │   │   │   ├── authRequestForStorage.js    # Authentication request utilities
│   │   │   │   ├── employeeRequests.js         # Employee API request utilities
│   │   │   │   ├── erpNextRequests.js          # ERPNext API request utilities
│   │   │   │   ├── frappeRequests.js           # Frappe API request utilities
│   │   │   │   ├── leaveRequests.js            # Leave API request utilities
│   │   │   │   ├── projectRequests.js          # Project API request utilities
│   │   │   │   ├── taskRequests.js             # Task API request utilities
│   │   │   │   ├── timesheetRequests.js        # Timesheet API request utilities
│   │   │   │   ├── userGroupRequests.js        # User group API request utilities
│   │   │   ├── dateUtils.js                    # Date utility functions
│   │   │   ├── fileUtils.js                    # File utility functions
│   │   │   ├── stringUtils.js                  # String utility functions
│   │   ├── .env                                # Environment file with sensitive credentials
│   │   ├── .env.example                        # Sample environment file with placeholder values
│   │   ├── playwright.config.js                # Playwright configuration file
│   │   ├── playwright.fixture.cjs              # Playwright fixture configuration
│   │   ├── README.md                           # Test framework documentation
│   │   ├── results.json                        # Auto-generated test results JSON file
│   │   ├── test-tc-ids.json                    # Test case ID mapping file
```

## Test Case Sheet

- [FE PMS Test cases](https://docs.google.com/spreadsheets/d/1ezVa3BnqkgUlJEeOmc_cYCoT3b3JhQ8nGvAOk-W7Q6g/edit?pli=1&gid=1778975438#gid=1778975438)

## Known Issues and Bugs

- [QE Issues for FE PMS](https://docs.google.com/spreadsheets/d/1ezVa3BnqkgUlJEeOmc_cYCoT3b3JhQ8nGvAOk-W7Q6g/edit?pli=1&gid=1682583986#gid=1682583986)

## Skipped Tests & Reasons

- Frequently performed and automatable tests for employees and managers have been automated for each tab.
- Some filter-related tests in the Task and Team tabs have been skipped due to buggy behavior.

## Test Data & Configuration

- Test data is stored in `data/` which mirrors the `specs/`.
- Required data is stored in .js files, during run time json files for each test case ID is created from which data is read and written back to it.
- All the data is created in the global setup and deleted in the global teardown to avoid deadlocks and race conditions. Only for TC92 we create/manipulate data in the beforeAll hook to avoid flakiness.

## Reporting

- We are using playwright and allure reports.
- To view playwright report:
  ```bash
  npx playwright show-report playwright-report/
  ```
- To view Allure report:
  ```bash
  npx run allure:serve
  ```
