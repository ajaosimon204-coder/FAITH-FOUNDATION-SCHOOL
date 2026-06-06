import React, { useState, useEffect } from 'react';
import { 
  Cloud, 
  Upload, 
  X, 
  FileText, 
  Image as ImageIcon, 
  Video, 
  Music, 
  Download, 
  Trash2, 
  Loader2, 
  Search, 
  Copy, 
  QrCode, 
  Smartphone, 
  Laptop, 
  Clock, 
  User, 
  Info,
  Check,
  FileDown
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { 
  syncFetchCloudFiles, 
  syncSaveCloudFiles, 
  CloudFile,
  logSystemActivity 
} from '../../lib/sync';

export default function CloudLocker() {
  const { profile } = useAuth();
  const [files, setFiles] = useState<CloudFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<'all' | 'image' | 'doc' | 'other'>('all');
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [copied, setCopied] = useState(false);

  // Dynamic template link for cross-device synchronization matching the custom environment
  const currentUrl = window.location.origin + window.location.pathname + window.location.hash;

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const fetched = await syncFetchCloudFiles();
        // Sort newest first
        const sorted = [...fetched].sort((a, b) => 
          new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime()
        );
        setFiles(sorted);
      } catch (err) {
        console.error('Failed to load cloud locker files:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const handleUploadFile = async (selectedFile: File) => {
    if (!selectedFile) return;

    // Check size limit: 12MB limit in client base64 storage for optimal performance and cross-device speed
    const maxSizeBytes = 12 * 1024 * 1024;
    if (selectedFile.size > maxSizeBytes) {
      alert(`The file is too large (${(selectedFile.size / (1024 * 1024)).toFixed(1)} MB). To ensure fast, flawless sync across low-bandwidth phone connections, please upload files under 12 MB.`);
      return;
    }

    try {
      setUploading(true);
      const reader = new FileReader();

      reader.onload = async (e) => {
        const base64Url = e.target?.result as string;
        if (!base64Url) {
          throw new Error('Could not convert file to readable format.');
        }

        const newFile: CloudFile = {
          id: `file_${Math.random().toString(36).substring(2)}_${Date.now()}`,
          name: selectedFile.name,
          size: selectedFile.size,
          type: selectedFile.type || 'application/octet-stream',
          url: base64Url,
          uploadedAt: new Date().toISOString(),
          uploadedBy: profile?.full_name || profile?.email || 'Anonymous'
        };

        const updatedList = [newFile, ...files];
        setFiles(updatedList);
        await syncSaveCloudFiles(updatedList);
        await logSystemActivity(profile?.email, 'file_upload', `Uploaded file: ${selectedFile.name}`);
        
        // Custom DOM success banner trigger
        triggerBanner('File synchronized and uploaded successfully!');
      };

      reader.onerror = () => {
        alert('An error occurred while reading the file.');
      };

      reader.readAsDataURL(selectedFile);
    } catch (err: any) {
      console.error(err);
      alert(`Failed to load file: ${err.message || 'Unknown error'}`);
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteFile = async (id: string, fileName: string) => {
    if (!window.confirm(`Are you sure you want to permanently delete "${fileName}"? This will erase it from both your laptop and phone sync catalogs.`)) {
      return;
    }

    try {
      const nextList = files.filter(f => f.id !== id);
      setFiles(nextList);
      await syncSaveCloudFiles(nextList);
      await logSystemActivity(profile?.email, 'file_delete', `Deleted file: ${fileName}`);
      triggerBanner('File deleted from cloud storage');
    } catch (err) {
      console.error('Delete failed:', err);
    }
  };

  const triggerBanner = (msg: string) => {
    // Inject custom alert banners to match the global page style
    const alertId = 'portal-alert-banners';
    let bannerHost = document.getElementById(alertId);
    if (!bannerHost) {
      bannerHost = document.createElement('div');
      bannerHost.id = alertId;
      bannerHost.className = 'fixed top-6 right-6 z-50 space-y-3 pointer-events-none';
      document.body.appendChild(bannerHost);
    }

    const alertDiv = document.createElement('div');
    alertDiv.className = 'p-4 rounded-2xl shadow-xl flex items-center gap-3 text-xs font-bold uppercase tracking-wider bg-indigo-600 text-white translate-y-3 opacity-0 transition-all duration-300 pointer-events-auto max-w-sm';
    alertDiv.innerHTML = `<span>✓</span> <div>${msg}</div>`;

    bannerHost.appendChild(alertDiv);
    setTimeout(() => {
      alertDiv.classList.remove('translate-y-3', 'opacity-0');
      alertDiv.classList.add('translate-y-0', 'opacity-100');
    }, 10);

    setTimeout(() => {
      alertDiv.classList.remove('translate-y-0', 'opacity-100');
      alertDiv.classList.add('translate-y-3', 'opacity-0');
      setTimeout(() => alertDiv.remove(), 300);
    }, 4000);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleUploadFile(e.target.files[0]);
    }
  };

  const onDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleUploadFile(e.dataTransfer.files[0]);
    }
  };

  const copyUrlToClipboard = () => {
    navigator.clipboard.writeText(currentUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const getFileIcon = (type: string) => {
    const t = type.toLowerCase();
    if (t.startsWith('image/')) return <ImageIcon className="text-emerald-500" size={20} />;
    if (t.startsWith('video/')) return <Video className="text-indigo-500" size={20} />;
    if (t.startsWith('audio/')) return <Music className="text-purple-500" size={20} />;
    if (t.includes('pdf') || t.includes('word') || t.includes('document') || t.includes('text')) {
      return <FileText className="text-blue-500" size={20} />;
    }
    return <FileDown className="text-slate-500" size={20} />;
  };

  // Filters logical list
  const filteredFiles = files.filter(f => {
    // Search Match
    const matchesSearch = f.name.toLowerCase().includes(searchQuery.toLowerCase());
    
    // Category match
    if (activeFilter === 'all') return matchesSearch;
    const isImage = f.type.toLowerCase().startsWith('image/');
    const isDoc = f.type.toLowerCase().includes('pdf') || 
                  f.type.toLowerCase().includes('word') || 
                  f.type.toLowerCase().includes('document') || 
                  f.type.toLowerCase().includes('text') || 
                  f.type.toLowerCase().includes('presentation') || 
                  f.type.toLowerCase().includes('sheet') || 
                  f.type.toLowerCase().includes('excel') || 
                  f.name.endsWith('.pdf') || f.name.endsWith('.docx') || f.name.endsWith('.txt');

    if (activeFilter === 'image') return matchesSearch && isImage;
    if (activeFilter === 'doc') return matchesSearch && isDoc;
    return matchesSearch && !isImage && !isDoc; // 'other'
  });

  return (
    <div className="space-y-8 pb-12 font-sans">
      
      {/* Intro Header */}
      <div className="bg-gradient-to-r from-indigo-700 via-indigo-800 to-indigo-900 rounded-[32px] p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="absolute right-0 bottom-0 translate-x-10 translate-y-10 text-white/5 pointer-events-none select-none">
          <Cloud size={240} className="stroke-[1]" />
        </div>
        <div className="relative z-10 max-w-2xl">
          <span className="text-[10px] bg-indigo-500 text-indigo-100 px-3 py-1 rounded-full font-black uppercase tracking-widest">
            Cross-Device Portal Drive
          </span>
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight mt-3">
            Your Shared File Locker
          </h2>
          <p className="text-sm text-indigo-200 mt-2 leading-relaxed">
            Upload files, images, or documents from your phone or laptop. Everything you upload here will sync instantly to your other devices when you log into this portal. Just drag, drop, or snapshot to snap and share!
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column: Upload and Sync Settings */}
        <div className="space-y-6 lg:col-span-1">
          
          {/* Responsive Device Link QR Companion Card */}
          <div className="bg-white rounded-3xl border border-slate-150 p-6 shadow-sm space-y-4">
            <div className="flex gap-3 items-center">
              <div className="p-2 w-10 h-10 bg-indigo-50 text-indigo-700 rounded-xl flex items-center justify-center font-bold">
                <Smartphone size={20} />
              </div>
              <div>
                <h3 className="text-xs font-black uppercase text-slate-800 tracking-wider">
                  Open on Your Phone
                </h3>
                <p className="text-[10px] text-slate-400">Scan to upload photos directly from mobile</p>
              </div>
            </div>

            <div className="border border-slate-100 rounded-2xl bg-slate-50/50 p-4 flex flex-col items-center justify-center text-center">
              <div className="bg-white p-3.5 rounded-2xl border border-slate-200/60 shadow-sm relative group">
                <img 
                  referrerPolicy="no-referrer"
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(currentUrl)}`} 
                  alt="QR Code Link" 
                  className="w-36 h-36 relative z-10"
                />
              </div>
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wide mt-3 flex items-center gap-1.5 justify-center">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                Instant Camera Sync Bridge
              </p>
            </div>

            <div className="space-y-2 mt-4">
              <p className="text-[10px] text-slate-500 leading-normal">
                Point your mobile phone camera at this QR code to access the portal. Log in, open this Locker, and snap pictures or attach files to access them here on your laptop.
              </p>

              <button
                onClick={copyUrlToClipboard}
                className="w-full flex items-center justify-center gap-2 py-3 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all cursor-pointer"
              >
                {copied ? (
                  <>
                    <Check size={14} className="text-emerald-500" />
                    <span className="text-emerald-600">Copied Link!</span>
                  </>
                ) : (
                  <>
                    <Copy size={14} />
                    <span>Copy Portal Link</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Core File Transfer Box */}
          <div className="bg-white rounded-3xl border border-slate-150 p-6 shadow-sm space-y-4">
            <h3 className="text-xs font-black uppercase text-slate-800 tracking-wider">
              Sync New Document
            </h3>

            <div 
              onDragEnter={onDrag}
              onDragLeave={onDrag}
              onDragOver={onDrag}
              onDrop={onDrop}
              className={`border-2 border-dashed rounded-2xl p-6 text-center transition-all cursor-pointer relative ${
                dragActive ? 'border-indigo-600 bg-indigo-50/20' : 'border-slate-200 bg-slate-50/50 hover:border-slate-300'
              }`}
            >
              <label className="flex flex-col items-center gap-2 cursor-pointer">
                <div className="w-12 h-12 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-700 shadow-sm">
                  {uploading ? (
                    <Loader2 size={24} className="animate-spin" />
                  ) : (
                    <Upload size={20} />
                  )}
                </div>
                <div className="mt-1">
                  <p className="text-xs font-bold text-slate-700">Click to Select File</p>
                  <p className="text-[9px] text-slate-400 mt-0.5">Drag & Drop or Take Photo</p>
                </div>
                <span className="text-[8px] bg-slate-200/80 text-slate-500 font-extrabold uppercase tracking-widest px-2 py-1.5 rounded-lg mt-2">
                  All types (max 12MB)
                </span>
                <input 
                  type="file" 
                  className="hidden" 
                  onChange={handleFileChange}
                  disabled={uploading}
                />
              </label>
            </div>

            <div className="text-[10px] text-slate-400 flex gap-2 items-start bg-indigo-50/40 p-3 rounded-2xl border border-indigo-100/50">
              <Info size={14} className="text-indigo-600 shrink-0 mt-0.5" />
              <span>
                Upload receipts, certificates, teaching aids, timetables, or report files. The documents remain securely linked to this dashboard.
              </span>
            </div>
          </div>

        </div>

        {/* Right Column: Files Grid and Search */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Filtering and Search Controls */}
          <div className="bg-white rounded-3xl border border-slate-150 p-6 shadow-sm flex flex-col md:flex-row gap-4 justify-between items-center">
            
            {/* Search Input */}
            <div className="relative w-full md:max-w-xs">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <input 
                type="text" 
                placeholder="Search synced files..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-50 focus:bg-white border border-slate-150 pl-10 pr-4 py-2.5 rounded-2xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:border-transparent transition-all"
              />
            </div>

            {/* Visual Filters */}
            <div className="flex flex-wrap gap-1.5 w-full md:w-auto">
              {[
                { id: 'all', label: 'All Files' },
                { id: 'image', label: 'Pictures' },
                { id: 'doc', label: 'Docs' },
                { id: 'other', label: 'Others' }
              ].map(filter => (
                <button
                  key={filter.id}
                  onClick={() => setActiveFilter(filter.id as any)}
                  className={`px-3.5 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all cursor-pointer ${
                    activeFilter === filter.id 
                      ? 'bg-indigo-600 text-white shadow-md shadow-indigo-100' 
                      : 'bg-slate-50 hover:bg-slate-100 text-slate-600'
                  }`}
                >
                  {filter.label}
                </button>
              ))}
            </div>

          </div>

          {/* Files List View */}
          {loading ? (
            <div className="bg-white rounded-3xl border border-slate-100 p-20 text-center flex flex-col items-center justify-center gap-3">
              <Loader2 className="animate-spin text-indigo-600" size={32} />
              <p className="text-[10px] font-black tracking-widest uppercase text-slate-400">Fetching cloud drive assets...</p>
            </div>
          ) : filteredFiles.length === 0 ? (
            <div className="bg-white rounded-[32px] border border-slate-150 p-16 text-center">
              <div className="w-16 h-16 bg-slate-50 text-slate-400 rounded-3xl flex items-center justify-center mx-auto mb-4 border border-slate-100">
                <Cloud size={24} />
              </div>
              <h3 className="text-sm font-black text-slate-800 uppercase tracking-tight">
                No synced files found
              </h3>
              <p className="text-xs text-slate-400 max-w-sm mx-auto mt-2 leading-relaxed">
                {searchQuery 
                  ? 'No files matching this query exist in your drawer. Try checking file name spelling!' 
                  : 'Your personal sandbox and cloud cabinets are empty. Drag and drop any attachments to get started!'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {filteredFiles.map((file) => (
                <div 
                  key={file.id} 
                  className="bg-white rounded-[24px] border border-slate-150 p-4 transition-all hover:shadow-lg hover:border-indigo-100 flex flex-col justify-between"
                >
                  
                  {/* Top: File info and action */}
                  <div className="space-y-3">
                    <div className="flex justify-between items-start gap-4">
                      <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 shrink-0">
                        {getFileIcon(file.type)}
                      </div>
                      
                      <button 
                        onClick={() => handleDeleteFile(file.id, file.name)}
                        className="p-1.5 text-slate-350 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all cursor-pointer"
                        title="Delete file permanently"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>

                    <div>
                      <h4 className="text-xs font-black text-slate-800 truncate leading-snug" title={file.name}>
                        {file.name}
                      </h4>
                      <p className="text-[10px] text-indigo-600 font-extrabold uppercase mt-1">
                        {formatBytes(file.size)}
                      </p>
                    </div>
                  </div>

                  {/* Mid: Image Thumbnail if Image File */}
                  {file.type.toLowerCase().startsWith('image/') && (
                    <div className="mt-3 aspect-video rounded-xl overflow-hidden border border-slate-100 bg-slate-55 relative group">
                      <img 
                        referrerPolicy="no-referrer"
                        src={file.url} 
                        alt={file.name} 
                        className="w-full h-full object-cover" 
                      />
                    </div>
                  )}

                  {/* Bottom: Upload and Metadata details */}
                  <div className="mt-4 pt-3 border-t border-slate-50 flex items-center justify-between gap-6">
                    <div className="min-w-0">
                      <span className="text-[8px] text-slate-400 font-bold uppercase tracking-wider block flex items-center gap-1">
                        <User size={10} /> {file.uploadedBy}
                      </span>
                      <span className="text-[8px] text-slate-400 block mt-0.5 flex items-center gap-1">
                        <Clock size={10} /> {new Date(file.uploadedAt).toLocaleDateString()}
                      </span>
                    </div>

                    <a 
                      href={file.url} 
                      download={file.name}
                      className="px-3.5 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-xl text-[9px] font-black uppercase tracking-wider flex items-center gap-1.5 shrink-0 transition-colors cursor-pointer border border-indigo-100/40"
                    >
                      <Download size={12} />
                      <span>Download</span>
                    </a>
                  </div>

                </div>
              ))}
            </div>
          )}

        </div>

      </div>

    </div>
  );
}
