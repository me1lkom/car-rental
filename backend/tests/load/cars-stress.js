import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
    vus: 30,
    duration: '30s',

    thresholds: {
        http_req_duration: ['p(95)<100'],
        http_req_failed: ['rate<0.01'],
        checks: ['rate>0.99']
    }
};

export default function () {
    const response = http.get('http://localhost:3000/cars');

    check(response, {
        'GET /cars возвращает 200': (r) => r.status === 200
    });

    sleep(0.1);
}