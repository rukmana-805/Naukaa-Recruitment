import { useEffect, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  MapPinIcon, BriefcaseIcon, DollarSignIcon, ClockIcon,
  BuildingIcon, ArrowLeftIcon, CheckCircleIcon, SendIcon, BookmarkIcon,
} from 'lucide-react';
import { jobService } from '../services/job.service';
import { applicationService } from '../services/application.service';
import { formatSalary, formatExperience, formatRelativeDate, getErrorMessage } from '../utils/helpers';
import { PageLoader } from '../components/Skeleton';
import useAuthStore from '../store/authStore';
import { userService } from '../services/user.service';
import toast from 'react-hot-toast';

const JobDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuthStore();
  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [applying, setApplying] = useState(false);
  const [applied, setApplied] = useState(false);
  const [answers, setAnswers] = useState({});
  const [showApplyModal, setShowApplyModal] = useState(false);
  const { updateUser } = useAuthStore();

  const isSaved = user?.savedJobs?.includes(job?._id);

  const toggleSaveJob = async () => {
    if (!user) {
      toast.error('Please login to save jobs');
      return;
    }
    try {
      if (isSaved) {
        await userService.unsaveJob(job._id);
        updateUser({ savedJobs: user.savedJobs.filter(id => id !== job._id) });
        toast.success('Removed from saved jobs');
      } else {
        await userService.saveJob(job._id);
        updateUser({ savedJobs: [...(user.savedJobs || []), job._id] });
        toast.success('Job saved');
      }
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  useEffect(() => {
    const fetchJob = async () => {
      try {
        const res = await jobService.getJobById(id);
        setJob(res.data.data);
      } catch (err) {
        toast.error(getErrorMessage(err));
        navigate('/jobs');
      } finally {
        setLoading(false);
      }
    };
    fetchJob();
  }, [id, navigate]);

  const handleApply = async () => {
    if (!user) {
      toast.error('Please sign in to apply');
      navigate('/login', { state: { from: location } });
      return;
    }

    if (!user?.resume?.url) {
      toast.error('Please upload your resume before applying');
      navigate('/profile');
      return;
    }

    // Validate required questions
    const missingRequired = job.questions.find(q => q.required && !answers[q._id]);
    if (missingRequired) {
      toast.error(`Please answer the required question: "${missingRequired.question}"`);
      return;
    }

    const answersArray = job.questions.map((q) => ({
      question: q.question,
      answer: answers[q._id] ?? '',
    }));

    setApplying(true);
    try {
      await applicationService.applyToJob(id, { answers: answersArray });
      setApplied(true);
      setShowApplyModal(false);
      if (user.savedJobs?.includes(id)) {
        updateUser({ savedJobs: user.savedJobs.filter(j => j !== id) });
      }
      toast.success('Application submitted successfully! 🎉');
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setApplying(false);
    }
  };

  if (loading) return <PageLoader />;
  if (!job) return null;

  const company = job.company;
  const hasQuestions = job.questions?.length > 0;

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
      {/* Back */}
      <button onClick={() => navigate(-1)} className="btn-ghost mb-6 -ml-2">
        <ArrowLeftIcon className="w-4 h-4" />
        Back to jobs
      </button>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Main content */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="lg:col-span-2 space-y-5"
        >
          {/* Job header */}
          <div className="card p-6">
            <div className="flex items-start gap-4 mb-5">
              <div className="w-14 h-14 rounded-xl border border-gray-100 bg-gray-50 flex items-center justify-center shrink-0 overflow-hidden">
                {company?.logo?.url ? (
                  <img src={company.logo.url} alt={company.name} className="w-full h-full object-cover" />
                ) : (
                  <BuildingIcon className="w-6 h-6 text-gray-400" />
                )}
              </div>
              <div className="flex-1">
                <h1 className="text-xl font-bold text-gray-900 mb-1">{job.title}</h1>
                <p className="text-gray-500">{company?.name}</p>
              </div>
              <button
                onClick={toggleSaveJob}
                className={`p-2 rounded-lg transition-colors border ${isSaved ? 'text-green-500 bg-green-50 border-green-100' : 'text-gray-400 border-gray-100 hover:bg-gray-50'}`}
                title={isSaved ? "Unsave job" : "Save job"}
              >
                <BookmarkIcon className={`w-5 h-5 ${isSaved ? 'fill-current' : ''}`} />
              </button>
            </div>

            <div className="flex flex-wrap gap-3 text-sm text-gray-600">
              {job.location && (
                <span className="flex items-center gap-1.5">
                  <MapPinIcon className="w-4 h-4 text-green-500" /> {job.location}
                </span>
              )}
              {job.employmentType && (
                <span className="flex items-center gap-1.5">
                  <ClockIcon className="w-4 h-4 text-green-500" />
                  <span className="capitalize">{job.employmentType.replace('-', ' ')}</span>
                </span>
              )}
              {(job.salaryRange?.min || job.salaryRange?.max) && (
                <span className="flex items-center gap-1.5">
                  <DollarSignIcon className="w-4 h-4 text-green-500" />
                  {formatSalary(job.salaryRange.min, job.salaryRange.max)}
                </span>
              )}
              {(job.experienceRequired?.min !== undefined) && (
                <span className="flex items-center gap-1.5">
                  <BriefcaseIcon className="w-4 h-4 text-green-500" />
                  {formatExperience(job.experienceRequired.min, job.experienceRequired.max)}
                </span>
              )}
            </div>

            {job.skillsRequired?.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-gray-50">
                {job.skillsRequired.map((skill) => (
                  <span key={skill} className="badge-gray">{skill}</span>
                ))}
              </div>
            )}
          </div>

          {/* Description */}
          {job.description && (
            <div className="card p-6">
              <h2 className="font-bold text-gray-900 mb-3">About this role</h2>
              <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-line">{job.description}</p>
            </div>
          )}

          {/* Responsibilities */}
          {job.responsibilities?.length > 0 && (
            <div className="card p-6">
              <h2 className="font-bold text-gray-900 mb-3">Responsibilities</h2>
              <ul className="space-y-2">
                {job.responsibilities.map((r, i) => (
                  <li key={i} className="flex gap-2.5 text-sm text-gray-600">
                    <CheckCircleIcon className="w-4 h-4 text-green-500 shrink-0 mt-0.5" />
                    {r}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Perks */}
          {job.perks?.length > 0 && (
            <div className="card p-6">
              <h2 className="font-bold text-gray-900 mb-3">Perks & Benefits</h2>
              <div className="flex flex-wrap gap-2">
                {job.perks.map((p) => (
                  <span key={p} className="badge-green">{p}</span>
                ))}
              </div>
            </div>
          )}
        </motion.div>

        {/* Sidebar */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
          className="space-y-4"
        >
          {/* Apply card */}
          <div className="card p-5 sticky top-20">
            <div className="text-xs text-gray-400 mb-4">
              Posted {formatRelativeDate(job.createdAt)}
            </div>

            {applied ? (
              <div className="text-center py-4">
                <CheckCircleIcon className="w-10 h-10 text-green-500 mx-auto mb-2" />
                <p className="font-semibold text-gray-900">Applied!</p>
                <p className="text-xs text-gray-500 mt-1">We'll notify you of any updates</p>
              </div>
            ) : (
              <>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => hasQuestions ? setShowApplyModal(true) : handleApply()}
                  disabled={applying || job.status === 'closed'}
                  className="btn-primary w-full justify-center py-3 mb-3"
                >
                  {applying ? (
                    <span className="flex items-center gap-2">
                      <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Applying...
                    </span>
                  ) : job.status === 'closed' ? (
                    'Applications Closed'
                  ) : (
                    <>
                      <SendIcon className="w-4 h-4" />
                      {hasQuestions ? 'Apply (with Questions)' : 'Easy Apply'}
                    </>
                  )}
                </motion.button>
                {!user?.resume?.url && (
                  <p className="text-xs text-amber-600 text-center bg-amber-50 py-2 px-3 rounded-lg">
                    ⚠️ Upload your resume first
                  </p>
                )}
              </>
            )}

            <div className="mt-4 pt-4 border-t border-gray-50 space-y-2 text-xs text-gray-500">
              <div className="flex justify-between">
                <span>Applications</span>
                <span className="font-medium text-gray-700">{job.applicationsCount || 0}</span>
              </div>
              {job.expiresAt && (
                <div className="flex justify-between">
                  <span>Expires</span>
                  <span className="font-medium text-gray-700">{formatRelativeDate(job.expiresAt)}</span>
                </div>
              )}
            </div>
          </div>

          {/* Company brief */}
          {company && (
            <div className="card p-5">
              <h3 className="font-semibold text-gray-900 mb-3">About the Company</h3>
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-lg border border-gray-100 overflow-hidden bg-gray-50 flex items-center justify-center">
                  {company?.logo?.url ? (
                    <img src={company.logo.url} alt={company.name} className="w-full h-full object-cover" />
                  ) : (
                    <BuildingIcon className="w-4 h-4 text-gray-400" />
                  )}
                </div>
                <div>
                  <p className="font-medium text-sm text-gray-900">{company.name}</p>
                  {company.overview?.website && (
                    <a href={company.overview.website} target="_blank" rel="noopener noreferrer" className="text-xs text-green-600 hover:underline">
                      Visit website
                    </a>
                  )}
                </div>
              </div>
              {company.tagline && (
                <p className="text-xs text-gray-500 italic">"{company.tagline}"</p>
              )}
            </div>
          )}
        </motion.div>
      </div>

      {/* Questions Modal */}
      {showApplyModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl p-6 max-w-lg w-full max-h-[80vh] overflow-y-auto shadow-2xl"
          >
            <h3 className="font-bold text-gray-900 mb-1">Application Questions</h3>
            <p className="text-sm text-gray-500 mb-5">Please answer these questions from the recruiter</p>

            <div className="space-y-4">
              {job.questions.map((q) => (
                <div key={q._id}>
                  <label className="label">
                    {q.question}
                    {q.required && <span className="text-red-500 ml-1">*</span>}
                  </label>
                  {q.type === 'select' ? (
                    <select
                      className="input"
                      value={answers[q._id] || ''}
                      onChange={(e) => setAnswers((p) => ({ ...p, [q._id]: e.target.value }))}
                    >
                      <option value="">Select an option</option>
                      {q.options?.map((o) => (
                        <option key={o} value={o}>{o}</option>
                      ))}
                    </select>
                  ) : q.type === 'boolean' ? (
                    <div className="flex gap-4">
                      {['Yes', 'No'].map((o) => (
                        <label key={o} className="flex items-center gap-2 text-sm cursor-pointer">
                          <input
                            type="radio"
                            name={q._id}
                            value={o}
                            checked={answers[q._id] === o}
                            onChange={() => setAnswers((p) => ({ ...p, [q._id]: o }))}
                            className="accent-green-500"
                          />
                          {o}
                        </label>
                      ))}
                    </div>
                  ) : (
                    <input
                      type={q.type === 'number' ? 'number' : 'text'}
                      className="input"
                      value={answers[q._id] || ''}
                      onChange={(e) => setAnswers((p) => ({ ...p, [q._id]: e.target.value }))}
                      placeholder="Your answer..."
                    />
                  )}
                </div>
              ))}
            </div>

            <div className="flex gap-3 mt-6">
              <button onClick={() => setShowApplyModal(false)} className="btn-secondary flex-1">
                Cancel
              </button>
              <button onClick={handleApply} disabled={applying} className="btn-primary flex-1 justify-center">
                {applying ? 'Submitting...' : 'Submit Application'}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default JobDetail;
