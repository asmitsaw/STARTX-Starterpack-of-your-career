import React, { useState, useRef } from 'react';
import { useUser } from '@clerk/clerk-react';
import axios from 'axios';
import { uploadFile } from '../services/imageKitService';
import { motion } from 'framer-motion';

const PostCreator = ({ onPostCreated }) => {
  const { user } = useUser();
  const [content, setContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const fileInputRef = useRef(null);
  const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:5174';

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file type and size
    const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    const maxSize = 5 * 1024 * 1024; // 5MB

    if (!validTypes.includes(file.type)) {
      alert('Please select a valid image file (JPEG, PNG, GIF, WEBP)');
      return;
    }

    if (file.size > maxSize) {
      alert('File size must be less than 5MB');
      return;
    }

    setSelectedFile(file);
    
    // Create preview URL
    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);
    
    // Clean up preview URL when component unmounts
    return () => URL.revokeObjectURL(objectUrl);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!content.trim()) return;
    
    setIsSubmitting(true);
    
    try {
      let mediaMetadata = null;
      
      // If there's a file, upload it to ImageKit first
      if (selectedFile) {
        const uploadResult = await uploadFile(
          selectedFile, 
          `post_${Date.now()}_${selectedFile.name}`,
          { userId: user.id }
        );
        
        mediaMetadata = {
          url: uploadResult.url,
          small: uploadResult.thumbnailUrl,
          medium: uploadResult.url,
          large: uploadResult.url,
          fileId: uploadResult.fileId,
          fileType: uploadResult.fileType
        };
      }
      
      // Create the post with media information
      const response = await axios.post(`${API_BASE}/api/posts`, {
        content,
        media_type: selectedFile ? selectedFile.type : null,
        media_metadata: mediaMetadata ? JSON.stringify(mediaMetadata) : null
      });
      
      // Clear form
      setContent('');
      setSelectedFile(null);
      setPreviewUrl('');
      
      // Notify parent component
      if (onPostCreated) {
        onPostCreated(response.data);
      }
    } catch (error) {
      console.error('Error creating post:', error);
      alert('Failed to create post. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const removeSelectedFile = () => {
    setSelectedFile(null);
    setPreviewUrl('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 mb-6">
      <form onSubmit={handleSubmit}>
        <div className="flex items-start mb-4">
          <img 
            src={user?.profileImageUrl || '/avatar.png'} 
            alt="Profile" 
            className="w-10 h-10 rounded-full mr-3"
          />
          <textarea
            className="flex-1 border border-gray-300 dark:border-gray-600 rounded-lg p-3 resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
            placeholder="What's on your mind?"
            rows="3"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            disabled={isSubmitting}
          />
        </div>
        
        {previewUrl && (
          <div className="relative mb-4">
            <img 
              src={previewUrl} 
              alt="Preview" 
              className="max-h-60 rounded-lg mx-auto object-contain"
            />
            <button
              type="button"
              onClick={removeSelectedFile}
              className="absolute top-2 right-2 bg-gray-800 bg-opacity-70 text-white rounded-full p-1"
              aria-label="Remove image"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
        )}
        
        <div className="flex justify-between items-center">
          <div className="flex space-x-2">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center text-gray-500 hover:text-blue-500 dark:text-gray-400 dark:hover:text-blue-400"
              disabled={isSubmitting}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4V5h12v10z" clipRule="evenodd" />
                <path d="M8.5 7a1.5 1.5 0 100 3 1.5 1.5 0 000-3z" />
                <path d="M11 9.5a.5.5 0 01.5-.5h1a.5.5 0 010 1h-1a.5.5 0 01-.5-.5z" />
                <path fillRule="evenodd" d="M4 15h12V5H4v10z" clipRule="evenodd" />
              </svg>
              Photo
            </button>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept="image/*"
              className="hidden"
              disabled={isSubmitting}
            />
          </div>
          
          <motion.button
            type="submit"
            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg font-medium disabled:opacity-50"
            disabled={!content.trim() || isSubmitting}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            {isSubmitting ? 'Posting...' : 'Post'}
          </motion.button>
        </div>
      </form>
    </div>
  );
};

export default PostCreator;