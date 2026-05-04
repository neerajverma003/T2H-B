import blogModel from '../../models/blog.model.js';
import { formatCountryName } from '../../utils.js';
import { getPresignedViewUrl } from './s3.controller.js';

// Helper: Convert stored S3 keys to 5-hour Presigned GET URLs for Blogs
export const processBlogImages = async (blogs) => {
  const blogsArray = Array.isArray(blogs) ? blogs : [blogs];
  return await Promise.all(
    blogsArray.map(async (blog) => {
      const blogObj = blog.toObject ? blog.toObject() : blog;
      if (blogObj.cover_image && !blogObj.cover_image.startsWith('http')) {
        blogObj.cover_image = await getPresignedViewUrl(blogObj.cover_image);
      }
      return blogObj;
    })
  );
};

export const postBlog = async (req, res) => {
  const { title, content, visibility, category } = req.body;
  try {
    if (!title || !content || !visibility) {
      return res.status(400).json({ msg: 'All the fields are required', success: false });
    }

    // Handle image path - Now receiving S3 key from frontend
    const cover_image = req.body.cover_image || null;

    const newBlog = new blogModel({
      title,
      content,
      visibility: formatCountryName(visibility),
      cover_image: cover_image,
      category: category || 'honeymoon',
    });
    await newBlog.save();
    return res.status(201).json({ msg: 'Blog created successfully', success: true, blog: newBlog });
  } catch (error) {
    console.log(`Create blog error ${error}`);
    return res.status(500).json({ msg: 'Server Error', success: false });
  }
};

export const getBlog = async (req, res) => {
  try {
    const blogData = await blogModel.find();
    //   console.log(blogData)
    // Always return an array (empty if no blogs). Let client decide how to display.
    const processedData = await processBlogImages(blogData);
    // Always return an array (empty if no blogs). Let client decide how to display.
    return res.status(200).json({ msg: 'Successfully Fetched', success: true, blogData: processedData || [] });
  } catch (error) {
    console.log(`Get Blog Error ${error}`);
    return res.status(500).json({ msg: 'Server Error', success: false });
  }
};



export const updateBlog = async (req, res) => {
  const { title, content, visibility, category } = req.body;
  const { blogId } = req.params;
  try {
    const blogData = await blogModel.findById(blogId);
    if (!blogData) {
      return res.status(404).json({ msg: 'Blog not found', success: false });
    }

    if (title) blogData.title = title;
    if (content) blogData.content = content;
    if (visibility) blogData.visibility = formatCountryName(visibility);
    if (category) blogData.category = category;
    
    // Handle image path - Now receiving S3 key from frontend
    if (req.body.cover_image) {
      blogData.cover_image = req.body.cover_image;
    }

    await blogData.save();

    return res.status(200).json({ msg: 'Blog updated successfully', success: true, blog: blogData });
  } catch (error) {
    console.log(`Update Blog Error -> ${error}`);
    return res.status(500).json({ msg: 'Server Error', success: false });
  }
};

export const deleteBlog=async(req,res)=>{
  const {blogId}=req.params;
  console.log(blogId);
  try{
    if(!blogId){
   return res.status(400).json({msg:"All the fields are required", success:false});
   }
    const isSuccess=await blogModel.findByIdAndDelete(blogId);
    if(!isSuccess){
      return res.status(400).json({msg:"The selected blog won't be deleted, try again", success:false});
    }
    return res.status(200).json({msg:"Blog is deleted SuccessFully", success:true});
  }
  catch(error){
    console.log(`Delete Blog Error ${error}`);
    return res.status(500).json({msg:"Server Error", success:false});
  }
}


export const getSingleBlog=async(req,res)=>{
   const {blogId}=req.params;
  try{
    if(!blogId){
      return res.status(400).json({msg:"All the fileds are required", success:false});
    }
    const blogData=await blogModel.findById(blogId);
    if(!blogData){
      return res.status(404).json({msg:"The Selected Blog won't exists", success:false});
    }
    const [processedBlog] = await processBlogImages([blogData]);
    return res.status(200).json({ msg: "Successfullt fetched", success: true, blogData: processedBlog });
  }
  catch(error){
    console.log(`Get Single Blog ${error}`);
    return res.status(500).json({msg:"Server Error", success:false})
  }
}