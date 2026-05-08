import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
  BriefcaseIcon, PlusCircleIcon, UsersIcon, BuildingIcon,
  ArrowRightIcon, TrendingUpIcon, EyeIcon, EditIcon, TrashIcon,
} from 'lucide-react';
import { jobService } from '../../services/job.service';
import { organizationService } from '../../services/organization.service';
import { formatRelativeDate, getStatusBadgeClass, getErrorMessage } from '../../utils/helpers';
import { PageLoader, StatsSkeleton } from '../../components/Skeleton';
import useAuthStore from '../../store/authStore';
import toast from 'react-hot-toast';

const RecruiterDashboard = () => {
  const { user } = useAuthStore();
  const [jobs, setJobs] = useState([]);
  const [orgs, setOrgs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      try {
        const [jobsRes, orgsRes] = await Promise.allSettled([
          jobService.getOpenJobs(),
          organizationService.getMyOrganizations(),
        ]);
        if (jobsRes.status === 'fulfilled') {
          const allJobs = jobsRes.value.data.data || [];
          // filter jobs posted by this recruiter
          setJobs(allJobs.filter((j) => j.postedBy === user?._id || j.postedBy?.toString() === user?._id?.toString()));
        }
        if (orgsRes.status === 'fulfilled') setOrgs(orgsRes.value.data.data || []);
      } catch (err) {
        toast.error(getErrorMessage(err));
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [user]);

  const handleDeleteJob = async (id) => {
    if (!window.confirm('Delete this job? All applications will also be removed.')) return;
    try {
      await jobService.deleteJob(id);
      setJobs((prev) => prev.filter((j) => j._id !== id));
      toast.success('Job deleted');
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  const stats = [
    { label: 'Active Jobs', value: jobs.filter((j) => j.status === 'open').length, icon: BriefcaseIcon, color: 'text-green-600', bg: 'bg-green-50' },
    { label: 'Total Applications', value: jobs.reduce((acc, j) => acc + (j.applicationsCount || 0), 0), icon: UsersIcon, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'Organizations', value: orgs.length, icon: BuildingIcon, color: 'text-purple-600', bg: 'bg-purple-50' },
    { label: 'Total Views', value: orgs.reduce((acc, o) => acc + (o.views || 0), 0), icon: EyeIcon, color: 'text-amber-600', bg: 'bg-amber-50' },
  ];

  return (
    <div>
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
        <h1 className="section-title">Recruiter Dashboard</h1>
        <p className="text-gray-500 mt-1">Welcome back, {user?.fullName?.split(' ')[0]}</p>
      </motion.div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {loading
          ? Array.from({ length: 4 }).map((_, i) => <StatsSkeleton key={i} />)
          : stats.map((s, i) => (
              <motion.div
                key={s.label}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.08 }}
                className="card p-5"
              >
                <div className="flex items-start justify-between mb-3">
                  <p className="text-xs text-gray-500 font-medium">{s.label}</p>
                  <div className={`${s.bg} p-2 rounded-lg`}>
                    <s.icon className={`w-4 h-4 ${s.color}`} />
                  </div>
                </div>
                <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
              </motion.div>
            ))}
      </div>

      {/* Quick actions */}
      <div className="grid sm:grid-cols-3 gap-4 mb-8">
        {[
          { to: '/recruiter/post-job', icon: PlusCircleIcon, label: 'Post a New Job', desc: 'Create a job listing', color: 'bg-green-500' },
          { to: '/recruiter/organizations', icon: BuildingIcon, label: 'Manage Organizations', desc: 'View and edit companies', color: 'bg-blue-500' },
          { to: '/recruiter/applications', icon: UsersIcon, label: 'Review Applications', desc: 'Manage candidate pipeline', color: 'bg-purple-500' },
        ].map((action, i) => (
          <motion.div
            key={action.to}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 + i * 0.1 }}
          >
            <Link to={action.to} className="card p-5 flex items-center gap-4 group hover:border-green-300">
              <div className={`${action.color} p-3 rounded-xl group-hover:scale-105 transition-transform`}>
                <action.icon className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1">
                <p className="font-semibold text-sm text-gray-900">{action.label}</p>
                <p className="text-xs text-gray-500">{action.desc}</p>
              </div>
              <ArrowRightIcon className="w-4 h-4 text-gray-300 group-hover:text-green-500 group-hover:translate-x-0.5 transition-all" />
            </Link>
          </motion.div>
        ))}
      </div>

      {/* Posted Jobs */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-bold text-gray-900">Your Posted Jobs</h2>
          <Link to="/recruiter/post-job" className="btn-primary text-xs px-4 py-2">
            <PlusCircleIcon className="w-3.5 h-3.5" />
            Post Job
          </Link>
        </div>

        {loading ? (
          <div className="card divide-y divide-gray-50">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="p-4 flex gap-3">
                <div className="skeleton w-8 h-8 rounded-lg" />
                <div className="flex-1">
                  <div className="skeleton h-4 w-1/2 mb-1" />
                  <div className="skeleton h-3 w-1/3" />
                </div>
              </div>
            ))}
          </div>
        ) : jobs.length === 0 ? (
          <div className="card p-12 text-center">
            <BriefcaseIcon className="w-12 h-12 text-gray-200 mx-auto mb-3" />
            <p className="text-gray-500 mb-4">No jobs posted yet</p>
            <Link to="/recruiter/post-job" className="btn-primary inline-flex">
              <PlusCircleIcon className="w-4 h-4" />
              Post Your First Job
            </Link>
          </div>
        ) : (
          <div className="card divide-y divide-gray-50">
            {jobs.map((job) => (
              <div key={job._id} className="p-4 flex items-center gap-3 hover:bg-gray-50 transition-colors">
                <div className="w-9 h-9 bg-green-100 rounded-xl flex items-center justify-center shrink-0">
                  <BriefcaseIcon className="w-4 h-4 text-green-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm text-gray-900 truncate">{job.title}</p>
                  <p className="text-xs text-gray-500">
                    {job.applicationsCount || 0} applicants · {formatRelativeDate(job.createdAt)}
                  </p>
                </div>
                <span className={`${getStatusBadgeClass(job.status)} capitalize shrink-0`}>{job.status}</span>
                <div className="flex items-center gap-1">
                  <Link
                    to={`/recruiter/applications/${job._id}`}
                    className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    title="View applications"
                  >
                    <UsersIcon className="w-4 h-4" />
                  </Link>
                  <button
                    onClick={() => handleDeleteJob(job._id)}
                    className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    title="Delete job"
                  >
                    <TrashIcon className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default RecruiterDashboard;
