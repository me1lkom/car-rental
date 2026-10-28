import express from 'express';
import { pinoHttp } from 'pino-http';
import type { IncomingMessage, ServerResponse } from 'node:http';
import 'dotenv/config';
import cookieParser from 'cookie-parser';
import carsRouter from './routes/cars.routes.js';
import userRouter from './routes/users.routes.js'
import authUsers from './routes/auth.routes.js';
import rentalsRouter from './routes/rentals.routes.js';

const app = express();

app.use(pinoHttp({
    wrapSerializers: false,

    serializers: {
        req(req: IncomingMessage) {
            return {
                method: req.method,
                url: req.url?.split('?')[0]
            };
        },

        res(res: ServerResponse) {
            return {
                statusCode: res.statusCode
            };
        }
    }
}));
app.use(express.json());
app.use(cookieParser()); 

app.use('/cars', carsRouter);

app.use('/users', userRouter);

app.use('/auth', authUsers)

app.use('/rentals', rentalsRouter)

app.listen(3000, () => {
    console.log('Server started on http://localhost:3000');
});