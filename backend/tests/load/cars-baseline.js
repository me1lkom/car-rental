import http from 'k6/http';
import { check,sleep } from 'k6';

export const options = {
    stages: [
        {duration: '10s', target: 10},
        {duration: '15s', target: 20},
        {duration: '15s', target: 50},
        {duration: '10s', target: 50},
        {duration: '10s', target: 0},
    ],
    thresholds: {
        http_req_duration: ['p(95)<100'],
        http_req_failed: ['rate<0.01'],
        checks: ['rate>0.99']
    }
};

export default function() {
    const response = http.get('http://localhost:3000/cars');

    check(response, {
        'GET /cars возвращает 200': (r) => r.status === 200
    });

    sleep(1);
}