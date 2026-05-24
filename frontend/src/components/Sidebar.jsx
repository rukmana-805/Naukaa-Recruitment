import { NavLink, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  LayoutDashboardIcon, BriefcaseIcon, FileTextIcon,
  UserIcon, CreditCardIcon, BellIcon, BuildingIcon,
  PlusCircleIcon, UsersIcon, LogOutIcon, BookmarkIcon, SettingsIcon
} from 'lucide-react';
import useAuthStore from '../store/authStore';
import useNotificationStore from '../store/notificationStore';
import { getInitials } from '../utils/helpers';
import toast from 'react-hot-toast';

const userNavItems = [
  { to: '/dashboard', icon: LayoutDashboardIcon, label: 'Dashboard' },
  { to: '/jobs', icon: BriefcaseIcon, label: 'Browse Jobs' },
  { to: '/applications', icon: FileTextIcon, label: 'My Applications' },
  { to: '/saved-jobs', icon: BookmarkIcon, label: 'Saved Jobs' },
  { to: '/profile', icon: UserIcon, label: 'My Profile' },
  { to: '/notifications', icon: BellIcon, label: 'Notifications' },
  { to: '/settings', icon: SettingsIcon, label: 'Settings' },
];

const recruiterNavItems = [
  { to: '/recruiter', icon: LayoutDashboardIcon, label: 'Dashboard' },
  { to: '/recruiter/post-job', icon: PlusCircleIcon, label: 'Post a Job' },
  { to: '/recruiter/organizations', icon: BuildingIcon, label: 'My Organization' },
  { to: '/recruiter/applications', icon: UsersIcon, label: 'Applications' },
  { to: '/notifications', icon: BellIcon, label: 'Notifications' },
  { to: '/settings', icon: SettingsIcon, label: 'Settings' },
];

const adminNavItems = [
  { to: '/admin/dashboard', icon: LayoutDashboardIcon, label: 'Dashboard' },
  { to: '/admin/companies', icon: BuildingIcon, label: 'Companies' },
  { to: '/admin/job-seekers', icon: UsersIcon, label: 'Job Seekers' },
  { to: '/notifications', icon: BellIcon, label: 'Notifications' },
  { to: '/settings', icon: SettingsIcon, label: 'Settings' },
];

const Sidebar = ({ onClose }) => {
  const { user, logout } = useAuthStore();
  const { unreadCount } = useNotificationStore();
  const navigate = useNavigate();

  const getNavItems = () => {
    if (user?.role === 'admin') {
      return adminNavItems;
    }
    if (user?.role === 'recruiter' || user?.role === 'owner') {
      const items = [...recruiterNavItems];
      if (user?.role === 'owner') {
        items.splice(4, 0, { to: '/pricing', icon: CreditCardIcon, label: 'Upgrade Plan' });
      }
      return items;
    }
    return userNavItems;
  };

  const navItems = getNavItems();

  const handleLogout = async () => {
    await logout();
    toast.success('Logged out successfully');
    navigate('/');
    if (onClose) onClose();
  };

  return (
    <motion.aside
      initial={{ x: -20, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="w-64 h-full bg-white border-r border-gray-100 flex flex-col"
    >
      {/* Logo */}
      <div className="px-6 py-5 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center">
            <BriefcaseIcon className="w-4 h-4 text-white" />
          </div>
          <span className="text-xl font-bold text-gray-900">
            Naukaa<span className="text-green-500">.</span>
          </span>
        </div>
      </div>

      {/* User info */}
      <div className="px-4 py-4 border-b border-gray-50">
        <div className="flex items-center gap-3 p-3 rounded-xl bg-green-50">
          <div className="w-9 h-9 bg-green-100 rounded-xl flex items-center justify-center shrink-0">
            <span className="text-green-700 text-sm font-bold">
              {getInitials(user?.fullName)}
            </span>
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-gray-900 truncate">{user?.fullName}</p>
            <p className="text-xs text-green-600 font-medium capitalize">
              {user?.role === 'owner' ? 'Owner' : user?.role === 'recruiter' ? 'Recruiter' : user?.role === 'admin' ? 'Admin' : 'Job Seeker'}
            </p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to.split('/').length <= 2}
            className={({ isActive }) =>
              isActive ? 'sidebar-link-active' : 'sidebar-link'
            }
            onClick={() => onClose && onClose()}
          >
            <div className="relative">
              <Icon className="w-4.5 h-4.5" />
              {label === 'Notifications' && unreadCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-green-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </div>
            {label}
          </NavLink>
        ))}
      </nav>

      {/* Logout */}
      <div className="px-3 py-4 border-t border-gray-100">
        <button
          onClick={handleLogout}
          className="sidebar-link w-full text-red-500 hover:bg-red-50 hover:text-red-600"
        >
          <LogOutIcon className="w-4.5 h-4.5" />
          Sign out
        </button>
      </div>
    </motion.aside>
  );
};

export default Sidebar;
