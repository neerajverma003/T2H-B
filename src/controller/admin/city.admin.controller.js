import cityModel from '../../models/city.model.js';
import mongoose from 'mongoose';
import { formatCountryName } from '../../utils.js';
import { getPresignedViewUrl } from './s3.controller.js';

// Helper: Convert stored S3 keys to 5-hour Presigned GET URLs for Cities
export const processCityImages = async (cities) => {
  const citiesArray = Array.isArray(cities) ? cities : [cities];
  return await Promise.all(
    citiesArray.map(async (city) => {
      const cObj = city.toObject ? city.toObject() : city;
      if (cObj.city_image && Array.isArray(cObj.city_image)) {
        const signedUrls = await Promise.all(
          cObj.city_image.map((img) => getPresignedViewUrl(img))
        );
        cObj.city_image = signedUrls.filter(url => url !== null);
      }
      return cObj;
    })
  );
};

export const createCity = async (req, res) => {
  const { city_name, city_category, visibility, id } = req.body;
  const images = req.body.images || [];

  try {
    // 1. Validate required fields
    if (!city_name || !city_category || !visibility || !id) {
      return res.status(400).json({ msg: 'All fields are required', success: false });
    }

    // 2. Check if city already exists
    const formattedName = formatCountryName(city_name);
    const cityExists = await cityModel.findOne({ city_name: formattedName });
    if (cityExists) {
      return res.status(409).json({ msg: 'City already exists', success: false });
    }

    // 3. Normalize city_category input
    let citiCategoryData = [];
    if (Array.isArray(city_category)) {
      citiCategoryData = city_category;
    } else if (typeof city_category === 'string') {
      try {
        const parsed = JSON.parse(city_category);
        citiCategoryData = Array.isArray(parsed) ? parsed : [parsed];
      } catch {
        citiCategoryData = [city_category];
      }
    }

    // 4. Create new city using S3 keys
    const newCity = new cityModel({
      city_name: formattedName,
      city_category: citiCategoryData,
      visibility: formatCountryName(visibility),
      city_image: Array.isArray(images) ? images : [images],
      state: id,
    });

    await newCity.save();

    return res.status(201).json({ msg: 'City created successfully', success: true, data: newCity });
  } catch (error) {
    console.error('createCity ->', error);
    return res.status(500).json({ msg: 'Server Error', success: false });
  }
};


export const getStateCity = async (req, res) => {
  const { destinationId } = req.params;
  try {
    if (!mongoose.Types.ObjectId.isValid(destinationId)) {
      return res.status(400).json({ msg: "Invalid state ID", success: false });
    }
    const objectId = new mongoose.Types.ObjectId(destinationId);

    const citiesData = await cityModel.find({ state: objectId }).sort({ createdAt: -1 });
    const processedCities = await processCityImages(citiesData);

    return res.status(200).json({
      msg: "Cities fetched",
      success: true,
      citiesData: processedCities,
    });
  } catch (error) {
    console.error(`GetStateCity Error -> ${error}`);
    return res.status(500).json({ msg: "Server Error", success: false });
  }
};


export const getCity = async (req, res) => {
  const { cityId } = req.params;
  try {
    if (!cityId) {
      return res.status(400).json({ msg: 'city needs to be selected', success: false });
    }
    const cityData = await cityModel.findById(cityId);
    if (!cityData) {
      return res.status(400).json({ msg: 'There is no city exists', success: false });
    }
    
    const [processedCity] = await processCityImages([cityData]);
    return res.status(200).json({ msg: 'Successfully cities fetched', success: true, cityData: processedCity });
  } catch (error) {
    console.log(`Get City Error ${error}`);
    return res.status(500).json({ msg: 'Server Error', success: false });
  }
};

export const UpdateCity = async (req, res) => {
  try {
    const { cityId } = req.params;
    const { city_name, city_category, visibility, id } = req.body;
    const newImages = req.body.images || [];

    const existingCity = await cityModel.findById(cityId);
    if (!existingCity) {
      return res.status(404).json({ msg: 'City not found', success: false });
    }

    const formattedName = formatCountryName(city_name);
    let citiCategoryData = [];
    if (typeof city_category === 'string') {
      try {
        const parsed = JSON.parse(city_category);
        citiCategoryData = Array.isArray(parsed) ? parsed : [parsed];
      } catch (e) {
        citiCategoryData = [city_category];
      }
    } else if (Array.isArray(city_category)) {
      citiCategoryData = city_category;
    }

    // Keep existing images (frontend should send them back if keeping them, or we manage removed images)
    // Actually the previous logic was: city_image: [...existingCity.city_image, ...imagepath]
    // Let's just append new images to existing ones. Or better, let frontend send the exact array of images to keep.
    // If the frontend sends existingImages, we use that.
    const existingImagesList = req.body.existingImages || existingCity.city_image;

    const updatedCity = await cityModel.findByIdAndUpdate(
      cityId,
      {
        city_name: formattedName,
        city_category: citiCategoryData,
        visibility: formatCountryName(visibility),
        city_image: [...(Array.isArray(existingImagesList) ? existingImagesList : [existingImagesList]), ...(Array.isArray(newImages) ? newImages : [newImages])],
        state: id,
      },
      { new: true }
    );

    if (!updatedCity) {
      return res.status(404).json({ msg: 'City not found', success: false });
    }

    return res
      .status(200)
      .json({ msg: 'City updated successfully', success: true, data: updatedCity });
  } catch (error) {
    console.log(`Update City Error ${error}`);
    return res.status(500).json({ msg: 'Server Error', success: false });
  }
};

export const DeleteCity = async (req, res) => {
  try {
    const { cityId } = req.params;

    if (!cityId) {
      return res.status(400).json({ msg: 'City ID is required', success: false });
    }

    const deletedCity = await cityModel.findByIdAndDelete(cityId);

    if (!deletedCity) {
      return res.status(404).json({ msg: 'City not found', success: false });
    }

    return res
      .status(200)
      .json({ msg: 'City deleted successfully', success: true, data: deletedCity });
  } catch (error) {
    console.log(`Delete City Error ${error}`);
    return res.status(500).json({ msg: 'Server Error', success: false });
  }
};
