import React, { useState, useEffect } from 'react';
import { 
  Trophy, 
  Award, 
  Star, 
  Zap, 
  TrendingUp, 
  Sparkles, 
  ShieldAlert, 
  Heart,
  ChevronRight,
  Flame,
  CheckCircle,
  Clock
} from 'lucide-react';

interface MedalBadge {
  id: string;
  title: string;
  rarity: 'Legendary' | 'Rare' | 'Common';
  desc: string;
  xpPoints: number;
  unlocked: boolean;
  unlockedDate?: string;
  icon: string;
  color: string;
}

interface LeaderboardUser {
  rank: number;
  name: string;
  avatarLetter: string;
  points: number;
  role: string;
  status: 'streak' | 'normal' | 'fire';
}

export default function AwardsAchievements() {
  const [achievements, setAchievements] = useState<MedalBadge[]>([]);
  const [leaderboardList, setLeaderboardList] = useState<LeaderboardUser[]>([]);

  useEffect(() => {
    const savedAchivements = localStorage.getItem('ff_student_achievements');
    if (savedAchivements) {
      setAchievements(JSON.parse(savedAchivements));
    } else {
      const defaultAchievements: MedalBadge[] = [
        { id: 'AW-01', title: 'Honor Roll Shield', rarity: 'Legendary', desc: 'Maintain an academic cumulative GPA above 4.5/5.0 across an entire scholastic term cycle.', xpPoints: 500, unlocked: true, unlockedDate: 'Dec 18, 2025', icon: '🏆', color: 'from-amber-400 to-yellow-600' },
        { id: 'AW-02', title: 'CBT Champion Crown', rarity: 'Rare', desc: 'Secure a perfect 100% score on any automated Computer-Based testing (CBT) modules on the platform.', xpPoints: 250, unlocked: true, unlockedDate: 'Apr 02, 2026', icon: '👑', color: 'from-blue-400 to-indigo-600' },
        { id: 'AW-03', title: 'Perfect Attendance Flag', rarity: 'Rare', desc: 'Achieve 100% attendance check-ins throughout an active school term period without excuse excuses.', xpPoints: 200, unlocked: false, icon: '📅', color: 'from-emerald-400 to-teal-605' },
        { id: 'AW-04', title: 'Spiritual Torchbearer', rarity: 'Common', desc: 'Recognized by course mentors for consistent moral leadership, service, and chapel participation.', xpPoints: 150, unlocked: true, unlockedDate: 'Mar 15, 2026', icon: '🔥', color: 'from-rose-450 to-orange-600' },
        { id: 'AW-05', title: 'Junior Mathematician Badge', rarity: 'Common', desc: 'Attain the highest class grade in Further Mathematics terminal examinations.', xpPoints: 100, unlocked: true, unlockedDate: 'Nov 12, 2025', icon: '📐', color: 'from-cyan-400 to-blue-600' }
      ];
      setAchievements(defaultAchievements);
      localStorage.setItem('ff_student_achievements', JSON.stringify(defaultAchievements));
    }

    const savedLeaderboard = localStorage.getItem('ff_student_leaderboard');
    if (savedLeaderboard) {
      setLeaderboardList(JSON.parse(savedLeaderboard));
    } else {
      const defaultLeaderboard: LeaderboardUser[] = [
        { rank: 1, name: 'Ajao Demola Simon', avatarLetter: 'D', points: 1450, role: 'SS3 Science (You)', status: 'fire' },
        { rank: 2, name: 'Ogunlesi Tolulope', avatarLetter: 'T', points: 1280, role: 'SS3 Science', status: 'streak' },
        { rank: 3, name: 'Balogun Chidi Eze', avatarLetter: 'C', points: 1190, role: 'SS3 Science', status: 'normal' },
        { rank: 4, name: 'Adeniyi Amina Ibrahim', avatarLetter: 'A', points: 1110, role: 'SS3 Science', status: 'streak' },
        { rank: 5, name: 'Nwachukwu Kenechi', avatarLetter: 'K', points: 950, role: 'SS3 Arts', status: 'normal' }
      ];
      setLeaderboardList(defaultLeaderboard);
      localStorage.setItem('ff_student_leaderboard', JSON.stringify(defaultLeaderboard));
    }
  }, []);

  const earnedAwards = achievements.filter(a => a.unlocked);
  const totalXp = earnedAwards.reduce((acc, current) => acc + current.xpPoints, 0);

  return (
    <div className="space-y-8 font-sans pb-16">
      {/* Head banner */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-amber-500/10 text-amber-500">
              <Trophy size={20} />
            </span>
            <h2 className="text-xl font-extrabold text-slate-800 tracking-tight uppercase">Scholar Awards & Achievements</h2>
          </div>
          <p className="text-xs text-slate-500">
            Track digital reward trophies, view global class standing leadership, and audit points XP levels earned through excellence.
          </p>
        </div>
      </div>

      {/* Main Stats scoreboards widgets */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Scholar Rank Scorecard */}
        <div className="bg-slate-900 text-white rounded-[24px] p-6 flex flex-col justify-between space-y-4 shadow-md relative overflow-hidden">
          <div className="absolute right-0 top-0 translate-x-4 -translate-y-4 opacity-5 pointer-events-none">
            <Sparkles size={160} />
          </div>
          <div className="flex justify-between items-start">
            <span className="text-[10px] uppercase font-black text-amber-400 tracking-widest bg-white/10 px-2.5 py-1 rounded-full">School Standing</span>
            <Flame className="text-amber-400 animate-pulse" size={18} />
          </div>
          <div>
            <span className="text-[9px] uppercase font-bold text-slate-400 block tracking-wider">AGGREGATE XP POINTS</span>
            <div className="flex items-end gap-2">
              <p className="text-4xl font-black font-display text-white">{totalXp}</p>
              <span className="text-xs font-mono text-amber-400 mb-1 font-bold">XP Level 4</span>
            </div>
          </div>
          <div className="text-[10px] text-slate-400 italic">
            Ranked Number #1 in S3 Science Class Group!
          </div>
        </div>

        {/* Earned badges counter */}
        <div className="bg-white border border-slate-200/80 rounded-[24px] p-6 flex flex-col justify-between space-y-4 shadow-sm">
          <div className="flex justify-between items-start">
            <span className="text-[10px] uppercase font-black text-rose-600 bg-rose-50 px-2.5 py-1 rounded-full">BADGES RECORD</span>
            <Award size={18} className="text-rose-500" />
          </div>
          <div>
            <span className="text-[9px] uppercase font-bold text-slate-400 tracking-wider">Earned Medals</span>
            <p className="text-3xl font-black font-display text-slate-800">{earnedAwards.length} / {achievements.length}</p>
          </div>
          <p className="text-[10px] text-slate-500 italic">
            You unlocked the rare <span className="font-bold text-slate-700">CBT Champion Crown</span> last month!
          </p>
        </div>

        {/* Milestone checklist card */}
        <div className="bg-white border border-slate-200/80 rounded-[24px] p-6 flex flex-col justify-between space-y-4 shadow-sm">
          <div className="flex justify-between items-start">
            <span className="text-[10px] uppercase font-black text-blue-600 bg-blue-50 px-2.5 py-1 rounded-full">UPCOMING MILESTONE</span>
            <Zap size={18} className="text-blue-500" />
          </div>
          <div className="space-y-1">
            <span className="text-[9px] uppercase font-bold text-slate-450 tracking-wider">Next Unlock: "Attendance Star"</span>
            <div className="flex justify-between text-[11px] font-bold text-slate-650 mt-1">
              <span>Class attendance progress</span>
              <span className="font-mono text-primary font-black">94.2% / 100%</span>
            </div>
            <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden mt-11">
              <div className="h-full bg-primary" style={{ width: '94.2%' }}></div>
            </div>
          </div>
        </div>

      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Main Trophy Shelf view column */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-3xl border border-slate-200 p-6 md:p-8 space-y-6 shadow-sm">
            <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider border-b border-slate-105 pb-3">Digital Trophy & Badges Shelf</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {achievements.map((badge) => (
                <div 
                  key={badge.id}
                  className={`p-5 rounded-2xl border flex flex-col justify-between gap-4 transition-all ${
                    badge.unlocked 
                      ? 'bg-gradient-to-br from-white to-slate-50 border-slate-200 hover:shadow-md' 
                      : 'bg-slate-50/25 border-dashed border-slate-200 opacity-60'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex gap-3 items-center">
                      <div className={`w-12 h-12 rounded-xl bg-gradient-to-tr ${badge.color} text-white flex items-center justify-center text-xl shadow-md shrink-0`}>
                        {badge.icon}
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <h4 className="text-xs font-black text-slate-800 uppercase tracking-tight">{badge.title}</h4>
                        </div>
                        <span className={`text-[9px] font-black uppercase inline-block font-mono mt-0.5 ${
                          badge.rarity === 'Legendary' 
                            ? 'text-amber-600' 
                            : badge.rarity === 'Rare' 
                              ? 'text-blue-600' 
                              : 'text-slate-500'
                        }`}>
                          {badge.rarity} &middot; <span className="font-bold text-primary">+{badge.xpPoints} XP</span>
                        </span>
                      </div>
                    </div>

                    <div>
                      {badge.unlocked ? (
                        <span className="bg-emerald-50 text-emerald-700 border border-emerald-100 text-[8px] font-black px-1.5 py-0.5 rounded uppercase">unlocked</span>
                      ) : (
                        <span className="bg-slate-100 text-slate-400 border text-[8px] font-black px-1.5 py-0.5 rounded uppercase flex items-center gap-0.5"><Clock size={8} /> locked</span>
                      )}
                    </div>
                  </div>

                  <p className="text-xs text-slate-500 font-medium leading-relaxed">{badge.desc}</p>

                  {badge.unlocked && badge.unlockedDate && (
                    <div className="text-[9px] text-slate-400 font-mono flex items-center gap-1 border-t border-slate-100 pt-2.5">
                      <CheckCircle size={10} className="text-emerald-500" /> Unlocked date: {badge.unlockedDate}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Global Leaderboards standing column */}
        <div>
          <div className="bg-white rounded-3xl border border-slate-200 p-6 space-y-5 shadow-sm">
            <div className="border-b border-slate-100 pb-3">
              <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                <TrendingUp size={14} className="text-primary" />
                Class Standings Leaderboard
              </h3>
              <p className="text-[10px] text-slate-400 mt-1 uppercase font-semibold">SS3 Science Stream - Year 25/26</p>
            </div>

            <div className="space-y-2.5">
              {leaderboardList.map((user) => {
                const isDemola = user.name === 'Ajao Demola Simon';
                return (
                  <div 
                    key={user.rank}
                    className={`p-3.5 rounded-xl border flex items-center justify-between gap-3 transition-colors ${
                      isDemola 
                        ? 'bg-slate-900 text-white border-slate-900 shadow-md' 
                        : 'bg-slate-50/70 hover:bg-slate-50 border-slate-150/40'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className={`text-xs font-mono font-black w-4 text-center ${
                        isDemola 
                          ? 'text-amber-400' 
                          : 'text-slate-400'
                      }`}>
                        #{user.rank}
                      </span>
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-black text-xs ${
                        isDemola 
                          ? 'bg-amber-400 text-slate-900' 
                          : 'bg-white border text-primary border-slate-100'
                      }`}>
                        {user.avatarLetter}
                      </div>
                      <div>
                        <h4 className="text-xs font-bold leading-tight uppercase tracking-tight">{user.name}</h4>
                        <p className={`text-[9px] ${
                          isDemola 
                            ? 'text-slate-400 font-black' 
                            : 'text-slate-400 font-bold'
                        }`}>{user.role}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <span className="font-mono text-xs font-black">{user.points} XP</span>
                      {user.status === 'fire' && <span className="text-xs">🔥</span>}
                      {user.status === 'streak' && <span className="text-xs">⚡</span>}
                    </div>

                  </div>
                );
              })}
            </div>
          </div>
        </div>

      </div>

    </div>
  );
}
