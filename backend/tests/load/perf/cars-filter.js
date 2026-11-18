import http from 'k6/http';
import { check, sleep } from 'k6';

const BASE = __ENV.API_BASE_URL || 'http://localhost:3002';
export const options = {
  vus: 5,
  duration: '15s',
  discardResponseBodies: true,
  thresholds: {
    http_req_failed: ['rate<0.01'],
    checks: ['rate>0.99'],
  },
};

export default function () {
  const response = http.get(`${BASE}/cars?brand=Honda&status=available`);
  check(response, { 'GET /cars filtered returns 200': (r) => r.status === 200 });
  sleep(0.3);
}
