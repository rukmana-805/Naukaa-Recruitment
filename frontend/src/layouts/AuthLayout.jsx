import { Outlet } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { BriefcaseIcon } from 'lucide-react';

const AuthLayout = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-emerald-50 flex flex-col items-center justify-center px-4 py-12">
      {/* Logo */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="mb-8"
      >
        <Link to="/" className="flex items-center gap-2">
          <div className="w-9 h-9 bg-green-500 rounded-xl flex items-center justify-center shadow-sm">
            <BriefcaseIcon className="w-5 h-5 text-white" />
          </div>
          <span className="text-2xl font-bold text-gray-900">
            Naukaa<span className="text-green-500">.</span>
          </span>
        </Link>
      </motion.div>

      {/* Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
        className="w-full max-w-md"
      >
        <Outlet />
      </motion.div>

      {/* Decorative elements */}
      <div className="fixed top-0 right-0 w-96 h-96 bg-green-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 pointer-events-none" />
      <div className="fixed bottom-0 left-0 w-80 h-80 bg-emerald-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 pointer-events-none" />
    </div>
  );
};

export default AuthLayout;
