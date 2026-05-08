import { motion } from 'framer-motion';

// Card skeleton
export const CardSkeleton = ({ className = '' }) => (
  <div className={`card p-5 ${className}`}>
    <div className="skeleton h-4 w-2/3 mb-3" />
    <div className="skeleton h-3 w-full mb-2" />
    <div className="skeleton h-3 w-4/5 mb-4" />
    <div className="flex gap-2">
      <div className="skeleton h-6 w-16 rounded-full" />
      <div className="skeleton h-6 w-20 rounded-full" />
    </div>
  </div>
);

// Job card skeleton
export const JobCardSkeleton = () => (
  <div className="card p-5">
    <div className="flex items-start gap-4 mb-4">
      <div className="skeleton w-12 h-12 rounded-xl shrink-0" />
      <div className="flex-1">
        <div className="skeleton h-5 w-3/4 mb-2" />
        <div className="skeleton h-4 w-1/2" />
      </div>
    </div>
    <div className="skeleton h-3 w-full mb-2" />
    <div className="skeleton h-3 w-5/6 mb-4" />
    <div className="flex gap-2">
      <div className="skeleton h-6 w-20 rounded-full" />
      <div className="skeleton h-6 w-24 rounded-full" />
      <div className="skeleton h-6 w-16 rounded-full" />
    </div>
  </div>
);

// Stats card skeleton
export const StatsSkeleton = () => (
  <div className="card p-5">
    <div className="skeleton h-3 w-1/2 mb-3" />
    <div className="skeleton h-8 w-1/3 mb-1" />
    <div className="skeleton h-3 w-2/3" />
  </div>
);

// Table row skeleton
export const TableRowSkeleton = ({ cols = 4 }) => (
  <tr>
    {Array.from({ length: cols }).map((_, i) => (
      <td key={i} className="px-4 py-3">
        <div className="skeleton h-4 w-full rounded" />
      </td>
    ))}
  </tr>
);

// Page loading spinner
export const PageLoader = () => (
  <div className="flex items-center justify-center min-h-[400px]">
    <motion.div
      className="w-10 h-10 border-4 border-green-100 border-t-green-500 rounded-full"
      animate={{ rotate: 360 }}
      transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
    />
  </div>
);

// Full screen loader
export const FullPageLoader = () => (
  <div className="fixed inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center z-50">
    <div className="flex flex-col items-center gap-4">
      <motion.div
        className="w-12 h-12 border-4 border-green-100 border-t-green-500 rounded-full"
        animate={{ rotate: 360 }}
        transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
      />
      <p className="text-sm text-gray-500 font-medium">Loading...</p>
    </div>
  </div>
);

export default CardSkeleton;
