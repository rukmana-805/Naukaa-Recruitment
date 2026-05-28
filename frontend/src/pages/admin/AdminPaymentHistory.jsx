import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { CreditCardIcon, SearchIcon, CalendarIcon, BuildingIcon, UserIcon, ShieldIcon } from 'lucide-react';
import { adminService } from '../../services/admin.service';
import { PageLoader } from '../../components/Skeleton';
import toast from 'react-hot-toast';

const AdminPaymentHistory = () => {
  const [payments, setPayments] = useState([]);
  const [filteredPayments, setFilteredPayments] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');

  const fetchPayments = async (status = statusFilter) => {
    setLoading(true);
    try {
      const res = await adminService.getPayments({ status });
      const list = res.data.data || [];
      setPayments(list);
      setFilteredPayments(list);
    } catch (err) {
      toast.error('Failed to load transaction history');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setSearch('');
    fetchPayments(statusFilter);
  }, [statusFilter]);

  const handleSearch = (e) => {
    const val = e.target.value;
    setSearch(val);
    if (!val.trim()) {
      setFilteredPayments(payments);
    } else {
      const filtered = payments.filter((payment) => {
        const companyName = payment.company?.name || '';
        const ownerName = payment.user?.fullName || '';
        const ownerEmail = payment.user?.email || '';
        const planName = payment.plan?.name || '';
        return (
          companyName.toLowerCase().includes(val.toLowerCase()) ||
          ownerName.toLowerCase().includes(val.toLowerCase()) ||
          ownerEmail.toLowerCase().includes(val.toLowerCase()) ||
          planName.toLowerCase().includes(val.toLowerCase())
        );
      });
      setFilteredPayments(filtered);
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
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Payment Ledger</h1>
          <p className="text-gray-500 mt-1 text-xs font-semibold">Track subscription transactions and company-wide upgrades</p>
        </motion.div>

        {/* Filters & Search */}
        <div className="flex flex-col md:flex-row items-center gap-4 w-full md:w-auto">
          {/* Status Filter Tabs */}
          <div className="flex bg-gray-50 p-1.5 rounded-2xl w-full md:w-auto border border-gray-200/50">
            <button
              onClick={() => setStatusFilter('all')}
              className={`flex-1 md:px-5 py-2 text-xs font-black uppercase tracking-wider rounded-xl transition-all duration-200 cursor-pointer text-center ${
                statusFilter === 'all'
                  ? 'bg-white text-gray-900 shadow-sm border border-gray-200/40 font-bold'
                  : 'text-gray-550 hover:text-gray-900'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setStatusFilter('success')}
              className={`flex-1 md:px-5 py-2 text-xs font-black uppercase tracking-wider rounded-xl transition-all duration-200 cursor-pointer flex items-center justify-center gap-2 ${
                statusFilter === 'success'
                  ? 'bg-white text-green-700 shadow-sm border border-gray-200/40 font-bold'
                  : 'text-gray-550 hover:text-green-600'
              }`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
              Success
            </button>
            <button
              onClick={() => setStatusFilter('failed')}
              className={`flex-1 md:px-5 py-2 text-xs font-black uppercase tracking-wider rounded-xl transition-all duration-200 cursor-pointer flex items-center justify-center gap-2 ${
                statusFilter === 'failed'
                  ? 'bg-white text-red-700 shadow-sm border border-gray-200/40 font-bold'
                  : 'text-gray-550 hover:text-red-650'
              }`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
              Failed
            </button>
          </div>

          {/* Search */}
          <div className="relative w-full md:w-85">
            <input
              type="text"
              value={search}
              onChange={handleSearch}
              className="input pl-10 pr-4 py-2.5 bg-white border border-gray-200 focus:ring-2 focus:ring-green-500 rounded-xl"
              placeholder="Search by company, owner, or plan..."
            />
            <SearchIcon className="absolute left-3.5 top-3.5 w-4.5 h-4.5 text-gray-400" />
          </div>
        </div>
      </div>

      {/* Transaction Logs Table */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        className="card overflow-hidden border border-gray-100 bg-white"
      >
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50/70 border-b border-gray-100 text-[10px] font-black text-gray-400 uppercase tracking-widest">
                <th className="py-4 px-6">Payment Date</th>
                <th className="py-4 px-6">Company / Organization</th>
                <th className="py-4 px-6">Owner Account</th>
                <th className="py-4 px-6">Subscribed Package</th>
                <th className="py-4 px-6">Amount</th>
                <th className="py-4 px-6">Transaction Identifiers</th>
                <th className="py-4 px-6">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-xs">
              {filteredPayments.map((payment) => (
                <tr key={payment._id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="py-4.5 px-6 whitespace-nowrap text-gray-500 font-medium">
                    <span className="flex items-center gap-2">
                      <CalendarIcon className="w-4 h-4 text-gray-450 shrink-0" />
                      {new Date(payment.createdAt).toLocaleDateString()}
                      <span className="text-[10px] text-gray-400">
                        {new Date(payment.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </span>
                  </td>
                  <td className="py-4.5 px-6 font-bold text-gray-900">
                    <span className="flex items-center gap-2">
                      <BuildingIcon className="w-4 h-4 text-gray-400 shrink-0" />
                      <div className="min-w-0">
                        <p className="truncate leading-none">{payment.company?.name || 'Individual Entity'}</p>
                        <p className="text-[9px] text-gray-400 font-bold uppercase mt-1 tracking-wider">
                          {payment.company?.organizationType || 'INDIVIDUAL'}
                        </p>
                      </div>
                    </span>
                  </td>
                  <td className="py-4.5 px-6 text-gray-650 font-medium">
                    <span className="flex items-center gap-2">
                      <UserIcon className="w-4 h-4 text-gray-400 shrink-0" />
                      <div>
                        <p className="font-bold text-gray-800 leading-none">{payment.user?.fullName || 'N/A'}</p>
                        <p className="text-[10px] text-gray-400 mt-1">{payment.user?.email || 'No email registered'}</p>
                      </div>
                    </span>
                  </td>
                  <td className="py-4.5 px-6 font-semibold">
                    <span className="badge-purple">{payment.plan?.name || 'Premium Plan'}</span>
                  </td>
                  <td className="py-4.5 px-6 font-black text-gray-900 text-sm">
                    ₹{payment.amount}
                  </td>
                  <td className="py-4.5 px-6 font-mono text-[10px] text-gray-550">
                    {payment.razorpay_payment_id ? (
                      <div>
                        <p className="font-semibold text-gray-800">Txn: {payment.razorpay_payment_id}</p>
                        <p className="text-gray-400 mt-0.5">Order: {payment.razorpay_order_id}</p>
                      </div>
                    ) : (
                      <span className="italic text-gray-400">Order ID: {payment.razorpay_order_id}</span>
                    )}
                  </td>
                  <td className="py-4.5 px-6">
                    <span className={`badge capitalize font-bold ${
                      payment.status === 'success' ? 'badge-green' :
                      payment.status === 'failed' ? 'badge-red' :
                      payment.status === 'created' ? 'badge-amber' :
                      'badge-gray'
                    }`}>
                      {payment.status}
                    </span>
                  </td>
                </tr>
              ))}

              {filteredPayments.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-gray-400 italic">
                    <div className="flex flex-col items-center justify-center space-y-2">
                      <CreditCardIcon className="w-10 h-10 text-gray-300" />
                      <p className="text-xs font-bold text-gray-600">
                        No {statusFilter !== 'all' ? `${statusFilter} ` : ''}transactions found
                      </p>
                      <p className="text-[11px] text-gray-400 max-w-xs leading-relaxed">
                        Either no matching payment records exist in the registry, or your search term does not match any current logs.
                      </p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </motion.div>
    </div>
  );
};

export default AdminPaymentHistory;
