import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { CheckCircleIcon, ArrowRightIcon, CreditCardIcon, XCircleIcon, SparklesIcon, AlertCircleIcon } from 'lucide-react';
import { paymentService, loadRazorpayScript, RAZORPAY_KEY_ID } from '../services/payment.service';
import { organizationService } from '../services/organization.service';
import useAuthStore from '../store/authStore';
import { formatDate, getErrorMessage } from '../utils/helpers';
import toast from 'react-hot-toast';
import { Link, useNavigate } from 'react-router-dom';

const FREE_FEATURES = [
  'Post up to 1 job',
  'Basic applicant tracking',
  'No recruiter invitations allowed',
  'Standard email support',
];

const Pricing = () => {
  const { user, updateUser } = useAuthStore();
  const navigate = useNavigate();
  const [subscription, setSubscription] = useState(null);
  const [loading, setLoading] = useState(false); // Stores planId of currently loading checkout
  const [subLoading, setSubLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);
  const [plans, setPlans] = useState([]);
  const [plansLoading, setPlansLoading] = useState(true);
  const [org, setOrg] = useState(null);
  const [orgLoading, setOrgLoading] = useState(true);

  useEffect(() => {
    if (user && user.role !== 'owner') {
      navigate('/dashboard', { replace: true });
    }
  }, [user, navigate]);

  useEffect(() => {
    const fetchPlansAndSub = async () => {
      try {
        const plansRes = await paymentService.getActivePlans();
        setPlans(plansRes.data || []);
      } catch (err) {
        console.error('Failed to load active plans:', err);
      } finally {
        setPlansLoading(false);
      }

      if (user) {
        try {
          const res = await paymentService.getMySubscription();
          setSubscription(res.data);
        } catch (_) {}
        finally {
          setSubLoading(false);
        }

        try {
          const orgsRes = await organizationService.getMyOrganizations();
          const orgs = orgsRes.data?.data || [];
          if (orgs.length > 0) {
            setOrg(orgs[0]);
          }
        } catch (err) {
          console.error('Failed to load organization:', err);
        } finally {
          setOrgLoading(false);
        }
      } else {
        setSubLoading(false);
        setOrgLoading(false);
      }
    };
    fetchPlansAndSub();
  }, [user]);

  const handleUpgrade = async (planId, planName, planPrice) => {
    if (!user) {
      window.location.href = '/register';
      return;
    }

    setLoading(planId);
    try {
      // Load Razorpay script
      const loaded = await loadRazorpayScript();
      if (!loaded) {
        toast.error('Failed to load payment gateway. Check your internet connection.');
        return;
      }

      // Create order on backend
      const orderRes = await paymentService.createOrder(planId);
      const { order, paymentId: apiPaymentId } = orderRes.data;

      // Open Razorpay checkout
      const options = {
        key: RAZORPAY_KEY_ID,
        amount: order.amount,
        currency: order.currency,
        name: 'Naukaa',
        description: `${planName} — Subscription`,
        order_id: order.id,
        handler: async (response) => {
          try {
            await paymentService.verifyPayment({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              paymentId: apiPaymentId,
            });
            updateUser({ plan: 'paid' });
            toast.success(`🎉 Payment successful! You are now on ${planName}!`);
            
            // Refresh subscription
            const subRes = await paymentService.getMySubscription();
            setSubscription(subRes.data);
          } catch (err) {
            toast.error(getErrorMessage(err));
          }
        },
        prefill: {
          name: user.fullName,
          email: user.email,
        },
        theme: {
          color: '#22c55e',
        },
        modal: {
          ondismiss: async () => {
            try {
              await paymentService.markPaymentFailed(order.id);
            } catch (_) {}
          },
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async () => {
    if (!window.confirm('Cancel your subscription plan? You will revert to the Free tier.')) return;
    setCancelling(true);
    try {
      await paymentService.cancelSubscription();
      updateUser({ plan: 'free' });
      setSubscription(null);
      toast.success('Subscription cancelled');
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setCancelling(false);
    }
  };

  const isPro = user?.plan === 'paid';
  const activePlanName = subscription?.plan || 'Premium';

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-12">
        <span className="text-xs font-bold text-green-600 uppercase tracking-widest">Pricing</span>
        <h1 className="text-4xl font-black text-gray-900 mt-2 tracking-tight">Simple, transparent pricing</h1>
        <p className="text-gray-500 mt-3 text-sm font-medium">Choose the plan that works for your organization</p>
      </motion.div>

      {/* Active subscription banner */}
      {isPro && subscription && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="card p-5 mb-8 border-2 border-green-300 bg-green-50/50 flex items-center gap-4 rounded-2xl"
        >
          <CheckCircleIcon className="w-8 h-8 text-green-500 shrink-0" />
          <div className="flex-grow">
            <p className="font-bold text-green-800">Your organization is active on the {activePlanName} Plan! ✨</p>
            <p className="text-xs text-green-600 font-semibold mt-0.5">
              Active until {formatDate(subscription.endDate)}
            </p>
          </div>
          <button
            onClick={handleCancel}
            disabled={cancelling}
            className="text-xs font-bold text-red-500 hover:text-red-600 bg-white hover:bg-red-50 border border-red-200 px-4 py-2 rounded-xl transition-all cursor-pointer shadow-xs shrink-0"
          >
            {cancelling ? 'Cancelling...' : 'Cancel Subscription'}
          </button>
        </motion.div>
      )}

      {/* Verification alerts */}
      {user && !orgLoading && !org && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="card p-5 mb-8 border border-amber-200 bg-amber-50/50 flex items-center gap-4 rounded-2xl"
        >
          <AlertCircleIcon className="w-8 h-8 text-amber-500 shrink-0" />
          <div className="text-left">
            <p className="font-bold text-amber-800">Register Organization Profile First! ⚠️</p>
            <p className="text-xs text-amber-600 font-semibold mt-0.5 animate-pulse">
              You must create an organization profile first before upgrading. <Link to="/recruiter" className="underline font-bold text-amber-700">Go to Dashboard</Link> to set up your profile.
            </p>
          </div>
        </motion.div>
      )}

      {user && !orgLoading && org && org.verificationStatus !== 'VERIFIED' && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className={`card p-5 mb-8 border flex items-center gap-4 rounded-2xl ${
            org.verificationStatus === 'REJECTED' 
              ? 'border-red-200 bg-red-50/50 text-red-800' 
              : 'border-amber-200 bg-amber-50/50 text-amber-800'
          }`}
        >
          <AlertCircleIcon className={`w-8 h-8 shrink-0 ${
            org.verificationStatus === 'REJECTED' ? 'text-red-500' : 'text-amber-500'
          }`} />
          <div className="text-left">
            {org.verificationStatus === 'REJECTED' ? (
              <>
                <p className="font-bold">Organization Profile Verification Rejected! ❌</p>
                <p className="text-xs font-semibold mt-0.5">
                  Your verification documents were rejected. Reason: <span className="italic font-bold">"{org.rejectionReason || 'No reason specified'}"</span>. Please update your verification files on your profile before trying to purchase subscription plans.
                </p>
              </>
            ) : (
              <>
                <p className="font-bold">Organization Verification Pending! ⏳</p>
                <p className="text-xs font-semibold mt-0.5">
                  Your profile is currently under review by our administrators. Subscriptions can only be purchased once your organization profile is successfully verified. We will notify you once it's approved!
                </p>
              </>
            )}
          </div>
        </motion.div>
      )}

      {plansLoading ? (
        <div className="py-16 flex flex-col items-center justify-center">
          <div className="w-10 h-10 border-4 border-green-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-xs text-gray-400 mt-4 font-semibold">Loading membership packages...</p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Free Tier */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className={`card p-8 flex flex-col justify-between ${!isPro ? 'border-2 border-green-400 relative overflow-hidden' : 'border-gray-100'}`}
          >
            {!isPro && (
              <div className="absolute top-0 right-0 w-24 h-24 bg-green-500/5 rounded-full blur-xl pointer-events-none" />
            )}
            <div>
              <div className="badge-gray mb-4 w-fit">Free Plan</div>
              <div className="text-5xl font-black text-gray-900 mb-2 tracking-tight">₹0</div>
              <p className="text-gray-400 text-xs font-semibold mb-6">Start posting jobs for free, forever</p>

              <ul className="space-y-3 mb-8">
                {FREE_FEATURES.map((f) => (
                  <li key={f} className="flex items-center gap-2.5 text-xs text-gray-600 font-medium">
                    <CheckCircleIcon className="w-4 h-4 text-green-500 shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>
            </div>

            <div>
              {!user ? (
                <Link to="/register" className="btn-secondary w-full justify-center text-center font-bold">
                  Get Started Free
                </Link>
              ) : (
                <div className="flex items-center justify-center gap-2 py-3 rounded-xl bg-gray-150 text-xs font-bold text-gray-500">
                  {isPro ? 'Previous plan' : (
                    <>
                      <CheckCircleIcon className="w-4 h-4 text-green-500" />
                      Current Plan
                    </>
                  )}
                </div>
              )}
            </div>
          </motion.div>

          {/* Dynamic Paid Plans */}
          {plans.map((plan, i) => {
            const isCurrentActive = isPro && subscription && subscription.plan === plan.name;
            return (
              <motion.div
                key={plan._id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: (i + 1) * 0.1 }}
                className={`card p-8 flex flex-col justify-between relative overflow-hidden ${isCurrentActive ? 'border-2 border-green-500 bg-green-50/10' : 'border-gray-100'}`}
              >
                {/* Glow effects for paid plans */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-green-100 rounded-full blur-3xl opacity-60 -translate-y-10 translate-x-10 pointer-events-none" />

                <div>
                  <div className="flex items-center gap-2 mb-4">
                    <span className="badge-green">{plan.name}</span>
                    {i === 0 && <span className="badge bg-amber-50 text-amber-700 font-bold border border-amber-200">Recommended</span>}
                  </div>
                  <div className="text-5xl font-black text-gray-900 mb-2 tracking-tight">
                    ₹{plan.price}
                    <span className="text-sm font-normal text-gray-400 font-semibold ml-1">/{plan.durationDays} days</span>
                  </div>
                  <p className="text-gray-400 text-xs font-semibold mb-6">{plan.description || 'Unlock advanced features for recruiters and owners'}</p>

                  <ul className="space-y-3 mb-8">
                    {/* Fixed Core Benefits */}
                    <li className="flex items-center gap-2.5 text-xs text-gray-600 font-semibold">
                      <SparklesIcon className="w-4 h-4 text-green-500 shrink-0" />
                      Post unlimited jobs
                    </li>
                    <li className="flex items-center gap-2.5 text-xs text-gray-600 font-semibold">
                      <SparklesIcon className="w-4 h-4 text-green-500 shrink-0" />
                      Invite team recruiters
                    </li>
                    {/* Plan features */}
                    {plan.features?.map((f) => (
                      <li key={f} className="flex items-center gap-2.5 text-xs text-gray-600 font-medium">
                        <CheckCircleIcon className="w-4 h-4 text-green-500 shrink-0" />
                        {f}
                      </li>
                    ))}
                  </ul>
                </div>

                <div>
                  {isCurrentActive ? (
                    <div className="flex items-center justify-center gap-2 py-3 rounded-xl bg-green-100 text-xs text-green-700 font-bold border border-green-200">
                      <CheckCircleIcon className="w-4 h-4" />
                      Active Tier ✨
                    </div>
                  ) : (
                    <motion.button
                      whileHover={org && org.verificationStatus === 'VERIFIED' ? { scale: 1.01 } : {}}
                      whileTap={org && org.verificationStatus === 'VERIFIED' ? { scale: 0.99 } : {}}
                      onClick={() => handleUpgrade(plan._id, plan.name, plan.price)}
                      disabled={!!loading || !org || org.verificationStatus !== 'VERIFIED'}
                      className={`w-full justify-center py-3 text-xs font-bold rounded-xl flex items-center gap-2 cursor-pointer transition-all ${
                        org && org.verificationStatus === 'VERIFIED'
                          ? 'btn-primary shadow-md shadow-green-100'
                          : 'bg-gray-150 text-gray-400 border border-gray-200 cursor-not-allowed'
                      }`}
                    >
                      {loading === plan._id ? (
                        <span className="flex items-center gap-2">
                          <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          Processing...
                        </span>
                      ) : !org ? (
                        'Setup Profile to Subscribe'
                      ) : org.verificationStatus === 'PENDING' ? (
                        'Pending Admin Approval'
                      ) : org.verificationStatus === 'REJECTED' ? (
                        'Verification Rejected'
                      ) : (
                        <>
                          <CreditCardIcon className="w-4 h-4" />
                          Subscribe for ₹{plan.price}
                          <ArrowRightIcon className="w-4 h-4" />
                        </>
                      )}
                    </motion.button>
                  )}
                </div>
              </motion.div>
            );
          })}
          
          {plans.length === 0 && (
            <div className="card p-8 border-dashed border-2 flex flex-col items-center justify-center text-center text-gray-400 lg:col-span-2">
              <SparklesIcon className="w-10 h-10 text-gray-300 mb-3" />
              <h4 className="font-bold text-gray-700 text-sm">More plans launching soon!</h4>
              <p className="text-xs text-gray-500 mt-1 max-w-xs">Admins are currently preparing custom subscription tier catalogs.</p>
            </div>
          )}
        </div>
      )}

      {/* FAQ */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="mt-12 card p-8"
      >
        <h2 className="font-bold text-gray-900 text-xl mb-6">Frequently Asked Questions</h2>
        <div className="grid md:grid-cols-2 gap-6">
          {[
            { q: 'Can I cancel anytime?', a: 'Yes! You can cancel your subscription plan at any time from this page. You will revert back to the Free plan immediately.' },
            { q: 'Is the payment secure?', a: 'All payments are processed through Razorpay, India\'s most trusted payment gateway. We never store your card or banking details.' },
            { q: 'What happens after I upgrade?', a: 'Your plan is activated instantly after payment. You\'ll get access to all advanced features (unlimited posts, recruiter invites) immediately.' },
            { q: 'Can recruiters pay or upgrade plans?', a: 'No, only company owners have access to pay and upgrade plans. Recruiters will get immediate benefits once their owner upgrades.' },
          ].map((faq) => (
            <div key={faq.q} className="space-y-1">
              <p className="font-bold text-gray-900 text-sm">{faq.q}</p>
              <p className="text-gray-500 text-xs leading-relaxed font-medium">{faq.a}</p>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
};

export default Pricing;
