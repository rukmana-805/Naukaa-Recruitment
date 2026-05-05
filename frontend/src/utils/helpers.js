// Date formatting
export const formatDate = (dateString) => {
  if (!dateString) return '—';
  const date = new Date(dateString);
  return date.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
};

export const formatRelativeDate = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now - date;
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
  return formatDate(dateString);
};

// Salary formatting
export const formatSalary = (min, max) => {
  if (!min && !max) return 'Not disclosed';
  const fmt = (n) => {
    if (n >= 100000) return `₹${(n / 100000).toFixed(1)}L`;
    if (n >= 1000) return `₹${(n / 1000).toFixed(0)}K`;
    return `₹${n}`;
  };
  if (min && max) return `${fmt(min)} – ${fmt(max)}`;
  if (min) return `From ${fmt(min)}`;
  return `Upto ${fmt(max)}`;
};

// Experience formatting
export const formatExperience = (min, max) => {
  if (!min && !max) return 'Any experience';
  if (min === 0 && max === 0) return 'Fresher';
  if (min && max) return `${min}–${max} yrs`;
  if (min) return `${min}+ yrs`;
  return `Upto ${max} yrs`;
};

// Status colors
export const getStatusBadgeClass = (status) => {
  const map = {
    applied: 'badge-blue',
    reviewing: 'badge-amber',
    shortlisted: 'badge-green',
    interview: 'badge-amber',
    hired: 'badge-green',
    rejected: 'badge-red',
    open: 'badge-green',
    closed: 'badge-gray',
    success: 'badge-green',
    failed: 'badge-red',
    created: 'badge-amber',
    active: 'badge-green',
    expired: 'badge-gray',
  };
  return map[status] || 'badge-gray';
};

// Extract error message from axios error
export const getErrorMessage = (error) => {
  return (
    error?.response?.data?.message ||
    error?.response?.data?.error ||
    error?.message ||
    'Something went wrong'
  );
};

// Truncate text
export const truncate = (text, maxLength = 100) => {
  if (!text) return '';
  return text.length > maxLength ? text.slice(0, maxLength) + '...' : text;
};

// Initials from name
export const getInitials = (name) => {
  if (!name) return '?';
  return name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
};
