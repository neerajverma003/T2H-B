import customerGalleryModel from '../models/customerGallery.model.js';
import { getPresignedViewUrl } from './admin/s3.controller.js';

export const getCustomerGallery = async (req, res) => {
  try {
    const rawData = await customerGalleryModel.find().sort({ createdAt: -1 });
    if (!rawData || rawData.length === 0) {
      return res
        .status(200)
        .json({ msg: 'customerGalleery is Empty', success: true, customerGalleryData: [] });
    }

    const customerGalleryData = await Promise.all(
      rawData.map(async (item) => {
        const obj = item.toObject();
        if (obj.image && !obj.image.startsWith('http')) {
          obj.image = await getPresignedViewUrl(obj.image);
        }
        return obj;
      })
    );

    return res
      .status(200)
      .json({ msg: 'Customer Gallery Fetched Succesfully', success: true, customerGalleryData });
  } catch (error) {
    console.error(`Get customer gallery ${error}`);
    return res.status(500).json({ msg: 'Server Error', success: false });
  }
};
