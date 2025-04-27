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
    // Check for admin token first (admin paths take priority)
    if (config.url.includes('/admin') || 
        config.url.includes('/candidates/admin') || 
        config.url.includes('/system-status') ||
        config.url.includes('/candidates')) {
      const adminToken = localStorage.getItem('admin_authToken');
      if (adminToken) {
        config.headers.Authorization = `Bearer ${adminToken}`;
        return config;
      }
    }
    
    // Then check for voter token
    const voterToken = localStorage.getItem('voter_authToken');
    if (voterToken) {
      config.headers.Authorization = `Bearer ${voterToken}`;
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
        // Store the voter auth token with a voter-specific key
        localStorage.setItem('voter_authToken', response.data.token);
        
        // Store user identifier (consistent for each user)
        localStorage.setItem('voter_userIdentifier', hashedIdentifier);
        
        // Store nullifier hash from the proof to prevent double voting
        if (zkProof.nullifierHash) {
          localStorage.setItem('voter_nullifierHash', zkProof.nullifierHash);
        }
        
        // Check if user has already voted (using the consistent identifier)
        const userVotedKey = `hasVoted_${hashedIdentifier}`;
        const hasVoted = localStorage.getItem(userVotedKey) === 'true';
        
        // Update global voting status for backward compatibility
        if (hasVoted) {
          localStorage.setItem('voter_hasVoted', 'true');
        } else {
          localStorage.removeItem('voter_hasVoted');
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
        localStorage.setItem('admin_authToken', response.data.token);
        localStorage.setItem('admin_isAdmin', 'true');
      }
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Logout (clear token from localStorage)
  logoutVoter: () => {
    localStorage.removeItem('voter_authToken');
    localStorage.removeItem('voter_hasVoted');
    localStorage.removeItem('voter_nullifierHash');
    // Don't remove the user-specific voting records to maintain history
  },

  // Logout admin
  logoutAdmin: () => {
    localStorage.removeItem('admin_authToken');
    localStorage.removeItem('admin_isAdmin');
  },

  // Check if voter is authenticated
  isVoterAuthenticated: () => {
    return Boolean(localStorage.getItem('voter_authToken'));
  },

  // Check if admin is authenticated
  isAdminAuthenticated: () => {
    return Boolean(localStorage.getItem('admin_authToken')) && 
           localStorage.getItem('admin_isAdmin') === 'true';
  },

  // Check if current user has voted
  hasVoted: () => {
    const userIdentifier = localStorage.getItem('voter_userIdentifier');
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
      const nullifierHash = localStorage.getItem('voter_nullifierHash') || zkProof.nullifierHash;
      
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
      
      // Convert the response format
      if (response.data && response.data.success) {
        return {
          success: true,
          data: {
            logs: response.data.logs || [],
            totalLogs: response.data.totalLogs || response.data.logs?.length || 0,
            totalPages: response.data.totalPages || Math.ceil((response.data.totalLogs || response.data.logs?.length || 0) / limit),
            currentPage: response.data.currentPage || page
          }
        };
      }
      
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
      // Hash the identifier first (using a secure algorithm)
      const hashedIdentifier = await hashIdentifier(identifier);
      
      // In a real ZKP system, we would use a zkSNARK library like snarkjs
      // Here we'll use crypto APIs to create a more realistic simulation
      
      // Create a nullifier hash based on the user's identifier and a random salt
      const salt = crypto.getRandomValues(new Uint8Array(16));
      const nullifierInput = new TextEncoder().encode(`${hashedIdentifier}-${Array.from(salt).join('')}`);
      const nullifierBuffer = await crypto.subtle.digest('SHA-256', nullifierInput);
      const nullifierHash = bufferToHex(nullifierBuffer);
      
      // Generate a simulated proof (signature) of the hashedIdentifier
      // This is a simplified simulation - real ZK proofs would use specialized cryptography
      const proofInput = new TextEncoder().encode(hashedIdentifier);
      const proofBuffer = await crypto.subtle.digest('SHA-256', proofInput);
      const proofA = bufferToHex(proofBuffer).slice(0, 16);
      const proofB = bufferToHex(proofBuffer).slice(16, 32);
      const proofC = bufferToHex(proofBuffer).slice(32, 48);
      
      // In a real implementation, these would be specialized mathematical structures
      const mockProof = {
        proof: {
          pi_a: [proofA, proofB],
          pi_b: [[proofA.slice(0, 8), proofB.slice(0, 8)], [proofA.slice(8), proofB.slice(8)]],
          pi_c: [proofC, proofC.split('').reverse().join('')]
        },
        publicSignals: [hashedIdentifier],
        nullifierHash
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
      const hashedIdentifier = await hashIdentifier(identifier);
      
      // Create a deterministic nullifier hash based on the user's identifier
      // In a real ZKP system, this would be derived from a private input
      const nullifierInput = new TextEncoder().encode(`nullifier-${hashedIdentifier}`);
      const nullifierBuffer = await crypto.subtle.digest('SHA-256', nullifierInput);
      const nullifierHash = bufferToHex(nullifierBuffer);
      
      // Create a hash of the vote choice
      const choiceInput = new TextEncoder().encode(choice);
      const choiceBuffer = await crypto.subtle.digest('SHA-256', choiceInput);
      const choiceHash = bufferToHex(choiceBuffer);
      
      // Generate simulated proof components
      const proofSeed = new TextEncoder().encode(`${nullifierHash}:${choiceHash}`);
      const proofBuffer = await crypto.subtle.digest('SHA-256', proofSeed);
      const proofHex = bufferToHex(proofBuffer);
      
      const mockProof = {
        proof: {
          pi_a: [proofHex.slice(0, 16), proofHex.slice(16, 32)],
          pi_b: [[proofHex.slice(0, 8), proofHex.slice(8, 16)], [proofHex.slice(16, 24), proofHex.slice(24, 32)]],
          pi_c: [proofHex.slice(32, 48), proofHex.slice(48, 64)],
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
      // Create a nonce for this specific action (timestamp + random bytes)
      const randomBytes = crypto.getRandomValues(new Uint8Array(8));
      const actionNonce = Date.now().toString() + Array.from(randomBytes).join('');
      
      // Create an action hash by hashing the action data with the nonce
      const actionString = JSON.stringify(actionData);
      const actionInput = new TextEncoder().encode(`${actionString}-${actionNonce}`);
      const actionBuffer = await crypto.subtle.digest('SHA-256', actionInput);
      const actionHash = bufferToHex(actionBuffer);
      
      // Create an admin proof by hashing the admin key
      // In a real system, this would be a ZK proof that the admin has authorization
      const adminInput = new TextEncoder().encode(adminKey);
      const adminBuffer = await crypto.subtle.digest('SHA-256', adminInput);
      const adminProof = bufferToHex(adminBuffer);
      
      // Generate the proof components from a combination of admin proof and action
      const proofSeed = new TextEncoder().encode(`${adminProof}:${actionHash}`);
      const proofBuffer = await crypto.subtle.digest('SHA-256', proofSeed);
      const proofHex = bufferToHex(proofBuffer);
      
      const mockProof = {
        proof: {
          pi_a: [proofHex.slice(0, 16), proofHex.slice(16, 32)],
          pi_b: [[proofHex.slice(0, 8), proofHex.slice(8, 16)], [proofHex.slice(16, 24), proofHex.slice(24, 32)]],
          pi_c: [proofHex.slice(32, 48), proofHex.slice(48, 64)],
        },
        publicSignals: [adminProof, actionHash],
        actionNonce
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

// Helper function to convert buffer to hex string
const bufferToHex = (buffer) => {
  return Array.from(new Uint8Array(buffer))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
};

// Helper function to hash a string securely
export const hashString = async (str) => {
  try {
    const encoder = new TextEncoder();
    const data = encoder.encode(str);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    return bufferToHex(hashBuffer);
  } catch (error) {
    console.error('Fallback to simple hashing due to error:', error);
    
    // Fallback hashing if Web Crypto API is not available
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return hash.toString(16);
  }
};

// Helper function to hash an identifier
export const hashIdentifier = async (identifier) => {
  return hashString(`zk-auth-${identifier}-v2`);
};

export default api; 