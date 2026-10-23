import type { AppLink } from "./apps";

const logo = (fill: string) =>
  "data:image/svg+xml," +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1 1"><rect width="1" height="1" fill="${fill}"/></svg>`,
  );

export const APPS: AppLink[] = [
  {
    name: "erpnext",
    title: "ERPNext",
    logo: logo("blue"),
    route: "/desk/home",
  },
  {
    name: "next_pms",
    title: "Next PMS",
    logo: logo("purple"),
    route: "/next-pms",
  },
  { name: "hrms", title: "HR", logo: logo("green"), route: "/hrms" },
];
