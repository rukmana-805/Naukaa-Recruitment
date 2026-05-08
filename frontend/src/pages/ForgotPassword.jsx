import { useState } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { MailIcon, ArrowLeftIcon, CheckCircleIcon } from 'lucide-react';
import { userService } from '../services/user.service';
import { getErrorMessage } from '../utils/helpers';
import toast from 'react-hot-toast';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await userService.forgetPassword({ email });
      setSuccess(true);
      toast.success('Password reset link sent to your email');
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="card max-w-md w-full p-8"
      >
        <div className="text-center mb-8">
          <Link to="/" className="text-2xl font-bold text-green-600 tracking-tight inline-block mb-6">
            Naukaa.
          </Link>
          <h2 className="text-2xl font-bold text-gray-900">Forgot Password</h2>
          <p className="text-sm text-gray-500 mt-2">
            Enter your email address and we'll send you a link to reset your password.
          </p>
        </div>

        {success ? (
          <div className="text-center py-4">
            <CheckCircleIcon className="w-12 h-12 text-green-500 mx-auto mb-4" />
            <p className="text-gray-700 font-medium mb-6">Check your email for the reset link!</p>
            <Link to="/login" className="btn-secondary w-full justify-center">
              Back to Sign In
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="label">Email Address</label>
              <div className="relative">
                <MailIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="input pl-10"
                  placeholder="you@example.com"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full justify-center py-2.5"
            >
              {loading ? 'Sending link...' : 'Send Reset Link'}
            </button>

            <div className="text-center mt-6">
              <Link to="/login" className="text-sm text-gray-500 hover:text-green-600 inline-flex items-center gap-1.5 transition-colors">
                <ArrowLeftIcon className="w-4 h-4" /> Back to Sign In
              </Link>
            </div>
          </form>
        )}
      </motion.div>
    </div>
  );
};

export default ForgotPassword;
