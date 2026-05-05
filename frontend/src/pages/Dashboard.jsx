import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
  BriefcaseIcon, FileTextIcon, TrendingUpIcon, CreditCardIcon,
  ArrowRightIcon, CheckCircleIcon, ClockIcon, XCircleIcon,
} from 'lucide-react';
import useAuthStore from '../store/authStore';
import { applicationService } from '../services/application.service';
import { paymentService } from '../services/payment.service';
import { jobService } from '../services/job.service';
import { formatRelativeDate, getStatusBadgeClass } from '../utils/helpers';
import { StatsSkeleton, JobCardSkeleton } from '../components/Skeleton';
import JobCard from '../components/JobCard';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.08 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0 },
};

const Dashboard = () => {
  const { user } = useAuthStore();
  const [applications, setApplications] = useState([]);
  const [subscription, setSubscription] = useState(null);
  const [recommendedJobs, setRecommendedJobs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [appsRes, subRes, recRes] = await Promise.allSettled([
          applicationService.getMyApplications(),
          paymentService.getMySubscription(),
          jobService.getRecommendedJobs(),
        ]);

        if (appsRes.status === 'fulfilled') setApplications(appsRes.value.data.data || []);
        if (subRes.status === 'fulfilled') setSubscription(subRes.value.data);
        if (recRes.status === 'fulfilled') setRecommendedJobs(recRes.value.data.data || []);
      } catch (err) {
        // silent
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const stats = [
    {
      label: 'Total Applications',
      value: applications.length,
      icon: FileTextIcon,
      color: 'text-blue-600',
      bg: 'bg-blue-50',
      sub: `${applications.filter((a) => a.status === 'shortlisted').length} shortlisted`,
    },
    {
      label: 'Active Plan',
      value: user?.plan === 'paid' ? 'Pro ✨' : 'Free',
      icon: CreditCardIcon,
      color: 'text-green-600',
      bg: 'bg-green-50',
      sub: user?.plan === 'paid' ? 'Unlimited applies' : '5 applies/month',
    },
    {
      label: 'Interviews',
      value: applications.filter((a) => a.status === 'interview').length,
      icon: TrendingUpIcon,
      color: 'text-purple-600',
      bg: 'bg-purple-50',
      sub: `${applications.filter((a) => a.status === 'hired').length} hired`,
    },
    {
      label: 'Profile',
      value: user?.isProfileComplete ? 'Complete' : 'Incomplete',
      icon: BriefcaseIcon,
      color: user?.isProfileComplete ? 'text-green-600' : 'text-amber-600',
      bg: user?.isProfileComplete ? 'bg-green-50' : 'bg-amber-50',
      sub: user?.isProfileComplete ? 'Ready to apply' : 'Complete your profile',
    },
  ];

  const recentApplications = applications.slice(0, 5);

  return (
    <div>
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <h1 className="section-title">
          Good {new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 17 ? 'afternoon' : 'evening'},{' '}
          <span className="text-green-500">{user?.fullName?.split(' ')[0]}</span> 👋
        </h1>
        <p className="text-gray-500 mt-1">Here's your job search overview</p>
      </motion.div>

      {/* Stats */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8"
      >
        {loading
          ? Array.from({ length: 4 }).map((_, i) => <StatsSkeleton key={i} />)
          : stats.map((stat) => (
              <motion.div key={stat.label} variants={itemVariants} className="card p-5">
                <div className="flex items-start justify-between mb-3">
                  <p className="text-xs text-gray-500 font-medium">{stat.label}</p>
                  <div className={`${stat.bg} p-2 rounded-lg`}>
                    <stat.icon className={`w-4 h-4 ${stat.color}`} />
                  </div>
                </div>
                <p className={`text-2xl font-bold ${stat.color} mb-0.5`}>{stat.value}</p>
                <p className="text-xs text-gray-400">{stat.sub}</p>
              </motion.div>
            ))}
      </motion.div>

      <div className="grid lg:grid-cols-5 gap-6">
        {/* Recent Applications */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="lg:col-span-3"
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-gray-900">Recent Applications</h2>
            <Link to="/applications" className="text-xs font-semibold text-green-600 hover:text-green-700 flex items-center gap-1">
              View all <ArrowRightIcon className="w-3 h-3" />
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
          ) : recentApplications.length > 0 ? (
            <div className="card divide-y divide-gray-50">
              {recentApplications.map((app) => (
                <div key={app._id} className="p-4 flex items-center gap-3 hover:bg-gray-50 transition-colors">
                  <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <BriefcaseIcon className="w-4 h-4 text-green-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {app.jobSnapshot?.title || 'Job Application'}
                    </p>
                    <p className="text-xs text-gray-500 truncate">
                      {app.jobSnapshot?.companyName} · {formatRelativeDate(app.appliedAt)}
                    </p>
                  </div>
                  <span className={`${getStatusBadgeClass(app.status)} flex-shrink-0 capitalize`}>
                    {app.status}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="card p-10 text-center">
              <FileTextIcon className="w-10 h-10 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500 text-sm">No applications yet</p>
              <Link to="/jobs" className="btn-primary mt-4 inline-flex">
                Browse Jobs
              </Link>
            </div>
          )}
        </motion.div>

        {/* Right column */}
        <div className="lg:col-span-2 space-y-4">
          {/* Subscription card */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className={`card p-5 ${user?.plan === 'paid' ? 'border-green-300 border-2' : ''}`}
          >
            {user?.plan === 'paid' ? (
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="badge-green">Pro Plan ✨</span>
                </div>
                <p className="text-lg font-bold text-gray-900">You're on Pro!</p>
                <p className="text-xs text-gray-500 mt-1">
                  Unlimited applications, priority search ranking, and more.
                </p>
                {subscription?.endDate && (
                  <p className="text-xs text-green-600 mt-2 font-medium">
                    Renews {formatRelativeDate(subscription.endDate)}
                  </p>
                )}
              </div>
            ) : (
              <div>
                <p className="text-sm font-semibold text-gray-900 mb-1">Upgrade to Pro</p>
                <p className="text-xs text-gray-500 mb-4">
                  Unlock unlimited applications and AI-powered recommendations.
                </p>
                <Link to="/pricing" className="btn-primary w-full justify-center">
                  Upgrade — ₹999/mo
                </Link>
              </div>
            )}
          </motion.div>

          {/* Quick actions */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
            className="card p-5"
          >
            <p className="text-sm font-semibold text-gray-900 mb-3">Quick Actions</p>
            <div className="space-y-2">
              <Link to="/jobs" className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-green-50 text-sm text-gray-700 hover:text-green-700 transition-colors">
                <BriefcaseIcon className="w-4 h-4 text-green-500" />
                Browse open jobs
                <ArrowRightIcon className="w-3.5 h-3.5 ml-auto" />
              </Link>
              <Link to="/profile" className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-green-50 text-sm text-gray-700 hover:text-green-700 transition-colors">
                <CheckCircleIcon className="w-4 h-4 text-green-500" />
                Complete profile
                <ArrowRightIcon className="w-3.5 h-3.5 ml-auto" />
              </Link>
              <Link to="/applications" className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-green-50 text-sm text-gray-700 hover:text-green-700 transition-colors">
                <FileTextIcon className="w-4 h-4 text-green-500" />
                Track applications
                <ArrowRightIcon className="w-3.5 h-3.5 ml-auto" />
              </Link>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Recommended Jobs */}
      {recommendedJobs.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="mt-8"
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-gray-900">Recommended for You</h2>
            <Link to="/jobs" className="text-xs font-semibold text-green-600 hover:text-green-700 flex items-center gap-1">
              See all <ArrowRightIcon className="w-3 h-3" />
            </Link>
          </div>
          <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
            {recommendedJobs.slice(0, 3).map((job) => (
              <JobCard key={job._id} job={job} />
            ))}
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default Dashboard;
