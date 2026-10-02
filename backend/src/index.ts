import express from 'express';
import 'dotenv/config';
import carsRouter from './routes/cars.routes.js';
import userRouter from './routes/users.routes.js'

const app = express();

app.use(express.json());

app.use('/cars', carsRouter);

app.use('/users', userRouter);


app.listen(3000, () => {
    console.log('Server started on http://localhost:3000');
});