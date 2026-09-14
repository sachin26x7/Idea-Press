import { useContext, useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { AuthContext } from '../../context/AuthContext';
import { Button } from '../ui/button';
import { GraduationCap, Sparkles, LogOut, PenTool, LayoutDashboard, BookOpen, Globe, UserCircle } from 'lucide-react';
import { getMediaUrl } from '../../lib/media';

export default function Navbar() {
  const contextValue = useContext(AuthContext);
  const { user = null, logout = () => {} } = contextValue || {};
  const navigate = useNavigate();
  const location = useLocation();
  const isPublicLanding = !user && location.pathname === '/landing';
  const [headerVisible, setHeaderVisible] = useState(true);

  useEffect(() => {
    let lastScrollY = window.scrollY;
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      setHeaderVisible(currentScrollY < 24 || currentScrollY < lastScrollY);
      lastScrollY = currentScrollY;
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleLogout = () => {
    logout(); // Clear all auth data
    navigate('/landing', { replace: true }); // Show the public landing page after logout
  };

  return (
    <motion.nav 
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ type: "spring", stiffness: 100, damping: 20 }}
      className={`fixed top-0 left-0 right-0 w-full h-16 glass z-50 flex items-center border-b border-primary/20 shadow-[0_4px_30px_rgba(var(--primary),0.1)] overflow-hidden transition-transform duration-500 ease-out ${headerVisible ? 'translate-y-0' : '-translate-y-full'} ${isPublicLanding ? 'landing-nav' : ''}`}
    >
      <div className="absolute  inset-0 bg-gradient-to-r from-primary/5 via-transparent to-accent/5 pointer-events-none"></div>
      <div className="container mx-auto px-4  flex justify-between items-center relative z-10">
        <Link to={user ? '/' : '/landing'}>
          <motion.div 
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="flex items-center gap-2 group"
          >
              <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center shadow-lg shadow-primary/20 relative overflow-hidden">
              <div className="absolute inset-0 bg-primary-foreground/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
              <GraduationCap className="text-primary-foreground w-6 h-6 relative z-10" />
            </div>
            <span className="text-2xl font-black text-[#172a25] tracking-tight flex items-center gap-1">
              IdeaPress
              <Sparkles className="w-4 h-4 text-[#b44f3c]" />
            </span>
          </motion.div>
        </Link>
        <div className="flex gap-3 items-center">
          {user ? (
            <>
              <span className="text-sm font-medium hidden md:inline-block text-muted-foreground">
                Welcome, {user.name}
              </span>
              <Link to="/profile">
                <Button variant="outline" className="border-accent/50 text-accent hover:bg-accent/10 hover:text-accent gap-2">
                  {user.avatar ? <img src={getMediaUrl(user.avatar)} alt="" className="w-5 h-5 rounded-full object-cover" /> : <UserCircle size={16} />}
                  Profile
                </Button>
              </Link>
              <Link to="/all-blogs">
                <Button variant="outline" className="gap-2 hidden md:flex hover:text-foreground">
                  <Globe size={16} />
                  All Blogs
                </Button>
              </Link>
              <Link to="/my-blogs">
                <Button variant="outline" className="gap-2 hidden md:flex hover:text-foreground">
                  <BookOpen size={16} />
                  My Blogs
                </Button>
              </Link>
              <Link to="/create-blog">
                <Button variant="outline" className="border-primary text-primary hover:bg-primary/10 hover:text-primary gap-2">
                  <PenTool size={16} />
                  Write
                </Button>
              </Link>
              
              {/* Admin Dashboard Button - Only for admins */}
              {user.role === 'admin' && (
                <Link to="/admin">
                  <Button variant="outline" className="border-amber-500/50 text-amber-500 hover:bg-amber-500/10 hover:text-amber-600 gap-2">
                    <LayoutDashboard size={16} />
                    Admin
                  </Button>
                </Link>
              )}

              {/* Logout Button - Always visible */}
              <Button 
                onClick={handleLogout}
                variant="destructive"
                className="gap-2"
              >
                <LogOut size={16} />
                Logout
              </Button>
            </>
          ) : isPublicLanding ? (
            <>
              <div className="flex items-center gap-2">
                <Link to="/login"><Button className="bg-primary hover:bg-primary/90 text-primary-foreground px-5">Login</Button></Link>
                <Link to="/register"><Button variant="outline" className="px-5">Sign up</Button></Link>
              </div>
            </>
          ) : (
            <>
              <Link to="/login">
                <Button variant="ghost">Log In</Button>
              </Link>
              <Link to="/register">
                <Button className="bg-primary hover:bg-primary/90 text-primary-foreground">Sign Up</Button>
              </Link>
            </>
          )}
        </div>
      </div>
    </motion.nav>
  );
}

