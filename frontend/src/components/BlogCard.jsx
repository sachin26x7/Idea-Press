import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Card, CardHeader, CardContent, CardFooter } from './ui/card';
import { Trash2, Heart, MessageCircle, Share2 } from 'lucide-react';
import { useContext, useState } from 'react';
import { AuthContext } from '../context/AuthContext';
import axios from 'axios';
import { getMediaUrl } from '../lib/media';

export default function BlogCard({ blog, onDelete }) {
  const contextValue = useContext(AuthContext);
  const { user = null } = contextValue || {};
  const [deleting, setDeleting] = useState(false);
  const [isLiked, setIsLiked] = useState(blog.likes?.some(like => like._id === user?._id) || false);
  const [likeCount, setLikeCount] = useState(blog.likes?.length || 0);
  const [liking, setLiking] = useState(false);
  const [shared, setShared] = useState(false);

  const canDeleteBlog = user && (user._id === blog.author?._id || user.role === 'admin');
  const excerpt = blog.content
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/\s+/g, ' ')
    .trim();

  const handleShare = async () => {
    const url = `${window.location.origin}/blog/${blog.slug}`;
    try {
      if (navigator.share) {
        await navigator.share({ title: blog.title, url });
      } else {
        await navigator.clipboard.writeText(url);
        setShared(true);
        window.setTimeout(() => setShared(false), 1800);
      }
    } catch (error) {
      if (error.name !== 'AbortError') console.error('Could not share blog:', error);
    }
  };

  const handleDelete = async (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (!window.confirm('Are you sure you want to delete this blog?')) {
      return;
    }

    try {
      setDeleting(true);
      await axios.delete(`/api/blogs/${blog._id}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('accessToken')}`
        }
      });

      if (onDelete) {
        onDelete(blog._id);
      }
    } catch (error) {
      console.error('Error deleting blog:', error);
      alert('Failed to delete blog. ' + (error.response?.data?.message || error.message));
    } finally {
      setDeleting(false);
    }
  };

  const handleLike = async (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (!user) {
      alert('Please log in to like this blog');
      return;
    }

    try {
      setLiking(true);
      const response = await axios.post(`/api/blogs/${blog._id}/like`, {}, {
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

  return (
    <motion.div
      whileHover={{ y: -8, transition: { duration: 0.2 } }}
      className="h-full"
    >
      <Card className="editorial-blog-card flex flex-col h-full group">
        {blog.coverImage ? (
          <div className="editorial-blog-image">
            <img 
              src={getMediaUrl(blog.coverImage)} 
              alt={blog.title} 
              className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-700 ease-in-out"
            />
          </div>
        ) : (
          <div className="editorial-blog-image editorial-blog-placeholder">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-white/10 to-transparent opacity-50"></div>
            <span className="text-4xl font-black text-on-dark break-all p-4 text-center transform -rotate-6 scale-110 group-hover:scale-125 transition-transform duration-500">
              {blog.title.slice(0, 8)}...
            </span>
          </div>
        )}
        <CardHeader className="editorial-blog-header">
          <div className="flex flex-wrap gap-2 text-[10px] text-muted-foreground mb-3">
            <span className="editorial-blog-tag">{blog.category || blog.tags?.[0] || 'Insight'}</span>
          </div>
          <Link to={`/blog/${blog.slug}`}>
            <h2 className="editorial-blog-title">
              {blog.title}
            </h2>
          </Link>
        </CardHeader>
        <CardContent className="editorial-blog-content flex-1">
          <p className="line-clamp-3">{excerpt.substring(0, 180)}{excerpt.length > 180 ? '...' : ''}</p>
          <Link to={`/blog/${blog.slug}`} className="editorial-read-link">Read full post <span aria-hidden="true">{'->'}</span></Link>
        </CardContent>
        <CardFooter className="editorial-blog-footer flex justify-between items-center mt-auto">
          <Link to={`/profile/${blog.author?._id}`} className="flex items-center gap-3 group/author">
            {blog.author?.avatar ? (
              <img src={getMediaUrl(blog.author.avatar)} alt={blog.author.name} className="w-9 h-9 rounded-full object-cover" />
            ) : (
              <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-primary to-accent flex items-center justify-center text-on-dark font-bold shadow-inner">
                {blog.author?.name?.charAt(0) || 'A'}
              </div>
            )}
            <div className="flex flex-col">
              <span className="text-sm font-semibold leading-tight group-hover/author:text-primary transition-colors">{blog.author?.name || 'Unknown Author'}</span>
              <span className="text-[10px] text-muted-foreground leading-tight">{new Date(blog.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
            </div>
          </Link>
          <div className="flex items-center gap-2">
            <button
              onClick={handleLike}
              disabled={liking}
              className={`flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-md transition-all ${
                isLiked 
                  ? 'bg-destructive text-destructive-foreground hover:bg-destructive/90' 
                  : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
              } disabled:opacity-50`}
              title="Like this blog"
            >
              <Heart size={16} fill={isLiked ? 'currentColor' : 'none'} />
              <span>{likeCount}</span>
            </button>
            <Link to={`/blog/${blog.slug}`}>
              <span className="editorial-card-action">
                <MessageCircle size={16} />
                <span>{blog.comments?.length || 0}</span>
              </span>
            </Link>
            <button onClick={handleShare} className="editorial-card-action" title="Share this blog">
              <Share2 size={15} />
              <span>{shared ? 'Copied' : 'Share'}</span>
            </button>
            {canDeleteBlog && (
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="text-xs font-medium text-destructive hover:text-destructive/80 disabled:opacity-50 transition-colors p-2 hover:bg-destructive/10 rounded-md"
                title="Delete blog"
              >
                <Trash2 size={18} />
              </button>
            )}
          </div>
        </CardFooter>
      </Card>
    </motion.div>
  );
}
