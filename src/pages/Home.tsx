import React from 'react';
import { PublicNavbar } from '../components/Navbar';
import { motion } from 'framer-motion';
import { ChevronRight, GraduationCap, Users, BookOpen, Trophy, CheckCircle, ArrowRight, Play, School, Facebook, MessageCircle, Heart } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useContent } from '../lib/content';

export default function Home() {
  const { content } = useContent();
  const [favorites, setFavorites] = React.useState<string[]>([]);

  const toggleFavorite = (url: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setFavorites(prev => 
      prev.includes(url) ? prev.filter(f => f !== url) : [...prev, url]
    );
  };

  return (
    <div className="min-h-screen bg-white">
      <PublicNavbar />
      
      {/* Hero Section */}
      <section className="relative pt-32 pb-16 lg:pt-40 lg:pb-0 overflow-hidden bg-[#fafafa]">
        {/* Modern Graphic Accents */}
        <div className="absolute top-0 right-0 w-[40%] h-full bg-primary/5 -skew-x-12 translate-x-1/4 -z-10" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-accent/20 rounded-full blur-[100px] -z-10 opacity-50" />
        
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="flex flex-col lg:flex-row gap-16 items-center">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className="lg:w-7/12 text-center lg:text-left z-10"
            >
              <div className="inline-block px-4 py-1.5 rounded-full bg-secondary/5 border border-secondary/20 text-secondary font-bold text-[10px] uppercase tracking-[0.2em] mb-8">
                {content.hero?.badge}
              </div>
              <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl xl:text-[96px] 2xl:text-[112px] font-display font-bold leading-[0.85] text-primary tracking-tighter mb-8 whitespace-pre-line">
                {content.hero?.title}
              </h1>
              <p className="text-xl text-gray-500 font-medium mb-12 max-w-lg leading-snug">
                {content.hero?.description}
              </p>
              
              <div className="flex flex-col sm:flex-row items-center gap-6 justify-center lg:justify-start">
                <Link to="/admissions" className="group relative px-10 py-5 bg-primary text-white rounded-2xl font-bold flex items-center gap-3 hover:scale-[1.02] active:scale-[0.98] transition-all shadow-2xl shadow-primary/30">
                  {content.hero?.cta_primary}
                  <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                </Link>
                <Link to="/gallery" className="text-primary font-bold hover:text-secondary transition-colors flex items-center gap-2 group">
                  <span className="w-10 h-10 rounded-full border-2 border-primary/10 flex items-center justify-center group-hover:border-secondary group-hover:bg-secondary/5 transition-all">
                    <Play size={14} fill="currentColor" />
                  </span>
                  {content.hero?.cta_secondary}
                </Link>
              </div>

              <div className="mt-20 flex items-center gap-12 justify-center lg:justify-start">
                <div className="flex -space-x-3">
                  {(content.alumni?.images && content.alumni.images.length > 0
                    ? content.alumni.images
                    : [
                        "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100&h=100&fit=crop",
                        "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=100&h=100&fit=crop",
                        "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop",
                        "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop"
                      ]
                  ).map((url, idx) => (
                    <div key={idx} className="w-12 h-12 rounded-full border-4 border-white bg-slate-200 overflow-hidden">
                      <img src={url} alt="Alumni" />
                    </div>
                  ))}
                  <div className="w-12 h-12 rounded-full border-4 border-white bg-accent flex items-center justify-center text-xs font-bold text-primary">
                    {content.alumni?.count}
                  </div>
                </div>
                <div className="text-left">
                  <p className="text-sm font-bold text-primary">{content.alumni?.label}</p>
                  <p className="text-xs text-gray-400">{content.alumni?.sublabel}</p>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.95, rotate: 2 }}
              animate={{ opacity: 1, scale: 1, rotate: 0 }}
              transition={{ duration: 1, delay: 0.2, ease: "easeOut" }}
              className="lg:w-5/12 relative"
            >
              <div className="relative group">
                <div className="absolute -inset-4 bg-gradient-to-r from-accent to-secondary rounded-[48px] blur-2xl opacity-20 group-hover:opacity-30 transition-opacity" />
                <div className="relative aspect-[4/5] overflow-hidden rounded-[40px] shadow-[0_40px_80px_-15px_rgba(0,0,0,0.3)]">
                  <img 
                    src={content.hero?.image_url} 
                    alt="Campus Life"
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-primary/80 via-transparent to-transparent" />
                  <div className="absolute bottom-10 left-10 right-10">
                    <p className="text-xs font-bold text-accent uppercase tracking-widest mb-2">Excellence in Action</p>
                    <h3 className="text-3xl font-bold text-white mb-4">A legacy of learning that speaks for itself.</h3>
                    <div className="flex gap-4">
                      <div className="flex-1 h-1 bg-white/30 rounded-full overflow-hidden">
                        <motion.div 
                          className="h-full bg-accent" 
                          animate={{ width: ["0%", "100%"] }}
                          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Floating Badge */}
              <motion.div 
                animate={{ y: [0, -10, 0] }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                className="absolute -top-10 -right-6 bg-white p-6 rounded-[32px] shadow-2xl border border-slate-100 z-20 flex items-center gap-4"
              >
                <div className="w-14 h-14 bg-secondary/10 rounded-2xl flex items-center justify-center text-secondary">
                  <CheckCircle size={32} />
                </div>
                <div>
                  <p className="text-xs text-gray-400 font-bold uppercase tracking-widest">Accredited by</p>
                  <p className="text-lg font-black text-primary font-display">OYO STATE</p>
                </div>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Motion Pictures Section - Scrolling Highlights */}
      <section className="py-20 bg-white overflow-hidden">
        <div className="max-w-7xl mx-auto px-6 mb-12 flex justify-between items-end">
          <div>
            <h2 className="text-xs font-bold text-secondary uppercase tracking-[0.3em] mb-4">{content.highlights?.badge}</h2>
            <p className="text-4xl font-display font-black text-primary leading-none">{content.highlights?.title}</p>
          </div>
          <button className="text-sm font-bold text-primary hover:text-secondary flex items-center gap-2 group">
            View All Events <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
          </button>
        </div>

        <div className="flex gap-6 w-full marquee-container">
          <motion.div 
            className="flex gap-6 shrink-0"
            animate={{ x: [0, -1000] }}
            transition={{ duration: 40, repeat: Infinity, ease: "linear" }}
          >
            {content.gallery.map((url, idx) => (
              <div key={idx} className="w-[400px] aspect-[16/10] bg-slate-100 rounded-3xl overflow-hidden group cursor-pointer border border-slate-100 shadow-sm relative">
                <img 
                  src={`${url}?auto=format&fit=crop&q=80&w=800`} 
                  alt="Gallery" 
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                />
                <button 
                  onClick={(e) => toggleFavorite(url, e)}
                  className={`absolute top-4 right-4 z-20 w-10 h-10 rounded-full flex items-center justify-center transition-all ${favorites.includes(url) ? 'bg-red-500 text-white shadow-lg' : 'bg-white/80 text-gray-600 backdrop-blur-md opacity-0 group-hover:opacity-100 hover:bg-white'}`}
                >
                  <Heart size={20} fill={favorites.includes(url) ? "currentColor" : "none"} />
                </button>
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <Play className="text-white" size={48} />
                </div>
              </div>
            ))}
          </motion.div>
          {/* Duplicate for seamless marquee */}
          <motion.div 
            className="flex gap-6 shrink-0"
            animate={{ x: [0, -1000] }}
            transition={{ duration: 40, repeat: Infinity, ease: "linear" }}
          >
            {content.gallery.map((url, idx) => (
              <div key={`dup-${idx}`} className="w-[400px] aspect-[16/10] bg-slate-100 rounded-3xl overflow-hidden group border border-slate-100 shadow-sm relative">
                <img 
                  src={`${url}?auto=format&fit=crop&q=80&w=800`} 
                  alt="Gallery" 
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                />
                <button 
                  onClick={(e) => toggleFavorite(url, e)}
                  className={`absolute top-4 right-4 z-20 w-10 h-10 rounded-full flex items-center justify-center transition-all ${favorites.includes(url) ? 'bg-red-500 text-white shadow-lg' : 'bg-white/80 text-gray-600 backdrop-blur-md opacity-0 group-hover:opacity-100 hover:bg-white'}`}
                >
                  <Heart size={20} fill={favorites.includes(url) ? "currentColor" : "none"} />
                </button>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Philosophy Section */}
      <section className="py-32 bg-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-accent/5 rounded-full blur-[120px] -z-10 translate-x-1/2 -translate-y-1/2" />
        
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-col lg:flex-row gap-20 items-center">
            <motion.div 
              initial={{ opacity: 0, x: -40 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="lg:w-1/2"
            >
              <h2 className="text-[10px] font-bold text-secondary uppercase tracking-[0.4em] mb-6">{content.philosophy?.badge}</h2>
              <p className="text-5xl lg:text-7xl font-display font-black text-primary leading-[0.9] tracking-tighter mb-10">
                {content.philosophy?.title}
              </p>
              <div className="space-y-8">
                {content.philosophy?.items?.map((item, idx) => (
                  <div key={idx} className="flex gap-6 group">
                    <div className="w-px h-16 bg-slate-200 group-hover:bg-secondary transition-colors duration-500 shrink-0" />
                    <div>
                      <h4 className="text-xl font-bold text-primary mb-2">{item.title}</h4>
                      <p className="text-gray-500 text-sm leading-relaxed max-w-sm">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>

            <div className="lg:w-1/2 grid grid-cols-2 gap-4">
              <motion.div 
                initial={{ opacity: 0, y: 100 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8 }}
                className="rounded-[32px] overflow-hidden aspect-[3/4] shadow-2xl"
              >
                <img src="https://images.unsplash.com/photo-1524178232363-1fb28f74b671?auto=format&fit=crop&q=80&w=800" className="w-full h-full object-cover" alt="Student" />
              </motion.div>
              <motion.div 
                initial={{ opacity: 0, y: -100 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8, delay: 0.2 }}
                className="mt-12 rounded-[32px] overflow-hidden aspect-[3/4] shadow-2xl"
              >
                <img src="https://images.unsplash.com/photo-1543269865-cbf427effbad?auto=format&fit=crop&q=80&w=800" className="w-full h-full object-cover" alt="Learning" />
              </motion.div>
            </div>
          </div>
        </div>
      </section>

      {/* Statistics - Cinematic Glass Cards */}
      <section className="py-32 bg-[#0a0a0a] relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-20" />
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-b from-primary/20 to-transparent" />
        
        <div className="max-w-7xl mx-auto px-6 relative z-10">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-0.5 bg-white/5 border border-white/5 rounded-[40px] overflow-hidden backdrop-blur-xl">
            {content.stats?.map((stat, i) => (
              <motion.div 
                key={i}
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="p-12 text-center hover:bg-white/5 transition-colors group cursor-default"
              >
                <p className="text-[10px] font-bold text-accent uppercase tracking-[0.3em] mb-4 opacity-50 group-hover:opacity-100 transition-opacity">{stat.label}</p>
                <p className="text-5xl font-black text-white font-display tracking-tighter group-hover:scale-110 transition-transform">{stat.value}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section - Cinematic Immersive Banner */}
      <section className="py-32 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="relative h-[600px] rounded-[48px] overflow-hidden flex items-center justify-center text-center p-12 bg-primary"
          >
            <div className="absolute inset-0">
              <img 
                src="https://images.unsplash.com/photo-152305085306e-8c3d3e74c01f?auto=format&fit=crop&q=80&w=2000" 
                className="w-full h-full object-cover opacity-20 grayscale brightness-50" 
                alt="Background"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
            </div>
            
            <div className="relative z-10 max-w-4xl">
              <span className="inline-block px-6 py-2 rounded-full border border-white/20 text-white text-[10px] font-bold uppercase tracking-[0.5em] mb-8">{content.cta?.badge}</span>
              <h2 className="text-5xl lg:text-8xl font-display font-black text-white tracking-tighter leading-none mb-10">
                {content.cta?.title} <br /> <span className="text-accent underline decoration-secondary decoration-8 underline-offset-[12px]">{content.cta?.highlight}</span>
              </h2>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
                <Link to="/admissions" className="px-12 py-5 bg-accent text-primary rounded-2xl font-black text-lg hover:bg-white hover:scale-105 transition-all shadow-2xl shadow-accent/20">
                  {content.hero?.cta_primary === 'Join Our Community' ? 'APPLY NOW' : content.hero?.cta_primary}
                </Link>
                <Link to="/contact" className="px-12 py-5 bg-white/10 backdrop-blur-md border border-white/20 text-white rounded-2xl font-black text-lg hover:bg-white/20 transition-all">
                  BOOK A TOUR
                </Link>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-20 pb-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid md:grid-cols-4 gap-12 border-b border-white/5 pb-10">
          <div className="col-span-1 md:col-span-1">
             <div className="flex items-center space-x-2 mb-6">
              <div className="w-10 h-10 rounded-xl overflow-hidden bg-white p-1 border border-white/10 shrink-0">
                <img src={content.branding?.logo_url} alt="Logo" className="w-full h-full object-contain" />
              </div>
              <div className="text-white">
                <span className="font-display font-bold text-lg block leading-none uppercase">{content.branding?.school_name}</span>
                <span className="text-[10px] text-accent font-semibold tracking-widest uppercase mt-0.5 block">{content.branding?.school_motto}</span>
              </div>
            </div>
            <p className="text-sm leading-relaxed mb-6">
              Empowering students with faith, integrity, and academic excellence in the heart of Ibadan.
            </p>
          </div>
          
          <div>
            <h4 className="text-white font-bold mb-6">Quick Links</h4>
            <ul className="space-y-4 text-sm">
              <li><Link to="/about" className="hover:text-white">About Us</Link></li>
              <li><Link to="/admissions" className="hover:text-white">Admission Process</Link></li>
              <li><Link to="/gallery" className="hover:text-white">Photo Gallery</Link></li>
              <li><Link to="/contact" className="hover:text-white">Find Us</Link></li>
              <li><Link to="/login" className="hover:text-white">Admin Portal</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-white font-bold mb-6">Our Schools</h4>
            <ul className="space-y-4 text-sm">
              <li>Creche & Playgroup</li>
              <li>Nursery & Primary</li>
              <li>Junior Secondary (JSS)</li>
              <li>Senior Secondary (SS)</li>
            </ul>
          </div>

          <div>
            <h4 className="text-white font-bold mb-6">Connect With Us</h4>
            <div className="space-y-4 text-sm">
              <p>{content.contact?.address}</p>
              <p className="text-white font-bold mt-4">{content.contact?.phone}</p>
              <p className="text-xs mb-6">{content.contact?.working_hours}</p>
              
              <div className="flex gap-4 pt-4 border-t border-white/5">
                {content.contact?.facebook_url && (
                  <a 
                    href={content.contact.facebook_url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-white hover:bg-[#1877F2] transition-colors"
                  >
                    <Facebook size={18} />
                  </a>
                )}
                {content.contact?.whatsapp_url && (
                  <a 
                    href={content.contact.whatsapp_url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-white hover:bg-[#25D366] transition-colors"
                  >
                    <MessageCircle size={18} />
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 text-center text-xs tracking-widest uppercase font-medium">
          © {new Date().getFullYear()} {content.branding?.school_name}. All rights reserved. Built for Excellence.
        </div>
      </footer>
    </div>
  );
}
