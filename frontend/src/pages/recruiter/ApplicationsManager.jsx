import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowLeftIcon, UserIcon, FileTextIcon, ExternalLinkIcon,
  CheckCircleIcon, XCircleIcon, ClockIcon, CalendarIcon,
} from 'lucide-react';
import { applicationService } from '../../services/application.service';
import { formatRelativeDate, getStatusBadgeClass, getErrorMessage } from '../../utils/helpers';
import { PageLoader } from '../../components/Skeleton';
import toast from 'react-hot-toast';

const STATUSES = ['shortlisted', 'interview', 'hired', 'rejected'];

const ApplicationsManager = () => {
  const { jobId } = useParams();
  const navigate = useNavigate();
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [updating, setUpdating] = useState(false);
  const [interviewModal, setInterviewModal] = useState(false);
  const [interviewData, setInterviewData] = useState({ scheduledAt: '', mode: 'online', meetingLink: '' });

  useEffect(() => {
    const fetch = async () => {
      if (!jobId) return;
      try {
        const res = await applicationService.getJobApplications(jobId);
        setApplications(res.data.data || []);
      } catch (err) {
        toast.error(getErrorMessage(err));
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [jobId]);

  const updateStatus = async (appId, status) => {
    setUpdating(true);
    try {
      const res = await applicationService.updateApplicationStatus(appId, { status });
      setApplications((prev) =>
        prev.map((a) => (a._id === appId ? { ...a, status } : a))
      );
      if (selected?._id === appId) setSelected((prev) => ({ ...prev, status }));
      toast.success(`Status updated to ${status}`);
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setUpdating(false);
    }
  };

  const scheduleInterview = async (appId) => {
    setUpdating(true);
    try {
      await applicationService.scheduleInterview(appId, interviewData);
      setApplications((prev) =>
        prev.map((a) => a._id === appId ? { ...a, status: 'interview', interview: interviewData } : a)
      );
      setInterviewModal(false);
      toast.success('Interview scheduled!');
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setUpdating(false);
    }
  };

  if (loading) return <PageLoader />;

  return (
    <div>
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
        <button onClick={() => navigate('/recruiter')} className="btn-ghost mb-4 -ml-2">
          <ArrowLeftIcon className="w-4 h-4" />
          Back to Dashboard
        </button>
        <div className="flex items-center justify-between">
          <h1 className="section-title">Applications</h1>
          <span className="badge-gray">{applications.length} total</span>
        </div>
      </motion.div>

      {applications.length === 0 ? (
        <div className="card p-16 text-center">
          <FileTextIcon className="w-12 h-12 text-gray-200 mx-auto mb-3" />
          <p className="text-gray-500">No applications received yet</p>
        </div>
      ) : (
        <div className="grid lg:grid-cols-5 gap-6">
          {/* Application list */}
          <div className="lg:col-span-2 space-y-2">
            {applications.map((app, i) => (
              <motion.button
                key={app._id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                onClick={() => setSelected(app)}
                className={`w-full card p-4 text-left flex items-start gap-3 transition-all ${
                  selected?._id === app._id ? 'border-2 border-green-400 bg-green-50' : 'hover:border-gray-300'
                }`}
              >
                <div className="w-9 h-9 bg-gray-100 rounded-xl flex items-center justify-center flex-shrink-0">
                  <UserIcon className="w-4 h-4 text-gray-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm text-gray-900 truncate">
                    {app.applicantSnapshot?.fullName}
                  </p>
                  <p className="text-xs text-gray-500 truncate">{app.applicantSnapshot?.email}</p>
                  <p className="text-xs text-gray-400 mt-1">{formatRelativeDate(app.appliedAt)}</p>
                </div>
                <span className={`${getStatusBadgeClass(app.status)} capitalize text-[10px] flex-shrink-0`}>
                  {app.status}
                </span>
              </motion.button>
            ))}
          </div>

          {/* Application detail */}
          <div className="lg:col-span-3">
            {selected ? (
              <motion.div
                key={selected._id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="card p-6 sticky top-20"
              >
                {/* Applicant header */}
                <div className="flex items-start gap-4 mb-6 pb-5 border-b border-gray-100">
                  <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center flex-shrink-0">
                    <UserIcon className="w-6 h-6 text-green-600" />
                  </div>
                  <div className="flex-1">
                    <h2 className="font-bold text-gray-900">{selected.applicantSnapshot?.fullName}</h2>
                    <p className="text-sm text-gray-500">{selected.applicantSnapshot?.email}</p>
                    {selected.applicantSnapshot?.phone && (
                      <p className="text-sm text-gray-500">{selected.applicantSnapshot.phone}</p>
                    )}
                  </div>
                  <span className={`${getStatusBadgeClass(selected.status)} capitalize`}>{selected.status}</span>
                </div>

                {/* Resume */}
                {selected.resume?.url && (
                  <div className="mb-5">
                    <a
                      href={selected.resume.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn-secondary inline-flex text-sm"
                    >
                      <FileTextIcon className="w-4 h-4" />
                      View Resume
                      <ExternalLinkIcon className="w-3.5 h-3.5" />
                    </a>
                  </div>
                )}

                {/* Answers */}
                {selected.answers?.length > 0 && (
                  <div className="mb-5">
                    <h3 className="font-semibold text-sm text-gray-900 mb-3">Screening Answers</h3>
                    <div className="space-y-3">
                      {selected.answers.map((a, i) => (
                        <div key={i} className="p-3 bg-gray-50 rounded-xl">
                          <p className="text-xs text-gray-500 mb-1">{a.question}</p>
                          <p className="text-sm font-medium text-gray-900">{String(a.answer)}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Status actions */}
                <div>
                  <h3 className="font-semibold text-sm text-gray-900 mb-3">Update Status</h3>
                  <div className="flex flex-wrap gap-2 mb-4">
                    {STATUSES.map((s) => (
                      <button
                        key={s}
                        onClick={() => updateStatus(selected._id, s)}
                        disabled={updating || selected.status === s}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all capitalize ${
                          selected.status === s
                            ? 'bg-green-500 text-white'
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        } disabled:opacity-50`}
                      >
                        {s}
                      </button>
                    ))}
                  </div>

                  <button
                    onClick={() => setInterviewModal(true)}
                    className="btn-secondary text-sm w-full justify-center"
                  >
                    <CalendarIcon className="w-4 h-4" />
                    Schedule Interview
                  </button>
                </div>

                {/* Status history */}
                {selected.statusHistory?.length > 0 && (
                  <div className="mt-5 pt-5 border-t border-gray-100">
                    <h3 className="font-semibold text-sm text-gray-900 mb-3">Timeline</h3>
                    <div className="space-y-2">
                      {selected.statusHistory.map((h, i) => (
                        <div key={i} className="flex items-center gap-2 text-xs text-gray-500">
                          <span className="w-1.5 h-1.5 bg-green-400 rounded-full" />
                          <span className="capitalize font-medium text-gray-700">{h.status}</span>
                          <span>· {formatRelativeDate(h.changedAt)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </motion.div>
            ) : (
              <div className="card p-16 text-center">
                <UserIcon className="w-12 h-12 text-gray-200 mx-auto mb-3" />
                <p className="text-gray-500">Select an applicant to review</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Interview Modal */}
      {interviewModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl"
          >
            <h3 className="font-bold text-gray-900 mb-4">Schedule Interview</h3>
            <div className="space-y-4">
              <div>
                <label className="label">Date & Time</label>
                <input
                  type="datetime-local"
                  className="input"
                  value={interviewData.scheduledAt}
                  onChange={(e) => setInterviewData((p) => ({ ...p, scheduledAt: e.target.value }))}
                />
              </div>
              <div>
                <label className="label">Mode</label>
                <select
                  className="input"
                  value={interviewData.mode}
                  onChange={(e) => setInterviewData((p) => ({ ...p, mode: e.target.value }))}
                >
                  <option value="online">Online</option>
                  <option value="offline">In-person</option>
                </select>
              </div>
              {interviewData.mode === 'online' && (
                <div>
                  <label className="label">Meeting Link</label>
                  <input
                    type="url"
                    className="input"
                    placeholder="https://meet.google.com/..."
                    value={interviewData.meetingLink}
                    onChange={(e) => setInterviewData((p) => ({ ...p, meetingLink: e.target.value }))}
                  />
                </div>
              )}
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setInterviewModal(false)} className="btn-secondary flex-1">Cancel</button>
              <button
                onClick={() => scheduleInterview(selected._id)}
                disabled={updating || !interviewData.scheduledAt}
                className="btn-primary flex-1 justify-center"
              >
                {updating ? 'Scheduling...' : 'Schedule'}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default ApplicationsManager;
