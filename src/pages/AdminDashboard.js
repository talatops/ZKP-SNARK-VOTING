import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { adminAPI, authAPI } from '../utils/api';

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [logs, setLogs] = useState([]);
  const [systemStatus, setSystemStatus] = useState({
    status: 'Loading...',
    uptime: '--',
    activeUsers: 0,
    totalVotes: 0,
    failedLogins: 0
  });
  const [timeFrame, setTimeFrame] = useState('24h');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  // Check if user is authenticated and is an admin
  useEffect(() => {
    if (!authAPI.isAuthenticated() || !authAPI.isAdmin()) {
      navigate('/admin-login');
    }
  }, [navigate]);

  // Fetch system status and logs on initial load and when timeFrame changes
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        // Fetch system status
        const statusResponse = await adminAPI.getSystemStatus();
        setSystemStatus(statusResponse.data);
        
        // Fetch system logs
        const logsResponse = await adminAPI.getSystemLogs(1, 10, null, timeFrame);
        setLogs(logsResponse.data.logs);
        
        setError('');
      } catch (err) {
        setError('Failed to load dashboard data. Please try again.');
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchData();
  }, [timeFrame]);

  const handleLogout = () => {
    authAPI.logout();
    navigate('/admin-login');
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  const getLogLevelClass = (level) => {
    switch(level) {
      case 'ERROR':
        return 'bg-red-100 text-red-800';
      case 'WARN':
        return 'bg-yellow-100 text-yellow-800';
      case 'INFO':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8 flex justify-between items-center">
          <h1 className="text-3xl font-bold text-gray-900">Administrator Dashboard</h1>
          <button
            onClick={handleLogout}
            className="px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
          >
            Logout
          </button>
        </div>
      </header>
      
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {error && (
          <div className="mb-6 p-4 rounded-md bg-red-100 text-red-700">
            {error}
          </div>
        )}
        
        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <svg className="animate-spin h-10 w-10 text-primary-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          </div>
        ) : (
          <>
            {/* System Status Card */}
            <div className="mb-8">
              <h2 className="text-xl font-semibold mb-4">System Status</h2>
              <div className="bg-white overflow-hidden shadow rounded-lg">
                <div className="px-4 py-5 sm:p-6">
                  <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-5">
                    <div className={`rounded-md p-4 ${systemStatus.status === 'Operational' ? 'bg-green-100' : 'bg-yellow-100'}`}>
                      <h3 className={`text-sm font-medium ${systemStatus.status === 'Operational' ? 'text-green-800' : 'text-yellow-800'}`}>Status</h3>
                      <p className={`mt-1 text-3xl font-semibold ${systemStatus.status === 'Operational' ? 'text-green-900' : 'text-yellow-900'}`}>{systemStatus.status}</p>
                    </div>
                    
                    <div className="bg-blue-100 rounded-md p-4">
                      <h3 className="text-sm font-medium text-blue-800">Uptime</h3>
                      <p className="mt-1 text-3xl font-semibold text-blue-900">{systemStatus.uptime}</p>
                    </div>
                    
                    <div className="bg-indigo-100 rounded-md p-4">
                      <h3 className="text-sm font-medium text-indigo-800">Active Users</h3>
                      <p className="mt-1 text-3xl font-semibold text-indigo-900">{systemStatus.activeUsers}</p>
                    </div>
                    
                    <div className="bg-purple-100 rounded-md p-4">
                      <h3 className="text-sm font-medium text-purple-800">Total Votes</h3>
                      <p className="mt-1 text-3xl font-semibold text-purple-900">{systemStatus.totalVotes}</p>
                    </div>
                    
                    <div className="bg-yellow-100 rounded-md p-4">
                      <h3 className="text-sm font-medium text-yellow-800">Failed Logins</h3>
                      <p className="mt-1 text-3xl font-semibold text-yellow-900">{systemStatus.failedLogins}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* System Logs */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold">System Logs</h2>
                <div>
                  <select
                    className="mt-1 block pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm rounded-md"
                    value={timeFrame}
                    onChange={(e) => setTimeFrame(e.target.value)}
                  >
                    <option value="1h">Last Hour</option>
                    <option value="24h">Last 24 Hours</option>
                    <option value="7d">Last 7 Days</option>
                    <option value="30d">Last 30 Days</option>
                  </select>
                </div>
              </div>
              
              <div className="bg-white shadow overflow-hidden sm:rounded-md">
                {logs.length > 0 ? (
                  <ul className="divide-y divide-gray-200">
                    {logs.map((log) => (
                      <li key={log._id}>
                        <div className="px-4 py-4 sm:px-6">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center">
                              <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getLogLevelClass(log.level)}`}>
                                {log.level}
                              </span>
                              <p className="ml-3 text-sm font-medium text-gray-900">{log.message}</p>
                            </div>
                            <div className="ml-2 flex-shrink-0 flex">
                              <p className="text-sm text-gray-500">{formatDate(log.timestamp)}</p>
                            </div>
                          </div>
                          <div className="mt-2 sm:flex sm:justify-between">
                            <div className="sm:flex">
                              <p className="text-sm text-gray-500">{log.details}</p>
                            </div>
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className="px-4 py-5 sm:p-6 text-center text-gray-500">
                    No logs found for the selected time frame.
                  </div>
                )}
              </div>
              
              {/* Pagination */}
              {logs.length > 0 && (
                <div className="flex items-center justify-between border-t border-gray-200 bg-white px-4 py-3 sm:px-6 mt-4 rounded-md">
                  <div className="flex flex-1 justify-between sm:hidden">
                    <a href="#" className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50">
                      Previous
                    </a>
                    <a href="#" className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50">
                      Next
                    </a>
                  </div>
                  <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
                    <div>
                      <p className="text-sm text-gray-700">
                        Showing <span className="font-medium">1</span> to <span className="font-medium">{logs.length}</span> of{' '}
                        <span className="font-medium">{logs.length}</span> results
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </>
        )}
      </main>
    </div>
  );
};

export default AdminDashboard; 