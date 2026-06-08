import React from 'react';
import { PublicNavbar } from '../components/Navbar';
import { motion } from 'framer-motion';
import { Mail, Phone, MapPin, Clock, MessageSquare, ArrowRight, Facebook, MessageCircle } from 'lucide-react';
import { useContent } from '../lib/content';

export default function Contact() {
  const { content } = useContent();

  const whatsappGroupUrl = "https://chat.whatsapp.com/EogzVIYTEzh05Thm6WfcmE";
  const facebookGroupUrl = "https://facebook.com/groups/765019995142164/";

  return (
    <div className="min-h-screen bg-white">
      <PublicNavbar />
      
      <section className="pt-32 pb-20 bg-gray-50 border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-5xl font-display font-bold text-primary mb-6">Get in Touch</h1>
          <p className="text-gray-600 max-w-2xl mx-auto italic">
            Have questions about admissions, staffing, or our curriculum? We're here to help.
          </p>
        </div>
      </section>

      <section className="py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Main Contacts */}
          <div className="grid lg:grid-cols-3 gap-8 mb-16">
            {[
              { icon: Phone, title: 'Call Us', detail: content.contact.phone, sub: content.contact.working_hours },
              { icon: Mail, title: 'Email Us', detail: content.contact.email, sub: 'We respond within 24 hours' },
              { icon: MapPin, title: 'Visit Us', detail: content.contact.address, sub: 'Main Campus Location' },
            ].map((contact, idx) => (
              <div key={idx} className="bg-white p-10 rounded-[32px] border border-gray-100 text-center shadow-sm hover:shadow-xl transition-all group">
                <div className="w-16 h-16 mx-auto rounded-2xl bg-primary/5 text-primary flex items-center justify-center mb-6 group-hover:bg-primary group-hover:text-white transition-all">
                  <contact.icon size={28} />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">{contact.title}</h3>
                <p className="text-primary font-bold mb-1">{contact.detail}</p>
                <p className="text-gray-400 text-sm font-medium">{contact.sub}</p>
              </div>
            ))}
          </div>

          {/* Interactive online communities */}
          <div className="bg-slate-50 rounded-[40px] p-8 md:p-12 mb-24 border border-slate-100">
            <div className="text-center mb-10">
              <span className="text-xs font-black uppercase tracking-wider text-secondary bg-accent/20 px-4 py-2 rounded-full">Interactive Channels</span>
              <h2 className="text-3xl font-display font-bold text-primary mt-4">Join Our Online Parent-Teacher Community</h2>
              <p className="text-gray-500 mt-2 max-w-xl mx-auto text-sm">Connect with fellow parents, teachers, and school administrators across digital mediums.</p>
            </div>

            <div className="grid md:grid-cols-2 gap-8">
              {/* WhatsApp Community Group Card */}
              <div className="bg-white p-8 rounded-3xl border border-slate-200/60 shadow-sm hover:shadow-md transition-all flex flex-col md:flex-row items-start gap-6">
                <div className="w-14 h-14 rounded-full bg-[#25D366]/15 text-[#25D366] flex items-center justify-center shrink-0">
                  <MessageCircle size={28} />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-slate-900 mb-1">WhatsApp Community & Updates Group</h3>
                  <p className="text-slate-500 text-xs leading-relaxed mb-4">
                    Instant alerts, emergency notices, class announcements, and collaborative discussions with other parents directly in our official WhatsApp portal.
                  </p>
                  <a 
                    href={whatsappGroupUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 bg-[#25D366] hover:bg-[#20ba59] active:scale-95 text-white text-xs font-black uppercase tracking-wider px-5 py-3 rounded-xl transition-all"
                  >
                    <MessageCircle size={15} /> Join WhatsApp Group <ArrowRight size={13} />
                  </a>
                </div>
              </div>

              {/* Facebook Interactive Group Card */}
              <div className="bg-white p-8 rounded-3xl border border-slate-200/60 shadow-sm hover:shadow-md transition-all flex flex-col md:flex-row items-start gap-6">
                <div className="w-14 h-14 rounded-full bg-[#1877F2]/15 text-[#1877F2] flex items-center justify-center shrink-0">
                  <Facebook size={28} />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-slate-900 mb-1">Facebook Parent-Teacher Interactive Association</h3>
                  <p className="text-slate-500 text-xs leading-relaxed mb-4">
                    Browse parent-teacher meeting notes, event recordings, school photo galleries, student graduation videos, and community activities.
                  </p>
                  <a 
                    href={facebookGroupUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 bg-[#1877F2] hover:bg-[#1569d6] active:scale-95 text-white text-xs font-black uppercase tracking-wider px-5 py-3 rounded-xl transition-all"
                  >
                    <Facebook size={15} /> Open Facebook Group <ArrowRight size={13} />
                  </a>
                </div>
              </div>
            </div>
          </div>

          <div className="grid lg:grid-cols-2 gap-16 items-center">

             <div className="max-w-xl">
              <h2 className="text-4xl font-display font-bold text-primary mb-6">Visit Our Campus</h2>
              <p className="text-gray-600 mb-8 leading-relaxed">
                We believe a physical tour is the best way to experience our learning environment. Schedule a visit to speak with our principal and see our facilities.
              </p>
              <div className="space-y-6">
                <div className="flex items-center gap-4 bg-gray-50 p-6 rounded-3xl border border-gray-100">
                  <Clock className="text-secondary" />
                  <div>
                    <h4 className="font-bold text-gray-900">Visiting Hours</h4>
                    <p className="text-sm text-gray-500 font-medium">{content.contact.working_hours}</p>
                  </div>
                </div>
                <a 
                  href={content.contact.whatsapp_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-10 py-4 bg-primary text-white rounded-2xl font-bold flex items-center gap-3 hover:scale-105 transition-transform shadow-xl shadow-primary/20"
                >
                   <MessageSquare size={20} /> Send a Message <ArrowRight size={18} />
                </a>
              </div>
            </div>

            <div className="rounded-[48px] overflow-hidden shadow-2xl relative group">
              <img 
                src="https://images.unsplash.com/photo-1592285158680-ac820c5ab750?auto=format&fit=crop&q=80&w=800" 
                alt="School map location" 
                className="w-full aspect-square object-cover"
              />
              <div className="absolute inset-0 bg-primary/20 group-hover:bg-transparent transition-colors" />
              <div className="absolute bottom-8 left-8 right-8 bg-white/90 backdrop-blur-md p-6 rounded-3xl border border-white/20">
                <h4 className="font-bold text-primary mb-1">Amuloko Campus</h4>
                <p className="text-xs text-gray-500 font-medium">{content.contact.address}</p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
