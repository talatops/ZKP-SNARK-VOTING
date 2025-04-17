import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { voteAPI, zkpUtils, authAPI } from '../utils/api';

const Dashboard = () => {
  const navigate = useNavigate();
  const [hasVoted, setHasVoted] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Check if user is authenticated
  useEffect(() => {
    if (!authAPI.isAuthenticated()) {
      navigate('/');
    }
  }, [navigate]);

  const handleVote = async (option) => {
    setIsLoading(true);
    setStatusMessage('Processing your vote...');
    
    try {
      // Generate a zk-SNARK proof for voting
      // In a real app, we would pass the actual identifier,
      // but for demo purposes, we'll just use a placeholder
      const { zkProof } = await zkpUtils.generateVoteProof('voter-identifier', option);
      
      // Cast the vote via API
      const result = await voteAPI.castVote(option, zkProof);
      
      setHasVoted(true);
      setStatusMessage(`Your vote for "${option}" has been recorded anonymously.`);
      
      // If the vote was recorded on the blockchain, show the transaction hash
      if (result.transactionHash) {
        setStatusMessage(prev => `${prev} Transaction hash: ${result.transactionHash.substring(0, 10)}...`);
      }
    } catch (error) {
      setStatusMessage(`Error: ${error.message || 'Failed to cast vote. Please try again.'}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    authAPI.logout();
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8 flex justify-between items-center">
          <h1 className="text-3xl font-bold text-gray-900">Voting Dashboard</h1>
          <button
            onClick={handleLogout}
            className="px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
          >
            Logout
          </button>
        </div>
      </header>
      
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="border-4 border-dashed border-gray-200 rounded-lg p-6 bg-white">
            {statusMessage && (
              <div className={`mb-6 p-4 rounded-md ${hasVoted ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}`}>
                {statusMessage}
              </div>
            )}
            
            <div className="mb-6">
              <h2 className="text-xl font-semibold mb-4">Current Election</h2>
              <p className="text-gray-600 mb-2">
                You are authenticated anonymously. Your identity is protected while maintaining the integrity of the voting process.
              </p>
            </div>
            
            {!hasVoted ? (
              <div>
                <h3 className="text-lg font-medium mb-3">Cast Your Vote</h3>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <button
                    onClick={() => handleVote('Candidate A')}
                    className="px-4 py-6 border border-gray-300 rounded-md shadow-sm text-center hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                    disabled={isLoading}
                  >
                    <span className="block text-lg font-medium text-gray-900">Candidate A</span>
                    <span className="block mt-1 text-sm text-gray-500">Policy focus: Economy</span>
                  </button>
                  
                  <button
                    onClick={() => handleVote('Candidate B')}
                    className="px-4 py-6 border border-gray-300 rounded-md shadow-sm text-center hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                    disabled={isLoading}
                  >
                    <span className="block text-lg font-medium text-gray-900">Candidate B</span>
                    <span className="block mt-1 text-sm text-gray-500">Policy focus: Healthcare</span>
                  </button>
                  
                  <button
                    onClick={() => handleVote('Candidate C')}
                    className="px-4 py-6 border border-gray-300 rounded-md shadow-sm text-center hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                    disabled={isLoading}
                  >
                    <span className="block text-lg font-medium text-gray-900">Candidate C</span>
                    <span className="block mt-1 text-sm text-gray-500">Policy focus: Education</span>
                  </button>
                  
                  <button
                    onClick={() => handleVote('Abstain')}
                    className="px-4 py-6 border border-gray-300 rounded-md shadow-sm text-center hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                    disabled={isLoading}
                  >
                    <span className="block text-lg font-medium text-gray-900">Abstain</span>
                    <span className="block mt-1 text-sm text-gray-500">I choose not to vote</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="bg-green-50 p-6 rounded-md">
                <h3 className="text-lg font-medium text-green-800 mb-2">Vote Recorded</h3>
                <p className="text-green-700">
                  Thank you for participating in this election. Your vote has been recorded anonymously.
                </p>
                <div className="mt-4">
                  <p className="text-sm text-gray-600">
                    A zero-knowledge proof has been generated to verify your vote without revealing your identity.
                  </p>
                </div>
              </div>
            )}
            
            <div className="mt-8 border-t border-gray-200 pt-6">
              <h3 className="text-lg font-medium mb-3">Privacy Information</h3>
              <div className="bg-blue-50 p-4 rounded-md text-sm text-blue-700">
                <p className="mb-2">
                  <strong>Your Privacy is Protected:</strong> This system uses zk-SNARKs (Zero-Knowledge Succinct Non-Interactive Arguments of Knowledge) to ensure that:
                </p>
                <ul className="list-disc pl-5 space-y-1">
                  <li>Your identity remains completely anonymous</li>
                  <li>Your vote cannot be linked back to you</li>
                  <li>The system can verify you are eligible to vote without knowing who you are</li>
                  <li>No one, not even system administrators, can determine how you voted</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard; 