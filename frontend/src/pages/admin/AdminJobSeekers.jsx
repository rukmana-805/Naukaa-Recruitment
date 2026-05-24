import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  UsersIcon,
  SearchIcon,
  TrashIcon,
  MailIcon,
  PhoneIcon,
  CalendarIcon,
  CheckCircleIcon,
  XCircleIcon
} from 'lucide-react';
import { adminService } from '../../services/admin.service';
import toast from 'react-hot-toast';

const AdminJobSeekers = () => {
  const [seekers, setSeekers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchSeekers = async () => {
    setLoading(true);
    try {
      const params = {};
      if (searchQuery) params.search = searchQuery;

      const res = await adminService.getJobSeekers(params);
      setSeekers(res.data.data || []);
    } catch (err) {
      toast.error('Failed to load candidate accounts');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSeekers();
  }, []);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchSeekers();
  };

  const handleDeleteUser = async (userId) => {
    if (!window.confirm('WARNING: Deleting this candidate will permanently delete their User Profile and ALL job applications they submitted. Are you sure you want to proceed?')) return;
    try {
      await adminService.deleteUser(userId);
      toast.success('Candidate user account and applications deleted');
      setSeekers(prev => prev.filter(s => s._id !== userId));
    } catch (err) {
      toast.error('Failed to delete candidate account');
      console.error(err);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-black text-gray-900 tracking-tight">Audit Job Seekers</h1>
        <p className="text-gray-500 mt-1">Audit active candidate user accounts, check completion metrics, and manage user data safety.</p>
      </div>

      {/* Search Bar */}
      <div className="card p-6">
        <form onSubmit={handleSearchSubmit} className="flex gap-2">
          <div className="relative flex-1">
            <SearchIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search candidate registry by name or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-gray-50 border-none rounded-xl pl-10 pr-4 py-3 text-sm focus:ring-2 focus:ring-green-500 outline-none transition-all"
            />
          </div>
          <button type="submit" className="btn-primary py-3">
            Search
          </button>
        </form>
      </div>

      {/* Listing Grid */}
      {loading ? (
        <div className="py-24 flex justify-center">
          <div className="w-10 h-10 border-4 border-green-600 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {seekers.map((seeker) => (
            <motion.div
              key={seeker._id}
              whileHover={{ y: -3 }}
              className="card p-6 flex flex-col justify-between hover:shadow-md transition-all border-transparent hover:border-green-100 group"
            >
              <div>
                <div className="flex justify-between items-start mb-4">
                  <div className="w-12 h-12 bg-green-50 rounded-2xl flex items-center justify-center font-black text-lg text-green-700">
                    {seeker.fullName?.charAt(0)}
                  </div>
                  
                  <span className={seeker.isProfileComplete ? 'badge-green' : 'badge-gray'}>
                    {seeker.isProfileComplete ? 'Profile Complete' : 'Incomplete Profile'}
                  </span>
                </div>

                <h3 className="font-bold text-gray-900 leading-tight mb-2 group-hover:text-green-600 transition-colors">
                  {seeker.fullName}
                </h3>
                
                <div className="space-y-2 text-xs text-gray-500 font-medium">
                  <p className="flex items-center gap-2 truncate">
                    <MailIcon className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                    {seeker.email}
                  </p>
                  <p className="flex items-center gap-2">
                    <PhoneIcon className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                    {seeker.phone || 'No phone number'}
                  </p>
                  <p className="flex items-center gap-2">
                    <CalendarIcon className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                    Joined {new Date(seeker.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>

              <div className="border-t border-gray-50 mt-6 pt-4 flex items-center justify-between">
                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                  PLAN: {seeker.plan?.toUpperCase() || 'FREE'}
                </span>
                <button
                  onClick={() => handleDeleteUser(seeker._id)}
                  className="p-2 text-red-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors border border-transparent hover:border-red-100 cursor-pointer"
                  title="Delete Candidate User"
                >
                  <TrashIcon className="w-4.5 h-4.5" />
                </button>
              </div>
            </motion.div>
          ))}

          {seekers.length === 0 && (
            <div className="col-span-full card p-16 text-center text-gray-400">
              <UsersIcon className="w-12 h-12 mx-auto text-gray-200 mb-3" />
              <p className="text-sm font-medium">No job seeker accounts found matching filters.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AdminJobSeekers;
