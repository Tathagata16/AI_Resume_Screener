import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Library, 
  Search, 
  Trash2, 
  Eye, 
  Calendar, 
  Mail, 
  Award,
  X,
  FileCheck,
  Play,
  Loader2
} from 'lucide-react';
import { resumeService, jobService, comparisonService } from '../services/api';

const ResumeLibrary = () => {
  const navigate = useNavigate();
  const [resumes, setResumes] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Search & Filter
  const [searchName, setSearchName] = useState('');
  const [searchSkill, setSearchSkill] = useState('');
  
  // Selection
  const [selectedIds, setSelectedIds] = useState([]);
  const [selectedJobId, setSelectedJobId] = useState('');
  const [screenLoading, setScreenLoading] = useState(false);

  // Inspector Sidebar
  const [inspectorResume, setInspectorResume] = useState(null);

  useEffect(() => {
    loadLibraryData();
  }, []);

  const loadLibraryData = async () => {
    try {
      const [resumesData, jobsData] = await Promise.all([
        resumeService.getAll(),
        jobService.getAll()
      ]);
      setResumes(resumesData);
      setJobs(jobsData);
      if (jobsData.length > 0) {
        setSelectedJobId(jobsData[0]._id);
      }
    } catch (err) {
      console.error('Failed to load library data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const data = await resumeService.getAll(searchName, searchSkill);
      setResumes(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleClearSearch = async () => {
    setSearchName('');
    setSearchSkill('');
    setLoading(true);
    try {
      const data = await resumeService.getAll();
      setResumes(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id, e) => {
    e.stopPropagation();
    if (!window.confirm('Are you sure you want to delete this resume? This will permanently erase the database record, original file, and vector embeddings.')) return;

    try {
      await resumeService.delete(id);
      setResumes(resumes.filter(r => r._id !== id));
      setSelectedIds(selectedIds.filter(selId => selId !== id));
      if (inspectorResume?._id === id) {
        setInspectorResume(null);
      }
    } catch (err) {
      alert('Failed to delete resume: ' + (err.response?.data?.message || err.message));
    }
  };

  const handleToggleSelect = (id) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter(selId => selId !== id));
    } else {
      if (selectedIds.length >= 15) {
        alert('You can select a maximum of 15 resumes for a single comparison.');
        return;
      }
      setSelectedIds([...selectedIds, id]);
    }
  };

  const handleSelectAll = () => {
    if (selectedIds.length === resumes.length) {
      setSelectedIds([]);
    } else {
      const allIds = resumes.slice(0, 15).map(r => r._id);
      setSelectedIds(allIds);
    }
  };

  const triggerAIComparison = async () => {
    if (selectedIds.length === 0) {
      alert('Please select at least one resume.');
      return;
    }
    if (!selectedJobId) {
      alert('Please select a Job Description. If you do not have one, create it first in "Create Job Post".');
      return;
    }

    setScreenLoading(true);
    try {
      const response = await comparisonService.create(selectedJobId, selectedIds);
      navigate(`/comparisons/${response._id}`);
    } catch (err) {
      console.error(err);
      alert('AI screening failed: ' + (err.response?.data?.message || err.message));
    } finally {
      setScreenLoading(false);
    }
  };

  return (
    <div className="space-y-8 relative">
      {screenLoading && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-md flex items-center justify-center">
          <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-xl max-w-sm w-full text-center space-y-4">
            <Loader2 className="w-10 h-10 animate-spin text-blue-600 mx-auto" />
            <h3 className="font-bold text-slate-800 text-base">Running AI Ranking...</h3>
            <p className="text-xs text-slate-450">
              Retrieving context, generating embeddings, and evaluating candidate profiles with Gemini.
            </p>
          </div>
        </div>
      )}

      <div className="flex justify-between items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Library className="w-6 h-6 text-slate-650" />
            Resume Library
          </h1>
          <p className="text-slate-500 text-sm mt-1">Browse, inspect, and select candidates to screen.</p>
        </div>
      </div>

      {/* Search and Filters */}
      <form onSubmit={handleSearch} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-4 items-end">
        <div className="flex-1 w-full grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-[10px] font-semibold text-slate-550 uppercase tracking-wider mb-1.5">Candidate Name</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
                <Search className="w-4 h-4" />
              </span>
              <input
                type="text"
                value={searchName}
                onChange={(e) => setSearchName(e.target.value)}
                className="w-full pl-9 pr-3 py-2 border border-slate-250 bg-slate-50 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-650 focus:bg-white text-xs"
                placeholder="Search candidate name..."
              />
            </div>
          </div>
          <div>
            <label className="block text-[10px] font-semibold text-slate-550 uppercase tracking-wider mb-1.5">Filter by Skill</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
                <Award className="w-4 h-4" />
              </span>
              <input
                type="text"
                value={searchSkill}
                onChange={(e) => setSearchSkill(e.target.value)}
                className="w-full pl-9 pr-3 py-2 border border-slate-250 bg-slate-50 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-650 focus:bg-white text-xs"
                placeholder="e.g. React, Docker, Python"
              />
            </div>
          </div>
        </div>
        <div className="flex gap-2 w-full md:w-auto shrink-0 justify-end">
          <button
            type="button"
            onClick={handleClearSearch}
            className="px-4 py-2 border border-slate-200 hover:bg-slate-100 text-slate-650 font-semibold rounded-xl text-xs transition-all"
          >
            Clear Filters
          </button>
          <button
            type="submit"
            className="px-5 py-2 bg-blue-650 hover:bg-blue-700 text-white font-semibold rounded-xl text-xs transition-all flex items-center gap-1.5 shadow-sm"
          >
            <Search className="w-3.5 h-3.5" />
            Apply Filters
          </button>
        </div>
      </form>

      {/* Main Grid View */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* Resumes List Table/Cards */}
        <div className={`lg:col-span-2 space-y-4 ${selectedIds.length > 0 ? 'pb-24' : ''}`}>
          {loading ? (
            <div className="flex justify-center items-center py-20 bg-white rounded-2xl border border-slate-200">
              <div className="w-8 h-8 border-3 border-slate-200 border-t-blue-600 rounded-full animate-spin"></div>
            </div>
          ) : resumes.length > 0 ? (
            <div className="bg-white border border-slate-200 shadow-sm rounded-2xl overflow-hidden">
              <div className="p-4 border-b border-slate-200 flex justify-between items-center bg-slate-50/50">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={resumes.length > 0 && selectedIds.length === resumes.length}
                    onChange={handleSelectAll}
                    className="rounded text-blue-650 focus:ring-blue-500 w-4 h-4 border-slate-300"
                  />
                  <span className="text-xs font-semibold text-slate-500">
                    Select All ({selectedIds.length} of {resumes.length} selected)
                  </span>
                </div>
              </div>

              <div className="divide-y divide-slate-150">
                {resumes.map((resume) => {
                  const isChecked = selectedIds.includes(resume._id);
                  return (
                    <div 
                      key={resume._id} 
                      onClick={() => handleToggleSelect(resume._id)}
                      className={`p-4 flex items-center justify-between gap-4 cursor-pointer hover:bg-slate-50/60 transition-colors ${
                        isChecked ? 'bg-blue-50/20' : ''
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0" onClick={(e) => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => handleToggleSelect(resume._id)}
                          className="rounded text-blue-650 focus:ring-blue-500 w-4 h-4 border-slate-300 cursor-pointer"
                        />
                        <div 
                          onClick={() => setInspectorResume(resume)}
                          className="min-w-0 cursor-pointer group"
                        >
                          <h4 className="font-bold text-slate-800 text-sm truncate group-hover:text-blue-600 flex items-center gap-1.5">
                            {resume.parsedData?.candidateName || 'Unknown Candidate'}
                            <span className="text-[10px] text-slate-400 font-medium">({resume.fileName.split('.').pop().toUpperCase()})</span>
                          </h4>
                          <p className="text-xs text-slate-450 truncate mt-0.5 flex items-center gap-3">
                            {resume.parsedData?.email && (
                              <span className="flex items-center gap-1">
                                <Mail className="w-3.5 h-3.5" />
                                {resume.parsedData.email}
                              </span>
                            )}
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3.5 h-3.5" />
                              {new Date(resume.metadata?.uploadDate || Date.now()).toLocaleDateString()}
                            </span>
                          </p>
                          <div className="flex flex-wrap gap-1 mt-2.5">
                            {resume.parsedData?.skills?.slice(0, 3).map((s, i) => (
                              <span key={i} className="text-[9px] bg-slate-100 border border-slate-200 text-slate-650 px-1.5 py-0.5 rounded font-semibold">
                                {s}
                              </span>
                            ))}
                            {resume.parsedData?.skills?.length > 3 && (
                              <span className="text-[9px] text-slate-400 self-center font-bold px-0.5">
                                +{resume.parsedData.skills.length - 3} more
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0" onClick={(e) => e.stopPropagation()}>
                        <button
                          type="button"
                          onClick={() => setInspectorResume(resume)}
                          className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
                          title="Inspect Details"
                        >
                          <Eye className="w-4.5 h-4.5" />
                        </button>
                        <a
                          href={resume.fileUrl.startsWith('/uploads') ? `http://localhost:5000${resume.fileUrl}` : resume.fileUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
                          title="Open Original Document"
                        >
                          <FileCheck className="w-4.5 h-4.5" />
                        </a>
                        <button
                          type="button"
                          onClick={(e) => handleDelete(resume._id, e)}
                          className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                          title="Delete Resume"
                        >
                          <Trash2 className="w-4.5 h-4.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="text-center text-slate-450 text-sm py-20 bg-white border border-slate-200 rounded-2xl shadow-sm">
              No resumes found. Try adjusting filters or upload resumes.
            </div>
          )}
        </div>

        {/* Right Side: Metadata Inspector Panel */}
        <div className="bg-white border border-slate-200 shadow-sm rounded-2xl p-6 min-h-[400px] sticky top-6">
          <div className="flex justify-between items-center border-b border-slate-200 pb-3 mb-4">
            <h2 className="text-base font-bold text-slate-800">Metadata Inspector</h2>
            {inspectorResume && (
              <button 
                onClick={() => setInspectorResume(null)}
                className="p-1 text-slate-400 hover:text-slate-650 hover:bg-slate-100 rounded-lg"
              >
                <X className="w-4.5 h-4.5" />
              </button>
            )}
          </div>

          {inspectorResume ? (
            <div className="space-y-5 text-sm">
              <div>
                <h3 className="font-extrabold text-slate-900 text-base">{inspectorResume.parsedData?.candidateName}</h3>
                <p className="text-xs text-slate-400 truncate mt-0.5">{inspectorResume.fileName}</p>
              </div>

              {inspectorResume.parsedData?.email && (
                <div>
                  <h5 className="text-[10px] font-bold uppercase tracking-wider text-slate-450 mb-1">Email Address</h5>
                  <p className="text-slate-800 text-xs font-semibold">{inspectorResume.parsedData.email}</p>
                </div>
              )}

              <div>
                <h5 className="text-[10px] font-bold uppercase tracking-wider text-slate-450 mb-1.5">Parsed Skills</h5>
                <div className="flex flex-wrap gap-1.5">
                  {inspectorResume.parsedData?.skills?.length > 0 ? (
                    inspectorResume.parsedData.skills.map((skill, idx) => (
                      <span key={idx} className="text-[10px] bg-blue-50 border border-blue-100 text-blue-700 px-2 py-0.5 rounded font-medium">
                        {skill}
                      </span>
                    ))
                  ) : (
                    <span className="text-xs text-slate-450 font-medium">No skills extracted.</span>
                  )}
                </div>
              </div>

              <div>
                <h5 className="text-[10px] font-bold uppercase tracking-wider text-slate-450 mb-1.5">Experience Highlights</h5>
                <div className="space-y-1.5 max-h-[140px] overflow-y-auto pr-1">
                  {inspectorResume.parsedData?.experience?.length > 0 ? (
                    inspectorResume.parsedData.experience.map((exp, idx) => (
                      <div key={idx} className="p-2 border border-slate-100 bg-slate-50/50 rounded-lg text-xs font-medium text-slate-700">
                        {exp}
                      </div>
                    ))
                  ) : (
                    <span className="text-xs text-slate-450 font-medium">No work history highlights extracted.</span>
                  )}
                </div>
              </div>

              <div>
                <h5 className="text-[10px] font-bold uppercase tracking-wider text-slate-450 mb-1.5">Education</h5>
                <div className="space-y-1.5 max-h-[100px] overflow-y-auto pr-1">
                  {inspectorResume.parsedData?.education?.length > 0 ? (
                    inspectorResume.parsedData.education.map((edu, idx) => (
                      <div key={idx} className="p-2 border border-slate-100 bg-slate-50/50 rounded-lg text-xs font-medium text-slate-700">
                        {edu}
                      </div>
                    ))
                  ) : (
                    <span className="text-xs text-slate-450 font-medium">No education details extracted.</span>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-20 text-center text-slate-400">
              <Library className="w-10 h-10 mb-3 text-slate-300" />
              <p className="text-xs">Click the eye icon next to a candidate's resume to inspect their parsed profiles and details.</p>
            </div>
          )}
        </div>
      </div>

      {/* Floating Action Bar for Screening Trigger */}
      {selectedIds.length > 0 && (
        <div className="fixed bottom-6 left-6 right-6 md:left-[280px] bg-slate-900 text-white px-6 py-4 rounded-2xl shadow-xl flex flex-col sm:flex-row gap-4 items-center justify-between border border-slate-800 z-40 transition-all animate-slideUp">
          <div className="text-center sm:text-left shrink-0">
            <h4 className="font-extrabold text-sm">{selectedIds.length} Candidate(s) Selected</h4>
            <p className="text-[10px] text-slate-400 mt-0.5">Select a target job and ranking service is ready.</p>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto items-center">
            <select
              value={selectedJobId}
              onChange={(e) => setSelectedJobId(e.target.value)}
              className="bg-slate-800 border border-slate-700 text-white rounded-xl px-3.5 py-1.5 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-blue-500 w-full sm:w-60"
            >
              {jobs.length > 0 ? (
                jobs.map(job => (
                  <option key={job._id} value={job._id}>
                    {job.jobTitle} ({job.company})
                  </option>
                ))
              ) : (
                <option value="">No roles available. Create one first.</option>
              )}
            </select>
            
            <button
              onClick={triggerAIComparison}
              disabled={screenLoading || !selectedJobId}
              className="flex items-center justify-center gap-1.5 px-5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shrink-0 w-full sm:w-auto shadow-md shadow-blue-500/10 disabled:opacity-50"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              AI Rank Profiles
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ResumeLibrary;
