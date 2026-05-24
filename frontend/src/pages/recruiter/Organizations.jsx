import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { 
  PlusCircleIcon, BuildingIcon, TrashIcon, UsersIcon, UserPlusIcon, 
  MailIcon, LinkIcon, EyeIcon, XIcon, ArrowRightIcon, AlertCircleIcon, 
  XCircleIcon, UserMinusIcon, MapPinIcon, GlobeIcon, AwardIcon, HashIcon, 
  InfoIcon 
} from 'lucide-react';
import { organizationService } from '../../services/organization.service';
import api from '../../services/api';
import { getErrorMessage, formatRelativeDate, getStatusBadgeClass } from '../../utils/helpers';
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
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [inviting, setInviting] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState({});
  const [activity, setActivity] = useState(null); // { memberId, data: [], loading: false }
  const navigate = useNavigate();
  const isOwner = currentUser?.role === 'owner';

  const { register, handleSubmit, reset, setValue } = useForm();
  const { register: registerEdit, handleSubmit: handleEditSubmit, setValue: setValueEdit } = useForm();
  const [activeFormTab, setActiveFormTab] = useState('general');

  useEffect(() => {
    if (org && isEditing) {
      setValueEdit('name', org.name || '');
      setValueEdit('tagline', org.tagline || '');
      setValueEdit('description', org.description || '');
      setValueEdit('tags', org.tags ? org.tags.join(', ') : '');
      setValueEdit('industry', org.industry || '');
      setValueEdit('email', org.email || '');
      setValueEdit('phone', org.phone || '');
      setValueEdit('website', org.website || '');
      
      setValueEdit('socialLinks.linkedin', org.socialLinks?.linkedin || '');
      setValueEdit('socialLinks.twitter', org.socialLinks?.twitter || '');
      setValueEdit('socialLinks.facebook', org.socialLinks?.facebook || '');
      setValueEdit('socialLinks.instagram', org.socialLinks?.instagram || '');
      
      setValueEdit('address.street', org.address?.street || '');
      setValueEdit('address.city', org.address?.city || '');
      setValueEdit('address.state', org.address?.state || '');
      setValueEdit('address.country', org.address?.country || '');
      setValueEdit('address.zipCode', org.address?.zipCode || '');

      setValueEdit('culture', org.culture ? org.culture.join(', ') : '');
      setValueEdit('perks', org.perks ? org.perks.join(', ') : '');
      
      if (org.organizationType === 'COMPANY') {
        setValueEdit('companyDetails.founded', org.companyDetails?.founded || '');
        setValueEdit('companyDetails.employeesCount', org.companyDetails?.employeesCount || '');
        setValueEdit('companyDetails.revenue', org.companyDetails?.revenue || '');
        setValueEdit('companyDetails.offices', org.companyDetails?.offices || '');
        setValueEdit('companyDetails.headquarters.city', org.companyDetails?.headquarters?.city || '');
        setValueEdit('companyDetails.headquarters.state', org.companyDetails?.headquarters?.state || '');
        setValueEdit('companyDetails.headquarters.country', org.companyDetails?.headquarters?.country || '');
        setValueEdit('companyDetails.gstNumber', org.companyDetails?.gstNumber || '');
        setValueEdit('companyDetails.cinNumber', org.companyDetails?.cinNumber || '');
        setValueEdit('companyDetails.companySize', org.companyDetails?.companySize || '');
      } else {
        setValueEdit('individualDetails.aadhaarNumber', org.individualDetails?.aadhaarNumber || '');
        setValueEdit('individualDetails.panNumber', org.individualDetails?.panNumber || '');
        setValueEdit('individualDetails.hiringFor', org.individualDetails?.hiringFor || '');
      }
    }
  }, [org, isEditing, setValueEdit]);

  useEffect(() => {
    const fetchOrg = async () => {
      try {
        const res = await organizationService.getMyOrganizations();
        const orgs = res.data.data || [];
        if (orgs.length > 0) {
          const orgData = orgs[0];
          if (!orgData) {
            setLoading(false);
            return;
          }
          setOrg(orgData);
          
          // Prefill invite form
          setValue('name', orgData.name);
          setValue('email', orgData.email);
          setValue('phone', orgData.phone);
          setValue('website', orgData.website);

          // Fetch Stats
          const statsRes = await api.get(`/organizations/${orgData._id}/stats`);
          setStats(statsRes.data.data);
        }
      } catch (err) {
        console.error("Error fetching org:", err);
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

    socket.on('verification_status_update', ({ companyId, verificationStatus, rejectionReason }) => {
      toast.success(`Verification status updated to ${verificationStatus}`);
      setOrg(prev => {
        if (prev && prev._id === companyId) {
          return { ...prev, verificationStatus, rejectionReason };
        }
        return prev;
      });
    });

    return () => {
      socket.off('user_status_change');
      socket.off('verification_status_update');
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
      const formattedData = {
        ...data,
        tags: data.tags ? data.tags.split(',').map(t => t.trim()).filter(Boolean) : [],
        culture: data.culture ? data.culture.split(',').map(c => c.trim()).filter(Boolean) : [],
        perks: data.perks ? data.perks.split(',').map(p => p.trim()).filter(Boolean) : [],
      };
      
      const res = await api.patch(`/organizations/update-organization/${org._id}`, formattedData);
      setOrg(res.data.data);
      setIsEditing(false);
      toast.success('Organization updated successfully');
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

  const deleteRecruiter = async (memberId) => {
    if (!window.confirm('WARNING: This will permanently delete the recruiter user account and all jobs they posted. This action is irreversible. Are you sure you want to delete this recruiter account?')) return;
    try {
      await api.delete(`/organizations/${org._id}/recruiters/${memberId}`);
      setOrg(prev => ({
        ...prev,
        members: prev.members.filter(m => m.user?._id !== memberId)
      }));
      toast.success('Recruiter account and their jobs deleted successfully');
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
        <h2 className="text-3xl font-black text-gray-900 mb-2 tracking-tight">
          {isOwner ? 'Establish Your Presence' : 'No Organization Found'}
        </h2>
        <p className="text-gray-500 mb-8 leading-relaxed">
          {isOwner 
            ? 'As an owner, you can build a powerful brand presence. Create your organization profile to start hiring top talent.' 
            : 'You are not yet connected to any organization. Please wait for an invitation from your company owner.'}
        </p>
        {isOwner && (
          <button onClick={() => navigate('/recruiter/create-organization')} className="btn-primary inline-flex justify-center w-full py-4 shadow-xl shadow-green-100">
            <PlusCircleIcon className="w-5 h-5 mr-2" />
            Create Organization Profile
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Header with Glassmorphism effect background if possible, but we use standard clean UI */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <div className="flex items-center gap-3 mb-2">
            <span className={isOwner ? "badge-green" : "badge-blue"}>
              {isOwner ? 'Owner View' : 'Recruiter View'}
            </span>
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
        
        <div className="flex items-center gap-3">
           {isOwner && (
             <button onClick={() => setIsEditing(true)} className="btn-secondary">
               Edit Organization
             </button>
           )}
           <button className="btn-primary shadow-lg shadow-green-100">
             Public Page
           </button>
        </div>
      </div>

      {org.verificationStatus === 'PENDING' && (
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl flex items-center gap-3 text-amber-800">
          <AlertCircleIcon className="w-5 h-5 text-amber-600 shrink-0" />
          <div className="text-xs">
            <span className="font-black">Verification Pending:</span> Your organization details and documents are currently under review by the administrator. Job postings are locked until verification is approved.
          </div>
        </div>
      )}

      {org.verificationStatus === 'REJECTED' && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-2xl flex items-center gap-3 text-red-800">
          <XCircleIcon className="w-5 h-5 text-red-600 shrink-0" />
          <div className="text-xs">
            <span className="font-black">Verification Rejected:</span> {org.rejectionReason || 'Please audit your submitted documents.'}
          </div>
        </div>
      )}

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

               {org.tagline && (
                 <p className="text-md italic text-gray-500 font-medium mt-8 border-l-4 border-green-500 pl-4">
                   "{org.tagline}"
                 </p>
               )}

               {org.description && (
                 <div className="mt-6 border-t border-gray-50 pt-6">
                   <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-2.5">About Organization</h4>
                   <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-wrap">{org.description}</p>
                 </div>
               )}

               {org.tags && org.tags.length > 0 && (
                 <div className="mt-4 flex flex-wrap gap-1.5">
                   {org.tags.map((tag, idx) => (
                     <span key={idx} className="badge-green text-xs font-semibold">#{tag}</span>
                   ))}
                 </div>
               )}

               <div className="mt-8 border-t border-gray-100 pt-8 grid sm:grid-cols-2 gap-8">
                  <div>
                    <h4 className="text-sm font-black text-gray-900 mb-4 uppercase tracking-wider">Contact & Socials</h4>
                    <div className="space-y-3">
                       <p className="text-sm text-gray-600 flex items-center gap-3">
                         <MailIcon className="w-4 h-4 text-gray-400 shrink-0" /> <span className="truncate">{org.email}</span>
                       </p>
                       <p className="text-sm text-gray-600 flex items-center gap-3">
                         <LinkIcon className="w-4 h-4 text-gray-400 shrink-0" /> {org.phone}
                       </p>
                       {org.website && (
                         <p className="text-sm text-gray-600 flex items-center gap-3">
                           <GlobeIcon className="w-4 h-4 text-gray-400 shrink-0" />
                           <a href={org.website} target="_blank" rel="noreferrer" className="text-green-600 hover:underline truncate">
                             {org.website}
                           </a>
                         </p>
                       )}
                    </div>

                    {org.socialLinks && Object.values(org.socialLinks).some(Boolean) && (
                      <div className="mt-5 pt-5 border-t border-gray-50">
                        <p className="text-[10px] font-black text-gray-400 uppercase mb-2">Social Channels</p>
                        <div className="flex flex-wrap gap-2">
                          {org.socialLinks.linkedin && (
                            <a href={org.socialLinks.linkedin} target="_blank" rel="noreferrer" className="p-2 bg-gray-50 hover:bg-green-50 border hover:border-green-300 rounded-xl transition-all text-gray-500 hover:text-green-600" title="LinkedIn">
                              <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                                <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.779-1.75-1.75s.784-1.75 1.75-1.75 1.75.779 1.75 1.75-.784 1.75-1.75 1.75zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/>
                              </svg>
                            </a>
                          )}
                          {org.socialLinks.twitter && (
                            <a href={org.socialLinks.twitter} target="_blank" rel="noreferrer" className="p-2 bg-gray-50 hover:bg-green-50 border hover:border-green-300 rounded-xl transition-all text-gray-500 hover:text-green-600" title="Twitter / X">
                              <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                              </svg>
                            </a>
                          )}
                          {org.socialLinks.facebook && (
                            <a href={org.socialLinks.facebook} target="_blank" rel="noreferrer" className="p-2 bg-gray-50 hover:bg-green-50 border hover:border-green-300 rounded-xl transition-all text-gray-500 hover:text-green-600" title="Facebook">
                              <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                                <path d="M9 8H7v3h2v9h3v-9h3.625L18 8h-3V6.125C12 6.125 12 7 12 8.5V8z"/>
                              </svg>
                            </a>
                          )}
                          {org.socialLinks.instagram && (
                            <a href={org.socialLinks.instagram} target="_blank" rel="noreferrer" className="p-2 bg-gray-50 hover:bg-green-50 border hover:border-green-300 rounded-xl transition-all text-gray-500 hover:text-green-600" title="Instagram">
                              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
                                <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
                                <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
                              </svg>
                            </a>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                  <div>
                    <h4 className="text-sm font-black text-gray-900 mb-4 uppercase tracking-wider">Details</h4>
                    <div className="space-y-4">
                       {/* Owner Information (Visible to all) */}
                       <div className="p-3.5 bg-gray-50 rounded-2xl border border-gray-100">
                          <p className="text-[10px] font-black text-gray-400 uppercase mb-1">Organization Owner</p>
                          <p className="text-sm font-bold text-gray-800">{org.owner?.fullName}</p>
                          <p className="text-[10px] text-gray-500 mt-0.5">{org.owner?.email}</p>
                       </div>

                       <div className="space-y-1 text-sm text-gray-600">
                         {org.organizationType === 'COMPANY' ? (
                           <>
                             <p>Size: <span className="font-bold text-gray-800">{org.companyDetails?.employeesCount || 'N/A'} Employees</span></p>
                             <p>Registration GST: <span className="font-bold text-gray-800">{org.companyDetails?.gstNumber || 'Pending'}</span></p>
                             {org.companyDetails?.founded && <p>Founded Year: <span className="font-bold text-gray-800">{org.companyDetails.founded}</span></p>}
                             {org.companyDetails?.revenue && <p>Revenue Scale: <span className="font-bold text-gray-800">{org.companyDetails.revenue}</span></p>}
                             {org.companyDetails?.offices && <p>Offices Count: <span className="font-bold text-gray-800">{org.companyDetails.offices}</span></p>}
                             {org.companyDetails?.cinNumber && <p>CIN Number: <span className="font-bold text-gray-800">{org.companyDetails.cinNumber}</span></p>}
                           </>
                         ) : (
                           <>
                             <p>Hiring Mandate: <span className="font-bold text-gray-800">{org.individualDetails?.hiringFor || 'N/A'}</span></p>
                             <p>PAN Number: <span className="font-bold text-gray-800">{org.individualDetails?.panNumber || 'Pending'}</span></p>
                             <p>Aadhaar Number: <span className="font-bold text-gray-800">{org.individualDetails?.aadhaarNumber || 'Pending'}</span></p>
                           </>
                         )}
                       </div>

                       {org.address && (org.address.street || org.address.city || org.address.country) && (
                         <div className="pt-3 border-t border-gray-50">
                           <p className="text-[10px] font-black text-gray-400 uppercase mb-1.5 flex items-center gap-1">
                             <MapPinIcon className="w-3.5 h-3.5 text-gray-400" /> Headquarters Address
                           </p>
                           <p className="text-xs text-gray-600 leading-relaxed">
                             {[org.address.street, org.address.city, org.address.state, org.address.country, org.address.zipCode].filter(Boolean).join(', ')}
                           </p>
                         </div>
                       )}
                    </div>
                  </div>
               </div>
            </div>
          </div>

          {/* Culture & Perks Card */}
          {org.organizationType === 'COMPANY' && ((org.culture && org.culture.length > 0) || (org.perks && org.perks.length > 0)) && (
            <div className="card p-8 space-y-6">
              <h3 className="text-lg font-black text-gray-900 tracking-tight flex items-center gap-2 border-b pb-3">
                <AwardIcon className="w-5 h-5 text-green-500" />
                Workplace Culture & Benefits
              </h3>
              
              <div className="grid sm:grid-cols-2 gap-6">
                {org.culture && org.culture.length > 0 && (
                  <div>
                    <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-3">Our Culture Values</h4>
                    <div className="flex flex-wrap gap-1.5">
                      {org.culture.map((val, idx) => (
                        <span key={idx} className="badge-purple text-xs font-semibold">{val}</span>
                      ))}
                    </div>
                  </div>
                )}

                {org.perks && org.perks.length > 0 && (
                  <div>
                    <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-3">Perks & Benefits</h4>
                    <div className="flex flex-wrap gap-1.5">
                      {org.perks.map((val, idx) => (
                        <span key={idx} className="badge-blue text-xs font-semibold">{val}</span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Conditional Section: Team for Companies, Insights for Individuals */}
          <div>
            {org.organizationType === 'COMPANY' ? (
              <>
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
                             {member.user?._id === currentUser?._id && <span className="text-[10px] bg-green-600 text-white px-1.5 rounded-md uppercase">You</span>}
                           </p>
                           <p className="text-xs text-gray-500 truncate">{member.user?.email || 'No email'}</p>
                           <p className="text-[10px] font-black text-gray-400 uppercase mt-1 tracking-widest">{member.role}</p>
                        </div>
                        
                        {/* Member Actions (Visible to Organization Owner for recruiter members) */}
                        {isOwner && !isMemberOwner && (
                          <div className="flex items-center gap-1.5 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={() => viewActivity(member.user?._id)}
                              className="p-1.5 bg-white text-gray-600 hover:text-green-600 rounded-lg shadow-sm border border-gray-100 cursor-pointer"
                              title="View Activity"
                            >
                              <EyeIcon className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => removeMember(member.user?._id)}
                              className="p-1.5 bg-white text-amber-500 hover:text-amber-600 hover:bg-amber-50 rounded-lg shadow-sm border border-gray-100 cursor-pointer"
                              title="Remove Member"
                            >
                              <UserMinusIcon className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => deleteRecruiter(member.user?._id)}
                              className="p-1.5 bg-white text-red-500 hover:text-red-600 hover:bg-red-50 rounded-lg shadow-sm border border-gray-100 cursor-pointer"
                              title="Delete Recruiter Account"
                            >
                              <TrashIcon className="w-4 h-4" />
                            </button>
                          </div>
                        )}
                      </motion.div>
                    );
                  })}
                </div>
              </>
            ) : (
              <>
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-black text-gray-900 tracking-tight">Recruitment Pipeline</h2>
                  <div className="flex items-center gap-2">
                    <span className="badge-green">{stats?.jobsCount || 0} Active Jobs</span>
                    <span className="badge-blue">{stats?.followers || 0} Followers</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  {stats && Object.entries(stats.pipeline).filter(([key]) => key !== 'total').map(([status, count]) => (
                    <motion.div 
                      key={status}
                      whileHover={{ y: -4 }}
                      className="card p-6 flex flex-col items-center justify-center text-center space-y-2 border-transparent hover:border-green-100 transition-all"
                    >
                      <p className="text-3xl font-black text-gray-900">{count}</p>
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{status}</p>
                      <div className={`w-8 h-1 rounded-full ${getStatusBadgeClass(status).replace('badge-', 'bg-')}`} />
                    </motion.div>
                  ))}
                </div>

                {/* Engagement Card */}
                <div className="mt-6 card p-8 bg-gradient-to-br from-green-600 to-emerald-700 text-white border-none relative overflow-hidden">
                   <div className="relative z-10">
                      <h3 className="text-xl font-bold mb-2">Grow Your Network</h3>
                      <p className="text-sm text-green-100 mb-6 max-w-md">Your organization profile has been viewed {org.views} times. Keep posting jobs to increase your visibility!</p>
                      <div className="flex gap-4">
                        <div className="bg-white/10 backdrop-blur-md px-4 py-2 rounded-xl">
                          <p className="text-xs text-green-200">Followers</p>
                          <p className="text-lg font-bold">{stats?.followers || 0}</p>
                        </div>
                        <div className="bg-white/10 backdrop-blur-md px-4 py-2 rounded-xl">
                          <p className="text-xs text-green-200">Total Applicants</p>
                          <p className="text-lg font-bold">{stats?.pipeline?.total || 0}</p>
                        </div>
                      </div>
                   </div>
                   <UsersIcon className="absolute -bottom-4 -right-4 w-32 h-32 text-white/10 rotate-12" />
                </div>
              </>
            )}
          </div>
        </div>

        <div className="space-y-8">
           {/* Invite Section (Owner Only) */}
           {org.organizationType === 'COMPANY' && isOwner && (
             <div className="card p-8 bg-black text-white relative overflow-hidden">
                {/* Abstract background shape */}
                <div className="absolute -top-12 -right-12 w-32 h-32 bg-green-500/20 rounded-full blur-3xl" />
                <div className="relative">
                  <h3 className="text-xl font-black mb-2 flex items-center gap-2">
                    <UserPlusIcon className="w-6 h-6 text-green-500" />
                    Grow the Team
                  </h3>
                  <p className="text-gray-400 text-sm mb-8">Invite experienced recruiters to help scale your hiring pipeline.</p>
                  
                  {org.verificationStatus !== 'VERIFIED' ? (
                    <div className="p-5 bg-white/5 border border-white/10 rounded-2xl text-center">
                      <AlertCircleIcon className="w-8 h-8 text-amber-500 mx-auto mb-3" />
                      <h4 className="font-bold text-sm text-amber-400">Recruiter Invites Locked</h4>
                      <p className="text-xs text-gray-400 mt-2 leading-relaxed">
                        You can invite team members once your company is verified by the administrator. Current Status: <span className="font-bold text-amber-400">{org.verificationStatus || 'PENDING'}</span>
                      </p>
                    </div>
                  ) : (
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
                  )}
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
               className="bg-white rounded-3xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]"
             >
                {/* Modal Header */}
                <div className="p-6 border-b flex items-center justify-between bg-gray-50/50 shrink-0">
                   <div>
                     <h3 className="text-xl font-black text-gray-900 tracking-tight">Edit Organization Profile</h3>
                     <p className="text-xs text-gray-400 mt-0.5">Keep your organization specifics and recruitment criteria updated.</p>
                   </div>
                   <button onClick={() => { setIsEditing(false); setActiveFormTab('general'); }} className="p-2 hover:bg-gray-200 rounded-full transition-colors cursor-pointer">
                      <XIcon className="w-5 h-5 text-gray-500" />
                   </button>
                </div>

                {/* Tab Navigation */}
                <div className="px-6 pt-4 border-b bg-gray-50/20 flex gap-2 overflow-x-auto scrollbar-none shrink-0">
                  {[
                    { id: 'general', label: 'General details' },
                    { id: 'contact', label: 'Contact & Socials' },
                    { id: 'location', label: 'Location' },
                    { id: 'details', label: org.organizationType === 'COMPANY' ? 'Company Details' : 'Individual Details' }
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setActiveFormTab(tab.id)}
                      className={`pb-3 px-1 text-xs font-bold capitalize border-b-2 transition-all whitespace-nowrap cursor-pointer ${
                        activeFormTab === tab.id 
                          ? 'border-green-600 text-green-600' 
                          : 'border-transparent text-gray-450 hover:text-gray-900'
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>

                <form onSubmit={handleEditSubmit(onEditOrg)} className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
                   {/* TAB 1: General Details */}
                   <div className={activeFormTab === 'general' ? 'space-y-4' : 'hidden'}>
                      <div className="grid sm:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                           <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Company/Entity Name</label>
                           <input {...registerEdit('name', { required: true })} className="input bg-gray-50 border-none focus:ring-2 focus:ring-green-500" placeholder="e.g. Acme Corporation" />
                        </div>
                        <div className="space-y-1.5">
                           <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Tagline</label>
                           <input {...registerEdit('tagline')} className="input bg-gray-50 border-none focus:ring-2 focus:ring-green-500" placeholder="e.g. Scaling human innovation" />
                        </div>
                      </div>

                      <div className="space-y-1.5">
                         <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Description / Overview</label>
                         <textarea {...registerEdit('description')} rows={4} className="input bg-gray-50 border-none focus:ring-2 focus:ring-green-500 py-3" placeholder="Provide a detailed overview of your organization, mission, and focus..." />
                      </div>

                      <div className="grid sm:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                           <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Industry Sector</label>
                           <input {...registerEdit('industry')} className="input bg-gray-50 border-none focus:ring-2 focus:ring-green-500" placeholder="e.g. IT Services, Healthcare" />
                        </div>
                        <div className="space-y-1.5">
                           <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Hashtags / Tags (comma separated)</label>
                           <input {...registerEdit('tags')} className="input bg-gray-50 border-none focus:ring-2 focus:ring-green-500" placeholder="e.g. tech, startup, remote" />
                        </div>
                      </div>
                   </div>

                   {/* TAB 2: Contact & Social Info */}
                   <div className={activeFormTab === 'contact' ? 'space-y-4' : 'hidden'}>
                      <div className="grid sm:grid-cols-2 gap-4">
                         <div className="space-y-1.5">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Contact Email</label>
                            <input {...registerEdit('email', { required: true })} type="email" className="input bg-gray-50 border-none focus:ring-2 focus:ring-green-500" />
                         </div>
                         <div className="space-y-1.5">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Contact Phone</label>
                            <input {...registerEdit('phone', { required: true })} className="input bg-gray-50 border-none focus:ring-2 focus:ring-green-500" />
                         </div>
                      </div>

                      <div className="space-y-1.5">
                         <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Website Link</label>
                         <input {...registerEdit('website')} type="url" className="input bg-gray-50 border-none focus:ring-2 focus:ring-green-500" placeholder="https://example.com" />
                      </div>

                      <div className="border-t border-gray-105 pt-4">
                        <p className="text-xs font-bold text-gray-900 mb-3 uppercase tracking-wider">Social Channels</p>
                        <div className="grid sm:grid-cols-2 gap-4">
                          <div className="space-y-1.5">
                             <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">LinkedIn URL</label>
                             <input {...registerEdit('socialLinks.linkedin')} type="url" className="input bg-gray-50 border-none focus:ring-2 focus:ring-green-500" placeholder="https://linkedin.com/company/..." />
                          </div>
                          <div className="space-y-1.5">
                             <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Twitter URL</label>
                             <input {...registerEdit('socialLinks.twitter')} type="url" className="input bg-gray-50 border-none focus:ring-2 focus:ring-green-500" placeholder="https://twitter.com/..." />
                          </div>
                          <div className="space-y-1.5">
                             <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Facebook URL</label>
                             <input {...registerEdit('socialLinks.facebook')} type="url" className="input bg-gray-50 border-none focus:ring-2 focus:ring-green-500" placeholder="https://facebook.com/..." />
                          </div>
                          <div className="space-y-1.5">
                             <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Instagram URL</label>
                             <input {...registerEdit('socialLinks.instagram')} type="url" className="input bg-gray-50 border-none focus:ring-2 focus:ring-green-500" placeholder="https://instagram.com/..." />
                          </div>
                        </div>
                      </div>
                   </div>

                   {/* TAB 3: Location Details */}
                   <div className={activeFormTab === 'location' ? 'space-y-4' : 'hidden'}>
                      <div className="space-y-1.5">
                         <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Street Address</label>
                         <input {...registerEdit('address.street')} className="input bg-gray-50 border-none focus:ring-2 focus:ring-green-500" placeholder="e.g. 123 Business Park, Sector 45" />
                      </div>

                      <div className="grid sm:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                           <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">City</label>
                           <input {...registerEdit('address.city')} className="input bg-gray-50 border-none focus:ring-2 focus:ring-green-500" placeholder="e.g. Noida" />
                        </div>
                        <div className="space-y-1.5">
                           <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">State / Province</label>
                           <input {...registerEdit('address.state')} className="input bg-gray-50 border-none focus:ring-2 focus:ring-green-500" placeholder="e.g. Uttar Pradesh" />
                        </div>
                      </div>

                      <div className="grid sm:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                           <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Country</label>
                           <input {...registerEdit('address.country')} className="input bg-gray-50 border-none focus:ring-2 focus:ring-green-500" placeholder="e.g. India" />
                        </div>
                        <div className="space-y-1.5">
                           <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Zip / Postal Code</label>
                           <input {...registerEdit('address.zipCode')} className="input bg-gray-50 border-none focus:ring-2 focus:ring-green-500" placeholder="e.g. 201301" />
                        </div>
                      </div>
                   </div>

                   {/* TAB 4: Specific details (Company details or Individual Details) */}
                   <div className={activeFormTab === 'details' ? 'space-y-5' : 'hidden'}>
                      {org.organizationType === 'COMPANY' ? (
                        <>
                          <div className="grid sm:grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                               <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Founded Year</label>
                               <input {...registerEdit('companyDetails.founded')} type="number" className="input bg-gray-50 border-none focus:ring-2 focus:ring-green-500" placeholder="e.g. 2018" />
                            </div>
                            <div className="space-y-1.5">
                               <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Employees Scale</label>
                               <select {...registerEdit('companyDetails.employeesCount')} className="input bg-gray-50 border-none focus:ring-2 focus:ring-green-500 cursor-pointer">
                                  <option value="">Select Scale</option>
                                  <option value="1-10">1-10 Employees</option>
                                  <option value="11-50">11-50 Employees</option>
                                  <option value="51-200">51-200 Employees</option>
                                  <option value="201-500">201-500 Employees</option>
                                  <option value="501-1000">501-1000 Employees</option>
                                  <option value="1000+">1000+ Employees</option>
                               </select>
                            </div>
                          </div>

                          <div className="grid sm:grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                               <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Annual Revenue Scale</label>
                               <input {...registerEdit('companyDetails.revenue')} className="input bg-gray-50 border-none focus:ring-2 focus:ring-green-500" placeholder="e.g. $2M - $5M" />
                            </div>
                            <div className="space-y-1.5">
                               <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Total Offices Count</label>
                               <input {...registerEdit('companyDetails.offices')} type="number" className="input bg-gray-50 border-none focus:ring-2 focus:ring-green-500" placeholder="e.g. 3" />
                            </div>
                          </div>

                          <div className="border-t border-gray-50 pt-4 space-y-3">
                             <p className="text-xs font-bold text-gray-900 uppercase tracking-wider">Headquarters Details</p>
                             <div className="grid grid-cols-3 gap-2">
                               <input {...registerEdit('companyDetails.headquarters.city')} className="input bg-gray-50 border-none focus:ring-2 focus:ring-green-500 text-xs" placeholder="City" />
                               <input {...registerEdit('companyDetails.headquarters.state')} className="input bg-gray-50 border-none focus:ring-2 focus:ring-green-500 text-xs" placeholder="State" />
                               <input {...registerEdit('companyDetails.headquarters.country')} className="input bg-gray-50 border-none focus:ring-2 focus:ring-green-500 text-xs" placeholder="Country" />
                             </div>
                          </div>

                          <div className="grid sm:grid-cols-2 gap-4 border-t border-gray-50 pt-4">
                            <div className="space-y-1.5">
                               <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">GST Number</label>
                               <input {...registerEdit('companyDetails.gstNumber')} className="input bg-gray-50 border-none focus:ring-2 focus:ring-green-500 uppercase" placeholder="GSTIN" />
                            </div>
                            <div className="space-y-1.5">
                               <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">CIN Number</label>
                               <input {...registerEdit('companyDetails.cinNumber')} className="input bg-gray-50 border-none focus:ring-2 focus:ring-green-500 uppercase" placeholder="CIN" />
                            </div>
                          </div>
                        </>
                      ) : (
                        <>
                          <div className="grid sm:grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                               <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">PAN Card Number</label>
                               <input {...registerEdit('individualDetails.panNumber')} className="input bg-gray-50 border-none focus:ring-2 focus:ring-green-500 uppercase" placeholder="ABCDE1234F" />
                            </div>
                            <div className="space-y-1.5">
                               <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Aadhaar Card Number</label>
                               <input {...registerEdit('individualDetails.aadhaarNumber')} className="input bg-gray-50 border-none focus:ring-2 focus:ring-green-500" placeholder="12-digit number" />
                            </div>
                          </div>

                          <div className="space-y-1.5">
                             <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Hiring Specialization Role</label>
                             <select {...registerEdit('individualDetails.hiringFor')} className="input bg-gray-50 border-none focus:ring-2 focus:ring-green-500 cursor-pointer">
                                <option value="">Select Specialization</option>
                                <option value="Teacher">Teacher</option>
                                <option value="Trainer">Trainer</option>
                                <option value="Maid">Maid</option>
                                <option value="Cook">Cook</option>
                                <option value="Freelancer">Freelancer</option>
                                <option value="Assistant">Assistant</option>
                                <option value="Other">Other</option>
                             </select>
                          </div>
                        </>
                      )}

                      {/* Culture & Perks Inputs (Common for editing COMPANY) */}
                      {org.organizationType === 'COMPANY' && (
                        <div className="border-t border-gray-50 pt-4 grid sm:grid-cols-2 gap-4">
                          <div className="space-y-1.5">
                             <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Culture Values (comma separated)</label>
                             <input {...registerEdit('culture')} className="input bg-gray-50 border-none focus:ring-2 focus:ring-green-500" placeholder="e.g. Integrity, Quality, Innovation" />
                          </div>
                          <div className="space-y-1.5">
                             <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Perks & Benefits (comma separated)</label>
                             <input {...registerEdit('perks')} className="input bg-gray-50 border-none focus:ring-2 focus:ring-green-500" placeholder="e.g. Free meals, Health cover, Remote work" />
                          </div>
                        </div>
                      )}
                   </div>

                   {/* Modal Action Buttons (Fixed inside scroll space or bottom) */}
                   <div className="pt-4 flex gap-4 border-t shrink-0">
                      <button type="button" onClick={() => { setIsEditing(false); setActiveFormTab('general'); }} className="btn-secondary flex-1 py-3.5">Cancel</button>
                      <button type="submit" className="btn-primary flex-1 py-3.5 shadow-xl shadow-green-150">Save Changes</button>
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
