const multer = require('multer');
const path = require('path');
const fs = require('fs');

const UPLOAD_DIR_RELATIVE_FROM_ROOT = 'uploads/dokumen_materi/';
const UPLOAD_DIR_ABSOLUTE = path.resolve(__dirname, '..', '..', UPLOAD_DIR_RELATIVE_FROM_ROOT); 

if (!fs.existsSync(UPLOAD_DIR_ABSOLUTE)){
    fs.mkdirSync(UPLOAD_DIR_ABSOLUTE, { recursive: true });
    console.log(`[uploadMiddleware.js] Upload directory created: ${UPLOAD_DIR_ABSOLUTE}`);
} else {
    console.log(`[uploadMiddleware.js] Upload directory already exists: ${UPLOAD_DIR_ABSOLUTE}`);
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, UPLOAD_DIR_ABSOLUTE); 
  },
  filename: function (req, file, cb) { 
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + '-' + file.originalname.replace(/\s+/g, '_'));
  }
});

const uploadMateri = multer({
  storage: storage,
  fileFilter: function (req, file, cb) {
    const allowedTypes = /pdf|doc|docx|ppt|pptx|txt|png|jpg|jpeg|gif|webp|mp4|mov|avi|zip|rar/;
    const mimetype = allowedTypes.test(file.mimetype);
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    if (mimetype && extname) {
      return cb(null, true);
    }
    console.warn(`[uploadMiddleware.js] File type not allowed: ${file.originalname} (mimetype: ${file.mimetype}, ext: ${path.extname(file.originalname)})`);
    cb(new Error("Error: Tipe file tidak diizinkan! (" + path.extname(file.originalname).toLowerCase() + ")"));
  },
  limits: { fileSize: 100 * 1024 * 1024 } 
}).single('dokumenFile');

const uploadMateriMiddleware = (req, res, next) => {
  uploadMateri(req, res, (err) => {
    if (err) {
      console.error("[uploadMiddleware.js] Multer/File upload error:", err.message || err);
      if (err instanceof multer.MulterError) {
        return res.status(400).json({ success: false, message: `Kesalahan upload file: ${err.code}` });
      }
      return res.status(400).json({ success: false, message: err.message || "Terjadi kesalahan saat mengunggah file." });
    }
    next();
  });
};

const UPLOADS_DIR = path.join(__dirname, '..', '..', 'uploads');

if (!fs.existsSync(UPLOADS_DIR)) {
  try {
    fs.mkdirSync(UPLOADS_DIR, { recursive: true }); 
    console.log(`[uploadMiddleware.js] Direktori ${UPLOADS_DIR} berhasil dibuat.`);
  } catch (err) {
    console.error(`[uploadMiddleware.js] Gagal membuat direktori ${UPLOADS_DIR}:`, err);
  }
}

const storageProfile = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, UPLOADS_DIR); 
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const extension = path.extname(file.originalname); 
    cb(null, file.fieldname + '-' + uniqueSuffix + extension); 
  }
});

const imageFileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image/')) { 
    cb(null, true); 
  } else {
    cb(new Error('Hanya file gambar yang diizinkan! (png, jpg, jpeg, gif)'), false); 
  }
};

const uploadProfilePic = multer({
  storage: storageProfile,
  fileFilter: imageFileFilter,
  limits: { fileSize: 5 * 1024 * 1024 } 
}).single('profilePicFile');

const uploadProfilePicMiddleware = (req, res, next) => {
  uploadProfilePic(req, res, (err) => {
    if (err) {
      if (err instanceof multer.MulterError) return res.status(400).json({ success: false, message: `Kesalahan unggah file: ${err.message}` });
      if (err.message && err.message.includes('Hanya file gambar yang diizinkan!')) {
         return res.status(400).json({ success: false, message: err.message });
      }
      return res.status(500).json({ success: false, message: "Kesalahan saat upload foto profil", error: err.message });
    }
    next();
  });
};


module.exports = {
  uploadMateri: uploadMateriMiddleware,
  uploadProfilePic: uploadProfilePicMiddleware
};
