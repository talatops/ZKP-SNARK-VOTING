const SystemLog = require('../models/SystemLog');
const User = require('../models/User');
const Vote = require('../models/Vote');
const logger = require('../utils/logger');

// Get system logs with pagination and filtering
exports.getSystemLogs = async (req, res, next) => {
  try {
    // Ensure user is admin
    if (!req.user.isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized access'
      });
    }

    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const skip = (page - 1) * limit;
    const level = req.query.level;
    const timeFrame = req.query.timeFrame;
    
    // Build filter query
    const filter = {};
    
    if (level && ['INFO', 'WARN', 'ERROR'].includes(level)) {
      filter.level = level;
    }
    
    if (timeFrame) {
      const now = new Date();
      let timeAgo = new Date();
      
      switch (timeFrame) {
        case '1h':
          timeAgo.setHours(now.getHours() - 1);
          break;
        case '24h':
          timeAgo.setDate(now.getDate() - 1);
          break;
        case '7d':
          timeAgo.setDate(now.getDate() - 7);
          break;
        case '30d':
          timeAgo.setDate(now.getDate() - 30);
          break;
        default:
          timeAgo = null;
      }
      
      if (timeAgo) {
        filter.timestamp = { $gte: timeAgo };
      }
    }
    
    // Execute query with pagination
    const logs = await SystemLog.find(filter)
      .sort({ timestamp: -1 })
      .skip(skip)
      .limit(limit);
      
    const total = await SystemLog.countDocuments(filter);
    
    res.status(200).json({
      success: true,
      data: {
        logs,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit)
        }
      }
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