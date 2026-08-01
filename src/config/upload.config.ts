import fs from 'fs';
import path from 'path';
import multer from 'multer';

export const UPLOADS_ROOT = path.join(process.cwd(), 'uploads');
export const JUNTA_UPLOADS_DIR = path.join(UPLOADS_ROOT, 'junta');

export const ensureUploadDirs = (): void => {
  fs.mkdirSync(JUNTA_UPLOADS_DIR, { recursive: true });
};

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    ensureUploadDirs();
    cb(null, JUNTA_UPLOADS_DIR);
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase() || '.png';
    const safeExt = ['.png', '.jpg', '.jpeg', '.webp'].includes(ext) ? ext : '.png';
    cb(null, `logo-${Date.now()}${safeExt}`);
  },
});

export const logoUpload = multer({
  storage,
  limits: { fileSize: 2 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (!file.mimetype.startsWith('image/')) {
      cb(new Error('Solo se permiten imágenes'));
      return;
    }
    cb(null, true);
  },
});
