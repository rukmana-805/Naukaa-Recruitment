import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { getErrorMessage } from '../utils/helpers';
import api from '../services/api';
import useAuthStore from '../store/authStore';
import { LockIcon, UserIcon } from 'lucide-react';

const schema = z.object({
  fullName: z.string().min(2, 'Name must be at least 2 characters').max(60),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  confirmPassword: z.string(),
}).refine((d) => d.password === d.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

const AcceptInvite = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  const { setAuth } = useAuthStore();
  
  const [isValidating, setIsValidating] = useState(true);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(schema),
  });

  useEffect(() => {
    const validateToken = async () => {
      try {
        await api.get(`/invite/validate-invite/${token}`);
        setIsValidating(false);
      } catch (err) {
        setError(getErrorMessage(err));
        setIsValidating(false);
      }
    };

    validateToken();
  }, [token]);

  const onSubmit = async (data) => {
    setLoading(true);
    try {
      const res = await api.post(`/invite/accept-invite/${token}`, {
        fullName: data.fullName,
        password: data.password,
      });
      // the endpoint doesn't return accessToken but we can assume user needs to login or we log them in?
      // Wait, let's just show success and redirect to login
      toast.success('Invite accepted! Please log in with your email and password.');
      navigate('/login');
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  if (isValidating) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="w-8 h-8 border-4 border-green-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="card p-8 max-w-md w-full text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-2">Invalid Invite</h1>
          <p className="text-gray-600 mb-6">{error}</p>
          <button onClick={() => navigate('/')} className="btn-primary w-full justify-center">
            Go to Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="card p-8 max-w-md w-full">
        <div className="mb-6 text-center">
          <h1 className="text-2xl font-bold text-gray-900">Accept Invitation</h1>
          <p className="text-sm text-gray-500 mt-1">Set up your account to join the organization</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="label">Full Name</label>
            <div className="relative">
              <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                {...register('fullName')}
                type="text"
                placeholder="Enter your full name"
                className="input pl-10"
              />
            </div>
            {errors.fullName && <p className="mt-1 text-xs text-red-500">{errors.fullName.message}</p>}
          </div>

          <div>
            <label className="label">Password</label>
            <div className="relative">
              <LockIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                {...register('password')}
                type="password"
                placeholder="Min. 6 characters"
                className="input pl-10"
              />
            </div>
            {errors.password && <p className="mt-1 text-xs text-red-500">{errors.password.message}</p>}
          </div>

          <div>
            <label className="label">Confirm Password</label>
            <div className="relative">
              <LockIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                {...register('confirmPassword')}
                type="password"
                placeholder="Repeat password"
                className="input pl-10"
              />
            </div>
            {errors.confirmPassword && <p className="mt-1 text-xs text-red-500">{errors.confirmPassword.message}</p>}
          </div>

          <motion.button
            type="submit"
            disabled={loading}
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.98 }}
            className="btn-primary w-full justify-center py-3"
          >
            {loading ? 'Joining...' : 'Join Organization'}
          </motion.button>
        </form>
      </div>
    </div>
  );
};

export default AcceptInvite;
