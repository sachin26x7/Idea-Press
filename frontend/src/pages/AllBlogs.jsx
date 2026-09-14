import { useEffect, useState, useCallback } from 'react';
import axios from 'axios';
import { motion } from 'framer-motion';
import { useContext } from 'react';
import BlogCard from '../components/BlogCard';
import { Loader2, Search } from 'lucide-react';
import { AuthContext } from '../context/AuthContext';

const categoryOptions = ['All', 'Insight', 'Newsletter', 'Tips', 'Success Stories', 'Culture', 'Technology', 'Business', 'Design', 'Lifestyle', 'Education', 'Science', 'Career', 'Travel', 'Opinion'];

export default function AllBlogs() {
  const [blogs, setBlogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [filteredBlogs, setFilteredBlogs] = useState([]);
  const { user } = useContext(AuthContext);

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
    Promise.resolve().then(fetchAllBlogs);
  }, [fetchAllBlogs]);

  const applyFilters = (term, category) => {
    setSearchTerm(term);
    const filtered = blogs.filter(blog => 
      (category === 'All' || (blog.category || blog.tags?.[0] || 'Insight') === category) &&
      (blog.title.toLowerCase().includes(term) ||
      blog.content.toLowerCase().includes(term) ||
      blog.author.name.toLowerCase().includes(term))
    );
    setFilteredBlogs(filtered);
  };

  const handleSearch = (e) => applyFilters(e.target.value.toLowerCase(), selectedCategory);
  const handleCategory = (category) => {
    setSelectedCategory(category);
    applyFilters(searchTerm, category);
  };

  const visibleCategories = ['All', ...(user?.interests || []), ...categoryOptions.filter((category) => category !== 'All' && !user?.interests?.includes(category))];

  return (
    <div className="editorial-posts-page">
      <motion.section
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="editorial-posts-hero"
      >
        <div className="editorial-posts-hero-copy">
          <span className="editorial-kicker">IDEAPRESS / JOURNAL</span>
          <h1>Our Blog &amp; Insight</h1>
          <p>Ideas, stories, and thoughtful perspectives from the people making things worth sharing.</p>
        </div>
        <div className="editorial-hero-orb" aria-hidden="true"><span>IDEA<br />PRESS</span></div>
        <div className="editorial-search-wrap">
          <Search size={17} />
          <input type="search" placeholder="Search stories, authors, or ideas" value={searchTerm} onChange={handleSearch} aria-label="Search stories" />
        </div>
      </motion.section>

      <div className="editorial-posts-content">
        <div className="editorial-posts-toolbar">
          <div className="editorial-filter-pills" aria-label="Post categories">
            {visibleCategories.map((category) => <button key={category} className={selectedCategory === category ? 'active' : ''} onClick={() => handleCategory(category)}>{category}</button>)}
          </div>
        </div>
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
            <Search className="w-16 h-16 text-muted-foreground mb-4" />
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
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ staggerChildren: 0.1 }}
              className="editorial-posts-grid"
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
