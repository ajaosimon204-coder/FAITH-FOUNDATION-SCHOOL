import React from 'react';
import { PublicNavbar } from '../components/Navbar';
import { motion } from 'framer-motion';
import { Camera, Layers, Users, GraduationCap, Heart } from 'lucide-react';
import { useContent } from '../lib/content';

export default function Gallery() {
  const [favorites, setFavorites] = React.useState<string[]>([]);
  const { content } = useContent();
  const dynamicImages = content?.gallery?.map((url, idx) => ({
    url,
    category: 'Campus Life',
    title: `Highlight ${idx + 1}`
  })) || [];

  const staticFallback = [
    { url: 'https://images.unsplash.com/photo-1509062522246-3755977927d7?auto=format&fit=crop&q=80&w=800', category: 'Academics', title: 'Class in Progress' },
    { url: 'https://images.unsplash.com/photo-1544717297-fa154da09f9b?auto=format&fit=crop&q=80&w=800', category: 'Events', title: 'Graduation Day' },
    { url: 'https://images.unsplash.com/photo-1523050335191-51de48d7004e?auto=format&fit=crop&q=80&w=800', category: 'Sports', title: 'Inter-house Sports' },
    { url: 'https://images.unsplash.com/photo-1577896851231-70ef18881754?auto=format&fit=crop&q=80&w=800', category: 'Academics', title: 'Science Lab' },
    { url: 'https://images.unsplash.com/photo-1516627145497-ae69688df174?auto=format&fit=crop&q=80&w=800', category: 'Events', title: 'Cultural Day' },
    { url: 'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?auto=format&fit=crop&q=80&w=800', category: 'Faith', title: 'Morning Assembly' },
  ];

  const displayImages = dynamicImages.length > 0 ? dynamicImages : staticFallback;

  const toggleFavorite = (url: string) => {
    setFavorites(prev => 
      prev.includes(url) ? prev.filter(f => f !== url) : [...prev, url]
    );
  };

  return (
    <div className="min-h-screen bg-white">
      <PublicNavbar />
      
      <section className="pt-32 pb-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-5xl font-display font-bold text-primary mb-6">School Gallery</h1>
          <p className="text-gray-600 max-w-2xl mx-auto italic">
            Capturing the moments that define our journey of excellence and integrity.
          </p>
        </div>
      </section>

      <section className="py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-wrap items-center justify-center gap-4 mb-16">
            {['All', 'Academics', 'Sports', 'Events', 'Faith'].map(cat => (
              <button 
                key={cat}
                className="px-6 py-2 rounded-full border-2 border-gray-100 font-bold text-gray-500 hover:border-primary hover:text-primary transition-all"
              >
                {cat}
              </button>
            ))}
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {displayImages.map((img, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: idx * 0.1 }}
                className="group relative rounded-[32px] overflow-hidden shadow-lg border border-gray-100"
              >
                <img 
                  src={img.url} 
                  alt={img.title}
                  className="w-full aspect-[4/5] object-cover group-hover:scale-110 transition-transform duration-700"
                />
                
                <button 
                  onClick={() => toggleFavorite(img.url)}
                  className={`absolute top-6 right-6 z-20 w-12 h-12 rounded-2xl flex items-center justify-center transition-all ${favorites.includes(img.url) ? 'bg-red-500 text-white shadow-xl scale-110' : 'bg-white/90 text-gray-500 backdrop-blur-md opacity-0 group-hover:opacity-100 hover:bg-white hover:scale-110'}`}
                >
                  <Heart size={24} fill={favorites.includes(img.url) ? "currentColor" : "none"} />
                </button>

                <div className="absolute inset-0 bg-gradient-to-t from-primary/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-8 text-white">
                  <span className="text-xs font-bold uppercase tracking-widest text-accent mb-2">{img.category}</span>
                  <h4 className="text-xl font-bold">{img.title}</h4>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Social Callout */}
      <section className="py-20 bg-primary text-white overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="flex items-center gap-6">
            <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center">
              <Camera size={32} />
            </div>
            <div>
              <h3 className="text-2xl font-bold">Follow Our Journey</h3>
              <p className="text-white/60">Follow us on social media for daily updates and highlights.</p>
            </div>
          </div>
          <div className="flex gap-4">
            <a 
              href={content.contact.facebook_url} 
              target="_blank" 
              rel="noopener noreferrer"
              className="px-6 py-3 bg-white/10 rounded-xl font-bold hover:bg-accent hover:text-primary transition-all"
            >
              Facebook Group
            </a>
            <button className="px-6 py-3 bg-white/10 rounded-xl font-bold hover:bg-accent hover:text-primary transition-all">
              Instagram
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
