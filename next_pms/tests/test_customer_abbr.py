import frappe
from frappe.tests import IntegrationTestCase


class TestCustomerAbbr(IntegrationTestCase):
    """Regression tests for the Customer custom_abbr auto-generation logic in
    ``next_pms.resource_management.doc_events.customer``.

    Each test rolls back its DB writes in tearDown so customers created here
    don't pollute the site (and don't collide across test runs).
    """

    def setUp(self):
        super().setUp()
        # Track customers created during the test so we can clean them up if
        # the rollback strategy isn't sufficient.
        self._created_customer_names: list[str] = []

    def tearDown(self):
        # Roll back any uncommitted DB writes from this test. ``insert()`` in
        # Frappe doesn't auto-commit, so this is normally enough to keep the
        # site clean.
        frappe.db.rollback()
        super().tearDown()

    def _make_customer(self, customer_name, custom_abbr=None):
        """Create a Customer doc; let the validate hook auto-fill custom_abbr
        unless one is explicitly passed in.
        """
        data = {
            "doctype": "Customer",
            "customer_name": customer_name,
            "customer_type": "Company",
            "default_currency": "INR",
        }
        if custom_abbr is not None:
            data["custom_abbr"] = custom_abbr
        doc = frappe.get_doc(data)
        doc.insert(ignore_if_duplicate=False)
        self._created_customer_names.append(doc.name)
        return doc

    def test_two_colliding_customers_extends_first_word(self):
        """`Acme Web Co` -> AWC; `Apex Widget Corp` collides and extends to APWC."""
        c1 = self._make_customer("Acme Web Co")
        self.assertEqual(c1.custom_abbr, "AWC")

        c2 = self._make_customer("Apex Widget Corp")
        self.assertEqual(c2.custom_abbr, "APWC")

    def test_three_way_collision_walks_into_next_word(self):
        """With AWC and APWC taken, `AP Web Company` should become APWEC."""
        self._make_customer("Acme Web Co")  # AWC
        self._make_customer("Apex Widget Corp")  # APWC

        c3 = self._make_customer("AP Web Company")
        self.assertEqual(c3.custom_abbr, "APWEC")

    def test_resave_existing_customer_preserves_abbr(self):
        """Re-saving an existing customer without changing custom_abbr must not
        throw and must keep the existing value (verifies the ``exclude_name``
        filter on the uniqueness check)."""
        c = self._make_customer("Acme Web Co")
        self.assertEqual(c.custom_abbr, "AWC")

        # Reload and save without changing anything.
        c.reload()
        c.save()
        self.assertEqual(c.custom_abbr, "AWC")

        # And changing some unrelated field shouldn't throw either.
        c.customer_type = "Company"
        c.save()
        self.assertEqual(c.custom_abbr, "AWC")

    def test_user_typed_colliding_abbr_throws(self):
        """When the user supplies a custom_abbr that collides with an existing
        customer's, validate_abbr must raise."""
        self._make_customer("Acme Web Co")  # AWC

        with self.assertRaises(frappe.ValidationError):
            self._make_customer("Other Name", custom_abbr="AWC")

    def test_case_insensitive_existing_row_is_detected(self):
        """If an existing customer has a lowercase ``custom_abbr`` (e.g. ``awc``)
        the auto-generator must still detect the collision and disambiguate.
        Regression for the case-normalization fix on the ``taken`` set."""
        c1 = self._make_customer("Acme Web Co")
        # Sneak a lowercase abbr past the validator so we can verify the
        # generator handles a case-insensitive DB collation correctly.
        frappe.db.set_value("Customer", c1.name, "custom_abbr", "awc")

        c2 = self._make_customer("Apex Widget Corp")
        # Must not equal "AWC" (would be a collision under case-insensitive
        # collation). With the fix it should disambiguate to APWC.
        self.assertNotEqual(c2.custom_abbr, "AWC")
        self.assertEqual(c2.custom_abbr, "APWC")
