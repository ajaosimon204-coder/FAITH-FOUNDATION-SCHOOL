import React from 'react';
import { supabase } from '../lib/supabase';
import { Upload, X, Loader2, ImageIcon } from 'lucide-react';

interface ImageUploaderProps {
  currentUrl: string;
  onUpload: (url: string) => void;
  label: string;
  key?: React.Key;
}

export default function ImageUploader(props: ImageUploaderProps) {
  const { currentUrl, onUpload, label } = props;
  const [uploading, setUploading] = React.useState(false);
  const [dragActive, setDragActive] = React.useState(false);

  const uploadImage = async (file: File) => {
    try {
      setUploading(true);
      
      const fileExt = (file.name && typeof file.name === 'string') ? file.name.split('.').pop() : 'jpg';
      const fileName = `${Math.random().toString(36).substring(2)}_${Date.now()}.${fileExt}`;
      const filePath = `uploads/${fileName}`;

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
      uploadImage(e.target.files[0]);
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
      uploadImage(e.dataTransfer.files[0]);
    }
  };

  return (
    <div className="space-y-2">
      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-2">
        {label}
      </label>
      
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
            <img src={currentUrl} alt="Preview" className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
              <label className="p-2 bg-white rounded-xl text-primary cursor-pointer hover:scale-110 transition-transform">
                <Upload size={16} />
                <input type="file" className="hidden" accept="image/*" onChange={handleFileChange} />
              </label>
              <button 
                onClick={() => onUpload('')}
                className="p-2 bg-white rounded-xl text-red-600 hover:scale-110 transition-transform"
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
              <p className="text-[10px] text-slate-400 mt-1 uppercase tracking-tight">SVG, PNG, JPG (max. 5MB)</p>
            </div>
            <input type="file" className="hidden" accept="image/*" onChange={handleFileChange} disabled={uploading} />
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
    </div>
  );
}
