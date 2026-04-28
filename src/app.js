import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

import authRoutes from './routes/auth.routes.js';
import vehicleRoutes from './routes/vehicle.routes.js';
import locationRoutes from './routes/location.routes.js';

import swaggerUi from 'swagger-ui-express';
import swaggerDoc from '../swagger.json' assert { type: 'json' };

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

app.use('/auth', authRoutes);
app.use('/vehicles', vehicleRoutes);
app.use('/locations', locationRoutes);

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDoc));

app.listen(process.env.PORT, () =>
  console.log("Server running")
);