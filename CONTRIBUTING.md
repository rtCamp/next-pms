## Contribution Guide

We accept contributions in the form of Issues & Pull Requests. To create a Pull Request, you need a local dev setup. Follow the guide below:

1. Install the app along with its dependencies.

```bash
bench get-app https://github.com/frappe/erpnext
bench get-app https://github.com/frappe/hrms
bench get-app https://github.com/rtCamp/frappe-gmail-thread
bench get-app https://github.com/rtCamp/frappe-comment-xt
bench get-app https://github.com/rtCamp/frappe-slack-connector
bench get-app https://github.com/rtCamp/next-pms

bench --site [site-name] install-app erpnext
bench --site [site-name] install-app hrms
bench --site [site-name] install-app frappe_gmail_thread
bench --site [site-name] install-app frappe_comment_xt
bench --site [site-name] install-app frappe_slack_connector
bench --site [site-name] install-app next_pms

bench --site [site-name] migrate
```

2. Set up [pre-commit](https://pre-commit.com/) in the app.

```bash
pre-commit install
```

3. Open Pull Request to the `version-16-hotfix` branch. For branch names and commit messages, follow the guidelines at: https://www.conventionalcommits.org/en/v1.0.0/

For local development, check out our dev-tool for seamlessly building Frappe apps: [frappe-manager](https://github.com/rtCamp/Frappe-Manager)

## Security Disclosures

For security disclosures, please avoid opening a public issue. Report them via sys+gh@rtcamp.com. Refer [Security](SECURITY.md) for more details.
