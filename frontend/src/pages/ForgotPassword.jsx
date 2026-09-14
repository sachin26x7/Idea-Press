import { useState } from 'react';
import { motion } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Loader2, Mail, Lock, CheckCircle, ArrowLeft } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Card, CardHeader, CardContent, CardFooter, CardTitle, CardDescription } from '../components/ui/card';

export default function ForgotPassword() {
  const [step, setStep] = useState('email'); // 'email', 'reset', or 'success'
  const [email, setEmail] = useState('');
  const [token, setToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const navigate = useNavigate();

  const handleSendToken = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');

    if (!email) {
      setError('Email is required');
      return;
    }

    try {
      setLoading(true);
      const response = await axios.post('/api/auth/forgot-password', { email });
      
      setMessage(response.data.message);
      setStep('reset');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to send reset token');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');

    if (!token || !newPassword || !confirmPassword) {
      setError('All fields are required');
      return;
    }

    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    try {
      setLoading(true);
      const response = await axios.post('/api/auth/reset-password', {
        email,
        token,
        newPassword
      });

      setMessage(response.data.message);
      setStep('success');
      setTimeout(() => {
        navigate('/login');
      }, 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to reset password');
    } finally {
      setLoading(false);
    }
  };

  const handleBackToEmail = () => {
    setStep('email');
    setToken('');
    setNewPassword('');
    setConfirmPassword('');
    setError('');
    setMessage('');
    setShowPassword(false);
    setShowConfirmPassword(false);
  };

  return (
    <div className="flex justify-center items-center h-[70vh] relative -mt-4">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/3 -translate-y-2/3 w-[400px] h-[400px] bg-primary/20 blur-[130px] rounded-full pointer-events-none -z-10"></div>
      
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.5, type: "spring", stiffness: 100 }}
        className="w-full max-w-md z-10"
      >
        {/* Step 1: Email */}
        {step === 'email' && (
          <Card className="w-full glass shadow-2xl overflow-hidden relative">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary via-accent to-primary"></div>
            <CardHeader className="text-center space-y-1 pt-4 pb-2">
              <motion.div 
                initial={{ scale: 0 }} 
                animate={{ scale: 1 }} 
                transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
                className="w-12 h-12 mx-auto bg-primary/10 rounded-xl flex items-center justify-center border border-primary/20 shadow-[0_0_20px_rgba(var(--primary),0.3)] mb-1"
              >
                <Mail className="w-6 h-6 text-primary" />
              </motion.div>
              <CardTitle className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-accent">Reset Password</CardTitle>
              <CardDescription className="text-sm font-medium">Enter your email to receive reset token</CardDescription>
            </CardHeader>
            <form onSubmit={handleSendToken}>
              <CardContent className="space-y-3 px-6 pb-2">
                {error && (
                  <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className="text-destructive text-sm font-semibold p-4 bg-destructive/10 rounded-xl border border-destructive/20 flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-destructive"></div>
                    {error}
                  </motion.div>
                )}
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-foreground tracking-wide">EMAIL ADDRESS</label>
                  <Input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="bg-background border-input focus-visible:ring-primary focus-visible:border-primary transition-all h-10"
                    placeholder="name@example.com"
                    disabled={loading}
                  />
                </div>
              </CardContent>
              <CardFooter className="flex flex-col space-y-3 pb-6 px-6 pt-2">
                <Button type="submit" className="w-full h-10 flex items-center justify-center gap-2 text-base font-semibold bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/20 transition-all active:scale-[0.98]" disabled={loading}>
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    'Send Reset Token'
                  )}
                </Button>
                <Link to="/login" className="text-center text-sm text-secondary hover:text-foreground transition-colors">
                  Back to Login
                </Link>
              </CardFooter>
            </form>
          </Card>
        )}

        {/* Step 2: Reset Password */}
        {step === 'reset' && (
          <Card className="w-full glass shadow-2xl overflow-hidden relative">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary via-accent to-primary"></div>
            <CardHeader className="text-center space-y-1 pt-4 pb-2">
              <motion.div 
                initial={{ scale: 0 }} 
                animate={{ scale: 1 }} 
                transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
                className="w-12 h-12 mx-auto bg-primary/10 rounded-xl flex items-center justify-center border border-primary/20 shadow-[0_0_20px_rgba(var(--primary),0.3)] mb-1"
              >
                <Lock className="w-6 h-6 text-primary" />
              </motion.div>
              <CardTitle className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-accent">Create New Password</CardTitle>
              <CardDescription className="text-sm font-medium">Check your email for the reset token</CardDescription>
            </CardHeader>
            <form onSubmit={handleResetPassword}>
              <CardContent className="space-y-3 px-6 pb-2">
                {error && (
                  <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className="text-destructive text-sm font-semibold p-4 bg-destructive/10 rounded-xl border border-destructive/20 flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-destructive"></div>
                    {error}
                  </motion.div>
                )}
                {message && (
                  <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className="text-primary text-sm font-semibold p-4 bg-primary/10 rounded-xl border border-primary/20 flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-primary"></div>
                    {message}
                  </motion.div>
                )}
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-foreground tracking-wide">RESET TOKEN</label>
                  <Input
                    type="text"
                    value={token}
                    onChange={(e) => setToken(e.target.value)}
                    placeholder="6-digit token from email"
                    className="bg-background border-input focus-visible:ring-primary focus-visible:border-primary transition-all h-10"
                    disabled={loading}
                  />
                  <p className="text-xs text-secondary">Check your email for the reset token</p>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-foreground tracking-wide">NEW PASSWORD</label>
                  <Input
                    type={showPassword ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="At least 6 characters"
                    className="bg-background border-input focus-visible:ring-primary focus-visible:border-primary transition-all h-10"
                    disabled={loading}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-foreground tracking-wide">CONFIRM PASSWORD</label>
                  <Input
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Re-enter your password"
                    className="bg-background border-input focus-visible:ring-primary focus-visible:border-primary transition-all h-10"
                    disabled={loading}
                  />
                </div>
              </CardContent>
              <CardFooter className="flex flex-col space-y-3 pb-6 px-6 pt-2">
                <Button type="submit" className="w-full h-10 flex items-center justify-center gap-2 text-base font-semibold bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/20 transition-all active:scale-[0.98]" disabled={loading}>
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Resetting...
                    </>
                  ) : (
                    'Reset Password'
                  )}
                </Button>
                <button
                  type="button"
                  onClick={handleBackToEmail}
                  className="w-full h-10 flex items-center justify-center gap-2 text-base font-semibold text-secondary hover:text-foreground transition-colors border border-border rounded-lg hover:bg-secondary"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Back to Email
                </button>
              </CardFooter>
            </form>
          </Card>
        )}

        {/* Step 3: Success */}
        {step === 'success' && (
          <Card className="w-full glass shadow-2xl overflow-hidden relative">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-green-500 via-emerald-500 to-green-500"></div>
            <CardHeader className="text-center space-y-1 pt-4 pb-2">
              <motion.div 
                initial={{ scale: 0 }} 
                animate={{ scale: 1 }} 
                transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
                className="w-12 h-12 mx-auto bg-green-500/10 rounded-xl flex items-center justify-center border border-green-500/20 shadow-[0_0_20px_rgba(34,197,94,0.3)] mb-1"
              >
                <CheckCircle className="w-6 h-6 text-primary" />
              </motion.div>
              <CardTitle className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-green-500 to-emerald-500">Password Reset Successfully</CardTitle>
              <CardDescription className="text-sm font-medium">Redirecting to login...</CardDescription>
            </CardHeader>
            <CardContent className="px-6 pb-2">
              <p className="text-center text-secondary text-sm">Your password has been reset successfully. You will be redirected to the login page shortly.</p>
            </CardContent>
            <CardFooter className="flex flex-col pb-6 px-6 pt-2">
              <Link to="/login" className="text-center text-sm text-primary hover:text-accent transition-colors font-semibold underline underline-offset-2">
                Go to Login Now
              </Link>
            </CardFooter>
          </Card>
        )}
      </motion.div>
    </div>
  );
}
