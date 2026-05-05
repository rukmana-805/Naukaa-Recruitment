import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { EyeIcon, EyeOffIcon, MailIcon, LockIcon, UserIcon } from 'lucide-react';
import { useState } from 'react';
import toast from 'react-hot-toast';
import { authService } from '../services/auth.service';
import useAuthStore from '../store/authStore';
import { getErrorMessage } from '../utils/helpers';

const schema = z.object({
  fullName: z.string().min(2, 'Name must be at least 2 characters').max(60),
  email: z.string().email('Enter a valid email'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  confirmPassword: z.string(),
  role: z.enum(['user', 'recruiter']),
}).refine((d) => d.password === d.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

const Register = () => {
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);
  const { setAuth } = useAuthStore();
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: { role: 'user' },
  });

  const onSubmit = async (data) => {
    setLoading(true);
    const { confirmPassword, ...payload } = data;
    try {
      const res = await authService.register(payload);
      const { user, accessToken } = res.data.data;
      setAuth(user, accessToken);
      toast.success('Account created! Welcome to Naukaa 🎉');
      navigate(user.role === 'recruiter' ? '/recruiter' : '/dashboard', { replace: true });
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const selectedRole = watch('role');

  return (
    <div className="card p-8">
      <div className="mb-6 text-center">
        <h1 className="text-2xl font-bold text-gray-900">Create your account</h1>
        <p className="text-sm text-gray-500 mt-1">Join 2 million+ professionals on Naukaa</p>
      </div>

      {/* Role toggle */}
      <div className="flex gap-2 p-1 bg-gray-100 rounded-xl mb-6">
        {[
          { value: 'user', label: '🧑 Job Seeker' },
          { value: 'recruiter', label: '🏢 Recruiter' },
        ].map(({ value, label }) => (
          <label
            key={value}
            className={`flex-1 text-center py-2 rounded-lg text-sm font-medium cursor-pointer transition-all ${
              selectedRole === value
                ? 'bg-white text-green-700 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <input type="radio" value={value} {...register('role')} className="sr-only" />
            {label}
          </label>
        ))}
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* Full Name */}
        <div>
          <label className="label">Full name</label>
          <div className="relative">
            <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              {...register('fullName')}
              type="text"
              placeholder="Rahul Verma"
              className="input pl-10"
              autoComplete="name"
            />
          </div>
          {errors.fullName && (
            <p className="mt-1 text-xs text-red-500">{errors.fullName.message}</p>
          )}
        </div>

        {/* Email */}
        <div>
          <label className="label">Email address</label>
          <div className="relative">
            <MailIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              {...register('email')}
              type="email"
              placeholder="you@example.com"
              className="input pl-10"
              autoComplete="email"
            />
          </div>
          {errors.email && (
            <p className="mt-1 text-xs text-red-500">{errors.email.message}</p>
          )}
        </div>

        {/* Password */}
        <div>
          <label className="label">Password</label>
          <div className="relative">
            <LockIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              {...register('password')}
              type={showPwd ? 'text' : 'password'}
              placeholder="Min. 6 characters"
              className="input pl-10 pr-10"
              autoComplete="new-password"
            />
            <button
              type="button"
              onClick={() => setShowPwd(!showPwd)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              {showPwd ? <EyeOffIcon className="w-4 h-4" /> : <EyeIcon className="w-4 h-4" />}
            </button>
          </div>
          {errors.password && (
            <p className="mt-1 text-xs text-red-500">{errors.password.message}</p>
          )}
        </div>

        {/* Confirm Password */}
        <div>
          <label className="label">Confirm password</label>
          <div className="relative">
            <LockIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              {...register('confirmPassword')}
              type={showPwd ? 'text' : 'password'}
              placeholder="Repeat password"
              className="input pl-10"
              autoComplete="new-password"
            />
          </div>
          {errors.confirmPassword && (
            <p className="mt-1 text-xs text-red-500">{errors.confirmPassword.message}</p>
          )}
        </div>

        <motion.button
          type="submit"
          disabled={loading}
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.98 }}
          className="btn-primary w-full justify-center py-3"
        >
          {loading ? (
            <span className="flex items-center gap-2">
              <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Creating account...
            </span>
          ) : (
            'Create account'
          )}
        </motion.button>
      </form>

      <p className="mt-4 text-center text-xs text-gray-400">
        By registering, you agree to our{' '}
        <a href="#" className="text-green-600">Terms</a> &{' '}
        <a href="#" className="text-green-600">Privacy Policy</a>
      </p>

      <p className="mt-4 text-center text-sm text-gray-500">
        Already have an account?{' '}
        <Link to="/login" className="font-semibold text-green-600 hover:text-green-700">
          Sign in
        </Link>
      </p>
    </div>
  );
};

export default Register;
