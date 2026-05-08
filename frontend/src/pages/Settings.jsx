import { useState } from 'react';
import { motion } from 'framer-motion';
import { LockIcon, BellIcon } from 'lucide-react';
import { userService } from '../services/user.service';
import { getErrorMessage } from '../utils/helpers';
import toast from 'react-hot-toast';

const ChangePasswordForm = () => {
  const [passwords, setPasswords] = useState({ password: '', newPassword: '' });
  const [saving, setSaving] = useState(false);

  const save = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await userService.changePassword(passwords);
      setPasswords({ password: '', newPassword: '' });
      toast.success('Password changed successfully');
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={save} className="card p-6 space-y-5">
      <div className="flex items-center gap-3 border-b border-gray-100 pb-4 mb-4">
        <div className="p-2 bg-green-50 text-green-600 rounded-lg">
          <LockIcon className="w-5 h-5" />
        </div>
        <div>
          <h3 className="font-semibold text-gray-900">Change Password</h3>
          <p className="text-xs text-gray-500">Ensure your account is using a long, random password to stay secure.</p>
        </div>
      </div>

      <div className="grid sm:grid-cols-2 gap-5">
        <div>
          <label className="label">Current Password</label>
          <input
            type="password"
            required
            className="input"
            value={passwords.password}
            onChange={(e) => setPasswords((p) => ({ ...p, password: e.target.value }))}
          />
        </div>
        <div>
          <label className="label">New Password</label>
          <input
            type="password"
            required
            minLength={6}
            className="input"
            value={passwords.newPassword}
            onChange={(e) => setPasswords((p) => ({ ...p, newPassword: e.target.value }))}
          />
        </div>
      </div>
      
      <div className="flex justify-end mt-4">
        <button type="submit" disabled={saving} className="btn-primary">
          {saving ? 'Saving...' : 'Update Password'}
        </button>
      </div>
    </form>
  );
};

const Settings = () => {
  return (
    <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <h1 className="section-title">Settings</h1>
        <p className="text-gray-500 mt-1">Manage your account settings and preferences.</p>
      </motion.div>

      <div className="space-y-6">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <ChangePasswordForm />
        </motion.div>
        
        {/* Future settings like notifications can go here */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <div className="card p-6 opacity-60">
             <div className="flex items-center gap-3 border-b border-gray-100 pb-4 mb-4">
              <div className="p-2 bg-gray-100 text-gray-500 rounded-lg">
                <BellIcon className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Notification Preferences</h3>
                <p className="text-xs text-gray-500">Manage what alerts you want to receive.</p>
              </div>
            </div>
            <p className="text-sm text-gray-400 italic">Coming soon...</p>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Settings;
