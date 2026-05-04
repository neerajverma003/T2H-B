import imageGalleryModel from '../models/imageGallery.model.js';

const getAllImageGallery = async (req, res) => {
  try {
    const data = await imageGalleryModel.find({});
    if (!data) {
      return res.status(400).json({ message: 'No image found' });
    }
    return res.status(200).json(data);
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: 'Server Error' });
  }
};

export default getAllImageGallery;
