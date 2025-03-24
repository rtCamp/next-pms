import { request } from "@playwright/test";
import config from "../../playwright.config";

// Load config variables
const baseURL = config.use?.baseURL;

// Load env variables
const repManEmail = process.env.ADMIN_EMAIL;
const repManPass = process.env.ADMIN_PASS;

let context; // Global request context to maintain session

export const login = async () => {
  // Create new request context
  context = await request.newContext({ baseURL: baseURL });

  const response = await context.post(`/login`, {
    data: {
      cmd: "login",
      usr: repManEmail,
      pwd: repManPass,
    },
  });

  return { response, context }; // Return both response and context
};
