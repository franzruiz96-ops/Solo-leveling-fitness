import { useState, useEffect, useRef } from "react";

// ── SYSTEM DATA ────────────────────────────────────────────────────────────────

const RANKS = [
  { rank: "E", label: "E-Rank", minLevel: 1,  maxLevel: 9,  color: "#9ca3af", glow: "#6b7280" },
  { rank: "D", label: "D-Rank", minLevel: 10, maxLevel: 19, color: "#60a5fa", glow: "#3b82f6" },
  { rank: "C", label: "C-Rank", minLevel: 20, maxLevel: 34, color: "#34d399", glow: "#10b981" },
  { rank: "B", label: "B-Rank", minLevel: 35, maxLevel: 49, color: "#a78bfa", glow: "#8b5cf6" },
  { rank: "A", label: "A-Rank", minLevel: 50, maxLevel: 74, color: "#fbbf24", glow: "#f59e0b" },
  { rank: "S", label: "S-Rank", minLevel: 75, maxLevel: 99, color: "#f87171", glow: "#ef4444" },
];

const getRank = (level) => RANKS.find(r => level >= r.minLevel && level <= r.maxLevel) || RANKS[0];

const XP_PER_LEVEL = (level) => Math.floor(100 * Math.pow(1.35, level - 1));

const DAILY_MISSIONS = {
  E: [
    { id: "pushups",   icon: "💪", name: "Push-Up Protocol",    desc: "10 push-ups",         xp: 40,  stat: "strength",  statGain: 1 },
    { id: "squats",    icon: "🦵", name: "Squat Drill",          desc: "15 squats",           xp: 40,  stat: "endurance", statGain: 1 },
    { id: "plank",     icon: "🔥", name: "Iron Will Plank",      desc: "20 sec plank",        xp: 30,  stat: "discipline",statGain: 1 },
    { id: "run",       icon: "🏃", name: "Shadow Sprint",        desc: "10 min walk/jog",     xp: 50,  stat: "agility",   statGain: 1 },
    { id: "flex",      icon: "🧘", name: "Mind-Body Ritual",     desc: "5 min stretching",    xp: 20,  stat: "mentalFocus",statGain: 1 },
  ],
  D: [
    { id: "pushups",   icon: "💪", name: "Power Strike Protocol", desc: "25 push-ups",        xp: 70,  stat: "strength",  statGain: 2 },
    { id: "squats",    icon: "🦵", name: "Thunder Squat Drill",   desc: "30 squats",          xp: 70,  stat: "endurance", statGain: 2 },
    { id: "plank",     icon: "🔥", name: "Adamantine Plank",      desc: "45 sec plank",       xp: 50,  stat: "discipline",statGain: 2 },
    { id: "run",       icon: "🏃", name: "Phantom Run",           desc: "20 min jog",         xp: 80,  stat: "agility",   statGain: 2 },
    { id: "flex",      icon: "🧘", name: "Hunter's Meditation",   desc: "10 min flexibility", xp: 40,  stat: "mentalFocus",statGain: 2 },
  ],
};

const BOSS_BATTLES = [
  {
    rank: "E",
    name: "Shadow Golem",
    desc: "Your first true test, Hunter. The Shadow Golem rises.",
    tasks: [
      { icon: "💪", text: "30 push-ups (can be split into sets)" },
      { icon: "🦵", text: "40 squats" },
      { icon: "🔥", text: "3 × 30-sec planks" },
      { icon: "🏃", text: "20 min continuous jog" },
    ],
    xpReward: 500,
    reward: "🗡️ Title: 'Shadow Initiate' + Unlock Skill: SECOND WIND",
  },
  {
    rank: "D",
    name: "Iron Warlord",
    desc: "The dungeon shakes. A being of iron and will challenges you.",
    tasks: [
      { icon: "💪", text: "60 push-ups" },
      { icon: "🦵", text: "75 squats" },
      { icon: "🔥", text: "3 × 60-sec planks" },
      { icon: "🏃", text: "30 min run" },
    ],
    xpReward: 1000,
    reward: "⚔️ Title: 'Iron Slayer' + Unlock Skill: BERSERKER MODE",
  },
];

const SKILLS = [
  { id: "secondWind",    level: 5,  name: "⚡ SECOND WIND",      desc: "On rest days, a 10-min walk counts as an active recovery mission (+20 XP)." },
  { id: "focusBurst",    level: 8,  name: "🧠 FOCUS BURST",      desc: "After 5-day streak, Mental Focus gains are doubled for 2 days." },
  { id: "steelCore",     level: 12, name: "🔩 STEEL CORE",       desc: "Completing all 5 daily missions grants +25% XP bonus." },
  { id: "shadowStep",    level: 15, name: "👁️ SHADOW STEP",      desc: "Running missions grant double Agility stat gains." },
  { id: "berserker",     level: 20, name: "🔥 BERSERKER MODE",   desc: "On max-streak days (7+), all XP gains +50%." },
];

