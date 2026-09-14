import { useEffect, useState, useCallback, useContext, useRef } from 'react';
import axios from 'axios';
import { motion } from 'framer-motion';
import BlogCard from '../components/BlogCard';
import { Loader2, Globe } from 'lucide-react';
import { AuthContext } from '../context/AuthContext';

export default function Home() {
  const { user } = useContext(AuthContext);
  const [blogs, setBlogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredBlogs, setFilteredBlogs] = useState([]);
  const hasInitialized = useRef(false);

  const fetchAllBlogs = useCallback(async () => {
    try {
      setLoading(true);
      const { data } = await axios.get('/api/blogs');
      setBlogs(data.blogs);
      setFilteredBlogs(data.blogs);
    } catch (error) {
      console.error('Error fetching blogs', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (user && !hasInitialized.current) {
      hasInitialized.current = true;
      fetchAllBlogs();
    }
  }, [user, fetchAllBlogs]);

  const handleSearch = (e) => {
    const term = e.target.value.toLowerCase();
    setSearchTerm(term);
    
    const filtered = blogs.filter(blog => 
      blog.title.toLowerCase().includes(term) ||
      blog.content.toLowerCase().includes(term) ||
      blog.author.name.toLowerCase().includes(term)
    );
    setFilteredBlogs(filtered);
  };

  return (
    <div className="space-y-12 pb-10 overflow-x-hidden px-2 relative">
      <div className="fixed top-[-10%] right-[-5%] w-[800px] h-[800px] bg-primary/20 blur-[150px] rounded-full pointer-events-none -z-10 mix-blend-screen"></div>
      <div className="fixed bottom-[20%] left-[-10%] w-[600px] h-[600px] bg-accent/10 blur-[120px] rounded-full pointer-events-none -z-10 mix-blend-screen"></div>

      {/* Header */}
      <motion.section
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative text-center py-12 px-6 rounded-[var(--radius)] bg-card border border-border shadow-[var(--shadow-card)] overflow-hidden"
      >
        <div className="relative z-10 space-y-6">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Globe className="w-8 h-8 text-primary" />
            <h1 className="text-4xl md:text-5xl font-black text-foreground">Community Blog Posts</h1>
            <Globe className="w-8 h-8 text-accent" />
          </div>
          <p className="text-muted-foreground text-lg">
            Explore amazing stories and insights from creators around the world
          </p>
          
          {/* Search Bar */}
          <div className="max-w-2xl mx-auto mt-8">
            <input
              type="text"
              placeholder="Search blogs by title, content, or author..."
              value={searchTerm}
              onChange={handleSearch}
              className="w-full px-6 py-3 rounded-full bg-background border border-input text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
            />
          </div>
        </div>
      </motion.section>

      <div className="max-w-7xl mx-auto">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="w-12 h-12 text-primary animate-spin mb-4" />
            <p className="text-muted-foreground">Loading blogs...</p>
          </div>
        ) : filteredBlogs.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center justify-center py-20 px-6"
          >
            <Globe className="w-16 h-16 text-muted-foreground mb-4" />
            <h3 className="text-2xl font-bold text-foreground mb-2">
              {searchTerm ? 'No blogs found' : 'No blogs yet'}
            </h3>
            <p className="text-muted-foreground text-center max-w-md">
              {searchTerm 
                ? 'Try adjusting your search terms' 
                : 'Be the first to share your knowledge! Create a blog post now.'}
            </p>
          </motion.div>
        ) : (
          <div>
            <div className="flex flex-col md:flex-row justify-between items-center mb-8 border-b border-border pb-6">
              <div>
                <h2 className="text-3xl font-extrabold flex items-center gap-4 tracking-tight">
                  <span className="w-10 h-1.5 bg-gradient-to-r from-primary to-accent rounded-full"></span>
                  All Posts
                </h2>
                <p className="text-muted-foreground mt-2 ml-14">
                  {filteredBlogs.length} {filteredBlogs.length === 1 ? 'post' : 'posts'}
                </p>
              </div>
            </div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ staggerChildren: 0.1 }}
              className="grid gap-6 md:grid-cols-2 lg:grid-cols-3"
            >
              {filteredBlogs.map((blog, index) => (
                <motion.div
                  key={blog._id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <BlogCard blog={blog} onDelete={() => fetchAllBlogs()} />
                </motion.div>
              ))}
            </motion.div>
          </div>
        )}
      </div>
    </div>
  );
}
