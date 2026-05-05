import { useState } from 'react';
import { motion } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  UserIcon, BookOpenIcon, BriefcaseIcon, TargetIcon,
  UploadIcon, PlusIcon, TrashIcon, CheckCircleIcon, EditIcon,
} from 'lucide-react';
import useAuthStore from '../store/authStore';
import { userService } from '../services/user.service';
import { getErrorMessage, getInitials } from '../utils/helpers';
import { EMPLOYMENT_TYPES, WORK_MODES, POPULAR_SKILLS } from '../utils/constants';
import toast from 'react-hot-toast';

const tabs = [
  { id: 'overview', label: 'Overview', icon: UserIcon },
  { id: 'education', label: 'Education', icon: BookOpenIcon },
  { id: 'experience', label: 'Experience', icon: BriefcaseIcon },
  { id: 'preferences', label: 'Preferences', icon: TargetIcon },
];

// ── SKILLS SECTION ──────────────────────────────────────────────────────────
const SkillsSection = ({ user }) => {
  const { updateUser } = useAuthStore();
  const [skills, setSkills] = useState(user?.skills || []);
  const [input, setInput] = useState('');
  const [saving, setSaving] = useState(false);

  const addSkill = () => {
    const s = input.trim();
    if (s && !skills.includes(s)) {
      setSkills([...skills, s]);
    }
    setInput('');
  };

  const removeSkill = (skill) => setSkills(skills.filter((s) => s !== skill));

  const save = async () => {
    setSaving(true);
    try {
      await userService.updateSkills({ skills });
      updateUser({ skills });
      toast.success('Skills updated');
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="card p-5 mt-4">
      <h3 className="font-semibold text-gray-900 mb-3">Skills</h3>
      <div className="flex gap-2 mb-3">
        <input
          type="text"
          className="input flex-1"
          placeholder="Add a skill..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addSkill())}
        />
        <button onClick={addSkill} className="btn-secondary">
          <PlusIcon className="w-4 h-4" />
        </button>
      </div>

      {/* Popular suggestions */}
      <div className="flex flex-wrap gap-1.5 mb-3">
        {POPULAR_SKILLS.filter((s) => !skills.includes(s)).slice(0, 8).map((s) => (
          <button
            key={s}
            onClick={() => setSkills([...skills, s])}
            className="badge-gray cursor-pointer hover:bg-green-100 hover:text-green-700 transition-colors"
          >
            + {s}
          </button>
        ))}
      </div>

      {skills.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-4 p-3 bg-gray-50 rounded-xl">
          {skills.map((skill) => (
            <span key={skill} className="flex items-center gap-1.5 badge-green pr-1">
              {skill}
              <button onClick={() => removeSkill(skill)} className="hover:text-green-900">
                <TrashIcon className="w-3 h-3" />
              </button>
            </span>
          ))}
        </div>
      )}

      <button onClick={save} disabled={saving} className="btn-primary">
        {saving ? 'Saving...' : 'Save Skills'}
      </button>
    </div>
  );
};