const WEEK_PLAN = [
  { day: "Day 1 — Monday",   label: "ARISE",    missions: ["pushups","squats","plank"],          note: "Quest Accepted. Your journey begins.", bonus: "" },
  { day: "Day 2 — Tuesday",  label: "STRIDE",   missions: ["run","flex"],                        note: "Every step forges a stronger hunter.", bonus: "" },
  { day: "Day 3 — Wednesday",label: "POWER",    missions: ["pushups","squats","plank","flex"],   note: "4/5 missions = +10% XP. Push harder.", bonus: "+10% XP" },
  { day: "Day 4 — Thursday", label: "REST",     missions: [],                                    note: "Active Recovery day. Walk 10 min + stretch.", bonus: "SECOND WIND" },
  { day: "Day 5 — Friday",   label: "SURGE",    missions: ["pushups","run","plank"],             note: "3-day streak entering. Streak Bonus activates!", bonus: "🔥 Streak ×1.1" },
  { day: "Day 6 — Saturday", label: "FORGE",    missions: ["squats","flex","pushups","run"],     note: "Full-body activation. Feel the growth.", bonus: "+15% XP" },
  { day: "Day 7 — Sunday",   label: "BOSS",     missions: [],                                    note: "Shadow Golem awaits. Boss Battle Day.", bonus: "⚔️ +500 XP" },
];

// ── COMPONENTS ─────────────────────────────────────────────────────────────────

const Particle = ({ style }) => (
  <div className="particle" style={style} />
);

const SystemAlert = ({ msg, onClose }) => {
  useEffect(() => {
    const t = setTimeout(onClose, 2800);
    return () => clearTimeout(t);
  }, [msg]);
  if (!msg) return null;
  return (
    <div className="system-alert">
      <div className="alert-inner">
        <span className="alert-bracket">【</span>
        <span className="alert-text">{msg}</span>
        <span className="alert-bracket">】</span>
      </div>
    </div>
  );
};

const StatBar = ({ label, icon, value, max = 100, color }) => {
  const pct = Math.min((value / max) * 100, 100);
  return (
    <div className="stat-row">
      <div className="stat-label">
        <span className="stat-icon">{icon}</span>
        <span>{label}</span>
      </div>
      <div className="stat-bar-track">
        <div className="stat-bar-fill" style={{ width: `${pct}%`, background: color }} />
      </div>
      <span className="stat-value">{value}</span>
    </div>
  );
};

// ── MAIN APP ───────────────────────────────────────────────────────────────────

