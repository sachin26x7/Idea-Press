import { useState, useEffect, useContext, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import { Users, CheckCircle, Trash2, Lock, Unlock, Shield, BookOpen } from 'lucide-react';

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('stats');
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalBlogs: 0,
    blockedUsers: 0,
    adminUsers: 0
  });
  const [users, setUsers] = useState([]);
  const [blogs, setBlogs] = useState([]);
  const [loading, setLoading] = useState(true);

  const contextValue = useContext(AuthContext);
  const { user = null } = contextValue || {};
  const navigate = useNavigate();

  const getHeaders = () => ({
    Authorization: `Bearer ${localStorage.getItem('accessToken')}`
  });

  const fetchAdminData = useCallback(async () => {
    try {
      setLoading(true);

      const [statsRes, usersRes, blogsRes] = await Promise.all([
        axios.get('/api/admin/stats', { headers: getHeaders() }),
        axios.get('/api/admin/users', { headers: getHeaders() }),
        axios.get('/api/admin/blogs', { headers: getHeaders() })
      ]);

      setStats(statsRes.data.stats);
      setUsers(usersRes.data.users);
      setBlogs(blogsRes.data.blogs);
    } catch (err) {
      console.error(err);
      alert('Failed to load admin data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!user || user.role !== 'admin') {
      navigate('/');
      return;
    }
    Promise.resolve().then(fetchAdminData);
  }, [user, navigate, fetchAdminData]);

  const handleBlockUser = async (userId, isBlocked) => {
    if (!window.confirm(`Are you sure you want to ${isBlocked ? 'unblock' : 'block'} this user?`)) return;

    try {
      await axios.put(
        `/api/admin/users/${userId}/block`,
        { isBlocked: !isBlocked },
        { headers: getHeaders() }
      );

      setUsers(prev =>
        prev.map(u =>
          u._id === userId ? { ...u, isBlocked: !isBlocked } : u
        )
      );
    } catch (err) {
      console.error(err);
      alert('Failed to update user');
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!window.confirm('Delete this user and all blogs?')) return;

    try {
      await axios.delete(`/api/admin/users/${userId}`, {
        headers: getHeaders()
      });

      setUsers(prev => prev.filter(u => u._id !== userId));
      fetchAdminData();
    } catch (err) {
      console.error(err);
      alert('Failed to delete user');
    }
  };

  const handleDeleteBlog = async (blogId) => {
    if (!window.confirm('Delete this blog?')) return;

    try {
      await axios.delete(`/api/admin/blogs/${blogId}`, {
        headers: getHeaders()
      });

      setBlogs(prev => prev.filter(b => b._id !== blogId));
      fetchAdminData();
    } catch (err) {
      console.error(err);
      alert('Failed to delete blog');
    }
  };

  if (!user || user.role !== 'admin') return null;

  return (
    <div className="min-h-screen bg-background p-6 pt-2 space-y-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-[var(--radius)] p-8 border border-border bg-card shadow-[var(--shadow-card)]"
      >
        <div className="absolute inset-0 bg-gradient-to-r from-indigo-100/20 to-purple-100/20 opacity-0 group-hover:opacity-100 transition-opacity"></div>
        <div className="relative z-10 flex items-center gap-4">
            <div className="p-3 rounded-lg bg-primary shadow-lg">
            <Shield className="w-8 h-8 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-4xl font-black text-foreground">Admin Dashboard</h1>
            <p className="text-muted-foreground mt-1 font-medium">Manage users and blogs with full control</p>
          </div>
        </div>
      </motion.div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-border pb-1">
        {[
          { id: 'stats', label: 'Statistics', icon: CheckCircle },
          { id: 'users', label: 'Users', icon: Users },
          { id: 'blogs', label: 'Blogs', icon: BookOpen }
        ].map(tab => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-6 py-3 rounded-t-xl font-semibold transition-all ${
                activeTab === tab.id
                  ? 'bg-secondary text-primary border-b-2 border-primary shadow-md'
                  : 'text-muted-foreground hover:text-primary hover:bg-secondary/70'
              }`}
            >
              <Icon className="w-5 h-5" />
              {tab.label}
            </button>
          );
        })}
      </div>

      <div className="max-w-7xl mx-auto w-full">

      {/* STATS */}
      {activeTab === 'stats' && (
        <div className="grid md:grid-cols-4 gap-6">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="relative group"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-blue-200/30 to-cyan-200/30 rounded-2xl blur-xl group-hover:blur-2xl transition-all opacity-0 group-hover:opacity-100"></div>
            <div className="relative p-6 rounded-[var(--radius)] border border-border bg-card hover:shadow-xl transition-all">
              <div className="flex items-center justify-between mb-4">
                <div className="text-sm text-primary font-bold">Total Users</div>
                <Users className="w-5 h-5 text-primary" />
              </div>
              <div className="text-4xl font-black text-primary">{stats.totalUsers}</div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 }}
            className="relative group"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-green-200/30 to-emerald-200/30 rounded-2xl blur-xl group-hover:blur-2xl transition-all opacity-0 group-hover:opacity-100"></div>
            <div className="relative p-6 rounded-[var(--radius)] border border-border bg-card hover:shadow-xl transition-all">
              <div className="flex items-center justify-between mb-4">
                <div className="text-sm text-primary font-bold">Total Blogs</div>
                <BookOpen className="w-5 h-5 text-primary" />
              </div>
              <div className="text-4xl font-black text-primary">{stats.totalBlogs}</div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            className="relative group"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-red-200/30 to-orange-200/30 rounded-2xl blur-xl group-hover:blur-2xl transition-all opacity-0 group-hover:opacity-100"></div>
            <div className="relative p-6 rounded-[var(--radius)] border border-border bg-card hover:shadow-xl transition-all">
              <div className="flex items-center justify-between mb-4">
                <div className="text-sm text-destructive font-bold">Blocked Users</div>
                <Lock className="w-5 h-5 text-destructive" />
              </div>
              <div className="text-4xl font-black text-destructive">{stats.blockedUsers}</div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3 }}
            className="relative group"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-purple-200/30 to-pink-200/30 rounded-2xl blur-xl group-hover:blur-2xl transition-all opacity-0 group-hover:opacity-100"></div>
            <div className="relative p-6 rounded-[var(--radius)] border border-border bg-card hover:shadow-xl transition-all">
              <div className="flex items-center justify-between mb-4">
                <div className="text-sm text-accent font-bold">Admin Users</div>
                <Shield className="w-5 h-5 text-accent" />
              </div>
              <div className="text-4xl font-black text-accent">{stats.adminUsers}</div>
            </div>
          </motion.div>
        </div>
      )}

      {/* USERS */}
      {activeTab === 'users' && (
        <div className="space-y-4">
          {loading ? (
            <div className="text-center py-12">
              <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 2 }}>
                <Users className="w-12 h-12 text-primary mx-auto mb-4" />
              </motion.div>
              <p className="text-muted-foreground">Loading users...</p>
            </div>
          ) : users.length === 0 ? (
            <p className="text-center text-muted-foreground py-12">No users found</p>
          ) : (
            users.map((usr, index) => (
              <motion.div
                key={usr._id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                className="relative group"
              >
                <div className={`absolute inset-0 bg-gradient-to-r ${usr.isBlocked ? 'from-red-100/50 to-orange-100/50' : 'from-indigo-100/50 to-purple-100/50'} rounded-xl blur-xl group-hover:blur-2xl transition-all opacity-0 group-hover:opacity-100`}></div>
                <div className={`relative p-6 rounded-xl border transition-all shadow-sm hover:shadow-md ${
                  usr.isBlocked
                    ? 'border-red-200 bg-gradient-to-r from-red-50 to-orange-50 hover:from-red-100 hover:to-orange-100'
                    : 'border-indigo-200 bg-gradient-to-r from-indigo-50 to-purple-50 hover:from-indigo-100 hover:to-purple-100'
                }`}>
                  <div className="flex justify-between items-start gap-4">
                    {/* User Info */}
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${usr.isBlocked ? 'bg-red-200' : 'bg-indigo-200'}`}>
                          <Users className={`w-5 h-5 ${usr.isBlocked ? 'text-destructive' : 'text-primary'}`} />
                        </div>
                        <h3 className="text-lg font-bold text-foreground">{usr.name}</h3>
                      </div>
                      <p className="text-sm text-muted-foreground mb-3">{usr.email}</p>
                      <div className="flex gap-2 flex-wrap">
                        <span className={`text-xs px-3 py-1 rounded-full font-semibold ${usr.role === 'admin' ? 'bg-accent/15 text-accent border border-accent/30' : 'bg-secondary text-secondary-foreground border border-border'}`}>
                          {usr.role === 'admin' ? '👑 Admin' : '👤 User'}
                        </span>
                        <span className={`text-xs px-3 py-1 rounded-full font-semibold ${usr.isBlocked ? 'bg-destructive/15 text-destructive border border-destructive/30' : 'bg-primary/15 text-primary border border-primary/30'}`}>
                          {usr.isBlocked ? '🔒 Blocked' : '✓ Active'}
                        </span>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-2 items-center flex-shrink-0">
                      {/* Block/Unblock Button */}
                      <button
                        onClick={() => handleBlockUser(usr._id, usr.isBlocked)}
                        className={`px-4 py-2 rounded-lg font-semibold flex items-center gap-2 transition-all border shadow-sm hover:shadow-md ${
                          usr.isBlocked
                            ? 'bg-primary text-primary-foreground border-primary hover:bg-primary/90'
                            : 'bg-destructive text-destructive-foreground border-destructive hover:bg-destructive/90'
                        }`}
                      >
                        {usr.isBlocked ? (
                          <>
                            <Unlock className="w-4 h-4" />
                            Unblock
                          </>
                        ) : (
                          <>
                            <Lock className="w-4 h-4" />
                            Block
                          </>
                        )}
                      </button>

                      {/* Delete Button */}
                      <button
                        onClick={() => handleDeleteUser(usr._id)}
                        className="px-4 py-2 rounded-lg font-semibold flex items-center gap-2 bg-destructive text-destructive-foreground border border-destructive hover:bg-destructive/90 transition-all shadow-sm hover:shadow-md"
                      >
                        <Trash2 className="w-4 h-4" />
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))
          )}
        </div>
      )}

      {/* BLOGS */}
      {activeTab === 'blogs' && (
        <div className="space-y-4">
          {loading ? (
            <div className="text-center py-12">
              <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 2 }}>
                <BookOpen className="w-12 h-12 text-primary mx-auto mb-4" />
              </motion.div>
              <p className="text-muted-foreground">Loading blogs...</p>
            </div>
          ) : blogs.length === 0 ? (
            <p className="text-center text-muted-foreground py-12">No blogs found</p>
          ) : (
            blogs.map((blog, index) => (
              <motion.div
                key={blog._id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                className="relative group"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-green-600/10 to-emerald-600/10 rounded-xl blur-xl group-hover:blur-2xl transition-all opacity-0 group-hover:opacity-100"></div>
                <div className="relative p-6 rounded-xl border border-primary/40 bg-surface-dark hover:bg-surface-dark-muted transition-all">
                  <div className="flex justify-between items-start gap-4">
                    {/* Blog Info */}
                    <div className="flex-1">
                      <div className="flex items-start gap-3 mb-2">
                        <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-green-500/20 flex-shrink-0">
                          <BookOpen className="w-5 h-5 text-on-dark" />
                        </div>
                        <div>
                          <h3 className="text-lg font-bold text-on-dark line-clamp-2">{blog.title}</h3>
                          <p className="text-sm text-on-dark mt-1">by <span className="font-semibold">{blog.author?.name}</span></p>
                        </div>
                      </div>
                      <p className="text-sm text-on-dark mt-3 line-clamp-2">{blog.content.substring(0, 120)}...</p>
                    </div>

                    {/* Delete Button */}
                    <button
                      onClick={() => handleDeleteBlog(blog._id)}
                      className="px-4 py-2 rounded-lg font-semibold flex items-center gap-2 bg-destructive text-destructive-foreground border border-destructive hover:bg-destructive/90 transition-all flex-shrink-0 whitespace-nowrap"
                    >
                      <Trash2 className="w-4 h-4" />
                      Delete
                    </button>
                  </div>
                </div>
              </motion.div>
            ))
          )}
        </div>
      )}

      </div>
    </div>
  );
}