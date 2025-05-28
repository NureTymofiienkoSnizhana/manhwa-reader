const { validationResult } = require('express-validator');
const Comment = require('../models/Comment');
const User = require('../models/User');
const { EXP_REWARDS } = require('../utils/experienceUtils');

// Get comments for a manhwa
const getManhwaComments = async (req, res, next) => {
  try {
    const { manhwaId } = req.params;
    const { page = 1, limit = 20, parentId = null } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const query = { 
      manhwaId,
      isDeleted: false,
      parentId: parentId === 'null' ? null : parentId
    };
    
    const comments = await Comment.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .populate('user', 'username profilePic level')
      .lean();
    
    const commentIds = comments.map(comment => comment._id);
    const replyCounts = await Comment.aggregate([
      { $match: { parentId: { $in: commentIds }, isDeleted: false } },
      { $group: { _id: '$parentId', count: { $sum: 1 } } }
    ]);
    
    const replyCountMap = replyCounts.reduce((acc, item) => {
      acc[item._id] = item.count;
      return acc;
    }, {});
    
    const commentsWithReplyCounts = comments.map(comment => ({
      ...comment,
      replyCount: replyCountMap[comment._id] || 0,
      isLiked: req.user ? comment.likes.some(like => like.equals(req.user._id)) : false
    }));
    
    const total = await Comment.countDocuments(query);
    
    res.json({
      comments: commentsWithReplyCounts,
      pagination: {
        total,
        page: parseInt(page),
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    next(error);
  }
};

// Create a new comment
const createComment = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    
    if (req.user.isBanned) {
      return res.status(403).json({ message: 'You cannot create comments while your account is banned' });
    }
    
    const { manhwaId } = req.params;
    const { content, parentId } = req.body;
    
    const comment = new Comment({
      user: req.user.id,
      manhwaId,
      content,
      parentId: parentId || null
    });
    
    await comment.save();
    
    await comment.populate('user', 'username profilePic level');
    
    const user = await User.findById(req.user.id);
    user.addExperience(EXP_REWARDS.WRITE_COMMENT);
    await user.save();
    
    res.status(201).json({
      comment,
      expGained: EXP_REWARDS.WRITE_COMMENT,
      message: 'Comment added! +5 EXP'
    });
  } catch (error) {
    next(error);
  }
};

// Update a comment
const updateComment = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    
    const { commentId } = req.params;
    const { content } = req.body;
    
    const comment = await Comment.findById(commentId);
    
    if (!comment) {
      return res.status(404).json({ message: 'Comment not found' });
    }
    
    if (comment.user.toString() !== req.user.id) {
      return res.status(403).json({ message: 'User not authorized' });
    }
    
    comment.content = content;
    await comment.save();
    
    await comment.populate('user', 'username profilePic level');
    
    res.json({ comment });
  } catch (error) {
    next(error);
  }
};

// Delete a comment
const deleteComment = async (req, res, next) => {
  try {
    const { commentId } = req.params;
    
    const comment = await Comment.findById(commentId);
    
    if (!comment) {
      return res.status(404).json({ message: 'Comment not found' });
    }
    
    if (comment.user.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'User not authorized' });
    }
    
    comment.isDeleted = true;
    await comment.save();
    
    res.json({ message: 'Comment deleted successfully' });
  } catch (error) {
    next(error);
  }
};

// Like/unlike a comment
const toggleLikeComment = async (req, res, next) => {
  try {
    const { commentId } = req.params;
    
    const comment = await Comment.findById(commentId);
    
    if (!comment) {
      return res.status(404).json({ message: 'Comment not found' });
    }
    
    const likeIndex = comment.likes.indexOf(req.user.id);
    
    if (likeIndex === -1) {
      comment.likes.push(req.user.id);
    } else {
      comment.likes.splice(likeIndex, 1);
    }
    
    await comment.save();
    
    res.json({ 
      likes: comment.likes.length,
      isLiked: likeIndex === -1 
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getManhwaComments,
  createComment,
  updateComment,
  deleteComment,
  toggleLikeComment
};