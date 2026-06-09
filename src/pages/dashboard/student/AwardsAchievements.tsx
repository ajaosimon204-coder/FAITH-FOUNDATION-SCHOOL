import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
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
  const { profile } = useAuth();
  const [achievements, setAchievements] = useState<MedalBadge[]>([]);
  const [leaderboardList, setLeaderboardList] = useState<LeaderboardUser[]>([]);
  const [attendanceRate, setAttendanceRate] = useState<number>(0);

  const activeStudentName = profile?.full_name || profile?.name || profile?.student_name || 'Student';
  const activeClass = profile?.studentClass || profile?.class || 'Assigned Class';

  useEffect(() => {
    const studentId = profile?.studentId || profile?.id || '';
    if (!studentId) return;

    // Load actual student achievements
    const savedAchivements = localStorage.getItem(`ff_student_achievements_${studentId}`) || localStorage.getItem('ff_student_achievements');
    let loadedAchievements: MedalBadge[] = [];
    if (savedAchivements) {
      loadedAchievements = JSON.parse(savedAchivements);
      setAchievements(loadedAchievements);
    } else {
      setAchievements([]);
    }

    const earned = loadedAchievements.filter(a => a.unlocked);
    const calculatedTotalXp = earned.reduce((acc, current) => acc + current.xpPoints, 0);

    // Load actual student attendance percentage
    const savedLogs = localStorage.getItem(`ff_attendance_student_logs_${studentId}`) || localStorage.getItem('ff_attendance_student_logs');
    if (savedLogs) {
      try {
        const logsParsed = JSON.parse(savedLogs);
        if (Array.isArray(logsParsed) && logsParsed.length > 0) {
          const presentCount = logsParsed.filter((l: any) => l.status === 'present' || l.status === 'late').length;
          setAttendanceRate(Math.round((presentCount / logsParsed.length) * 100));
        }
      } catch (e) {
        console.error('Error calculating attendance rate:', e);
      }
    }

    // Load scoreboard leaderboard
    const savedLeaderboard = localStorage.getItem(`ff_student_leaderboard_${studentId}`) || localStorage.getItem('ff_student_leaderboard');
    if (savedLeaderboard) {
      try {
        const parsed = JSON.parse(savedLeaderboard);
        let updated = parsed.map((item: any) => {
          const isSelf = item.studentId === studentId || item.name?.toLowerCase() === activeStudentName.toLowerCase() || item.name === 'Ajao Demola Simon';
          if (isSelf) {
            return {
              ...item,
              name: activeStudentName,
              studentId: studentId,
              avatarLetter: activeStudentName.charAt(0).toUpperCase(),
              points: calculatedTotalXp,
              role: `${activeClass} (You)`
            };
          }
          return item;
        });

        updated.sort((a: any, b: any) => b.points - a.points);
        updated = updated.map((item: any, idx: number) => ({
          ...item,
          rank: idx + 1
        }));
        setLeaderboardList(updated);
      } catch (e) {
        console.error(e);
      }
    } else {
      setLeaderboardList([
        {
          rank: 1,
          name: activeStudentName,
          avatarLetter: activeStudentName.charAt(0).toUpperCase(),
          points: calculatedTotalXp,
          role: `${activeClass} (You)`,
          status: 'fire'
        }
      ]);
    }
  }, [activeStudentName, activeClass, profile]);

  const earnedAwards = achievements.filter(a => a.unlocked);
  const totalXp = earnedAwards.reduce((acc, current) => acc + current.xpPoints, 0);

  const myRankItem = leaderboardList.find(x => x.name === activeStudentName || x.role.includes('(You)'));
  const myRankText = myRankItem ? `Ranked Number #${myRankItem.rank} in ${activeClass} Group` : 'Establishing Standing';
  const myLevel = totalXp >= 400 ? 'XP Level 4' : totalXp >= 200 ? 'XP Level 3' : totalXp >= 100 ? 'XP Level 2' : 'XP Level 1';

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
              <span className="text-xs font-mono text-amber-400 mb-1 font-bold">{myLevel}</span>
            </div>
          </div>
          <div className="text-[10px] text-slate-400 italic">
            {myRankText}
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
          {earnedAwards.length > 0 ? (
            <p className="text-[10px] text-slate-500 italic leading-relaxed">
              You unlocked the rare <span className="font-bold text-slate-700">{earnedAwards[0].title}</span> award!
            </p>
          ) : (
            <p className="text-[10px] text-slate-400 italic leading-relaxed">
              Earn special merits to unlock structural performance badges.
            </p>
          )}
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
              <span className="font-mono text-primary font-black">{attendanceRate}% / 100%</span>
            </div>
            <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden mt-11">
              <div className="h-full bg-primary" style={{ width: `${attendanceRate}%` }}></div>
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
              {achievements.length === 0 ? (
                <div className="col-span-1 md:col-span-2 text-center py-12 space-y-3">
                  <div className="text-3xl">🏆</div>
                  <p className="text-xs font-black uppercase text-slate-800 tracking-wider">No awards available</p>
                  <p className="text-[10px] text-slate-450 max-w-xs mx-auto font-semibold leading-relaxed">Your honors, merits, and special academic badges will show up here once assigned by the school staff.</p>
                </div>
              ) : (
                achievements.map((badge) => (
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
                ))
              )}
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
              <p className="text-[10px] text-slate-400 mt-1 uppercase font-semibold">{achievements.length > 0 ? "SS3 Science Stream - Year 25/26" : "No standings"}</p>
            </div>

            <div className="space-y-2.5">
              {leaderboardList.length === 0 ? (
                <div className="text-center py-6 text-slate-400 text-[10px] uppercase font-bold tracking-wider">
                  No standings available.
                </div>
              ) : (
                leaderboardList.map((user) => {
                  const isMe = user.name === activeStudentName;
                  return (
                    <div 
                      key={user.rank}
                      className={`p-3.5 rounded-xl border flex items-center justify-between gap-3 transition-colors ${
                        isMe 
                          ? 'bg-slate-900 text-white border-slate-900 shadow-md' 
                          : 'bg-slate-50/70 hover:bg-slate-50 border-slate-150/40'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span className={`text-xs font-mono font-black w-4 text-center ${
                          isMe 
                            ? 'text-amber-400' 
                            : 'text-slate-400'
                        }`}>
                          #{user.rank}
                        </span>
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-black text-xs ${
                          isMe 
                            ? 'bg-amber-400 text-slate-900' 
                            : 'bg-white border text-primary border-slate-100'
                        }`}>
                          {user.avatarLetter}
                        </div>
                        <div>
                          <h4 className="text-xs font-bold leading-tight uppercase tracking-tight">{user.name}</h4>
                          <p className={`text-[9px] ${
                            isMe 
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
                })
              )}
            </div>
          </div>
        </div>

      </div>

    </div>
  );
}
