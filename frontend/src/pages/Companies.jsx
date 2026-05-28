import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  BuildingIcon, SearchIcon, UsersIcon, 
  EyeIcon, SparklesIcon, ChevronRightIcon,
  CheckCircleIcon, MapPinIcon
} from 'lucide-react';
import api from '../services/api';
import { organizationService } from '../services/organization.service';
import useAuthStore from '../store/authStore';
import { getErrorMessage } from '../utils/helpers';
import { PageLoader } from '../components/Skeleton';
import toast from 'react-hot-toast';

const categories = [
  'All', 'MNC', 'Service Based', 'Product Based', 'Startup', 
  'IT Services', 'Finance', 'Healthcare', 'Education'
];

const Companies = () => {
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuthStore();
  const [companies, setCompanies] = useState([]);
  const [recommended, setRecommended] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('All');
  const [search, setSearch] = useState('');
  const [view, setView] = useState('all'); // 'all' or 'recommended'
  const [followLoadingId, setFollowLoadingId] = useState(null);

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

  const handleFollowClick = async (e, company) => {
    e.preventDefault();
    e.stopPropagation();

    if (!isAuthenticated) {
      toast.error('Please sign in to follow companies');
      navigate('/login');
      return;
    }

    const isFollowing = company.followers?.includes(user?._id);
    setFollowLoadingId(company._id);

    try {
      if (isFollowing) {
        await organizationService.unfollowOrganization(company._id);
        toast.success(`Unfollowed ${company.name}`);
      } else {
        await organizationService.followOrganization(company._id);
        toast.success(`Following ${company.name}`);
      }

      const toggleFollowInList = (list) =>
        list.map((c) => {
          if (c._id === company._id) {
            const newFollowers = isFollowing
              ? c.followers.filter((id) => id !== user._id)
              : [...(c.followers || []), user._id];
            return { ...c, followers: newFollowers };
          }
          return c;
        });

      setCompanies((prev) => toggleFollowInList(prev));
      setRecommended((prev) => toggleFollowInList(prev));
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setFollowLoadingId(null);
    }
  };

  const activeList = view === 'all' ? companies : recommended;

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
            {activeList.map((company, index) => {
              const following = company.followers?.includes(user?._id);
              return (
                <motion.div
                  key={company._id}
                  layout
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ duration: 0.2, delay: index * 0.05 }}
                  className="group card hover:shadow-xl hover:-translate-y-1 transition-all duration-300 overflow-hidden flex flex-col justify-between"
                >
                  <div>
                    {/* Cover banner at top of the card */}
                    <div className="h-24 relative overflow-hidden bg-gradient-to-r from-green-500/10 to-emerald-600/10">
                      {company.coverImage?.url ? (
                        <img 
                          src={company.coverImage.url} 
                          alt="" 
                          className="w-full h-full object-cover opacity-80" 
                        />
                      ) : (
                        <div className="absolute inset-0 bg-gradient-to-tr from-green-500/5 to-teal-500/10" />
                      )}

                      {/* Floating follow button on banner */}
                      <button
                        onClick={(e) => handleFollowClick(e, company)}
                        disabled={followLoadingId === company._id}
                        className={`absolute top-3 right-3 p-1.5 rounded-full shadow-sm transition-all duration-200 cursor-pointer flex items-center justify-center border ${
                          following
                            ? 'bg-green-50 text-green-700 border-green-200'
                            : 'bg-white/90 text-gray-700 hover:bg-white border-gray-100'
                        }`}
                        title={following ? 'Following' : 'Follow company'}
                      >
                        {followLoadingId === company._id ? (
                          <span className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                        ) : following ? (
                          <CheckCircleIcon className="w-3.5 h-3.5" />
                        ) : (
                          <UsersIcon className="w-3.5 h-3.5" />
                        )}
                        <span className="sr-only">{following ? 'Following' : 'Follow'}</span>
                      </button>
                    </div>

                    {/* Content Section */}
                    <div className="px-6 pb-4 relative flex-1">
                      {/* Overlapping avatar */}
                      <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center border border-gray-150 overflow-hidden group-hover:border-green-200 transition-colors shadow-sm -mt-8 relative z-10">
                        {company.logo?.url ? (
                          <img src={company.logo.url} alt={company.name} className="w-full h-full object-cover" />
                        ) : (
                          <BuildingIcon className="w-8 h-8 text-gray-300" />
                        )}
                      </div>

                      <div className="mt-3">
                        <Link to={`/companies/${company._id}`} className="block">
                          <h3 className="text-xl font-bold text-gray-900 group-hover:text-green-700 transition-colors leading-snug">
                            {company.name}
                          </h3>
                        </Link>
                        
                        {/* Company specifications sub-bar */}
                        <div className="flex flex-wrap gap-1.5 mt-2 mb-3">
                          {company.address?.city && (
                            <span className="badge-gray text-[10px] py-0.5 px-2 bg-gray-50 text-gray-500 border border-gray-100 flex items-center gap-0.5">
                              <MapPinIcon className="w-2.5 h-2.5" /> {company.address.city}
                            </span>
                          )}
                          {company.companyDetails?.employeesCount && (
                            <span className="badge-gray text-[10px] py-0.5 px-2 bg-gray-50 text-gray-500 border border-gray-100">
                              {company.companyDetails.employeesCount} Employees
                            </span>
                          )}
                          <span className="badge-blue text-[10px] py-0.5 px-2 uppercase font-bold tracking-wider">
                            {company.industry || 'Tech'}
                          </span>
                        </div>

                        <p className="text-sm text-gray-500 line-clamp-2 h-10 mb-4 leading-relaxed">
                          {company.tagline || 'Leading the future of innovation and technology.'}
                        </p>

                        {/* Hashtags display */}
                        {company.tags && company.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1.5 mb-2">
                            {company.tags.slice(0, 3).map((tag) => (
                              <span key={tag} className="text-[10px] font-semibold text-green-700 bg-green-50/40 border border-green-100/70 px-2 py-0.5 rounded">
                                #{tag}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Card Footer */}
                  <div className="px-6 py-4 border-t border-gray-50 bg-gray-50/20 flex items-center justify-between shrink-0">
                    <div className="flex items-center gap-3 text-xs text-gray-400 font-medium">
                      <span className="flex items-center gap-1" title="Followers">
                        <UsersIcon className="w-3.5 h-3.5 text-green-500" /> {company.followers?.length || 0}
                      </span>
                      <span className="flex items-center gap-1" title="Views">
                        <EyeIcon className="w-3.5 h-3.5 text-green-500" /> {company.views || 0}
                      </span>
                    </div>
                    <Link
                      to={`/companies/${company._id}`}
                      className="text-xs font-bold text-green-600 flex items-center gap-1 group-hover:gap-2 transition-all hover:text-green-700"
                    >
                      View Profile <ChevronRightIcon className="w-4 h-4" />
                    </Link>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}

      {/* Empty State */}
      {!loading && activeList.length === 0 && (
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
