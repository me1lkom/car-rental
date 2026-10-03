import express from 'express';
import 'dotenv/config';
import cookieParser from 'cookie-parser';
import carsRouter from './routes/cars.routes.js';
import userRouter from './routes/users.routes.js'
import authUsers from './routes/auth.routes.js';

const app = express();

app.use(express.json());
app.use(cookieParser()); 

app.use('/cars', carsRouter);

app.use('/users', userRouter);

app.use('/auth', authUsers)


app.listen(3000, () => {
    console.log('Server started on http://localhost:3000');
});