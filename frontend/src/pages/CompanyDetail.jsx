import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BuildingIcon, MapPinIcon, BriefcaseIcon, DollarSignIcon, ClockIcon,
  ArrowLeftIcon, CheckCircleIcon, UsersIcon, EyeIcon, GlobeIcon,
  MailIcon, PhoneIcon, ExternalLinkIcon, SearchIcon, CalendarIcon,
  AwardIcon, SparklesIcon
} from 'lucide-react';
import { organizationService } from '../services/organization.service';
import { jobService } from '../services/job.service';
import { PageLoader } from '../components/Skeleton';
import JobCard from '../components/JobCard';
import useAuthStore from '../store/authStore';
import { getErrorMessage } from '../utils/helpers';
import toast from 'react-hot-toast';

const CompanyDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuthStore();

  const [company, setCompany] = useState(null);
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [jobsLoading, setJobsLoading] = useState(false);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [isFollowing, setIsFollowing] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);

  // Fetch company details
  const fetchCompanyDetails = async () => {
    try {
      const res = await organizationService.getOrganizationById(id);
      const orgData = res.data.data;
      setCompany(orgData);
      
      // Determine if logged-in user is following this company
      if (user && orgData.followers) {
        setIsFollowing(orgData.followers.includes(user._id));
      }
    } catch (err) {
      toast.error('Failed to load company profile');
      console.error(err);
      navigate('/companies');
    }
  };

  // Fetch company jobs
  const fetchCompanyJobs = async (keyword = '') => {
    setJobsLoading(true);
    try {
      const res = await jobService.getFilteredJobs({
        companyId: id,
        keyword: keyword,
        limit: 100 // fetch all matching jobs for the company
      });
      setJobs(res.data.data.jobs || []);
    } catch (err) {
      console.error('Failed to load company jobs', err);
    } finally {
      setJobsLoading(false);
    }
  };

  useEffect(() => {
    const initData = async () => {
      setLoading(true);
      await Promise.all([fetchCompanyDetails(), fetchCompanyJobs()]);
      setLoading(false);
    };
    initData();
  }, [id]);

  // Sync follow state when user changes
  useEffect(() => {
    if (user && company?.followers) {
      setIsFollowing(company.followers.includes(user._id));
    } else {
      setIsFollowing(false);
    }
  }, [user, company]);

  // Search jobs with delay/debounce simulation
  useEffect(() => {
    if (loading) return;
    const delayDebounce = setTimeout(() => {
      fetchCompanyJobs(searchKeyword);
    }, 400);

    return () => clearTimeout(delayDebounce);
  }, [searchKeyword]);

  const handleFollowToggle = async () => {
    if (!isAuthenticated) {
      toast.error('Please sign in to follow companies');
      navigate('/login');
      return;
    }

    setFollowLoading(true);
    try {
      if (isFollowing) {
        await organizationService.unfollowOrganization(id);
        setIsFollowing(false);
        setCompany((prev) => ({
          ...prev,
          followers: prev.followers.filter((fId) => fId !== user._id)
        }));
        toast.success(`Unfollowed ${company.name}`);
      } else {
        await organizationService.followOrganization(id);
        setIsFollowing(true);
        setCompany((prev) => ({
          ...prev,
          followers: [...(prev.followers || []), user._id]
        }));
        toast.success(`Following ${company.name}`);
      }
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setFollowLoading(false);
    }
  };

  if (loading) return <PageLoader />;
  if (!company) return null;

  // Check if company has any specifications details filled
  const hasDetailsFilled = company.companyDetails && (
    company.companyDetails.founded ||
    company.companyDetails.employeesCount ||
    company.companyDetails.revenue ||
    company.companyDetails.offices ||
    (company.companyDetails.headquarters && (
      company.companyDetails.headquarters.city ||
      company.companyDetails.headquarters.state ||
      company.companyDetails.headquarters.country
    ))
  );

  const hasIndividualDetailsFilled = company.individualDetails && (
    company.individualDetails.hiringFor
  );

  const hasContactInfo = company.email || company.phone || company.website;

  const hasSocialLinks = company.socialLinks && Object.values(company.socialLinks).some(Boolean);

  const hasAnySpec = hasDetailsFilled || hasIndividualDetailsFilled || hasContactInfo || hasSocialLinks || company.address;

  // Custom inline SVG icons for social media fallback
  const renderSocialIcon = (platform) => {
    switch (platform) {
      case 'linkedin':
        return (
          <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
            <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.779-1.75-1.75s.784-1.75 1.75-1.75 1.75.779 1.75 1.75-.784 1.75-1.75 1.75zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/>
          </svg>
        );
      case 'twitter':
        return (
          <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
            <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
          </svg>
        );
      case 'facebook':
        return (
          <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
            <path d="M9 8H7v3h2v9h3v-9h3.625L18 8h-3V6.125C12 6.125 12 7 12 8.5V8z"/>
          </svg>
        );
      case 'instagram':
        return (
          <svg className="w-5 h-5 fill-none stroke-current" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
            <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
            <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
            <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
          </svg>
        );
      default:
        return null;
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Back button */}
      <button onClick={() => navigate('/companies')} className="btn-ghost mb-6 -ml-2">
        <ArrowLeftIcon className="w-4 h-4" />
        Back to directory
      </button>

      {/* Hero Banner Area */}
      <div className="card overflow-hidden mb-8 relative border-none">
        {/* Cover banner image or fallback elegant CSS gradient */}
        <div className="h-48 md:h-64 relative bg-gradient-to-r from-green-500 via-emerald-500 to-teal-600">
          {company.coverImage?.url && (
            <img 
              src={company.coverImage.url} 
              alt={`${company.name} Cover`} 
              className="w-full h-full object-cover opacity-90"
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
        </div>

        {/* Profile Header Stats Overlay */}
        <div className="relative pt-12 md:pt-16 pb-8 px-6 md:px-8 bg-white">
          {/* Logo overlapping the cover */}
          <div className="absolute -top-16 left-6 md:left-8">
            <div className="w-24 h-24 md:w-32 md:h-32 bg-white rounded-3xl p-1 shadow-xl border-4 border-white overflow-hidden flex items-center justify-center">
              {company.logo?.url ? (
                <img src={company.logo.url} alt={company.name} className="w-full h-full object-cover rounded-2xl" />
              ) : (
                <BuildingIcon className="w-12 h-12 md:w-16 md:h-16 text-gray-300" />
              )}
            </div>
          </div>

          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mt-2 md:mt-0 pl-0 md:pl-36">
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">
                  {company.name}
                </h1>
                
                {company.verificationStatus === 'VERIFIED' && (
                  <span className="badge-green text-[10px] font-bold">
                    VERIFIED
                  </span>
                )}
                {company.verificationStatus === 'PENDING' && (
                  <span className="badge-amber text-[10px] font-bold">
                    PENDING AUDIT
                  </span>
                )}
                {company.organizationType && (
                  <span className="badge-blue text-[10px] font-bold uppercase">
                    {company.organizationType}
                  </span>
                )}
              </div>

              {company.tagline && (
                <p className="text-gray-500 font-medium italic text-sm md:text-base">
                  "{company.tagline}"
                </p>
              )}

              <div className="flex items-center gap-4 text-xs font-semibold text-gray-500">
                <span className="flex items-center gap-1">
                  <UsersIcon className="w-4 h-4 text-green-500" /> 
                  <strong className="text-gray-950">{company.followers?.length || 0}</strong> Followers
                </span>
                <span className="flex items-center gap-1">
                  <EyeIcon className="w-4 h-4 text-green-500" /> 
                  <strong className="text-gray-950">{company.views || 0}</strong> Profile Views
                </span>
                {company.industry && (
                  <span className="badge-gray">
                    {company.industry}
                  </span>
                )}
              </div>
            </div>

            {/* Follow / Unfollow Button */}
            <div className="w-full md:w-auto shrink-0 flex gap-2">
              <button
                onClick={handleFollowToggle}
                disabled={followLoading}
                className={`w-full md:w-44 py-3 rounded-xl font-bold text-sm shadow-sm transition-all duration-200 cursor-pointer flex items-center justify-center gap-2 ${
                  isFollowing
                    ? 'bg-gray-100 text-gray-700 hover:bg-red-50 hover:text-red-600 hover:border-red-200 border border-transparent'
                    : 'bg-green-600 hover:bg-green-700 text-white shadow-green-100'
                }`}
              >
                {followLoading ? (
                  <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                ) : isFollowing ? (
                  <>
                    <CheckCircleIcon className="w-4.5 h-4.5" />
                    Following
                  </>
                ) : (
                  <>
                    <UsersIcon className="w-4.5 h-4.5" />
                    Follow Company
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main content grid */}
      <div className="grid lg:grid-cols-3 gap-8">
        {/* Left Column: About & Jobs */}
        <div className="lg:col-span-2 space-y-8">
          {/* About Section */}
          <div className="card p-6 md:p-8">
            <h3 className="text-lg font-bold text-gray-900 mb-4 border-b pb-2.5">
              About the Company
            </h3>
            {company.description ? (
              <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-line">
                {company.description}
              </p>
            ) : (
              <div className="text-center py-6 text-gray-400 italic text-sm">
                No description provided by the company.
              </div>
            )}

            {/* Hashtags display */}
            {company.tags && company.tags.length > 0 && (
              <div className="mt-6 flex flex-wrap gap-2 pt-4 border-t border-gray-50">
                {company.tags.map((tag) => (
                  <span key={tag} className="text-xs font-semibold text-green-700 bg-green-50 px-2.5 py-1 rounded-lg border border-green-150">
                    #{tag}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Perks & Benefits Section */}
          {((company.culture && company.culture.length > 0) || (company.perks && company.perks.length > 0)) && (
            <div className="card p-6 md:p-8">
              <h3 className="text-lg font-bold text-gray-900 mb-5 flex items-center gap-2 border-b pb-2.5">
                <AwardIcon className="w-5 h-5 text-green-500" />
                Company Culture & Perks
              </h3>
              
              <div className="grid md:grid-cols-2 gap-6">
                {company.culture && company.culture.length > 0 && (
                  <div>
                    <h4 className="text-xs font-black text-gray-400 uppercase tracking-wider mb-3">
                      Core Culture Values
                    </h4>
                    <div className="flex flex-wrap gap-1.5">
                      {company.culture.map((val) => (
                        <span key={val} className="text-xs font-semibold bg-purple-50 text-purple-700 border border-purple-100 px-3 py-1 rounded-full">
                          {val}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {company.perks && company.perks.length > 0 && (
                  <div>
                    <h4 className="text-xs font-black text-gray-400 uppercase tracking-wider mb-3">
                      Workplace Perks & Benefits
                    </h4>
                    <div className="flex flex-wrap gap-1.5">
                      {company.perks.map((val) => (
                        <span key={val} className="text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-100 px-3 py-1 rounded-full">
                          {val}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Job Postings Section */}
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">
                  Open Positions
                </h2>
                <p className="text-xs text-gray-500 mt-1">
                  Discover career opportunities posted by {company.name}
                </p>
              </div>
              <div className="relative w-full sm:w-72">
                <SearchIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search jobs by title or skills..."
                  value={searchKeyword}
                  onChange={(e) => setSearchKeyword(e.target.value)}
                  className="input pl-10 py-2.5"
                />
              </div>
            </div>

            {jobsLoading ? (
              <div className="py-16 flex justify-center">
                <div className="w-8 h-8 border-3 border-green-500 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : jobs.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <AnimatePresence mode="popLayout">
                  {jobs.map((job) => (
                    <motion.div
                      key={job._id}
                      layout
                      initial={{ opacity: 0, scale: 0.98 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.98 }}
                      transition={{ duration: 0.2 }}
                    >
                      <JobCard job={job} showApplyButton={true} />
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            ) : (
              <div className="text-center py-16 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                <BriefcaseIcon className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <h4 className="font-bold text-gray-800">No jobs matching your search</h4>
                <p className="text-xs text-gray-500 mt-1">
                  We couldn't find any open positions. Try searching for other keywords.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Company Specs & Info */}
        <div className="space-y-8">
          {/* Specifications Box */}
          {hasAnySpec ? (
            <div className="card p-6 space-y-6">
              <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest border-b pb-2">
                Company Profile
              </h3>

              {/* Founded / Employee Size / Revenue / Offices */}
              {hasDetailsFilled && (
                <div className="space-y-4">
                  {company.companyDetails.founded && (
                    <div className="flex items-center gap-3">
                      <CalendarIcon className="w-4.5 h-4.5 text-gray-400 shrink-0" />
                      <div>
                        <p className="text-[10px] text-gray-400 font-bold uppercase">Founded Year</p>
                        <p className="text-sm font-semibold text-gray-800">{company.companyDetails.founded}</p>
                      </div>
                    </div>
                  )}

                  {company.companyDetails.employeesCount && (
                    <div className="flex items-center gap-3">
                      <UsersIcon className="w-4.5 h-4.5 text-gray-400 shrink-0" />
                      <div>
                        <p className="text-[10px] text-gray-400 font-bold uppercase">Company Size</p>
                        <p className="text-sm font-semibold text-gray-800">{company.companyDetails.employeesCount} Employees</p>
                      </div>
                    </div>
                  )}

                  {company.companyDetails.revenue && (
                    <div className="flex items-center gap-3">
                      <DollarSignIcon className="w-4.5 h-4.5 text-gray-400 shrink-0" />
                      <div>
                        <p className="text-[10px] text-gray-400 font-bold uppercase">Estimated Revenue</p>
                        <p className="text-sm font-semibold text-gray-800">{company.companyDetails.revenue}</p>
                      </div>
                    </div>
                  )}

                  {company.companyDetails.offices && (
                    <div className="flex items-center gap-3">
                      <BuildingIcon className="w-4.5 h-4.5 text-gray-400 shrink-0" />
                      <div>
                        <p className="text-[10px] text-gray-400 font-bold uppercase">Offices</p>
                        <p className="text-sm font-semibold text-gray-800">{company.companyDetails.offices} Locations</p>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Individual Hiring specifics */}
              {hasIndividualDetailsFilled && (
                <div className="space-y-4 border-t border-gray-50 pt-4">
                  {company.individualDetails.hiringFor && (
                    <div className="flex items-center gap-3">
                      <SparklesIcon className="w-4.5 h-4.5 text-gray-400 shrink-0" />
                      <div>
                        <p className="text-[10px] text-gray-400 font-bold uppercase">Hiring For</p>
                        <p className="text-sm font-semibold text-gray-800">{company.individualDetails.hiringFor}</p>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Headquarters Address */}
              {company.address && (company.address.street || company.address.city || company.address.country) && (
                <div className="border-t border-gray-50 pt-4">
                  <div className="flex items-start gap-3">
                    <MapPinIcon className="w-4.5 h-4.5 text-gray-400 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-[10px] text-gray-400 font-bold uppercase">Headquarters</p>
                      <p className="text-sm font-semibold text-gray-700 leading-relaxed">
                        {[
                          company.address.street,
                          company.address.city,
                          company.address.state,
                          company.address.country,
                          company.address.zipCode
                        ].filter(Boolean).join(', ')}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Contact Information */}
              {hasContactInfo && (
                <div className="space-y-4 border-t border-gray-50 pt-4">
                  {company.email && (
                    <div className="flex items-center gap-3">
                      <MailIcon className="w-4.5 h-4.5 text-gray-400 shrink-0" />
                      <div className="min-w-0">
                        <p className="text-[10px] text-gray-400 font-bold uppercase">Email Us</p>
                        <a href={`mailto:${company.email}`} className="text-sm font-semibold text-green-600 hover:underline truncate block">
                          {company.email}
                        </a>
                      </div>
                    </div>
                  )}

                  {company.phone && (
                    <div className="flex items-center gap-3">
                      <PhoneIcon className="w-4.5 h-4.5 text-gray-400 shrink-0" />
                      <div>
                        <p className="text-[10px] text-gray-400 font-bold uppercase">Call Us</p>
                        <p className="text-sm font-semibold text-gray-750">{company.phone}</p>
                      </div>
                    </div>
                  )}

                  {company.website && (
                    <a
                      href={company.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn-secondary w-full py-2.5 mt-2 justify-center flex items-center gap-2 text-xs font-bold"
                    >
                      <GlobeIcon className="w-4 h-4" />
                      Visit Website
                      <ExternalLinkIcon className="w-3.5 h-3.5" />
                    </a>
                  )}
                </div>
              )}

              {/* Social Channels */}
              {hasSocialLinks && (
                <div className="border-t border-gray-50 pt-4">
                  <p className="text-[10px] text-gray-400 font-bold uppercase mb-3">Connect With Us</p>
                  <div className="flex flex-wrap gap-2.5">
                    {Object.entries(company.socialLinks).map(([platform, link]) => {
                      if (!link) return null;
                      return (
                        <a
                          key={platform}
                          href={link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-2.5 bg-gray-50 hover:bg-green-50 border hover:border-green-300 rounded-xl transition-all text-gray-500 hover:text-green-600 flex items-center justify-center shadow-sm"
                          title={platform.charAt(0).toUpperCase() + platform.slice(1)}
                        >
                          {renderSocialIcon(platform)}
                        </a>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="card p-8 text-center text-gray-400 border-dashed border-2">
              <BuildingIcon className="w-10 h-10 text-gray-200 mx-auto mb-3" />
              <p className="text-xs italic leading-relaxed">
                No extra corporate details or contacts are currently registered for this company.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CompanyDetail;
