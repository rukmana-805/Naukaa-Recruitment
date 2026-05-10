import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { PlusCircleIcon, BuildingIcon, TrashIcon, UsersIcon, UserPlusIcon, MailIcon, LinkIcon, EyeIcon, XIcon, ArrowRightIcon } from 'lucide-react';
import { organizationService } from '../../services/organization.service';
import api from '../../services/api';
import { getErrorMessage, formatRelativeDate } from '../../utils/helpers';
import { PageLoader } from '../../components/Skeleton';
import toast from 'react-hot-toast';
import { io } from 'socket.io-client';
import useAuthStore from '../../store/authStore';

const socket = io(
  import.meta.env.VITE_API_URL 
    ? import.meta.env.VITE_API_URL.replace('/api/v1', '').replace('/api', '') 
    : 'http://localhost:4000',
  { autoConnect: true }
);

const Organizations = () => {
  const { user: currentUser } = useAuthStore();
  const [org, setOrg] = useState(null);
  const [loading, setLoading] = useState(true);
  const [inviting, setInviting] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState({});
  const [activity, setActivity] = useState(null); // { memberId, data: [], loading: false }
  const navigate = useNavigate();

  const { register, handleSubmit, reset, setValue } = useForm();
  const { register: registerEdit, handleSubmit: handleEditSubmit } = useForm();

  useEffect(() => {
    const fetchOrg = async () => {
      try {
        const res = await organizationService.getMyOrganizations();
        const orgs = res.data.data || [];
        if (orgs.length > 0) {
          setOrg(orgs[0]);
          // Prefill edit form
          setValue('name', orgs[0].name);
          setValue('email', orgs[0].email);
          setValue('phone', orgs[0].phone);
          setValue('website', orgs[0].website);
        }
      } catch (err) {
        toast.error(getErrorMessage(err));
      } finally {
        setLoading(false);
      }
    };
    fetchOrg();

    if (currentUser?._id) {
      socket.emit('join', currentUser._id);
    }

    socket.on('user_status_change', ({ userId, status }) => {
      setOnlineUsers(prev => ({ ...prev, [userId]: status === 'online' }));
    });

    return () => {
      socket.off('user_status_change');
    };
  }, [setValue, currentUser]);

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

  const onInvite = async (data) => {
    setInviting(true);
    try {
      await api.post(`/invite/invite-recruiter/${org._id}`, data);
      toast.success('Invite sent successfully!');
      reset();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setInviting(false);
    }
  };

  const onEditOrg = async (data) => {
    try {
      const res = await api.patch(`/organizations/update-organization/${org._id}`, data);
      setOrg(res.data.data);
      setIsEditing(false);
      toast.success('Organization updated');
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  const removeMember = async (memberId) => {
    if (!window.confirm('Are you sure you want to remove this member?')) return;
    try {
      await api.delete(`/organizations/${org._id}/member/${memberId}`);
      setOrg(prev => ({
        ...prev,
        members: prev.members.filter(m => m.user?._id !== memberId)
      }));
      toast.success('Member removed');
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  const viewActivity = async (memberId) => {
    setActivity({ memberId, loading: true, data: [] });
    try {
      const res = await api.get(`/organizations/${org._id}/member/${memberId}/activity`);
      setActivity({ memberId, loading: false, data: res.data.data });
    } catch (err) {
      toast.error(getErrorMessage(err));
      setActivity(null);
    }
  };

  if (loading) return <PageLoader />;

  if (!org) {
    return (
      <div className="card p-16 text-center max-w-lg mx-auto mt-10 border-dashed border-2">
        <div className="w-20 h-20 bg-green-50 rounded-3xl flex items-center justify-center mx-auto mb-6">
          <BuildingIcon className="w-10 h-10 text-green-600" />
        </div>
        <h2 className="text-3xl font-black text-gray-900 mb-2 tracking-tight">Establish Your Presence</h2>
        <p className="text-gray-500 mb-8 leading-relaxed">As an owner, you can build a powerful brand presence. Create your organization profile to start hiring top talent.</p>
        <button onClick={() => navigate('/recruiter/create-organization')} className="btn-primary inline-flex justify-center w-full py-4 shadow-xl shadow-green-100">
          <PlusCircleIcon className="w-5 h-5 mr-2" />
          Create Organization Profile
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Header with Glassmorphism effect background if possible, but we use standard clean UI */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <div className="flex items-center gap-3 mb-2">
            <span className="badge-green">Owner View</span>
            <span className="text-xs text-gray-400 font-bold uppercase tracking-widest">Organization Management</span>
          </div>
          <h1 className="text-4xl font-black text-gray-900 tracking-tight leading-none">
            {org.name}
          </h1>
          <p className="text-gray-500 mt-3 flex items-center gap-2 font-medium">
             <LinkIcon className="w-4 h-4" />
             {org.website || 'No website set'}
          </p>
        </motion.div>
        
        <div className="flex gap-3">
           <button onClick={() => setIsEditing(true)} className="btn-secondary px-6">
             Edit Profile
           </button>
           <button className="btn-primary shadow-lg shadow-green-100">
             Public Page
           </button>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          {/* Main Info Card */}
          <div className="card overflow-hidden group">
            <div className="h-32 bg-linear-to-r from-green-500 to-emerald-600 relative">
               <div className="absolute -bottom-12 left-8">
                  <div className="w-24 h-24 bg-white rounded-3xl p-1 shadow-xl border-4 border-white overflow-hidden">
                     {org.logo?.url ? <img src={org.logo.url} className="w-full h-full object-cover" /> : <BuildingIcon className="w-full h-full p-4 text-gray-200" />}
                  </div>
               </div>
            </div>
            
            <div className="pt-16 p-8">
               <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
                  <div className="space-y-1">
                    <p className="text-xs font-bold text-gray-400 uppercase">Views</p>
                    <p className="text-xl font-black text-gray-900">{org.views || 0}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs font-bold text-gray-400 uppercase">Followers</p>
                    <p className="text-xl font-black text-gray-900">{org.followers?.length || 0}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs font-bold text-gray-400 uppercase">Type</p>
                    <p className="text-sm font-bold text-gray-700 capitalize">{org?.organizationType?.toLowerCase() || 'Company'}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs font-bold text-gray-400 uppercase">Industry</p>
                    <p className="text-sm font-bold text-gray-700">{org.industry || 'Technology'}</p>
                  </div>
               </div>

               <div className="mt-10 border-t pt-8 grid sm:grid-cols-2 gap-8">
                  <div>
                    <h4 className="text-sm font-black text-gray-900 mb-4 uppercase tracking-wider">Contact Information</h4>
                    <div className="space-y-3">
                       <p className="text-sm text-gray-600 flex items-center gap-3">
                         <MailIcon className="w-4 h-4 text-gray-400" /> {org.email}
                       </p>
                       <p className="text-sm text-gray-600 flex items-center gap-3">
                         <LinkIcon className="w-4 h-4 text-gray-400" /> {org.phone}
                       </p>
                    </div>
                  </div>
                  <div>
                    <h4 className="text-sm font-black text-gray-900 mb-4 uppercase tracking-wider">Details</h4>
                    <div className="space-y-3">
                       <p className="text-sm text-gray-600">
                         {org.organizationType === 'COMPANY' 
                           ? `Size: ${org.companyDetails?.employeesCount || 'N/A'} Employees`
                           : `Specialization: ${org.individualDetails?.hiringFor || 'N/A'}`}
                       </p>
                       <p className="text-sm text-gray-600">
                         Registration: {org.companyDetails?.gstNumber || org.individualDetails?.panNumber || 'Pending'}
                       </p>
                    </div>
                  </div>
               </div>
            </div>
          </div>

          {/* Team Management Section */}
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-black text-gray-900 tracking-tight">Team Members</h2>
              <span className="badge-gray">{org.members?.length || 0} Members</span>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              {org.members?.map((member, idx) => {
                const isOnline = onlineUsers[member.user?._id];
                const isMemberOwner = member.role === 'owner';
                return (
                  <motion.div 
                    key={idx}
                    layout
                    className={`card p-5 flex items-center gap-4 hover:shadow-md transition-all group ${isMemberOwner ? 'bg-green-50/20 border-green-100' : ''}`}
                  >
                    <div className="relative">
                      <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center font-black text-xl text-green-600 shadow-sm border border-gray-100 group-hover:rotate-3 transition-transform">
                        {member.user?.fullName?.charAt(0)}
                      </div>
                      <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white shadow-sm ${isOnline ? 'bg-green-500 animate-pulse' : 'bg-gray-300'}`} />
                    </div>
                    
                    <div className="flex-1 min-w-0">
                       <p className="font-bold text-gray-900 truncate flex items-center gap-2">
                         {member.user?.fullName || 'Anonymous User'}
                         {isMemberOwner && <span className="text-[10px] bg-green-600 text-white px-1.5 rounded-md">YOU</span>}
                       </p>
                       <p className="text-xs text-gray-500 truncate">{member.user?.email || 'No email'}</p>
                       <p className="text-[10px] font-black text-gray-400 uppercase mt-1 tracking-widest">{member.role}</p>
                    </div>

                    <div className="flex flex-col gap-1">
                       <button 
                         onClick={() => viewActivity(member.user?._id)}
                         className="p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-xl transition-all"
                         title="Activity Details"
                       >
                         <EyeIcon className="w-4.5 h-4.5" />
                       </button>
                       {!isMemberOwner && (
                         <button 
                           onClick={() => removeMember(member.user?._id)}
                           className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all"
                           title="Revoke Access"
                         >
                           <TrashIcon className="w-4.5 h-4.5" />
                         </button>
                       )}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </div>

        <div className="space-y-8">
           {/* Invite Section */}
           {org.organizationType === 'COMPANY' && (
             <div className="card p-8 bg-black text-white relative overflow-hidden">
                {/* Abstract background shape */}
                <div className="absolute -top-12 -right-12 w-32 h-32 bg-green-500/20 rounded-full blur-3xl" />
                <div className="relative">
                  <h3 className="text-xl font-black mb-2 flex items-center gap-2">
                    <UserPlusIcon className="w-6 h-6 text-green-500" />
                    Grow the Team
                  </h3>
                  <p className="text-gray-400 text-sm mb-8">Invite experienced recruiters to help scale your hiring pipeline.</p>
                  
                  <form onSubmit={handleSubmit(onInvite)} className="space-y-4">
                    <div>
                      <input 
                        {...register('email', { required: true })} 
                        type="email" 
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:border-green-500 outline-none transition-all" 
                        placeholder="recruiter@email.com" 
                      />
                    </div>
                    <button type="submit" disabled={inviting} className="btn-primary w-full justify-center py-3 shadow-xl shadow-green-900/20">
                      {inviting ? 'Sending Invite...' : 'Dispatch Invitation'}
                    </button>
                  </form>
                </div>
             </div>
           )}

           {/* Activity Display Area */}
           <AnimatePresence mode="wait">
             {activity ? (
               <motion.div 
                 key="activity"
                 initial={{ opacity: 0, x: 20 }}
                 animate={{ opacity: 1, x: 0 }}
                 exit={{ opacity: 0, x: 20 }}
                 className="card p-8 bg-green-50/50 border-green-100"
               >
                  <div className="flex items-center justify-between mb-6">
                    <h4 className="text-sm font-black text-gray-900 uppercase tracking-widest">Recruiter Activity</h4>
                    <button onClick={() => setActivity(null)} className="p-2 hover:bg-white rounded-xl transition-colors">
                      <XIcon className="w-4 h-4 text-gray-400" />
                    </button>
                  </div>
                  
                  {activity.loading ? (
                    <div className="py-12 flex justify-center">
                      <div className="w-6 h-6 border-3 border-green-600 border-t-transparent rounded-full animate-spin" />
                    </div>
                  ) : (
                    <div className="space-y-4">
                       <div className="bg-white p-4 rounded-2xl shadow-sm border border-green-100">
                          <p className="text-[10px] font-black text-gray-400 uppercase mb-1">Total Postings</p>
                          <p className="text-3xl font-black text-green-600 tracking-tight">{activity.data.length}</p>
                       </div>
                       
                       <div className="space-y-2 max-h-64 overflow-y-auto pr-2 custom-scrollbar">
                          {activity.data.length === 0 ? (
                            <p className="text-xs text-gray-400 italic text-center py-8">No recent activity detected.</p>
                          ) : (
                            activity.data.map(job => (
                              <div key={job._id} className="p-3 bg-white rounded-xl border border-gray-100 flex items-center justify-between group">
                                <div className="min-w-0">
                                  <p className="text-xs font-bold text-gray-800 truncate">{job.title}</p>
                                  <p className="text-[10px] text-gray-400">{formatRelativeDate(job.createdAt)}</p>
                                </div>
                                <ArrowRightIcon className="w-3 h-3 text-gray-300 group-hover:text-green-500 transition-colors" />
                              </div>
                            ))
                          )}
                       </div>
                    </div>
                  )}
               </motion.div>
             ) : (
               <div className="card p-8 border-dashed border-2 flex flex-col items-center justify-center text-center opacity-60">
                  <UsersIcon className="w-12 h-12 text-gray-300 mb-4" />
                  <p className="text-sm text-gray-500 font-medium tracking-tight">Select a recruiter to inspect their performance and listings.</p>
               </div>
             )}
           </AnimatePresence>
        </div>
      </div>

      {/* Edit Organization Modal */}
      <AnimatePresence>
        {isEditing && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
             <motion.div 
               initial={{ opacity: 0, scale: 0.9 }}
               animate={{ opacity: 1, scale: 1 }}
               exit={{ opacity: 0, scale: 0.9 }}
               className="bg-white rounded-3xl w-full max-w-xl shadow-2xl overflow-hidden"
             >
                <div className="p-8 border-b flex items-center justify-between bg-gray-50/50">
                   <h3 className="text-2xl font-black text-gray-900 tracking-tight">Edit Organization</h3>
                   <button onClick={() => setIsEditing(false)} className="p-2 hover:bg-gray-200 rounded-full transition-colors">
                      <XIcon className="w-5 h-5 text-gray-500" />
                   </button>
                </div>
                <form onSubmit={handleEditSubmit(onEditOrg)} className="p-8 space-y-6">
                   <div className="grid sm:grid-cols-2 gap-6">
                      <div className="space-y-1.5">
                         <label className="text-xs font-black text-gray-500 uppercase tracking-widest ml-1">Company Name</label>
                         <input {...registerEdit('name', { required: true })} className="input bg-gray-50 border-none focus:ring-2 focus:ring-green-500" />
                      </div>
                      <div className="space-y-1.5">
                         <label className="text-xs font-black text-gray-500 uppercase tracking-widest ml-1">Website</label>
                         <input {...registerEdit('website')} className="input bg-gray-50 border-none focus:ring-2 focus:ring-green-500" />
                      </div>
                   </div>
                   <div className="grid sm:grid-cols-2 gap-6">
                      <div className="space-y-1.5">
                         <label className="text-xs font-black text-gray-500 uppercase tracking-widest ml-1">Contact Email</label>
                         <input {...registerEdit('email', { required: true })} className="input bg-gray-50 border-none focus:ring-2 focus:ring-green-500" />
                      </div>
                      <div className="space-y-1.5">
                         <label className="text-xs font-black text-gray-500 uppercase tracking-widest ml-1">Contact Phone</label>
                         <input {...registerEdit('phone', { required: true })} className="input bg-gray-50 border-none focus:ring-2 focus:ring-green-500" />
                      </div>
                   </div>
                   
                   <div className="pt-4 flex gap-4">
                      <button type="button" onClick={() => setIsEditing(false)} className="btn-secondary flex-1 py-4">Cancel</button>
                      <button type="submit" className="btn-primary flex-1 py-4 shadow-xl shadow-green-100">Save Changes</button>
                   </div>
                </form>
             </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Organizations;
