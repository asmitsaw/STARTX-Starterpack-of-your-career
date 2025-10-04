import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useUser } from '@clerk/clerk-react';
import axios from 'axios';
import { getOptimizedImageUrl } from '../services/imageKitService';

const PostItem = ({ post, onLike }) => {
  const { user } = useUser();
  const [liked, setLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(post.likes_count || 0);
  const [isVisible, setIsVisible] = useState(false);
  const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:5174';
  
  // Parse media URLs if available
  const mediaUrls = post.media_urls ? JSON.parse(post.media_urls) : null;
  
  // Check if the current user is connected to the post author
  useEffect(() => {
    const checkVisibility = async () => {
      try {
        // If it's the user's own post, it's always visible
        if (post.author_id === user?.id) {
          setIsVisible(true);
          return;
        }
        
        // Check connection status
        const response = await axios.get(`${API_BASE}/api/users/connections/${post.author_id}/status`);
        setIsVisible(response.data.status === 'accepted');
      } catch (error) {
        console.error('Error checking post visibility:', error);
        // Default to visible if there's an error
        setIsVisible(true);
      }
    };
    
    if (user) {
      checkVisibility();
    }
  }, [post.author_id, user, API_BASE]);
  
  const handleLike = async () => {
    try {
      const response = await axios.put(`${API_BASE}/api/posts/${post.id}/like`);
      setLiked(response.data.liked);
      setLikesCount(prev => response.data.liked ? prev + 1 : Math.max(prev - 1, 0));
      
      if (onLike) {
        onLike(post.id, response.data.liked);
      }
    } catch (error) {
      console.error('Error liking post:', error);
    }
  };
  
  // If post is not visible to the current user, don't render it
  if (!isVisible) return null;
  
  // Format date
  const formattedDate = new Date(post.created_at).toLocaleString();
  
  // Get appropriate image URL based on screen size
  const getResponsiveImageUrl = () => {
    if (!post.media_url) return null;
    
    if (mediaUrls) {
      // Use responsive URLs if available
      if (window.innerWidth < 640) return mediaUrls.small;
      if (window.innerWidth < 1024) return mediaUrls.medium;
      return mediaUrls.large;
    }
    
    // Fallback to original URL with ImageKit optimization
    return getOptimizedImageUrl(post.media_url, {
      width: window.innerWidth < 640 ? 400 : window.innerWidth < 1024 ? 800 : 1200,
      quality: 80
    });
  };
  
  return (
    <motion.div 
      className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 mb-4"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="flex items-center mb-3">
        <img 
          src={post.avatar_url || '/avatar.png'} 
          alt={post.name || 'User'} 
          className="w-10 h-10 rounded-full mr-3"
        />
        <div>
          <h3 className="font-medium text-gray-900 dark:text-white">{post.name || 'Anonymous'}</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">{formattedDate}</p>
        </div>
      </div>
      
      <div className="mb-4">
        <p className="text-gray-800 dark:text-gray-200 whitespace-pre-wrap">{post.content}</p>
      </div>
      
      {post.media_url && (
        <div className="mb-4 overflow-hidden rounded-lg">
          <img 
            src={getResponsiveImageUrl()}
            alt="Post attachment" 
            className="w-full object-contain max-h-96"
            loading="lazy"
          />
        </div>
      )}
      
      <div className="flex items-center justify-between text-gray-500 dark:text-gray-400">
        <button 
          onClick={handleLike}
          className={`flex items-center ${liked ? 'text-blue-500' : ''}`}
        >
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            className="h-5 w-5 mr-1" 
            viewBox="0 0 20 20" 
            fill={liked ? 'currentColor' : 'none'}
            stroke="currentColor"
            strokeWidth="1.5"
          >
            <path 
              fillRule="evenodd" 
              d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" 
              clipRule="evenodd" 
            />
          </svg>
          {likesCount > 0 && <span>{likesCount}</span>}
        </button>
      </div>
    </motion.div>
  );
};

export default PostItem;