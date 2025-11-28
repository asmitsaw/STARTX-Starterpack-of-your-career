import express from 'express';
import multer from 'multer';
import fetch from 'node-fetch';
import FormData from 'form-data';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

const router = express.Router();
const MAX_RETRIES = 3;
const TIMEOUT_MS = 15000; // 15 seconds timeout

// ImageKit credentials - these should be in environment variables
const IMAGEKIT_PRIVATE_KEY = process.env.IMAGEKIT_PRIVATE_KEY || '';
const IMAGEKIT_PUBLIC_KEY = process.env.IMAGEKIT_PUBLIC_KEY || '';
const IMAGEKIT_URL_ENDPOINT = process.env.IMAGEKIT_URL_ENDPOINT || '';

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

// Generate authentication parameters for ImageKit
function generateAuthParams() {
  const token = crypto.randomBytes(16).toString('hex');
  const expire = Math.floor(Date.now() / 1000) + 3600; // 1 hour from now
  const signature = crypto
    .createHmac('sha1', IMAGEKIT_PRIVATE_KEY)
    .update(token + expire)
    .digest('hex');
  
  return { token, expire, signature };
}

// Handle ImageKit uploads
router.post('/', upload.single('file'), async (req, res) => {
  try {
    const { file } = req;
    if (!file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    // Check if ImageKit credentials are configured
    if (!IMAGEKIT_PRIVATE_KEY || !IMAGEKIT_PUBLIC_KEY) {
      console.error('ImageKit credentials not configured');
      return res.status(500).json({ 
        error: 'Upload service not configured',
        message: 'ImageKit credentials are missing. Please configure IMAGEKIT_PRIVATE_KEY and IMAGEKIT_PUBLIC_KEY environment variables.'
      });
    }

    // Generate authentication parameters
    const { token, expire, signature } = generateAuthParams();

    // Create form data for ImageKit
    const form = new FormData();
    form.append('file', fs.createReadStream(file.path));
    form.append('fileName', `startx_${Date.now()}`);
    form.append('publicKey', IMAGEKIT_PUBLIC_KEY);
    form.append('signature', signature);
    form.append('expire', expire.toString());
    form.append('token', token);

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

    // Check if ImageKit returned an error
    if (data.error) {
      console.error('ImageKit error:', data);
      return res.status(400).json({ 
        error: 'ImageKit upload failed',
        message: data.message || data.help || 'Unknown ImageKit error',
        details: data
      });
    }

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
      retryable: true
    });
  }
});

export default router;