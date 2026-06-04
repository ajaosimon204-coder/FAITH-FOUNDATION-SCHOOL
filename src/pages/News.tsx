import React from 'react';
import { PublicNavbar } from '../components/Navbar';
import { motion, AnimatePresence } from 'framer-motion';
import { BookOpen, Calendar, Search, ArrowRight, Clock, Award, Users, Info, Newspaper, ChevronRight, X, Heart, MessageSquare } from 'lucide-react';
import { useContent } from '../lib/content';
import { supabase } from '../lib/supabase';

interface NewsArticle {
  id: string;
  title: string;
  summary: string;
  content: string;
  category: 'Announcements' | 'Academic' | 'Sports' | 'Events & Culture';
  date: string;
  readTime: string;
  image: string;
  author: string;
  isPinned?: boolean;
}

export default function News() {
  const { content } = useContent();
  const [searchTerm, setSearchTerm] = React.useState('');
  const [selectedCategory, setSelectedCategory] = React.useState<string>('All');
  const [selectedArticle, setSelectedArticle] = React.useState<NewsArticle | null>(null);
  const [likes, setLikes] = React.useState<Record<string, number>>({});
  const [likedArticles, setLikedArticles] = React.useState<string[]>([]);
  const [dbAnnouncements, setDbAnnouncements] = React.useState<any[]>([]);

  // Local static news highlights matching the Faith Foundation brand
  const staticArticles: NewsArticle[] = [
    {
      id: 'art-1',
      title: 'Third Term Calendar & Examinations Schedule Released',
      summary: 'Essential academic updates for parents and students regarding the forthcoming promotional examinations, class revisions, and summer vacation schedules.',
      content: `Dear parents, guardians, and students of the Faith Foundation School community. We are pleased to announce the official release of our Third Term academic timeline and promotional examinations schedule.\n\nRevision week begins on Monday, June 15, and our primary and secondary teachers have curated comprehensive revision folders for all subjects.\n\nPromotional examinations will run from Monday, June 22, to Friday, July 3. All students are advised to clear outstanding school fees and academic balances to receive their electronic examination permits from the administration. Report cards will be published on Friday, July 24, via the online Student Portal. Let us continue to build excellence together!`,
      category: 'Academic',
      date: 'June 01, 2026',
      readTime: '3 min read',
      image: 'https://images.unsplash.com/photo-1506784983877-45594efa4cbe?auto=format&fit=crop&q=80&w=800',
      author: 'Office of the Vice-Principal Academic',
      isPinned: true
    },
    {
      id: 'art-2',
      title: 'Faith Foundation Lions Win Inter-House Athletics Shield',
      summary: 'A wonderful showcase of sportsmanship, endurance, and elite athletic performance at our 2026 Annual Inter-house Sports Carnival.',
      content: `The 2026 Annual Faith Foundation Inter-house Sports Ceremony concluded with spectacular energy at the main athletic bowl on Friday.\n\nThe Red Lions house emerged victorious, claiming the prestigious School Athletics Shield after securing first place in both senior sprints, the high jump, and relay spectacles. The Green Eagles house took a valiant silver, and the Blue Sharks finished with brass honors. We thank our physical education marshals, student leaders, and parents for preparing our pupils for an exceptional day of high-energy sporting action.`,
      category: 'Sports',
      date: 'May 20, 2026',
      readTime: '4 min read',
      image: 'https://images.unsplash.com/photo-1523050335191-51de48d7004e?auto=format&fit=crop&q=80&w=800',
      author: 'Directorate of Athletics & P.E.',
      isPinned: false
    },
    {
      id: 'art-3',
      title: 'Upcoming Parent-Teacher Association (PTA) General Assembly',
      summary: 'Connecting our instructors, school board administrators, and esteemed parents to deliberate on campus facility expansion, curriculum modernization, and tuition structure alignment.',
      content: `Our next Parent-Teacher Association (PTA) quarterly general meeting is scheduled for Saturday, June 13, at 10:00 AM in the Faith Foundation multi-purpose hall.\n\nKey areas of focus for this gathering include:\n- Commissioning of the state-of-the-art Senior Science and Biology laboratory extensions.\n- Introduction of the enhanced hybrid computational learning syllabus across Junior and Senior School grades.\n- Review of school bus logistics and inter-zonal transport schedules.\n\nYour attendance, inputs, and guidance are critical to sustaining the elite educational experience we provide. Light refreshments will be served at the close of deliberations.`,
      category: 'Events & Culture',
      date: 'May 28, 2026',
      readTime: '2 min read',
      image: 'https://images.unsplash.com/photo-1517486808906-6ca8b3f04846?auto=format&fit=crop&q=80&w=800',
      author: 'Secretary General, School Board',
      isPinned: false
    },
    {
      id: 'art-4',
      title: 'Creche to Kindergarten Indoor Exploratory Center Construction Begins',
      summary: 'Providing our junior pre-schoolers with safe, interactive sensory equipment and modern learning spaces designed for cognitive play.',
      content: `As part of our commitment to early childhood development, Faith Foundation is breaking ground on the new Early Years Exploratory Play Environment.\n\nThis dedicated multi-sensory room features educational puzzle columns, tactile materials, an indoor mini-garden, and physical agility obstacles tailored specifically for creche and nursery infants. Construction starts next week and is projected to conclude ahead of the 2026 Holiday Camp session. We look forward to offering this cutting-edge space to foster motor skills and creative thinking!`,
      category: 'Announcements',
      date: 'May 15, 2026',
      readTime: '3 min read',
      image: 'https://images.unsplash.com/photo-1543269865-cbf427effbad?auto=format&fit=crop&q=80&w=800',
      author: 'Early Years Department Lead',
      isPinned: false
    }
  ];

  // Fetch announcements from DB
  React.useEffect(() => {
    const fetchDbAnnouncements = async () => {
      try {
        const { data, error } = await supabase
          .from('notifications')
          .select('*')
          .eq('type', 'announcement')
          .order('created_at', { ascending: false })
          .limit(10);
        
        if (data && data.length > 0) {
          // Map to NewsArticle structure
          const formatted: NewsArticle[] = data.map((item, idx) => ({
            id: `db-${item.id}`,
            title: item.title,
            summary: item.message,
            content: `${item.message}\n\nThis is an official administrative release published by the school admin system. Registered portal users can review details and associated steps via the portal notification tray.`,
            category: 'Announcements' as const,
            date: new Date(item.created_at).toLocaleDateString('en-US', {
              month: 'long',
              day: 'numeric',
              year: 'numeric'
            }),
            readTime: '2 min read',
            image: idx % 2 === 0 
              ? 'https://images.unsplash.com/photo-1509062522246-3755977927d7?auto=format&fit=crop&q=80&w=800'
              : 'https://images.unsplash.com/photo-1577896851231-70ef18881754?auto=format&fit=crop&q=80&w=800',
            author: 'Faith Foundation Administration',
            isPinned: false
          }));
          setDbAnnouncements(formatted);
        }
      } catch (err) {
        // Safe to ignore if table doesn't have open rows or isn't populated
        console.warn('DB public announcements fetch bypassed:', err);
      }
    };

    fetchDbAnnouncements();
  }, []);

  const allArticles = [...dbAnnouncements, ...staticArticles];

  // Filters
  const filteredArticles = allArticles.filter(art => {
    const matchesSearch = art.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          art.summary.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          art.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          art.author.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (selectedCategory === 'All') return matchesSearch;
    return matchesSearch && art.category === selectedCategory;
  });

  const handleLike = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (likedArticles.includes(id)) {
      setLikedArticles(prev => prev.filter(item => item !== id));
      setLikes(prev => ({ ...prev, [id]: (prev[id] || 0) - 1 }));
    } else {
      setLikedArticles(prev => [...prev, id]);
      setLikes(prev => ({ ...prev, [id]: (prev[id] || 0) + 1 }));
    }
  };

  return (
    <div className="min-h-screen bg-slate-50/50">
      <PublicNavbar />
      
      {/* Page Header */}
      <section className="pt-32 pb-16 bg-gradient-to-b from-primary/5 to-transparent border-b border-gray-100 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-accent/10 rounded-full blur-[100px] -z-10" />
        <div className="max-w-7xl mx-auto px-6 text-center">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 px-3 py-1 bg-primary/5 text-primary rounded-full text-xs font-bold uppercase tracking-wider mb-4"
          >
            <Newspaper size={14} />
            Faith Foundation Gazette
          </motion.div>
          <motion.h1 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-5xl lg:text-6xl font-display font-black text-primary mb-6"
          >
            News &amp; Events Hub
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="text-gray-500 max-w-2xl mx-auto font-medium"
          >
            Get the latest school news bulletins, critical administrative adjustments, physical sports records, and developmental highlights from our vibrant campus of Creche, Primary, and College classes in Ibadan.
          </motion.p>
        </div>
      </section>

      {/* Main Grid */}
      <section className="py-12 max-w-7xl mx-auto px-6">
        {/* Controls Layout */}
        <div className="flex flex-col lg:flex-row items-center justify-between gap-6 mb-12">
          {/* Categories Filters List */}
          <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto overflow-x-auto pb-2 lg:pb-0 scrollbar-none">
            {['All', 'Announcements', 'Academic', 'Sports', 'Events & Culture'].map(cat => (
              <button 
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-5 py-2.5 rounded-full font-bold text-xs uppercase tracking-wider cursor-pointer whitespace-nowrap transition-all border ${
                  selectedCategory === cat 
                    ? 'bg-primary text-white border-primary shadow-lg shadow-primary/25 scale-[1.03]' 
                    : 'bg-white text-gray-500 hover:text-primary hover:border-primary/20 border-gray-100'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Search box styling */}
          <div className="relative w-full lg:w-80">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input 
              type="text" 
              placeholder="Search news, authors..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-11 pr-4 py-3 bg-white border border-gray-100 rounded-2xl text-xs font-semibold focus:outline-none focus:border-primary transition-all shadow-sm"
            />
            {searchTerm && (
              <button 
                onClick={() => setSearchTerm('')} 
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-slate-600 font-bold"
              >
                <X size={14} />
              </button>
            )}
          </div>
        </div>

        {/* Pinned Article Highlight If All */}
        {selectedCategory === 'All' && searchTerm === '' && allArticles.some(a => a.isPinned) && (
          <div className="mb-12">
            <h2 className="text-[11px] font-black uppercase tracking-widest text-[#94a3b8] mb-4">Pinned Announcement</h2>
            {allArticles.filter(a => a.isPinned).map(article => (
              <motion.div 
                key={article.id}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                onClick={() => setSelectedArticle(article)}
                className="bg-white rounded-[32px] overflow-hidden border border-gray-100 shadow-xl cursor-pointer hover:shadow-2xl transition-all group flex flex-col lg:flex-row gap-8 p-6 lg:p-8"
              >
                <div className="lg:w-1/2 aspect-[16/10] overflow-hidden rounded-2xl relative bg-slate-100">
                  <img 
                    src={article.image} 
                    alt={article.title} 
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                  />
                  <span className="absolute top-4 left-4 bg-primary text-white text-[10px] uppercase font-black tracking-widest px-4 py-1.5 rounded-full shadow-md">
                    {article.category}
                  </span>
                </div>
                <div className="lg:w-1/2 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center gap-3 text-[11px] text-gray-400 font-bold tracking-wider mb-4">
                      <span className="flex items-center gap-1"><Calendar size={13} /> {article.date}</span>
                      <span>•</span>
                      <span className="flex items-center gap-1"><Clock size={13} /> {article.readTime}</span>
                    </div>
                    <h3 className="text-2xl lg:text-3xl font-display font-black text-primary leading-tight mb-4 group-hover:text-secondary transition-colors">
                      {article.title}
                    </h3>
                    <p className="text-gray-500 text-sm leading-relaxed mb-6 font-medium line-clamp-3">
                      {article.summary}
                    </p>
                  </div>
                  <div className="flex items-center justify-between pt-6 border-t border-slate-50">
                    <div>
                      <p className="text-[10px] text-gray-400 uppercase font-bold tracking-widest">PUBLISHED BY</p>
                      <p className="text-xs font-black text-primary mt-0.5">{article.author}</p>
                    </div>
                    <span className="w-12 h-12 rounded-full bg-slate-50 group-hover:bg-primary group-hover:text-white text-primary flex items-center justify-center transition-all shadow-sm">
                      <ArrowRight size={18} className="group-hover:translate-x-0.5 transition-transform" />
                    </span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {/* Regular News Grid */}
        <div className="mb-16">
          <h2 className="text-[11px] font-black uppercase tracking-widest text-[#94a3b8] mb-6">
            {selectedCategory === 'All' ? 'Latest Stories & Bulletins' : `${selectedCategory} Section`} ({filteredArticles.length})
          </h2>
          {filteredArticles.length === 0 ? (
            <div className="bg-white rounded-[32px] border border-gray-100 p-16 text-center shadow-sm">
              <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto mb-6 text-slate-400">
                <Newspaper size={32} />
              </div>
              <h3 className="text-lg font-black text-primary uppercase tracking-tight mb-2">No Articles Found</h3>
              <p className="text-xs text-gray-400 max-w-sm mx-auto font-medium lead-relaxed">We couldn't find any articles matching "{searchTerm}" in this category. Adjust your criteria or search keywords to view other bulletins.</p>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {filteredArticles.filter(art => selectedCategory !== 'All' || !art.isPinned).map((article, idx) => (
                <motion.div
                  key={article.id}
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  onClick={() => setSelectedArticle(article)}
                  className="bg-white rounded-[32px] border border-gray-100 overflow-hidden shadow-sm hover:shadow-xl cursor-pointer transition-all group flex flex-col h-full"
                >
                  <div className="aspect-[16/10] overflow-hidden relative bg-slate-100">
                    <img 
                      src={article.image} 
                      alt={article.title} 
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent" />
                    <span className="absolute top-4 left-4 bg-white/95 backdrop-blur-md text-primary text-[10px] uppercase font-black tracking-widest px-3.5 py-1.5 rounded-xl shadow-md border border-slate-100">
                      {article.category}
                    </span>
                  </div>

                  <div className="p-6 lg:p-8 flex-1 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center gap-3 text-[10px] text-gray-400 font-bold tracking-wider mb-3">
                        <span className="flex items-center gap-1"><Calendar size={12} /> {article.date}</span>
                        <span>•</span>
                        <span className="flex items-center gap-1"><Clock size={12} /> {article.readTime}</span>
                      </div>
                      <h4 className="text-lg font-display font-black text-primary leading-tight mb-3 group-hover:text-secondary transition-colors line-clamp-2">
                        {article.title}
                      </h4>
                      <p className="text-gray-500 text-xs leading-relaxed mb-6 font-medium line-clamp-3">
                        {article.summary}
                      </p>
                    </div>

                    <div className="pt-6 border-t border-slate-50 flex items-center justify-between">
                      <div className="flex-1 min-w-0 pr-4">
                        <p className="text-[9px] text-gray-400 uppercase font-bold tracking-widest">OFFICED BY</p>
                        <p className="text-xs font-black text-primary mt-0.5 truncate">{article.author}</p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <button 
                          onClick={(e) => handleLike(article.id, e)}
                          className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${
                            likedArticles.includes(article.id)
                              ? 'bg-red-50 text-red-500'
                              : 'bg-slate-50 text-slate-400 hover:text-red-500'
                          }`}
                          title={likedArticles.includes(article.id) ? 'Unlike' : 'Like'}
                        >
                          <Heart size={16} fill={likedArticles.includes(article.id) ? 'currentColor' : 'none'} />
                        </button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Social Follow Callout Section */}
      <section className="py-20 bg-primary text-white overflow-hidden">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="flex items-center gap-6">
            <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center">
              <Newspaper size={32} className="text-accent" />
            </div>
            <div>
              <h3 className="text-2xl font-bold font-display tracking-tight">Stay Fully Aligned</h3>
              <p className="text-white/60 text-sm font-medium mt-1">Enroll in our WhatsApp updates and follow class adjustments in real-time.</p>
            </div>
          </div>
          <div className="flex gap-4">
            <a 
              href={content.contact.facebook_url} 
              target="_blank" 
              rel="noreferrer"
              className="px-6 py-3 bg-white/10 hover:bg-accent hover:text-primary rounded-xl font-bold transition-all text-xs uppercase tracking-wider"
            >
              Facebook Group
            </a>
            <a 
              href={content.contact.whatsapp_url} 
              target="_blank" 
              rel="noreferrer"
              className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold transition-all text-xs uppercase tracking-wider shadow-lg"
            >
              WhatsApp Support
            </a>
          </div>
        </div>
      </section>

      {/* Article Detail Overlaid Modal */}
      <AnimatePresence>
        {selectedArticle && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedArticle(null)}
              className="fixed inset-0 bg-primary/40 backdrop-blur-md z-50 flex items-center justify-center p-4"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 max-w-2xl w-full max-h-[85vh] bg-white rounded-[40px] border border-slate-100 shadow-2xl z-50 overflow-hidden flex flex-col"
            >
              {/* Header Image */}
              <div className="relative aspect-[16/8] shrink-0 bg-slate-100">
                <img src={selectedArticle.image} alt={selectedArticle.title} className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
                <button 
                  onClick={() => setSelectedArticle(null)}
                  className="absolute top-6 right-6 w-11 h-11 bg-white/90 text-primary hover:bg-white rounded-full flex items-center justify-center transition-all shadow-md cursor-pointer border border-slate-100"
                >
                  <X size={18} />
                </button>
                <span className="absolute bottom-6 left-6 bg-accent text-primary text-[9px] uppercase font-black tracking-widest px-4 py-1.5 rounded-full shadow-md">
                  {selectedArticle.category}
                </span>
              </div>

              {/* Body Content */}
              <div className="p-8 overflow-y-auto flex-1">
                <div className="flex items-center gap-3 text-[10px] text-gray-400 font-bold tracking-wider mb-4">
                  <span className="flex items-center gap-1"><Calendar size={13} /> {selectedArticle.date}</span>
                  <span>•</span>
                  <span className="flex items-center gap-1"><Clock size={13} /> {selectedArticle.readTime}</span>
                </div>
                <h2 className="text-2xl font-display font-black text-primary leading-tight mb-6">
                  {selectedArticle.title}
                </h2>
                
                <div className="text-gray-600 text-sm leading-relaxed mb-8 whitespace-pre-line font-medium">
                  {selectedArticle.content}
                </div>

                <div className="pt-6 border-t border-slate-100 flex items-center justify-between">
                  <div>
                    <p className="text-[10px] text-gray-400 uppercase font-bold tracking-widest leading-none">PUBLISHED BY</p>
                    <p className="text-xs font-black text-primary mt-1">{selectedArticle.author}</p>
                  </div>
                  <button 
                    onClick={() => {
                      if (selectedArticle) {
                        const id = selectedArticle.id;
                        if (likedArticles.includes(id)) {
                          setLikedArticles(prev => prev.filter(item => item !== id));
                          setLikes(prev => ({ ...prev, [id]: (prev[id] || 0) - 1 }));
                        } else {
                          setLikedArticles(prev => [...prev, id]);
                          setLikes(prev => ({ ...prev, [id]: (prev[id] || 0) + 1 }));
                        }
                      }
                    }}
                    className={`px-5 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                      likedArticles.includes(selectedArticle.id)
                        ? 'bg-red-50 text-red-500'
                        : 'bg-slate-50 text-slate-500 hover:bg-red-50 hover:text-red-500'
                    }`}
                  >
                    <Heart size={14} fill={likedArticles.includes(selectedArticle.id) ? 'currentColor' : 'none'} />
                    {likedArticles.includes(selectedArticle.id) ? 'Liked This Announcement' : 'Like Event'}
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
