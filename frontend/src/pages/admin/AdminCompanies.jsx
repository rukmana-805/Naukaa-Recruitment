import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BuildingIcon,
  SearchIcon,
  CheckCircleIcon,
  XCircleIcon,
  AlertCircleIcon,
  TrashIcon,
  EyeIcon,
  ExternalLinkIcon,
  UsersIcon,
  BriefcaseIcon,
  MailIcon,
  PhoneIcon,
  FileTextIcon,
  XIcon
} from 'lucide-react';
import { adminService } from '../../services/admin.service';
import { getStatusBadgeClass } from '../../utils/helpers';
import toast from 'react-hot-toast';

const AdminCompanies = () => {
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState(''); // '' (All), 'COMPANY', 'INDIVIDUAL'
  const [statusFilter, setStatusFilter] = useState(''); // '' (All), 'PENDING', 'VERIFIED', 'REJECTED'
  const [planFilter, setPlanFilter] = useState(''); // '' (All), 'subscribed', 'unsubscribed'
  const navigate = useNavigate();

  // Fetch all companies based on filters
  const fetchCompanies = async () => {
    setLoading(true);
    try {
      const params = {};
      if (typeFilter) params.type = typeFilter;
      if (statusFilter) params.verificationStatus = statusFilter;
      if (planFilter) params.plan = planFilter;
      if (searchQuery) params.search = searchQuery;

      const res = await adminService.getCompanies(params);
      setCompanies(res.data.data || []);
    } catch (err) {
      toast.error('Failed to fetch companies');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCompanies();
  }, [typeFilter, statusFilter, planFilter]);

  // Handle manual search form submit
  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchCompanies();
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-black text-gray-900 tracking-tight">Audit Organizations</h1>
        <p className="text-gray-500 mt-1">Audit company profiles, review licensing credentials, and manage job pipelines.</p>
      </div>

      {/* Filters Area */}
      <div className="card p-6 space-y-4">
        <form onSubmit={handleSearchSubmit} className="flex gap-2">
          <div className="relative flex-1">
            <SearchIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search organizations by name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-gray-50 border-none rounded-xl pl-10 pr-4 py-3 text-sm focus:ring-2 focus:ring-green-500 outline-none transition-all"
            />
          </div>
          <button type="submit" className="btn-primary py-3">
            Search
          </button>
        </form>

        <div className="flex flex-wrap items-center justify-between gap-4 pt-2 border-t border-gray-50">
          {/* Classification Tabs */}
          <div className="flex bg-gray-100 p-1 rounded-xl">
            <button
              onClick={() => setTypeFilter('')}
              className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
                typeFilter === '' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-900'
              }`}
            >
              All Types
            </button>
            <button
              onClick={() => setTypeFilter('COMPANY')}
              className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
                typeFilter === 'COMPANY' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-900'
              }`}
            >
              Big Companies
            </button>
            <button
              onClick={() => setTypeFilter('INDIVIDUAL')}
              className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
                typeFilter === 'INDIVIDUAL' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-900'
              }`}
            >
              Individuals
            </button>
          </div>

          {/* Dropdown Filters */}
          <div className="flex items-center gap-3">
            <div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="bg-gray-50 border-none rounded-xl text-xs font-bold px-3 py-2 focus:ring-2 focus:ring-green-500 outline-none cursor-pointer"
              >
                <option value="">All Verification States</option>
                <option value="PENDING">Pending Approval</option>
                <option value="VERIFIED">Verified Profiles</option>
                <option value="REJECTED">Rejected Registry</option>
              </select>
            </div>

            <div>
              <select
                value={planFilter}
                onChange={(e) => setPlanFilter(e.target.value)}
                className="bg-gray-50 border-none rounded-xl text-xs font-bold px-3 py-2 focus:ring-2 focus:ring-green-500 outline-none cursor-pointer"
              >
                <option value="">All Plan States</option>
                <option value="subscribed">Subscribed / Premium</option>
                <option value="unsubscribed">Unsubscribed / Free</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Directory Grid */}
      {loading ? (
        <div className="py-24 flex justify-center">
          <div className="w-10 h-10 border-4 border-green-600 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {companies.map((company) => (
            <motion.div
              key={company._id}
              whileHover={{ y: -4 }}
              onClick={() => navigate(`/admin/companies/${company._id}`)}
              className="card p-6 flex flex-col justify-between hover:shadow-md transition-all cursor-pointer border-transparent hover:border-green-100"
            >
              <div>
                <div className="flex justify-between items-start gap-4 mb-4">
                  <div className="w-14 h-14 bg-gray-50 rounded-2xl p-1 shadow-xs border border-gray-100 overflow-hidden shrink-0">
                    {company.logo?.url ? (
                      <img src={company.logo.url} className="w-full h-full object-cover rounded-xl" />
                    ) : (
                      <BuildingIcon className="w-full h-full p-2.5 text-gray-300" />
                    )}
                  </div>

                  <div className="flex flex-col items-end gap-1.5">
                    <span className={company.verificationStatus === 'VERIFIED' ? 'badge-green' : company.verificationStatus === 'PENDING' ? 'badge-amber' : 'badge-red'}>
                      {company.verificationStatus}
                    </span>
                    {company.subscription?.isActive ? (
                      <span className="badge-purple">PREMIUM</span>
                    ) : (
                      <span className="badge-gray">FREE</span>
                    )}
                  </div>
                </div>

                <h3 className="font-black text-gray-900 leading-tight mb-1 group-hover:text-green-600 transition-colors">
                  {company.name}
                </h3>
                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-3">
                  {company.organizationType} • {company.industry || 'General Recruitment'}
                </p>
                <p className="text-xs text-gray-500 line-clamp-2 leading-relaxed">
                  {company.tagline || 'No tagline description set.'}
                </p>
              </div>

              <div className="border-t border-gray-50 mt-6 pt-4 flex items-center justify-between text-xs text-gray-400">
                <span>Owner: {company.owner?.fullName || 'N/A'}</span>
                <span className="text-green-600 font-bold flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                  Audit <EyeIcon className="w-3.5 h-3.5" />
                </span>
              </div>
            </motion.div>
          ))}

          {companies.length === 0 && (
            <div className="col-span-full card p-16 text-center text-gray-400">
              <BuildingIcon className="w-12 h-12 mx-auto text-gray-200 mb-3" />
              <p className="text-sm font-medium">No organizations found matching the selected filters.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AdminCompanies;
