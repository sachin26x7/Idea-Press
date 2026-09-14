import { useContext, useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import { Trash2, Heart } from 'lucide-react';
import { getMediaUrl } from '../lib/media';

export default function CommentSection({ blogId, likes = [] }) {
  const contextValue = useContext(AuthContext);
  const { user = null } = contextValue || {};
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [likeCount, setLikeCount] = useState(likes?.length || 0);
  const [isLiked, setIsLiked] = useState(likes?.some(like => like._id === user?._id) || false);
  const [liking, setLiking] = useState(false);

  const fetchComments = useCallback(async () => {
    try {
      setLoading(true);
      const response = await axios.get(`/api/blogs/${blogId}/comments`);
      setComments(response.data);
    } catch (error) {
      console.error('Error fetching comments:', error);
    } finally {
      setLoading(false);
    }
  }, [blogId]);

  useEffect(() => {
    Promise.resolve().then(fetchComments);
  }, [fetchComments]);

  const handleAddComment = async (e) => {
    e.preventDefault();

    if (!user) {
      alert('Please login to comment');
      return;
    }

    if (!newComment.trim()) {
      alert('Please enter a comment');
      return;
    }

    try {
      setSubmitting(true);
      const response = await axios.post(
        `/api/blogs/${blogId}/comments`,
        {
          content: newComment
        },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('accessToken')}`
          }
        }
      );

      setComments([response.data.comment, ...comments]);
      setNewComment('');
    } catch (error) {
      console.error('Error posting comment:', error);
      alert('Failed to post comment: ' + (error.response?.data?.message || error.message));
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteComment = async (commentId) => {
    if (!window.confirm('Delete this comment?')) return;

    try {
      await axios.delete(`/api/blogs/comment/${commentId}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('accessToken')}`
        }
      });

      setComments(comments.filter(c => c._id !== commentId));
    } catch (error) {
      console.error('Error deleting comment:', error);
      alert('Failed to delete comment');
    }
  };

  const handleLike = async () => {
    if (!user) {
      alert('Please log in to like this blog');
      return;
    }

    try {
      setLiking(true);
      const response = await axios.post(`/api/blogs/${blogId}/like`, {}, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('accessToken')}`
        }
      });

      setIsLiked(response.data.isLiked);
      setLikeCount(response.data.blog.likes?.length || 0);
    } catch (error) {
      console.error('Error liking blog:', error);
      alert('Failed to like blog. ' + (error.response?.data?.message || error.message));
    } finally {
      setLiking(false);
    }
  };

  const canDeleteComment = (commentAuthorId) => {
    return user && (user._id === commentAuthorId || user.role === 'admin');
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="mt-12 space-y-8 border-t border-border pt-8"
    >
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold">Discussion ({comments.length})</h2>
        <button
          onClick={handleLike}
          disabled={liking}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg font-semibold transition-all ${
            isLiked 
              ? 'bg-destructive text-destructive-foreground hover:bg-destructive/90'
              : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
          } disabled:opacity-50`}
          title="Like this blog"
        >
          <Heart size={20} fill={isLiked ? 'currentColor' : 'none'} />
          <span>{likeCount} {likeCount === 1 ? 'Like' : 'Likes'}</span>
        </button>
      </div>

      {/* Show who liked the blog */}
      {likes && likes.length > 0 && (
        <div className="bg-card border border-border rounded-lg p-4">
          <p className="text-sm font-semibold mb-2">Liked by:</p>
          <div className="flex flex-wrap gap-2">
            {likes.map((liker) => (
              <div key={liker._id} className="flex items-center gap-2 bg-secondary rounded-full px-3 py-1">
                <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-primary to-accent flex items-center justify-center text-on-dark text-xs font-bold">
                  {liker.name?.charAt(0) || 'U'}
                </div>
                <span className="text-xs font-medium">{liker.name}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {user ? (
        <form onSubmit={handleAddComment} className="space-y-4">
          <textarea
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Share your thoughts..."
            className="w-full p-4 rounded-lg bg-background border border-input text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none resize-none"
            rows={4}
            disabled={submitting}
          />
          <button
            type="submit"
            disabled={submitting || !newComment.trim()}
            className="px-6 py-2 bg-primary text-primary-foreground rounded-lg font-semibold hover:bg-primary/90 disabled:opacity-50 transition-colors"
          >
            {submitting ? 'Posting...' : 'Post Comment'}
          </button>
        </form>
      ) : (
        <div className="bg-card border border-border rounded-lg p-4">
          <p className="text-muted-foreground">Please <a href="/login" className="text-primary hover:underline">login</a> to comment</p>
        </div>
      )}

      <div className="space-y-4">
        {loading ? (
          <p className="text-muted-foreground">Loading comments...</p>
        ) : comments.length === 0 ? (
          <p className="text-muted-foreground">No comments yet. Be the first!</p>
        ) : (
          comments.map((comment) => (
            <motion.div
              key={comment._id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-card border border-border rounded-lg p-4 space-y-3"
            >
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-3">
                  <Link to={`/profile/${comment.author?._id}`} className="flex items-center gap-3 group/author">
                    {comment.author?.avatar ? (
                      <img src={getMediaUrl(comment.author.avatar)} alt={comment.author.name} className="w-8 h-8 rounded-full object-cover" />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-primary to-accent flex items-center justify-center text-on-dark text-sm font-bold">
                        {comment.author?.name?.charAt(0) || 'U'}
                      </div>
                    )}
                    <div>
                      <p className="font-semibold text-foreground group-hover/author:text-primary transition-colors">{comment.author?.name || 'Anonymous'}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(comment.createdAt).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                    </div>
                  </Link>
                </div>
                {canDeleteComment(comment.author?._id) && (
                  <button
                    onClick={() => handleDeleteComment(comment._id)}
                    className="text-destructive hover:text-destructive/80 transition-colors p-2"
                    title="Delete comment"
                  >
                    <Trash2 size={16} />
                  </button>
                )}
              </div>
              <p className="text-foreground">{comment.content}</p>
            </motion.div>
          ))
        )}
      </div>
    </motion.div>
  );
}
