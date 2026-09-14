import { useContext, useEffect, useState, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import BlogCard from '../components/BlogCard';
import { Loader2, BookOpen } from 'lucide-react';
import { Button } from '../components/ui/button';

export default function MyBlogs() {
  const contextValue = useContext(AuthContext);
  const { user = null } = contextValue || {};
  const navigate = useNavigate();
  const [blogs, setBlogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const hasRunRef = useRef(false);

  const fetchMyBlogs = useCallback(async () => {
    try {
      setLoading(true);
      const { data } = await axios.get('/api/blogs', {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('accessToken')}`
        }
      });
      // Filter blogs by current user
      const userBlogs = data.blogs.filter(blog => blog.author._id === user._id);
      setBlogs(userBlogs);
    } catch (error) {
      console.error('Error fetching blogs', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }

    if (!hasRunRef.current) {
      hasRunRef.current = true;
      fetchMyBlogs();
    }
  }, [user, navigate, fetchMyBlogs]);

  if (!user) return null;

  return (
    <div className="space-y-12 pb-10 overflow-hidden px-2 relative">
      <div className="absolute top-[-10%] right-[-5%] w-[800px] h-[800px] bg-primary/20 blur-[150px] rounded-full pointer-events-none -z-10 mix-blend-screen"></div>
      <div className="absolute bottom-[20%] left-[-10%] w-[600px] h-[600px] bg-accent/10 blur-[120px] rounded-full pointer-events-none -z-10 mix-blend-screen"></div>

      {/* Header */}
      <motion.section
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative text-center py-12 px-6 rounded-[var(--radius)] bg-card border border-border shadow-[var(--shadow-card)] overflow-hidden"
      >
        <div className="relative z-10 space-y-4">
          <div className="flex items-center justify-center gap-3 mb-4">
            <BookOpen className="w-8 h-8 text-primary" />
            <h1 className="text-4xl md:text-5xl font-black text-foreground">My Blog Posts</h1>
            <BookOpen className="w-8 h-8 text-accent" />
          </div>
          <p className="text-muted-foreground text-lg">
            {blogs.length} {blogs.length === 1 ? 'post' : 'posts'} created by you
          </p>
        </div>
      </motion.section>

      <div className="max-w-7xl mx-auto">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="w-12 h-12 text-primary animate-spin mb-4" />
            <p className="text-muted-foreground">Loading your blogs...</p>
          </div>
        ) : blogs.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center justify-center py-20 px-6"
          >
            <BookOpen className="w-16 h-16 text-muted-foreground mb-4" />
            <h3 className="text-2xl font-bold text-foreground mb-2">No blogs yet</h3>
            <p className="text-muted-foreground text-center max-w-md mb-6">
              Start sharing your knowledge! Create your first blog post and inspire others in the community.
            </p>
            <Button
              onClick={() => navigate('/create-blog')}
              className="bg-primary hover:bg-primary/90 text-primary-foreground"
            >
              Create Your First Blog
            </Button>
          </motion.div>
        ) : (
          <div>
            <div className="flex flex-col md:flex-row justify-between items-end mb-8 border-b border-border pb-6">
              <div>
                <h2 className="text-3xl font-extrabold flex items-center gap-4 tracking-tight">
                  <span className="w-10 h-1.5 bg-gradient-to-r from-primary to-accent rounded-full"></span>
                  Your Posts
                </h2>
              </div>
              <Button
                onClick={() => navigate('/create-blog')}
                variant="outline"
                className="border-primary text-primary hover:bg-primary/10 gap-2 mt-4 md:mt-0"
              >
                New Blog
              </Button>
            </div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ staggerChildren: 0.1 }}
              className="grid gap-6 md:grid-cols-2 lg:grid-cols-3"
            >
              {blogs.map((blog, index) => (
                <motion.div
                  key={blog._id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <BlogCard blog={blog} onDelete={() => fetchMyBlogs()} />
                </motion.div>
              ))}
            </motion.div>
          </div>
        )}
      </div>
    </div>
  );
}
