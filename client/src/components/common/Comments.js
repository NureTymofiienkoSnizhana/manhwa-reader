import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  TextField, 
  Button, 
  Avatar, 
  Paper, 
  Divider,
  IconButton,
  Menu,
  MenuItem,
  Pagination,
  CircularProgress,
  Collapse,
  Card,
  CardContent,
  CardActions,
  CardHeader,
  Badge,
  Chip
} from '@mui/material';
import {
  ThumbUp as ThumbUpIcon,
  ThumbUpOutlined as ThumbUpOutlinedIcon,
  MoreVert as MoreVertIcon,
  Reply as ReplyIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  Send as SendIcon
} from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/AuthContext';
import { formatDistance } from 'date-fns';
import { 
  getManhwaComments, 
  createComment, 
  updateComment, 
  deleteComment, 
  toggleLikeComment 
} from '../../api/commentService';
import { motion, AnimatePresence } from 'framer-motion';

const Comments = ({ manhwaId }) => {
  const { t } = useTranslation();
  const { isAuthenticated, user } = useAuth();
  
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [commentContent, setCommentContent] = useState('');
  const [replyContent, setReplyContent] = useState('');
  const [editContent, setEditContent] = useState('');
  const [replyingTo, setReplyingTo] = useState(null);
  const [editingComment, setEditingComment] = useState(null);
  const [showReplies, setShowReplies] = useState({});
  const [repliesData, setRepliesData] = useState({});
  const [loadingReplies, setLoadingReplies] = useState({});
  const [menuAnchorEl, setMenuAnchorEl] = useState(null);
  const [selectedComment, setSelectedComment] = useState(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  
  useEffect(() => {
    fetchComments();
  }, [manhwaId, page]);
  
  // Fetch comments function
  const fetchComments = async () => {
    try {
      setLoading(true);
      const data = await getManhwaComments(manhwaId, page, 10, null);
      setComments(data.comments);
      setTotalPages(data.pagination.pages);
    } catch (error) {
      console.error('Error fetching comments:', error);
    } finally {
      setLoading(false);
    }
  };
  
  // Fetch replies for a comment
  const fetchReplies = async (commentId) => {
    try {
      setLoadingReplies(prev => ({ ...prev, [commentId]: true }));
      const data = await getManhwaComments(manhwaId, 1, 20, commentId);
      setRepliesData(prev => ({ ...prev, [commentId]: data.comments }));
    } catch (error) {
      console.error('Error fetching replies:', error);
    } finally {
      setLoadingReplies(prev => ({ ...prev, [commentId]: false }));
    }
  };
  
  // Toggle showing replies
  const toggleReplies = (commentId) => {
    setShowReplies(prev => {
      const isShowing = !prev[commentId];
      
      if (isShowing && (!repliesData[commentId] || repliesData[commentId].length === 0)) {
        fetchReplies(commentId);
      }
      
      return { ...prev, [commentId]: isShowing };
    });
  };
  
  // Submit a new comment
  const handleSubmitComment = async () => {
    if (!commentContent.trim()) return;
    
    try {
      await createComment(manhwaId, commentContent);
      setCommentContent('');
      fetchComments(); 
    } catch (error) {
      console.error('Error creating comment:', error);
    }
  };
  
  // Submit a reply
  const handleSubmitReply = async () => {
    if (!replyContent.trim() || !replyingTo) return;
    
    try {
      await createComment(manhwaId, replyContent, replyingTo);
      setReplyContent('');
      setReplyingTo(null);
      
      fetchReplies(replyingTo);
      
      setShowReplies(prev => ({ ...prev, [replyingTo]: true }));
      
      fetchComments();
    } catch (error) {
      console.error('Error creating reply:', error);
    }
  };
  
  // Submit edited comment
  const handleSubmitEdit = async () => {
    if (!editContent.trim() || !editingComment) return;
    
    try {
      await updateComment(editingComment._id, editContent);
      setEditingComment(null);
      
      if (editingComment.parentId) {
        fetchReplies(editingComment.parentId);
      } else {
        fetchComments();
      }
    } catch (error) {
      console.error('Error updating comment:', error);
    }
  };
  
  // Toggle like on a comment
  const handleToggleLike = async (commentId, isReply = false, parentId = null) => {
    if (!isAuthenticated) return;
    
    try {
      const result = await toggleLikeComment(commentId);
      
      if (isReply && parentId) {
        setRepliesData(prev => ({
          ...prev,
          [parentId]: prev[parentId].map(reply => 
            reply._id === commentId 
              ? { ...reply, likes: Array(result.likes).fill(1), isLiked: result.isLiked } 
              : reply
          )
        }));
      } else {
        setComments(prev => 
          prev.map(comment => 
            comment._id === commentId 
              ? { ...comment, likes: Array(result.likes).fill(1), isLiked: result.isLiked } 
              : comment
          )
        );
      }
    } catch (error) {
      console.error('Error toggling like:', error);
    }
  };
  
  // Open comment menu
  const handleOpenMenu = (event, comment) => {
    setMenuAnchorEl(event.currentTarget);
    setSelectedComment(comment);
  };
  
  // Close comment menu
  const handleCloseMenu = () => {
    setMenuAnchorEl(null);
    setSelectedComment(null);
  };
  
  // Start editing a comment
  const handleStartEdit = () => {
    setEditContent(selectedComment.content);
    setEditingComment(selectedComment);
    handleCloseMenu();
  };
  
  // Delete a comment
  const handleDeleteComment = async () => {
    if (!selectedComment) return;
    
    try {
      await deleteComment(selectedComment._id);
      
      if (selectedComment.parentId) {
        fetchReplies(selectedComment.parentId);
      } else {
        fetchComments();
      }
      
      handleCloseMenu();
    } catch (error) {
      console.error('Error deleting comment:', error);
    }
  };
  
  // Format date
  const formatDate = (dateString) => {
    try {
      return formatDistance(new Date(dateString), new Date(), { addSuffix: true });
    } catch (error) {
      return 'some time ago';
    }
  };
  
  // Comment component
  const CommentItem = ({ comment, isReply = false, parentId = null }) => {
    const isAuthor = isAuthenticated && user && user.id === comment.user._id;
    const isAdmin = isAuthenticated && user && user.role === 'admin';
    const canModify = isAuthor || isAdmin;
    
    return (
      <Card 
        component={motion.div}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        sx={{ 
          mb: 2, 
          borderRadius: 2,
          borderLeft: isReply ? '2px solid' : 'none',
          borderColor: isReply ? 'primary.light' : 'transparent',
          boxShadow: isReply ? 1 : 2
        }}
      >
        <CardHeader
          avatar={
            <Avatar 
              src={comment.user.profilePic} 
              alt={comment.user.username}
              sx={{ bgcolor: 'primary.main' }}
            >
              {comment.user.username.charAt(0).toUpperCase()}
            </Avatar>
          }
          action={
            canModify && (
              <IconButton onClick={(e) => handleOpenMenu(e, comment)}>
                <MoreVertIcon />
              </IconButton>
            )
          }
          title={
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <Typography variant="subtitle1" component="span">
                {comment.user.username}
              </Typography>
              <Chip 
                label={`Lvl ${comment.user.level}`} 
                size="small" 
                sx={{ ml: 1, height: 20, fontSize: '0.7rem' }}
              />
            </Box>
          }
          subheader={formatDate(comment.createdAt)}
        />
        
        <CardContent sx={{ py: 1 }}>
          {editingComment && editingComment._id === comment._id ? (
            <Box>
              <TextField
                fullWidth
                multiline
                rows={3}
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                variant="outlined"
                sx={{ mb: 2 }}
              />
              <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
                <Button 
                  variant="outlined" 
                  size="small"
                  onClick={() => setEditingComment(null)}
                >
                  {t('common.cancel')}
                </Button>
                <Button 
                  variant="contained" 
                  size="small"
                  onClick={handleSubmitEdit}
                >
                  {t('common.save')}
                </Button>
              </Box>
            </Box>
          ) : (
            <Typography variant="body1">{comment.content}</Typography>
          )}
        </CardContent>
        
        <CardActions disableSpacing>
          <IconButton 
            onClick={() => handleToggleLike(comment._id, isReply, parentId)}
            color={comment.isLiked ? 'primary' : 'default'}
            disabled={!isAuthenticated}
          >
            {comment.isLiked ? <ThumbUpIcon /> : <ThumbUpOutlinedIcon />}
          </IconButton>
          <Typography variant="body2">
            {comment.likes?.length || 0}
          </Typography>
          
          {isAuthenticated && !isReply && (
            <Button
              startIcon={<ReplyIcon />}
              size="small"
              sx={{ ml: 1 }}
              onClick={() => setReplyingTo(replyingTo === comment._id ? null : comment._id)}
            >
              {t('common.reply')}
            </Button>
          )}
          
          {!isReply && comment.replyCount > 0 && (
            <Button
              endIcon={showReplies[comment._id] ? <ExpandLessIcon /> : <ExpandMoreIcon />}
              size="small"
              sx={{ ml: 'auto' }}
              onClick={() => toggleReplies(comment._id)}
            >
              {`${comment.replyCount} ${t('common.replies')}`}
            </Button>
          )}
        </CardActions>
        
        {/* Reply box */}
        {replyingTo === comment._id && (
          <Collapse in={replyingTo === comment._id}>
            <Box sx={{ p: 2, display: 'flex', alignItems: 'flex-start', gap: 1 }}>
              <Avatar 
                src={user?.profilePic} 
                sx={{ width: 32, height: 32 }}
              >
                {user?.username?.charAt(0).toUpperCase()}
              </Avatar>
              <TextField
                fullWidth
                size="small"
                placeholder={t('common.writeReply')}
                value={replyContent}
                onChange={(e) => setReplyContent(e.target.value)}
                variant="outlined"
                sx={{ mr: 1 }}
              />
              <IconButton 
                color="primary"
                onClick={handleSubmitReply}
                disabled={!replyContent.trim()}
              >
                <SendIcon />
              </IconButton>
            </Box>
          </Collapse>
        )}
        
        {/* Replies */}
        {!isReply && (
          <Collapse in={showReplies[comment._id]}>
            <Box sx={{ pl: 2, pr: 2, pb: 2 }}>
              {loadingReplies[comment._id] ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
                  <CircularProgress size={24} />
                </Box>
              ) : repliesData[comment._id]?.length > 0 ? (
                repliesData[comment._id].map(reply => (
                  <CommentItem 
                    key={reply._id} 
                    comment={reply} 
                    isReply 
                    parentId={comment._id} 
                  />
                ))
              ) : (
                <Typography variant="body2" color="text.secondary" align="center">
                  {t('common.noReplies')}
                </Typography>
              )}
            </Box>
          </Collapse>
        )}
      </Card>
    );
  };
  
  return (
    <Box sx={{ mt: 4 }}>
      <Typography variant="h5" component="h2" gutterBottom>
        {t('common.comments')}
      </Typography>
      
      {/* Comment input */}
      {isAuthenticated ? (
        <Paper sx={{ p: 2, mb: 4 }}>
          <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
            <Avatar src={user?.profilePic}>
              {user?.username?.charAt(0).toUpperCase()}
            </Avatar>
            <Box sx={{ flexGrow: 1 }}>
              <TextField
                fullWidth
                multiline
                rows={3}
                placeholder={t('common.writeComment')}
                value={commentContent}
                onChange={(e) => setCommentContent(e.target.value)}
                variant="outlined"
                sx={{ mb: 2 }}
              />
              <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                <Button
                  variant="contained"
                  onClick={handleSubmitComment}
                  disabled={!commentContent.trim()}
                  endIcon={<SendIcon />}
                >
                  {t('common.submit')}
                </Button>
              </Box>
            </Box>
          </Box>
        </Paper>
      ) : (
        <Paper sx={{ p: 3, mb: 4, textAlign: 'center' }}>
          <Typography variant="body1" gutterBottom>
            {t('auth.loginToComment')}
          </Typography>
          <Button
            variant="contained"
            component="a"
            href="/login"
            sx={{ mt: 1 }}
          >
            {t('nav.login')}
          </Button>
        </Paper>
      )}
      
      {/* Comments list */}
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
          <CircularProgress />
        </Box>
      ) : comments.length > 0 ? (
        <Box>
          <AnimatePresence>
            {comments.map(comment => (
              <CommentItem key={comment._id} comment={comment} />
            ))}
          </AnimatePresence>
          
          {/* Pagination */}
          {totalPages > 1 && (
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
              <Pagination
                count={totalPages}
                page={page}
                onChange={(e, value) => setPage(value)}
                color="primary"
              />
            </Box>
          )}
        </Box>
      ) : (
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <Typography variant="body1">
            {t('common.noComments')}
          </Typography>
          {isAuthenticated && (
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              {t('common.beTheFirst')}
            </Typography>
          )}
        </Paper>
      )}
      
      {/* Comment menu */}
      <Menu
        anchorEl={menuAnchorEl}
        open={Boolean(menuAnchorEl)}
        onClose={handleCloseMenu}
      >
        <MenuItem onClick={handleStartEdit}>
          {t('common.edit')}
        </MenuItem>
        <MenuItem onClick={handleDeleteComment} sx={{ color: 'error.main' }}>
          {t('common.delete')}
        </MenuItem>
      </Menu>
    </Box>
  );
};

export default Comments;