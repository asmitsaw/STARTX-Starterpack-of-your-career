import express from 'express';
import multer from 'multer';
import fetch from 'node-fetch';
import FormData from 'form-data';
import fs from 'fs';
import path from 'path';

const router = express.Router();
const MAX_RETRIES = 3;
const TIMEOUT_MS = 15000; // 15 seconds timeout

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '-' + file.originalname);
  }
});

const upload = multer({ storage: storage });

// Handle ImageKit uploads
router.post('/', upload.single('file'), async (req, res) => {
  try {
    const { file } = req;
    if (!file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    // Create form data for ImageKit
    const form = new FormData();
    form.append('file', fs.createReadStream(file.path));
    form.append('fileName', `startx_${Date.now()}`);
    form.append('publicKey', req.body.publicKey);

    // Send to ImageKit with retry mechanism
    let response;
    let retries = 0;
    let lastError;

    while (retries < MAX_RETRIES) {
      try {
        response = await fetch('https://upload.imagekit.io/api/v1/files/upload', {
          method: 'POST',
          body: form,
          headers: form.getHeaders(),
          timeout: TIMEOUT_MS
        });
        
        // If successful, break out of retry loop
        break;
      } catch (error) {
        lastError = error;
        console.log(`Upload attempt ${retries + 1} failed: ${error.message}`);
        retries++;
        
        // If we've reached max retries, throw the last error
        if (retries >= MAX_RETRIES) {
          throw new Error(`Failed after ${MAX_RETRIES} attempts: ${error.message}`);
        }
        
        // Wait before retrying (exponential backoff)
        await new Promise(resolve => setTimeout(resolve, 1000 * retries));
      }
    }

    // Get the response
    const data = await response.json();

    // Clean up the temporary file
    fs.unlinkSync(file.path);

    // Return the ImageKit response
    return res.json(data);
  } catch (error) {
    console.error('Upload error:', error);
    
    // Provide more specific error messages based on error type
    if (error.code === 'ETIMEDOUT' || error.type === 'system') {
      return res.status(503).json({ 
        error: 'Upload service temporarily unavailable', 
        details: 'Connection to ImageKit timed out. Please try again later.',
        retryable: true
      });
    } else if (error.code === 'ECONNREFUSED') {
      return res.status(503).json({ 
        error: 'Upload service unavailable', 
        details: 'Unable to connect to ImageKit service. Please try again later.',
        retryable: true
      });
    }
    
    return res.status(500).json({ 
      error: 'Upload failed', 
      details: error.message,
      retryable: true
    });
  }
});

export default router;
import express from 'express';
import multer from 'multer';
import fetch from 'node-fetch';
import FormData from 'form-data';
import fs from 'fs';
import path from 'path';

const router = express.Router();
const MAX_RETRIES = 3;
const TIMEOUT_MS = 15000; // 15 seconds timeout

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '-' + file.originalname);
  }
});

const upload = multer({ storage: storage });

// Handle file uploads (local storage fallback)
router.post('/', upload.single('file'), async (req, res) => {
  console.log('Upload request received');
  console.log('File:', req.file);
  console.log('Body:', req.body);
  
  try {
    const { file } = req;
    if (!file) {
      console.error('No file in request');
      return res.status(400).json({ error: 'No file uploaded' });
    }

    // Get the public API base URL
    const publicBase = req.app.get('PUBLIC_API_BASE') || `http://localhost:${process.env.PORT || 5174}`;
    
    // Return local file URL
    const fileUrl = `${publicBase}/uploads/${file.filename}`;
    
    console.log('File uploaded successfully:', fileUrl);
    console.log('File details:', {
      filename: file.filename,
      size: file.size,
      mimetype: file.mimetype,
      path: file.path
    });
    
    const response = {
      success: true,
      url: fileUrl,
      path: `/uploads/${file.filename}`,
      filename: file.filename,
      size: file.size,
      mimetype: file.mimetype
    };
    
    console.log('Sending response:', response);
    return res.json(response);
  } catch (error) {
    console.error('Upload error:', error);
    console.error('Error stack:', error.stack);
    
    // Clean up file if it exists
    if (req.file && req.file.path) {
      try {
        fs.unlinkSync(req.file.path);
      } catch (cleanupError) {
        console.error('Error cleaning up file:', cleanupError);
      }
    }
    
    return res.status(500).json({ 
      error: 'Upload failed', 
      details: error.message,
      stack: error.stack
    });
  }
});

export default router;