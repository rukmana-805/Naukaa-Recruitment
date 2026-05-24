import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeftIcon,
  BuildingIcon,
  MailIcon,
  PhoneIcon,
  ExternalLinkIcon,
  FileTextIcon,
  TrashIcon,
  UsersIcon,
  BriefcaseIcon,
  AlertCircleIcon,
  XCircleIcon,
  CheckCircleIcon,
  CalendarIcon,
  MapPinIcon,
  DollarSignIcon,
  ActivityIcon,
  XIcon
} from 'lucide-react';
import { adminService } from '../../services/admin.service';
import { getStatusBadgeClass } from '../../utils/helpers';
import { PageLoader } from '../../components/Skeleton';
import toast from 'react-hot-toast';

const AdminCompanyDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [details, setDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [rejecting, setRejecting] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');



  const fetchDetails = async () => {
    try {
      const res = await adminService.getCompanyById(id);
      setDetails(res.data.data);
    } catch (err) {
      toast.error('Failed to load company details');
      console.error(err);
      navigate('/admin/companies');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDetails();
  }, [id]);

  const handleVerify = async (status) => {
    if (status === 'REJECTED' && !rejectionReason.trim()) {
      return toast.error('Please specify a rejection reason');
    }

    try {
      await adminService.verifyCompany(
        details.organization._id,
        status,
        status === 'REJECTED' ? rejectionReason : undefined
      );

      toast.success(`Organization successfully ${status === 'VERIFIED' ? 'verified' : 'rejected'}!`);
      
      // Refresh state
      setDetails(prev => ({
        ...prev,
        organization: { 
          ...prev.organization, 
          verificationStatus: status, 
          rejectionReason: status === 'REJECTED' ? rejectionReason : undefined 
        }
      }));
      setRejecting(false);
      setRejectionReason('');
    } catch (err) {
      toast.error('Failed to update company verification status');
      console.error(err);
    }
  };

  const handleDeleteRecruiter = async (recruiterId) => {
    if (!window.confirm('WARNING: Deleting this recruiter will permanently delete their User Account and ALL job posts they created. Are you sure?')) return;
    try {
      await adminService.deleteUser(recruiterId);
      toast.success('Recruiter account and postings deleted');
      fetchDetails();
    } catch (err) {
      toast.error('Failed to delete recruiter account');
      console.error(err);
    }
  };



  const handleDeleteOwner = async (ownerId) => {
    if (!window.confirm('CRITICAL WARNING: Deleting the Owner account will permanently delete their User record, and the organization profile. Are you sure?')) return;
    try {
      await adminService.deleteCompany(details.organization._id);
      await adminService.deleteUser(ownerId);
      toast.success('Owner and organization profile deleted');
      navigate('/admin/companies');
    } catch (err) {
      toast.error('Failed to delete owner account');
      console.error(err);
    }
  };

  const handleDeleteCompany = async () => {
    if (!window.confirm('CRITICAL WARNING: This will permanently delete the entire company registry, all assigned recruiters, jobs, and applications. This is irreversible! Are you sure?')) return;
    try {
      await adminService.deleteCompany(details.organization._id);
      toast.success('Company registry and assets deleted');
      navigate('/admin/companies');
    } catch (err) {
      toast.error('Failed to delete company');
      console.error(err);
    }
  };

  if (loading) return <PageLoader />;
  if (!details) return null;

  const { organization: org, recruiters, jobs } = details;

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Back link */}
      <div>
        <button
          onClick={() => navigate('/admin/companies')}
          className="flex items-center gap-2 text-xs font-bold text-gray-500 hover:text-green-600 transition-colors uppercase tracking-widest cursor-pointer"
        >
          <ArrowLeftIcon className="w-4 h-4" /> Back to Directory
        </button>
      </div>

      {/* Header Profile Section */}
      <div className="card p-8 bg-white flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="flex items-start gap-4">
          <div className="w-20 h-20 bg-gray-50 rounded-3xl p-1 shadow-md border-4 border-white overflow-hidden shrink-0 flex items-center justify-center">
            {org.logo?.url ? (
              <img src={org.logo.url} className="w-full h-full object-cover rounded-2xl" />
            ) : (
              <BuildingIcon className="w-10 h-10 text-gray-300" />
            )}
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1.5 flex-wrap">
              <span className={org.verificationStatus === 'VERIFIED' ? 'badge-green' : org.verificationStatus === 'PENDING' ? 'badge-amber' : 'badge-red'}>
                {org.verificationStatus}
              </span>
              {org.subscription?.isActive ? (
                <span className="badge-purple">PREMIUM</span>
              ) : (
                <span className="badge-gray">FREE</span>
              )}
              <span className="badge-blue text-[10px] font-bold uppercase">{org.organizationType}</span>
            </div>
            <h1 className="text-3xl font-black text-gray-900 tracking-tight leading-tight">
              {org.name}
            </h1>
            <p className="text-sm text-gray-500 mt-1">{org.tagline || 'No tagline description set.'}</p>
          </div>
        </div>

        <div className="flex gap-3 shrink-0 w-full md:w-auto">
          <button
            onClick={handleDeleteCompany}
            className="btn-ghost border border-red-200 text-red-600 hover:bg-red-50 py-3 px-6 rounded-xl flex-1 md:flex-initial text-center justify-center font-bold flex items-center gap-2"
          >
            <TrashIcon className="w-4.5 h-4.5" /> Delete Company
          </button>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid lg:grid-cols-3 gap-8">
        {/* Left Column - Specifications */}
        <div className="space-y-8">
          {/* General Specs */}
          <div className="card p-6 space-y-4">
            <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest border-b pb-2">Audit Information</h3>
            
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <MailIcon className="w-4 h-4 text-gray-400 shrink-0" />
                <div className="min-w-0">
                  <p className="text-[10px] text-gray-400 font-bold uppercase">Contact Email</p>
                  <p className="text-sm font-semibold text-gray-700 truncate">{org.email}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <PhoneIcon className="w-4 h-4 text-gray-400 shrink-0" />
                <div>
                  <p className="text-[10px] text-gray-400 font-bold uppercase">Contact Phone</p>
                  <p className="text-sm font-semibold text-gray-700">{org.phone || 'N/A'}</p>
                </div>
              </div>

              {org.website && (
                <div className="flex items-center gap-3">
                  <ExternalLinkIcon className="w-4 h-4 text-gray-400 shrink-0" />
                  <div className="min-w-0">
                    <p className="text-[10px] text-gray-400 font-bold uppercase">Website Link</p>
                    <a
                      href={org.website}
                      target="_blank"
                      rel="noreferrer"
                      className="text-sm font-bold text-green-600 hover:underline truncate block"
                    >
                      {org.website}
                    </a>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Org Details */}
          <div className="card p-6 space-y-4">
            <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest border-b pb-2">Registry Identifiers</h3>
            
            <div className="space-y-4 text-sm">
              {org.organizationType === 'COMPANY' ? (
                <>
                  <div>
                    <p className="text-[10px] text-gray-400 font-bold uppercase">GST Number</p>
                    <p className="font-semibold text-gray-800">{org.companyDetails?.gstNumber || 'Not provided'}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-gray-400 font-bold uppercase">CIN Number</p>
                    <p className="font-semibold text-gray-800">{org.companyDetails?.cinNumber || 'Not provided'}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-gray-400 font-bold uppercase">Employees Scale</p>
                    <p className="font-semibold text-gray-800">{org.companyDetails?.employeesCount || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-gray-400 font-bold uppercase">Headquarters</p>
                    <p className="font-semibold text-gray-800">
                      {org.companyDetails?.headquarters?.city 
                        ? `${org.companyDetails.headquarters.city}, ${org.companyDetails.headquarters.state}, ${org.companyDetails.headquarters.country}` 
                        : 'N/A'}
                    </p>
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <p className="text-[10px] text-gray-400 font-bold uppercase">Aadhaar Card Number</p>
                    <p className="font-semibold text-gray-800">{org.individualDetails?.aadhaarNumber || 'Not provided'}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-gray-400 font-bold uppercase">PAN Card Number</p>
                    <p className="font-semibold text-gray-800">{org.individualDetails?.panNumber || 'Not provided'}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-gray-400 font-bold uppercase">Hiring Mandate</p>
                    <p className="font-semibold text-gray-800">{org.individualDetails?.hiringFor || 'N/A'}</p>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Submission Documents */}
          <div className="card p-6 space-y-4">
            <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest border-b pb-2">Verification Files</h3>
            <div className="grid gap-3">
              {org.verificationDocuments?.map((doc, idx) => (
                <a
                  key={idx}
                  href={doc.url}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center justify-between p-3.5 bg-gray-50 border hover:border-green-300 rounded-xl transition-all font-semibold text-xs text-gray-700 cursor-pointer"
                >
                  <span className="flex items-center gap-2">
                    <FileTextIcon className="w-4.5 h-4.5 text-gray-400" />
                    {doc.name}
                  </span>
                  <ExternalLinkIcon className="w-4 h-4 text-gray-400" />
                </a>
              ))}
              {(!org.verificationDocuments || org.verificationDocuments.length === 0) && (
                <p className="text-xs text-gray-400 italic py-2">No verification files uploaded yet.</p>
              )}
            </div>
          </div>
        </div>

        {/* Right Columns - Owner, Recruiters, and Jobs */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* Verification Pending Warning Box */}
          {org.verificationStatus === 'PENDING' && (
            <div className="p-6 border border-amber-100 rounded-3xl bg-amber-50/20 space-y-4">
              <div className="flex items-start gap-2">
                <AlertCircleIcon className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-black text-amber-950 text-sm">Action Required: Audit Verification</h4>
                  <p className="text-xs text-amber-900/70 mt-1">
                    Please inspect the verification files. Set the profile state below to unlock/restrict dashboard access.
                  </p>
                </div>
              </div>

              {!rejecting ? (
                <div className="flex gap-4">
                  <button
                    onClick={() => handleVerify('VERIFIED')}
                    className="btn-primary flex-1 justify-center py-3 bg-green-600 hover:bg-green-700 text-white"
                  >
                    Approve & Verify
                  </button>
                  <button
                    onClick={() => setRejecting(true)}
                    className="btn-ghost flex-1 justify-center py-3 border border-red-200 text-red-600 hover:bg-red-50"
                  >
                    Reject Verification
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-black text-gray-500 uppercase tracking-wider mb-2">Rejection Reason</label>
                    <textarea
                      value={rejectionReason}
                      onChange={(e) => setRejectionReason(e.target.value)}
                      placeholder="Explain why the company profile verification failed..."
                      rows={3}
                      className="w-full bg-white border border-gray-200 rounded-xl p-3 text-sm focus:border-red-500 outline-none"
                    />
                  </div>
                  <div className="flex gap-3">
                    <button
                      onClick={() => handleVerify('REJECTED')}
                      className="btn-primary justify-center bg-red-600 hover:bg-red-700 py-2.5 text-white flex-1"
                    >
                      Submit Rejection
                    </button>
                    <button
                      onClick={() => setRejecting(false)}
                      className="btn-secondary justify-center py-2.5 flex-1"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {org.verificationStatus === 'REJECTED' && (
            <div className="p-5 border border-red-100 rounded-3xl bg-red-50/20 text-xs text-red-800">
              <span className="font-black">Rejection Registry Log:</span> {org.rejectionReason}
            </div>
          )}

          {/* Owner Registry Section */}
          <div className="card p-6 space-y-4">
            <div className="flex items-center justify-between border-b pb-2">
              <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest">Owner Account</h3>
              {org.owner && (
                <button
                  onClick={() => handleDeleteOwner(org.owner._id)}
                  className="text-xs font-bold text-red-600 hover:text-red-700 flex items-center gap-1 cursor-pointer bg-red-50 hover:bg-red-100/50 px-2.5 py-1 rounded-lg border border-red-200 transition-colors"
                >
                  <TrashIcon className="w-3.5 h-3.5" /> Delete Owner Account
                </button>
              )}
            </div>
            
            <div className="flex items-center gap-3 p-4 bg-green-50/20 border border-green-100 rounded-2xl">
              <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center font-black text-green-700">
                {org.owner?.fullName?.charAt(0)}
              </div>
              <div>
                <p className="font-bold text-gray-900 text-sm">{org.owner?.fullName}</p>
                <p className="text-xs text-gray-500">{org.owner?.email} • {org.owner?.phone || 'No phone'}</p>
              </div>
            </div>
          </div>

          {/* Recruiters List */}
          <div className="card p-6 space-y-4">
            <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest border-b pb-2 flex justify-between">
              <span>Assigned Recruiters</span>
              <span>({recruiters?.length || 0})</span>
            </h3>

            <div className="grid sm:grid-cols-2 gap-4">
              {recruiters.map((recruiter) => (
                <div key={recruiter._id} className="p-4 bg-gray-50 rounded-xl border border-gray-100 flex items-center justify-between group">
                  <div className="min-w-0">
                    <p className="font-bold text-gray-900 text-sm truncate">{recruiter.fullName}</p>
                    <p className="text-xs text-gray-500 truncate">{recruiter.email}</p>
                  </div>
                  <button
                    onClick={() => handleDeleteRecruiter(recruiter._id)}
                    className="p-2 bg-white text-red-500 hover:bg-red-50 rounded-lg shadow-sm border border-gray-100 cursor-pointer shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
                    title="Delete Recruiter Account"
                  >
                    <TrashIcon className="w-4 h-4" />
                  </button>
                </div>
              ))}

              {recruiters.length === 0 && (
                <p className="col-span-2 text-xs text-gray-400 italic py-2">No assigned recruiters under this organization.</p>
              )}
            </div>
          </div>

          {/* Job Postings */}
          <div className="card p-6 space-y-4">
            <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest border-b pb-2 flex justify-between">
              <span>Job Listings</span>
              <span>({jobs?.length || 0})</span>
            </h3>

            <div className="space-y-3">
              {jobs.map((job) => (
                <div
                  key={job._id}
                  onClick={() => navigate(`/admin/jobs/${job._id}`)}
                  className="p-4 bg-gray-50 hover:bg-green-50/20 border hover:border-green-200 rounded-xl transition-all flex items-center justify-between cursor-pointer group"
                >
                  <div>
                    <h4 className="font-bold text-gray-900 text-sm group-hover:text-green-600 transition-colors">{job.title}</h4>
                    <p className="text-xs text-gray-400 mt-1">
                      Posted by: {job.postedBy?.fullName || 'Owner'} on {new Date(job.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  
                  <span className="text-xs text-green-600 font-bold flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                    Inspect <ExternalLinkIcon className="w-3.5 h-3.5" />
                  </span>
                </div>
              ))}

              {jobs.length === 0 && (
                <p className="text-xs text-gray-400 italic py-2">No job listings published.</p>
              )}
            </div>
          </div>
        </div>
      </div>

    </div>
  );
};

export default AdminCompanyDetail;
