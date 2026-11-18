import http from 'k6/http';
import { check, sleep } from 'k6';

const BASE = __ENV.API_BASE_URL || 'http://localhost:3002';
const EMAIL = __ENV.PERF_EMAIL || 'perf-admin@example.invalid';
const PASSWORD = __ENV.PERF_PASSWORD || 'PerfAdmin2026!';
const USERS = 5;

export const options = {
  vus: USERS,
  duration: '10s',
  thresholds: {
    http_req_failed: ['rate<0.01'],
    checks: ['rate>0.99'],
  },
};

function dateInDays(days) {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

export function setup() {
  const response = http.post(`${BASE}/auth/login`, JSON.stringify({ email: EMAIL, password: PASSWORD }), {
    headers: { 'Content-Type': 'application/json' },
  });
  const cookie = response.cookies.access_token?.[0]?.value;
  if (response.status !== 200 || !cookie) {
    throw new Error(`Perf admin login failed (HTTP ${response.status})`);
  }

  const carsResponse = http.get(`${BASE}/cars?brand=Honda&status=available`);
  if (carsResponse.status !== 200) throw new Error('Could not fetch seed cars');
  const carIds = [];
  let offset = 0;

  while (carIds.length < 200) {
    const carsResponse = http.get(
      `${BASE}/cars?brand=Honda&status=available&limit=100&offset=${offset}`
    );

    if (carsResponse.status !== 200) {
      throw new Error('Could not fetch seed cars');
    }

    const data = carsResponse.json();

    carIds.push(
      ...data.items
        .filter((car) => car.license_plate.startsWith('PERF'))
        .map((car) => car.car_id)
    );

    if (!data.pagination.has_more) break;

    offset += 100;
  }

  if (carIds.length < 200) {
    throw new Error(`Need at least 200 available perf Honda cars, found ${carIds.length}`);
  }
  return { cookie, carIds, start_date: dateInDays(90), end_date: dateInDays(92) };
}

export default function (data) {
  const index = (__ITER * USERS) + (__VU - 1);
  if (index >= data.carIds.length) return;

  const response = http.post(`${BASE}/rentals`, JSON.stringify({
    car_id: data.carIds[index],
    start_date: data.start_date,
    end_date: data.end_date,
  }), {
    headers: {
      'Content-Type': 'application/json',
      Cookie: `access_token=${data.cookie}`,
    },
  });
  check(response, { 'POST /rentals returns 201': (r) => r.status === 201 });
  sleep(0.3);
}
