import React, { useState, useEffect } from 'react';
import { Briefcase, Plus, Trash2, HelpCircle, Loader2 } from 'lucide-react';
import { jobService } from '../services/api';

const CreateJobDescription = () => {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Form States
  const [jobTitle, setJobTitle] = useState('');
  const [company, setCompany] = useState('');
  const [experienceRequired, setExperienceRequired] = useState('');
  const [requiredSkills, setRequiredSkills] = useState('');
  const [preferredSkills, setPreferredSkills] = useState('');
  const [responsibilities, setResponsibilities] = useState('');
  const [niceToHaveSkills, setNiceToHaveSkills] = useState('');
  const [additionalNotes, setAdditionalNotes] = useState('');

  useEffect(() => {
    fetchJobs();
  }, []);

  const fetchJobs = async () => {
    try {
      const data = await jobService.getAll();
      setJobs(data);
    } catch (err) {
      console.error('Failed to fetch job descriptions:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setSubmitLoading(true);

    try {
      const newJob = await jobService.create({
        jobTitle,
        company,
        experienceRequired,
        requiredSkills,
        preferredSkills,
        responsibilities,
        niceToHaveSkills,
        additionalNotes,
      });

      setJobs([newJob, ...jobs]);
      setSuccess('Job Description created successfully!');
      
      // Reset Form
      setJobTitle('');
      setCompany('');
      setExperienceRequired('');
      setRequiredSkills('');
      setPreferredSkills('');
      setResponsibilities('');
      setNiceToHaveSkills('');
      setAdditionalNotes('');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create job description.');
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this job description?')) return;

    try {
      await jobService.delete(id);
      setJobs(jobs.filter(job => job._id !== id));
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete job description.');
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
          <Briefcase className="w-6 h-6 text-slate-650" />
          Job Descriptions Manager
        </h1>
        <p className="text-slate-500 text-sm mt-1">Create and manage your organization's hiring standards and roles.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Side: Form */}
        <div className="lg:col-span-2 bg-white border border-slate-200 shadow-sm rounded-2xl p-6">
          <h2 className="text-lg font-bold text-slate-800 border-b border-slate-200 pb-3 mb-5">Create New Role Details</h2>
          
          {error && (
            <div className="mb-4 p-4 text-sm text-red-700 bg-red-50 border border-red-200 rounded-xl">
              {error}
            </div>
          )}

          {success && (
            <div className="mb-4 p-4 text-sm text-emerald-700 bg-emerald-50 border border-emerald-250 rounded-xl">
              {success}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-550 uppercase tracking-wider mb-1.5">
                  Job Title *
                </label>
                <input
                  type="text"
                  required
                  value={jobTitle}
                  onChange={(e) => setJobTitle(e.target.value)}
                  className="w-full px-3.5 py-2 border border-slate-250 bg-slate-50 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-650 focus:bg-white text-sm"
                  placeholder="e.g. Lead Full Stack Engineer"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-550 uppercase tracking-wider mb-1.5">
                  Company *
                </label>
                <input
                  type="text"
                  required
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                  className="w-full px-3.5 py-2 border border-slate-250 bg-slate-50 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-650 focus:bg-white text-sm"
                  placeholder="e.g. Acme Corp"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-550 uppercase tracking-wider mb-1.5">
                Experience Required
              </label>
              <input
                type="text"
                value={experienceRequired}
                onChange={(e) => setExperienceRequired(e.target.value)}
                className="w-full px-3.5 py-2 border border-slate-250 bg-slate-50 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-650 focus:bg-white text-sm"
                placeholder="e.g. 5+ years of production experience"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-550 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                  Required Skills *
                  <HelpCircle className="w-3.5 h-3.5 text-slate-400 cursor-help" title="Separate items with commas" />
                </label>
                <span className="text-[10px] text-slate-450 block mb-1">Comma-separated skills</span>
                <input
                  type="text"
                  required
                  value={requiredSkills}
                  onChange={(e) => setRequiredSkills(e.target.value)}
                  className="w-full px-3.5 py-2 border border-slate-250 bg-slate-50 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-650 focus:bg-white text-sm"
                  placeholder="React, Node.js, MongoDB, TypeScript"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-550 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                  Preferred Skills
                  <HelpCircle className="w-3.5 h-3.5 text-slate-400 cursor-help" title="Separate items with commas" />
                </label>
                <span className="text-[10px] text-slate-450 block mb-1">Comma-separated skills</span>
                <input
                  type="text"
                  value={preferredSkills}
                  onChange={(e) => setPreferredSkills(e.target.value)}
                  className="w-full px-3.5 py-2 border border-slate-250 bg-slate-50 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-650 focus:bg-white text-sm"
                  placeholder="AWS, Docker, CI/CD, Next.js"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-550 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                Key Responsibilities *
                <HelpCircle className="w-3.5 h-3.5 text-slate-400 cursor-help" title="Separate items with commas or semi-colons" />
              </label>
              <textarea
                required
                value={responsibilities}
                onChange={(e) => setResponsibilities(e.target.value)}
                rows={3}
                className="w-full px-3.5 py-2 border border-slate-250 bg-slate-50 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-650 focus:bg-white text-sm"
                placeholder="Architect cloud pipelines, Mentor junior engineers, Deliver API features"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-550 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                  Nice-to-Have Skills
                </label>
                <input
                  type="text"
                  value={niceToHaveSkills}
                  onChange={(e) => setNiceToHaveSkills(e.target.value)}
                  className="w-full px-3.5 py-2 border border-slate-250 bg-slate-50 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-650 focus:bg-white text-sm"
                  placeholder="GraphQL, Kubernetes, Python"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-550 uppercase tracking-wider mb-1">
                  Additional Notes
                </label>
                <input
                  type="text"
                  value={additionalNotes}
                  onChange={(e) => setAdditionalNotes(e.target.value)}
                  className="w-full px-3.5 py-2 border border-slate-250 bg-slate-50 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-650 focus:bg-white text-sm"
                  placeholder="Hybrid setup, GMT timezone alignment"
                />
              </div>
            </div>

            <div className="flex justify-end pt-3">
              <button
                type="submit"
                disabled={submitLoading}
                className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-semibold transition-all shadow-md shadow-blue-500/10 disabled:opacity-50"
              >
                {submitLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4" />
                    Save Job Description
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Right Side: List */}
        <div className="bg-white border border-slate-200 shadow-sm rounded-2xl p-6 flex flex-col max-h-[700px]">
          <h2 className="text-lg font-bold text-slate-800 border-b border-slate-200 pb-3 mb-4">Saved Roles</h2>
          
          <div className="flex-1 overflow-y-auto space-y-3 pr-1">
            {loading ? (
              <div className="flex justify-center items-center py-10">
                <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
              </div>
            ) : jobs.length > 0 ? (
              jobs.map((job) => (
                <div 
                  key={job._id}
                  className="p-4 border border-slate-150 rounded-xl hover:border-slate-300 hover:bg-slate-50/50 transition-all flex justify-between items-start group"
                >
                  <div className="min-w-0">
                    <h4 className="font-semibold text-slate-800 text-sm truncate">{job.jobTitle}</h4>
                    <p className="text-xs text-slate-500 truncate mt-0.5">{job.company}</p>
                    <div className="flex flex-wrap gap-1 mt-2">
                      {job.requiredSkills.slice(0, 3).map((s, idx) => (
                        <span key={idx} className="text-[10px] bg-slate-150 text-slate-650 px-2 py-0.5 rounded-full font-medium">
                          {s}
                        </span>
                      ))}
                      {job.requiredSkills.length > 3 && (
                        <span className="text-[10px] text-slate-400 font-medium self-center px-1">
                          +{job.requiredSkills.length - 3} more
                        </span>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => handleDelete(job._id)}
                    className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors md:opacity-0 group-hover:opacity-100 focus:opacity-100 shrink-0"
                    title="Delete description"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))
            ) : (
              <div className="text-center text-slate-450 text-sm py-10">
                No job descriptions configured yet.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateJobDescription;
