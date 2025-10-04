// Pitch service for API interactions
let RESOLVED_API_URL = null;

const unique = (arr) => Array.from(new Set(arr.filter(Boolean)));

const candidateApiUrls = () => {
  const envUrl = import.meta.env?.VITE_API_URL;
  const origin = typeof window !== 'undefined' ? window.location.origin : undefined;
  let devGuess = undefined;
  if (origin && origin.includes(':5173')) {
    devGuess = origin.replace(':5173', ':5174');
  }
  return unique([
    envUrl,
    origin,
    devGuess,
    'http://localhost:5174',
    'http://localhost:5175',
    'http://localhost:5176',
  ]);
};

async function pingHealth(url, signal) {
  try {
    const res = await fetch(`${url}/api/health`, { credentials: 'include', signal });
    if (!res.ok) return false;
    return true;
  } catch {
    return false;
  }
}

async function getApiUrl() {
  if (RESOLVED_API_URL) return RESOLVED_API_URL;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 1200);
  try {
    const candidates = candidateApiUrls();
    for (const url of candidates) {
      // If it's clearly a file:// or empty, skip
      if (!/^https?:\/\//i.test(url)) continue;
      const ok = await pingHealth(url, controller.signal);
      if (ok) {
        RESOLVED_API_URL = url;
        break;
      }
    }
    // Fallback if none responded
    if (!RESOLVED_API_URL) {
      RESOLVED_API_URL = import.meta.env?.VITE_API_URL || 'http://localhost:5174';
    }
    return RESOLVED_API_URL;
  } finally {
    clearTimeout(timeout);
  }
}

async function getPitchesBase() {
  const base = await getApiUrl();
  return `${base}/api/pitches`;
}

/**
 * Fetch all pitches
 * @returns {Promise<Array>} List of pitches
 */
export const fetchPitches = async () => {
  try {
    const API_BASE = await getPitchesBase();
    const response = await fetch(API_BASE, {
      credentials: 'include', // Include cookies for authentication if needed
      headers: {
        'Accept': 'application/json'
      }
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      let errorMessage = 'Failed to fetch pitches';
      try {
        const errorJson = JSON.parse(errorText);
        if (errorJson.error) {
          errorMessage = errorJson.error;
        }
      } catch (e) {
        // If parsing fails, use the raw error text if available
        if (errorText) {
          errorMessage += `: ${errorText}`;
        }
      }
      throw new Error(errorMessage);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error fetching pitches:', error);
    throw error;
  }
};

/**
 * Vote on a pitch
 * @param {number} pitchId - The ID of the pitch
 * @param {string} voteType - Either 'upvote' or 'downvote'
 * @returns {Promise<Object>} The vote result
 */
export const votePitch = async (pitchId, voteType) => {
  try {
    const base = await getApiUrl();
    const response = await fetch(`${base}/api/pitches/${pitchId}/vote`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({ voteType }),
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to vote on pitch');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error voting on pitch:', error);
    throw error;
  }
};

/**
 * Request to connect with a pitch creator
 * @param {number} pitchId - The ID of the pitch
 * @param {string} message - Optional message to the pitch creator
 * @returns {Promise<Object>} The connection request result
 */
export const requestConnect = async (pitchId, message = '') => {
  try {
    const base = await getApiUrl();
    const response = await fetch(`${base}/api/pitches/${pitchId}/connect`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({ message }),
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to request connection');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error requesting connection:', error);
    throw error;
  }
};

/**
 * Fetch a single pitch with its comments
 * @param {number} id Pitch ID
 * @returns {Promise<Object>} Pitch with comments
 */
export const fetchPitchDetails = async (id) => {
  try {
    const API_BASE = await getPitchesBase();
    const response = await fetch(`${API_BASE}/${id}`);
    if (!response.ok) {
      throw new Error('Failed to fetch pitch details');
    }
    return await response.json();
  } catch (error) {
    console.error('Error fetching pitch details:', error);
    throw error;
  }
};

/**
 * Create a new pitch
 * @param {Object} pitchData Pitch data (title, summary)
 * @returns {Promise<Object>} Created pitch
 */
export const createPitch = async (pitchData) => {
  try {
    const API_BASE = await getPitchesBase();
    const response = await fetch(API_BASE, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify(pitchData),
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to create pitch');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error creating pitch:', error);
    throw error;
  }
};

/**
 * Update an existing pitch
 * @param {number} id Pitch ID
 * @param {Object} pitchData Updated pitch data
 * @returns {Promise<Object>} Updated pitch
 */
export const updatePitch = async (id, pitchData) => {
  try {
    const API_BASE = await getPitchesBase();
    const response = await fetch(`${API_BASE}/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify(pitchData),
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to update pitch');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error updating pitch:', error);
    throw error;
  }
};

/**
 * Delete a pitch
 * @param {number} id Pitch ID
 * @returns {Promise<Object>} Deletion confirmation
 */
export const deletePitch = async (id) => {
  try {
    const API_BASE = await getPitchesBase();
    const response = await fetch(`${API_BASE}/${id}`, {
      method: 'DELETE',
      credentials: 'include',
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to delete pitch');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error deleting pitch:', error);
    throw error;
  }
};

/**
 * Add a comment to a pitch
 * @param {number} pitchId Pitch ID
 * @param {string} content Comment content
 * @returns {Promise<Object>} Created comment
 */
export const addComment = async (pitchId, content) => {
  try {
    const API_BASE = await getPitchesBase();
    const response = await fetch(`${API_BASE}/${pitchId}/comments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({ content }),
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to add comment');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error adding comment:', error);
    throw error;
  }
};

/**
 * Delete a comment
 * @param {number} pitchId Pitch ID
 * @param {number} commentId Comment ID
 * @returns {Promise<Object>} Deletion confirmation
 */
export const deleteComment = async (pitchId, commentId) => {
  try {
    const API_BASE = await getPitchesBase();
    const response = await fetch(`${API_BASE}/${pitchId}/comments/${commentId}`, {
      method: 'DELETE',
      credentials: 'include',
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to delete comment');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error deleting comment:', error);
    throw error;
  }
};