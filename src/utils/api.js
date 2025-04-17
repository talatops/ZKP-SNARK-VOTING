import axios from 'axios';

// Create an Axios instance with default config
const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:5000/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add a request interceptor to include the token in the headers if it exists
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Authentication API calls
export const authAPI = {
  // Register a new voter with a hashed identifier
  registerVoter: async (hashedIdentifier) => {
    try {
      const response = await api.post('/auth/register', { hashedIdentifier });
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Login as voter with zk-SNARK proof
  loginVoter: async (hashedIdentifier, zkProof) => {
    try {
      const response = await api.post('/auth/login', { hashedIdentifier, zkProof });
      if (response.data.token) {
        localStorage.setItem('authToken', response.data.token);
      }
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Login as administrator
  loginAdmin: async (username, password) => {
    try {
      const response = await api.post('/auth/admin/login', { username, password });
      if (response.data.token) {
        localStorage.setItem('authToken', response.data.token);
        localStorage.setItem('isAdmin', 'true');
      }
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Logout (clear token from localStorage)
  logout: () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('isAdmin');
  },

  // Check if user is authenticated
  isAuthenticated: () => {
    return !!localStorage.getItem('authToken');
  },

  // Check if user is an admin
  isAdmin: () => {
    return localStorage.getItem('isAdmin') === 'true';
  },
};

// Voting API calls
export const voteAPI = {
  // Cast a vote
  castVote: async (choice, zkProof) => {
    try {
      const response = await api.post('/vote/cast', { choice, zkProof });
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Get voting statistics (admin only)
  getVotingStats: async () => {
    try {
      const response = await api.get('/vote/stats');
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },
};

// Admin API calls
export const adminAPI = {
  // Get system logs with filtering and pagination
  getSystemLogs: async (page = 1, limit = 10, level = null, timeFrame = null) => {
    try {
      const params = { page, limit };
      if (level) params.level = level;
      if (timeFrame) params.timeFrame = timeFrame;
      
      const response = await api.get('/admin/logs', { params });
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Get system status
  getSystemStatus: async () => {
    try {
      const response = await api.get('/admin/system-status');
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },
};

// ZKP utility functions
export const zkpUtils = {
  // Generate a proof for authentication
  generateAuthProof: async (identifier) => {
    try {
      // This would call the zkp-snark library to generate a proof
      // For demo purposes, we'll just create a mock proof
      
      // Hash the identifier first
      const hashedIdentifier = await hashIdentifier(identifier);
      
      // Generate a random nullifier secret
      const nullifierSecret = Math.floor(Math.random() * 1000000).toString();
      
      // Create a mock proof (in a real app, this would use the snarkjs library)
      const mockProof = {
        proof: {
          pi_a: ["mock_pi_a_1", "mock_pi_a_2"],
          pi_b: [["mock_pi_b_1_1", "mock_pi_b_1_2"], ["mock_pi_b_2_1", "mock_pi_b_2_2"]],
          pi_c: ["mock_pi_c_1", "mock_pi_c_2"],
        },
        publicSignals: [hashedIdentifier],
        // Add a nullifier hash to prevent double voting
        nullifierHash: await hashString(`nullifier-${hashedIdentifier}-${Date.now()}`)
      };
      
      return {
        hashedIdentifier,
        zkProof: mockProof
      };
    } catch (error) {
      throw new Error(`Failed to generate auth proof: ${error.message}`);
    }
  },
  
  // Generate a proof for voting
  generateVoteProof: async (identifier, choice) => {
    try {
      // Similar mock implementation as above
      // In a real app, this would use the snarkjs library
      
      const hashedIdentifier = await hashIdentifier(identifier);
      const nullifierHash = await hashString(`nullifier-${hashedIdentifier}-${Date.now()}`);
      const choiceHash = await hashString(choice);
      
      const mockProof = {
        proof: {
          pi_a: ["mock_vote_pi_a_1", "mock_vote_pi_a_2"],
          pi_b: [["mock_vote_pi_b_1_1", "mock_vote_pi_b_1_2"], ["mock_vote_pi_b_2_1", "mock_vote_pi_b_2_2"]],
          pi_c: ["mock_vote_pi_c_1", "mock_vote_pi_c_2"],
        },
        publicSignals: [nullifierHash, choiceHash],
      };
      
      return {
        nullifierHash,
        choiceHash,
        zkProof: mockProof
      };
    } catch (error) {
      throw new Error(`Failed to generate vote proof: ${error.message}`);
    }
  }
};

// Helper function to hash a string
export const hashString = async (str) => {
  // In a real application, we would use a crypto library
  // For simplicity, we'll create a simple hash function
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return hash.toString(16);
};

// Helper function to hash an identifier
export const hashIdentifier = async (identifier) => {
  return hashString(`zk-auth-${identifier}`);
};

export default api; 