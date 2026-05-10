import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  BuildingIcon, SearchIcon, FilterIcon, UsersIcon, 
  EyeIcon, SparklesIcon, ChevronRightIcon 
} from 'lucide-react';
import api from '../services/api';
import useAuthStore from '../store/authStore';
import { getErrorMessage } from '../utils/helpers';
import { PageLoader } from '../components/Skeleton';
import toast from 'react-hot-toast';

const categories = [
  'All', 'MNC', 'Service Based', 'Product Based', 'Startup', 
  'IT Services', 'Finance', 'Healthcare', 'Education'
];

const Companies = () => {
  const { isAuthenticated } = useAuthStore();
  const [companies, setCompanies] = useState([]);
  const [recommended, setRecommended] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('All');
  const [search, setSearch] = useState('');
  const [view, setView] = useState('all'); // 'all' or 'recommended'

  const fetchCompanies = async () => {
    setLoading(true);
    try {
      const industry = activeTab === 'All' ? '' : activeTab;
      const res = await api.get(`/organizations/all?industry=${industry}&search=${search}`);
      setCompanies(res.data.data || []);
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const fetchRecommended = async () => {
    if (!isAuthenticated) return;
    setLoading(true);
    try {
      const res = await api.get('/organizations/recommended');
      setRecommended(res.data.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (view === 'all') {
      fetchCompanies();
    } else {
      fetchRecommended();
    }
  }, [activeTab, search, view]);

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header Section */}
      <div className="mb-10 text-center">
        <motion.h1 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-4xl font-extrabold text-gray-900 mb-4"
        >
          Explore Top <span className="text-green-600">Companies</span>
        </motion.h1>
        <p className="text-gray-500 max-w-2xl mx-auto">
          Discover your next workplace from 500+ top companies and startups. 
          Filter by industry or view personalized recommendations.
        </p>
      </div>

      {/* Tabs & Search */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-8">
        <div className="flex bg-gray-100 p-1 rounded-xl w-full md:w-auto">
          <button 
            onClick={() => setView('all')}
            className={`flex-1 md:w-32 py-2 text-sm font-medium rounded-lg transition-all ${view === 'all' ? 'bg-white text-green-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
          >
            All Companies
          </button>
          {isAuthenticated && (
            <button 
              onClick={() => setView('recommended')}
              className={`flex-1 md:w-36 py-2 text-sm font-medium rounded-lg flex items-center justify-center gap-2 transition-all ${view === 'recommended' ? 'bg-white text-green-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
            >
              <SparklesIcon className="w-4 h-4" />
              For You
            </button>
          )}
        </div>

        <div className="relative w-full md:w-96">
          <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input 
            type="text"
            placeholder="Search by company name..."
            className="input pl-10"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Categories Filter (Only in All view) */}
      {view === 'all' && (
        <div className="flex flex-wrap gap-2 mb-8 overflow-x-auto pb-2 scrollbar-hide">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveTab(cat)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium border transition-all whitespace-nowrap ${
                activeTab === cat 
                ? 'bg-green-600 border-green-600 text-white' 
                : 'bg-white border-gray-200 text-gray-600 hover:border-green-400'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      )}

      {/* Content */}
      {loading ? (
        <PageLoader />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <AnimatePresence mode="popLayout">
            {(view === 'all' ? companies : recommended).map((company, index) => (
              <motion.div
                key={company._id}
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.2, delay: index * 0.05 }}
                className="group card hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
              >
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center border border-gray-100 overflow-hidden group-hover:border-green-200 transition-colors">
                      {company.logo?.url ? (
                        <img src={company.logo.url} alt={company.name} className="w-full h-full object-cover" />
                      ) : (
                        <BuildingIcon className="w-8 h-8 text-gray-300" />
                      )}
                    </div>
                    <div className="flex flex-col items-end">
                      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">
                        {company.industry || 'Tech'}
                      </span>
                      <div className="flex items-center gap-1.5 text-xs text-green-600 font-semibold bg-green-50 px-2 py-0.5 rounded-full">
                        <UsersIcon className="w-3 h-3" />
                        {company.followers?.length || 0}
                      </div>
                    </div>
                  </div>

                  <h3 className="text-xl font-bold text-gray-900 mb-1 group-hover:text-green-700 transition-colors">
                    {company.name}
                  </h3>
                  <p className="text-sm text-gray-500 line-clamp-2 mb-6 h-10">
                    {company.tagline || 'Leading the future of innovation and technology.'}
                  </p>

                  <div className="flex items-center justify-between pt-4 border-t border-gray-50">
                    <div className="flex items-center gap-3 text-xs text-gray-400 font-medium">
                      <span className="flex items-center gap-1">
                        <EyeIcon className="w-3 h-3" /> {company.views || 0}
                      </span>
                    </div>
                    <button 
                      onClick={() => toast('Redirecting to company profile...')}
                      className="text-sm font-bold text-green-600 flex items-center gap-1 group-hover:gap-2 transition-all"
                    >
                      View Profile <ChevronRightIcon className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Empty State */}
      {!loading && (view === 'all' ? companies : recommended).length === 0 && (
        <div className="text-center py-20 bg-gray-50 rounded-3xl border-2 border-dashed border-gray-200 mt-8">
          <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm border border-gray-100">
            <BuildingIcon className="w-10 h-10 text-gray-200" />
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">No companies found</h3>
          <p className="text-gray-500">Try adjusting your filters or search query.</p>
        </div>
      )}
    </div>
  );
};

export default Companies;
