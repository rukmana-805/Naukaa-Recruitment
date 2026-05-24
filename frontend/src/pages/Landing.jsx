import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
  BriefcaseIcon, SearchIcon, UsersIcon, TrendingUpIcon,
  StarIcon, CheckCircleIcon, ArrowRightIcon, BuildingIcon,
  ZapIcon, ShieldCheckIcon, BarChartIcon,
} from 'lucide-react';

const features = [
  {
    icon: SearchIcon,
    title: 'Smart Job Search',
    desc: 'AI-powered search that understands your skills and finds the most relevant opportunities.',
    color: 'bg-green-100 text-green-600',
  },
  {
    icon: ZapIcon,
    title: 'Easy Apply',
    desc: 'Apply to jobs in seconds with your saved profile. No repetitive forms.',
    color: 'bg-blue-100 text-blue-600',
  },
  {
    icon: TrendingUpIcon,
    title: 'Career Insights',
    desc: 'Track your application pipeline and get actionable insights to improve.',
    color: 'bg-purple-100 text-purple-600',
  },
  {
    icon: ShieldCheckIcon,
    title: 'Verified Companies',
    desc: 'All companies on Naukaa are verified. No fake listings, ever.',
    color: 'bg-amber-100 text-amber-600',
  },
  {
    icon: UsersIcon,
    title: 'Recruiter Network',
    desc: 'Get discovered by top recruiters actively looking for talent like you.',
    color: 'bg-rose-100 text-rose-600',
  },
  {
    icon: BarChartIcon,
    title: 'Resume Builder',
    desc: 'Upload your resume and let our system optimize it for ATS compatibility.',
    color: 'bg-teal-100 text-teal-600',
  },
];

const stats = [
  { value: '50K+', label: 'Active Jobs' },
  { value: '12K+', label: 'Companies' },
  { value: '2M+', label: 'Job Seekers' },
  { value: '94%', label: 'Success Rate' },
];

