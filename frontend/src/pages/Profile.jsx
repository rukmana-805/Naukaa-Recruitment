import { useState } from 'react';
import { motion } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  UserIcon, BookOpenIcon, BriefcaseIcon, TargetIcon,
  UploadIcon, PlusIcon, TrashIcon, CheckCircleIcon, EditIcon, LockIcon
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

// SKILLS SECTION
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

// RESUME UPLOAD
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

// PROFESSIONAL STATUS
const ProfessionalStatusForm = ({ user }) => {
  const { updateUser } = useAuthStore();
  const [status, setStatus] = useState(user?.professionalStatus || 'fresher');
  const [details, setDetails] = useState({
    totalExperience: user?.experienceDetails?.totalExperience || '',
    currentCompany: user?.experienceDetails?.currentCompany || '',
    currentRole: user?.experienceDetails?.currentRole || '',
    currentSalary: user?.experienceDetails?.currentSalary || '',
    expectedSalary: user?.experienceDetails?.expectedSalary || '',
    noticePeriod: user?.experienceDetails?.noticePeriod || '',
  });
  const [saving, setSaving] = useState(false);

  const save = async () => {
    setSaving(true);
    try {
      const data = { professionalStatus: status };
      if (status === 'experienced') {
        data.experienceDetails = {
          totalExperience: parseFloat(details.totalExperience) || 0,
          currentCompany: details.currentCompany,
          currentRole: details.currentRole,
          currentSalary: parseFloat(details.currentSalary) || 0,
          expectedSalary: parseFloat(details.expectedSalary) || 0,
          noticePeriod: details.noticePeriod,
        };
      }
      await userService.updateProfessionalStatus(data);
      updateUser(data);
      toast.success('Professional status updated');
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="card p-5 mt-4">
      <h3 className="font-semibold text-gray-900 mb-4">Professional Status</h3>
      
      <div className="grid grid-cols-2 gap-4 mb-6">
        <label 
          className={`flex flex-col items-center justify-center p-4 rounded-xl border-2 cursor-pointer transition-all ${
            status === 'fresher' 
              ? 'border-green-500 bg-green-50 text-green-700' 
              : 'border-gray-200 hover:border-green-200 text-gray-500'
          }`}
        >
          <input type="radio" name="status" value="fresher" checked={status === 'fresher'} onChange={() => setStatus('fresher')} className="sr-only" />
          <span className="font-semibold mb-1">Fresher</span>
          <span className="text-[11px] opacity-80 text-center">I am a student or recently graduated</span>
        </label>
        <label 
          className={`flex flex-col items-center justify-center p-4 rounded-xl border-2 cursor-pointer transition-all ${
            status === 'experienced' 
              ? 'border-green-500 bg-green-50 text-green-700' 
              : 'border-gray-200 hover:border-green-200 text-gray-500'
          }`}
        >
          <input type="radio" name="status" value="experienced" checked={status === 'experienced'} onChange={() => setStatus('experienced')} className="sr-only" />
          <span className="font-semibold mb-1">Experienced</span>
          <span className="text-[11px] opacity-80 text-center">I have work experience</span>
        </label>
      </div>

      {status === 'experienced' && (
        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="grid sm:grid-cols-2 gap-4 mb-4 pt-2 border-t border-gray-100">
          <div>
            <label className="label text-[11px]">Total Experience (Years)</label>
            <input type="number" step="0.1" min="0" value={details.totalExperience} onChange={e => setDetails({...details, totalExperience: e.target.value})} className="input py-1.5 text-sm" placeholder="e.g. 2.5" />
          </div>
          <div>
            <label className="label text-[11px]">Current Role</label>
            <input type="text" value={details.currentRole} onChange={e => setDetails({...details, currentRole: e.target.value})} className="input py-1.5 text-sm" placeholder="e.g. Software Engineer" />
          </div>
          <div>
            <label className="label text-[11px]">Current Company</label>
            <input type="text" value={details.currentCompany} onChange={e => setDetails({...details, currentCompany: e.target.value})} className="input py-1.5 text-sm" placeholder="e.g. Acme Corp" />
          </div>
          <div>
            <label className="label text-[11px]">Notice Period</label>
            <select value={details.noticePeriod} onChange={e => setDetails({...details, noticePeriod: e.target.value})} className="input py-1.5 text-sm">
              <option value="">Select notice period</option>
              <option value="15 Days or less">15 Days or less</option>
              <option value="1 Month">1 Month</option>
              <option value="2 Months">2 Months</option>
              <option value="3 Months">3 Months</option>
              <option value="Serving Notice Period">Serving Notice Period</option>
            </select>
          </div>
          <div>
            <label className="label text-[11px]">Current Salary (₹/yr)</label>
            <input type="number" min="0" value={details.currentSalary} onChange={e => setDetails({...details, currentSalary: e.target.value})} className="input py-1.5 text-sm" placeholder="e.g. 600000" />
          </div>
          <div>
            <label className="label text-[11px]">Expected Salary (₹/yr)</label>
            <input type="number" min="0" value={details.expectedSalary} onChange={e => setDetails({...details, expectedSalary: e.target.value})} className="input py-1.5 text-sm" placeholder="e.g. 800000" />
          </div>
        </motion.div>
      )}

      <button onClick={save} disabled={saving} className="btn-primary py-2 text-sm mt-2 w-full justify-center">
        {saving ? 'Saving...' : 'Save Professional Status'}
      </button>
    </div>
  );
};

// LANGUAGES
const LanguagesSection = ({ user }) => {
  const { updateUser } = useAuthStore();
  const [languages, setLanguages] = useState(user?.languages || []);
  const [saving, setSaving] = useState(false);

  const addLanguage = () => {
    setLanguages([...languages, { language: '', read: false, write: false, speak: false }]);
  };

  const removeLanguage = (index) => {
    setLanguages(languages.filter((_, i) => i !== index));
  };

  const handleChange = (index, field, value) => {
    const newLangs = [...languages];
    newLangs[index][field] = value;
    setLanguages(newLangs);
  };

  const save = async () => {
    setSaving(true);
    try {
      await userService.updateLanguages({ languages });
      updateUser({ languages });
      toast.success('Languages updated');
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="card p-5 mt-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-gray-900">Languages</h3>
        <button onClick={addLanguage} className="btn-secondary text-xs py-1.5 px-3">
          <PlusIcon className="w-3.5 h-3.5" /> Add Language
        </button>
      </div>

      <div className="space-y-3">
        {languages.map((lang, i) => (
          <div key={i} className="flex flex-col sm:flex-row gap-3 sm:items-center bg-gray-50 p-3 rounded-xl border border-gray-100 relative">
            <button onClick={() => removeLanguage(i)} className="absolute top-2 right-2 sm:static sm:order-last text-red-400 hover:text-red-600 p-1 bg-white rounded-lg sm:bg-transparent sm:p-0">
              <TrashIcon className="w-4 h-4" />
            </button>
            <input type="text" value={lang.language} onChange={e => handleChange(i, 'language', e.target.value)} className="input py-1.5 text-sm sm:w-1/3" placeholder="Language (e.g. English)" />
            <div className="flex items-center gap-4 text-sm mt-2 sm:mt-0">
              <label className="flex items-center gap-1.5 cursor-pointer">
                <input type="checkbox" checked={lang.read} onChange={e => handleChange(i, 'read', e.target.checked)} className="accent-green-500 rounded" />
                Read
              </label>
              <label className="flex items-center gap-1.5 cursor-pointer">
                <input type="checkbox" checked={lang.write} onChange={e => handleChange(i, 'write', e.target.checked)} className="accent-green-500 rounded" />
                Write
              </label>
              <label className="flex items-center gap-1.5 cursor-pointer">
                <input type="checkbox" checked={lang.speak} onChange={e => handleChange(i, 'speak', e.target.checked)} className="accent-green-500 rounded" />
                Speak
              </label>
            </div>
          </div>
        ))}
        {languages.length === 0 && <p className="text-sm text-gray-400 text-center py-2">No languages added yet</p>}
      </div>

      <button onClick={save} disabled={saving} className="btn-primary mt-4">
        {saving ? 'Saving...' : 'Save Languages'}
      </button>
    </div>
  );
};

// PROFILE SUMMARY
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

// CAREER PREFERENCES
const INDUSTRY_DEPARTMENTS = {
  "IT Services & Consulting": ["Engineering - Software & QA", "IT & Information Security", "Project & Program Management", "Design & UX"],
  "Financial Services": ["Finance & Accounting", "Risk Management", "Investment Banking", "Sales & Business Development"],
  "Healthcare & Life Sciences": ["Medical & Clinical", "Research & Development", "Administration", "Quality Assurance"],
  "Education & EdTech": ["Teaching & Training", "Content Creation", "Student Counseling", "Administration"],
  "E-commerce & Retail": ["Supply Chain & Logistics", "Sales & Retail", "Marketing & Growth", "Customer Support"],
  "Manufacturing & Production": ["Engineering - Hardware", "Operations & Production", "Quality Control", "Supply Chain & Logistics"],
  "Other": ["Other"]
};

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
  const [locations, setLocations] = useState(user?.preferredLocations || []);
  const [locationInput, setLocationInput] = useState('');
  const [saving, setSaving] = useState(false);

  const { register, handleSubmit, watch, setValue } = useForm({
    resolver: zodResolver(prefsSchema),
    defaultValues: user?.careerPreferences || {},
  });

  const selectedIndustry = watch('preferredIndustry');

  const handleAddLocation = (e) => {
    e.preventDefault();
    if (locationInput.trim() && !locations.includes(locationInput.trim())) {
      setLocations([...locations, locationInput.trim()]);
      setLocationInput('');
    }
  };

  const handleRemoveLocation = (loc) => {
    setLocations(locations.filter(l => l !== loc));
  };

  const onSubmit = async (data) => {
    setSaving(true);
    try {
      const res = await userService.updateCareerPreferences(data);
      updateUser({ careerPreferences: res.data.data });
      await userService.updatePreferredLocations({ preferredLocations: locations });
      updateUser({ preferredLocations: locations });
      toast.success('Career preferences updated');
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="card p-5 mt-4 space-y-5">
      <h3 className="font-semibold text-gray-900">Career Preferences</h3>

      <div className="space-y-3">
        <label className="label">Preferred Locations</label>
        <div className="flex gap-2">
          <input 
            type="text" 
            value={locationInput} 
            onChange={e => setLocationInput(e.target.value)} 
            onKeyDown={e => e.key === 'Enter' && handleAddLocation(e)}
            className="input py-1.5" 
            placeholder="e.g. Bangalore, Remote" 
          />
          <button type="button" onClick={handleAddLocation} className="btn-secondary whitespace-nowrap px-4 py-1.5 text-sm">
            Add
          </button>
        </div>
        <div className="flex flex-wrap gap-2">
          {locations.map(loc => (
            <span key={loc} className="badge-gray flex items-center gap-1.5 text-sm">
              {loc}
              <button type="button" onClick={() => handleRemoveLocation(loc)} className="text-gray-400 hover:text-gray-600">
                <TrashIcon className="w-3.5 h-3.5" />
              </button>
            </span>
          ))}
        </div>
      </div>

      <div className="grid sm:grid-cols-2 gap-4 border-t border-gray-100 pt-5">
        <div>
          <label className="label">Desired Job Role</label>
          <input {...register('desiredJobRole')} className="input py-1.5" placeholder="e.g. Full Stack Developer" />
        </div>
        <div>
          <label className="label">Expected Salary (₹/yr)</label>
          <input {...register('expectedSalary')} type="number" className="input py-1.5" placeholder="e.g. 800000" />
        </div>
        
        <div>
          <label className="label">Preferred Industry</label>
          <select 
            {...register('preferredIndustry')} 
            className="input py-1.5"
            onChange={(e) => {
              register('preferredIndustry').onChange(e);
              setValue('department', ''); // Reset department when industry changes
            }}
          >
            <option value="">Select Industry</option>
            {Object.keys(INDUSTRY_DEPARTMENTS).map(ind => (
              <option key={ind} value={ind}>{ind}</option>
            ))}
          </select>
        </div>
        
        <div>
          <label className="label">Department</label>
          <select 
            {...register('department')} 
            className="input py-1.5"
            disabled={!selectedIndustry || !INDUSTRY_DEPARTMENTS[selectedIndustry]}
          >
            <option value="">Select Department</option>
            {selectedIndustry && INDUSTRY_DEPARTMENTS[selectedIndustry]?.map(dept => (
              <option key={dept} value={dept}>{dept}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="label">Employment Type</label>
          <select {...register('employmentType')} className="input py-1.5">
            <option value="">Any</option>
            {EMPLOYMENT_TYPES.map((t) => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="label">Work Mode</label>
          <select {...register('workMode')} className="input py-1.5">
            <option value="">Any</option>
            {WORK_MODES.map((m) => (
              <option key={m.value} value={m.value}>{m.label}</option>
            ))}
          </select>
        </div>
      </div>
      
      <button type="submit" disabled={saving} className="btn-primary mt-4">
        {saving ? 'Saving...' : 'Save Preferences'}
      </button>
    </form>
  );
};

// EDUCATION SECTION
const EducationSection = ({ user }) => {
  const { updateUser } = useAuthStore();
  const [education, setEducation] = useState(user?.education || []);
  const [saving, setSaving] = useState(false);

  const addEducation = () => {
    setEducation([...education, { degree: '', institute: '', fieldOfStudy: '', percentageOrCGPA: '', startYear: '', endYear: '' }]);
  };

  const removeEducation = (index) => {
    setEducation(education.filter((_, i) => i !== index));
  };

  const handleChange = (index, field, value) => {
    const newEdu = [...education];
    newEdu[index][field] = value;
    setEducation(newEdu);
  };

  const save = async () => {
    setSaving(true);
    try {
      await userService.updateEducation({ education });
      updateUser({ education });
      toast.success('Education updated');
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="card p-5 mt-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-gray-900">Education</h3>
        <button onClick={addEducation} className="btn-secondary text-xs py-1.5 px-3">
          <PlusIcon className="w-3.5 h-3.5" /> Add Education
        </button>
      </div>

      <div className="space-y-4">
        {education.map((edu, i) => (
          <div key={i} className="p-4 bg-gray-50 rounded-xl relative border border-gray-100">
            <button
              onClick={() => removeEducation(i)}
              className="absolute top-3 right-3 text-red-400 hover:text-red-600 bg-white p-1.5 rounded-lg shadow-sm"
              title="Remove"
            >
              <TrashIcon className="w-4 h-4" />
            </button>
            <div className="grid sm:grid-cols-2 gap-3 mt-2">
              <div>
                <label className="label text-[11px]">Degree</label>
                <input type="text" value={edu.degree} onChange={e => handleChange(i, 'degree', e.target.value)} className="input py-1.5 text-sm" placeholder="e.g. B.Tech" />
              </div>
              <div>
                <label className="label text-[11px]">Institute</label>
                <input type="text" value={edu.institute} onChange={e => handleChange(i, 'institute', e.target.value)} className="input py-1.5 text-sm" placeholder="e.g. MIT" />
              </div>
              <div>
                <label className="label text-[11px]">Field of Study</label>
                <input type="text" value={edu.fieldOfStudy} onChange={e => handleChange(i, 'fieldOfStudy', e.target.value)} className="input py-1.5 text-sm" placeholder="e.g. Computer Science" />
              </div>
              <div>
                <label className="label text-[11px]">Percentage / CGPA</label>
                <input type="text" value={edu.percentageOrCGPA} onChange={e => handleChange(i, 'percentageOrCGPA', e.target.value)} className="input py-1.5 text-sm" placeholder="e.g. 8.5 or 85%" />
              </div>
              <div>
                <label className="label text-[11px]">Start Year</label>
                <input type="number" value={edu.startYear} onChange={e => handleChange(i, 'startYear', parseInt(e.target.value) || '')} className="input py-1.5 text-sm" placeholder="e.g. 2018" />
              </div>
              <div>
                <label className="label text-[11px]">End Year</label>
                <input type="number" value={edu.endYear} onChange={e => handleChange(i, 'endYear', parseInt(e.target.value) || '')} className="input py-1.5 text-sm" placeholder="e.g. 2022" />
              </div>
            </div>
          </div>
        ))}
        {education.length === 0 && <p className="text-sm text-gray-400 text-center py-4">No education added yet</p>}
      </div>

      <button onClick={save} disabled={saving} className="btn-primary mt-4">
        {saving ? 'Saving...' : 'Save Education'}
      </button>
    </div>
  );
};

// EXPERIENCE SECTION
const ExperienceSection = ({ user }) => {
  const { updateUser } = useAuthStore();
  const [experience, setExperience] = useState(user?.workExperience || []);
  const [saving, setSaving] = useState(false);

  const addExperience = () => {
    setExperience([...experience, { companyName: '', role: '', description: '', startDate: '', endDate: '' }]);
  };

  const removeExperience = (index) => {
    setExperience(experience.filter((_, i) => i !== index));
  };

  const handleChange = (index, field, value) => {
    const newExp = [...experience];
    newExp[index][field] = value;
    setExperience(newExp);
  };

  const save = async () => {
    setSaving(true);
    try {
      await userService.updateWorkExperience({ workExperience: experience });
      updateUser({ workExperience: experience });
      toast.success('Experience updated');
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="card p-5 mt-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-gray-900">Work Experience</h3>
        <button onClick={addExperience} className="btn-secondary text-xs py-1.5 px-3">
          <PlusIcon className="w-3.5 h-3.5" /> Add Experience
        </button>
      </div>

      <div className="space-y-4">
        {experience.map((exp, i) => (
          <div key={i} className="p-4 bg-gray-50 rounded-xl relative border border-gray-100">
            <button
              onClick={() => removeExperience(i)}
              className="absolute top-3 right-3 text-red-400 hover:text-red-600 bg-white p-1.5 rounded-lg shadow-sm"
              title="Remove"
            >
              <TrashIcon className="w-4 h-4" />
            </button>
            <div className="grid sm:grid-cols-2 gap-3 mt-2">
              <div>
                <label className="label text-[11px]">Role / Job Title</label>
                <input type="text" value={exp.role} onChange={e => handleChange(i, 'role', e.target.value)} className="input py-1.5 text-sm" placeholder="e.g. Software Engineer" />
              </div>
              <div>
                <label className="label text-[11px]">Company Name</label>
                <input type="text" value={exp.companyName} onChange={e => handleChange(i, 'companyName', e.target.value)} className="input py-1.5 text-sm" placeholder="e.g. Google" />
              </div>
              <div>
                <label className="label text-[11px]">Start Date</label>
                <input type="date" value={exp.startDate ? exp.startDate.split('T')[0] : ''} onChange={e => handleChange(i, 'startDate', e.target.value)} className="input py-1.5 text-sm" />
              </div>
              <div>
                <label className="label text-[11px]">End Date (leave blank if current)</label>
                <input type="date" value={exp.endDate ? exp.endDate.split('T')[0] : ''} onChange={e => handleChange(i, 'endDate', e.target.value)} className="input py-1.5 text-sm" />
              </div>
              <div className="sm:col-span-2">
                <label className="label text-[11px]">Description</label>
                <textarea rows={2} value={exp.description} onChange={e => handleChange(i, 'description', e.target.value)} className="input py-1.5 text-sm" placeholder="Describe your responsibilities..." />
              </div>
            </div>
          </div>
        ))}
        {experience.length === 0 && <p className="text-sm text-gray-400 text-center py-4">No work experience added yet</p>}
      </div>

      <button onClick={save} disabled={saving} className="btn-primary mt-4">
        {saving ? 'Saving...' : 'Save Experience'}
      </button>
    </div>
  );
};

// Deleted ChangePasswordForm

// MAIN COMPONENT
const Profile = () => {
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState('overview');

  const completionItems = [
    { label: 'Resume', done: !!user?.resume?.url },
    { label: 'Skills', done: (user?.skills?.length || 0) > 0 },
    { label: 'Summary', done: !!user?.profileSummary },
    { label: 'Preferences', done: !!user?.careerPreferences?.desiredJobRole },
    { label: 'Education', done: (user?.education?.length || 0) > 0 },
    { label: 'Languages', done: (user?.languages?.length || 0) > 0 },
    { label: 'Locations', done: (user?.preferredLocations?.length || 0) > 0 },
    { label: 'Work Experience', done: user?.professionalStatus === 'fresher' ? true : (user?.workExperience?.length || 0) > 0 }
  ];
  const completionPct = Math.round((completionItems.filter((i) => i.done).length / completionItems.length) * 100);

  return (
    <div>
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
        <h1 className="section-title">My Profile</h1>
      </motion.div>

      <div className="flex flex-col lg:grid lg:grid-cols-4 gap-6 lg:h-[calc(100vh-140px)] pb-6">
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
              <div className="mt-3 space-y-1.5 h-48 overflow-y-auto pr-2 custom-scrollbar">
                {completionItems.map((item) => (
                  <div key={item.label} className="flex items-center gap-2 text-xs">
                    <CheckCircleIcon className={`w-3.5 h-3.5 shrink-0 ${item.done ? 'text-green-500' : 'text-gray-300'}`} />
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
          className="lg:col-span-3 flex flex-col h-full lg:overflow-hidden"
        >
          {/* Tab buttons */}
          <div className="shrink-0 flex gap-1 overflow-x-auto pb-1 mb-2 bg-white rounded-xl p-1 border border-gray-100 shadow-sm">
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
          <div className="flex-1 lg:overflow-y-auto pr-2 custom-scrollbar pb-10">
            {activeTab === 'overview' && (
              <div>
                <ProfessionalStatusForm user={user} />
                <ResumeUpload user={user} />
                <SkillsSection user={user} />
                <LanguagesSection user={user} />
                <ProfileSummary user={user} />
              </div>
            )}

            {activeTab === 'preferences' && (
              <CareerPrefsForm user={user} />
            )}

            {activeTab === 'education' && (
              <EducationSection user={user} />
            )}

            {activeTab === 'experience' && (
              <ExperienceSection user={user} />
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Profile;
