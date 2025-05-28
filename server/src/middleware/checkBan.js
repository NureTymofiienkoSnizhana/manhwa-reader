const Ban = require('../models/Ban');

// Middleware для перевірки, чи заблокований користувач
const checkBan = async (req, res, next) => {
  try {
    if (!req.user) {
      return next();
    }
    
    const user = await User.findById(req.user.id)
                           .populate('bannedBy', 'username');
    
    if (user.isBanned) {
      if (user.isBanExpired()) {
        user.unbanUser();
        await user.save();
      } else {
        req.userBan = {
          reason: user.banReason,
          bannedBy: user.bannedBy,
          bannedUntil: user.banExpiresAt,
          banStatus: user.banStatus
        };
        
        if (req.path.startsWith('/api/')) {
          return res.status(403).json({
            message: 'Your account has been banned',
            ban: {
              reason: user.banReason,
              bannedBy: user.bannedBy ? user.bannedBy.username : 'Administrator',
              bannedUntil: user.banExpiresAt,
              banStatus: user.banStatus
            }
          });
        }
      }
    }
    
    next();
  } catch (error) {
    next(error);
  }
};

module.exports = checkBan;