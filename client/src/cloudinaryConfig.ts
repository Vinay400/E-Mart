import { Cloudinary } from '@cloudinary/url-gen';

// Replace these with your own values from your Cloudinary dashboard
export const CLOUDINARY_CLOUD_NAME = 'dckxqfljt';
export const CLOUDINARY_UPLOAD_PRESET = 'e_mart_products';

// Initialize Cloudinary instance
export const cld = new Cloudinary({
  cloud: {
    cloudName: CLOUDINARY_CLOUD_NAME
  },
  url: {
    secure: true
  }
});
export const CLOUDINARY_UPLOAD_URL = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`; 