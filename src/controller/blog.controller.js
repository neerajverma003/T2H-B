import blogModel from '../models/blog.model.js';
import { getPresignedViewUrl } from './admin/s3.controller.js';

export const getBlog = async (req, res) => {
  try {
    const blogs = await blogModel.find({ visibility: 'Public' }).sort({ createdAt: -1 });
    
    // Process images with presigned URLs
    const blogData = await Promise.all(
      blogs.map(async (blog) => {
        const bObj = blog.toObject();
        if (bObj.cover_image && !bObj.cover_image.startsWith('http')) {
          bObj.cover_image = await getPresignedViewUrl(bObj.cover_image);
        }
        return bObj;
      })
    );

    return res.status(200).json({ msg: 'Successfully fetched', success: true, blogData: blogData || [] });
  } catch (error) {
    console.error('Error fetching blogs:', error);
    return res.status(500).json({ message: 'Internal Server Error' });
  }
};

export const getBlogById = async (req, res) => {
  try {
    const blogId = req.params.id;
    const blog = await blogModel.findById(blogId);
    if (!blog) {
      return res.status(404).json({ msg: 'Blog not found', success: false });
    }
    
    const blogData = blog.toObject();
    if (blogData.cover_image && !blogData.cover_image.startsWith('http')) {
      blogData.cover_image = await getPresignedViewUrl(blogData.cover_image);
    }

    return res.status(200).json({ msg: 'Successfully fetched', success: true, blogData });
  } catch (error) {
    console.error('Error fetching blog by ID:', error);
    return res.status(500).json({ message: 'Internal Server Error' });
  }
};
