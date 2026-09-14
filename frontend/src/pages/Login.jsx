import { useState, useContext } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import { Eye, EyeOff, Loader2, LockKeyhole, Mail } from 'lucide-react';

export default function Login() {
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState('');

  const contextValue = useContext(AuthContext);
  const { login = () => {} } = contextValue || {};
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const { data } = await axios.post('/api/auth/login', { email, password });
      login(data);
      navigate(data.interestsCompleted ? '/' : '/interests', { replace: true });
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="auth-page">
      <div className="auth-backdrop auth-backdrop-one" />
      <div className="auth-backdrop auth-backdrop-two" />

      <motion.div
        initial={{ opacity: 0, y: 28, scale: 0.97 }}
        animate={{ opacity: 1, y: 0,  scale: 1 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="auth-shell"
      >
        {/* ── Left illustrated panel ── */}
        <aside className="auth-visual" aria-hidden="true">
          {/* illustration */}
          <img
            src="/auth-login.jpg"
            alt="Cozy workspace illustration"
            className="auth-visual-img"
          />

          <div className="auth-visual-copy">
            <h2>
              Welcome back!&nbsp;
              <span className="auth-sparkle">✨</span>
            </h2>
          </div>
        </aside>

        {/* ── Right form panel ── */}
        <section className="auth-form-panel" aria-labelledby="login-title">
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.55, delay: 0.12, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className="auth-heading">
              <h1 id="login-title">Log in to your account</h1>
              <p>We're happy to see you again! <span className="auth-emoji">💜</span></p>
            </div>

            <form onSubmit={handleSubmit} className="auth-form">
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="auth-alert"
                  role="alert"
                >
                  <span />
                  {error}
                </motion.div>
              )}

              <div className="auth-field">
                <label htmlFor="login-email">Email address</label>
                <div className="auth-input-wrap">
                  <Mail size={17} />
                  <input
                    id="login-email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your email"
                    autoComplete="email"
                  />
                </div>
              </div>

              <div className="auth-field">
                <div className="auth-label-row">
                  <label htmlFor="login-password">Password</label>
                  <Link to="/forgot-password">Forgot your password?</Link>
                </div>
                <div className="auth-input-wrap">
                  <LockKeyhole size={17} />
                  <input
                    id="login-password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    className="auth-password-toggle"
                    onClick={() => setShowPassword((v) => !v)}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                  </button>
                </div>
              </div>

              <button type="submit" className="auth-submit" disabled={loading}>
                {loading
                  ? <><Loader2 size={18} className="auth-spinner" /> Signing in…</>
                  : 'Log in'}
              </button>
            </form>

            <p className="auth-switch">
              Don't have an account?{' '}
              <Link to="/register">Sign up <span aria-hidden="true">↗</span></Link>
            </p>
            <Link to="/landing" className="auth-home-link">
              ← Return to landing page
            </Link>
          </motion.div>
        </section>
      </motion.div>
    </main>
  );
}
