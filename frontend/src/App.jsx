import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useContext } from 'react';
import { useLocation } from 'react-router-dom';
import { AuthContext, AuthProvider } from './context/AuthContext';
import Navbar from './components/Navbar/Navbar';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import VerifyOTP from './pages/VerifyOTP';
import AdminDashboard from './pages/AdminDashboard';
import CreateBlog from './pages/CreateBlog';
import BlogDetail from './pages/BlogDetail';
import MyBlogs from './pages/MyBlogs';
import AllBlogs from './pages/AllBlogs';
import ForgotPassword from './pages/ForgotPassword';
import Profile from './pages/Profile';
import PublicProfile from './pages/PublicProfile';
import Landing from './pages/Landing';
import Interests from './pages/Interests';

function ProtectedRoute({ children }) {
  const { user, loading } = useContext(AuthContext);
  const location = useLocation();

  if (loading) {
    return <div className="flex min-h-[60vh] items-center justify-center text-muted-foreground">Checking your session...</div>;
  }

  if (!user) return <Navigate to="/login" replace />;
  if (!user.interestsCompleted && location.pathname !== '/interests') {
    return <Navigate to="/interests" replace />;
  }
  return children;
}

function HomeRoute() {
  const { user, loading } = useContext(AuthContext);

  if (loading) {
    return <div className="flex min-h-[60vh] items-center justify-center text-muted-foreground">Checking your session...</div>;
  }

  if (!user) return <Navigate to="/landing" replace />;
  return user.interestsCompleted ? <Home /> : <Navigate to="/interests" replace />;
}

function AppLayout() {
  const { user } = useContext(AuthContext);
  const location = useLocation();
  const isAuthPage = location.pathname === '/login' || location.pathname === '/register';
  const isInterestSetup = user && !user.interestsCompleted;
  const showNavbar = !isAuthPage && (!isInterestSetup || location.pathname === '/interests');

  return (
    <div className="min-h-screen bg-background font-sans antialiased text-foreground selection:bg-primary selection:text-primary-foreground overflow-x-hidden">
      {showNavbar && <Navbar />}
      <main className={`container mx-auto w-full min-w-0 px-3 sm:px-4 ${showNavbar ? 'pt-20' : 'pt-0'} pb-0`}>
        <Routes>
          <Route path="/" element={<HomeRoute />} />
          <Route path="/landing" element={<Landing />} />
          <Route path="/all-blogs" element={<ProtectedRoute><AllBlogs /></ProtectedRoute>} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/interests" element={<ProtectedRoute><Interests /></ProtectedRoute>} />
          <Route path="/verify-otp" element={<VerifyOTP />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
          <Route path="/profile/:id" element={<ProtectedRoute><PublicProfile /></ProtectedRoute>} />
          <Route path="/blog/:slug" element={<ProtectedRoute><BlogDetail /></ProtectedRoute>} />
          <Route path="/my-blogs" element={<ProtectedRoute><MyBlogs /></ProtectedRoute>} />
          <Route path="/admin" element={<ProtectedRoute><AdminDashboard /></ProtectedRoute>} />
          <Route path="/create-blog" element={<ProtectedRoute><CreateBlog /></ProtectedRoute>} />
        </Routes>
      </main>
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <AppLayout />
      </Router>
    </AuthProvider>
  );
}

export default App;
