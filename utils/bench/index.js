import { sleep } from "k6";
import { SharedArray } from "k6/data";
import { scenario } from "k6/execution";
import http from "k6/http";

import { login } from "./login.js"; // Import the login function

const data = new SharedArray("requests", function () {
  return JSON.parse(open("./data/requests.json"));
});

const COOKIE_NAME = "toite-auth-token";
const host = __ENV.HOST || "http://localhost:6701";
const username = "admin"; // Get username from env
const password = "123456"; // Get password from env

export const options = {
  stages: [
    { duration: "5s", target: 200 },
    { duration: "15s", target: 200 },
    { duration: "5s", target: 400 },
    { duration: "15s", target: 400 },
    { duration: "5s", target: 600 },
    { duration: "15s", target: 600 },
    { duration: "5s", target: 800 },
    { duration: "15s", target: 800 },
    { duration: "5s", target: 1000 },
    { duration: "15s", target: 1000 },
    { duration: "5s", target: 1200 },
    { duration: "15s", target: 1200 },
    { duration: "5s", target: 1400 },
    { duration: "15s", target: 1400 },
    { duration: "5s", target: 1600 },
    { duration: "15s", target: 1600 },
    { duration: "5s", target: 1800 },
    { duration: "15s", target: 1800 },
    { duration: "5s", target: 2000 },
    { duration: "15s", target: 2000 },
    { duration: "5s", target: 2200 },
    { duration: "15s", target: 2200 },
    { duration: "5s", target: 2400 },
    { duration: "15s", target: 2400 },
    { duration: "5s", target: 2600 },
    { duration: "15s", target: 2600 },
    { duration: "5s", target: 2800 },
    { duration: "15s", target: 2800 },
    { duration: "5s", target: 3000 },
    { duration: "55s", target: 3000 },
  ],
};

let jSessionId;

export function setup() {
  // Call login once before the test starts
  jSessionId = login(username, password, host);
  console.log(`jSessionId is ${jSessionId}`);
  return { jSessionId: jSessionId };
}

export default function () {
  const endpoint = data[scenario.iterationInTest % data.length];
  const url = `${host}${endpoint}`;

  const cookies = {};

  if (jSessionId) {
    cookies[COOKIE_NAME] = jSessionId;
  }

  const params = {
    headers: {
      Connection: "keep-alive",
      "Keep-Alive": "timeout=5, max=1000",
    },
    cookies: cookies,
    tags: { name: "fetch" },
    timeout: "30s",
  };

  http.get(url, params);

  sleep(0.1 * (scenario.iterationInTest % 6));
}
