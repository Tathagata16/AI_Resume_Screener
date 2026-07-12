import React, { useState, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  UploadCloud, 
  FileText, 
  X, 
  Loader2, 
  CheckCircle2, 
  AlertCircle,
  Play
} from 'lucide-react';
import { resumeService } from '../services/api';

const UploadResumes = () => {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [uploadStatuses, setUploadStatuses] = useState({});
  // Structure: { [fileName]: { status: 'idle' | 'uploading' | 'processing' | 'success' | 'error', errorMsg?: string, parsedName?: string } }
  const [globalError, setGlobalError] = useState('');
  const [successList, setSuccessList] = useState([]);

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    addFiles(files);
  };

  const addFiles = (files) => {
    setGlobalError('');
    // Filter out unsupported files
    const validFiles = files.filter(file => {
      const ext = file.name.split('.').pop().toLowerCase();
      return ext === 'pdf' || ext === 'docx';
    });

    if (validFiles.length !== files.length) {
      setGlobalError('Some files were ignored. Only PDF and DOCX formats are supported.');
    }

    // Check count limit
    const totalCount = selectedFiles.length + validFiles.length;
    if (totalCount > 15) {
      setGlobalError('You can upload a maximum of 15 resumes at a time.');
      // Keep only up to remaining allowance
      const allowedCount = 15 - selectedFiles.length;
      validFiles.splice(allowedCount);
    }

    const newFiles = [...selectedFiles];
    const newStatuses = { ...uploadStatuses };

    validFiles.forEach(file => {
      // Check if file is already added
      if (!newFiles.some(f => f.name === file.name)) {
        newFiles.push(file);
        newStatuses[file.name] = { status: 'idle' };
      }
    });

    setSelectedFiles(newFiles);
    setUploadStatuses(newStatuses);
  };

  const removeFile = (index) => {
    const file = selectedFiles[index];
    const newFiles = [...selectedFiles];
    newFiles.splice(index, 1);
    setSelectedFiles(newFiles);

    const newStatuses = { ...uploadStatuses };
    delete newStatuses[file.name];
    setUploadStatuses(newStatuses);
  };

  const triggerUpload = async () => {
    if (selectedFiles.length === 0) {
      setGlobalError('Please select at least one file to upload.');
      return;
    }

    setGlobalError('');
    setUploading(true);
    setSuccessList([]);

    // We will upload them using the standard multi-upload endpoint
    const newStatuses = { ...uploadStatuses };
    selectedFiles.forEach(f => {
      newStatuses[f.name] = { status: 'uploading' };
    });
    setUploadStatuses(newStatuses);

    try {
      // Direct multi-upload call
      const res = await resumeService.upload(selectedFiles);
      
      const finishedStatuses = { ...uploadStatuses };
      const succeeded = [];
      
      // Update status for each file based on response
      if (res.resumes) {
        res.resumes.forEach(resume => {
          finishedStatuses[resume.fileName] = { 
            status: 'success',
            parsedName: resume.parsedData?.candidateName || 'Unknown Candidate'
          };
          succeeded.push(resume);
        });
      }

      if (res.errors) {
        res.errors.forEach(err => {
          finishedStatuses[err.filename] = { 
            status: 'error',
            errorMsg: err.error
          };
        });
      }

      setUploadStatuses(finishedStatuses);
      setSuccessList(succeeded);

      // If at least some succeeded, clear selection list
      if (succeeded.length > 0) {
        // Filter out completed ones from selected
        setSelectedFiles(selectedFiles.filter(f => {
          return finishedStatuses[f.name]?.status === 'error';
        }));
      }
    } catch (err) {
      console.error(err);
      setGlobalError(err.response?.data?.message || 'Server error occurred during upload. Please check if FastAPI service is active.');
      // Mark all as error
      const errStatuses = { ...uploadStatuses };
      selectedFiles.forEach(f => {
        errStatuses[f.name] = { status: 'error', errorMsg: 'API request failed' };
      });
      setUploadStatuses(errStatuses);
    } finally {
      setUploading(false);
    }
  };

  // Drag and Drop handlers
  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    if (uploading) return;
    const files = Array.from(e.dataTransfer.files);
    addFiles(files);
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
          <UploadCloud className="w-6 h-6 text-slate-650" />
          Upload Resumes
        </h1>
        <p className="text-slate-500 text-sm mt-1">Upload 1 to 15 candidate resumes. AI will parse metadata, segment chunks, and index vectors automatically.</p>
      </div>

      {globalError && (
        <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-750 p-4 rounded-xl text-sm shadow-sm">
          <AlertCircle className="w-5 h-5 shrink-0 text-red-500" />
          <span>{globalError}</span>
        </div>
      )}

      {/* Drag & Drop Area */}
      <div 
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        onClick={() => !uploading && fileInputRef.current.click()}
        className={`border-2 border-dashed rounded-2xl p-10 flex flex-col items-center justify-center cursor-pointer transition-all ${
          uploading 
            ? 'border-slate-200 bg-slate-50 cursor-not-allowed' 
            : 'border-slate-300 bg-white hover:border-blue-500 hover:bg-slate-50/50'
        }`}
      >
        <input
          type="file"
          ref={fileInputRef}
          multiple
          accept=".pdf,.docx"
          onChange={handleFileChange}
          className="hidden"
          disabled={uploading}
        />
        <UploadCloud className="w-12 h-12 text-slate-400 mb-4 animate-bounce" />
        <h3 className="font-bold text-slate-800 text-base">Drag & drop files here</h3>
        <p className="text-slate-400 text-xs mt-1.5 mb-2">Supported formats: PDF, DOCX (Max 10MB per file)</p>
        <button
          type="button"
          disabled={uploading}
          className="px-4 py-1.5 bg-slate-100 border border-slate-200 hover:bg-slate-250 text-slate-700 font-semibold rounded-lg text-xs transition-all"
        >
          Select Files
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Side: Upload Queue (Files being uploaded or idle) */}
        <div className="lg:col-span-2 bg-white border border-slate-200 shadow-sm rounded-2xl p-6 flex flex-col">
          <div className="flex justify-between items-center border-b border-slate-200 pb-3 mb-4">
            <h2 className="text-base font-bold text-slate-800">Upload Queue ({selectedFiles.length})</h2>
            {selectedFiles.length > 0 && (
              <button
                type="button"
                onClick={triggerUpload}
                disabled={uploading}
                className="flex items-center gap-1.5 px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold disabled:opacity-50 transition-all shadow-md shadow-blue-550/15"
              >
                {uploading ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Play className="w-3.5 h-3.5 fill-current" />
                    Process Upload
                  </>
                )}
              </button>
            )}
          </div>

          <div className="space-y-3 flex-1 overflow-y-auto max-h-[400px] pr-1">
            {selectedFiles.length > 0 ? (
              selectedFiles.map((file, index) => {
                const status = uploadStatuses[file.name]?.status || 'idle';
                const errorMsg = uploadStatuses[file.name]?.errorMsg;

                return (
                  <div 
                    key={file.name}
                    className="p-4 border border-slate-150 rounded-xl flex items-center justify-between gap-4"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-9 h-9 bg-slate-100 rounded-lg flex items-center justify-center shrink-0 text-slate-500">
                        <FileText className="w-5 h-5" />
                      </div>
                      <div className="min-w-0">
                        <h4 className="font-semibold text-slate-800 text-xs truncate">{file.name}</h4>
                        <p className="text-[10px] text-slate-400 mt-0.5">{(file.size / (1024 * 1024)).toFixed(2)} MB</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {status === 'uploading' && (
                        <span className="text-xs text-blue-600 font-semibold flex items-center gap-1">
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          Indexing...
                        </span>
                      )}
                      {status === 'error' && (
                        <span 
                          className="text-xs text-red-500 font-semibold flex items-center gap-1 cursor-help"
                          title={errorMsg}
                        >
                          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                          Failed
                        </span>
                      )}
                      {status === 'idle' && (
                        <button
                          type="button"
                          onClick={() => removeFile(index)}
                          className="p-1 text-slate-400 hover:text-red-500 hover:bg-slate-50 rounded-lg"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="text-center text-slate-400 text-sm py-16">
                No files selected in queue.
              </div>
            )}
          </div>
        </div>

        {/* Right Side: Parsing Summary Feedback */}
        <div className="bg-white border border-slate-200 shadow-sm rounded-2xl p-6 flex flex-col max-h-[500px]">
          <h2 className="text-base font-bold text-slate-800 border-b border-slate-200 pb-3 mb-4">Indexing Summary ({successList.length})</h2>
          
          <div className="flex-1 overflow-y-auto space-y-3 pr-1">
            {successList.length > 0 ? (
              successList.map((res) => (
                <div 
                  key={res._id}
                  className="p-3 bg-emerald-50/40 border border-emerald-150 rounded-xl space-y-1.5"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-800 truncate block max-w-[70%]">
                      {res.parsedData?.candidateName}
                    </span>
                    <span className="text-[10px] text-emerald-600 font-bold bg-emerald-100/50 px-2 py-0.5 rounded-full flex items-center gap-1 border border-emerald-200/50">
                      <CheckCircle2 className="w-3 h-3" />
                      Success
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-400 truncate">{res.fileName}</p>
                  
                  <div className="flex flex-wrap gap-1 pt-1.5">
                    {res.parsedData?.skills?.slice(0, 4).map((skill, idx) => (
                      <span key={idx} className="text-[9px] bg-slate-100 border border-slate-200 text-slate-650 px-1.5 py-0.5 rounded font-medium">
                        {skill}
                      </span>
                    ))}
                    {res.parsedData?.skills?.length > 4 && (
                      <span className="text-[9px] text-slate-400 self-center px-1 font-semibold">
                        +{res.parsedData.skills.length - 4} more
                      </span>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center text-slate-400 text-sm py-16">
                Waiting for files to index.
              </div>
            )}
          </div>

          {successList.length > 0 && (
            <div className="pt-4 border-t border-slate-200 mt-4">
              <Link
                to="/library"
                className="w-full flex justify-center items-center gap-2 py-2 bg-slate-900 hover:bg-black text-white text-xs font-bold rounded-xl transition-all shadow-sm"
              >
                Go to Library & Compare
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default UploadResumes;
