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

- The tests run on the **QE** environment.
- For local execution, environment variables are read from the `.env` file. Ensure you do **not** commit `.env` file to the repository.
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
│   │   ├── auth/                               # Auto-generated authentication state files
│   │   ├── data/                               # Stores shared test data for employees and managers
│   │   │   ├── employee/
│   │   │   │   ├── <tab-name>.json             # Static test data for UI tab
│   │   │   │   ├── shared-<tab-name>.json      # Dynamically processed test data for UI tab
│   │   │   ├── manager/
│   │   │   │   ├── <tab-name>.json             # Static test data for UI tab
│   │   │   │   ├── shared-<tab-name>.json      # Dynamically processed test data for UI tab
│   │   ├── globals/                            # Global setup and teardown scripts for tests
│   │   ├── helpers/                            # Helpers for various test operations
│   │   ├── pageObjects/                        # Page Object Model implementation
│   │   ├── playwright-report/                  # Auto-generated test execution reports
│   │   ├── specs/                              # Test case specifications
│   │   │   ├── employee/                       # Test cases related to employee
│   │   │   ├── employee2/                      #Test cases related to employee where data is being manipulated through scripts in UI
│   │   │   ├── manager/
│   │   ├── test-results/                       # Auto-generated test results folder
│   │   ├── utils/                              # Utilities used in the test framework
│   │   ├── .env                                # Environment file with sensitive credentials
│   │   ├── .env.example                        # Sample environment file with placeholder values
│   │   ├── playwright.congig.js                # Playwright configuration file
│   │   ├── README.md                           # Test framework documentation
│   │   ├── results.json                        # Auto-generated test results JSON file
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
- If none of the tests in a spec require dynamic data, the data is sourced from the static file.
- For certain test cases, time entries are created or updated in advance, while for others, they are deleted after execution. To prevent data loss and corruption, test data is read from static files, processed as needed, and stored in `shared` files. During tests and global teardown, test data is retrieved from these `shared` files.

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
