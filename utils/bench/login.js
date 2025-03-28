import { check } from "k6";
import http from "k6/http";

const COOKIE_NAME = "toite-auth-token";

export function login(username, password, baseUrl) {
  const url = `${baseUrl}/auth/sign-in`; // Replace with your login endpoint

  const payload = JSON.stringify({
    login: username,
    password: password,
  });

  const params = {
    headers: {
      "Content-Type": "application/json",
    },
  };

  const res = http.post(url, payload, params);

  console.log(payload);
  console.log(res.json());

  check(res, {
    "Login successful": (r) => r.status === 200, // Or whatever status code your API returns
  });

  // Extract cookies
  const cookies = res.cookies;
  let jSessionId = null;

  if (cookies && cookies[COOKIE_NAME] && cookies[COOKIE_NAME].length > 0) {
    jSessionId = cookies[COOKIE_NAME][0].value;
  }
  return jSessionId;
}
