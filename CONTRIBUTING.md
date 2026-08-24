## Contribution Guide

We accept contributions in the form of Issues & Pull Requests. To create a Pull Request, you need a local dev setup. Follow the guide below:

1. Install the app along with its dependencies.

```bash
bench get-app erpnext --branch version-16
bench get-app hrms --branch version-16
bench get-app frappe_gmail_thread https://github.com/rtCamp/frappe-gmail-thread --branch version-16-hotfix
bench get-app frappe_comment_xt https://github.com/rtCamp/frappe-comment-xt --branch version-16-hotfix
bench get-app frappe_slack_connector https://github.com/rtCamp/frappe-slack-connector --branch version-16-hotfix
bench get-app next_pms https://github.com/rtCamp/next-pms --branch version-16-hotfix

bench --site [site-name] install-app erpnext hrms frappe_gmail_thread frappe_comment_xt frappe_slack_connector next_pms

bench --site [site-name] migrate
```

2. Set up [pre-commit](https://pre-commit.com/) in the app.

```bash
pre-commit install
```

3. Open Pull Request to the `version-16-hotfix` branch. For branch names and commit messages, follow the guidelines at: https://www.conventionalcommits.org/en/v1.0.0/

For local development, check out our dev-tool for seamlessly building Frappe apps: [frappe-manager](https://github.com/rtCamp/Frappe-Manager)

## Security Disclosures

For security disclosures, please avoid opening a public issue. Report them via sys+gh@rtcamp.com. Refer to [Security](SECURITY.md) for more details.
