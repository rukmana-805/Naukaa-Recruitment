import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PlusCircleIcon, TrashIcon, EditIcon, CheckIcon, XIcon, ShieldIcon, SparklesIcon } from 'lucide-react';
import { adminService } from '../../services/admin.service';
import { PageLoader } from '../../components/Skeleton';
import toast from 'react-hot-toast';
import { getErrorMessage } from '../../utils/helpers';

const AdminSubscriptionPlans = () => {
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingPlan, setEditingPlan] = useState(null); // plan object if editing

  // Form states
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [durationDays, setDurationDays] = useState(30);
  const [description, setDescription] = useState('');
  const [features, setFeatures] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [applicableFor, setApplicableFor] = useState('BOTH');
  const [saving, setSaving] = useState(false);

  const fetchPlans = async () => {
    try {
      const res = await adminService.getPlans();
      setPlans(res.data.data || []);
    } catch (err) {
      toast.error('Failed to load subscription plans');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPlans();
  }, []);

  const handleOpenCreate = () => {
    setEditingPlan(null);
    setName('');
    setPrice('');
    setDurationDays(30);
    setDescription('');
    setFeatures('');
    setIsActive(true);
    setApplicableFor('BOTH');
    setShowModal(true);
  };

  const handleOpenEdit = (plan) => {
    setEditingPlan(plan);
    setName(plan.name);
    setPrice(plan.price);
    setDurationDays(plan.durationDays);
    setDescription(plan.description || '');
    setFeatures(plan.features ? plan.features.join(', ') : '');
    setIsActive(plan.isActive);
    setApplicableFor(plan.applicableFor || 'BOTH');
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name || price === '') {
      return toast.error('Name and price are required');
    }

    setSaving(true);
    const payload = {
      name,
      price: Number(price),
      durationDays: Number(durationDays),
      description,
      features: features.split(',').map(f => f.trim()).filter(Boolean),
      isActive,
      applicableFor,
    };

    try {
      if (editingPlan) {
        await adminService.updatePlan(editingPlan._id, payload);
        toast.success('Subscription plan updated successfully!');
      } else {
        await adminService.createPlan(payload);
        toast.success('Subscription plan created successfully!');
      }
      setShowModal(false);
      fetchPlans();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this subscription plan?')) return;
    try {
      await adminService.deletePlan(id);
      toast.success('Subscription plan deleted successfully');
      fetchPlans();
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  if (loading) return <PageLoader />;

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
          <div className="flex items-center gap-2 mb-1">
            <ShieldIcon className="w-4 h-4 text-green-600" />
            <span className="text-xs text-gray-400 font-bold uppercase tracking-widest">Admin Control</span>
          </div>
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Subscription Plans</h1>
          <p className="text-gray-500 mt-1 text-xs font-semibold">Manage premium packages offered to company owners</p>
        </motion.div>
        <button
          onClick={handleOpenCreate}
          className="btn-primary shadow-lg shadow-green-150 py-2.5 px-5 text-xs font-bold flex items-center gap-2 cursor-pointer shrink-0 align-self-start sm:align-self-auto"
        >
          <PlusCircleIcon className="w-4.5 h-4.5" /> Create New Plan
        </button>
      </div>

      {/* Grid of Plans */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {plans.map((plan, idx) => (
          <motion.div
            key={plan._id}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.05 }}
            className={`card p-6 flex flex-col justify-between border ${!plan.isActive ? 'bg-gray-50 border-gray-200 opacity-70' : 'border-gray-100 hover:shadow-md transition-shadow'}`}
          >
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className={`badge text-[10px] font-bold ${plan.isActive ? 'badge-green' : 'badge-gray'}`}>
                    {plan.isActive ? 'Active Plan' : 'Inactive'}
                  </span>
                  <span className={`badge text-[10px] font-bold ${
                    plan.applicableFor === 'COMPANY' ? 'badge-purple' : 
                    plan.applicableFor === 'INDIVIDUAL' ? 'badge-blue' : 
                    'badge-gray'
                  }`}>
                    {plan.applicableFor === 'COMPANY' ? 'Big Company' :
                     plan.applicableFor === 'INDIVIDUAL' ? 'Individual' :
                     'Both Types'}
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleOpenEdit(plan)}
                    className="p-1.5 text-gray-400 hover:text-blue-600 rounded-lg hover:bg-gray-100 transition-colors"
                    title="Edit Plan"
                  >
                    <EditIcon className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(plan._id)}
                    className="p-1.5 text-gray-400 hover:text-red-600 rounded-lg hover:bg-gray-100 transition-colors"
                    title="Delete Plan"
                  >
                    <TrashIcon className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <h3 className="text-lg font-black text-gray-900 leading-tight">{plan.name}</h3>
              <div className="text-3xl font-black text-green-600 tracking-tight mt-2.5 mb-1.5">
                ₹{plan.price}
                <span className="text-xs text-gray-400 font-semibold ml-1">/{plan.durationDays} days</span>
              </div>
              <p className="text-gray-500 text-xs leading-relaxed font-medium mb-6">{plan.description || 'No description provided.'}</p>

              {/* Feature bullet list */}
              {plan.features?.length > 0 && (
                <div className="border-t border-gray-100 pt-4 mb-6">
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2.5">Included Perks</p>
                  <ul className="space-y-2">
                    {plan.features.map((feature, fIdx) => (
                      <li key={fIdx} className="flex items-center gap-2 text-xs font-semibold text-gray-650">
                        <CheckIcon className="w-3.5 h-3.5 text-green-500 shrink-0" />
                        <span className="truncate">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </motion.div>
        ))}

        {plans.length === 0 && (
          <div className="card p-12 text-center border-dashed border-2 flex flex-col items-center justify-center text-gray-400 md:col-span-2 lg:col-span-3">
            <SparklesIcon className="w-12 h-12 text-gray-300 mb-3" />
            <h3 className="text-md font-bold text-gray-800">No subscription plans found</h3>
            <p className="text-xs text-gray-500 mt-1 max-w-xs">Create your first premium catalog package to display on the upgrade interface.</p>
            <button
              onClick={handleOpenCreate}
              className="btn-primary mt-4 py-2 px-4 text-xs font-semibold"
            >
              Add subscription plan
            </button>
          </div>
        )}
      </div>

      {/* Add/Edit Plan Modal */}
      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
            >
              {/* Modal Header */}
              <div className="p-6 border-b flex items-center justify-between bg-gray-50/50">
                <div>
                  <h3 className="text-lg font-black text-gray-900 tracking-tight">
                    {editingPlan ? 'Edit Membership Plan' : 'Create Subscription Plan'}
                  </h3>
                  <p className="text-xs text-gray-450 mt-0.5">Customize plan cost, duration, and recruiter features catalog</p>
                </div>
                <button
                  onClick={() => setShowModal(false)}
                  className="p-2 hover:bg-gray-250 rounded-full transition-colors cursor-pointer"
                >
                  <XIcon className="w-4.5 h-4.5 text-gray-500" />
                </button>
              </div>

              {/* Form Body */}
              <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Plan name *</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="input bg-gray-50 focus:ring-2 focus:ring-green-500 border-none"
                    placeholder="e.g. Standard Recruiter, Pro Plan"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Price (INR) *</label>
                    <input
                      type="number"
                      value={price}
                      onChange={(e) => setPrice(e.target.value)}
                      className="input bg-gray-50 focus:ring-2 focus:ring-green-500 border-none"
                      placeholder="999"
                      min={0}
                      required
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Duration (Days)</label>
                    <input
                      type="number"
                      value={durationDays}
                      onChange={(e) => setDurationDays(e.target.value)}
                      className="input bg-gray-50 focus:ring-2 focus:ring-green-500 border-none"
                      placeholder="30"
                      min={1}
                      required
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Target Organization Type *</label>
                  <select
                    value={applicableFor}
                    onChange={(e) => setApplicableFor(e.target.value)}
                    className="input bg-gray-50 focus:ring-2 focus:ring-green-500 border-none w-full"
                    required
                  >
                    <option value="BOTH">Both (Big Company & Individual)</option>
                    <option value="COMPANY">Big Company Only</option>
                    <option value="INDIVIDUAL">Individual Only</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Short Description</label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={2}
                    className="input bg-gray-50 focus:ring-2 focus:ring-green-500 border-none py-2 resize-none"
                    placeholder="Brief highlight details of who this package targets..."
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Features (comma-separated)</label>
                  <textarea
                    value={features}
                    onChange={(e) => setFeatures(e.target.value)}
                    rows={3}
                    className="input bg-gray-50 focus:ring-2 focus:ring-green-500 border-none py-2 resize-none"
                    placeholder="Premium Analytics, 15 Recruiter slots, Priority Chat Support"
                  />
                  <p className="text-[9px] text-gray-400 italic ml-1">Separate multiple benefits with commas. "Post unlimited jobs" and "Invite team recruiters" are included by default.</p>
                </div>

                <div className="flex items-center gap-2 pt-2 ml-1">
                  <input
                    type="checkbox"
                    id="isActive"
                    checked={isActive}
                    onChange={(e) => setIsActive(e.target.checked)}
                    className="accent-green-500 w-4 h-4 rounded cursor-pointer"
                  />
                  <label htmlFor="isActive" className="text-xs font-bold text-gray-705 cursor-pointer">
                    Publish plan active instantly
                  </label>
                </div>

                {/* Actions */}
                <div className="flex gap-3 pt-4 border-t border-gray-100">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="btn-secondary flex-1 justify-center py-3 text-xs font-bold cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="btn-primary flex-1 justify-center py-3 text-xs font-bold cursor-pointer"
                  >
                    {saving ? 'Saving changes...' : editingPlan ? 'Save Changes' : 'Create Plan'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AdminSubscriptionPlans;
