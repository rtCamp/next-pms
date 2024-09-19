## Introduction

Frappe PMS designed to enhance project management capabilities within Frappe. The app offers suite of additonal features tailored to improve timesheet management, streamlined project billing, and dedicated React app for timesheets.

## Key Features

- React app for Timesheet.
- Project billing customizations for easier billing.
- Specialized reports for projects & timesheet

## Prerequisite

Before you begin, make sure you have met the following apps installed on your site:

- [ERPNext](https://github.com/frappe/erpnext)
- [Frappe HR](https://github.com/frappe/hrms)

## Installation & Setup

1.  Download the app using the Bench CLI.
    ```bash
    bench get-app https://github.com/rtCamp/Frappe-PMS.git
    ```
2.  Install the app on your site and run the migration.
    `bash
    bench --site [site name] install-app frappe_pms
    bench migrate
    `
    Upon installation completion,follow the below setup for project & timesheet.

3.  Go to the `project Setting` and check ignore time overlap.
    <img width="1402" src="screenshots/project-setting.png" alt="Project Setting" />

4.  If you want to allow employees to make backdated or future time entries, you can set it in `Timesheet Setting`.

    - You can restrict the users from logging time entries for dates prior to the current day based on the `Allow Backdated Entries` field.

    <img width="1402" src="screenshots/timesheet-settings.png" alt="Timesheet Setting" />

    - You can have separate setting for both Employees & Projects Manager. For example: Employees can be log past days time where Projects Manager can log for past 30 days.

## Local development setup

To setup your local environment for react app, follow the below steps.

- Disable CSRF in `site_config.json` by adding the key `ignore_csrf: 1`. This is only required in dev mode, Do not use it in production mode.

If you are using [Frappe Manager](https://github.com/rtCamp/Frappe-Manager) for you site, then some extra steps are required.

1.  Go to your `sites` directory in your `frappe-bench` and create symlink for your frappe site.
    ```bash
    ln -sfn <sitename> localhost # ln -sfn ./erp.localhost ./localhost
    ```
2.  Update the dockor compose for your `fm` site, generally all site create under `/frappe/sites/sitename/docker-compose.yml` in system root.

    - Update VIRTUAL_HOST in nginx

    ```yml
    environment:
      SITENAME: careers.localhost
      VIRTUAL_HOST: careers.localhost,localhost // Add localhost here
      VIRTUAL_PORT: 80
      HSTS: off
    ```

    - Expose port for frontend in nginx, usually it will be `5173`, but if react app is using other port it can be found in `vite.config.ts`

    ```yml
    expose:
      - 80,5173
    ```

3.  Save the `docker-compose.yml` and restart nginx.
4.  Go to `frappe-bench/apps/frappe_pms/frontend/timesheet` and create the `.env` from sample file.
5.  Run the dev server:
    `bash
    cd frappe-bench/apps/frappe_pms
    npm run dev
    `
    now you frappe site will also be accesible at `http://localhost` and your frontend at `http://localhost:5173`.

## Screeenshots

<figure>
    <img width="1402" src="screenshots/timesheet-view.png" alt="Timesheet" />
        <figcaption >
        <b>Private channels in Raven</b>
    </figcaption>
</figure>

## License

AGPLv3
