import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { PlusIcon, TrashIcon, ArrowLeftIcon, AlertCircleIcon, XCircleIcon } from 'lucide-react';
import { jobService } from '../../services/job.service';
import { EMPLOYMENT_TYPES } from '../../utils/constants';
import { getErrorMessage } from '../../utils/helpers';
import toast from 'react-hot-toast';
import { useState, useEffect } from 'react';
import api from '../../services/api';
import { PageLoader } from '../../components/Skeleton';
import useAuthStore from '../../store/authStore';

const schema = z.object({
  title: z.string().min(3, 'Job title is required'),
  description: z.string().min(20, 'Description must be at least 20 characters'),
  location: z.string().optional(),
  employmentType: z.string().optional(),
  salaryRange: z.object({
    min: z.coerce.number().optional(),
    max: z.coerce.number().optional(),
  }).optional(),
  experienceRequired: z.object({
    min: z.coerce.number().optional(),
    max: z.coerce.number().optional(),
  }).optional(),
  skillsRequired: z.string().optional(),
  expiresAt: z.string().optional(),
});

const PostJob = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [responsibilities, setResponsibilities] = useState(['']);
  const [questions, setQuestions] = useState([]);
  const [checkingOrg, setCheckingOrg] = useState(true);
  const [orgStatus, setOrgStatus] = useState('VERIFIED'); // 'PENDING', 'VERIFIED', 'REJECTED'
  const [companyName, setCompanyName] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');

  useEffect(() => {
    const verifyOrg = async () => {
      try {
        const res = await api.get('/organizations/my-organizations');
        const organizations = res.data.data || [];
        
        if (organizations.length === 0) {
          const { user } = useAuthStore.getState();
          if (user?.role === 'owner') {
            toast.error('Please create an organization profile first');
            navigate('/recruiter/create-organization');
          } else {
            toast.error('You are not connected to any organization. Please contact your administrator.');
            navigate('/recruiter');
          }
        } else {
          const company = organizations[0];
          setOrgStatus(company.verificationStatus || 'PENDING');
          setCompanyName(company.name);
          setRejectionReason(company.rejectionReason || '');
        }
      } catch (err) {
        toast.error('Failed to verify organization status');
        navigate('/recruiter');
      } finally {
        setCheckingOrg(false);
      }
    };
    verifyOrg();
  }, [navigate]);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      salaryRange: {},
      experienceRequired: {},
    },
  });

  if (checkingOrg) return <PageLoader />;

  if (orgStatus !== 'VERIFIED') {
    return (
      <div className="max-w-2xl mx-auto py-12">
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="card p-10 text-center border-dashed border-2 flex flex-col items-center justify-center space-y-6"
        >
          <div className="w-20 h-20 bg-amber-50 rounded-3xl flex items-center justify-center">
            {orgStatus === 'REJECTED' ? (
              <XCircleIcon className="w-10 h-10 text-red-500 animate-bounce" />
            ) : (
              <AlertCircleIcon className="w-10 h-10 text-amber-500 animate-pulse" />
            )}
          </div>
          
          <div className="space-y-2 max-w-md">
            <h2 className="text-2xl font-black text-gray-900 tracking-tight">
              {orgStatus === 'REJECTED' ? 'Verification Rejected' : 'Verification Under Review'}
            </h2>
            <p className="text-sm text-gray-500 leading-relaxed">
              {orgStatus === 'REJECTED'
                ? `Your organization "${companyName}" verification was rejected. You are not allowed to post jobs at this time.`
                : `Your organization "${companyName}" is currently pending verification. The admin must review and verify your details before you can post jobs.`}
            </p>
          </div>

          {orgStatus === 'REJECTED' && rejectionReason && (
            <div className="p-4 bg-red-50 border border-red-100 rounded-2xl text-xs text-red-800 text-left max-w-md w-full">
              <span className="font-black">Reason for rejection:</span> {rejectionReason}
            </div>
          )}

          <div className="flex gap-4 w-full max-w-sm pt-4">
            <button type="button" onClick={() => navigate('/recruiter/organizations')} className="btn-primary flex-1 justify-center py-3">
              Go to My Organization
            </button>
            <button type="button" onClick={() => navigate('/recruiter')} className="btn-secondary flex-1 justify-center py-3">
              Back to Portal
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  const onSubmit = async (data) => {
    setLoading(true);
    try {
      const payload = {
        ...data,
        skillsRequired: data.skillsRequired
          ? data.skillsRequired.split(',').map((s) => s.trim()).filter(Boolean)
          : [],
        responsibilities: responsibilities.filter(Boolean),
        expiresAt: data.expiresAt || undefined,
        questions: questions.filter(q => q.question.trim()),
      };
      const res = await jobService.createJob(payload);
      toast.success('Job posted successfully!');
      navigate('/recruiter');
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const addResponsibility = () => setResponsibilities([...responsibilities, '']);
  const removeResponsibility = (i) => setResponsibilities(responsibilities.filter((_, idx) => idx !== i));
  const updateResponsibility = (i, val) => {
    const arr = [...responsibilities];
    arr[i] = val;
    setResponsibilities(arr);
  };

  const addQuestion = () => {
    setQuestions([...questions, { question: '', type: 'text', required: true, options: [] }]);
  };

  const removeQuestion = (i) => {
    setQuestions(questions.filter((_, idx) => idx !== i));
  };

  const updateQuestion = (i, field, val) => {
    const arr = [...questions];
    if (field === 'options') {
      arr[i][field] = val.split(',').map(o => o.trim()).filter(Boolean);
    } else {
      arr[i][field] = val;
    }
    setQuestions(arr);
  };

  return (
    <div className="max-w-3xl mx-auto">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
        <button onClick={() => navigate(-1)} className="btn-ghost mb-4 -ml-2">
          <ArrowLeftIcon className="w-4 h-4" />
          Back
        </button>
        <h1 className="section-title">Post a New Job</h1>
        <p className="text-gray-500 mt-1">Fill in the details to attract the right candidates</p>
      </motion.div>

      <motion.form
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        onSubmit={handleSubmit(onSubmit)}
        className="space-y-5"
      >
        {/* Basic Info */}
        <div className="card p-6 space-y-4">
          <h2 className="font-semibold text-gray-900">Basic Information</h2>

          <div>
            <label className="label">Job Title *</label>
            <input {...register('title')} className="input" placeholder="e.g. Senior Frontend Developer" />
            {errors.title && <p className="mt-1 text-xs text-red-500">{errors.title.message}</p>}
          </div>

          <div>
            <label className="label">Job Description *</label>
            <textarea {...register('description')} rows={5} className="input resize-none" placeholder="Describe the role, expectations, and ideal candidate..." />
            {errors.description && <p className="mt-1 text-xs text-red-500">{errors.description.message}</p>}
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="label">Location</label>
              <input {...register('location')} className="input" placeholder="e.g. Bangalore, Remote" />
            </div>
            <div>
              <label className="label">Employment Type</label>
              <select {...register('employmentType')} className="input">
                <option value="">Select type</option>
                {EMPLOYMENT_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="label">Skills Required (comma-separated)</label>
            <input {...register('skillsRequired')} className="input" placeholder="React, Node.js, TypeScript" />
          </div>
        </div>

        {/* Salary & Experience */}
        <div className="card p-6 space-y-4">
          <h2 className="font-semibold text-gray-900">Compensation & Experience</h2>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Min Salary (₹/yr)</label>
              <input {...register('salaryRange.min')} type="number" className="input" placeholder="e.g. 500000" />
            </div>
            <div>
              <label className="label">Max Salary (₹/yr)</label>
              <input {...register('salaryRange.max')} type="number" className="input" placeholder="e.g. 1200000" />
            </div>
            <div>
              <label className="label">Min Experience (yrs)</label>
              <input {...register('experienceRequired.min')} type="number" className="input" placeholder="0" />
            </div>
            <div>
              <label className="label">Max Experience (yrs)</label>
              <input {...register('experienceRequired.max')} type="number" className="input" placeholder="5" />
            </div>
          </div>

          <div>
            <label className="label">Application Deadline</label>
            <input {...register('expiresAt')} type="date" className="input" />
          </div>
        </div>

        {/* Responsibilities */}
        <div className="card p-6 space-y-4">
          <h2 className="font-semibold text-gray-900">Responsibilities</h2>
          <div className="space-y-2 max-h-60 overflow-y-auto custom-scrollbar pr-2">
            {responsibilities.map((r, i) => (
              <div key={i} className="flex gap-2">
                <input
                  type="text"
                  value={r}
                  onChange={(e) => updateResponsibility(i, e.target.value)}
                  className="input flex-1"
                  placeholder={`Responsibility ${i + 1}`}
                />
                {responsibilities.length > 1 && (
                  <button type="button" onClick={() => removeResponsibility(i)} className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                    <TrashIcon className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))}
          </div>
          <button type="button" onClick={addResponsibility} className="btn-ghost text-sm">
            <PlusIcon className="w-4 h-4" />
            Add Responsibility
          </button>
        </div>

        {/* Custom Questions */}
        <div className="card p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-gray-900">Custom Questions</h2>
            <button type="button" onClick={addQuestion} className="btn-secondary text-sm">
              <PlusIcon className="w-4 h-4" />
              Add Question
            </button>
          </div>
          <p className="text-xs text-gray-500 italic">Add questions that applicants must answer when applying for this job.</p>

          <div className="space-y-4 mt-4 max-h-96 overflow-y-auto custom-scrollbar pr-2">
            {questions.map((q, i) => (
              <div key={i} className="p-4 bg-gray-50 rounded-xl relative border border-gray-100 space-y-3">
                <button type="button" onClick={() => removeQuestion(i)} className="absolute top-3 right-3 text-red-400 hover:text-red-600 bg-white p-1.5 rounded-lg shadow-sm">
                  <TrashIcon className="w-4 h-4" />
                </button>
                
                <div>
                  <label className="label text-[11px]">Question Text</label>
                  <input
                    type="text"
                    value={q.question}
                    onChange={(e) => updateQuestion(i, 'question', e.target.value)}
                    className="input py-1.5 text-sm"
                    placeholder="e.g. How many years of experience do you have with React?"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="label text-[11px]">Response Type</label>
                    <select
                      value={q.type}
                      onChange={(e) => updateQuestion(i, 'type', e.target.value)}
                      className="input py-1.5 text-sm"
                    >
                      <option value="text">Text Answer</option>
                      <option value="number">Number</option>
                      <option value="select">Multiple Choice (Dropdown)</option>
                      <option value="boolean">Yes / No</option>
                    </select>
                  </div>
                  <div className="flex items-center mt-6">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={q.required}
                        onChange={(e) => updateQuestion(i, 'required', e.target.checked)}
                        className="accent-green-500 rounded"
                      />
                      <span className="text-xs font-medium text-gray-700">Required</span>
                    </label>
                  </div>
                </div>

                {q.type === 'select' && (
                  <div>
                    <label className="label text-[11px]">Options (comma separated)</label>
                    <input
                      type="text"
                      value={q.options.join(', ')}
                      onChange={(e) => updateQuestion(i, 'options', e.target.value)}
                      className="input py-1.5 text-sm"
                      placeholder="e.g. 1-2 years, 3-5 years, 5+ years"
                    />
                  </div>
                )}
              </div>
            ))}
            {questions.length === 0 && (
              <p className="text-center py-4 text-sm text-gray-400 border border-dashed border-gray-200 rounded-xl">
                No custom questions added.
              </p>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <button type="button" onClick={() => navigate(-1)} className="btn-secondary flex-1">
            Cancel
          </button>
          <motion.button
            type="submit"
            disabled={loading}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="btn-primary flex-1 justify-center"
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Posting...
              </span>
            ) : (
              'Post Job'
            )}
          </motion.button>
        </div>
      </motion.form>
    </div>
  );
};

export default PostJob;
