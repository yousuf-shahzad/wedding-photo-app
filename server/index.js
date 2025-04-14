const express = require('express');
const multer = require('multer');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const QRCode = require('qrcode');
const http = require('http');
const archiver = require('archiver');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;
const UPLOADS_DIR = path.join(__dirname, process.env.UPLOADS_DIR || 'uploads');
const MAX_FILE_SIZE = parseInt(process.env.MAX_FILE_SIZE) || 10 * 1024 * 1024;
const ALLOWED_FILE_TYPES = (process.env.ALLOWED_FILE_TYPES || 'image/jpeg,image/png').split(',');

// Ensure uploads directory exists
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, UPLOADS_DIR);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + '-' + file.originalname);
  }
});

const fileFilter = (req, file, cb) => {
  if (ALLOWED_FILE_TYPES.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only JPEG and PNG are allowed.'), false);
  }
};

const upload = multer({
  storage: storage,
  limits: { 
    fileSize: MAX_FILE_SIZE,
    files: 10 // Maximum number of files
  },
  fileFilter: fileFilter
}).any();

// Middleware
app.use(cors({
  origin: 'http://localhost:3000',
  credentials: true
}));
app.use(express.json());

// Generate QR code on startup
const generateQRCode = async () => {
  try {
    const uploadUrl = 'http://localhost:3000/upload';
    await QRCode.toFile(
      path.join(__dirname, 'qr-code.png'),
      uploadUrl,
      {
        color: {
          dark: '#000000',
          light: '#ffffff'
        }
      }
    );
    console.log('QR code generated successfully');
  } catch (err) {
    console.error('Error generating QR code:', err);
  }
};

// Add error handling middleware before routes
app.use((err, req, res, next) => {
  console.error('Error:', err);
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ error: `File size exceeds ${MAX_FILE_SIZE / (1024 * 1024)}MB limit` });
    }
    if (err.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({ error: 'Too many files. Maximum 10 files allowed.' });
    }
    if (err.code === 'LIMIT_UNEXPECTED_FILE') {
      return res.status(400).json({ error: 'Unexpected field in form data' });
    }
    return res.status(400).json({ error: 'File upload error' });
  }
  next(err);
});

// Routes
app.post('/api/upload', (req, res, next) => {
  upload(req, res, (err) => {
    if (err) {
      if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          return res.status(400).json({ error: `File size exceeds ${MAX_FILE_SIZE / (1024 * 1024)}MB limit` });
        }
        if (err.code === 'LIMIT_FILE_COUNT') {
          return res.status(400).json({ error: 'Too many files. Maximum 10 files allowed at a time.' });
        }
        return res.status(400).json({ error: 'File upload error: ' + err.message });
      }
      return res.status(400).json({ error: 'Error uploading files: ' + err.message });
    }

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: 'No files uploaded' });
    }
    
    try {
      const uploadedFiles = req.files.map(file => ({
        filename: file.filename,
        originalname: file.originalname,
        size: file.size,
        mimetype: file.mimetype
      }));

      res.json({ 
        message: 'Files uploaded successfully',
        files: uploadedFiles
      });
    } catch (err) {
      console.error('Error processing uploaded files:', err);
      res.status(500).json({ error: 'Error processing uploaded files' });
    }
  });
});

app.get('/api/photos', (req, res) => {
  const uploadDir = path.join(__dirname, 'uploads');
  fs.readdir(uploadDir, (err, files) => {
    if (err) {
      return res.status(500).json({ error: 'Error reading uploads directory' });
    }
    res.json({ photos: files });
  });
});

app.get('/api/protected/photos', (req, res) => {
  const password = req.headers.authorization;
  if (password !== process.env.GALLERY_PASSWORD) {
    return res.status(401).json({ error: 'Invalid password' });
  }
  
  fs.readdir(UPLOADS_DIR, (err, files) => {
    if (err) {
      return res.status(500).json({ error: 'Error reading photos directory' });
    }
    res.json({ photos: files });
  });
});

// Create a ZIP file from selected photos
app.get('/api/protected/photos/zip', async (req, res) => {
  const { password, filenames } = req.query;
  
  if (password !== process.env.GALLERY_PASSWORD) {
    return res.status(401).json({ error: 'Invalid password' });
  }

  try {
    const photoFilenames = filenames ? JSON.parse(filenames) : fs.readdirSync(UPLOADS_DIR);
    const validFilenames = photoFilenames.filter(filename => 
      fs.existsSync(path.join(UPLOADS_DIR, filename))
    );

    if (validFilenames.length === 0) {
      return res.status(404).json({ error: 'No valid photos found' });
    }

    // Create a ZIP file
    const archive = archiver('zip', {
      zlib: { level: 9 } // Maximum compression
    });

    // Set the response headers
    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', 'attachment; filename=wedding-photos.zip');

    // Pipe the archive to the response
    archive.pipe(res);

    // Add each file to the archive
    validFilenames.forEach(filename => {
      const filePath = path.join(UPLOADS_DIR, filename);
      archive.file(filePath, { name: filename });
    });

    // Finalize the archive
    await archive.finalize();
  } catch (err) {
    console.error('Error creating ZIP file:', err);
    res.status(500).json({ error: 'Error creating ZIP file' });
  }
});

// Delete photo endpoint
app.delete('/api/protected/photos/:filename', (req, res) => {
  const password = req.headers.authorization;
  if (password !== process.env.GALLERY_PASSWORD) {
    return res.status(401).json({ error: 'Invalid password' });
  }

  const filename = req.params.filename;
  const filePath = path.join(UPLOADS_DIR, filename);

  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ error: 'File not found' });
  }

  fs.unlink(filePath, (err) => {
    if (err) {
      return res.status(500).json({ error: 'Error deleting file' });
    }
    res.json({ message: 'File deleted successfully' });
  });
});

// Serve uploaded files
app.use('/api/uploads', express.static(UPLOADS_DIR));

// Start server
const server = http.createServer(app);
server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  generateQRCode();
}); 