export default function App() {
  const [tab, setTab] = useState("status");
  const [alert, setAlert] = useState(null);
  const [particles, setParticles] = useState([]);

  const [player, setPlayer] = useState({
    name: "Hunter",
    level: 1,
    xp: 0,
    streak: 0,
    totalDays: 0,
    stats: { strength: 5, endurance: 5, agility: 5, discipline: 5, mentalFocus: 5 },
    unlockedSkills: [],
    titles: [],
    completedBosses: [],
  });

  const [dailyDone, setDailyDone] = useState({});
  const [bossProgress, setBossProgress] = useState({});

  const rank = getRank(player.level);
  const missions = DAILY_MISSIONS[rank.rank] || DAILY_MISSIONS.E;
  const xpNeeded = XP_PER_LEVEL(player.level);
  const xpPct = Math.min((player.xp / xpNeeded) * 100, 100);

  const triggerAlert = (msg) => setAlert(msg);

  const spawnParticles = () => {
    const ps = Array.from({ length: 18 }, (_, i) => ({
      id: i,
      left: `${Math.random() * 100}%`,
      animDelay: `${Math.random() * 1.2}s`,
      size: `${4 + Math.random() * 6}px`,
      color: rank.color,
    }));
    setParticles(ps);
    setTimeout(() => setParticles([]), 2000);
  };

  const completeQuest = (missionId) => {
    if (dailyDone[missionId]) return;
    const mission = missions.find(m => m.id === missionId);
    if (!mission) return;

    const allDone = missions.filter(m => m.id !== missionId).every(m => dailyDone[m.id]);
    const bonus = allDone ? 1.25 : 1;
    const gainedXP = Math.floor(mission.xp * bonus);

    setDailyDone(prev => ({ ...prev, [missionId]: true }));

    setPlayer(prev => {
      let newXP = prev.xp + gainedXP;
      let newLevel = prev.level;
      let needed = XP_PER_LEVEL(newLevel);
      let leveledUp = false;

      while (newXP >= needed) {
        newXP -= needed;
        newLevel++;
        needed = XP_PER_LEVEL(newLevel);
        leveledUp = true;
      }

      const newStats = { ...prev.stats };
      newStats[mission.stat] = Math.min(newStats[mission.stat] + mission.statGain, 999);

      const newSkills = [...prev.unlockedSkills];
      SKILLS.forEach(s => {
        if (newLevel >= s.level && !newSkills.includes(s.id)) {
          newSkills.push(s.id);
          setTimeout(() => triggerAlert(`✨ NEW SKILL UNLOCKED — ${s.name}`), 600);
        }
      });

      if (leveledUp) {
        setTimeout(() => { triggerAlert(`⚡ LEVEL UP — You are now Level ${newLevel}!`); spawnParticles(); }, 200);
      } else {
        triggerAlert(`✅ QUEST COMPLETE — +${gainedXP} XP · ${mission.stat.toUpperCase()} +${mission.statGain}`);
      }

      return { ...prev, xp: newXP, level: newLevel, stats: newStats, unlockedSkills: newSkills };
    });
  };

  const completeBossTask = (bossIdx, taskIdx) => {
    const key = `${bossIdx}-${taskIdx}`;
    if (bossProgress[key]) return;
    setBossProgress(prev => ({ ...prev, [key]: true }));
    const boss = BOSS_BATTLES[bossIdx];
    const allDone = boss.tasks.every((_, i) => i === taskIdx || bossProgress[`${bossIdx}-${i}`]);
    if (allDone) {
      setPlayer(prev => {
        const newXP = prev.xp + boss.xpReward;
        return { ...prev, xp: newXP, completedBosses: [...prev.completedBosses, bossIdx] };
      });
      setTimeout(() => triggerAlert(`🏆 BOSS DEFEATED — ${boss.name} — ${boss.xpReward} XP EARNED`), 400);
      spawnParticles();
    }
  };

  const editName = () => {
    const n = prompt("Enter your Hunter name:", player.name);
    if (n && n.trim()) setPlayer(prev => ({ ...prev, name: n.trim() }));
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Rajdhani:wght@400;500;600;700&family=Orbitron:wght@400;700;900&family=Share+Tech+Mono&display=swap');

        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        :root {
          --bg: #03050f;
          --bg2: #060d1e;
          --panel: rgba(6,16,38,0.85);
          --border: rgba(99,179,237,0.18);
          --blue: #4fc3f7;
          --blue2: #0ea5e9;
          --purple: #a78bfa;
          --gold: #fbbf24;
          --red: #f87171;
          --green: #34d399;
          --text: #e2e8f0;
          --muted: #64748b;
          --rank-color: ${rank.color};
          --rank-glow: ${rank.glow};
        }

        body { background: var(--bg); color: var(--text); font-family: 'Rajdhani', sans-serif; min-height: 100vh; }

        .app {
          max-width: 480px;
          margin: 0 auto;
          min-height: 100vh;
          display: flex;
          flex-direction: column;
          position: relative;
          overflow: hidden;
        }

        /* BACKGROUND */
        .bg-grid {
          position: fixed; inset: 0; pointer-events: none; z-index: 0;
          background:
            linear-gradient(rgba(79,195,247,0.03) 1px, transparent 1px),
            linear-gradient(90deg, rgba(79,195,247,0.03) 1px, transparent 1px);
          background-size: 40px 40px;
        }
        .bg-vignette {
          position: fixed; inset: 0; pointer-events: none; z-index: 1;
          background: radial-gradient(ellipse at center, transparent 40%, #03050f 100%);
        }
        .bg-glow {
          position: fixed; top: -120px; left: 50%; transform: translateX(-50%);
          width: 400px; height: 300px; border-radius: 50%;
          background: radial-gradient(circle, ${rank.glow}22 0%, transparent 70%);
          pointer-events: none; z-index: 0;
          transition: background 1s;
        }

        /* PARTICLES */
        .particle {
          position: fixed; border-radius: 50%; pointer-events: none; z-index: 200;
          animation: particleRise 2s ease-out forwards;
        }
        @keyframes particleRise {
          0% { transform: translateY(80vh) scale(0); opacity: 1; }
          100% { transform: translateY(-10vh) scale(1.5); opacity: 0; }
        }

        /* ALERT */
        .system-alert {
          position: fixed; top: 0; left: 50%; transform: translateX(-50%);
          z-index: 300; padding: 14px 0; pointer-events: none;
          animation: alertDrop 0.35s cubic-bezier(.34,1.56,.64,1) both;
          width: 100%;
        }
        @keyframes alertDrop {
          from { transform: translateX(-50%) translateY(-40px); opacity: 0; }
          to   { transform: translateX(-50%) translateY(0); opacity: 1; }
        }
        .alert-inner {
          background: linear-gradient(135deg, rgba(6,16,38,0.97), rgba(10,25,60,0.97));
          border: 1px solid var(--rank-color);
          box-shadow: 0 0 24px ${rank.glow}66, inset 0 0 20px rgba(0,0,0,0.5);
          padding: 10px 24px;
          font-family: 'Orbitron', sans-serif;
          font-size: 0.7rem;
          font-weight: 700;
          letter-spacing: 0.12em;
          color: var(--rank-color);
          text-align: center;
          margin: 0 12px;
          border-radius: 2px;
          clip-path: polygon(8px 0%, 100% 0%, calc(100% - 8px) 100%, 0% 100%);
        }
        .alert-bracket { opacity: 0.5; }

        /* HEADER */
        .header {
          position: relative; z-index: 10;
          padding: 16px 16px 0;
        }
        .header-top {
          display: flex; justify-content: space-between; align-items: flex-start;
          margin-bottom: 12px;
        }
        .player-id {
          font-family: 'Share Tech Mono', monospace;
          font-size: 0.65rem;
          color: var(--muted);
          letter-spacing: 0.1em;
          margin-bottom: 2px;
        }
        .player-name {
          font-family: 'Orbitron', sans-serif;
          font-size: 1.2rem;
          font-weight: 900;
          color: var(--text);
          cursor: pointer;
          display: flex; align-items: center; gap: 6px;
        }
        .player-name:hover { color: var(--blue); }
        .name-edit { font-size: 0.65rem; color: var(--muted); }

        .rank-badge {
          display: flex; flex-direction: column; align-items: center;
          background: rgba(0,0,0,0.4);
          border: 1px solid var(--rank-color);
          border-radius: 4px;
          padding: 6px 14px;
          box-shadow: 0 0 16px ${rank.glow}44;
          animation: pulseBadge 2.5s ease-in-out infinite;
        }
        @keyframes pulseBadge {
          0%, 100% { box-shadow: 0 0 12px ${rank.glow}44; }
          50%       { box-shadow: 0 0 28px ${rank.glow}88; }
        }
        .rank-letter {
          font-family: 'Orbitron', sans-serif;
          font-size: 1.6rem; font-weight: 900;
          color: var(--rank-color);
          line-height: 1;
        }
        .rank-label {
          font-size: 0.55rem; color: var(--muted);
          letter-spacing: 0.15em; font-family: 'Share Tech Mono', monospace;
        }

        .level-line {
          display: flex; align-items: center; justify-content: space-between;
          margin-bottom: 6px;
        }
        .level-num {
          font-family: 'Orbitron', sans-serif;
          font-size: 0.7rem; font-weight: 700;
          color: var(--blue);
          letter-spacing: 0.1em;
        }
        .xp-label {
          font-family: 'Share Tech Mono', monospace;
          font-size: 0.6rem; color: var(--muted);
        }

        .xp-track {
          height: 6px; background: rgba(255,255,255,0.06);
          border-radius: 3px; overflow: hidden;
          border: 1px solid rgba(255,255,255,0.06);
          position: relative;
        }
        .xp-fill {
          height: 100%;
          background: linear-gradient(90deg, var(--blue2), var(--rank-color));
          border-radius: 3px;
          transition: width 0.6s cubic-bezier(.34,1.56,.64,1);
          box-shadow: 0 0 10px ${rank.glow}88;
          position: relative;
        }
        .xp-fill::after {
          content: '';
          position: absolute; right: 0; top: 0; bottom: 0; width: 4px;
          background: white; opacity: 0.6; border-radius: 2px;
          animation: xpPulse 1.2s ease-in-out infinite;
        }
        @keyframes xpPulse { 0%,100%{opacity:0.3} 50%{opacity:0.9} }

        .streak-row {
          display: flex; align-items: center; gap: 8px;
          margin-top: 10px;
          font-family: 'Share Tech Mono', monospace;
          font-size: 0.6rem; color: var(--muted);
        }
        .streak-fire { font-size: 0.9rem; }
        .streak-count { color: var(--gold); font-weight: bold; font-size: 0.75rem; }

        /* NAV */
        .nav {
          display: flex; position: relative; z-index: 10;
          padding: 10px 16px 0;
          gap: 4px;
        }
        .nav-btn {
          flex: 1; padding: 8px 4px;
          background: transparent;
          border: 1px solid rgba(255,255,255,0.06);
          border-bottom: none;
          color: var(--muted);
          font-family: 'Orbitron', sans-serif;
          font-size: 0.52rem;
          letter-spacing: 0.08em;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.2s;
          border-radius: 4px 4px 0 0;
          clip-path: polygon(6px 0%, 100% 0%, calc(100% - 6px) 100%, 0% 100%);
        }
        .nav-btn:hover { color: var(--text); background: rgba(255,255,255,0.04); }
        .nav-btn.active {
          background: var(--panel);
          border-color: var(--rank-color);
          color: var(--rank-color);
          box-shadow: 0 0 12px ${rank.glow}44;
        }

        /* CONTENT */
        .content {
          position: relative; z-index: 10;
          flex: 1;
          margin: 0 16px 16px;
          background: var(--panel);
          border: 1px solid var(--border);
          border-radius: 0 0 8px 8px;
          padding: 16px;
          backdrop-filter: blur(12px);
          overflow-y: auto;
        }

        /* SECTION TITLES */
        .section-title {
          font-family: 'Orbitron', sans-serif;
          font-size: 0.62rem;
          font-weight: 700;
          letter-spacing: 0.18em;
          color: var(--muted);
          margin-bottom: 12px;
          display: flex; align-items: center; gap: 8px;
        }
        .section-title::after {
          content: ''; flex: 1; height: 1px;
          background: linear-gradient(90deg, var(--border), transparent);
        }

        /* STATS */
        .stats-grid { display: flex; flex-direction: column; gap: 8px; }
        .stat-row {
          display: flex; align-items: center; gap: 8px;
        }
        .stat-label {
          display: flex; align-items: center; gap: 5px;
          font-family: 'Share Tech Mono', monospace;
          font-size: 0.6rem; color: var(--muted);
          width: 100px; flex-shrink: 0;
        }
        .stat-icon { font-size: 0.9rem; }
        .stat-bar-track {
          flex: 1; height: 5px;
          background: rgba(255,255,255,0.05);
          border-radius: 3px; overflow: hidden;
        }
        .stat-bar-fill {
          height: 100%; border-radius: 3px;
          transition: width 0.5s ease;
        }
        .stat-value {
          font-family: 'Share Tech Mono', monospace;
          font-size: 0.65rem; color: var(--text);
          width: 28px; text-align: right;
        }

        /* MISSIONS */
        .mission-card {
          background: rgba(255,255,255,0.03);
          border: 1px solid var(--border);
          border-radius: 6px;
          padding: 12px 14px;
          margin-bottom: 8px;
          display: flex; align-items: center; gap: 12px;
          cursor: pointer;
          transition: all 0.25s;
          position: relative;
          overflow: hidden;
        }
        .mission-card::before {
          content: '';
          position: absolute; left: 0; top: 0; bottom: 0; width: 3px;
          background: var(--rank-color);
          opacity: 0;
          transition: opacity 0.2s;
        }
        .mission-card:hover { border-color: var(--rank-color); }
        .mission-card:hover::before { opacity: 1; }
        .mission-card.done {
          opacity: 0.5;
          border-color: rgba(52,211,153,0.3);
          cursor: default;
        }
        .mission-card.done::before { opacity: 1; background: var(--green); }
        .mission-icon { font-size: 1.6rem; }
        .mission-info { flex: 1; }
        .mission-name {
          font-family: 'Rajdhani', sans-serif;
          font-size: 0.85rem; font-weight: 600;
          color: var(--text); margin-bottom: 2px;
        }
        .mission-desc {
          font-family: 'Share Tech Mono', monospace;
          font-size: 0.6rem; color: var(--muted);
        }
        .mission-xp {
          font-family: 'Orbitron', sans-serif;
          font-size: 0.65rem; font-weight: 700;
          color: var(--gold);
        }
        .mission-done-badge {
          font-size: 1rem;
        }

        /* BOSS */
        .boss-card {
          background: linear-gradient(135deg, rgba(239,68,68,0.05), rgba(0,0,0,0.3));
          border: 1px solid rgba(239,68,68,0.3);
          border-radius: 8px;
          padding: 16px;
          margin-bottom: 12px;
        }
        .boss-name {
          font-family: 'Orbitron', sans-serif;
          font-size: 0.85rem; font-weight: 900;
          color: var(--red);
          margin-bottom: 4px;
        }
        .boss-desc {
          font-size: 0.75rem; color: var(--muted);
          font-style: italic; margin-bottom: 12px;
          font-family: 'Rajdhani', sans-serif;
        }
        .boss-task {
          display: flex; align-items: center; gap: 10px;
          padding: 8px 10px;
          border-radius: 4px;
          margin-bottom: 6px;
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(255,255,255,0.06);
          cursor: pointer;
          transition: all 0.2s;
          font-size: 0.75rem;
        }
        .boss-task:hover { border-color: var(--red); }
        .boss-task.done { opacity: 0.4; cursor: default; }
        .boss-reward {
          margin-top: 10px;
          padding: 8px 10px;
          background: rgba(251,191,36,0.07);
          border: 1px dashed rgba(251,191,36,0.3);
          border-radius: 4px;
          font-size: 0.7rem; color: var(--gold);
          font-family: 'Share Tech Mono', monospace;
        }

        /* SKILLS */
        .skill-card {
          background: rgba(167,139,250,0.05);
          border: 1px solid rgba(167,139,250,0.2);
          border-radius: 6px;
          padding: 12px 14px;
          margin-bottom: 8px;
          display: flex; gap: 12px; align-items: flex-start;
          transition: all 0.2s;
        }
        .skill-card.locked { opacity: 0.35; filter: grayscale(1); }
        .skill-card:not(.locked) {
          border-color: rgba(167,139,250,0.5);
          box-shadow: 0 0 10px rgba(167,139,250,0.12);
        }
        .skill-name {
          font-family: 'Orbitron', sans-serif;
          font-size: 0.68rem; font-weight: 700;
          color: var(--purple); margin-bottom: 3px;
        }
        .skill-desc { font-size: 0.7rem; color: var(--muted); line-height: 1.4; }
        .skill-req {
          font-family: 'Share Tech Mono', monospace;
          font-size: 0.55rem; color: var(--muted);
          margin-top: 4px;
        }

        /* WEEK */
        .week-day {
          border: 1px solid var(--border);
          border-radius: 6px;
          margin-bottom: 8px;
          overflow: hidden;
        }
        .week-day-header {
          display: flex; align-items: center; justify-content: space-between;
          padding: 10px 14px;
          background: rgba(255,255,255,0.03);
          border-bottom: 1px solid var(--border);
        }
        .week-day-label {
          font-family: 'Orbitron', sans-serif;
          font-size: 0.55rem; font-weight: 700;
          color: var(--rank-color); letter-spacing: 0.15em;
        }
        .week-day-name {
          font-family: 'Share Tech Mono', monospace;
          font-size: 0.6rem; color: var(--muted);
        }
        .week-day-bonus {
          font-family: 'Share Tech Mono', monospace;
          font-size: 0.55rem; color: var(--gold);
        }
        .week-day-body { padding: 10px 14px; }
        .week-missions {
          display: flex; flex-wrap: wrap; gap: 6px; margin-bottom: 6px;
        }
        .week-pill {
          font-family: 'Share Tech Mono', monospace;
          font-size: 0.58rem;
          padding: 2px 8px;
          border-radius: 12px;
          background: rgba(79,195,247,0.1);
          border: 1px solid rgba(79,195,247,0.2);
          color: var(--blue);
        }
        .week-note { font-size: 0.7rem; color: var(--muted); font-style: italic; }

        /* SYSTEM INFO */
        .info-block {
          background: rgba(255,255,255,0.02);
          border: 1px solid var(--border);
          border-radius: 6px;
          padding: 14px;
          margin-bottom: 12px;
        }
        .info-title {
          font-family: 'Orbitron', sans-serif;
          font-size: 0.62rem; font-weight: 700;
          color: var(--blue); margin-bottom: 8px;
          letter-spacing: 0.12em;
        }
        .info-row {
          display: flex; justify-content: space-between; align-items: center;
          padding: 5px 0;
          border-bottom: 1px solid rgba(255,255,255,0.04);
          font-size: 0.72rem;
        }
        .info-row:last-child { border-bottom: none; }
        .info-key { color: var(--muted); font-family: 'Share Tech Mono', monospace; font-size: 0.6rem; }
        .info-val { color: var(--text); font-weight: 600; }
        .info-val.gold { color: var(--gold); }
        .info-val.green { color: var(--green); }

        .quote-block {
          text-align: center;
          padding: 14px;
          margin-bottom: 12px;
          border: 1px solid rgba(255,255,255,0.05);
          border-radius: 6px;
          background: linear-gradient(135deg, rgba(79,195,247,0.03), rgba(167,139,250,0.03));
        }
        .quote-text {
          font-family: 'Rajdhani', sans-serif;
          font-size: 0.85rem;
          font-style: italic;
          color: var(--muted);
          line-height: 1.5;
        }
        .quote-author {
          font-family: 'Share Tech Mono', monospace;
          font-size: 0.55rem; color: var(--rank-color);
          margin-top: 6px; letter-spacing: 0.1em;
        }

        .rank-table { width: 100%; border-collapse: collapse; font-size: 0.7rem; }
        .rank-table th {
          font-family: 'Share Tech Mono', monospace;
          font-size: 0.55rem; color: var(--muted);
          letter-spacing: 0.1em;
          padding: 4px 8px;
          border-bottom: 1px solid var(--border);
          text-align: left;
        }
        .rank-table td { padding: 6px 8px; border-bottom: 1px solid rgba(255,255,255,0.04); }
        .rank-table tr:last-child td { border-bottom: none; }

        .penalty-box {
          background: rgba(239,68,68,0.05);
          border: 1px solid rgba(239,68,68,0.2);
          border-radius: 6px;
          padding: 12px 14px;
          font-size: 0.72rem; color: var(--muted);
          line-height: 1.6;
        }
        .penalty-box strong { color: var(--red); }

        /* SCROLL */
        .content::-webkit-scrollbar { width: 4px; }
        .content::-webkit-scrollbar-track { background: transparent; }
        .content::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 2px; }

        /* DIVIDER */
        .divider { height: 1px; background: var(--border); margin: 14px 0; }
      `}</style>

      <div className="app">
        <div className="bg-grid" />
        <div className="bg-vignette" />
        <div className="bg-glow" />

        {particles.map(p => (
          <Particle key={p.id} style={{
            left: p.left, bottom: "0",
            width: p.size, height: p.size,
            background: p.color,
            animationDelay: p.animDelay,
            boxShadow: `0 0 8px ${p.color}`,
          }} />
        ))}

        <SystemAlert msg={alert} onClose={() => setAlert(null)} />

        {/* HEADER */}
        <div className="header">
          <div className="header-top">
            <div>
              <div className="player-id">// HUNTER PROFILE SYSTEM v3.7</div>
              <div className="player-name" onClick={editName}>
                {player.name} <span className="name-edit">✏</span>
              </div>
            </div>
            <div className="rank-badge">
              <div className="rank-letter">{rank.rank}</div>
              <div className="rank-label">RANK</div>
            </div>
          </div>

          <div className="level-line">
            <span className="level-num">LV. {player.level}</span>
            <span className="xp-label">{player.xp} / {xpNeeded} XP</span>
          </div>
          <div className="xp-track">
            <div className="xp-fill" style={{ width: `${xpPct}%` }} />
          </div>

          <div className="streak-row">
            <span className="streak-fire">🔥</span>
            <span>STREAK:</span>
            <span className="streak-count">{player.streak} DAYS</span>
            <span style={{ marginLeft: "auto" }}>
              SKILLS: {player.unlockedSkills.length}/{SKILLS.length}
            </span>
          </div>
        </div>

        {/* NAV */}
        <div className="nav">
          {[
            { id: "status",   label: "STATUS" },
            { id: "quests",   label: "QUESTS" },
            { id: "boss",     label: "BOSS" },
            { id: "skills",   label: "SKILLS" },
            { id: "week",     label: "WEEK" },
            { id: "system",   label: "SYSTEM" },
          ].map(t => (
            <button
              key={t.id}
              className={`nav-btn ${tab === t.id ? "active" : ""}`}
              onClick={() => setTab(t.id)}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* CONTENT */}
        <div className="content">

          {/* STATUS */}
          {tab === "status" && (
            <>
              <div className="quote-block">
                <div className="quote-text">
                  "I alone am the exception. The system has chosen me.<br />
                  Every rep. Every step. Every breath — brings me closer to the summit."
                </div>
                <div className="quote-author">— THE SYSTEM</div>
              </div>

              <div className="section-title">PLAYER STATS</div>
              <div className="stats-grid">
                <StatBar label="STRENGTH"    icon="💪" value={player.stats.strength}    color="#f87171" />
                <StatBar label="ENDURANCE"   icon="❤️" value={player.stats.endurance}   color="#fb923c" />
                <StatBar label="AGILITY"     icon="⚡" value={player.stats.agility}     color="#34d399" />
                <StatBar label="DISCIPLINE"  icon="🔩" value={player.stats.discipline}  color="#a78bfa" />
                <StatBar label="MENTAL FOCUS" icon="🧠" value={player.stats.mentalFocus} color="#4fc3f7" />
              </div>

              <div className="divider" />
              <div className="section-title">RANK PROGRESSION</div>
              <table className="rank-table">
                <thead>
                  <tr>
                    <th>RANK</th>
                    <th>LEVELS</th>
                    <th>STATUS</th>
                  </tr>
                </thead>
                <tbody>
                  {RANKS.map(r => (
                    <tr key={r.rank}>
                      <td style={{ color: r.color, fontFamily: "'Orbitron', sans-serif", fontWeight: 700, fontSize: "0.75rem" }}>{r.rank}-RANK</td>
                      <td style={{ color: "#94a3b8", fontFamily: "'Share Tech Mono', monospace", fontSize: "0.62rem" }}>Lv {r.minLevel}–{r.maxLevel}</td>
                      <td>
                        {player.level >= r.minLevel
                          ? <span style={{ color: "#34d399", fontSize: "0.65rem" }}>✓ {player.level <= r.maxLevel ? "CURRENT" : "CLEARED"}</span>
                          : <span style={{ color: "#475569", fontSize: "0.65rem" }}>LOCKED</span>
                        }
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </>
          )}

          {/* QUESTS */}
          {tab === "quests" && (
            <>
              <div className="section-title">DAILY MISSIONS — {rank.rank}-RANK</div>
              {missions.map(m => (
                <div
                  key={m.id}
                  className={`mission-card ${dailyDone[m.id] ? "done" : ""}`}
                  onClick={() => completeQuest(m.id)}
                >
                  <div className="mission-icon">{m.icon}</div>
                  <div className="mission-info">
                    <div className="mission-name">{m.name}</div>
                    <div className="mission-desc">{m.desc} · +{m.statGain} {m.stat.toUpperCase()}</div>
                  </div>
                  <div>
                    {dailyDone[m.id]
                      ? <span className="mission-done-badge">✅</span>
                      : <div className="mission-xp">+{m.xp} XP</div>
                    }
                  </div>
                </div>
              ))}
              <div style={{ fontSize: "0.65rem", color: "var(--muted)", textAlign: "center", fontFamily: "'Share Tech Mono', monospace", marginTop: "8px" }}>
                Complete all 5 missions → +25% XP BONUS
              </div>
              <div className="divider" />
              <div className="penalty-box">
                <strong>⚠ SYSTEM WARNING:</strong> Skipping a mission resets your daily streak.
                Two consecutive skip days: <strong>-5% Stat</strong> on lowest stat.
                Three days: Rank demotion risk activates.
                The system does not forgive laziness.
              </div>
            </>
          )}

          {/* BOSS */}
          {tab === "boss" && (
            <>
              <div className="section-title">WEEKLY BOSS BATTLES</div>
              {BOSS_BATTLES.map((boss, bi) => (
                <div key={bi} className="boss-card">
                  <div className="boss-name">⚔ {boss.name}</div>
                  <div className="boss-desc">"{boss.desc}"</div>
                  {boss.tasks.map((task, ti) => {
                    const key = `${bi}-${ti}`;
                    return (
                      <div
                        key={ti}
                        className={`boss-task ${bossProgress[key] ? "done" : ""}`}
                        onClick={() => completeBossTask(bi, ti)}
                      >
                        <span>{task.icon}</span>
                        <span style={{ flex: 1 }}>{task.text}</span>
                        {bossProgress[key] && <span>✅</span>}
                      </div>
                    );
                  })}
                  <div className="boss-reward">
                    🏆 CLEAR REWARD: {boss.reward}
                    <br />
                    <span style={{ color: "#fbbf24" }}>+{boss.xpReward} XP</span>
                  </div>
                </div>
              ))}
            </>
          )}

          {/* SKILLS */}
          {tab === "skills" && (
            <>
              <div className="section-title">SKILL TREE</div>
              {SKILLS.map(s => {
                const unlocked = player.unlockedSkills.includes(s.id);
                return (
                  <div key={s.id} className={`skill-card ${unlocked ? "" : "locked"}`}>
                    <div style={{ fontSize: "1.4rem", flexShrink: 0, marginTop: "2px" }}>
                      {unlocked ? "✨" : "🔒"}
                    </div>
                    <div>
                      <div className="skill-name">{s.name}</div>
                      <div className="skill-desc">{s.desc}</div>
                      <div className="skill-req">UNLOCK AT: LV. {s.level}</div>
                    </div>
                  </div>
                );
              })}
            </>
          )}

          {/* WEEK PLAN */}
          {tab === "week" && (
            <>
              <div className="section-title">WEEK 1 — E-RANK TRAINING ARC</div>
              {WEEK_PLAN.map((day, i) => (
                <div key={i} className="week-day">
                  <div className="week-day-header">
                    <div>
                      <div className="week-day-label">{day.label}</div>
                      <div className="week-day-name">{day.day}</div>
                    </div>
                    {day.bonus && <div className="week-day-bonus">{day.bonus}</div>}
                  </div>
                  <div className="week-day-body">
                    {day.missions.length > 0 && (
                      <div className="week-missions">
                        {day.missions.map(mid => {
                          const m = DAILY_MISSIONS.E.find(x => x.id === mid);
                          return m ? (
                            <span key={mid} className="week-pill">{m.icon} {m.id}</span>
                          ) : null;
                        })}
                      </div>
                    )}
                    <div className="week-note">{day.note}</div>
                  </div>
                </div>
              ))}
            </>
          )}

          {/* SYSTEM */}
          {tab === "system" && (
            <>
              <div className="section-title">XP SYSTEM CODEX</div>
              <div className="info-block">
                <div className="info-title">HOW XP WORKS</div>
                {[
                  ["Single mission", "+20–80 XP"],
                  ["All 5 missions", "+25% bonus"],
                  ["7-day streak", "+50% all XP (Berserker)"],
                  ["Boss Battle", "+500–1000 XP"],
                  ["Perfect week", "+200 XP bonus"],
                ].map(([k, v]) => (
                  <div key={k} className="info-row">
                    <span className="info-key">{k}</span>
                    <span className="info-val gold">{v}</span>
                  </div>
                ))}
              </div>

              <div className="info-block">
                <div className="info-title">STAT PROGRESSION</div>
                {[
                  ["Push-ups",    "STRENGTH +1/rep"],
                  ["Squats",      "ENDURANCE +1/rep"],
                  ["Plank",       "DISCIPLINE +1/session"],
                  ["Run/Cardio",  "AGILITY +1/session"],
                  ["Flexibility", "MENTAL FOCUS +1/session"],
                ].map(([k, v]) => (
                  <div key={k} className="info-row">
                    <span className="info-key">{k}</span>
                    <span className="info-val green">{v}</span>
                  </div>
                ))}
              </div>

              <div className="info-block">
                <div className="info-title">RANK UNLOCK CRITERIA</div>
                {[
                  ["D-Rank", "Reach Lv.10 + Boss Clear"],
                  ["C-Rank", "Reach Lv.20 + 30-day streak"],
                  ["B-Rank", "Reach Lv.35 + All C-skills"],
                  ["A-Rank", "Reach Lv.50 + Boss S-Clear"],
                  ["S-Rank", "Reach Lv.75 + Discipline ≥80"],
                ].map(([k, v]) => (
                  <div key={k} className="info-row">
                    <span className="info-key">{k}</span>
                    <span className="info-val">{v}</span>
                  </div>
                ))}
              </div>

              <div className="quote-block">
                <div className="quote-text">
                  "The system will test you. It will push you to your limits.<br/>
                  But it was designed for one purpose only:<br/>
                  to make you unstoppable."
                </div>
                <div className="quote-author">— SYSTEM NOTIFICATION</div>
              </div>
            </>
          )}

        </div>
      </div>
    </>
  );
}
