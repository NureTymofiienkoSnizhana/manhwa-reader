const User = require('../models/User');

// Middleware для перевірки, чи заблокований користувач
const checkBan = async (req, res, next) => {
  try {
    if (!req.user) {
      return next();
    }
    
    const user = await User.findById(req.user.id)
                           .populate('bannedBy', 'username');
    
    if (!user) {
      return next();
    }
    
    console.log(`Checking ban status for user ${user.username}, isBanned: ${user.isBanned}`);
    
    if (user.isBanned) {
      if (user.isBanExpired()) {
        console.log(`Ban expired for user ${user.username}, unbanning`);
        user.unbanUser();
        await user.save();
      } else {
        console.log(`User ${user.username} is banned, preparing ban info`);
        const banInfo = {
          reason: user.banReason,
          bannedBy: user.bannedBy,
          bannedUntil: user.banExpiresAt,
          banStatus: user.banStatus
        };
        
        req.userBan = banInfo;
        
        if (req.path.startsWith('/api/')) {
          console.log(`API request from banned user ${user.username}, blocking with 403`);
          return res.status(403).json({
            message: 'Your account has been banned',
            ban: banInfo
          });
        }
        
        console.log(`Non-API request from banned user ${user.username}, continuing to allow redirect`);
      }
    }
    
    next();
  } catch (error) {
    console.error('Error in checkBan middleware:', error);
    next(error);
  }
};

module.exports = checkBan;