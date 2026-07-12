import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  FileText, 
  History, 
  UploadCloud, 
  ArrowRight, 
  Calendar,
  CheckCircle,
  FileCheck,
  Plus
} from 'lucide-react';
import { resumeService, comparisonService } from '../services/api';

const Dashboard = () => {
  const [resumes, setResumes] = useState([]);
  const [comparisons, setComparisons] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [resumesData, comparisonsData] = await Promise.all([
          resumeService.getAll(),
          comparisonService.getAll()
        ]);
        setResumes(resumesData);
        setComparisons(comparisonsData);
      } catch (err) {
        console.error('Failed to load dashboard data:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center py-20">
        <div className="w-10 h-10 border-4 border-slate-200 border-t-blue-600 rounded-full animate-spin"></div>
      </div>
    );
  }

  // Slice recent data
  const recentResumes = resumes.slice(0, 5);
  const recentComparisons = comparisons.slice(0, 5);

  return (
    <div className="space-y-8">
      {/* Welcome Banner */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Welcome Back</h1>
          <p className="text-slate-500 text-sm">Here is a summary of your resume screening workspace.</p>
        </div>
        <div className="flex gap-3">
          <Link
            to="/upload"
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-semibold transition-all shadow-sm"
          >
            <UploadCloud className="w-4 h-4" />
            Upload Resumes
          </Link>
          <Link
            to="/jobs"
            className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-sm font-semibold transition-all border border-slate-250"
          >
            <Plus className="w-4 h-4" />
            Create Job Post
          </Link>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-sm font-medium text-slate-500 uppercase tracking-wider">Total Resumes</p>
            <h3 className="text-3xl font-extrabold text-slate-900">{resumes.length}</h3>
          </div>
          <div className="w-12 h-12 bg-blue-50 border border-blue-100 rounded-xl flex items-center justify-center text-blue-600">
            <FileText className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-sm font-medium text-slate-500 uppercase tracking-wider">Total Comparisons</p>
            <h3 className="text-3xl font-extrabold text-slate-900">{comparisons.length}</h3>
          </div>
          <div className="w-12 h-12 bg-emerald-50 border border-emerald-100 rounded-xl flex items-center justify-center text-emerald-600">
            <History className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Lists Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Recent Comparisons */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
          <div className="p-5 border-b border-slate-200 flex justify-between items-center bg-slate-50/50">
            <h3 className="font-bold text-slate-800 flex items-center gap-2">
              <History className="w-5 h-5 text-slate-500" />
              Recent Comparisons
            </h3>
            {comparisons.length > 5 && (
              <Link to="/history" className="text-xs font-semibold text-blue-600 hover:text-blue-500 flex items-center gap-1">
                View All <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            )}
          </div>
          <div className="divide-y divide-slate-150 flex-1">
            {recentComparisons.length > 0 ? (
              recentComparisons.map((c) => (
                <Link
                  key={c._id}
                  to={`/comparisons/${c._id}`}
                  className="p-5 flex justify-between items-center hover:bg-slate-50/80 transition-all group"
                >
                  <div className="min-w-0">
                    <p className="font-semibold text-slate-800 group-hover:text-blue-600 truncate transition-colors text-sm">
                      {c.jobDescriptionId?.jobTitle || 'Deleted Job'}
                    </p>
                    <p className="text-xs text-slate-400 truncate mt-0.5">
                      Company: {c.jobDescriptionId?.company || 'N/A'} • Candidates: {c.resumeIds.length}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0 text-slate-400">
                    <span className="text-xs font-medium text-slate-400 flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5" />
                      {new Date(c.timestamp).toLocaleDateString()}
                    </span>
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform text-slate-300 group-hover:text-blue-500" />
                  </div>
                </Link>
              ))
            ) : (
              <div className="p-8 text-center text-slate-450 text-sm">
                No comparison history yet. Define a job and run screening to start.
              </div>
            )}
          </div>
        </div>

        {/* Recently Uploaded Resumes */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
          <div className="p-5 border-b border-slate-200 flex justify-between items-center bg-slate-50/50">
            <h3 className="font-bold text-slate-800 flex items-center gap-2">
              <FileText className="w-5 h-5 text-slate-500" />
              Recent Uploads
            </h3>
            {resumes.length > 5 && (
              <Link to="/library" className="text-xs font-semibold text-blue-600 hover:text-blue-500 flex items-center gap-1">
                View All <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            )}
          </div>
          <div className="divide-y divide-slate-150 flex-1">
            {recentResumes.length > 0 ? (
              recentResumes.map((r) => (
                <div key={r._id} className="p-5 flex justify-between items-center hover:bg-slate-50/40">
                  <div className="min-w-0">
                    <p className="font-semibold text-slate-850 truncate text-sm">
                      {r.parsedData?.candidateName || r.fileName}
                    </p>
                    <p className="text-xs text-slate-400 truncate mt-0.5">
                      Email: {r.parsedData?.email || 'N/A'} • Skills: {r.parsedData?.skills?.slice(0, 3).join(', ') || 'None'}
                      {r.parsedData?.skills?.length > 3 ? '...' : ''}
                    </p>
                  </div>
                  <span className="text-xs font-medium text-slate-450 shrink-0 flex items-center gap-1 border border-slate-200 bg-slate-50 px-2 py-1 rounded-lg">
                    <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />
                    Indexed
                  </span>
                </div>
              ))
            ) : (
              <div className="p-8 text-center text-slate-450 text-sm">
                No resumes uploaded yet. Upload resume files (PDF/DOCX) to build your library.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
