import frappe
from frappe.deferred_insert import save_to_db
from frappe.tests import IntegrationTestCase

FOLLOWER_USER = "notification-url-follower@example.com"

RISK_STATUS_OPEN = "URL Test Open"
RISK_STATUS_MITIGATED = "URL Test Mitigated"


class TestNotificationUrls(IntegrationTestCase):
    """Notifications must deep-link into the SPA page for their linked document."""

    @classmethod
    def setUpClass(cls):
        super().setUpClass()
        if not frappe.db.exists("User", FOLLOWER_USER):
            frappe.get_doc(
                {
                    "doctype": "User",
                    "email": FOLLOWER_USER,
                    "first_name": "Notification URL Follower",
                    "send_welcome_email": 0,
                }
            ).insert(ignore_permissions=True)

        cls.project = frappe.get_doc(
            {
                "doctype": "Project",
                "project_name": "Notification URL Test Project",
                "custom_project_manager": FOLLOWER_USER,
            }
        ).insert(ignore_permissions=True)

        for status in (RISK_STATUS_OPEN, RISK_STATUS_MITIGATED):
            if not frappe.db.exists("Risk Status", status):
                frappe.get_doc({"doctype": "Risk Status", "__newname": status}).insert(ignore_permissions=True)

    @classmethod
    def tearDownClass(cls):
        frappe.delete_doc("Project", cls.project.name, force=True, ignore_permissions=True)
        super().tearDownClass()

    def tearDown(self):
        for name in frappe.get_all("NextPMS Notifications", filters={"user": FOLLOWER_USER}, pluck="name"):
            frappe.delete_doc("NextPMS Notifications", name, force=True, ignore_permissions=True)
        super().tearDown()

    def _get_notification_urls(self, title):
        return frappe.get_all(
            "NextPMS Notifications",
            filters={"user": FOLLOWER_USER, "title": title},
            pluck="url",
        )

    def test_risk_notification_links_to_project_risks_tab(self):
        risk = frappe.get_doc(
            {
                "doctype": "Risk",
                "project": self.project.name,
                "status": RISK_STATUS_OPEN,
            }
        ).insert(ignore_permissions=True)
        self.addCleanup(frappe.delete_doc, "Risk", risk.name, force=True, ignore_permissions=True)

        follow = frappe.get_doc(
            {
                "doctype": "Document Follow",
                "ref_doctype": "Risk",
                "ref_docname": risk.name,
                "user": FOLLOWER_USER,
            }
        ).insert(ignore_permissions=True)
        self.addCleanup(
            frappe.delete_doc,
            "Document Follow",
            follow.name,
            force=True,
            ignore_permissions=True,
        )

        risk.append("risk_update_log", {"status": RISK_STATUS_MITIGATED})
        risk.save(ignore_permissions=True)
        save_to_db()

        self.assertEqual(
            self._get_notification_urls("Risk update"),
            [f"/next-pms/projects/{self.project.name}?tab=risks&risk={risk.name}"],
        )

    def test_project_rag_notification_links_to_rag_stats_tab(self):
        project = frappe.get_doc("Project", self.project.name)
        project.custom_project_rag_status = "Red" if project.custom_project_rag_status != "Red" else "Green"
        project.save(ignore_permissions=True)
        save_to_db()

        self.assertEqual(
            self._get_notification_urls("Project health update"),
            [f"/next-pms/projects/{self.project.name}?tab=rag-stats"],
        )
