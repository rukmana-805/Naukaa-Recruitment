import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  CreditCardIcon,
  BuildingIcon,
  BriefcaseIcon,
  UsersIcon,
  UserCheckIcon,
  ArrowRightIcon,
  ActivityIcon,
} from 'lucide-react';
import { adminService } from '../../services/admin.service';
import { PageLoader } from '../../components/Skeleton';
import toast from 'react-hot-toast';

const AdminDashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await adminService.getStats();
        setStats(res.data.data);
      } catch (err) {
        toast.error('Failed to load dashboard metrics');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (loading) return <PageLoader />;

  const formatCurrency = (val) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(val);
  };

  const statCards = [
    {
      title: 'Total Revenue',
      value: formatCurrency(stats?.totalRevenue || 0),
      subtitle: 'From paid subscriptions',
      icon: CreditCardIcon,
      color: 'from-emerald-500 to-teal-600',
      shadow: 'shadow-emerald-100',
    },
    {
      title: 'Registered Organizations',
      value: stats?.companiesCount?.total || 0,
      subtitle: `${stats?.companiesCount?.big || 0} Big Companies | ${stats?.companiesCount?.individual || 0} Individuals`,
      icon: BuildingIcon,
      color: 'from-blue-500 to-indigo-600',
      shadow: 'shadow-blue-100',
    },
    {
      title: 'Job Seekers',
      value: stats?.usersCount?.jobSeekers || 0,
      subtitle: 'Active candidates looking for jobs',
      icon: UsersIcon,
      color: 'from-purple-500 to-indigo-500',
      shadow: 'shadow-purple-100',
    },
    {
      title: 'Active Job Listings',
      value: stats?.totalJobs || 0,
      subtitle: 'Open recruitment pipelines',
      icon: BriefcaseIcon,
      color: 'from-amber-500 to-orange-600',
      shadow: 'shadow-amber-100',
    },
  ];

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <div className="flex items-center gap-2 mb-1">
            <span className="badge-green">System Admin</span>
            <span className="text-xs text-gray-400 font-bold uppercase tracking-wider">Command Center</span>
          </div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight">Naukaa Metrics & Overview</h1>
          <p className="text-gray-500 mt-1">Real-time health, financials, and verification pipeline audits.</p>
        </motion.div>

        <div className="flex gap-3">
          <button
            onClick={() => navigate('/admin/companies?verificationStatus=PENDING')}
            className="btn-primary shadow-lg shadow-green-100 flex items-center gap-2"
          >
            Review Pending Companies
            <ArrowRightIcon className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Grid of Stats */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((card, idx) => (
          <motion.div
            key={idx}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
            className={`card p-6 flex flex-col justify-between hover:shadow-xl transition-all relative overflow-hidden group border-none bg-gradient-to-br ${card.color} text-white ${card.shadow}`}
          >
            <div className="absolute -right-6 -bottom-6 opacity-10 group-hover:scale-110 transition-transform duration-300">
              <card.icon className="w-32 h-32 rotate-12" />
            </div>
            
            <div className="flex justify-between items-start mb-4">
              <span className="text-white/80 font-bold text-xs uppercase tracking-widest">{card.title}</span>
              <div className="p-2 bg-white/10 rounded-xl">
                <card.icon className="w-5 h-5 text-white" />
              </div>
            </div>

            <div className="space-y-1">
              <h3 className="text-3xl font-black tracking-tight">{card.value}</h3>
              <p className="text-xs text-white/70 font-medium">{card.subtitle}</p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Breakdown section */}
      <div className="grid md:grid-cols-2 gap-8">
        {/* Companies Type Distribution */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="card p-8 space-y-6"
        >
          <div className="flex items-center justify-between border-b pb-4">
            <h2 className="text-lg font-black text-gray-900 flex items-center gap-2">
              <BuildingIcon className="w-5 h-5 text-green-500" />
              Organization Split
            </h2>
            <span className="badge-gray">Total: {stats?.companiesCount?.total || 0}</span>
          </div>

          <div className="space-y-4">
            {/* Big Company bar */}
            <div>
              <div className="flex justify-between text-sm font-bold text-gray-700 mb-1.5">
                <span>Big Companies / Agencies</span>
                <span>
                  {stats?.companiesCount?.big || 0} (
                  {stats?.companiesCount?.total
                    ? Math.round((stats.companiesCount.big / stats.companiesCount.total) * 100)
                    : 0}
                  %)
                </span>
              </div>
              <div className="w-full bg-gray-100 h-3 rounded-full overflow-hidden">
                <div
                  className="bg-green-500 h-full rounded-full transition-all duration-1000"
                  style={{
                    width: `${
                      stats?.companiesCount?.total
                        ? (stats.companiesCount.big / stats.companiesCount.total) * 100
                        : 0
                    }%`,
                  }}
                />
              </div>
            </div>

            {/* Individual bar */}
            <div>
              <div className="flex justify-between text-sm font-bold text-gray-700 mb-1.5">
                <span>Individual Recruiters / Freelancers</span>
                <span>
                  {stats?.companiesCount?.individual || 0} (
                  {stats?.companiesCount?.total
                    ? Math.round((stats.companiesCount.individual / stats.companiesCount.total) * 100)
                    : 0}
                  %)
                </span>
              </div>
              <div className="w-full bg-gray-100 h-3 rounded-full overflow-hidden">
                <div
                  className="bg-blue-500 h-full rounded-full transition-all duration-1000"
                  style={{
                    width: `${
                      stats?.companiesCount?.total
                        ? (stats.companiesCount.individual / stats.companiesCount.total) * 100
                        : 0
                    }%`,
                  }}
                />
              </div>
            </div>
          </div>
        </motion.div>

        {/* User Roles Distribution */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="card p-8 space-y-6"
        >
          <div className="flex items-center justify-between border-b pb-4">
            <h2 className="text-lg font-black text-gray-900 flex items-center gap-2">
              <UsersIcon className="w-5 h-5 text-indigo-500" />
              User Roles Distribution
            </h2>
            <span className="badge-gray">Total: {stats?.usersCount?.total || 0}</span>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="bg-green-50/50 border border-green-100 rounded-2xl p-4 text-center">
              <p className="text-2xl font-black text-green-700">{stats?.usersCount?.jobSeekers || 0}</p>
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-wider mt-1">Candidates</p>
            </div>
            <div className="bg-blue-50/50 border border-blue-100 rounded-2xl p-4 text-center">
              <p className="text-2xl font-black text-blue-700">{stats?.usersCount?.recruiters || 0}</p>
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-wider mt-1">Recruiters</p>
            </div>
            <div className="bg-purple-50/50 border border-purple-100 rounded-2xl p-4 text-center">
              <p className="text-2xl font-black text-purple-700">{stats?.usersCount?.owners || 0}</p>
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-wider mt-1">Owners</p>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Quick shortcuts */}
      <div className="card p-8">
        <h3 className="text-md font-bold text-gray-900 mb-6 uppercase tracking-wider">Quick Admin Actions</h3>
        <div className="grid sm:grid-cols-3 gap-6">
          <div
            onClick={() => navigate('/admin/companies')}
            className="p-5 bg-gray-50 hover:bg-green-50/30 rounded-2xl border border-gray-100 hover:border-green-200 transition-all cursor-pointer group"
          >
            <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center mb-4 group-hover:scale-105 transition-transform">
              <BuildingIcon className="w-5 h-5 text-green-700" />
            </div>
            <h4 className="font-bold text-gray-900 mb-1">Audit Companies</h4>
            <p className="text-xs text-gray-500">Verify document uploads, plan status, and search recruiters.</p>
          </div>

          <div
            onClick={() => navigate('/admin/job-seekers')}
            className="p-5 bg-gray-50 hover:bg-indigo-50/30 rounded-2xl border border-gray-100 hover:border-indigo-200 transition-all cursor-pointer group"
          >
            <div className="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center mb-4 group-hover:scale-105 transition-transform">
              <UsersIcon className="w-5 h-5 text-indigo-700" />
            </div>
            <h4 className="font-bold text-gray-900 mb-1">Manage Seeker Accounts</h4>
            <p className="text-xs text-gray-500">Manage candidates profile registries and delete users.</p>
          </div>

          <div
            onClick={() => navigate('/notifications')}
            className="p-5 bg-gray-50 hover:bg-amber-50/30 rounded-2xl border border-gray-100 hover:border-amber-200 transition-all cursor-pointer group"
          >
            <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center mb-4 group-hover:scale-105 transition-transform">
              <ActivityIcon className="w-5 h-5 text-amber-700" />
            </div>
            <h4 className="font-bold text-gray-900 mb-1">Registration Logs</h4>
            <p className="text-xs text-gray-500">Check system activity log notifications and job posting warnings.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
