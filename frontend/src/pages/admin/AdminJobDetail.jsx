import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowLeftIcon,
  BriefcaseIcon,
  MapPinIcon,
  ActivityIcon,
  UsersIcon,
  CalendarIcon,
  DollarSignIcon,
  TrashIcon,
  FileTextIcon,
  BuildingIcon,
  UserIcon,
  MailIcon,
  AlertCircleIcon
} from 'lucide-react';
import api from '../../services/api';
import { adminService } from '../../services/admin.service';
import { PageLoader } from '../../components/Skeleton';
import toast from 'react-hot-toast';

const AdminJobDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchJobDetails = async () => {
    try {
      const res = await api.get(`/jobs/get-job/${id}`);
      setJob(res.data.data);
    } catch (err) {
      toast.error('Failed to load job details');
      console.error(err);
      navigate('/admin/companies');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJobDetails();
  }, [id]);

  const handleDeleteJob = async () => {
    if (!window.confirm('CRITICAL WARNING: This will permanently delete this job listing and ALL candidate applications. This is irreversible. Are you sure?')) return;
    
    try {
      await adminService.deleteJob(id);
      toast.success('Job listing and applications deleted successfully');
      if (job?.company?._id) {
        navigate(`/admin/companies/${job.company._id}`);
      } else {
        navigate('/admin/companies');
      }
    } catch (err) {
      toast.error('Failed to delete job');
      console.error(err);
    }
  };

  if (loading) return <PageLoader />;
  if (!job) return null;

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Back button */}
      <div>
        <button
          onClick={() => {
            if (job?.company?._id) {
              navigate(`/admin/companies/${job.company._id}`);
            } else {
              navigate('/admin/companies');
            }
          }}
          className="flex items-center gap-2 text-xs font-bold text-gray-500 hover:text-green-600 transition-colors uppercase tracking-widest cursor-pointer"
        >
          <ArrowLeftIcon className="w-4 h-4" /> Back to Company Profile
        </button>
      </div>

      {/* Main Header Header Section */}
      <div className="card p-8 bg-white flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="flex items-start gap-4">
          <div className="w-16 h-16 bg-gray-50 rounded-2xl p-1 shadow-sm border border-gray-100 overflow-hidden shrink-0 flex items-center justify-center">
            {job.company?.logo?.url ? (
              <img src={job.company.logo.url} className="w-full h-full object-cover rounded-xl" />
            ) : (
              <BuildingIcon className="w-8 h-8 text-gray-300" />
            )}
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className={`badge-green capitalize`}>{job.status}</span>
              <span className="text-xs text-gray-400 font-bold uppercase tracking-wider">{job.company?.name}</span>
            </div>
            <h1 className="text-2xl font-black text-gray-900 tracking-tight leading-tight">
              {job.title}
            </h1>
            <p className="text-xs text-gray-500 mt-1">
              Posted on {new Date(job.createdAt).toLocaleDateString()}
            </p>
          </div>
        </div>

        <button
          onClick={handleDeleteJob}
          className="btn-ghost border border-red-200 text-red-600 hover:bg-red-50 py-3 px-5 rounded-xl font-bold flex items-center gap-1.5 cursor-pointer w-full md:w-auto justify-center"
        >
          <TrashIcon className="w-4.5 h-4.5" /> Delete Job listing
        </button>
      </div>

      {/* Main Grid */}
      <div className="grid md:grid-cols-3 gap-8">
        
        {/* Left Column: Metadata Specifications */}
        <div className="md:col-span-1 space-y-6">
          <div className="card p-6 space-y-4">
            <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest border-b pb-2">Job Information</h3>
            
            <div className="space-y-4 text-sm font-semibold text-gray-600">
              <div className="flex items-center gap-3">
                <MapPinIcon className="w-4.5 h-4.5 text-gray-400 shrink-0" />
                <div>
                  <p className="text-[10px] text-gray-400 font-bold uppercase">Location</p>
                  <p className="text-gray-800">{job.location || 'Remote'}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <ActivityIcon className="w-4.5 h-4.5 text-gray-400 shrink-0" />
                <div>
                  <p className="text-[10px] text-gray-400 font-bold uppercase">Employment Type</p>
                  <p className="text-gray-800 capitalize">{job.employmentType?.replace('-', ' ')}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <UsersIcon className="w-4.5 h-4.5 text-gray-400 shrink-0" />
                <div>
                  <p className="text-[10px] text-gray-400 font-bold uppercase">Applications</p>
                  <p className="text-gray-800">{job.applicationsCount || 0} candidates applied</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <DollarSignIcon className="w-4.5 h-4.5 text-gray-400 shrink-0" />
                <div>
                  <p className="text-[10px] text-gray-400 font-bold uppercase">Salary Range</p>
                  <p className="text-gray-800">
                    {job.salaryRange?.min && job.salaryRange?.max
                      ? `₹${job.salaryRange.min.toLocaleString('en-IN')} - ₹${job.salaryRange.max.toLocaleString('en-IN')} / year`
                      : 'Not specified'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <BriefcaseIcon className="w-4.5 h-4.5 text-gray-400 shrink-0" />
                <div>
                  <p className="text-[10px] text-gray-400 font-bold uppercase">Experience Required</p>
                  <p className="text-gray-800">
                    {job.experienceRequired?.min !== undefined && job.experienceRequired?.max !== undefined
                      ? `${job.experienceRequired.min} - ${job.experienceRequired.max} years`
                      : 'Not specified'}
                  </p>
                </div>
              </div>

              {job.expiresAt && (
                <div className="flex items-center gap-3">
                  <CalendarIcon className="w-4.5 h-4.5 text-gray-400 shrink-0" />
                  <div>
                    <p className="text-[10px] text-gray-400 font-bold uppercase">Expiry Date</p>
                    <p className="text-gray-800">{new Date(job.expiresAt).toLocaleDateString()}</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Recruiter / Poster Account details */}
          <div className="card p-6 space-y-3">
            <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest border-b pb-2">Listing Owner</h3>
            
            <div className="flex items-start gap-2.5">
              <div className="w-8 h-8 rounded-full bg-green-50 flex items-center justify-center font-black text-green-700 text-xs shrink-0">
                <UserIcon className="w-4 h-4 text-green-600" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold text-gray-800 truncate">{job.postedBy?.fullName || 'Company Owner'}</p>
                <p className="text-[10px] text-gray-400 flex items-center gap-1 mt-0.5 truncate">
                  <MailIcon className="w-3 h-3" />
                  {job.postedBy?.email || 'N/A'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Full Details */}
        <div className="md:col-span-2 space-y-6">
          
          {/* Job Description */}
          <div className="card p-8 space-y-4">
            <div>
              <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest border-b pb-2 mb-4">Job Description</h3>
              <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-wrap">{job.description}</p>
            </div>

            {/* Skills */}
            {job.skillsRequired?.length > 0 && (
              <div>
                <h4 className="text-xs font-black text-gray-400 uppercase tracking-wider mb-2.5">Skills Required</h4>
                <div className="flex flex-wrap gap-1.5">
                  {job.skillsRequired.map((skill, idx) => (
                    <span key={idx} className="badge-gray font-semibold text-xs">{skill}</span>
                  ))}
                </div>
              </div>
            )}

            {/* Responsibilities */}
            {job.responsibilities?.length > 0 && (
              <div>
                <h4 className="text-xs font-black text-gray-400 uppercase tracking-wider mb-2.5">Responsibilities</h4>
                <ul className="list-disc pl-5 space-y-2 text-sm text-gray-600 leading-relaxed">
                  {job.responsibilities.map((resp, idx) => (
                    <li key={idx}>{resp}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Perks */}
            {job.perks?.length > 0 && (
              <div>
                <h4 className="text-xs font-black text-gray-400 uppercase tracking-wider mb-2.5">Perks & Benefits</h4>
                <div className="flex flex-wrap gap-1.5">
                  {job.perks.map((perk, idx) => (
                    <span key={idx} className="badge-blue font-semibold text-xs">{perk}</span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Custom pre-screening questions */}
          <div className="card p-8 space-y-4">
            <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest border-b pb-2">Pre-Screening Questions</h3>
            
            <div className="space-y-3">
              {job.questions?.map((q, idx) => (
                <div key={idx} className="p-4 bg-gray-50 border border-gray-100 rounded-2xl flex items-center justify-between text-xs">
                  <div>
                    <p className="font-bold text-gray-800">{q.question}</p>
                    <p className="text-[10px] text-gray-400 font-bold uppercase mt-1">
                      Type: {q.type} {q.required ? '• Required' : '• Optional'}
                    </p>
                  </div>
                  
                  {q.options?.length > 0 && (
                    <div className="flex flex-wrap gap-1 max-w-[50%] justify-end">
                      {q.options.map((opt, oIdx) => (
                        <span key={oIdx} className="bg-white px-2 py-0.5 border rounded-md text-[9px] font-bold text-gray-500">{opt}</span>
                      ))}
                    </div>
                  )}
                </div>
              ))}

              {(!job.questions || job.questions.length === 0) && (
                <div className="flex items-center gap-2 text-gray-400 italic text-xs py-2">
                  <AlertCircleIcon className="w-4 h-4 shrink-0" />
                  No custom pre-screening questions configured for this listing.
                </div>
              )}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default AdminJobDetail;
