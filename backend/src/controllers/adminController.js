const SystemLog = require('../models/SystemLog');
const User = require('../models/User');
const Vote = require('../models/Vote');
const logger = require('../utils/logger');

// Get system logs with pagination and filtering
exports.getSystemLogs = async (req, res, next) => {
  try {
    // Ensure user is admin
    if (!req.user || !req.user.isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized access'
      });
    }
    
    // Parse query parameters
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const level = req.query.level;
    const timeFrame = req.query.timeFrame || '24h';
    
    // Calculate time threshold based on timeFrame
    let timeThreshold;
    const now = new Date();
    
    switch(timeFrame) {
      case '1h':
        timeThreshold = new Date(now.getTime() - 60 * 60 * 1000);
        break;
      case '7d':
        timeThreshold = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case '30d':
        timeThreshold = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      default: // 24h is default
        timeThreshold = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    }
    
    // Build query
    const query = { timestamp: { $gte: timeThreshold } };
    if (level) {
      query.level = level.toUpperCase();
    }
    
    // Count total logs for pagination
    const totalLogs = await SystemLog.countDocuments(query);
    
    // Calculate total pages
    const totalPages = Math.ceil(totalLogs / limit);
    
    // Fetch logs with pagination
    const logs = await SystemLog.find(query)
      .sort({ timestamp: -1 })
      .skip((page - 1) * limit)
      .limit(limit);
    
    res.status(200).json({
      success: true,
      logs,
      currentPage: page,
      totalPages,
      totalLogs,
      limit
    });
  } catch (error) {
    next(error);
  }
};

// Get system status overview
exports.getSystemStatus = async (req, res, next) => {
  try {
    // Ensure user is admin
    if (!req.user.isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized access'
      });
    }

    // Get system uptime in hours and minutes
    const uptimeSeconds = process.uptime();
    const hours = Math.floor(uptimeSeconds / 3600);
    const minutes = Math.floor((uptimeSeconds % 3600) / 60);
    const uptime = `${hours}h ${minutes}m`;

    // Get active users (registered voters)
    const activeUsers = await User.countDocuments({ isAdmin: false });
    
    // Get total votes
    const totalVotes = await Vote.countDocuments();
    
    // Get failed login attempts in the last 24 hours
    const oneDayAgo = new Date();
    oneDayAgo.setDate(oneDayAgo.getDate() - 1);
    
    const failedLogins = await SystemLog.countDocuments({
      level: 'WARN',
      message: { $in: ['Failed login attempt', 'Failed admin login attempt'] },
      timestamp: { $gte: oneDayAgo }
    });
    
    // Determine status based on system conditions
    let status = 'Operational';
    
    // Check for recent errors
    const recentErrors = await SystemLog.countDocuments({
      level: 'ERROR',
      timestamp: { $gte: oneDayAgo }
    });
    
    if (recentErrors > 0) {
      status = 'Degraded';
    }
    
    res.status(200).json({
      success: true,
      data: {
        status,
        uptime,
        activeUsers,
        totalVotes,
        failedLogins,
        recentErrors
      }
    });
  } catch (error) {
    next(error);
  }
}; 