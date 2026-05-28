import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
  BriefcaseIcon, PlusCircleIcon, UsersIcon, BuildingIcon,
  ArrowRightIcon, TrendingUpIcon, EyeIcon, EditIcon, TrashIcon, ClockIcon,
} from 'lucide-react';
import { jobService } from '../../services/job.service';
import { organizationService } from '../../services/organization.service';
import { formatRelativeDate, getStatusBadgeClass, getErrorMessage } from '../../utils/helpers';
import { PageLoader, StatsSkeleton } from '../../components/Skeleton';
import useAuthStore from '../../store/authStore';
import toast from 'react-hot-toast';
import { io } from 'socket.io-client';

const socket = io(
  import.meta.env.VITE_API_URL 
    ? import.meta.env.VITE_API_URL.replace('/api/v1', '').replace('/api', '') 
    : 'http://localhost:4000',
  { autoConnect: true }
);

const RecruiterDashboard = () => {
  const { user } = useAuthStore();
  const [jobs, setJobs] = useState([]);
  const [org, setOrg] = useState(null);
  const [loading, setLoading] = useState(true);
  const [onlineUsers, setOnlineUsers] = useState({});

  const isOwner = user?.role === 'owner';

  useEffect(() => {
    const fetch = async () => {
      try {
        const [jobsRes, orgsRes] = await Promise.allSettled([
          jobService.getMyJobs(),
          organizationService.getMyOrganizations(),
        ]);

        if (orgsRes.status === 'fulfilled') {
          const orgs = orgsRes.value.data.data || [];
          if (orgs.length > 0) {
            const orgData = orgs[0];
            setOrg(orgData);
          }
        }

        if (jobsRes.status === 'fulfilled') {
          setJobs(jobsRes.value.data.data || []);
        }
      } catch (err) {
        toast.error(getErrorMessage(err));
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [user, isOwner]);

  useEffect(() => {
    if (org?.members) {
      org.members.forEach(member => {
        if (member.user?._id) {
          socket.emit('get_user_status', member.user._id, (response) => {
            setOnlineUsers(prev => ({ ...prev, [member.user._id]: response.status === 'online' }));
          });
        }
      });
    }
  }, [org]);

  const onlineCount = org?.members?.filter(m => onlineUsers[m.user?._id]).length || 0;

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
    { 
      label: isOwner ? 'Total Org Jobs' : 'My Active Jobs', 
      value: jobs.length, 
      icon: BriefcaseIcon, 
      color: 'text-green-600', 
      bg: 'bg-green-50',
      sub: `${jobs.filter(j => j.status === 'open').length} currently open`
    },
    { 
      label: 'Total Applications', 
      value: jobs.reduce((acc, j) => acc + (j.applicationsCount || 0), 0), 
      icon: UsersIcon, 
      color: 'text-blue-600', 
      bg: 'bg-blue-50',
      sub: 'Across all active listings'
    },
    // Only show these for Owners
    ...(isOwner ? [
      { 
        label: org?.organizationType === 'COMPANY' ? 'Team Active' : 'Followers', 
        value: org?.organizationType === 'COMPANY' ? onlineCount : (org?.followers?.length || 0), 
        icon: org?.organizationType === 'COMPANY' ? TrendingUpIcon : UsersIcon, 
        color: 'text-purple-600', 
        bg: 'bg-purple-50',
        sub: org?.organizationType === 'COMPANY' 
          ? (isOwner ? `${onlineCount} team members online` : 'You are in the team')
          : 'People following your updates'
      },
      { 
        label: 'Org Reach', 
        value: org?.views || 0, 
        icon: EyeIcon, 
        color: 'text-amber-600', 
        bg: 'bg-amber-50',
        sub: `${org?.followers?.length || 0} followers`
      },
    ] : []),
  ];

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">
            {isOwner ? 'Organization Hub' : 'Recruiter Dashboard'}
          </h1>
          <div className="flex flex-wrap items-center gap-2 mt-1">
            <p className="text-gray-500 flex items-center gap-2">
              Welcome back, {user?.fullName} 
              {isOwner && <span className="badge-green text-[10px] py-0.5 px-2">Owner</span>}
            </p>
            {org && !isOwner && (
              <span className="flex items-center gap-1.5 px-2.5 py-1 bg-blue-50 text-blue-600 rounded-full text-[10px] font-bold border border-blue-100 uppercase tracking-wider">
                <BuildingIcon className="w-3 h-3" />
                Connected to {org.name}
              </span>
            )}
          </div>
        </motion.div>
        
        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="flex items-center gap-3">
           {org ? (
             <Link to="/recruiter/post-job" className="btn-primary shadow-lg shadow-green-100 px-6 py-2.5">
                <PlusCircleIcon className="w-5 h-5 mr-2" />
                Post New Job
             </Link>
           ) : (
             <button 
               onClick={() => toast.error('Please create an organization profile first')}
               className="btn-primary opacity-50 cursor-not-allowed shadow-none px-6 py-2.5"
             >
                <PlusCircleIcon className="w-5 h-5 mr-2" />
                Post New Job
             </button>
           )}
        </motion.div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {loading
          ? Array.from({ length: 4 }).map((_, i) => <StatsSkeleton key={i} />)
          : stats.map((s, i) => (
              <motion.div
                key={s.label}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className="card p-6 border-transparent hover:border-green-100 transition-all group"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className={`${s.bg} p-3 rounded-2xl group-hover:scale-110 transition-transform`}>
                    <s.icon className={`w-6 h-6 ${s.color}`} />
                  </div>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500 mb-1">{s.label}</p>
                  <p className={`text-3xl font-black ${s.color} tracking-tight`}>{s.value}</p>
                  <p className="text-[11px] text-gray-400 mt-2 flex items-center gap-1 font-medium">
                    <TrendingUpIcon className="w-3 h-3" />
                    {s.sub}
                  </p>
                </div>
              </motion.div>
            ))}
      </div>

      {/* Main Content Area */}
      <div className="grid lg:grid-cols-3 gap-8">
        {/* Left Column: Job Management */}
        <div className="lg:col-span-2 space-y-6">
           <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">Manage Postings</h2>
              <Link to="/recruiter/applications" className="text-sm font-bold text-green-600 hover:underline">
                View All Applications
              </Link>
           </div>

           {loading ? (
             <div className="space-y-4">
                {[1, 2, 3].map(i => <div key={i} className="skeleton h-24 rounded-2xl w-full" />)}
             </div>
           ) : jobs.length === 0 ? (
             <div className="card p-16 text-center border-dashed border-2">
                <BriefcaseIcon className="w-16 h-16 text-gray-200 mx-auto mb-4" />
                <h3 className="text-lg font-bold text-gray-800">No active listings</h3>
                <p className="text-gray-500 mb-6">Start attracting talent by posting your first job.</p>
                <Link to="/recruiter/post-job" className="btn-primary inline-flex">
                   Create Job Posting
                </Link>
             </div>
           ) : (
             <div className="space-y-4">
                {jobs.map((job) => (
                  <motion.div 
                    key={job._id}
                    layout
                    className="card p-4 flex items-center gap-4 hover:shadow-md transition-shadow group"
                  >
                    <div className="w-12 h-12 bg-green-50 rounded-2xl flex items-center justify-center shrink-0 border border-green-100">
                      <BriefcaseIcon className="w-6 h-6 text-green-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-gray-900 truncate group-hover:text-green-700 transition-colors">{job.title}</h3>
                      <p className="text-xs text-gray-500 flex flex-wrap items-center gap-x-2 gap-y-1 mt-1">
                         <span className="flex items-center gap-1">
                           <UsersIcon className="w-3.5 h-3.5" />
                           {job.applicationsCount || 0} Applications
                         </span>
                         <span className="text-gray-300">|</span>
                         <span className="flex items-center gap-1">
                           <ClockIcon className="w-3.5 h-3.5" />
                           Posted {formatRelativeDate(job.createdAt)}
                         </span>
                         {isOwner && job.postedBy && (
                           <>
                             <span className="text-gray-300">|</span>
                             <span className="px-2 py-0.5 bg-gray-100 text-gray-650 rounded-md text-[10px] font-bold">
                               Posted by: {job.postedBy._id === user?._id ? 'You' : (job.postedBy.fullName || 'Recruiter')}
                             </span>
                           </>
                         )}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                       <Link 
                         to={`/recruiter/applications/${job._id}`}
                         className="p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-xl transition-all"
                         title="View Candidates"
                       >
                         <UsersIcon className="w-5 h-5" />
                       </Link>
                       {(isOwner || job.postedBy === user?._id || job.postedBy?._id === user?._id) && (
                         <>
                           <Link 
                             to={`/recruiter/edit-job/${job._id}`}
                             className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all"
                             title="Edit Job"
                           >
                             <EditIcon className="w-5 h-5" />
                           </Link>
                           <button 
                             onClick={() => handleDeleteJob(job._id)}
                             className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all"
                             title="Delete Job"
                           >
                             <TrashIcon className="w-5 h-5" />
                           </button>
                         </>
                       )}
                    </div>
                  </motion.div>
                ))}
             </div>
           )}
        </div>

        {/* Right Column: Organization Snippet */}
        <div className="space-y-6">
           <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">Organization</h2>
              <Link to="/recruiter/organizations" className="text-sm font-bold text-green-600 hover:underline">
                Manage
              </Link>
           </div>
           
           {org ? (
             <div className="card p-6 overflow-hidden relative">
                <div className="absolute top-0 right-0 p-4">
                  <div className={`w-3 h-3 rounded-full ${org.isProfileCompleted ? 'bg-green-500' : 'bg-amber-500'} animate-pulse`} />
                </div>
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-16 h-16 bg-gray-50 rounded-2xl border border-gray-100 flex items-center justify-center overflow-hidden">
                    {org.logo?.url ? <img src={org.logo.url} className="w-full h-full object-cover" /> : <BuildingIcon className="w-8 h-8 text-gray-300" />}
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900">{org.name}</h3>
                    <p className="text-xs text-gray-500 capitalize">{org.organizationType?.toLowerCase()}</p>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Industry</span>
                    <span className="font-bold text-gray-900">{org.industry || 'Tech'}</span>
                  </div>
                  
                  {org.organizationType === 'COMPANY' ? (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Team Active</span>
                      <span className="font-bold text-green-600 flex items-center gap-1.5">
                         <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                         {onlineCount} Online
                      </span>
                    </div>
                  ) : (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Status</span>
                      <span className={`font-bold ${org.verificationStatus === 'VERIFIED' ? 'text-green-600' : 'text-amber-600'}`}>
                        {org.verificationStatus}
                      </span>
                    </div>
                  )}
                </div>

                <Link to="/recruiter/organizations" className="btn-secondary w-full justify-center mt-8">
                   {org.organizationType === 'COMPANY' ? 'Manage Team' : 'View Organization'}
                </Link>
             </div>
           ) : (
             <div className="card p-8 text-center border-dashed border-2">
                <p className="text-sm text-gray-500 mb-4">You haven't set up an organization profile yet.</p>
                <Link to="/recruiter/create-organization" className="btn-primary w-full justify-center">
                  Set Up Now
                </Link>
             </div>
           )}
        </div>
      </div>
    </div>
  );
};

export default RecruiterDashboard;
