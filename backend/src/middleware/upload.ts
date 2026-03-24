import multer from 'multer';
import { Request, Response, NextFunction, RequestHandler } from 'express';
import { ApiError } from '../utils/errors';

const MB = 1024 * 1024;

/** Magic byte signatures per MIME type — verifies actual file content */
const MAGIC_BYTES: Record<string, Array<{ offset: number; bytes: Buffer }>> = {
  'image/jpeg': [{ offset: 0, bytes: Buffer.from([0xff, 0xd8, 0xff]) }],
  'image/png':  [{ offset: 0, bytes: Buffer.from([0x89, 0x50, 0x4e, 0x47]) }],
  'image/webp': [
    { offset: 0, bytes: Buffer.from('RIFF', 'ascii') },
    { offset: 8, bytes: Buffer.from('WEBP', 'ascii') },
  ],
  'application/pdf': [{ offset: 0, bytes: Buffer.from('%PDF', 'ascii') }],
};

function assertMagicBytes(buffer: Buffer, mimeType: string): void {
  const signatures = MAGIC_BYTES[mimeType];
  if (!signatures) return; // no known signature — skip check

  const valid = signatures.every(({ offset, bytes }) => {
    if (buffer.length < offset + bytes.length) return false;
    return buffer.slice(offset, offset + bytes.length).equals(bytes);
  });

  if (!valid) {
    throw new ApiError(
      400,
      `File content does not match the declared type "${mimeType}"`,
    );
  }
}

/**
 * Factory: returns an Express middleware that runs multer for a single file field.
 * Converts multer errors into ApiError so the global handler formats them consistently.
 * After multer processes the file, validates magic bytes against the declared MIME type.
 */
const createUploadMiddleware = (
  allowedMimeTypes: string[],
  maxSizeMB: number,
  fieldName: string,
): RequestHandler => {
  const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: maxSizeMB * MB },
    fileFilter: (_req, file, cb) => {
      if (!allowedMimeTypes.includes(file.mimetype)) {
        return cb(
          new Error(
            `Invalid file type "${file.mimetype}". Allowed: ${allowedMimeTypes.join(', ')}`,
          ),
        );
      }
      cb(null, true);
    },
  }).single(fieldName);

  return (req: Request, res: Response, next: NextFunction) => {
    upload(req, res, (err) => {
      if (err instanceof multer.MulterError) {
        return next(
          new ApiError(
            400,
            err.code === 'LIMIT_FILE_SIZE'
              ? `File is too large. Maximum size is ${maxSizeMB}MB`
              : err.message,
          ),
        );
      }
      if (err) return next(new ApiError(400, (err as Error).message));

      // Validate actual file bytes — prevents MIME-type spoofing
      if (req.file?.buffer) {
        try {
          assertMagicBytes(req.file.buffer, req.file.mimetype);
        } catch (magicErr) {
          return next(magicErr);
        }
      }

      next();
    });
  };
};

export const uploadAvatar = createUploadMiddleware(
  ['image/jpeg', 'image/png', 'image/webp'],
  2,
  'avatar',
);

export const uploadResume = createUploadMiddleware(
  ['application/pdf'],
  5,
  'resume',
);
