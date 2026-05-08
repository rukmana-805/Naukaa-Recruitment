import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { PlusCircleIcon, BuildingIcon, TrashIcon, EditIcon, XIcon } from 'lucide-react';
import { organizationService } from '../../services/organization.service';
import { getErrorMessage, formatRelativeDate } from '../../utils/helpers';
import { PageLoader } from '../../components/Skeleton';
import toast from 'react-hot-toast';

const Organizations = () => {
  const [orgs, setOrgs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);

  const { register, handleSubmit, reset } = useForm();

  useEffect(() => {
    const fetch = async () => {
      try {
        const res = await organizationService.getMyOrganizations();
        setOrgs(res.data.data || []);
      } catch (err) {
        toast.error(getErrorMessage(err));
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, []);

  const onCreate = async (data) => {
    setCreating(true);
    try {
      const res = await organizationService.createOrganization(data);
      setOrgs((prev) => [res.data.data, ...prev]);
      setShowCreate(false);
      reset();
      toast.success('Organization created!');
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setCreating(false);
    }
  };

  const onDelete = async (id) => {
    if (!window.confirm('Delete this organization?')) return;
    try {
      await organizationService.deleteOrganization(id);
      setOrgs((prev) => prev.filter((o) => o._id !== id));
      toast.success('Organization deleted');
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  if (loading) return <PageLoader />;

  return (
    <div>
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="section-title">Organizations</h1>
            <p className="text-gray-500 mt-1">Manage your companies</p>
          </div>
          <button onClick={() => setShowCreate(true)} className="btn-primary">
            <PlusCircleIcon className="w-4 h-4" />
            New Organization
          </button>
        </div>
      </motion.div>

      {orgs.length === 0 ? (
        <div className="card p-16 text-center">
          <BuildingIcon className="w-12 h-12 text-gray-200 mx-auto mb-3" />
          <p className="text-gray-500 mb-4">No organizations yet</p>
          <button onClick={() => setShowCreate(true)} className="btn-primary inline-flex">
            <PlusCircleIcon className="w-4 h-4" />
            Create Organization
          </button>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {orgs.map((org, i) => (
            <motion.div
              key={org._id}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08 }}
              className="card p-5"
            >
              <div className="flex items-start gap-3 mb-4">
                <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center overflow-hidden shrink-0">
                  {org.logo?.url ? (
                    <img src={org.logo.url} alt={org.name} className="w-full h-full object-cover" />
                  ) : (
                    <BuildingIcon className="w-5 h-5 text-gray-400" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-gray-900 truncate">{org.name}</h3>
                  {org.tagline && <p className="text-xs text-gray-500 truncate">{org.tagline}</p>}
                </div>
              </div>

              <div className="flex items-center justify-between text-xs text-gray-400 mb-4">
                <span>{org.followers?.length || 0} followers</span>
                <span>{org.views || 0} views</span>
                <span>{formatRelativeDate(org.createdAt)}</span>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => onDelete(org._id)}
                  className="btn-ghost text-xs text-red-500 hover:bg-red-50 hover:text-red-600 flex-1 justify-center"
                >
                  <TrashIcon className="w-3.5 h-3.5" />
                  Delete
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Create modal */}
      {showCreate && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl"
          >
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-bold text-gray-900">New Organization</h3>
              <button onClick={() => setShowCreate(false)} className="p-1.5 hover:bg-gray-100 rounded-lg">
                <XIcon className="w-4 h-4 text-gray-500" />
              </button>
            </div>

            <form onSubmit={handleSubmit(onCreate)} className="space-y-4">
              <div>
                <label className="label">Organization Name *</label>
                <input {...register('name', { required: true })} className="input" placeholder="e.g. Acme Corp" />
              </div>
              <div>
                <label className="label">Tagline</label>
                <input {...register('tagline')} className="input" placeholder="Brief description" />
              </div>
              <div>
                <label className="label">Website</label>
                <input {...register('overview.website')} type="url" className="input" placeholder="https://..." />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowCreate(false)} className="btn-secondary flex-1">Cancel</button>
                <button type="submit" disabled={creating} className="btn-primary flex-1 justify-center">
                  {creating ? 'Creating...' : 'Create'}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default Organizations;
