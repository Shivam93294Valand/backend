const { v2: cloudinary } = require('cloudinary');
const dotenv = require('dotenv');

// Load .env
dotenv.config();

(async function () {
    cloudinary.config({
        cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
        api_key: process.env.CLOUDINARY_API_KEY,
        api_secret: process.env.CLOUDINARY_API_SECRET,
    });
    const uploadResult = await cloudinary.uploader
        .upload('https://res.cloudinary.com/demo/image/upload/getting-started/shoes.jpg', {
            public_id: 'shoes',
        })
        .catch((error) => {
            console.error('Upload Error:', error);
        });

    console.log('Upload Result:', uploadResult);

    const optimizeUrl = cloudinary.url('shoes', {
        fetch_format: 'auto',
        quality: 'auto',
    });

    console.log('Optimized URL:', optimizeUrl);

    const autoCropUrl = cloudinary.url('shoes', {
        crop: 'auto',
        gravity: 'auto',
        width: 500,
        height: 500,
    });

    console.log('Auto-Crop URL:', autoCropUrl);
})();