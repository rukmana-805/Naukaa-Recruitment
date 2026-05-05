import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { CheckCircleIcon, ArrowRightIcon, CreditCardIcon, XCircleIcon } from 'lucide-react';
import { paymentService, loadRazorpayScript, RAZORPAY_KEY_ID } from '../services/payment.service';
import useAuthStore from '../store/authStore';
import { formatDate, getErrorMessage } from '../utils/helpers';
import toast from 'react-hot-toast';
import { Link } from 'react-router-dom';

const FREE_FEATURES = [
  'Browse all jobs',
  'Apply to 5 jobs/month',
  'Basic profile',
  'Email notifications',
];

const PRO_FEATURES = [
  'Unlimited job applications',
  'Priority in recruiter search',
  'AI-powered job recommendations',
  'Application analytics dashboard',
  'Resume ATS boost',
  'Interview scheduling',
  'Priority support',
  'Early access to new features',
];

const Pricing = () => {
  const { user, updateUser } = useAuthStore();
  const [subscription, setSubscription] = useState(null);
  const [loading, setLoading] = useState(false);
  const [subLoading, setSubLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);

  useEffect(() => {
    const fetchSub = async () => {
      try {
        const res = await paymentService.getMySubscription();
        setSubscription(res.data);
      } catch (_) {}
      finally {
        setSubLoading(false);
      }
    };
    if (user) fetchSub();
    else setSubLoading(false);
  }, [user]);

  const handleUpgrade = async () => {
    if (!user) {
      window.location.href = '/register';
      return;
    }

    setLoading(true);
    try {
      // Load Razorpay script
      const loaded = await loadRazorpayScript();
      if (!loaded) {
        toast.error('Failed to load payment gateway. Check your internet connection.');
        return;
      }

      // Create order on backend
      const orderRes = await paymentService.createOrder();
      const { order, paymentId } = orderRes.data;

      // Open Razorpay checkout
      const options = {
        key: RAZORPAY_KEY_ID,
        amount: order.amount,
        currency: order.currency,
        name: 'Naukaa',
        description: 'Pro Plan — 1 Month Subscription',
        order_id: order.id,
        handler: async (response) => {
          try {
            await paymentService.verifyPayment({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              paymentId,
            });
            updateUser({ plan: 'paid' });
            toast.success('🎉 Payment successful! You are now on Pro!');
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
    if (!window.confirm('Cancel your Pro subscription?')) return;
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

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-12">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-12">
        <span className="text-xs font-bold text-green-600 uppercase tracking-widest">Pricing</span>
        <h1 className="text-4xl font-bold text-gray-900 mt-2">Simple, transparent pricing</h1>
        <p className="text-gray-500 mt-3">Choose the plan that works for your job search</p>
      </motion.div>

      {/* Active subscription banner */}
      {isPro && subscription && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="card p-5 mb-8 border-2 border-green-300 bg-green-50 flex items-center gap-4"
        >
          <CheckCircleIcon className="w-8 h-8 text-green-500 flex-shrink-0" />
          <div className="flex-1">
            <p className="font-semibold text-green-800">You're on the Pro Plan! ✨</p>
            <p className="text-sm text-green-600">
              Active until {formatDate(subscription.endDate)}
            </p>
          </div>
          <button
            onClick={handleCancel}
            disabled={cancelling}
            className="text-xs text-red-500 hover:text-red-600 hover:bg-red-50 px-3 py-1.5 rounded-lg transition-colors"
          >
            {cancelling ? 'Cancelling...' : 'Cancel'}
          </button>
        </motion.div>
      )}

      <div className="grid md:grid-cols-2 gap-6">
        {/* Free */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
          className={`card p-8 ${!isPro ? 'border-2 border-green-200' : ''}`}
        >
          <div className="badge-gray mb-4">Free</div>
          <div className="text-5xl font-bold text-gray-900 mb-1">₹0</div>
          <p className="text-gray-500 text-sm mb-6">Get started for free, forever</p>

          <ul className="space-y-3 mb-8">
            {FREE_FEATURES.map((f) => (
              <li key={f} className="flex items-center gap-2.5 text-sm text-gray-700">
                <CheckCircleIcon className="w-4 h-4 text-green-500 flex-shrink-0" />
                {f}
              </li>
            ))}
          </ul>

          {!user ? (
            <Link to="/register" className="btn-secondary w-full justify-center">
              Get Started Free
            </Link>
          ) : (
            <div className="flex items-center justify-center gap-2 py-3 rounded-[10px] bg-gray-100 text-sm text-gray-500">
              {isPro ? 'Previous plan' : (
                <>
                  <CheckCircleIcon className="w-4 h-4 text-green-500" />
                  Current Plan
                </>
              )}
            </div>
          )}
        </motion.div>

        {/* Pro */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          className={`card p-8 relative overflow-hidden ${isPro ? 'border-2 border-green-400' : ''}`}
        >
          {/* Glow effect */}
          <div className="absolute top-0 right-0 w-40 h-40 bg-green-100 rounded-full blur-3xl opacity-60 -translate-y-10 translate-x-10 pointer-events-none" />

          <div className="relative">
            <div className="flex items-center gap-2 mb-4">
              <span className="badge-green">Pro</span>
              <span className="badge bg-amber-100 text-amber-700">Most Popular</span>
            </div>
            <div className="text-5xl font-bold text-gray-900 mb-1">
              ₹999<span className="text-xl font-normal text-gray-500">/mo</span>
            </div>
            <p className="text-gray-500 text-sm mb-6">Everything in Free, plus powerful extras</p>

            <ul className="space-y-3 mb-8">
              {PRO_FEATURES.map((f) => (
                <li key={f} className="flex items-center gap-2.5 text-sm text-gray-700">
                  <CheckCircleIcon className="w-4 h-4 text-green-500 flex-shrink-0" />
                  {f}
                </li>
              ))}
            </ul>

            {isPro ? (
              <div className="flex items-center justify-center gap-2 py-3 rounded-[10px] bg-green-100 text-sm text-green-700 font-semibold">
                <CheckCircleIcon className="w-4 h-4" />
                Active Plan ✨
              </div>
            ) : (
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleUpgrade}
                disabled={loading}
                className="btn-primary w-full justify-center py-3"
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Processing...
                  </span>
                ) : (
                  <>
                    <CreditCardIcon className="w-4 h-4" />
                    Upgrade to Pro — ₹999/mo
                    <ArrowRightIcon className="w-4 h-4" />
                  </>
                )}
              </motion.button>
            )}

            <p className="text-center text-xs text-gray-400 mt-3">
              Secure payment via Razorpay · Cancel anytime
            </p>
          </div>
        </motion.div>
      </div>

      {/* FAQ */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="mt-12 card p-8"
      >
        <h2 className="font-bold text-gray-900 text-xl mb-6">Frequently Asked Questions</h2>
        <div className="space-y-5">
          {[
            { q: 'Can I cancel anytime?', a: 'Yes! You can cancel your Pro subscription at any time from this page. No questions asked.' },
            { q: 'Is the payment secure?', a: 'All payments are processed through Razorpay, India\'s most trusted payment gateway. We never store your card details.' },
            { q: 'What happens after I upgrade?', a: 'Your plan is activated instantly after payment. You\'ll get access to all Pro features immediately.' },
            { q: 'Do you offer refunds?', a: 'We offer a 7-day refund policy if you\'re not satisfied. Contact our support team.' },
          ].map((faq) => (
            <div key={faq.q}>
              <p className="font-semibold text-gray-900 text-sm">{faq.q}</p>
              <p className="text-gray-500 text-sm mt-1 leading-relaxed">{faq.a}</p>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
};

export default Pricing;
