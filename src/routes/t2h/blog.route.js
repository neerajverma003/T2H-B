import express from 'express';
import { getBlog, getBlogById } from '../../controller/blog.controller.js';

const blogRoute = express.Router();

// Public endpoints for blogs
blogRoute.get('/', getBlog);
blogRoute.get('/:id', getBlogById);

export default blogRoute;
