import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { useNavigate, Link } from 'react-router-dom';
import { 
  UsersIcon, UserPlusIcon, TrashIcon, EyeIcon, 
  BriefcaseIcon, MailIcon, ClockIcon, ArrowRightIcon, 
  AlertCircleIcon, XIcon, ShieldIcon, ActivityIcon, EditIcon
} from 'lucide-react';
import api from '../../services/api';
import { jobService } from '../../services/job.service';
import { organizationService } from '../../services/organization.service';
import { getErrorMessage, formatRelativeDate } from '../../utils/helpers';
import { PageLoader } from '../../components/Skeleton';
import toast from 'react-hot-toast';
import { io } from 'socket.io-client';

const socket = io(
  import.meta.env.VITE_API_URL 
    ? import.meta.env.VITE_API_URL.replace('/api/v1', '').replace('/api', '') 
    : 'http://localhost:4000',
  { autoConnect: true }
);

const ManageRecruiters = () => {
  const [org, setOrg] = useState(null);
  const [loading, setLoading] = useState(true);
  const [inviting, setInviting] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState({});
  const [selectedRecruiter, setSelectedRecruiter] = useState(null); // recruiter user object
  const [recruiterJobs, setRecruiterJobs] = useState([]);
  const [jobsLoading, setJobsLoading] = useState(false);

  const { register, handleSubmit, reset } = useForm();
  const navigate = useNavigate();

  const fetchOrg = async () => {
    try {
      const res = await organizationService.getMyOrganizations();
      const orgs = res.data.data || [];
      if (orgs.length > 0) {
        setOrg(orgs[0]);
      }
    } catch (err) {
      toast.error('Failed to load organization');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrg();

    socket.on('user_status_change', ({ userId, status }) => {
      setOnlineUsers(prev => ({ ...prev, [userId]: status === 'online' }));
    });

    return () => {
      socket.off('user_status_change');
    };
  }, []);

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

  const selectRecruiter = async (recruiter) => {
    setSelectedRecruiter(recruiter);
    setJobsLoading(true);
    try {
      const res = await api.get(`/organizations/${org._id}/member/${recruiter._id}/activity`);
      setRecruiterJobs(res.data.data || []);
    } catch (err) {
      toast.error(getErrorMessage(err));
      setRecruiterJobs([]);
    } finally {
      setJobsLoading(false);
    }
  };

  const onInvite = async (data) => {
    setInviting(true);
    try {
      await api.post(`/invite/invite-recruiter/${org._id}`, data);
      toast.success('Invitation successfully sent!');
      reset();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setInviting(false);
    }
  };

  const deleteRecruiterAccount = async (memberId) => {
    if (!window.confirm('WARNING: This will permanently delete the recruiter user account and all jobs they posted. This action is irreversible. Are you sure you want to delete this recruiter account?')) return;
    try {
      await api.delete(`/organizations/${org._id}/recruiters/${memberId}`);
      toast.success('Recruiter account and their jobs deleted successfully');
      if (selectedRecruiter?._id === memberId) {
        setSelectedRecruiter(null);
        setRecruiterJobs([]);
      }
      fetchOrg();
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  const handleDeleteJob = async (jobId) => {
    if (!window.confirm('Are you sure you want to delete this job post? All applications will also be removed.')) return;
    try {
      await jobService.deleteJob(jobId);
      setRecruiterJobs(prev => prev.filter(j => j._id !== jobId));
      // Refresh organization to get updated job counts
      fetchOrg();
      toast.success('Job deleted successfully');
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  if (loading) return <PageLoader />;

  if (!org) {
    return (
      <div className="card p-16 text-center max-w-lg mx-auto mt-10 border-dashed border-2">
        <div className="w-20 h-20 bg-green-50 rounded-3xl flex items-center justify-center mx-auto mb-6">
          <ShieldIcon className="w-10 h-10 text-green-600" />
        </div>
        <h2 className="text-3xl font-black text-gray-900 mb-2 tracking-tight">No Organization Found</h2>
        <p className="text-gray-500 mb-8 leading-relaxed">
          Please register your company profile first to manage team members.
        </p>
        <button onClick={() => navigate('/recruiter/create-organization')} className="btn-primary inline-flex justify-center w-full py-4 shadow-xl shadow-green-100">
          Create Organization Profile
        </button>
      </div>
    );
  }

  // Filter only recruiters (excluding owner)
  const recruiters = org.members?.filter(m => m.role === 'recruiter') || [];

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center gap-2 mb-1">
          <ShieldIcon className="w-4 h-4 text-green-600" />
          <span className="text-xs text-gray-400 font-bold uppercase tracking-widest">Administrative Control</span>
        </div>
        <h1 className="text-3xl font-black text-gray-900 tracking-tight leading-none">Recruiter Directory</h1>
        <p className="text-gray-500 mt-2 text-sm font-medium">Manage recruiter credentials, audit their listings, and recruit new team members.</p>
      </motion.div>

      <div className="grid lg:grid-cols-5 gap-8">
        {/* Left Side: Directory & Invites */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Recruiters List Card */}
          <div className="card p-6 space-y-6 bg-white border border-gray-150">
            <div className="flex items-center justify-between border-b pb-3 border-gray-100">
              <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <UsersIcon className="w-5 h-5 text-green-500" />
                Active Recruiters
              </h2>
              <span className="badge-gray text-xs">{recruiters.length} Recruiters</span>
            </div>

            <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
              {recruiters.length === 0 ? (
                <div className="text-center py-10 text-gray-400 italic">
                  <p className="text-sm">No recruiters added yet</p>
                  <p className="text-xs mt-1 text-gray-400">Invite recruiters below to start hiring together.</p>
                </div>
              ) : (
                recruiters.map((member, idx) => {
                  const isOnline = onlineUsers[member.user?._id];
                  const isSelected = selectedRecruiter?._id === member.user?._id;
                  return (
                    <motion.div 
                      key={idx}
                      whileHover={{ scale: 1.01 }}
                      onClick={() => selectRecruiter(member.user)}
                      className={`p-4 rounded-2xl flex items-center gap-3.5 border transition-all cursor-pointer relative group ${
                        isSelected 
                          ? 'border-green-400 bg-green-50/50 shadow-xs' 
                          : 'border-gray-100 bg-white hover:border-gray-200'
                      }`}
                    >
                      {/* Avatar & Online status */}
                      <div className="relative shrink-0">
                        <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center font-black text-lg text-green-700 shadow-sm">
                          {member.user?.fullName?.charAt(0)}
                        </div>
                        <div className={`absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full border-2 border-white shadow-xs ${
                          isOnline ? 'bg-green-500 animate-pulse' : 'bg-gray-300'
                        }`} />
                      </div>

                      {/* Recruiter Details */}
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-gray-900 text-sm truncate">{member.user?.fullName}</p>
                        <p className="text-xs text-gray-500 truncate mt-0.5">{member.user?.email}</p>
                        <p className="text-[11px] text-gray-500 mt-1 font-semibold flex items-center gap-1">
                          <BriefcaseIcon className="w-3.5 h-3.5 text-gray-400" />
                          Jobs Posted: <span className="font-bold text-green-600">{member.jobsCount || 0}</span>
                        </p>
                      </div>

                      {/* Delete Recruiter Button (Always visible on mobile, group-hover on desktop) */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteRecruiterAccount(member.user?._id);
                        }}
                        className="p-2 bg-white text-red-500 hover:text-red-700 hover:bg-red-50 border border-gray-100 hover:border-red-200 rounded-xl shadow-xs shrink-0 md:opacity-0 md:group-hover:opacity-100 transition-opacity"
                        title="Delete Recruiter Account"
                      >
                        <TrashIcon className="w-4 h-4" />
                      </button>
                    </motion.div>
                  );
                })
              )}
            </div>
          </div>

          {/* Invite Section Card */}
          <div className="card p-6 bg-black text-white relative overflow-hidden">
            <div className="absolute -top-12 -right-12 w-32 h-32 bg-green-500/10 rounded-full blur-3xl" />
            <div className="relative space-y-4">
              <h3 className="text-lg font-bold flex items-center gap-2">
                <UserPlusIcon className="w-5 h-5 text-green-500" />
                Invite Recruiters
              </h3>
              <p className="text-gray-400 text-xs leading-relaxed">
                Add recruiters by sending them an invitation link. They can set up profiles and start posting jobs.
              </p>

              {org.verificationStatus !== 'VERIFIED' ? (
                <div className="p-4 bg-white/5 border border-white/10 rounded-xl text-center">
                  <AlertCircleIcon className="w-6 h-6 text-amber-500 mx-auto mb-2" />
                  <p className="text-xs text-amber-400 font-semibold">Verification Pending</p>
                  <p className="text-[10px] text-gray-400 mt-1">You can invite recruiters once your company is verified.</p>
                </div>
              ) : (
                <form onSubmit={handleSubmit(onInvite)} className="flex gap-2">
                  <input 
                    {...register('email', { required: true })} 
                    type="email" 
                    required
                    className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs focus:border-green-500 outline-none transition-all placeholder:text-gray-500 text-white" 
                    placeholder="recruiter@email.com" 
                  />
                  <button type="submit" disabled={inviting} className="btn-primary py-2 px-4 text-xs font-bold shrink-0 shadow-lg shadow-green-900/10">
                    {inviting ? 'Inviting...' : 'Invite'}
                  </button>
                </form>
              )}
            </div>
          </div>

        </div>

        {/* Right Side: Jobs Audit Panel */}
        <div className="lg:col-span-3">
          <AnimatePresence mode="wait">
            {selectedRecruiter ? (
              <motion.div 
                key={selectedRecruiter._id}
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                className="card p-6 bg-white border border-gray-150 space-y-6 min-h-[500px]"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-4 border-gray-100">
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                      <ActivityIcon className="w-5 h-5 text-green-500" />
                      {selectedRecruiter.fullName}'s Postings
                    </h3>
                    <p className="text-xs text-gray-500 mt-1">{selectedRecruiter.email}</p>
                  </div>
                  <span className="badge-green text-xs font-bold">
                    {recruiterJobs.length} {recruiterJobs.length === 1 ? 'Job' : 'Jobs'} Posted
                  </span>
                </div>

                {jobsLoading ? (
                  <div className="py-24 flex justify-center items-center">
                    <div className="w-8 h-8 border-4 border-green-150 border-t-green-500 rounded-full animate-spin" />
                  </div>
                ) : recruiterJobs.length === 0 ? (
                  <div className="text-center py-24 text-gray-400 italic">
                    <BriefcaseIcon className="w-12 h-12 text-gray-200 mx-auto mb-3" />
                    <p className="text-sm font-semibold">No active job listings</p>
                    <p className="text-xs mt-1 text-gray-400">This recruiter hasn't posted any jobs under your organization yet.</p>
                  </div>
                ) : (
                  <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                    {recruiterJobs.map((job) => (
                      <div 
                        key={job._id}
                        className="p-4 bg-gray-50/50 hover:bg-gray-50 border border-gray-100 hover:border-gray-200 rounded-2xl flex items-center justify-between gap-4 transition-all group/job"
                      >
                        <div className="min-w-0">
                          <h4 className="font-bold text-gray-900 text-sm truncate group-hover/job:text-green-600 transition-colors">
                            {job.title}
                          </h4>
                          <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-xs text-gray-500 mt-1.5 font-medium">
                            <span className="flex items-center gap-1.5">
                              <UsersIcon className="w-3.5 h-3.5 text-gray-400" />
                              {job.applicationsCount || 0} Candidates
                            </span>
                            <span className="text-gray-300">•</span>
                            <span className="flex items-center gap-1.5">
                              <ClockIcon className="w-3.5 h-3.5 text-gray-400" />
                              Posted {formatRelativeDate(job.createdAt)}
                            </span>
                          </div>
                        </div>

                        {/* Action buttons */}
                        <div className="flex items-center gap-1.5 shrink-0">
                          <Link 
                            to={`/recruiter/edit-job/${job._id}`}
                            className="p-2 bg-white text-blue-500 hover:text-blue-700 hover:bg-blue-50 border border-gray-100 hover:border-blue-200 rounded-xl shadow-xs transition-all"
                            title="Edit Job Post"
                          >
                            <EditIcon className="w-4 h-4" />
                          </Link>
                          <button 
                            onClick={() => handleDeleteJob(job._id)}
                            className="p-2 bg-white text-red-500 hover:text-red-700 hover:bg-red-50 border border-gray-100 hover:border-red-200 rounded-xl shadow-xs transition-all"
                            title="Delete Job Post"
                          >
                            <TrashIcon className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </motion.div>
            ) : (
              <div className="card p-16 text-center border-dashed border-2 flex flex-col items-center justify-center text-center h-full min-h-[500px] bg-white border-gray-200">
                <UsersIcon className="w-16 h-16 text-gray-200 mb-4" />
                <h3 className="text-base font-bold text-gray-800 tracking-tight">Select Recruiter</h3>
                <p className="text-xs text-gray-500 mt-1.5 max-w-xs leading-relaxed">
                  Click on any recruiter from the directory list on the left to audit their active listings, applicant counts, and postings.
                </p>
              </div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

export default ManageRecruiters;
