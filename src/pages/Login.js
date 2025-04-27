import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import LockIcon from '../components/LockIcon';
import { authAPI, zkpUtils } from '../utils/api';

const Login = () => {
  const [identifier, setIdentifier] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [notRegistered, setNotRegistered] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!identifier.trim()) {
      setError('Please enter your identifier');
      return;
    }
    
    setIsLoading(true);
    setError('');
    setNotRegistered(false);
    
    try {
      // Generate a zk-SNARK proof for authentication
      const { hashedIdentifier, zkProof } = await zkpUtils.generateAuthProof(identifier);
      
      // Authenticate with the backend
      await authAPI.login(hashedIdentifier, zkProof);
      
      // Redirect to dashboard on success
      navigate('/dashboard');
    } catch (err) {
      if (err.message?.includes('not registered') || err.message?.includes('not found')) {
        setNotRegistered(true);
        setError('You are not registered. Please register first.');
      } else {
        setError(err.message || 'Authentication failed. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = () => {
    navigate('/register');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <div className="flex justify-center">
            <LockIcon className="h-16 w-16 text-primary-600" />
          </div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Anonymous Voter Authentication
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Secure and private voting with zk-SNARKs
          </p>
        </div>
        
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="rounded-md shadow-sm -space-y-px">
            <div>
              <label htmlFor="identifier" className="sr-only">
                Identifier
              </label>
              <input
                id="identifier"
                name="identifier"
                type="text"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md rounded-b-md focus:outline-none focus:ring-primary-500 focus:border-primary-500 focus:z-10 sm:text-sm"
                placeholder="Enter your identifier (will be hashed)"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
              />
            </div>
          </div>

          {error && (
            <div className="text-red-500 text-sm text-center">{error}</div>
          )}

          {notRegistered && (
            <div className="flex justify-center">
              <button
                type="button"
                onClick={handleRegister}
                className="text-sm font-medium text-white bg-green-600 hover:bg-green-700 px-4 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
              >
                Register Now
              </button>
            </div>
          )}

          <div>
            <button
              type="submit"
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
              disabled={isLoading}
            >
              {isLoading ? (
                <span className="absolute left-0 inset-y-0 flex items-center pl-3">
                  <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                </span>
              ) : (
                <span className="absolute left-0 inset-y-0 flex items-center pl-3">
                  <svg className="h-5 w-5 text-primary-300 group-hover:text-primary-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                    <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                  </svg>
                </span>
              )}
              {isLoading ? 'Authenticating...' : 'Authenticate Anonymously'}
            </button>
          </div>
        </form>
        
        <div className="mt-6">
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-gray-100 text-gray-500">
                Secure Authentication
              </span>
            </div>
          </div>
          
          <div className="mt-6 flex justify-center text-sm text-center text-gray-500">
            <p>
              Your identity remains private with zero-knowledge proofs
            </p>
          </div>
          
          <div className="mt-4 text-center text-sm space-x-4">
            <button
              onClick={() => navigate('/register')}
              className="font-medium text-primary-600 hover:text-primary-500"
            >
              First time? Register here
            </button>
            <span className="text-gray-500">|</span>
            <button
              onClick={() => navigate('/admin-login')}
              className="font-medium text-primary-600 hover:text-primary-500"
            >
              Administrator Login
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login; 