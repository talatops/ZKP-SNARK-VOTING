import React, { useState, useEffect } from 'react';
import { candidateAPI, zkpUtils } from '../utils/api';

const CandidateManager = () => {
  const [candidates, setCandidates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // For adding/editing candidate
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    isActive: true
  });

  // Fetch candidates on component mount
  useEffect(() => {
    fetchCandidates();
  }, []);

  // Fetch all candidates
  const fetchCandidates = async () => {
    setLoading(true);
    try {
      const response = await candidateAPI.getAllCandidatesAdmin();
      if (response.success) {
        setCandidates(response.data);
      } else {
        setError('Failed to fetch candidates');
      }
    } catch (error) {
      setError(`Error: ${error.message || 'Failed to fetch candidates'}`);
    } finally {
      setLoading(false);
    }
  };

  // Handle form input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Reset form and editing state
  const resetForm = () => {
    setFormData({ name: '', description: '', isActive: true });
    setIsEditing(false);
    setEditingId(null);
  };

  // Generate ZK proof for admin action
  const generateAdminProof = async (action) => {
    try {
      // In a real app, we would use a secure admin key
      // For demo purposes, we'll use the JWT token
      const adminKey = localStorage.getItem('authToken');
      
      if (!adminKey) {
        console.error('Admin key is missing - authentication token not found');
        setError('Authentication failed: Please log out and log back in as admin');
        return null;
      }
      
      console.log('Generating admin proof with action:', action);
      
      // Create action data
      const actionData = {
        action,
        ...formData,
        timestamp: Date.now()
      };
      
      // Generate ZK proof
      try {
        const proofResult = await zkpUtils.generateAdminActionProof(adminKey, action);
        
        if (!proofResult || !proofResult.zkProof) {
          console.error('Proof generation failed - invalid result', proofResult);
          setError('ZK proof generation failed: Invalid result from zkpUtils');
          return null;
        }
        
        return proofResult.zkProof;
      } catch (proofError) {
        console.error('Error in proof generation:', proofError);
        setError(`Failed to generate ZK proof: ${proofError.message}`);
        return null;
      }
    } catch (error) {
      console.error('Error generating admin proof:', error);
      setError(`Failed to generate ZK proof: ${error.message}`);
      return null;
    }
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate form
    if (!formData.name || !formData.description) {
      setError('Please complete all fields');
      return;
    }
    
    setLoading(true);
    setError('');
    setSuccess('');
    
    try {
      // Generate ZK proof for this admin action
      const action = isEditing ? 'update' : 'add';
      const zkProof = await generateAdminProof(action);
      
      if (!zkProof) {
        setError('Failed to generate proof for admin action');
        setLoading(false);
        return;
      }
      
      let response;
      
      if (isEditing) {
        // Update existing candidate
        response = await candidateAPI.updateCandidate(editingId, formData, zkProof);
        setSuccess('Candidate updated successfully');
      } else {
        try {
          // Add new candidate
          console.log('Sending add candidate request with proof:', {
            name: formData.name,
            description: formData.description,
            isActive: formData.isActive
          });
          response = await candidateAPI.addCandidate(
            formData.name, 
            formData.description, 
            zkProof, 
            formData.isActive
          );
          setSuccess('Candidate added successfully');
        } catch (apiError) {
          console.error('API error details:', apiError);
          throw apiError;
        }
      }
      
      // Reset form and refresh candidates
      resetForm();
      fetchCandidates();
    } catch (error) {
      const errorMessage = error.message || 'Operation failed';
      console.error('Operation failed with error:', errorMessage);
      setError(`Error: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  // Edit candidate
  const handleEdit = (candidate) => {
    setFormData({
      name: candidate.name,
      description: candidate.description,
      isActive: candidate.isActive !== undefined ? candidate.isActive : true
    });
    setIsEditing(true);
    setEditingId(candidate.candidateId);
  };

  // Delete candidate
  const handleDelete = async (candidateId) => {
    if (!window.confirm('Are you sure you want to remove this candidate?')) {
      return;
    }
    
    setLoading(true);
    setError('');
    setSuccess('');
    
    try {
      // Generate ZK proof for delete action
      const zkProof = await generateAdminProof('delete');
      
      if (!zkProof) {
        setError('Failed to generate proof for admin action');
        setLoading(false);
        return;
      }
      
      // Delete candidate
      await candidateAPI.deleteCandidate(candidateId, zkProof);
      setSuccess('Candidate removed successfully');
      
      // Refresh candidates
      fetchCandidates();
    } catch (error) {
      setError(`Error: ${error.message || 'Failed to delete candidate'}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white shadow overflow-hidden sm:rounded-lg">
      <div className="px-4 py-5 border-b border-gray-200 sm:px-6">
        <h3 className="text-lg leading-6 font-medium text-gray-900">
          Candidate Management
        </h3>
        <p className="mt-1 max-w-2xl text-sm text-gray-500">
          Add, edit, or remove candidates for the election.
        </p>
      </div>
      
      {/* Alert messages */}
      {error && (
        <div className="mx-4 mt-4 p-4 rounded-md bg-red-100 text-red-700">
          {error}
        </div>
      )}
      
      {success && (
        <div className="mx-4 mt-4 p-4 rounded-md bg-green-100 text-green-700">
          {success}
        </div>
      )}
      
      {/* Candidate Form */}
      <form onSubmit={handleSubmit} className="px-4 py-5 sm:p-6">
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-6">
          <div className="sm:col-span-3">
            <label htmlFor="name" className="block text-sm font-medium text-gray-700">
              Candidate Name
            </label>
            <input
              type="text"
              name="name"
              id="name"
              value={formData.name}
              onChange={handleChange}
              className="mt-1 focus:ring-indigo-500 focus:border-indigo-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
            />
          </div>
          
          <div className="sm:col-span-3">
            <label htmlFor="description" className="block text-sm font-medium text-gray-700">
              Policy Focus
            </label>
            <input
              type="text"
              name="description"
              id="description"
              value={formData.description}
              onChange={handleChange}
              className="mt-1 focus:ring-indigo-500 focus:border-indigo-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
            />
          </div>
          
          <div className="sm:col-span-3">
            <label htmlFor="isActive" className="flex items-center gap-2 text-sm font-medium text-gray-700">
              <input
                type="checkbox"
                name="isActive"
                id="isActive"
                checked={formData.isActive}
                onChange={(e) => setFormData({...formData, isActive: e.target.checked})}
                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
              />
              Active Candidate
            </label>
          </div>
        </div>
        
        <div className="mt-6 flex items-center">
          <button
            type="submit"
            disabled={loading}
            className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            {loading ? 'Processing...' : isEditing ? 'Update Candidate' : 'Add Candidate'}
          </button>
          
          {isEditing && (
            <button
              type="button"
              onClick={resetForm}
              className="ml-3 inline-flex justify-center py-2 px-4 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Cancel
            </button>
          )}
        </div>
      </form>
      
      {/* Candidates List */}
      <div className="px-4 py-5 sm:p-6">
        <h4 className="text-md font-medium text-gray-900 mb-4">Current Candidates</h4>
        
        {loading && candidates.length === 0 ? (
          <div className="text-center py-4">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900" />
            <p className="mt-2 text-sm text-gray-500">Loading candidates...</p>
          </div>
        ) : candidates.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Name
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Policy Focus
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {candidates.map((candidate) => (
                  <tr key={candidate.candidateId}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {candidate.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {candidate.description}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${candidate.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                        {candidate.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => handleEdit(candidate)}
                        className="text-indigo-600 hover:text-indigo-900 mr-4"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(candidate.candidateId)}
                        className="text-red-600 hover:text-red-900"
                      >
                        Remove
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-4 bg-gray-50 rounded-md">
            <p className="text-sm text-gray-500">No candidates found. Add your first candidate using the form above.</p>
          </div>
        )}
      </div>
      
      <div className="px-4 py-3 bg-gray-50 text-xs text-gray-500 sm:px-6">
        <p>All candidate management actions are secured with zero-knowledge proofs to maintain system integrity.</p>
      </div>
    </div>
  );
};

export default CandidateManager; 