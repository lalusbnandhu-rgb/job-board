import { cloudinary, cloudinaryConfigured } from '../config/cloudinary';

export interface UploadResult {
  url: string;
  publicId: string;
}

/** Upload a buffer to Cloudinary. Falls back to a placeholder URL in dev. */
export const uploadBuffer = (
  buffer: Buffer,
  folder: string,
  options: object = {},
): Promise<UploadResult> => {
  if (!cloudinaryConfigured) {
    return Promise.resolve({
      url: `https://placehold.co/400x400/e2e8f0/94a3b8?text=Dev+Upload`,
      publicId: `dev-placeholder-${Date.now()}`,
    });
  }

  return new Promise((resolve, reject) => {
    cloudinary.uploader
      .upload_stream({ folder, ...options }, (error, result) => {
        if (error || !result) {
          return reject(error ?? new Error('Cloudinary upload returned no result'));
        }
        resolve({ url: result.secure_url, publicId: result.public_id });
      })
      .end(buffer);
  });
};

/** Delete a file from Cloudinary by its public ID. No-op in dev. */
export const deleteFile = async (publicId: string): Promise<void> => {
  if (!cloudinaryConfigured || publicId.startsWith('dev-placeholder')) return;
  await cloudinary.uploader.destroy(publicId);
};
