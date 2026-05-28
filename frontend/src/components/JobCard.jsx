import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { MapPinIcon, BriefcaseIcon, DollarSignIcon, ClockIcon, ArrowRightIcon, BookmarkIcon } from 'lucide-react';
import { formatSalary, formatExperience, formatRelativeDate, truncate, getErrorMessage } from '../utils/helpers';
import { getStatusBadgeClass } from '../utils/helpers';
import useAuthStore from '../store/authStore';
import { userService } from '../services/user.service';
import toast from 'react-hot-toast';

const JobCard = ({ job, showApplyButton = true }) => {
  const { user, updateUser } = useAuthStore();
  const company = job.company;
  const logo = company?.logo?.url;

  const isSaved = user?.savedJobs?.includes(job._id);

  const toggleSaveJob = async (e) => {
    e.preventDefault();
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

  return (
    <motion.div
      whileHover={{ y: -3, boxShadow: '0 12px 30px -5px rgb(34 197 94 / 0.14)' }}
      transition={{ duration: 0.2 }}
      className="card p-5 flex flex-col gap-4"
    >
      {/* Header */}
      <div className="flex items-start gap-3">
        {/* Company logo */}
        <div className="w-11 h-11 rounded-xl border border-gray-100 bg-gray-50 flex items-center justify-center shrink-0 overflow-hidden">
          {logo ? (
            <img src={logo} alt={company?.name} className="w-full h-full object-cover" />
          ) : (
            <BriefcaseIcon className="w-5 h-5 text-gray-400" />
          )}
        </div>

        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-gray-900 text-base leading-tight truncate">
            {job.title}
          </h3>
          {company?._id ? (
            <Link 
              to={`/companies/${company._id}`} 
              className="text-sm text-gray-500 hover:text-green-600 transition-colors mt-0.5 truncate block"
            >
              {company.name}
            </Link>
          ) : (
            <p className="text-sm text-gray-500 mt-0.5 truncate">
              {company?.name || 'Company'}
            </p>
          )}
        </div>

        <div className="flex flex-col items-end gap-2 shrink-0">
          <span className={`${getStatusBadgeClass(job.status)}`}>
            {job.status}
          </span>
          <button
            onClick={toggleSaveJob}
            className={`p-1.5 rounded-lg transition-colors ${isSaved ? 'text-green-500 bg-green-50' : 'text-gray-400 hover:bg-gray-50'}`}
            title={isSaved ? "Unsave job" : "Save job"}
          >
            <BookmarkIcon className={`w-4 h-4 ${isSaved ? 'fill-current' : ''}`} />
          </button>
        </div>
      </div>

      {/* Meta info */}
      <div className="flex flex-wrap gap-x-4 gap-y-1.5">
        {job.location && (
          <span className="flex items-center gap-1 text-xs text-gray-500">
            <MapPinIcon className="w-3.5 h-3.5 text-gray-400" />
            {job.location}
          </span>
        )}
        {job.employmentType && (
          <span className="flex items-center gap-1 text-xs text-gray-500">
            <ClockIcon className="w-3.5 h-3.5 text-gray-400" />
            <span className="capitalize">{job.employmentType.replace('-', ' ')}</span>
          </span>
        )}
        {(job.salaryRange?.min || job.salaryRange?.max) && (
          <span className="flex items-center gap-1 text-xs text-gray-500">
            <DollarSignIcon className="w-3.5 h-3.5 text-gray-400" />
            {formatSalary(job.salaryRange.min, job.salaryRange.max)}
          </span>
        )}
        {(job.experienceRequired?.min !== undefined || job.experienceRequired?.max !== undefined) && (
          <span className="flex items-center gap-1 text-xs text-gray-500">
            <BriefcaseIcon className="w-3.5 h-3.5 text-gray-400" />
            {formatExperience(job.experienceRequired?.min, job.experienceRequired?.max)}
          </span>
        )}
      </div>

      {/* Description */}
      {job.description && (
        <p className="text-xs text-gray-500 leading-relaxed">
          {truncate(job.description, 120)}
        </p>
      )}

      {/* Skills */}
      {job.skillsRequired?.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {job.skillsRequired.slice(0, 4).map((skill) => (
            <span key={skill} className="badge-gray text-xs">{skill}</span>
          ))}
          {job.skillsRequired.length > 4 && (
            <span className="badge-gray text-xs">+{job.skillsRequired.length - 4}</span>
          )}
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between pt-1 border-t border-gray-50">
        <span className="text-xs text-gray-400">
          {formatRelativeDate(job.createdAt)}
        </span>
        {showApplyButton && (
          <Link
            to={`/jobs/${job._id}`}
            className="flex items-center gap-1.5 text-xs font-semibold text-green-600 hover:text-green-700 transition-colors group"
          >
            View & Apply
            <ArrowRightIcon className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
          </Link>
        )}
      </div>
    </motion.div>
  );
};

export default JobCard;
