import React from 'react';
import { useContent, SiteContent } from '../lib/content';
import { Save, AlertCircle, Loader2, CheckCircle2, Layout, Image as ImageIcon } from 'lucide-react';
import ImageUploader from './ImageUploader';

export default function ContentEditor() {
  const { content, loading, updateContent } = useContent();
  const [localContent, setLocalContent] = React.useState<SiteContent | null>(null);
  const [saving, setSaving] = React.useState(false);
  const [status, setStatus] = React.useState<'idle' | 'success' | 'error'>('idle');

  React.useEffect(() => {
    if (content) setLocalContent(content);
  }, [content]);

  const handleSave = async () => {
    if (!localContent) return;
    setSaving(true);
    setStatus('idle');
    try {
      await updateContent(localContent);
      setStatus('success');
      setTimeout(() => setStatus('idle'), 3000);
    } catch (error) {
      setStatus('error');
    } finally {
      setSaving(false);
    }
  };

  if (loading || !localContent) return <div>Loading current site content...</div>;

  return (
    <div className="space-y-10">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-black text-slate-800">Website CMS</h2>
          <p className="text-sm text-slate-500">Modify any text or images on the homepage in real-time.</p>
        </div>
        <button 
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 bg-primary text-white px-8 py-3 rounded-xl font-bold hover:bg-opacity-90 disabled:opacity-50 transition-all shadow-xl shadow-primary/20"
        >
          {saving ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
          {status === 'success' ? 'Saved Successfully!' : 'Publish Changes'}
        </button>
      </div>

      <div className="grid lg:grid-cols-2 gap-8 pb-20">
        {/* Branding Editor */}
        <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm space-y-6 lg:col-span-2">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center font-black text-xs">A</div>
            <h3 className="font-bold text-slate-800">Institution Branding</h3>
          </div>
          <div className="grid lg:grid-cols-2 gap-8">
            <ImageUploader 
              label="School Logo"
              currentUrl={localContent.branding.logo_url}
              onUpload={(url) => setLocalContent({...localContent, branding: {...localContent.branding, logo_url: url}})}
            />
            <div className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Institution Name</label>
                <input 
                  type="text"
                  value={localContent.branding.school_name}
                  onChange={(e) => setLocalContent({...localContent, branding: {...localContent.branding, school_name: e.target.value}})}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-4 text-sm font-bold"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">School Motto</label>
                <input 
                  type="text"
                  value={localContent.branding.school_motto}
                  onChange={(e) => setLocalContent({...localContent, branding: {...localContent.branding, school_motto: e.target.value}})}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-4 text-sm font-medium italic"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Hero Editor */}
        <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm space-y-6">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-lg bg-accent/20 text-primary flex items-center justify-center font-black text-xs">1</div>
            <h3 className="font-bold text-slate-800">Hero Section</h3>
          </div>
          <div className="space-y-4">
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Top Badge</label>
              <input 
                type="text"
                value={localContent.hero.badge}
                onChange={(e) => setLocalContent({...localContent, hero: {...localContent.hero, badge: e.target.value}})}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-4 text-sm font-medium focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Hero Title (Use \n for new line)</label>
              <textarea 
                value={localContent.hero.title}
                onChange={(e) => setLocalContent({...localContent, hero: {...localContent.hero, title: e.target.value}})}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-4 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/10 h-32"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Description</label>
              <textarea 
                value={localContent.hero.description}
                onChange={(e) => setLocalContent({...localContent, hero: {...localContent.hero, description: e.target.value}})}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-4 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/10 h-24"
              />
            </div>
            
            <ImageUploader 
              label="Hero Banner Image"
              currentUrl={localContent.hero.image_url}
              onUpload={(url) => setLocalContent({...localContent, hero: {...localContent.hero, image_url: url}})}
            />

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Primary Button</label>
                <input 
                  type="text"
                  value={localContent.hero.cta_primary}
                  onChange={(e) => setLocalContent({...localContent, hero: {...localContent.hero, cta_primary: e.target.value}})}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-4 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/10"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Secondary Button</label>
                <input 
                  type="text"
                  value={localContent.hero.cta_secondary}
                  onChange={(e) => setLocalContent({...localContent, hero: {...localContent.hero, cta_secondary: e.target.value}})}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-4 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/10"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Alumni & Highlights Editor */}
        <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm space-y-6">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-lg bg-accent/20 text-primary flex items-center justify-center font-black text-xs">2</div>
            <h3 className="font-bold text-slate-800">Alumni & Highlights</h3>
          </div>
          <div className="space-y-4">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Alumni Section</p>
            <div className="grid grid-cols-2 gap-4">
              <input 
                type="text"
                value={localContent.alumni.label}
                onChange={(e) => setLocalContent({...localContent, alumni: {...localContent.alumni, label: e.target.value}})}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-4 text-xs font-bold"
                placeholder="Label"
              />
              <input 
                type="text"
                value={localContent.alumni.count}
                onChange={(e) => setLocalContent({...localContent, alumni: {...localContent.alumni, count: e.target.value}})}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-4 text-xs font-bold"
                placeholder="Count"
              />
            </div>
            <input 
              type="text"
              value={localContent.alumni.sublabel}
              onChange={(e) => setLocalContent({...localContent, alumni: {...localContent.alumni, sublabel: e.target.value}})}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl p-4 text-xs font-medium"
              placeholder="Sublabel"
            />
            
            {/* Alumni Network Pictures (Avatars) Editor */}
            <div className="pt-6 border-t border-slate-100 space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Alumni Network Avatars</p>
                <button
                  type="button"
                  onClick={() => {
                    const currentImages = localContent.alumni.images || [];
                    const updated = [...currentImages, "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100&h=100&fit=crop"];
                    setLocalContent({
                      ...localContent,
                      alumni: { ...localContent.alumni, images: updated }
                    });
                  }}
                  className="text-xs font-bold text-primary hover:underline"
                >
                  + Add Avatar
                </button>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {(localContent.alumni.images || []).map((url, idx) => (
                  <div key={idx} className="relative border border-slate-150 p-3 rounded-2xl bg-slate-50 space-y-2">
                    <ImageUploader 
                      label={`Avatar ${idx + 1}`}
                      currentUrl={url}
                      onUpload={(newUrl) => {
                        const currentImages = [...(localContent.alumni.images || [])];
                        currentImages[idx] = newUrl;
                        setLocalContent({
                          ...localContent,
                          alumni: { ...localContent.alumni, images: currentImages }
                        });
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => {
                        const currentImages = (localContent.alumni.images || []).filter((_, i) => i !== idx);
                        setLocalContent({
                          ...localContent,
                          alumni: { ...localContent.alumni, images: currentImages }
                        });
                      }}
                      className="w-full py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all"
                    >
                      Delete Avatar
                    </button>
                  </div>
                ))}
              </div>
              
              {(localContent.alumni.images || []).length === 0 && (
                <p className="text-xs text-slate-400 italic">No alumni avatar pictures. Standard placeholders will be displayed.</p>
              )}
            </div>

            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] pt-6 border-t border-slate-100">Gallery Highlights</p>
            <input 
              type="text"
              value={localContent.highlights.badge}
              onChange={(e) => setLocalContent({...localContent, highlights: {...localContent.highlights, badge: e.target.value}})}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl p-4 text-xs font-bold"
              placeholder="Gallery Badge"
            />
            <input 
              type="text"
              value={localContent.highlights.title}
              onChange={(e) => setLocalContent({...localContent, highlights: {...localContent.highlights, title: e.target.value}})}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl p-4 text-xs font-bold"
              placeholder="Gallery Title"
            />
          </div>
        </div>

        {/* Philosophy Editor */}
        <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm space-y-6">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-lg bg-accent/20 text-primary flex items-center justify-center font-black text-xs">3</div>
            <h3 className="font-bold text-slate-800">Philosophy Section</h3>
          </div>
          <div className="space-y-4">
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Section Badge</label>
              <input 
                type="text"
                value={localContent.philosophy.badge}
                onChange={(e) => setLocalContent({...localContent, philosophy: {...localContent.philosophy, badge: e.target.value}})}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-4 text-sm font-medium focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Main Title</label>
              <textarea 
                value={localContent.philosophy.title}
                onChange={(e) => setLocalContent({...localContent, philosophy: {...localContent.philosophy, title: e.target.value}})}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-4 text-sm font-black focus:outline-none h-24"
              />
            </div>
            <div className="space-y-4 pt-4">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Key Pillars</p>
              {localContent.philosophy.items.map((item, idx) => (
                <div key={idx} className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
                  <input 
                    type="text"
                    value={item.title}
                    onChange={(e) => {
                      const newItems = [...localContent.philosophy.items];
                      newItems[idx].title = e.target.value;
                      setLocalContent({...localContent, philosophy: {...localContent.philosophy, items: newItems}});
                    }}
                    className="w-full bg-white border border-slate-100 rounded-lg p-2 text-xs font-bold focus:outline-none"
                    placeholder="Pillar Title"
                  />
                  <textarea 
                    value={item.desc}
                    onChange={(e) => {
                      const newItems = [...localContent.philosophy.items];
                      newItems[idx].desc = e.target.value;
                      setLocalContent({...localContent, philosophy: {...localContent.philosophy, items: newItems}});
                    }}
                    className="w-full bg-white border border-slate-100 rounded-lg p-2 text-xs focus:outline-none h-16"
                    placeholder="Pillar Description"
                  />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Stats Editor */}
        <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm space-y-6 text-xs">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-lg bg-accent/20 text-primary flex items-center justify-center font-black text-xs">4</div>
            <h3 className="font-bold text-slate-800">Stats Quick Facts</h3>
          </div>
          <div className="grid grid-cols-2 gap-4">
            {localContent.stats.map((stat, idx) => (
              <div key={idx} className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
                 <input 
                  type="text"
                  value={stat.label}
                  onChange={(e) => {
                    const newStats = [...localContent.stats];
                    newStats[idx].label = e.target.value;
                    setLocalContent({...localContent, stats: newStats});
                  }}
                  className="w-full bg-transparent border-none text-[10px] font-bold text-slate-400 uppercase tracking-widest focus:outline-none"
                />
                <input 
                  type="text"
                  value={stat.value}
                  onChange={(e) => {
                    const newStats = [...localContent.stats];
                    newStats[idx].value = e.target.value;
                    setLocalContent({...localContent, stats: newStats});
                  }}
                  className="w-full bg-transparent border-none text-2xl font-black text-slate-800 focus:outline-none"
                />
              </div>
            ))}
          </div>
        </div>

        {/* Gallery Editor */}
        <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm space-y-6 lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-accent/20 text-primary flex items-center justify-center font-black text-xs">5</div>
              <h3 className="font-bold text-slate-800">Gallery Management</h3>
            </div>
            <button
              type="button"
              onClick={() => {
                const updated = [...localContent.gallery, "https://images.unsplash.com/photo-1543269865-cbf427effbad"];
                setLocalContent({ ...localContent, gallery: updated });
              }}
              className="text-xs font-bold text-primary hover:underline"
            >
              + Add Image
            </button>
          </div>
          <div className="grid lg:grid-cols-3 gap-6">
            {localContent.gallery.map((url, idx) => (
              <div key={idx} className="border border-slate-100 bg-slate-50 p-4 rounded-3xl space-y-3 relative group">
                <ImageUploader 
                  label={`Image ${idx + 1}`}
                  currentUrl={url}
                  onUpload={(newUrl) => {
                    const newGallery = [...localContent.gallery];
                    newGallery[idx] = newUrl;
                    setLocalContent({...localContent, gallery: newGallery});
                  }}
                />
                <button
                  type="button"
                  onClick={() => {
                    const newGallery = localContent.gallery.filter((_, i) => i !== idx);
                    setLocalContent({ ...localContent, gallery: newGallery });
                  }}
                  className="w-full py-2 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-xl text-xs font-bold uppercase tracking-wider transition-all"
                >
                  Delete Image
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* CTA Section Editor */}
        <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm space-y-6">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-lg bg-accent/20 text-primary flex items-center justify-center font-black text-xs">6</div>
            <h3 className="font-bold text-slate-800">CTA Section</h3>
          </div>
          <div className="space-y-4">
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Badge Text</label>
              <input 
                type="text"
                value={localContent.cta.badge}
                onChange={(e) => setLocalContent({...localContent, cta: {...localContent.cta, badge: e.target.value}})}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-4 text-sm font-medium focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Main Title</label>
              <input 
                type="text"
                value={localContent.cta.title}
                onChange={(e) => setLocalContent({...localContent, cta: {...localContent.cta, title: e.target.value}})}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-4 text-sm font-medium focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Highlight Text</label>
              <input 
                type="text"
                value={localContent.cta.highlight}
                onChange={(e) => setLocalContent({...localContent, cta: {...localContent.cta, highlight: e.target.value}})}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-4 text-sm font-medium focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* Contact Editor */}
        <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm space-y-6">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-lg bg-accent/20 text-primary flex items-center justify-center font-black text-xs">7</div>
            <h3 className="font-bold text-slate-800">Contact & Socials</h3>
          </div>
          <div className="space-y-4">
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Public Email</label>
              <input 
                type="email"
                value={localContent.contact.email}
                onChange={(e) => setLocalContent({...localContent, contact: {...localContent.contact, email: e.target.value}})}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-4 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/10"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Phone Number</label>
              <input 
                type="text"
                value={localContent.contact.phone}
                onChange={(e) => setLocalContent({...localContent, contact: {...localContent.contact, phone: e.target.value}})}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-4 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/10"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Facebook URL</label>
              <input 
                type="text"
                value={localContent.contact.facebook_url || ''}
                onChange={(e) => setLocalContent({...localContent, contact: {...localContent.contact, facebook_url: e.target.value}})}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-4 text-xs"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">WhatsApp URL</label>
              <input 
                type="text"
                value={localContent.contact.whatsapp_url || ''}
                onChange={(e) => setLocalContent({...localContent, contact: {...localContent.contact, whatsapp_url: e.target.value}})}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-4 text-xs"
              />
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
