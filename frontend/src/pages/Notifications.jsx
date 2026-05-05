import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { BellIcon, CheckIcon, CheckCheckIcon } from 'lucide-react';
import { notificationService } from '../services/notification.service';
import useNotificationStore from '../store/notificationStore';
import { formatRelativeDate, getErrorMessage } from '../utils/helpers';
import { PageLoader } from '../components/Skeleton';
import toast from 'react-hot-toast';

const notifTypeColors = {
  JOB_UPDATE: 'bg-blue-100 text-blue-600',
  PAYMENT: 'bg-green-100 text-green-600',
  SYSTEM: 'bg-gray-100 text-gray-600',
};

const Notifications = () => {
  const { notifications, setNotifications, markAsRead, markAllAsRead } = useNotificationStore();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      try {
        const res = await notificationService.getMyNotifications();
        setNotifications(res.data || []);
      } catch (err) {
        toast.error(getErrorMessage(err));
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [setNotifications]);

  const handleMarkAsRead = async (id) => {
    try {
      await notificationService.markAsRead(id);
      markAsRead(id);
    } catch (_) {}
  };

  const handleMarkAllAsRead = async () => {
    try {
      await notificationService.markAllAsRead();
      markAllAsRead();
      toast.success('All notifications marked as read');
    } catch (_) {}
  };

  if (loading) return <PageLoader />;

  const unread = notifications.filter((n) => !n.isRead).length;

  return (
    <div className="max-w-2xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between mb-6"
      >
        <div>
          <h1 className="section-title">Notifications</h1>
          {unread > 0 && (
            <p className="text-sm text-gray-500 mt-0.5">{unread} unread</p>
          )}
        </div>
        {unread > 0 && (
          <button onClick={handleMarkAllAsRead} className="btn-ghost text-xs flex items-center gap-1.5">
            <CheckCheckIcon className="w-4 h-4" />
            Mark all read
          </button>
        )}
      </motion.div>

      {notifications.length === 0 ? (
        <div className="card p-16 text-center">
          <BellIcon className="w-12 h-12 text-gray-200 mx-auto mb-3" />
          <p className="text-gray-500">No notifications yet</p>
          <p className="text-xs text-gray-400 mt-1">We'll notify you about job updates and more</p>
        </div>
      ) : (
        <div className="space-y-2">
          {notifications.map((n, i) => (
            <motion.div
              key={n._id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
              className={`card p-4 flex items-start gap-3 cursor-pointer transition-all ${
                !n.isRead ? 'border-l-4 border-l-green-400' : ''
              }`}
              onClick={() => !n.isRead && handleMarkAsRead(n._id)}
            >
              <div className={`p-2 rounded-lg flex-shrink-0 ${notifTypeColors[n.type] || notifTypeColors.SYSTEM}`}>
                <BellIcon className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <p className={`text-sm font-medium ${!n.isRead ? 'text-gray-900' : 'text-gray-600'}`}>
                    {n.title}
                  </p>
                  {!n.isRead && (
                    <span className="w-2 h-2 bg-green-500 rounded-full flex-shrink-0 mt-1.5" />
                  )}
                </div>
                <p className="text-xs text-gray-500 mt-0.5">{n.message}</p>
                <p className="text-xs text-gray-400 mt-1">{formatRelativeDate(n.createdAt)}</p>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Notifications;
