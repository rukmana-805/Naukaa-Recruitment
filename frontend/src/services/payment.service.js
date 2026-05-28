import api from './api';

export const paymentService = {
  createOrder: (planId) => api.post('/payment/create-order', { planId }),
  verifyPayment: (data) => api.post('/payment/verify', data),
  getMySubscription: () => api.get('/payment/subscription/me'),
  cancelSubscription: () => api.post('/payment/subscription/cancel'),
  retryPayment: (paymentId) => api.post('/payment/retry', { paymentId }),
  markPaymentFailed: (razorpay_order_id) => api.post('/payment/fail', { razorpay_order_id }),
  getActivePlans: () => api.get('/payment/plans'),
  getPaymentHistory: () => api.get('/payment/history'),
};

export const loadRazorpayScript = () =>
  new Promise((resolve) => {
    if (document.getElementById('razorpay-script')) {
      resolve(true);
      return;
    }
    const script = document.createElement('script');
    script.id = 'razorpay-script';
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });

export const RAZORPAY_KEY_ID = 'rzp_test_SjHlCc8e3tlrTr';
