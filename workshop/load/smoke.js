import http from "k6/http";
import { check, sleep } from "k6";

export const options = {
  scenarios: {
    baseline: { executor: "constant-vus", vus: 5, duration: "1m" },
    peak: { executor: "ramping-vus", startTime: "1m", stages: [{ duration: "1m", target: 50 }, { duration: "2m", target: 50 }, { duration: "1m", target: 0 }] }
  },
  thresholds: {
    http_req_failed: ["rate<0.01"],
    http_req_duration: ["p(95)<500"]
  }
};

export default function () {
  const response = http.get(__ENV.TARGET_URL);
  check(response, { "status is 200": (result) => result.status === 200 });
  sleep(0.2);
}