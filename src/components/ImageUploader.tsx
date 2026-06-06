import React from 'react';
import { supabase } from '../lib/supabase';
import { Upload, X, Loader2, ImageIcon, FileText } from 'lucide-react';

interface ImageUploaderProps {
  currentUrl: string;
  onUpload: (url: string) => void;
  label: string;
  key?: React.Key;
  accept?: string;
}

export default function ImageUploader(props: ImageUploaderProps) {
  const { currentUrl, onUpload, label, accept } = props;
  const [uploading, setUploading] = React.useState(false);
  const [dragActive, setDragActive] = React.useState(false);
  const [mode, setMode] = React.useState<'upload' | 'link'>('upload');
  const [linkVal, setLinkVal] = React.useState(currentUrl || '');

  // Synchronize internal state with changes in currentUrl
  React.useEffect(() => {
    if (currentUrl) {
      setLinkVal(currentUrl);
    }
  }, [currentUrl]);

  const uploadFileToServer = async (file: File) => {
    try {
      setUploading(true);
      
      const fileExt = (file.name && typeof file.name === 'string') ? file.name.split('.').pop() : 'jpg';
      const fileName = `${Math.random().toString(36).substring(2)}_${Date.now()}.${fileExt}`;
      const filePath = `uploads/${fileName}`;

      // Max scale checks: support up to 100MB
      const maxFileBytes = 100 * 1024 * 1024;
      if (file.size > maxFileBytes) {
        alert('File is too large! Maximum allowed size for direct folder file storage is 100MB. Please use the "Web Link / Cloud URL" tab to link files of unbounded sizes.');
        return;
      }

      const { data, error } = await supabase.storage
        .from('site-assets')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (error) {
        if (error.message.includes('Bucket not found')) {
          throw new Error('STORAGE_BUCKET_MISSING');
        }
        if (error.message.includes('row-level security policy')) {
          throw new Error('STORAGE_PERMISSION_DENIED');
        }
        throw error;
      }

      const { data: { publicUrl } } = supabase.storage
        .from('site-assets')
        .getPublicUrl(filePath);

      onUpload(publicUrl);
    } catch (err: any) {
      console.error('Upload failed:', err);
      if (err.message === 'STORAGE_BUCKET_MISSING') {
        alert('CRITICAL: The "site-assets" storage bucket was not found.\n\nTo fix this:\n1. Go to Supabase -> Storage\n2. Create bucket "site-assets"\n3. Set it to "Public"');
      } else if (err.message === 'STORAGE_PERMISSION_DENIED') {
        alert('PERMISSION ERROR: Your Supabase Storage RLS policies are preventing uploads.\n\nEASY FIX:\n1. Open Supabase Dashboard\n2. Go to "SQL Editor"\n3. Paste and run this command:\n\nCREATE POLICY "Public Access" ON storage.objects FOR ALL TO public USING (bucket_id = \'site-assets\') WITH CHECK (bucket_id = \'site-assets\');\n\n4. Also make sure the "site-assets" bucket is set to "Public" in the Storage settings.');
      } else {
        alert(`Upload failed: ${err.message || 'Unknown error'}`);
      }
    } finally {
      setUploading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      uploadFileToServer(e.target.files[0]);
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
      uploadFileToServer(e.dataTransfer.files[0]);
    }
  };

  const acceptedTypes = accept || "image/*";
  const isImg = currentUrl && (
    currentUrl.startsWith('data:image') || 
    /\.(jpeg|jpg|gif|png|webp|svg)$/i.test(currentUrl) ||
    (!/\.(pdf|docx|doc|mp4|webm|xlsx|xls|zip|ppt|pptx)$/i.test(currentUrl) && currentUrl.startsWith('http'))
  );

  return (
    <div className="space-y-2.5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b pb-1.5">
        <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest leading-none">
          {label}
        </label>
        
        {/* Resource Selection Mode */}
        <div className="flex bg-slate-100 p-0.5 rounded-lg w-fit shrink-0">
          <button
            type="button"
            onClick={() => setMode('upload')}
            className={`px-2.5 py-1 rounded text-[8px] font-black uppercase tracking-wider transition-all cursor-pointer ${
              mode === 'upload' ? 'bg-white text-primary shadow-sm font-black' : 'text-slate-400 hover:text-slate-700'
            }`}
          >
            📎 Local File
          </button>
          <button
            type="button"
            onClick={() => setMode('link')}
            className={`px-2.5 py-1 rounded text-[8px] font-black uppercase tracking-wider transition-all cursor-pointer ${
              mode === 'link' ? 'bg-white text-primary shadow-sm font-black' : 'text-slate-400 hover:text-slate-700'
            }`}
          >
            🔗 Web / Cloud URL
          </button>
        </div>
      </div>
      
      {mode === 'upload' ? (
        <div 
          className={`relative group rounded-2xl border-2 border-dashed transition-all overflow-hidden ${
            dragActive ? 'border-primary bg-primary/5' : 'border-slate-100 bg-slate-50/50 hover:border-slate-200'
          }`}
          onDragEnter={onDrag}
          onDragLeave={onDrag}
          onDragOver={onDrag}
          onDrop={onDrop}
        >
          {currentUrl ? (
            <div className="relative aspect-video">
              {isImg ? (
                <img src={currentUrl} alt="Preview" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-slate-50 flex flex-col items-center justify-center p-4">
                  <FileText className="text-primary mb-2" size={32} />
                  <span className="text-[10px] font-bold text-slate-600 truncate max-w-full px-4 text-center select-all">
                    {currentUrl.split('/').pop() || "Uploaded File"}
                  </span>
                  <span className="text-[8px] uppercase tracking-widest text-slate-400 font-extrabold mt-1">
                    Ready to Publish
                  </span>
                </div>
              )}
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                <label className="p-2 bg-white rounded-xl text-primary cursor-pointer hover:scale-110 transition-transform">
                  <Upload size={16} />
                  <input type="file" className="hidden" accept={acceptedTypes} onChange={handleFileChange} />
                </label>
                <button 
                  onClick={() => { onUpload(''); setLinkVal(''); }}
                  className="p-2 bg-white rounded-xl text-red-600 hover:scale-110 transition-transform cursor-pointer"
                  type="button"
                >
                  <X size={16} />
                </button>
              </div>
            </div>
          ) : (
            <label className="flex flex-col items-center justify-center p-8 cursor-pointer gap-3">
              <div className="w-12 h-12 rounded-2xl bg-white shadow-sm flex items-center justify-center text-slate-400">
                {uploading ? <Loader2 className="animate-spin" size={24} /> : <ImageIcon size={24} />}
              </div>
              <div className="text-center">
                <p className="text-xs font-bold text-slate-600">Click to upload or drag & drop</p>
                <p className="text-[10px] text-slate-400 mt-1 uppercase tracking-tight">
                  {accept ? "Documents, media, PDFs, or files (Support up to 100MB)" : "SVG, PNG, JPG (max. 100MB)"}
                </p>
              </div>
              <input type="file" className="hidden" accept={acceptedTypes} onChange={handleFileChange} disabled={uploading} />
            </label>
          )}
          
          {uploading && (
            <div className="absolute inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center z-20">
              <div className="flex flex-col items-center gap-2">
                <Loader2 className="animate-spin text-primary" size={24} />
                <p className="text-[10px] font-bold text-primary uppercase tracking-widest italic">Uploading Assets...</p>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="bg-slate-50 border border-slate-100/80 p-5 rounded-2xl space-y-4">
          <div className="text-[10.5px] text-slate-500 font-bold leading-relaxed">
            Link dynamic files hosted externally (e.g. <strong>Google Drive</strong>, <strong>OneDrive</strong>, <strong>Dropbox</strong>, or web attachments) to bypass native network uploading barriers from mobile devices.
          </div>
          <div className="flex gap-2">
            <input
              type="url"
              placeholder="https://drive.google.com/file/d/... or any public material URL"
              value={linkVal}
              onChange={(e) => setLinkVal(e.target.value)}
              className="bg-white border rounded-xl p-3 text-xs w-full focus:outline-none placeholder-slate-350 text-slate-800 font-semibold"
            />
            <button
              type="button"
              onClick={() => {
                if (linkVal.trim().startsWith('http') || linkVal.trim().startsWith('data:')) {
                  onUpload(linkVal.trim());
                  alert('URL link configured successfully!');
                } else {
                  alert('Please enter a valid URL starting with http:// or https://');
                }
              }}
              className="bg-primary text-white font-black text-[10px] uppercase tracking-widest px-5 rounded-xl shrink-0 cursor-pointer hover:bg-opacity-95"
            >
              Bind Link
            </button>
          </div>
          {currentUrl && (
            <div className="flex items-center justify-between text-[10px] bg-slate-100 border text-slate-650 font-bold px-3 py-2.5 rounded-xl">
              <span className="truncate max-w-[240px] font-mono select-all">Bounded resource: {currentUrl}</span>
              <button 
                type="button" 
                onClick={() => { onUpload(''); setLinkVal(''); }} 
                className="text-rose-600 font-bold uppercase tracking-wider text-[9px] hover:underline"
              >
                Clear
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
