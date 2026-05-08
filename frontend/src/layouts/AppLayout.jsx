import { useState } from 'react';
import { Outlet, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { MenuIcon, XIcon, BookmarkIcon } from 'lucide-react';
import Sidebar from '../components/Sidebar';

const pageVariants = {
  initial: { opacity: 0, x: 8 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -8 },
};

const AppLayout = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <div className="flex bg-gray-50 h-screen overflow-hidden">
      {/* Desktop Sidebar */}
      <div className="hidden md:flex h-screen sticky top-0 z-20">
        <Sidebar />
      </div>

      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMobileMenuOpen(false)}
              className="fixed inset-0 bg-black/50 z-40 md:hidden"
            />
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', bounce: 0, duration: 0.3 }}
              className="fixed inset-y-0 left-0 w-64 z-50 md:hidden shadow-xl flex"
            >
              <Sidebar onClose={() => setIsMobileMenuOpen(false)} />
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Main content wrapper */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        
        {/* Mobile Header */}
        <header className="md:hidden flex items-center justify-between p-4 bg-white border-b border-gray-100 z-10 shrink-0">
          <button onClick={() => setIsMobileMenuOpen(true)} className="p-2 -ml-2 text-gray-600 hover:text-gray-900 rounded-lg hover:bg-gray-50">
            <MenuIcon className="w-6 h-6" />
          </button>
          
          <span className="text-lg font-bold text-gray-900">
            Naukaa<span className="text-green-500">.</span>
          </span>

          <Link to="/saved-jobs" className="p-2 -mr-2 text-gray-600 hover:text-green-600 rounded-lg hover:bg-gray-50">
            <BookmarkIcon className="w-5 h-5" />
          </Link>
        </header>

        {/* Page Content */}
        <div className="flex-1 overflow-auto mb-12">
          <motion.main
            variants={pageVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={{ duration: 0.25 }}
            className="page-container h-full"
          >
            <Outlet />
          </motion.main>
        </div>
      </div>
    </div>
  );
};

export default AppLayout;
