import { v2 as cloudinary } from 'cloudinary';
import { env } from './env';

const isConfigured =
  !!(env.CLOUDINARY_CLOUD_NAME && env.CLOUDINARY_API_KEY && env.CLOUDINARY_API_SECRET);

if (isConfigured) {
  cloudinary.config({
    cloud_name: env.CLOUDINARY_CLOUD_NAME,
    api_key: env.CLOUDINARY_API_KEY,
    api_secret: env.CLOUDINARY_API_SECRET,
  });
} else {
  console.warn(
    '⚠️  Cloudinary not configured — file uploads will return placeholder URLs in dev',
  );
}

export { cloudinary, isConfigured as cloudinaryConfigured };