const testimonials = [
  {
    name: 'Priya Sharma',
    role: 'SDE-2 at Razorpay',
    text: 'Got my dream job in 3 weeks! The smart matching is incredible.',
    rating: 5,
  },
  {
    name: 'Rahul Verma',
    role: 'Product Manager at Flipkart',
    text: 'The easiest job application process I\'ve ever experienced. Highly recommend!',
    rating: 5,
  },
  {
    name: 'Ananya Singh',
    role: 'Data Scientist at Swiggy',
    text: 'Naukaa connected me with recruiters I never would have found otherwise.',
    rating: 5,
  },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

const Landing = () => {
  return (
    <div className="overflow-hidden">
      {/* ── HERO ── */}
      <section className="relative bg-white pt-16 pb-20 lg:pt-24 lg:pb-28">
        {/* Background pattern */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-green-50 via-white to-white" />
        <div className="absolute top-20 right-10 w-72 h-72 bg-green-100 rounded-full blur-3xl opacity-40" />
        <div className="absolute bottom-10 left-10 w-48 h-48 bg-emerald-100 rounded-full blur-3xl opacity-30" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto text-center">
            {/* Badge */}
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-green-50 border border-green-200 mb-6"
            >
              <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              <span className="text-xs font-semibold text-green-700">50,000+ Jobs Available Now</span>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-5xl lg:text-6xl font-bold text-gray-900 leading-tight mb-6"
            >
              Find Your{' '}
              <span className="text-green-500 relative">
                Dream Job
                <svg className="absolute -bottom-2 left-0 w-full" viewBox="0 0 300 12" fill="none">
                  <path d="M2 10C50 4 250 4 298 10" stroke="#86efac" strokeWidth="3" strokeLinecap="round"/>
                </svg>
              </span>
              {' '}Faster
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-lg text-gray-500 mb-10 leading-relaxed"
            >
              India's smartest job platform. AI-matched opportunities, verified companies,
              and a profile that works for you 24/7.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="flex flex-col sm:flex-row items-center gap-4 justify-center"
            >
              <Link to="/register" className="btn-primary text-base px-7 py-3">
                Get Started Free
                <ArrowRightIcon className="w-4 h-4" />
              </Link>
              <Link to="/jobs" className="btn-secondary text-base px-7 py-3">
                Browse Jobs
                <SearchIcon className="w-4 h-4" />
              </Link>
            </motion.div>

            {/* Trust signals */}
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="mt-6 text-xs text-gray-400"
            >
              ✓ Free to join &nbsp;·&nbsp; ✓ No spam &nbsp;·&nbsp; ✓ 2M+ professionals trust Naukaa
            </motion.p>
          </div>

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-4"
          >
            {stats.map((stat) => (
              <div key={stat.label} className="card p-5 text-center">
                <div className="text-3xl font-bold text-green-500 mb-1">{stat.value}</div>
                <div className="text-sm text-gray-500">{stat.label}</div>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <motion.span
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              className="text-xs font-bold text-green-600 uppercase tracking-widest"
            >
              Features
            </motion.span>
            <motion.h2
              initial={{ opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              className="text-3xl font-bold text-gray-900 mt-2"
            >
              Everything you need to land your next role
            </motion.h2>
          </div>

          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {features.map((f) => (
              <motion.div key={f.title} variants={itemVariants} className="card p-6 group">
                <div className={`w-11 h-11 rounded-2xl ${f.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                  <f.icon className="w-5 h-5" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">{f.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{f.desc}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>



      {/* ── TESTIMONIALS ── */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <span className="text-xs font-bold text-green-600 uppercase tracking-widest">Testimonials</span>
            <h2 className="text-3xl font-bold text-gray-900 mt-2">Loved by job seekers</h2>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {testimonials.map((t, i) => (
              <motion.div
                key={t.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className="card p-6"
              >
                <div className="flex gap-1 mb-4">
                  {Array.from({ length: t.rating }).map((_, j) => (
                    <StarIcon key={j} className="w-4 h-4 text-amber-400 fill-amber-400" />
                  ))}
                </div>
                <p className="text-gray-700 text-sm leading-relaxed mb-4">"{t.text}"</p>
                <div>
                  <p className="font-semibold text-gray-900 text-sm">{t.name}</p>
                  <p className="text-xs text-gray-500">{t.role}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="py-20 bg-green-500">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            className="text-3xl font-bold text-white mb-4"
          >
            Ready to find your dream job?
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-green-100 mb-8"
          >
            Join 2 million professionals already using Naukaa to accelerate their careers.
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="flex flex-col sm:flex-row gap-4 justify-center"
          >
            <Link
              to="/register"
              className="inline-flex items-center justify-center gap-2 px-8 py-3 rounded-[10px] font-semibold bg-white text-green-600 hover:bg-green-50 transition-colors shadow-sm"
            >
              Create Free Account
              <ArrowRightIcon className="w-4 h-4" />
            </Link>
            <Link
              to="/jobs"
              className="inline-flex items-center justify-center gap-2 px-8 py-3 rounded-[10px] font-semibold bg-green-600 text-white hover:bg-green-700 transition-colors"
            >
              Browse Jobs
            </Link>
          </motion.div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="bg-white border-t border-gray-100 py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 bg-green-500 rounded-lg flex items-center justify-center">
                <BriefcaseIcon className="w-4 h-4 text-white" />
              </div>
              <span className="font-bold text-gray-900">Naukaa<span className="text-green-500">.</span></span>
            </div>
            <p className="text-xs text-gray-400">© 2025 Naukaa. All rights reserved. Built with ❤️ in India</p>
            <div className="flex gap-6">
              {['Privacy', 'Terms', 'Contact'].map((l) => (
                <a key={l} href="#" className="text-xs text-gray-500 hover:text-green-600 transition-colors">{l}</a>
              ))}
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
