import React from 'react';
import { PublicNavbar } from '../components/Navbar';
import { motion } from 'framer-motion';
import { Target, Heart, Shield, Award, Users, BookOpen } from 'lucide-react';

export default function About() {
  return (
    <div className="min-h-screen bg-white">
      <PublicNavbar />
      
      {/* Header */}
      <section className="pt-32 pb-20 bg-primary text-white text-center">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-5xl font-display font-bold mb-6"
          >
            Our Story & Values
          </motion.h1>
          <p className="text-xl text-primary-100/70 max-w-2xl mx-auto italic">
            "Training the child in the way he should go, so that when he is old, he will not depart from it."
          </p>
        </div>
      </section>

      {/* Mission/Vision */}
      <section className="py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-12">
            <div className="bg-gray-50 p-12 rounded-[40px] border border-gray-100">
              <div className="w-16 h-16 bg-primary text-white rounded-2xl flex items-center justify-center mb-8 shadow-lg shadow-primary/20">
                <Target size={32} />
              </div>
              <h2 className="text-3xl font-display font-bold text-primary mb-6">Our Vision</h2>
              <p className="text-lg text-gray-600 leading-relaxed">
                To develop students of integrity, excellence and purpose-driven leaders who will impact their world and have a relationship with God.
              </p>
            </div>
            <div className="bg-secondary/5 p-12 rounded-[40px] border border-secondary/10">
              <div className="w-16 h-16 bg-secondary text-white rounded-2xl flex items-center justify-center mb-8 shadow-lg shadow-secondary/20">
                <Heart size={32} />
              </div>
              <h2 className="text-3xl font-display font-bold text-secondary mb-6">Our Mission</h2>
              <p className="text-lg text-gray-600 leading-relaxed">
                We provide a safe, faith-filled environment where students discover their God-given potential, take responsibility for their choices, and are prepared to lead.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Core Values */}
      <section className="py-24 bg-gray-50 overflow-hidden relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-display font-bold text-primary mb-4">Core Values</h2>
            <div className="w-20 h-1.5 bg-accent mx-auto rounded-full" />
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              { label: 'Integrity', icon: Shield, color: 'text-blue-600' },
              { label: 'Excellence', icon: Award, color: 'text-orange-600' },
              { label: 'Leadership', icon: Users, color: 'text-green-600' },
              { label: 'Faith', icon: BookOpen, color: 'text-primary' },
            ].map((v, i) => (
              <div key={i} className="bg-white p-8 rounded-3xl text-center shadow-sm hover:shadow-xl transition-all border border-gray-100 group">
                <div className={`w-20 h-20 mx-auto rounded-full bg-gray-50 flex items-center justify-center mb-6 ${v.color} group-hover:scale-110 transition-transform`}>
                  <v.icon size={40} />
                </div>
                <h3 className="text-xl font-bold text-gray-900 uppercase tracking-widest">{v.label}</h3>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
