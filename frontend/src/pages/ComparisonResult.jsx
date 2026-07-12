import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { 
  FileCheck, 
  ArrowLeft, 
  Trash2, 
  HelpCircle, 
  CheckCircle2, 
  AlertCircle,
  Clock,
  Sparkles,
  ChevronDown,
  ChevronUp,
  Award
} from 'lucide-react';
import { comparisonService } from '../services/api';

const ComparisonResult = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [comparison, setComparison] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Accordion state mapping candidate resume ID -> boolean
  const [expandedCandidates, setExpandedCandidates] = useState({});

  useEffect(() => {
    const fetchResult = async () => {
      try {
        const data = await comparisonService.getById(id);
        setComparison(data);
        
        // Expand the first candidate by default
        if (data.rankingResult && data.rankingResult.length > 0) {
          setExpandedCandidates({
            [data.rankingResult[0].resumeId]: true
          });
        }
      } catch (err) {
        console.error(err);
        setError('Failed to load comparison details. It may have been deleted or you do not have permission.');
      } finally {
        setLoading(false);
      }
    };
    fetchResult();
  }, [id]);

  const toggleExpand = (resumeId) => {
    setExpandedCandidates(prev => ({
      ...prev,
      [resumeId]: !prev[resumeId]
    }));
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this comparison history? This will only remove the ranking log; original resume files will remain in your library.')) return;

    try {
      await comparisonService.delete(id);
      navigate('/history');
    } catch (err) {
      alert('Failed to delete comparison: ' + (err.response?.data?.message || err.message));
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-20">
        <div className="w-10 h-10 border-4 border-slate-200 border-t-blue-600 rounded-full animate-spin"></div>
      </div>
    );
  }

  if (error || !comparison) {
    return (
      <div className="space-y-6">
        <Link to="/history" className="flex items-center gap-1.5 text-xs font-semibold text-slate-550 hover:text-slate-800">
          <ArrowLeft className="w-4 h-4" /> Back to History
        </Link>
        <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-750 p-4 rounded-xl text-sm shadow-sm">
          <AlertCircle className="w-5 h-5 shrink-0 text-red-500" />
          <span>{error || 'Comparison not found.'}</span>
        </div>
      </div>
    );
  }

  const { jobDescriptionId, rankingResult, aiSummary, timestamp, resumeIds } = comparison;

  // Helper to map resumeId to Resume details (Name, file etc)
  const getResumeDetails = (resumeId) => {
    const resDoc = resumeIds.find(r => r._id === resumeId || r === resumeId);
    if (resDoc && typeof resDoc === 'object') {
      return {
        name: resDoc.parsedData?.candidateName || resDoc.fileName || 'Candidate',
        fileName: resDoc.fileName,
        url: resDoc.fileUrl
      };
    }
    return { name: 'Candidate Profile (Removed)', fileName: '', url: '' };
  };

  const getScoreColor = (score) => {
    if (score >= 80) return 'text-emerald-700 bg-emerald-50 border-emerald-100';
    if (score >= 50) return 'text-amber-700 bg-amber-50 border-amber-105';
    return 'text-rose-700 bg-rose-50 border-rose-100';
  };

  return (
    <div className="space-y-8">
      {/* Header breadcrumb */}
      <div className="flex justify-between items-center gap-4">
        <Link to="/history" className="flex items-center gap-1.5 text-xs font-bold text-slate-550 hover:text-slate-800">
          <ArrowLeft className="w-4 h-4" /> Back to History
        </Link>
        <button
          onClick={handleDelete}
          className="flex items-center gap-1.5 px-3 py-1.5 border border-red-250 hover:bg-red-50 text-red-650 rounded-xl text-xs font-semibold transition-all shadow-sm"
        >
          <Trash2 className="w-3.5 h-3.5" />
          Delete History Log
        </button>
      </div>

      {/* Target Job Header Card */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 border-b border-slate-100 pb-4">
          <div>
            <h2 className="text-xl font-extrabold text-slate-900">{jobDescriptionId?.jobTitle}</h2>
            <p className="text-sm font-medium text-slate-500">{jobDescriptionId?.company}</p>
          </div>
          <span className="text-xs font-medium text-slate-400 flex items-center gap-1 shrink-0">
            <Clock className="w-3.5 h-3.5" />
            Ranked on {new Date(timestamp).toLocaleDateString()} at {new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-xs">
          <div>
            <h5 className="font-bold text-slate-450 uppercase mb-1">Required Experience</h5>
            <p className="text-slate-850 font-semibold">{jobDescriptionId?.experienceRequired || 'Not specified'}</p>
          </div>
          <div>
            <h5 className="font-bold text-slate-450 uppercase mb-1">Required Skills</h5>
            <p className="text-slate-850 font-semibold truncate" title={jobDescriptionId?.requiredSkills?.join(', ')}>
              {jobDescriptionId?.requiredSkills?.join(', ') || 'N/A'}
            </p>
          </div>
          <div>
            <h5 className="font-bold text-slate-450 uppercase mb-1">Preferred Skills</h5>
            <p className="text-slate-850 font-semibold truncate" title={jobDescriptionId?.preferredSkills?.join(', ')}>
              {jobDescriptionId?.preferredSkills?.join(', ') || 'None'}
            </p>
          </div>
          <div>
            <h5 className="font-bold text-slate-450 uppercase mb-1">Total Candidates</h5>
            <p className="text-slate-850 font-semibold">{rankingResult.length}</p>
          </div>
        </div>
      </div>

      {/* AI Summary Section */}
      {aiSummary && (
        <div className="bg-blue-50/40 border border-blue-150 p-6 rounded-2xl shadow-sm space-y-2">
          <h3 className="font-bold text-blue-900 flex items-center gap-1.5 text-sm uppercase tracking-wider">
            <Sparkles className="w-4.5 h-4.5 text-blue-600 shrink-0" />
            AI Screener Summary
          </h3>
          <p className="text-slate-700 text-sm leading-relaxed font-medium">{aiSummary}</p>
        </div>
      )}

      {/* Ranked Candidate List Accordion */}
      <div className="space-y-4">
        <h3 className="font-bold text-slate-800 text-base">Ranked Profiles</h3>
        
        <div className="space-y-4">
          {rankingResult.map((c) => {
            const isExpanded = !!expandedCandidates[c.resumeId];
            const candidateInfo = getResumeDetails(c.resumeId);
            const scoreClass = getScoreColor(c.score);

            return (
              <div 
                key={c.resumeId}
                className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden transition-all"
              >
                {/* Accordion Trigger Header */}
                <div 
                  onClick={() => toggleExpand(c.resumeId)}
                  className="p-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 cursor-pointer hover:bg-slate-50/50 transition-colors"
                >
                  <div className="flex items-center gap-4 min-w-0">
                    <span className="w-7 h-7 rounded-xl bg-slate-900 text-white font-extrabold text-xs flex items-center justify-center shrink-0">
                      #{c.rank}
                    </span>
                    <div className="min-w-0">
                      <h4 className="font-bold text-slate-850 text-sm truncate">{candidateInfo.name}</h4>
                      <p className="text-xs text-slate-400 mt-0.5 truncate">{candidateInfo.fileName}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0 self-end sm:self-center">
                    <span className={`px-2.5 py-1 border rounded-lg text-xs font-bold ${scoreClass}`}>
                      Score: {c.score}
                    </span>
                    <span className="text-[11px] font-semibold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-lg border border-slate-200">
                      {c.recommendation}
                    </span>
                    {isExpanded ? (
                      <ChevronUp className="w-5 h-5 text-slate-400 shrink-0" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-slate-400 shrink-0" />
                    )}
                  </div>
                </div>

                {/* Accordion Expand Body */}
                {isExpanded && (
                  <div className="px-5 pb-6 border-t border-slate-100 pt-5 bg-slate-50/30 text-sm space-y-5">
                    {/* Justification */}
                    <div className="space-y-1">
                      <h5 className="text-[10px] font-bold uppercase tracking-wider text-slate-450">AI Evaluation Justification</h5>
                      <p className="text-slate-700 leading-relaxed font-semibold text-xs">{c.justification}</p>
                    </div>

                    {/* Strengths / Gaps grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2 bg-emerald-50/20 border border-emerald-100/50 p-4 rounded-xl">
                        <h6 className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-800 flex items-center gap-1.5">
                          <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                          Key Strengths
                        </h6>
                        <ul className="list-disc pl-5 text-xs font-semibold text-slate-750 space-y-1">
                          {c.strengths?.map((str, idx) => (
                            <li key={idx}>{str}</li>
                          ))}
                        </ul>
                      </div>

                      <div className="space-y-2 bg-rose-50/15 border border-rose-100/50 p-4 rounded-xl">
                        <h6 className="text-[10px] font-extrabold uppercase tracking-wider text-rose-800 flex items-center gap-1.5">
                          <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                          Missing Skills / Gaps
                        </h6>
                        {c.missingSkills?.length > 0 ? (
                          <ul className="list-disc pl-5 text-xs font-semibold text-slate-750 space-y-1">
                            {c.missingSkills.map((gap, idx) => (
                              <li key={idx}>{gap}</li>
                            ))}
                          </ul>
                        ) : (
                          <p className="text-xs text-slate-450 italic pl-1.5 font-medium">None highlighted in context.</p>
                        )}
                      </div>
                    </div>

                    {/* View Original Doc Attachment link */}
                    {candidateInfo.url && (
                      <div className="flex justify-end pt-2">
                        <a
                          href={candidateInfo.url.startsWith('/uploads') ? `http://localhost:5000${candidateInfo.url}` : candidateInfo.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 text-xs font-bold text-blue-650 hover:text-blue-500 border border-blue-200 bg-white px-3 py-1.5 rounded-xl transition-all"
                        >
                          <FileCheck className="w-4 h-4" />
                          Review Original Resume
                        </a>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default ComparisonResult;
