import { check, sleep } from "k6";
import { SharedArray } from "k6/data";
import { scenario } from "k6/execution";
import http from "k6/http";

const requestsData = new SharedArray("requests", function () {
  return JSON.parse(open("./data/requests.json"));
});

const host = __ENV.HOST || "http://localhost:6701";
const username = "admin"; // Get username from env
const password = "123456"; // Get password from env

export const options = {
  stages: [
    { duration: "5s", target: 10 },
    { duration: "5s", target: 20 },
    { duration: "5s", target: 30 },
    { duration: "5s", target: 40 },
    { duration: "5s", target: 50 },
    { duration: "5s", target: 60 },
    { duration: "5s", target: 70 },
    { duration: "5s", target: 80 },
    { duration: "5s", target: 90 },
    { duration: "5s", target: 100 },
    { duration: "50s", target: 100 },
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

export function login(login, password) {
  const url = `${host}/auth/sign-in`;

  const payload = JSON.stringify({
    login,
    password,
  });

  const res = http.post(url, payload, {
    headers: {
      "Content-Type": "application/json",
      "User-Agent": "k6-load-test/1.0",
      "x-disable-session-refresh": "true",
    },
  });

  check(res, {
    "Login successful": (r) => r.status === 200,
  });

  // Get the session cookie from response
  const cookies = res.headers["Set-Cookie"];
  return cookies;
}

export function setup() {
  const cookies = login(username, password);
  return { cookies };
}

export default function (data) {
  const endpoint = requestsData[scenario.iterationInTest % requestsData.length];
  const url = `${host}${endpoint}`;

  const res = http.get(url, {
    headers: {
      Connection: "keep-alive",
      "Keep-Alive": "timeout=5, max=1000",
      "User-Agent": "k6-load-test/1.0",
      "x-disable-session-refresh": "true",
      Cookie: data.cookies, // Add the cookies to subsequent requests
    },
    tags: { name: "fetch" },
    timeout: "30s",
  });

  if (res.status !== 200) {
    console.log(
      `Failed request to ${url}: ${res.status} ${res.body} ${res.request.cookies}`,
    );
  }

  sleep(0.1 * (scenario.iterationInTest % 6));
}
