import heroSectionVideoModel from '../models/heroSection.model.js'
import { formatCountryName } from '../utils.js';
import { getPresignedViewUrl } from './admin/s3.controller.js';

export const getHeroSectionVideo = async (req, res) => {
  const { title } = req.params;
  try {
    if (!title) {
      return res.status(400).json({ msg: "Title Required", success: false });
    }

    const heroSectionData = await heroSectionVideoModel.findOne({
      title: formatCountryName(title),
    });

    if (!heroSectionData) {
      return res.status(200).json({ msg: 'No media for this title', success: true, publicUrl: [], media_type: null });
    }

    // Get only Public items, generate presigned URLs
    const publicItems = await Promise.all(
      heroSectionData.video_url
        .filter((item) => item.visibility === 'Public')
        .map(async (item) => {
          const u = item.url;
          if (!u) return null;
          const resolvedUrl = u.startsWith('http') ? u : await getPresignedViewUrl(u);
          return {
            url: resolvedUrl,
            media_type: item.media_type || 'video', // default to video for legacy data
          };
        })
    );

    const validItems = publicItems.filter(Boolean);

    return res.status(200).json({
      success: true,
      msg: 'Successfully fetched',
      // Legacy support: publicUrl array (still used by some components)
      publicUrl: validItems.map((i) => i.url),
      // New: structured response with media_type
      media: validItems[0] || null, // { url, media_type }
    });
  } catch (error) {
    console.error("Error in getHeroSectionVideo:", error);
    return res.status(500).json({ msg: "Internal Server Error", success: false });
  }
}



export const getAllVideo=async(req,res)=>{
  try {
    const allVideo = await heroSectionVideoModel.find({});
    return res.status(200).json({msg:"Successfully fetched all videos", success:true, data:allVideo});
  } catch (error) {
    console.log(error)
    return res.status(500).json({msg:"Internal Server Error", success:false});
  }
}
