import http from 'k6/http';
import { check, sleep } from 'k6';

const BASE = __ENV.API_BASE_URL || 'http://localhost:3002';
const EMAIL = __ENV.PERF_EMAIL || 'perf-admin@example.invalid';
const PASSWORD = __ENV.PERF_PASSWORD || 'PerfAdmin2026!';

export const options = {
  vus: 5,
  duration: '15s',
  thresholds: {
    http_req_failed: ['rate<0.01'],
    checks: ['rate>0.99'],
  },
};

export function setup() {
  const response = http.post(`${BASE}/auth/login`, JSON.stringify({ email: EMAIL, password: PASSWORD }), {
    headers: { 'Content-Type': 'application/json' },
  });
  const cookie = response.cookies.access_token?.[0]?.value;
  if (response.status !== 200 || !cookie) {
    throw new Error(`Perf admin login failed (HTTP ${response.status})`);
  }
  return { cookie };
}

export default function (data) {
  const response = http.get(`${BASE}/rentals?limit=20&offset=0`, {
    headers: { Cookie: `access_token=${data.cookie}` },
  });
  check(response, { 'GET /rentals returns 200': (r) => r.status === 200 });
  sleep(0.5);
}
