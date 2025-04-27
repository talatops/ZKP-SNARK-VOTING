import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { adminAPI, authAPI } from '../utils/api';
import CandidateManager from '../components/CandidateManager';

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
  const [activeTab, setActiveTab] = useState('dashboard'); // 'dashboard', 'candidates', or 'logs'
  const [currentTime, setCurrentTime] = useState(new Date().toLocaleString());
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    totalLogs: 0,
    totalPages: 1
  });
  const [autoRefresh, setAutoRefresh] = useState('off'); // 'off' or '5s'

  // Update current time every minute
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date().toLocaleString());
    }, 60000);
    
    return () => clearInterval(timer);
  }, []);

  // Auto-refresh timer effect
  useEffect(() => {
    let refreshTimer;
    
    if (autoRefresh === '5s') {
      refreshTimer = setInterval(() => {
        fetchDashboardData();
      }, 5000);
    }
    
    return () => {
      if (refreshTimer) clearInterval(refreshTimer);
    };
  }, [autoRefresh]);

  // Check if user is authenticated and is an admin
  useEffect(() => {
    if (!authAPI.isAdminAuthenticated()) {
      navigate('/admin-login');
    }
  }, [navigate]);

  // Fetch system status and logs on initial load and when timeFrame or pagination changes
  useEffect(() => {
    fetchDashboardData();
  }, [timeFrame, pagination.page, pagination.limit]);

  // Fetch dashboard data (status and logs)
  const fetchDashboardData = async () => {
    setIsLoading(true);
    try {
      // Fetch system status
      const statusResponse = await adminAPI.getSystemStatus();
      setSystemStatus(statusResponse.data);
      
      // Fetch system logs
      const logsResponse = await adminAPI.getSystemLogs(
        pagination.page, 
        pagination.limit, 
        null, 
        timeFrame
      );
      
      setLogs(logsResponse.data.logs);
      
      // Update pagination data
      setPagination(prev => ({
        ...prev,
        totalLogs: logsResponse.data.totalLogs || logsResponse.data.logs.length,
        totalPages: logsResponse.data.totalPages || Math.ceil((logsResponse.data.totalLogs || logsResponse.data.logs.length) / prev.limit)
      }));
      
      setError('');
    } catch (err) {
      setError('Failed to load dashboard data. Please try again.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle refresh button click
  const handleRefresh = () => {
    setCurrentTime(new Date().toLocaleString());
    fetchDashboardData();
  };

  // Handle auto-refresh change
  const handleAutoRefreshChange = (e) => {
    setAutoRefresh(e.target.value);
  };

  // Handle page change
  const handlePageChange = (newPage) => {
    if (newPage < 1 || newPage > pagination.totalPages) return;
    
    setPagination(prev => ({
      ...prev,
      page: newPage
    }));
  };

  // Handle page size change
  const handlePageSizeChange = (e) => {
    const newLimit = parseInt(e.target.value, 10);
    setPagination({
      page: 1, // Reset to first page when changing page size
      limit: newLimit,
      totalLogs: pagination.totalLogs,
      totalPages: Math.ceil(pagination.totalLogs / newLimit)
    });
  };

  const handleLogout = () => {
    authAPI.logoutAdmin();
    navigate('/admin-login');
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  const getLogLevelClass = (level) => {
    switch (level) {
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

  // Helper to render refresh controls
  const renderRefreshControls = () => {
    return (
      <div className="flex space-x-3 items-center">
        <select
          className="block pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm rounded-md"
          value={autoRefresh}
          onChange={handleAutoRefreshChange}
        >
          <option value="off">Auto-Refresh: OFF</option>
          <option value="5s">Auto-Refresh: ON (5s)</option>
        </select>
        
        <button 
          onClick={handleRefresh}
          className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Refresh Now
        </button>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8 flex justify-between items-center">
          <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
          <div className="flex items-center">
            <span className="mr-4 text-sm text-gray-500">{currentTime}</span>
            <button
              onClick={handleLogout}
              className="px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
            >
              Logout
            </button>
          </div>
        </div>
      </header>
      
      {/* Tab Navigation */}
      <div className="border-b border-gray-200 bg-white">
        <nav className="max-w-7xl mx-auto flex" aria-label="Tabs">
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`px-4 py-3 text-sm font-medium ${
              activeTab === 'dashboard'
                ? 'border-b-2 border-indigo-500 text-indigo-600'
                : 'text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Dashboard
          </button>
          <button
            onClick={() => setActiveTab('candidates')}
            className={`px-4 py-3 text-sm font-medium ${
              activeTab === 'candidates'
                ? 'border-b-2 border-indigo-500 text-indigo-600'
                : 'text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Candidate Management
          </button>
          <button
            onClick={() => setActiveTab('logs')}
            className={`px-4 py-3 text-sm font-medium ${
              activeTab === 'logs'
                ? 'border-b-2 border-indigo-500 text-indigo-600'
                : 'text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            System Logs
          </button>
        </nav>
      </div>
      
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {error && (
          <div className="mb-6 p-4 rounded-md bg-red-100 text-red-700">
            {error}
          </div>
        )}
        
        {isLoading && activeTab !== 'candidates' ? (
          <div className="flex justify-center items-center h-64">
            <svg className="animate-spin h-10 w-10 text-primary-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
          </div>
        ) : (
          <>
            {activeTab === 'dashboard' && (
              <div className="mb-8">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-semibold">System Status</h2>
                  {renderRefreshControls()}
                </div>
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
            )}
            
            {activeTab === 'candidates' && (
              <div className="mb-8">
                <CandidateManager />
              </div>
            )}
            
            {activeTab === 'logs' && (
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-semibold">System Logs</h2>
                  <div className="flex space-x-3">
                    {renderRefreshControls()}
                    <select
                      className="block pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm rounded-md"
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
                        <li key={log._id || `log-${log.timestamp}`}>
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
                
                {/* Enhanced Pagination */}
                {logs.length > 0 && (
                  <div className="flex items-center justify-between border-t border-gray-200 bg-white px-4 py-3 sm:px-6 mt-4 rounded-md">
                    <div className="flex flex-1 items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-700">
                          Showing <span className="font-medium">{logs.length ? (pagination.page - 1) * pagination.limit + 1 : 0}</span> to{' '}
                          <span className="font-medium">
                            {Math.min(pagination.page * pagination.limit, pagination.totalLogs)}
                          </span>{' '}
                          of <span className="font-medium">{pagination.totalLogs}</span> results
                        </p>
                      </div>
                      <div className="flex items-center space-x-3">
                        <span className="text-sm text-gray-700">Logs per page: </span>
                        <select
                          value={pagination.limit}
                          onChange={handlePageSizeChange}
                          className="mt-1 block pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm rounded-md"
                        >
                          <option value="10">10</option>
                          <option value="25">25</option>
                          <option value="50">50</option>
                          <option value="100">100</option>
                        </select>
                        
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handlePageChange(1)}
                            disabled={pagination.page === 1}
                            className={`relative inline-flex items-center px-2 py-2 rounded-md border ${
                              pagination.page === 1
                                ? 'bg-gray-100 text-gray-400 cursor-not-allowed border-gray-300'
                                : 'bg-white text-gray-700 hover:bg-gray-50 border-gray-300'
                            }`}
                          >
                            <span className="sr-only">First</span>
                            ⟪
                          </button>
                          <button
                            onClick={() => handlePageChange(pagination.page - 1)}
                            disabled={pagination.page === 1}
                            className={`relative inline-flex items-center px-2 py-2 rounded-md border ${
                              pagination.page === 1
                                ? 'bg-gray-100 text-gray-400 cursor-not-allowed border-gray-300'
                                : 'bg-white text-gray-700 hover:bg-gray-50 border-gray-300'
                            }`}
                          >
                            <span className="sr-only">Previous</span>
                            ←
                          </button>
                          <span className="px-3 py-2 text-sm">
                            Page {pagination.page} of {pagination.totalPages}
                          </span>
                          <button
                            onClick={() => handlePageChange(pagination.page + 1)}
                            disabled={pagination.page === pagination.totalPages}
                            className={`relative inline-flex items-center px-2 py-2 rounded-md border ${
                              pagination.page === pagination.totalPages
                                ? 'bg-gray-100 text-gray-400 cursor-not-allowed border-gray-300'
                                : 'bg-white text-gray-700 hover:bg-gray-50 border-gray-300'
                            }`}
                          >
                            <span className="sr-only">Next</span>
                            →
                          </button>
                          <button
                            onClick={() => handlePageChange(pagination.totalPages)}
                            disabled={pagination.page === pagination.totalPages}
                            className={`relative inline-flex items-center px-2 py-2 rounded-md border ${
                              pagination.page === pagination.totalPages
                                ? 'bg-gray-100 text-gray-400 cursor-not-allowed border-gray-300'
                                : 'bg-white text-gray-700 hover:bg-gray-50 border-gray-300'
                            }`}
                          >
                            <span className="sr-only">Last</span>
                            ⟫
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
};

export default AdminDashboard; 