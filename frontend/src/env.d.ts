interface Window {
  /**
   * Boot data from `next_pms/www/next-pms/index.py`. Only a production build
   * has it; the dev server serves the page without Frappe.
   */
  boot?: Record<string, any>;
  csrf_token?: string;
}
