import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { FileTextIcon, XCircleIcon, ClockIcon, CheckCircleIcon, BriefcaseIcon } from 'lucide-react';
import { applicationService } from '../services/application.service';
import { formatRelativeDate, getStatusBadgeClass, getErrorMessage } from '../utils/helpers';
import { PageLoader } from '../components/Skeleton';
import toast from 'react-hot-toast';

const statusSteps = ['applied', 'reviewing', 'shortlisted', 'interview', 'hired'];

const Applications = () => {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    const fetch = async () => {
      try {
        const res = await applicationService.getMyApplications();
        setApplications(res.data.data || []);
      } catch (err) {
        toast.error(getErrorMessage(err));
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, []);

  const handleWithdraw = async (id) => {
    if (!window.confirm('Withdraw this application?')) return;
    try {
      await applicationService.withdrawApplication(id);
      setApplications((prev) => prev.filter((a) => a._id !== id));
      toast.success('Application withdrawn');
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  const filtered = filter === 'all' ? applications : applications.filter((a) => a.status === filter);

  const statusCounts = applications.reduce((acc, a) => {
    acc[a.status] = (acc[a.status] || 0) + 1;
    return acc;
  }, {});

  if (loading) return <PageLoader />;

  return (
    <div>
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
        <h1 className="section-title">My Applications</h1>
        <p className="text-gray-500 mt-1">{applications.length} total applications</p>
      </motion.div>

      {/* Summary stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        {[
          { label: 'Total', value: applications.length, color: 'text-gray-700' },
          { label: 'Shortlisted', value: statusCounts.shortlisted || 0, color: 'text-green-600' },
          { label: 'Interviews', value: statusCounts.interview || 0, color: 'text-purple-600' },
          { label: 'Hired', value: statusCounts.hired || 0, color: 'text-green-700' },
        ].map((s) => (
          <div key={s.label} className="card p-4 text-center">
            <div className={`text-2xl font-bold ${s.color}`}>{s.value}</div>
            <div className="text-xs text-gray-500 mt-0.5">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2 mb-4">
        {['all', 'applied', 'reviewing', 'shortlisted', 'interview', 'hired', 'rejected'].map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`px-4 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all ${
              filter === s
                ? 'bg-green-500 text-white shadow-sm'
                : 'bg-white border border-gray-200 text-gray-600 hover:border-green-400'
            }`}
          >
            {s === 'all' ? 'All' : s.charAt(0).toUpperCase() + s.slice(1)}
            {s !== 'all' && statusCounts[s] ? ` (${statusCounts[s]})` : ''}
          </button>
        ))}
      </div>

      {/* Applications list */}
      {filtered.length === 0 ? (
        <div className="text-center py-16">
          <FileTextIcon className="w-12 h-12 text-gray-200 mx-auto mb-3" />
          <p className="text-gray-500">No applications {filter !== 'all' ? `with status "${filter}"` : 'yet'}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((app, i) => (
            <motion.div
              key={app._id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="card p-5"
            >
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center shrink-0">
                  <BriefcaseIcon className="w-5 h-5 text-green-600" />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2 flex-wrap">
                    <div>
                      <h3 className="font-semibold text-gray-900">
                        {app.jobSnapshot?.title || 'Job'}
                      </h3>
                      <p className="text-sm text-gray-500 mt-0.5">
                        {app.jobSnapshot?.companyName}
                        {app.jobSnapshot?.location && ` · ${app.jobSnapshot.location}`}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`${getStatusBadgeClass(app.status)} capitalize`}>
                        {app.status}
                      </span>
                      {app.status !== 'hired' && app.status !== 'rejected' && (
                        <button
                          onClick={() => handleWithdraw(app._id)}
                          className="text-xs text-red-500 hover:text-red-600 hover:bg-red-50 px-2 py-1 rounded-lg transition-colors"
                        >
                          Withdraw
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Progress bar */}
                  {app.status !== 'rejected' && (
                    <div className="mt-4">
                      <div className="flex items-center">
                        {statusSteps.map((step, idx) => {
                          const currentIdx = statusSteps.indexOf(app.status);
                          const isCompleted = idx <= currentIdx;
                          const isActive = idx === currentIdx;
                          return (
                            <div key={step} className="flex items-center flex-1 last:flex-none">
                              <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 transition-all ${
                                isCompleted ? 'bg-green-500' : 'bg-gray-200'
                              }`}>
                                {isCompleted && (
                                  <CheckCircleIcon className="w-3 h-3 text-white" />
                                )}
                              </div>
                              {idx < statusSteps.length - 1 && (
                                <div className={`h-0.5 flex-1 mx-1 transition-all ${
                                  idx < currentIdx ? 'bg-green-400' : 'bg-gray-200'
                                }`} />
                              )}
                            </div>
                          );
                        })}
                      </div>
                      <div className="flex justify-between mt-1">
                        {statusSteps.map((step) => (
                          <span key={step} className="text-[10px] text-gray-400 capitalize">{step}</span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Interview details */}
                  {app.interview?.scheduledAt && (
                    <div className="mt-3 p-3 bg-green-50 rounded-lg border border-green-100">
                      <p className="text-xs font-semibold text-green-700 flex items-center gap-1.5">
                        <ClockIcon className="w-3.5 h-3.5" />
                        Interview Scheduled
                      </p>
                      <p className="text-xs text-green-600 mt-0.5">
                        {new Date(app.interview.scheduledAt).toLocaleString('en-IN')}
                        {app.interview.mode && ` · ${app.interview.mode}`}
                        {app.interview.meetingLink && (
                          <a href={app.interview.meetingLink} target="_blank" rel="noopener noreferrer" className="ml-2 underline">
                            Join
                          </a>
                        )}
                      </p>
                    </div>
                  )}

                  <p className="text-xs text-gray-400 mt-2">
                    Applied {formatRelativeDate(app.appliedAt)}
                  </p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Applications;
