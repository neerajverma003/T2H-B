import express from "express";
import {getCustomerGallery} from "../../controller/customerGallery.controller.js"

const customerGalleryRoute=express.Router();

customerGalleryRoute.get('/customer-gallery',getCustomerGallery)
export default customerGalleryRoute