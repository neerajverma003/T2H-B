import express from 'express';

import { createResort, deleteResort, getAll, getResortById , updateResort } from '../../controller/admin/resortController.js';

const Route = express.Router();



Route.post('/resort', createResort);
Route.get("/all",getAll)
Route.get("/get/:id",getResortById)

Route.patch("/update/:id", updateResort);
Route.delete("/delete/:id", deleteResort)

export default Route;