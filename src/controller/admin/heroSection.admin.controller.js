// import heroSectionVideoModel from '../../models/heroSection.model.js';
// import { formatCountryName } from '../../utils.js';

// // Creating new Hero Section video
// export const heroSection = async (req, res) => {
//   // console.log(req)
//   // console.log(req.file.path);
//   try {
//     const { title, visibility } = req.body;

//     console.log(title, visibility);


    
    

//     if (!title) {
//       return res.status(400).json({ msg: 'Title Field Required', success: false });
//     }
//     const titleAlreadyExists = await heroSectionVideoModel.findOne({
//       title: formatCountryName(title),
//     });
//     if (titleAlreadyExists) {
//       titleAlreadyExists.video_url = [
//         ...titleAlreadyExists.video_url,
//         {
//           url: req.file.path,
//           visibility: formatCountryName(visibility),
//         },
//       ];
//       await titleAlreadyExists.save();
//       return res.status(200).json({ msg: 'Hero video saved', success: true, titleAlreadyExists });
//     }
//     const newHeroVideo = new heroSectionVideoModel({
//       title: formatCountryName(title),
//       video_url: [
//         {
//           url: req.file.path,
//           visibility: formatCountryName(visibility),
//         },
//       ],
//     });
//     await newHeroVideo.save();
//     return res.status(200).json({ msg: 'Hero video saved', success: true, newHeroVideo });
//   } catch (error) {
//     console.log(`Admin Hero Section -> ${error}`);
//     return res.status(500).json({ msg: 'Server Error', success: false });
//   }
// };

// // Right Now it is geeting all the Hero video from the DataBase but in future if needed we optimize it

// export const getAllHeroVideo = async (req, res) => {
//   const { page } = req.params;
//   try {
//     const heroVideoData = await heroSectionVideoModel.find({ title: formatCountryName(page) });
//     if (!heroVideoData || heroVideoData.length === 0) {
//       return res.status(404).json({ msg: 'No Data available', success: false });
//     }
//     // console.log(heroVideoData)
//     return res.status(200).json({ msg: 'Success Fatched', success: true, heroVideoData });
//   } catch (error) {
//     console.log(`Get All the Hero video error ${error}`);
//     return res.status(500).json({ msg: 'Server Error', success: false });
//   }
// };

// // Update Hero Section Video

// export const updateHeroVideo = async (req, res) => {
//   const { title } = req.body;
//   const { videoId } = req.params;

//   try {
//     const heroDoc = await heroSectionVideoModel.findOne({ title });

//     if (!heroDoc) {
//       return res.status(404).json({ msg: "The Data doesn't exist", success: false });
//     }

//     const videoItem = heroDoc.video_url.find((data) => data._id.toString() === videoId);

//     if (!videoItem) {
//       return res.status(404).json({ msg: 'Video not found', success: false });
//     }

//     // ✅ Toggle visibility
//     videoItem.visibility = videoItem.visibility === 'Public' ? 'Private' : 'Public';

//     await heroDoc.save();

//     return res.status(200).json({ msg: 'Visibility toggled successfully', success: true });
//   } catch (error) {
//     console.log(`Update Hero Video Error -> ${error}`);
//     return res.status(500).json({ msg: 'Server Error', success: false });
//   }
// };

// // Delete hero video 
// export const deleteHeroVideo = async (req, res) => {
//   // console.log(req.body)
//   const { title } = req.query;
//   const { videoId } = req.params;
//   console.log(videoId);
//   console.log(title);
  
//   try {
//     if (!videoId || !title) {
//       return res
//         .status(400)
//         .json({ msg: 'Video needs to be selected for deletion', success: false });
//     }

//     // Find the document with given title
//     const heroDoc = await heroSectionVideoModel.findOne({ title: formatCountryName(title) });

//     if (!heroDoc) {
//       return res.status(404).json({ msg: 'Hero section not found', success: false });
//     }

//     // Check if video exists
//     const videoExists = heroDoc.video_url.some((video) => video._id.toString() === videoId);
//     if (!videoExists) {
//       return res.status(404).json({ msg: 'Video not found', success: false });
//     }

//     // Filter out the video
//     heroDoc.video_url = heroDoc.video_url.filter((video) => video._id.toString() !== videoId);

//     // Save the updated document
//     await heroDoc.save();

//     return res.status(200).json({ msg: 'Video deleted successfully', success: true });
//   } catch (error) {
//     console.log(`Delete Hero Video Error: ${error}`);
//     return res.status(500).json({ msg: 'Server error', success: false });
//   }
// };

import heroSectionVideoModel from "../../models/heroSection.model.js";
import { formatCountryName } from "../../utils.js";
import { getPresignedViewUrl } from "./s3.controller.js";

// Helper: Convert stored S3 keys to 5-hour Presigned GET URLs for Hero Videos
export const processHeroVideos = async (heroDoc) => {
  if (!heroDoc || !heroDoc.video_url) return heroDoc;
  
  const processedUrls = await Promise.all(
    heroDoc.video_url.map(async (v) => {
      const vObj = v.toObject ? v.toObject() : v;
      if (vObj.url && !vObj.url.startsWith('http')) {
        vObj.url = await getPresignedViewUrl(vObj.url);
      }
      return vObj;
    })
  );
  
  const docObj = heroDoc.toObject ? heroDoc.toObject() : heroDoc;
  docObj.video_url = processedUrls.filter(v => v.url !== null);
  return docObj;
};

