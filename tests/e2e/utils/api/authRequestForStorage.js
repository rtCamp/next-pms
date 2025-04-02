/**
 * Login into NextPMS via API
 */
export const loginIntoNextPMS = async (requestContext, email, password) => {
  const response = await requestContext.post(`/login`, {
    data: {
      cmd: "login",
      usr: email,
      pwd: password,
    },
  });

  // Ensure login was successful
  if (!response.ok()) {
    throw new Error(`Login failed: ${response.status()} ${response.statusText()}`);
  }

  return response;
};
