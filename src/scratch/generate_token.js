import jwt from 'jsonwebtoken';
import { ENV } from '../config/ENV.js';

const token = jwt.sign({ id: '6a0c38f705cdc38fd314bda3' }, ENV.JWT_SECRET || '176c75f44a2524e6b8bc4a12ab5dcec60f932505', { expiresIn: '1d' });
console.log(token);
