import { useState, useEffect } from 'react';
import { supabase, isSupabaseConfigured } from './supabase';

export interface SiteContent {
  branding: {
    logo_url: string;
    school_name: string;
    school_motto: string;
  };
  hero: {
    badge: string;
    title: string;
    description: string;
    cta_primary: string;
    cta_secondary: string;
    image_url: string;
  };
  alumni: {
    label: string;
    sublabel: string;
    count: string;
    images?: string[];
  };
  philosophy: {
    badge: string;
    title: string;
    subtitle: string;
    items: { title: string; desc: string }[];
  };
  highlights: {
    badge: string;
    title: string;
  };
  stats: { label: string; value: string; color: string; change: string }[];
  gallery: string[];
  cta: {
    badge: string;
    title: string;
    highlight: string;
  };
  contact: {
    email: string;
    phone: string;
    address: string;
    working_hours: string;
    facebook_url?: string;
    whatsapp_url?: string;
  };
}

const DEFAULT_CONTENT: SiteContent = {
  branding: {
    logo_url: "https://images.unsplash.com/photo-1546410531-bb4caa6b424d?w=100&h=100&fit=crop",
    school_name: "FAITH FOUNDATION",
    school_motto: "Building Excellence on Faith"
  },
  hero: {
    badge: "Official Institution Portal",
    title: "FAITH FOUNDATION",
    description: "Nurturing the next generation of global leaders through academic excellence and unwavering faith.",
    cta_primary: "Join Our Community",
    cta_secondary: "Explore Campus",
    image_url: "https://images.unsplash.com/photo-152305085306e-8c3d3e74c01f?auto=format&fit=crop&q=80&w=1000"
  },
  alumni: {
    label: "Alumni Network",
    sublabel: "Success across the globe",
    count: "+1k",
    images: [
      "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100&h=100&fit=crop",
      "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=100&h=100&fit=crop",
      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop",
      "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop"
    ]
  },
  philosophy: {
    badge: "Our Philosophy",
    title: "EDUCATION WITHOUT BOUNDARIES.",
    subtitle: "Built on Values, Driven by Purpose",
    items: [
      { title: "Academic Rigor", desc: "Balanced curriculum following both Nigerian and international standards from Creche to SS3." },
      { title: "Faith-Filled", desc: "Spiritual growth is at our core. We nurture a deep relationship with God in every student." }
    ]
  },
  highlights: {
    badge: "Highlights",
    title: "School Life in Motion"
  },
  stats: [
    { label: "Graduates", value: "1.2k+", color: "bg-blue-500", change: "+12%" },
    { label: "Expert Staff", value: "50+", color: "bg-rose-500", change: "Steady" },
    { label: "Total Classes", value: "30+", color: "bg-emerald-500", change: "+5%" },
    { label: "State Awards", value: "15", color: "bg-cyan-500", change: "New" },
  ],
  gallery: [
    "https://images.unsplash.com/photo-1543269865-cbf427effbad",
    "https://images.unsplash.com/photo-1509062522246-3755977927d7",
    "https://images.unsplash.com/photo-1571260899304-425eee4c7efc",
    "https://images.unsplash.com/photo-1516321497487-e288fb19713f",
    "https://images.unsplash.com/photo-1524178232363-1fb28f74b671",
    "https://images.unsplash.com/photo-1517486808906-6ca8b3f04846"
  ],
  cta: {
    badge: "Admission Cycle 26/27",
    title: "THE FUTURE",
    highlight: "STARTS HERE."
  },
  contact: {
    email: "admissions@faithfoundation.edu.ng",
    phone: "+2347034817051",
    address: "Oniyefun ZoneA, Thywill, Amuloko, Ibadan",
    working_hours: "Mon - Fri: 8:00 AM - 4:00 PM",
    facebook_url: "https://facebook.com/groups/765019995142164/",
    whatsapp_url: "https://wa.me/2347034817051"
  }
};

