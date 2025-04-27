import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { voteAPI, zkpUtils, authAPI, candidateAPI } from '../utils/api';

const Dashboard = () => {
  const navigate = useNavigate();
  const [hasVoted, setHasVoted] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [candidates, setCandidates] = useState([]);
  const [loadingCandidates, setLoadingCandidates] = useState(true);

  // Check if user is authenticated and hasn't voted already
  useEffect(() => {
    if (!authAPI.isVoterAuthenticated()) {
      navigate('/');
      return;
    }
    
    // Get user identifier
    const userIdentifier = localStorage.getItem('voter_userIdentifier');
    if (!userIdentifier) {
      console.error('User identifier missing');
      return;
    }
    
    // Check if this specific user has already voted
    const userVotedKey = `hasVoted_${userIdentifier}`;
    const hasAlreadyVoted = localStorage.getItem(userVotedKey) === 'true';
    
    if (hasAlreadyVoted) {
      setHasVoted(true);
      setStatusMessage('You have already cast your vote in this election.');
    }

    // Fetch candidates from the API
    const fetchCandidates = async () => {
      setLoadingCandidates(true);
      try {
        const response = await candidateAPI.getCandidates();
        if (response.success && response.data) {
          setCandidates(response.data);
        } else {
          // If no candidates are found, show default candidates as fallback
          setCandidates([
            { candidateId: 'default-1', name: 'Candidate A', description: 'Policy focus: Economy' },
            { candidateId: 'default-2', name: 'Candidate B', description: 'Policy focus: Healthcare' },
            { candidateId: 'default-3', name: 'Candidate C', description: 'Policy focus: Education' },
            { candidateId: 'default-4', name: 'Abstain', description: 'I choose not to vote' }
          ]);
        }
      } catch (error) {
        console.error('Error fetching candidates:', error);
        // Fallback to default candidates in case of error
        setCandidates([
          { candidateId: 'default-1', name: 'Candidate A', description: 'Policy focus: Economy' },
          { candidateId: 'default-2', name: 'Candidate B', description: 'Policy focus: Healthcare' },
          { candidateId: 'default-3', name: 'Candidate C', description: 'Policy focus: Education' },
          { candidateId: 'default-4', name: 'Abstain', description: 'I choose not to vote' }
        ]);
      } finally {
        setLoadingCandidates(false);
      }
    };

    fetchCandidates();
  }, [navigate]);

  const handleVote = async (candidateName) => {
    // Get user identifier
    const userIdentifier = localStorage.getItem('voter_userIdentifier');
    if (!userIdentifier) {
      setStatusMessage('Error: User identifier missing. Please log in again.');
      return;
    }
    
    const userVotedKey = `hasVoted_${userIdentifier}`;
    
    // Prevent double voting for this specific user
    if (hasVoted || localStorage.getItem(userVotedKey) === 'true') {
      setStatusMessage('You have already cast your vote in this election.');
      setHasVoted(true);
      return;
    }
    
    setIsLoading(true);
    setStatusMessage('Processing your vote...');
    
    try {
      // Generate a zk-SNARK proof for voting using the identifier and choice
      const { zkProof } = await zkpUtils.generateVoteProof(userIdentifier, candidateName);
      
      // Cast the vote via API
      const result = await voteAPI.castVote(candidateName, zkProof);
      
      // Mark as voted both in state and localStorage for this specific user
      setHasVoted(true);
      localStorage.setItem(userVotedKey, 'true');
      
      setStatusMessage(`Your vote for "${candidateName}" has been recorded anonymously.`);
      
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
    authAPI.logoutVoter();
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
            
            {loadingCandidates ? (
              <div className="flex justify-center items-center h-40">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
              </div>
            ) : !hasVoted ? (
              <div>
                <h3 className="text-lg font-medium mb-3">Cast Your Vote</h3>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  {candidates.map(candidate => (
                    <button
                      key={candidate.candidateId}
                      onClick={() => handleVote(candidate.name)}
                      className="px-4 py-6 border border-gray-300 rounded-md shadow-sm text-center hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                      disabled={isLoading}
                    >
                      <span className="block text-lg font-medium text-gray-900">{candidate.name}</span>
                      <span className="block mt-1 text-sm text-gray-500">{candidate.description}</span>
                    </button>
                  ))}
                  
                  {candidates.length === 0 && (
                    <div className="col-span-2 p-6 text-center border border-yellow-300 bg-yellow-50 rounded-md">
                      <p className="text-yellow-700">No candidates available for this election. Please contact an administrator.</p>
                    </div>
                  )}
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