// ── RESUME UPLOAD ────────────────────────────────────────────────────────────
const ResumeUpload = ({ user }) => {
  const { updateUser } = useAuthStore();
  const [uploading, setUploading] = useState(false);

  const handleUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const formData = new FormData();
    formData.append('resume', file);
    setUploading(true);
    try {
      const res = await userService.uploadResume(formData);
      updateUser({ resume: { url: res.data.data } });
      toast.success('Resume uploaded successfully');
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="card p-5 mt-4">
      <h3 className="font-semibold text-gray-900 mb-3">Resume</h3>
      {user?.resume?.url ? (
        <div className="flex items-center gap-3 p-3 bg-green-50 rounded-xl">
          <CheckCircleIcon className="w-5 h-5 text-green-500" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-green-700">Resume uploaded</p>
            <a
              href={user.resume.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-green-600 hover:underline"
            >
              View / Download
            </a>
          </div>
          <label className="btn-secondary text-xs cursor-pointer">
            Replace
            <input type="file" accept=".pdf,.doc,.docx" onChange={handleUpload} className="sr-only" />
          </label>
        </div>
      ) : (
        <label className={`flex flex-col items-center justify-center p-8 border-2 border-dashed border-gray-200 rounded-xl cursor-pointer hover:border-green-400 hover:bg-green-50 transition-all ${uploading ? 'opacity-50 pointer-events-none' : ''}`}>
          <UploadIcon className="w-8 h-8 text-gray-300 mb-2" />
          <p className="text-sm font-medium text-gray-700">{uploading ? 'Uploading...' : 'Upload Resume'}</p>
          <p className="text-xs text-gray-400 mt-1">PDF, DOC, DOCX (Max 5MB)</p>
          <input type="file" accept=".pdf,.doc,.docx" onChange={handleUpload} className="sr-only" />
        </label>
      )}
    </div>
  );
};

// ── PROFILE SUMMARY ───────────────────────────────────────────────────────────
const ProfileSummary = ({ user }) => {
  const { updateUser } = useAuthStore();
  const [summary, setSummary] = useState(user?.profileSummary || '');
  const [saving, setSaving] = useState(false);

  const save = async () => {
    setSaving(true);
    try {
      await userService.updateProfileSummary({ profileSummary: summary });
      updateUser({ profileSummary: summary });
      toast.success('Summary updated');
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="card p-5 mt-4">
      <h3 className="font-semibold text-gray-900 mb-3">Profile Summary</h3>
      <textarea
        rows={4}
        className="input resize-none"
        placeholder="Write a brief professional summary..."
        value={summary}
        onChange={(e) => setSummary(e.target.value)}
      />
      <button onClick={save} disabled={saving} className="btn-primary mt-3">
        {saving ? 'Saving...' : 'Save Summary'}
      </button>
    </div>
  );
};

// ── CAREER PREFERENCES ────────────────────────────────────────────────────────
const prefsSchema = z.object({
  desiredJobRole: z.string().optional(),
  preferredIndustry: z.string().optional(),
  department: z.string().optional(),
  expectedSalary: z.coerce.number().optional(),
  employmentType: z.string().optional(),
  workMode: z.string().optional(),
  preferredShift: z.string().optional(),
});

const CareerPrefsForm = ({ user }) => {
  const { updateUser } = useAuthStore();
  const { register, handleSubmit } = useForm({
    resolver: zodResolver(prefsSchema),
    defaultValues: user?.careerPreferences || {},
  });

  const onSubmit = async (data) => {
    try {
      const res = await userService.updateCareerPreferences(data);
      updateUser({ careerPreferences: res.data.data });
      toast.success('Career preferences updated');
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="card p-5 mt-4 space-y-4">
      <h3 className="font-semibold text-gray-900">Career Preferences</h3>
      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label className="label">Desired Job Role</label>
          <input {...register('desiredJobRole')} className="input" placeholder="e.g. Full Stack Developer" />
        </div>
        <div>
          <label className="label">Preferred Industry</label>
          <input {...register('preferredIndustry')} className="input" placeholder="e.g. FinTech" />
        </div>
        <div>
          <label className="label">Expected Salary (₹/yr)</label>
          <input {...register('expectedSalary')} type="number" className="input" placeholder="e.g. 800000" />
        </div>
        <div>
          <label className="label">Employment Type</label>
          <select {...register('employmentType')} className="input">
            <option value="">Any</option>
            {EMPLOYMENT_TYPES.map((t) => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="label">Work Mode</label>
          <select {...register('workMode')} className="input">
            <option value="">Any</option>
            {WORK_MODES.map((m) => (
              <option key={m.value} value={m.value}>{m.label}</option>
            ))}
          </select>
        </div>
      </div>
      <button type="submit" className="btn-primary">Save Preferences</button>
    </form>
  );
};

// ── MAIN COMPONENT ────────────────────────────────────────────────────────────
const Profile = () => {
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState('overview');

  const completionItems = [
    { label: 'Resume', done: !!user?.resume?.url },
    { label: 'Skills', done: (user?.skills?.length || 0) > 0 },
    { label: 'Summary', done: !!user?.profileSummary },
    { label: 'Preferences', done: !!user?.careerPreferences?.desiredJobRole },
    { label: 'Education', done: (user?.education?.length || 0) > 0 },
  ];
  const completionPct = Math.round((completionItems.filter((i) => i.done).length / completionItems.length) * 100);

  return (
    <div>
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
        <h1 className="section-title">My Profile</h1>
      </motion.div>

      <div className="grid lg:grid-cols-4 gap-6">
        {/* Left: Profile card */}
        <div className="lg:col-span-1 space-y-4">
          {/* Avatar + name */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="card p-6 text-center"
          >
            <div className="w-20 h-20 bg-green-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <span className="text-3xl font-bold text-green-700">{getInitials(user?.fullName)}</span>
            </div>
            <h2 className="font-bold text-gray-900">{user?.fullName}</h2>
            <p className="text-sm text-gray-500 mt-0.5">{user?.email}</p>
            <span className={`inline-flex mt-2 badge ${user?.plan === 'paid' ? 'badge-green' : 'badge-gray'}`}>
              {user?.plan === 'paid' ? '✨ Pro' : 'Free Plan'}
            </span>

            {/* Completion */}
            <div className="mt-5 text-left">
              <div className="flex justify-between text-xs mb-1">
                <span className="text-gray-500">Profile Strength</span>
                <span className="font-semibold text-green-600">{completionPct}%</span>
              </div>
              <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${completionPct}%` }}
                  transition={{ duration: 0.8, ease: 'easeOut' }}
                  className="h-full bg-green-500 rounded-full"
                />
              </div>
              <div className="mt-3 space-y-1.5">
                {completionItems.map((item) => (
                  <div key={item.label} className="flex items-center gap-2 text-xs">
                    <CheckCircleIcon className={`w-3.5 h-3.5 ${item.done ? 'text-green-500' : 'text-gray-300'}`} />
                    <span className={item.done ? 'text-gray-700' : 'text-gray-400'}>{item.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        </div>

        {/* Right: Tabs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="lg:col-span-3"
        >
          {/* Tab buttons */}
          <div className="flex gap-1 overflow-x-auto pb-1 mb-2 bg-white rounded-xl p-1 border border-gray-100 shadow-sm">
            {tabs.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setActiveTab(id)}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all flex-1 justify-center ${
                  activeTab === id
                    ? 'bg-green-500 text-white shadow-sm'
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                <Icon className="w-4 h-4" />
                {label}
              </button>
            ))}
          </div>

          {/* Tab content */}
          {activeTab === 'overview' && (
            <div>
              <ResumeUpload user={user} />
              <SkillsSection user={user} />
              <ProfileSummary user={user} />
            </div>
          )}

          {activeTab === 'preferences' && (
            <CareerPrefsForm user={user} />
          )}

          {activeTab === 'education' && (
            <div className="card p-5 mt-4">
              <h3 className="font-semibold text-gray-900 mb-3">Education</h3>
              {user?.education?.length > 0 ? (
                <div className="space-y-3">
                  {user.education.map((edu, i) => (
                    <div key={i} className="p-3 bg-gray-50 rounded-xl">
                      <p className="font-medium text-sm text-gray-900">{edu.degree} – {edu.fieldOfStudy}</p>
                      <p className="text-xs text-gray-500">{edu.institute}</p>
                      <p className="text-xs text-gray-400 mt-0.5">{edu.startYear} – {edu.endYear} · {edu.percentageOrCGPA}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-400 text-center py-8">No education added yet</p>
              )}
            </div>
          )}

          {activeTab === 'experience' && (
            <div className="card p-5 mt-4">
              <h3 className="font-semibold text-gray-900 mb-3">Work Experience</h3>
              {user?.workExperience?.length > 0 ? (
                <div className="space-y-3">
                  {user.workExperience.map((exp, i) => (
                    <div key={i} className="p-3 bg-gray-50 rounded-xl border-l-4 border-green-400">
                      <p className="font-medium text-sm text-gray-900">{exp.role}</p>
                      <p className="text-xs text-gray-500">{exp.companyName}</p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {exp.startDate ? new Date(exp.startDate).getFullYear() : ''} –{' '}
                        {exp.endDate ? new Date(exp.endDate).getFullYear() : 'Present'}
                      </p>
                      {exp.description && <p className="text-xs text-gray-600 mt-1.5">{exp.description}</p>}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-400 text-center py-8">No work experience added yet</p>
              )}
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default Profile;