export const useContent = () => {
  const [content, setContent] = useState<SiteContent>(() => {
    const savedSandboxContent = localStorage.getItem('faith_foundation_sandbox_content');
    if (savedSandboxContent) {
      try {
        const parsed = JSON.parse(savedSandboxContent);
        return {
          ...DEFAULT_CONTENT,
          ...parsed,
          branding: { ...DEFAULT_CONTENT.branding, ...(parsed.branding || {}) },
          hero: { ...DEFAULT_CONTENT.hero, ...(parsed.hero || {}) },
          alumni: { ...DEFAULT_CONTENT.alumni, ...(parsed.alumni || {}) },
          philosophy: { ...DEFAULT_CONTENT.philosophy, ...(parsed.philosophy || {}) },
          highlights: { ...DEFAULT_CONTENT.highlights, ...(parsed.highlights || {}) },
          cta: { ...DEFAULT_CONTENT.cta, ...(parsed.cta || {}) },
          contact: { ...DEFAULT_CONTENT.contact, ...(parsed.contact || {}) },
        };
      } catch (e) {
        console.error('Failed to parse initial saved sandbox content:', e);
      }
    }
    return DEFAULT_CONTENT;
  });
  const [loading, setLoading] = useState(true);
  const [dbError, setDbError] = useState<string | null>(null);
  const [dbSetupMissing, setDbSetupMissing] = useState(false);

  useEffect(() => {
    // Check if we are running in local sandbox session
    const isSandboxActive = !!localStorage.getItem('faith_foundation_sandbox_session');

    if (isSandboxActive) {
      const savedSandboxContent = localStorage.getItem('faith_foundation_sandbox_content');
      if (savedSandboxContent) {
        try {
          const parsed = JSON.parse(savedSandboxContent);
          setContent(prev => ({
            ...prev,
            ...parsed,
          }));
        } catch (e) {
          console.error('Failed to parse sandboxed content:', e);
        }
      }
      setLoading(false);
      return;
    }

    if (!isSupabaseConfigured) {
      setLoading(false);
      return;
    }

    const docId = 'homepage';
    
    // Initial fetch
    const fetchContent = async () => {
      try {
        const { data, error } = await supabase
          .from('site')
          .select('content')
          .eq('id', docId)
          .single();
        
        if (error) {
          console.warn('Fetched site content returned database error:', error);
          setDbError(error.message);
          const errMsg = error.message?.toLowerCase() || '';
          if (errMsg.includes('relation') || errMsg.includes('does not exist') || error.code === '42P01') {
            setDbSetupMissing(true);
          }
        } else if (data?.content) {
          const fetched = data.content as Partial<SiteContent>;
          const merged: SiteContent = {
            ...DEFAULT_CONTENT,
            ...fetched,
            branding: { ...DEFAULT_CONTENT.branding, ...(fetched.branding || {}) },
            hero: { ...DEFAULT_CONTENT.hero, ...(fetched.hero || {}) },
            alumni: { ...DEFAULT_CONTENT.alumni, ...(fetched.alumni || {}) },
            philosophy: { ...DEFAULT_CONTENT.philosophy, ...(fetched.philosophy || {}) },
            highlights: { ...DEFAULT_CONTENT.highlights, ...(fetched.highlights || {}) },
            cta: { ...DEFAULT_CONTENT.cta, ...(fetched.cta || {}) },
            contact: { ...DEFAULT_CONTENT.contact, ...(fetched.contact || {}) },
            stats: Array.isArray(fetched.stats) ? fetched.stats : DEFAULT_CONTENT.stats,
            gallery: Array.isArray(fetched.gallery) ? fetched.gallery : DEFAULT_CONTENT.gallery,
          };
          setContent(merged);
          // Sync database fetched metadata back to local storage cache
          try {
            localStorage.setItem('faith_foundation_sandbox_content', JSON.stringify(merged));
          } catch (cacheErr) {
            console.error('Failed to cache fetched content:', cacheErr);
          }
        }
      } catch (err: any) {
        const msg = err?.message || String(err) || '';
        const errStr = (String(err) + ' ' + msg + ' ' + (typeof err === 'object' ? JSON.stringify(err) : '')).toLowerCase();
        
        setDbError(msg);
        if (errStr.includes('relation') || errStr.includes('does not exist') || err?.code === '42P01') {
          setDbSetupMissing(true);
        }

        const isNetworkError = 
          errStr.includes('fetch') ||
          errStr.includes('network') ||
          errStr.includes('connection') ||
          errStr.includes('dns') ||
          errStr.includes('load failed') ||
          errStr.includes('offline');

        if (isNetworkError) {
          console.warn('Site content fetch warning (network error):', msg);
        } else {
          console.error('Error fetching site content:', err);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchContent();

    // Subscribe to changes
    let contentChannel: any = null;
    try {
      const uniqueChannelName = `site-content-${Math.random().toString(36).substring(2, 9)}`;
      contentChannel = supabase
        .channel(uniqueChannelName)
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'site',
            filter: `id=eq.${docId}`,
          },
          (payload) => {
            if (payload.new?.content) {
              const newContent = payload.new.content as Partial<SiteContent>;
              setContent(prev => {
                const updated: SiteContent = {
                  ...prev,
                  ...newContent,
                  branding: { ...prev.branding, ...(newContent.branding || {}) },
                  hero: { ...prev.hero, ...(newContent.hero || {}) },
                  alumni: { ...prev.alumni, ...(newContent.alumni || {}) },
                  philosophy: { ...prev.philosophy, ...(newContent.philosophy || {}) },
                  highlights: { ...prev.highlights, ...(newContent.highlights || {}) },
                  cta: { ...prev.cta, ...(newContent.cta || {}) },
                  contact: { ...prev.contact, ...(newContent.contact || {}) },
                  stats: Array.isArray(newContent.stats) ? newContent.stats : prev.stats,
                  gallery: Array.isArray(newContent.gallery) ? newContent.gallery : prev.gallery,
                };
                try {
                  localStorage.setItem('faith_foundation_sandbox_content', JSON.stringify(updated));
                } catch (e) {
                  // ignore
                }
                return updated;
              });
            }
          }
        )
        .subscribe();
    } catch (e) {
      console.error('Error establishing site content postgres real-time updates channel:', e);
    }

    return () => {
      if (contentChannel) {
        try {
          supabase.removeChannel(contentChannel);
        } catch (e) {
          // ignore
        }
      }
    };
  }, []);

  const updateContent = async (newContent: SiteContent) => {
    // Always store locally so edits reflect immediately and stay cached
    try {
      localStorage.setItem('faith_foundation_sandbox_content', JSON.stringify(newContent));
    } catch (e) {
      console.error('Error saving local content cache:', e);
    }

    const isSandboxActive = !!localStorage.getItem('faith_foundation_sandbox_session');

    if (isSandboxActive) {
      setContent(newContent);
      return;
    }

    if (!isSupabaseConfigured) {
      console.warn('Cannot update content on Supabase: not configured');
      setContent(newContent);
      return;
    }
    const docId = 'homepage';
    try {
      const { error } = await supabase
        .from('site')
        .upsert({ id: docId, content: newContent });
      
      if (error) throw error;
      setContent(newContent);
    } catch (err) {
      console.error('Error updating site content on Supabase:', err);
      setContent(newContent);
      throw err;
    }
  };

  return { 
    content, 
    loading, 
    updateContent,
    isConfigMissing: !isSupabaseConfigured,
    isDbSetupMissing: dbSetupMissing,
    dbError
  };
};
