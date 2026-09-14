import { useEffect, useState, useContext } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import CommentSection from '../components/CommentSection';
import { Button } from '../components/ui/button';
import { Heart, MessageCircle, ArrowLeft } from 'lucide-react';

export default function BlogDetail() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const contextValue = useContext(AuthContext);
  const { user = null } = contextValue || {};
  const [blog, setBlog] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isLiked, setIsLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [liking, setLiking] = useState(false);

  useEffect(() => {
    const fetchBlog = async () => {
      try {
        setLoading(true);
        const response = await axios.get(`/api/blogs/slug/${slug}`);
        setBlog(response.data);
        setLikeCount(response.data.likes?.length || 0);
        setIsLiked(response.data.likes?.some(like => like._id === user?._id) || false);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load blog');
        console.error('Error fetching blog:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchBlog();
  }, [slug, user?._id]);

  const handleLike = async () => {
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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error || !blog) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4">
        <h1 className="text-3xl font-bold">Blog Not Found</h1>
        <p className="text-muted-foreground">{error || 'The blog you are looking for does not exist'}</p>
        <Button onClick={() => navigate('/')} className="gap-2">
          <ArrowLeft size={16} />
          Back to Home
        </Button>
      </div>
    );
  }

  return (
    <motion.article
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="max-w-3xl mx-auto"
    >
      <button
        onClick={() => navigate('/')}
        className="inline-flex items-center gap-2 text-primary hover:text-primary/80 mb-6 transition-colors"
      >
        <ArrowLeft size={18} />
        Back to Blogs
      </button>

      {blog.coverImage && (
        <motion.img
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          src={blog.coverImage}
          alt={blog.title}
          className="w-full h-96 object-cover rounded-xl mb-8 shadow-lg"
        />
      )}

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="space-y-6"
      >
        <div>
          <h1 className="text-4xl font-bold mb-4 text-foreground">
            {blog.title}
          </h1>
          
          <div className="flex flex-wrap gap-2 mb-6">
            {blog.tags?.map(tag => (
              <span key={tag} className="px-3 py-1 bg-primary/20 text-primary border border-primary/30 rounded-full text-sm font-semibold">
                {tag}
              </span>
            ))}
          </div>

          <div className="flex items-center justify-between py-6 border-b border-border">
            <div className="flex items-center gap-4">
              <Link to={`/profile/${blog.author?._id}`} className="flex items-center gap-4 group/author">
                {blog.author?.avatar ? (
                  <img src={blog.author.avatar} alt={blog.author.name} className="w-12 h-12 rounded-full object-cover" />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-primary to-accent flex items-center justify-center text-on-dark font-bold text-lg">
                    {blog.author?.name?.charAt(0) || 'A'}
                  </div>
                )}
                <div>
                  <p className="font-semibold text-lg group-hover/author:text-primary transition-colors">{blog.author?.name || 'Unknown Author'}</p>
                  <p className="text-sm text-muted-foreground">
                  {new Date(blog.createdAt).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                  </p>
                </div>
              </Link>
            </div>

            <div className="flex items-center gap-4">
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
                <span>{likeCount}</span>
              </button>
              <div className="flex items-center gap-2 px-4 py-2 bg-secondary rounded-lg">
                <MessageCircle size={20} />
                <span className="font-semibold">{blog.comments?.length || 0}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="prose prose-invert max-w-none">
          <div
            className="text-lg leading-relaxed text-foreground space-y-4"
            dangerouslySetInnerHTML={{ __html: blog.content }}
          />
        </div>

        {/* Show who liked the blog */}
        {blog.likes && blog.likes.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-card border border-border rounded-lg p-6"
          >
            <p className="text-lg font-semibold mb-4">Liked by {blog.likes.length} {blog.likes.length === 1 ? 'person' : 'people'}:</p>
            <div className="flex flex-wrap gap-3">
              {blog.likes.map((liker) => (
                <div
                  key={liker._id}
                  className="flex items-center gap-2 bg-secondary hover:bg-secondary/80 transition-colors rounded-full px-4 py-2"
                >
                  <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-primary to-accent flex items-center justify-center text-on-dark font-bold text-sm">
                    {liker.name?.charAt(0) || 'U'}
                  </div>
                  <span className="font-medium">{liker.name}</span>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </motion.div>

      {/* Comments Section */}
      <CommentSection blogId={blog._id} likes={blog.likes} />
    </motion.article>
  );
}
