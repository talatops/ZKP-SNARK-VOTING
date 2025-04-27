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
  login: async (hashedIdentifier, zkProof) => {
    try {
      const response = await api.post('/auth/login', { hashedIdentifier, zkProof });
      if (response.data.token) {
        // Store the new auth token
        localStorage.setItem('authToken', response.data.token);
        
        // Store user identifier (consistent for each user)
        localStorage.setItem('userIdentifier', hashedIdentifier);
        
        // Store nullifier hash from the proof to prevent double voting
        if (zkProof.nullifierHash) {
          localStorage.setItem('nullifierHash', zkProof.nullifierHash);
        }
        
        // Check if user has already voted (using the consistent identifier)
        const userVotedKey = `hasVoted_${hashedIdentifier}`;
        const hasVoted = localStorage.getItem(userVotedKey) === 'true';
        
        // Update global voting status for backward compatibility
        if (hasVoted) {
          localStorage.setItem('hasVoted', 'true');
        } else {
          localStorage.removeItem('hasVoted');
        }
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
    localStorage.removeItem('hasVoted');
    localStorage.removeItem('nullifierHash');
    // Don't remove the user-specific voting records to maintain history
  },

  // Logout admin (clear token from localStorage)
  logoutAdmin: () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('isAdmin');
  },

  // Check if user is authenticated
  isAuthenticated: () => {
    return Boolean(localStorage.getItem('authToken'));
  },

  // Check if user is an admin
  isAdmin: () => {
    return localStorage.getItem('isAdmin') === 'true';
  },

  // Check if user is an authenticated admin
  isAdminAuthenticated: () => {
    return Boolean(localStorage.getItem('authToken')) && localStorage.getItem('isAdmin') === 'true';
  },

  // Check if current user has voted
  hasVoted: () => {
    const userIdentifier = localStorage.getItem('userIdentifier');
    if (!userIdentifier) return false;
    
    const userVotedKey = `hasVoted_${userIdentifier}`;
    return localStorage.getItem(userVotedKey) === 'true';
  }
};

// Voting API calls
export const voteAPI = {
  // Cast a vote
  castVote: async (choice, zkProof) => {
    try {
      // Get the nullifier hash from localStorage or from the proof
      const nullifierHash = localStorage.getItem('nullifierHash') || zkProof.nullifierHash;
      
      const response = await api.post('/vote/cast', { 
        choice, 
        zkProof,
        nullifierHash // Include the nullifier hash to prevent double voting
      });
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

// Candidate API calls
export const candidateAPI = {
  // Get all active candidates (for voters)
  getCandidates: async () => {
    try {
      const response = await api.get('/candidates');
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },
  
  // Get all candidates including inactive ones (for admin)
  getAllCandidatesAdmin: async () => {
    try {
      const response = await api.get('/candidates/admin');
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Add a new candidate (admin only)
  addCandidate: async (name, description, zkProof, isActive = true) => {
    try {
      const response = await api.post('/candidates', {
        name,
        description,
        isActive,
        zkProof
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Update a candidate (admin only)
  updateCandidate: async (candidateId, data, zkProof) => {
    try {
      const response = await api.put(`/candidates/${candidateId}`, {
        ...data,
        zkProof
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Delete a candidate (admin only)
  deleteCandidate: async (candidateId, zkProof) => {
    try {
      const response = await api.delete(`/candidates/${candidateId}`, {
        data: { zkProof }
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  }
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
  },

  // Generate a proof for admin actions
  generateAdminActionProof: async (adminKey, actionData) => {
    try {
      // In a real app, this would use the snarkjs library
      // with the admin circuit to generate a proof
      
      // Create a nonce for this specific action
      const actionNonce = Date.now().toString();
      
      // Generate mock proof for admin action
      let actionString;
      if (typeof actionData === 'string') {
        // If actionData is just a string (like 'add', 'update', 'delete')
        actionString = actionData;
      } else {
        // If actionData is an object with details
        actionString = JSON.stringify(actionData);
      }
      
      const actionHash = await hashString(`${actionString}-${actionNonce}`);
      const adminProof = await hashString(adminKey);
      
      const mockProof = {
        proof: {
          pi_a: ["mock_admin_pi_a_1", "mock_admin_pi_a_2"],
          pi_b: [["mock_admin_pi_b_1_1", "mock_admin_pi_b_1_2"], ["mock_admin_pi_b_2_1", "mock_admin_pi_b_2_2"]],
          pi_c: ["mock_admin_pi_c_1", "mock_admin_pi_c_2"],
        },
        publicSignals: [adminProof, actionHash],
        actionNonce: actionNonce
      };
      
      return {
        adminProof,
        actionHash,
        zkProof: mockProof
      };
    } catch (error) {
      throw new Error(`Failed to generate admin action proof: ${error.message}`);
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