/**
 * =========================================
 * CREATE / REPLACE HERO MEDIA (Image or Video)
 * =========================================
 */
export const heroSection = async (req, res) => {
  try {
    const title = req.body?.title;
    const visibility = req.body?.visibility || "Public";

    if (!title) {
      return res.status(400).json({ success: false, msg: "Title is required" });
    }

    const storedKey = req.body.video_key || null;
    if (!storedKey) {
      return res.status(400).json({ success: false, msg: "Media key is required" });
    }

    // Auto-detect media_type from file extension
    const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.avif', '.svg'];
    const ext = storedKey.split('.').pop()?.toLowerCase();
    const media_type = imageExtensions.includes(`.${ext}`) ? 'image' : 'video';

    const formattedTitle = formatCountryName(title);
    const formattedVisibility = formatCountryName(visibility);

    const newMediaItem = {
      url: storedKey,
      media_type,
      visibility: formattedVisibility,
    };

    // Always REPLACE — only 1 media item per page at a time
    let heroDoc = await heroSectionVideoModel.findOne({ title: formattedTitle });

    if (heroDoc) {
      heroDoc.video_url = [newMediaItem];
      await heroDoc.save();
      return res.status(200).json({
        success: true,
        msg: `Hero ${media_type} replaced successfully`,
        media_type,
      });
    }

    // Create new document
    heroDoc = new heroSectionVideoModel({
      title: formattedTitle,
      video_url: [newMediaItem],
    });
    await heroDoc.save();

    return res.status(200).json({
      success: true,
      msg: `Hero ${media_type} uploaded successfully`,
      media_type,
    });
  } catch (error) {
    console.error("Hero Section Upload Error:", error);
    return res.status(500).json({ success: false, msg: "Server Error" });
  }
};


/**
 * =========================================
 * GET ALL HERO MEDIA BY PAGE
 * =========================================
 */
export const getAllHeroVideo = async (req, res) => {
  const { page } = req.params;

  try {
    const heroVideoData = await heroSectionVideoModel.findOne({
      title: formatCountryName(page),
    });

    const processedData = await processHeroVideos(heroVideoData);
    const items = processedData?.video_url || [];

    return res.status(200).json({
      success: true,
      title: page,
      // Return the single media item (first in array) with its type
      data: items,
      current: items[0] || null, // convenience: the active media
    });
  } catch (error) {
    console.error("Get Hero Video Error:", error);
    return res.status(500).json({ success: false, msg: "Server Error" });
  }
};


/**
 * =========================================
 * TOGGLE HERO VIDEO VISIBILITY
 * =========================================
 */
export const updateHeroVideo = async (req, res) => {
  try {
    const { videoId } = req.params;
    const { title } = req.body;

    if (!videoId || !title) {
      return res.status(400).json({
        success: false,
        msg: "Video ID and title are required",
      });
    }

    const formattedTitle = formatCountryName(title);

    const heroDoc = await heroSectionVideoModel.findOne({
      title: formattedTitle,
    });

    if (!heroDoc) {
      return res.status(404).json({
        success: false,
        msg: "Hero section not found",
      });
    }

    const videoItem = heroDoc.video_url.find(
      (v) => v._id.toString() === videoId
    );

    if (!videoItem) {
      return res.status(404).json({
        success: false,
        msg: "Video not found",
      });
    }

    // ✅ Toggle visibility
    videoItem.visibility =
      videoItem.visibility === "Public" ? "Private" : "Public";

    await heroDoc.save();

    return res.status(200).json({
      success: true,
      msg: "Visibility updated successfully",
    });
  } catch (error) {
    console.error("Update Hero Video Error:", error);
    return res.status(500).json({
      success: false,
      msg: error.message || "Server error",
    });
  }
};

/**
 * =========================================
 * DELETE HERO VIDEO
 * =========================================
 */
export const deleteHeroVideo = async (req, res) => {
  try {
    const { videoId } = req.params;
    const { title } = req.query;

    if (!videoId || !title) {
      return res.status(400).json({
        success: false,
        msg: "Video ID and title are required",
      });
    }

    const formattedTitle = formatCountryName(title);

    const heroDoc = await heroSectionVideoModel.findOne({
      title: formattedTitle,
    });

    if (!heroDoc) {
      return res.status(404).json({
        success: false,
        msg: "Hero section not found",
      });
    }

    const videoExists = heroDoc.video_url.some(
      (v) => v._id.toString() === videoId
    );

    if (!videoExists) {
      return res.status(404).json({
        success: false,
        msg: "Video not found",
      });
    }

    heroDoc.video_url = heroDoc.video_url.filter(
      (v) => v._id.toString() !== videoId
    );

    await heroDoc.save();

    return res.status(200).json({
      success: true,
      msg: "Hero video deleted successfully",
    });
  } catch (error) {
    console.error("Delete Hero Video Error:", error);
    return res.status(500).json({
      success: false,
      msg: error.message || "Server error",
    });
  }
};
