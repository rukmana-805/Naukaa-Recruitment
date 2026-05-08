import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { BookmarkIcon, BriefcaseIcon, BuildingIcon, MapPinIcon } from 'lucide-react';
import { Link } from 'react-router-dom';
import { userService } from '../services/user.service';
import { getErrorMessage, formatRelativeDate } from '../utils/helpers';
import { PageLoader } from '../components/Skeleton';
import toast from 'react-hot-toast';
import useAuthStore from '../store/authStore';

const SavedJobs = () => {
  const [savedJobs, setSavedJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const { updateUser } = useAuthStore();

  useEffect(() => {
    const fetchSaved = async () => {
      try {
        const res = await userService.getSavedJobs();
        setSavedJobs(res.data.data || []);
      } catch (err) {
        toast.error(getErrorMessage(err));
      } finally {
        setLoading(false);
      }
    };
    fetchSaved();
  }, []);

  const handleUnsave = async (jobId) => {
    try {
      await userService.unsaveJob(jobId);
      setSavedJobs((prev) => prev.filter((j) => j._id !== jobId));
      updateUser({ savedJobs: savedJobs.filter((j) => j._id !== jobId).map(j => j._id) });
      toast.success('Removed from saved jobs');
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  if (loading) return <PageLoader />;

  return (
    <div>
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
        <h1 className="section-title">Saved Jobs</h1>
        <p className="text-gray-500 mt-1">{savedJobs.length} jobs saved</p>
      </motion.div>

      {savedJobs.length === 0 ? (
        <div className="card p-16 text-center">
          <BookmarkIcon className="w-12 h-12 text-gray-200 mx-auto mb-3" />
          <p className="text-gray-500 mb-4">You haven't saved any jobs yet</p>
          <Link to="/jobs" className="btn-primary inline-flex">
            Browse Jobs
          </Link>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          {savedJobs.map((job, i) => (
            <motion.div
              key={job._id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="card p-5 group hover:border-green-300 transition-colors"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gray-50 rounded-xl overflow-hidden border border-gray-100 flex items-center justify-center">
                    {job.company?.logoUrl ? (
                      <img src={job.company.logoUrl} alt="Logo" className="w-full h-full object-cover" />
                    ) : (
                      <BriefcaseIcon className="w-6 h-6 text-gray-400" />
                    )}
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 line-clamp-1">{job.title}</h3>
                    <p className="text-sm text-gray-500">{job.company?.name}</p>
                  </div>
                </div>
                <button
                  onClick={() => handleUnsave(job._id)}
                  className="p-2 text-green-500 bg-green-50 rounded-lg hover:bg-green-100 transition-colors"
                  title="Remove from saved jobs"
                >
                  <BookmarkIcon className="w-5 h-5 fill-current" />
                </button>
              </div>

              <div className="flex flex-wrap gap-2 mb-4">
                <span className="badge-gray flex items-center gap-1">
                  <MapPinIcon className="w-3 h-3" />
                  {job.location}
                </span>
                <span className="badge-gray flex items-center gap-1">
                  <BuildingIcon className="w-3 h-3" />
                  {job.workMode}
                </span>
                {job.salaryRange && (
                  <span className="badge-green">
                    ₹{job.salaryRange.min/100000}L - ₹{job.salaryRange.max/100000}L
                  </span>
                )}
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                <span className="text-xs text-gray-400">{formatRelativeDate(job.createdAt)}</span>
                <Link to={`/jobs/${job._id}`} className="text-sm font-medium text-green-600 hover:text-green-700">
                  View Details →
                </Link>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
};

export default SavedJobs;
