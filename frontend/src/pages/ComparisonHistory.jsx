import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  History, 
  Trash2, 
  Eye, 
  Calendar, 
  Briefcase, 
  ArrowRight,
  Loader2
} from 'lucide-react';
import { comparisonService } from '../services/api';

const ComparisonHistory = () => {
  const [comparisons, setComparisons] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchComparisons();
  }, []);

  const fetchComparisons = async () => {
    try {
      const data = await comparisonService.getAll();
      setComparisons(data);
    } catch (err) {
      console.error('Failed to load comparisons list:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id, e) => {
    e.stopPropagation();
    e.preventDefault();
    
    if (!window.confirm('Are you sure you want to delete this comparison history? This will only remove the ranking log; original resume files will remain intact.')) return;

    try {
      await comparisonService.delete(id);
      setComparisons(comparisons.filter(c => c._id !== id));
    } catch (err) {
      alert('Failed to delete comparison record: ' + (err.response?.data?.message || err.message));
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
          <History className="w-6 h-6 text-slate-650" />
          Comparison History
        </h1>
        <p className="text-slate-500 text-sm mt-1">Review, open, or delete your previous AI candidate ranking reports.</p>
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-20 bg-white border border-slate-200 rounded-2xl shadow-sm">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        </div>
      ) : comparisons.length > 0 ? (
        <div className="bg-white border border-slate-200 shadow-sm rounded-2xl overflow-hidden">
          <div className="divide-y divide-slate-150">
            {comparisons.map((c) => (
              <Link 
                key={c._id}
                to={`/comparisons/${c._id}`}
                className="p-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 hover:bg-slate-50/50 transition-colors group"
              >
                <div className="flex items-start gap-3.5 min-w-0">
                  <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center shrink-0 text-slate-550 border border-slate-200">
                    <Briefcase className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-bold text-slate-800 text-sm truncate group-hover:text-blue-650 transition-colors">
                      {c.jobDescriptionId?.jobTitle || 'Deleted Job Position'}
                    </h3>
                    <p className="text-xs text-slate-450 truncate mt-0.5">
                      Company: {c.jobDescriptionId?.company || 'N/A'} • Candidates Ranked: {c.resumeIds.length}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-4 self-end sm:self-center shrink-0 text-slate-400">
                  <span className="text-xs font-semibold text-slate-400 flex items-center gap-1 border border-slate-200 bg-slate-50 px-2.5 py-1 rounded-xl">
                    <Calendar className="w-3.5 h-3.5" />
                    {new Date(c.timestamp).toLocaleDateString()}
                  </span>
                  
                  <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                    <Link
                      to={`/comparisons/${c._id}`}
                      className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-105 rounded-lg transition-colors"
                      title="Open Report"
                    >
                      <Eye className="w-4.5 h-4.5" />
                    </Link>
                    <button
                      onClick={(e) => handleDelete(c._id, e)}
                      className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                      title="Delete Log"
                    >
                      <Trash2 className="w-4.5 h-4.5" />
                    </button>
                  </div>
                  
                  <ArrowRight className="w-4 h-4 hidden sm:block group-hover:translate-x-1 transition-transform text-slate-300 group-hover:text-blue-600" />
                </div>
              </Link>
            ))}
          </div>
        </div>
      ) : (
        <div className="text-center text-slate-450 text-sm py-20 bg-white border border-slate-200 rounded-2xl shadow-sm">
          No comparison history found. Define jobs, upload resumes, and trigger candidate ranking to start tracking history.
        </div>
      )}
    </div>
  );
};

export default ComparisonHistory;
