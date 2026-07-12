import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useLocation, Outlet } from 'react-router-dom';
import {
  LayoutDashboard,
  Library,
  UploadCloud,
  Briefcase,
  History,
  LogOut,
  User,
  Menu,
  X,
  FileCheck2
} from 'lucide-react';
import { authService } from '../services/api';

const Layout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [recruiter, setRecruiter] = useState(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUser = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/login');
        return;
      }
      try {
        const data = await authService.getMe();
        setRecruiter(data);
      } catch (err) {
        console.error('Failed to get recruiter context:', err);
        authService.logout();
        navigate('/login');
      } finally {
        setLoading(false);
      }
    };
    fetchUser();
  }, [navigate]);

  const handleLogout = async () => {
    await authService.logout();
    navigate('/login');
  };

  const navItems = [
    { name: 'Dashboard', path: '/', icon: LayoutDashboard },
    { name: 'Upload Resumes', path: '/upload', icon: UploadCloud },
    { name: 'Resume Library', path: '/library', icon: Library },
    { name: 'Create Job Post', path: '/jobs', icon: Briefcase },
    { name: 'Comparison History', path: '/history', icon: History },
  ];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 border-4 border-slate-200 border-t-blue-600 rounded-full animate-spin"></div>
          <p className="text-slate-500 font-medium animate-pulse">Loading workspace...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-slate-50">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-64 bg-slate-900 text-slate-300 border-r border-slate-800 shrink-0">
        <div className="h-16 flex items-center gap-2 px-6 border-b border-slate-800">
          <FileCheck2 className="w-7 h-7 text-blue-500" />
          <span className="font-bold text-white text-lg tracking-tight">ResumeScreener</span>
          <span className="text-xs bg-blue-900/50 text-blue-400 font-semibold px-2 py-0.5 rounded border border-blue-800/40">AI</span>
        </div>

        <nav className="flex-1 py-6 px-4 space-y-1.5">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            const Icon = item.icon;
            return (
              <Link
                key={item.name}
                to={item.path}
                className={`flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${isActive
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-900/20'
                    : 'hover:bg-slate-800 hover:text-white'
                  }`}
              >
                <Icon className="w-5 h-5 shrink-0" />
                {item.name}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-slate-800">
          <div className="flex items-center gap-3 px-4 py-3 rounded-lg bg-slate-800/50 border border-slate-850 mb-3">
            <div className="w-9 h-9 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold text-sm">
              {recruiter?.name ? recruiter.name.charAt(0).toUpperCase() : <User className="w-5 h-5" />}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-white truncate">{recruiter?.name || 'Recruiter'}</p>
              <p className="text-xs text-slate-500 truncate">{recruiter?.email || 'recruiter@screener.ai'}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 w-full px-4 py-2.5 rounded-lg text-sm font-medium text-slate-400 hover:bg-red-950/20 hover:text-red-400 transition-colors"
          >
            <LogOut className="w-5 h-5" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Mobile Sliding Sidebar */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden bg-slate-900/40 backdrop-blur-sm">
          <div className="relative flex flex-col w-64 max-w-xs bg-slate-900 text-slate-300">
            <div className="absolute top-0 right-0 -mr-12 pt-4">
              <button
                type="button"
                className="ml-1 flex items-center justify-center h-10 w-10 rounded-full focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
                onClick={() => setMobileMenuOpen(false)}
              >
                <X className="h-6 w-6 text-white" />
              </button>
            </div>

            <div className="h-16 flex items-center gap-2 px-6 border-b border-slate-800 shrink-0">
              <FileCheck2 className="w-7 h-7 text-blue-500" />
              <span className="font-bold text-white text-lg tracking-tight">ResumeScreener</span>
            </div>

            <nav className="flex-1 py-6 px-4 space-y-1.5 overflow-y-auto">
              {navItems.map((item) => {
                const isActive = location.pathname === item.path;
                const Icon = item.icon;
                return (
                  <Link
                    key={item.name}
                    to={item.path}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${isActive
                        ? 'bg-blue-600 text-white shadow-md'
                        : 'hover:bg-slate-800 hover:text-white'
                      }`}
                  >
                    <Icon className="w-5 h-5 shrink-0" />
                    {item.name}
                  </Link>
                );
              })}
            </nav>

            <div className="p-4 border-t border-slate-800 shrink-0">
              <div className="flex items-center gap-3 px-4 py-3 rounded-lg bg-slate-800/50 mb-3">
                <div className="w-9 h-9 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold text-sm">
                  {recruiter?.name ? recruiter.name.charAt(0).toUpperCase() : <User className="w-5 h-5" />}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-white truncate">{recruiter?.name}</p>
                  <p className="text-xs text-slate-500 truncate">{recruiter?.email}</p>
                </div>
              </div>
              <button
                onClick={handleLogout}
                className="flex items-center gap-3 w-full px-4 py-2.5 rounded-lg text-sm font-medium text-slate-400 hover:bg-red-950/20 hover:text-red-400 transition-colors"
              >
                <LogOut className="w-5 h-5" />
                Sign Out
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Workspace Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Header */}
        <header className="h-16 flex items-center justify-between px-6 bg-white border-b border-slate-200 shrink-0">
          <button
            type="button"
            className="md:hidden -ml-2 p-2 rounded-md text-slate-500 hover:text-slate-900"
            onClick={() => setMobileMenuOpen(true)}
          >
            <Menu className="h-6 w-6" />
          </button>

          <div className="hidden md:block">
            <h1 className="text-sm font-semibold text-slate-500">
              Recruiter Dashboard <span className="text-slate-300 mx-2">/</span>
              <span className="text-slate-800 capitalize">
                {location.pathname.substring(1) || 'overview'}
              </span>
            </h1>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-xs font-semibold px-2 py-1 rounded bg-slate-100 text-slate-600 border border-slate-200">
              Session Mode: JWT
            </span>
            <div className="h-4 w-px bg-slate-200"></div>
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-full bg-slate-200 flex items-center justify-center font-bold text-xs text-slate-700">
                {recruiter?.name ? recruiter.name.charAt(0).toUpperCase() : 'R'}
              </div>
              <span className="text-sm font-medium text-slate-700 hidden sm:inline">
                {recruiter?.name}
              </span>
            </div>
          </div>
        </header>

        {/* Content Outlet */}
        <main className="flex-1 overflow-y-auto p-6 md:p-8">
          <div className="max-w-6xl mx-auto">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default Layout;
