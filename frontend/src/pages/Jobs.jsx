import { useEffect, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { SearchIcon, FilterIcon, XIcon, MapPinIcon, ChevronLeftIcon, ChevronRightIcon } from 'lucide-react';
import { jobService } from '../services/job.service';
import { getErrorMessage } from '../utils/helpers';
import { EMPLOYMENT_TYPES, POPULAR_LOCATIONS, POPULAR_SKILLS } from '../utils/constants';
import JobCard from '../components/JobCard';
import { JobCardSkeleton } from '../components/Skeleton';
import toast from 'react-hot-toast';

const Jobs = () => {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [showFilters, setShowFilters] = useState(false);

  const [filters, setFilters] = useState({
    keyword: '',
    location: '',
    employmentType: '',
    skills: '',
    minSalary: '',
    maxSalary: '',
    experience: '',
  });

  const [activeFilters, setActiveFilters] = useState({});

  const fetchJobs = useCallback(async (params = {}, pg = 1) => {
    setLoading(true);
    try {
      const res = await jobService.getFilteredJobs({ ...params, page: pg, limit: 9 });
      const d = res.data.data;
      setJobs(d.jobs || []);
      setTotal(d.total || 0);
      setPages(d.pages || 1);
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchJobs(activeFilters, page);
  }, [activeFilters, page, fetchJobs]);

  const handleSearch = (e) => {
    e.preventDefault();
    const clean = Object.fromEntries(
      Object.entries(filters).filter(([, v]) => v !== '')
    );
    setActiveFilters(clean);
    setPage(1);
  };

  const clearFilter = (key) => {
    const newFilters = { ...activeFilters };
    delete newFilters[key];
    setActiveFilters(newFilters);
    setFilters((prev) => ({ ...prev, [key]: '' }));
    setPage(1);
  };

  const clearAll = () => {
    setActiveFilters({});
    setFilters({ keyword: '', location: '', employmentType: '', skills: '', minSalary: '', maxSalary: '', experience: '' });
    setPage(1);
  };

  const activeFilterKeys = Object.keys(activeFilters);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
        <h1 className="section-title">Browse Jobs</h1>
        <p className="text-gray-500 mt-1">{total > 0 ? `${total} opportunities available` : 'Find your next opportunity'}</p>
      </motion.div>

      {/* Search bar */}
      <form onSubmit={handleSearch} className="mb-4">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <SearchIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search jobs, skills, company..."
              value={filters.keyword}
              onChange={(e) => setFilters((p) => ({ ...p, keyword: e.target.value }))}
              className="input pl-10 h-11"
            />
          </div>
          <div className="relative hidden sm:block">
            <MapPinIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Location"
              value={filters.location}
              onChange={(e) => setFilters((p) => ({ ...p, location: e.target.value }))}
              className="input pl-9 h-11 w-40"
            />
          </div>
          <button type="submit" className="btn-primary h-11 px-6">
            Search
          </button>
          <button
            type="button"
            onClick={() => setShowFilters(!showFilters)}
            className={`btn-secondary h-11 px-4 ${showFilters ? 'border-green-400 text-green-600' : ''}`}
          >
            <FilterIcon className="w-4 h-4" />
            <span className="hidden sm:inline">Filters</span>
          </button>
        </div>
      </form>

      {/* Advanced filters */}
      {showFilters && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className="card p-5 mb-4 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4"
        >
          <div>
            <label className="label">Type</label>
            <select
              value={filters.employmentType}
              onChange={(e) => setFilters((p) => ({ ...p, employmentType: e.target.value }))}
              className="input"
            >
              <option value="">All types</option>
              {EMPLOYMENT_TYPES.map((t) => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Min Salary (₹)</label>
            <input
              type="number"
              placeholder="e.g. 300000"
              value={filters.minSalary}
              onChange={(e) => setFilters((p) => ({ ...p, minSalary: e.target.value }))}
              className="input"
            />
          </div>
          <div>
            <label className="label">Max Salary (₹)</label>
            <input
              type="number"
              placeholder="e.g. 1500000"
              value={filters.maxSalary}
              onChange={(e) => setFilters((p) => ({ ...p, maxSalary: e.target.value }))}
              className="input"
            />
          </div>
          <div>
            <label className="label">Experience (yrs)</label>
            <input
              type="number"
              placeholder="e.g. 3"
              value={filters.experience}
              onChange={(e) => setFilters((p) => ({ ...p, experience: e.target.value }))}
              className="input"
            />
          </div>
          <div>
            <label className="label">Skills</label>
            <input
              type="text"
              placeholder="React,Node.js"
              value={filters.skills}
              onChange={(e) => setFilters((p) => ({ ...p, skills: e.target.value }))}
              className="input"
            />
          </div>
          <div className="col-span-full flex justify-end gap-2">
            <button type="button" onClick={clearAll} className="btn-ghost text-xs">
              Clear all
            </button>
            <button type="button" onClick={handleSearch} className="btn-primary text-xs px-4">
              Apply Filters
            </button>
          </div>
        </motion.div>
      )}

      {/* Active filter chips */}
      {activeFilterKeys.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-4">
          {activeFilterKeys.map((key) => (
            <span key={key} className="flex items-center gap-1.5 badge-green px-3 py-1 text-xs">
              <span className="capitalize">{key}: {activeFilters[key]}</span>
              <button onClick={() => clearFilter(key)}>
                <XIcon className="w-3 h-3" />
              </button>
            </span>
          ))}
        </div>
      )}

      {/* Job grid */}
      {loading ? (
        <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
          {Array.from({ length: 9 }).map((_, i) => <JobCardSkeleton key={i} />)}
        </div>
      ) : jobs.length > 0 ? (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="grid md:grid-cols-2 xl:grid-cols-3 gap-4"
          >
            {jobs.map((job, i) => (
              <motion.div
                key={job._id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
              >
                <JobCard job={job} />
              </motion.div>
            ))}
          </motion.div>

          {/* Pagination */}
          {pages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-8">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="btn-secondary p-2 disabled:opacity-40"
              >
                <ChevronLeftIcon className="w-4 h-4" />
              </button>
              {Array.from({ length: Math.min(pages, 7) }).map((_, i) => {
                const pg = i + 1;
                return (
                  <button
                    key={pg}
                    onClick={() => setPage(pg)}
                    className={`w-9 h-9 rounded-lg text-sm font-medium transition-colors ${
                      page === pg
                        ? 'bg-green-500 text-white'
                        : 'bg-white border border-gray-200 text-gray-600 hover:border-green-400'
                    }`}
                  >
                    {pg}
                  </button>
                );
              })}
              <button
                onClick={() => setPage((p) => Math.min(pages, p + 1))}
                disabled={page === pages}
                className="btn-secondary p-2 disabled:opacity-40"
              >
                <ChevronRightIcon className="w-4 h-4" />
              </button>
            </div>
          )}
        </>
      ) : (
        <div className="text-center py-20">
          <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <SearchIcon className="w-8 h-8 text-gray-300" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No jobs found</h3>
          <p className="text-gray-500 text-sm mb-4">Try adjusting your search filters</p>
          <button onClick={clearAll} className="btn-primary">
            Clear Filters
          </button>
        </div>
      )}
    </div>
  );
};

export default Jobs;
