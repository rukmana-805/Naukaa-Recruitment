import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { getErrorMessage } from '../../utils/helpers';
import api from '../../services/api';
import { BuildingIcon, UserIcon, ArrowRightIcon, CheckCircleIcon } from 'lucide-react';

import useAuthStore from '../../store/authStore';
import { PageLoader } from '../../components/Skeleton';

const CreateOrganization = () => {
  const { user } = useAuthStore();
  const [step, setStep] = useState(1);
  const [orgType, setOrgType] = useState(''); // 'COMPANY' or 'INDIVIDUAL'
  const [orgId, setOrgId] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  if (!user) return <PageLoader />;

  const { register: registerStep1, handleSubmit: handleStep1 } = useForm();
  const { register: registerStep2, handleSubmit: handleStep2 } = useForm();
  
  // Custom state for files because react-hook-form with files can be tricky
  const [files, setFiles] = useState({});

  const onStep1Submit = async (data) => {
    if (!orgType) {
      return toast.error('Please select an organization type');
    }
    setLoading(true);
    try {
      const res = await api.post('/organizations/create-organization', {
        ...data,
        organizationType: orgType,
      });
      setOrgId(res.data.organization._id);
      setStep(2);
      toast.success(res.data.message || 'Basic details saved');
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const onStep2Submit = async (data) => {
    setLoading(true);
    try {
      if (orgType === 'INDIVIDUAL') {
        await api.patch(`/organizations/individual-company/${orgId}`, data);
      } else {
        await api.patch(`/organizations/big-company/${orgId}`, {
          website: data.website,
          address: {
            street: data.street,
            city: data.city,
            state: data.state,
            country: data.country,
            zipCode: data.zipCode,
          },
          companyDetails: {
            employeesCount: data.employeesCount,
            revenue: data.revenue,
            offices: data.offices,
            headquarters: {
              city: data.hqCity,
              state: data.hqState,
              country: data.hqCountry,
            },
            gstNumber: data.gstNumber,
            cinNumber: data.cinNumber,
            companySize: data.companySize,
          }
        });
      }
      setStep(3);
      toast.success('Details saved successfully');
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const onStep3Submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const formData = new FormData();
      
      if (orgType === 'INDIVIDUAL') {
        if (!files.aadhaar || !files.pan) {
          toast.error('Please upload both Aadhaar and PAN documents');
          setLoading(false);
          return;
        }
        formData.append('aadhaar', files.aadhaar);
        formData.append('pan', files.pan);
        await api.patch(`/organizations/individual-company/${orgId}/documents`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
      } else {
        if (!files.gst || !files.cin) {
          toast.error('Please upload both GST and CIN certificates');
          setLoading(false);
          return;
        }
        formData.append('gst', files.gst);
        formData.append('cin', files.cin);
        await api.patch(`/organizations/big-company/${orgId}/documents`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
      }
      
      toast.success('Documents uploaded! Organization registration complete.');
      navigate('/recruiter/organizations');
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e, fieldName) => {
    if (e.target.files && e.target.files[0]) {
      setFiles(prev => ({ ...prev, [fieldName]: e.target.files[0] }));
    }
  };

  return (
    <div className="max-w-3xl mx-auto py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Create Organization</h1>
        <p className="text-gray-500">Set up your company profile in 3 simple steps</p>
      </div>

      {/* Progress Bar */}
      <div className="flex items-center justify-between mb-8 relative">
        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-1 bg-gray-200 -z-10 rounded-full"></div>
        <div 
          className="absolute left-0 top-1/2 -translate-y-1/2 h-1 bg-green-600 -z-10 rounded-full transition-all duration-500"
          style={{ width: `${((step - 1) / 2) * 100}%` }}
        ></div>
        
        {[1, 2, 3].map(s => (
          <div key={s} className={`w-10 h-10 rounded-full flex items-center justify-center font-bold border-4 transition-colors ${step >= s ? 'bg-green-600 border-green-200 text-white' : 'bg-gray-100 border-white text-gray-400'}`}>
            {step > s ? <CheckCircleIcon className="w-5 h-5" /> : s}
          </div>
        ))}
      </div>

      <div className="card p-8">
        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <h2 className="text-xl font-semibold mb-6">Phase 1: Basic Details</h2>
              
              <div className="grid grid-cols-2 gap-4 mb-8">
                <div 
                  onClick={() => setOrgType('COMPANY')}
                  className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${orgType === 'COMPANY' ? 'border-green-600 bg-green-50' : 'border-gray-200 hover:border-green-300'}`}
                >
                  <BuildingIcon className={`w-8 h-8 mb-2 ${orgType === 'COMPANY' ? 'text-green-600' : 'text-gray-400'}`} />
                  <h3 className="font-semibold">Company</h3>
                  <p className="text-xs text-gray-500 mt-1">For registered businesses and agencies</p>
                </div>
                
                <div 
                  onClick={() => setOrgType('INDIVIDUAL')}
                  className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${orgType === 'INDIVIDUAL' ? 'border-green-600 bg-green-50' : 'border-gray-200 hover:border-green-300'}`}
                >
                  <UserIcon className={`w-8 h-8 mb-2 ${orgType === 'INDIVIDUAL' ? 'text-green-600' : 'text-gray-400'}`} />
                  <h3 className="font-semibold">Individual</h3>
                  <p className="text-xs text-gray-500 mt-1">For freelancers, consultants, or personal hiring</p>
                </div>
              </div>

              <form onSubmit={handleStep1(onStep1Submit)} className="space-y-4">
                <div>
                  <label className="label">Organization Name</label>
                  <input {...registerStep1('name', { required: true })} className="input" placeholder="Name of your organization" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="label">Email Address</label>
                    <input {...registerStep1('email', { required: true })} type="email" className="input" placeholder="Contact email" />
                  </div>
                  <div>
                    <label className="label">Phone Number</label>
                    <input {...registerStep1('phone', { required: true })} className="input" placeholder="Contact phone" />
                  </div>
                </div>
                <div className="flex justify-end pt-4">
                  <button type="submit" disabled={loading} className="btn-primary">
                    {loading ? 'Saving...' : 'Next Phase'} <ArrowRightIcon className="w-4 h-4 ml-2" />
                  </button>
                </div>
              </form>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <h2 className="text-xl font-semibold mb-6">Phase 2: {orgType === 'COMPANY' ? 'Company Details' : 'Individual Details'}</h2>
              
              <form onSubmit={handleStep2(onStep2Submit)} className="space-y-4">
                {orgType === 'INDIVIDUAL' ? (
                  <>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="label">Aadhaar Number</label>
                        <input {...registerStep2('aadhaarNumber', { required: true })} className="input" placeholder="12-digit Aadhaar" />
                      </div>
                      <div>
                        <label className="label">PAN Number</label>
                        <input {...registerStep2('panNumber', { required: true })} className="input" placeholder="10-digit PAN" />
                      </div>
                    </div>
                    <div>
                      <label className="label">Hiring For</label>
                      <select {...registerStep2('hiringFor', { required: true })} className="input">
                        <option value="">Select an option</option>
                        <option value="Teacher">Teacher</option>
                        <option value="Trainer">Trainer</option>
                        <option value="Maid">Maid</option>
                        <option value="Cook">Cook</option>
                        <option value="Freelancer">Freelancer</option>
                        <option value="Assistant">Assistant</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="label">Website</label>
                        <input {...registerStep2('website', { required: true })} type="url" className="input" placeholder="https://..." />
                      </div>
                      <div>
                        <label className="label">Employees Count</label>
                        <select {...registerStep2('employeesCount', { required: true })} className="input">
                          <option value="1-10">1-10</option>
                          <option value="11-50">11-50</option>
                          <option value="51-200">51-200</option>
                          <option value="201-500">201-500</option>
                          <option value="501-1000">501-1000</option>
                          <option value="1000+">1000+</option>
                        </select>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="label">GST Number</label>
                        <input {...registerStep2('gstNumber')} className="input" placeholder="Optional" />
                      </div>
                      <div>
                        <label className="label">CIN Number</label>
                        <input {...registerStep2('cinNumber')} className="input" placeholder="Optional" />
                      </div>
                    </div>

                    <div className="pt-2">
                      <label className="label font-semibold text-gray-900 border-b pb-2 mb-2">Address Details</label>
                      <div className="grid grid-cols-2 gap-4 mb-2">
                        <input {...registerStep2('street')} className="input" placeholder="Street Address" />
                        <input {...registerStep2('city')} className="input" placeholder="City" />
                      </div>
                      <div className="grid grid-cols-3 gap-4">
                        <input {...registerStep2('state')} className="input" placeholder="State" />
                        <input {...registerStep2('country')} className="input" placeholder="Country" />
                        <input {...registerStep2('zipCode')} className="input" placeholder="Zip Code" />
                      </div>
                    </div>
                  </>
                )}
                
                <div className="flex justify-end pt-4 gap-3">
                  <button type="submit" disabled={loading} className="btn-primary">
                    {loading ? 'Saving...' : 'Next Phase'} <ArrowRightIcon className="w-4 h-4 ml-2" />
                  </button>
                </div>
              </form>
            </motion.div>
          )}

          {step === 3 && (
            <motion.div
              key="step3"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <h2 className="text-xl font-semibold mb-6">Phase 3: Document Upload</h2>
              
              <form onSubmit={onStep3Submit} className="space-y-6">
                {orgType === 'INDIVIDUAL' ? (
                  <>
                    <div className="p-4 border border-dashed border-gray-300 rounded-xl bg-gray-50">
                      <label className="block text-sm font-medium text-gray-700 mb-2">Upload Aadhaar Document *</label>
                      <input 
                        type="file" 
                        accept="image/*,.pdf" 
                        onChange={(e) => handleFileChange(e, 'aadhaar')}
                        className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-green-50 file:text-green-700 hover:file:bg-green-100" 
                      />
                    </div>
                    <div className="p-4 border border-dashed border-gray-300 rounded-xl bg-gray-50">
                      <label className="block text-sm font-medium text-gray-700 mb-2">Upload PAN Document *</label>
                      <input 
                        type="file" 
                        accept="image/*,.pdf" 
                        onChange={(e) => handleFileChange(e, 'pan')}
                        className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-green-50 file:text-green-700 hover:file:bg-green-100" 
                      />
                    </div>
                  </>
                ) : (
                  <>
                    <div className="p-4 border border-dashed border-gray-300 rounded-xl bg-gray-50">
                      <label className="block text-sm font-medium text-gray-700 mb-2">Upload GST Certificate *</label>
                      <input 
                        type="file" 
                        accept="image/*,.pdf" 
                        onChange={(e) => handleFileChange(e, 'gst')}
                        className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-green-50 file:text-green-700 hover:file:bg-green-100" 
                      />
                    </div>
                    <div className="p-4 border border-dashed border-gray-300 rounded-xl bg-gray-50">
                      <label className="block text-sm font-medium text-gray-700 mb-2">Upload CIN Certificate *</label>
                      <input 
                        type="file" 
                        accept="image/*,.pdf" 
                        onChange={(e) => handleFileChange(e, 'cin')}
                        className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-green-50 file:text-green-700 hover:file:bg-green-100" 
                      />
                    </div>
                  </>
                )}
                
                <div className="flex justify-end pt-4">
                  <button type="submit" disabled={loading} className="btn-primary w-full justify-center">
                    {loading ? 'Uploading...' : 'Complete Registration'}
                  </button>
                </div>
              </form>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default CreateOrganization;
