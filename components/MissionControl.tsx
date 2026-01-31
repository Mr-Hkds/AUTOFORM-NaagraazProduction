import React, { useEffect, useRef, useState } from 'react';
import { Activity, Terminal, Shield, Zap, CheckCircle, Clock, Disc, Cpu, AlertCircle, Settings, Crown, ChevronRight, Globe } from 'lucide-react';

interface MissionLog {
    msg: string;
    status: string;
    count: number;
    timestamp: number;
}

interface MissionControlProps {
    logs: MissionLog[];
    targetCount: number;
    initialTokens: number;
    onAbort: () => void;
    onBackToConfig: () => void;
    onNewMission: () => void;
    formTitle: string;
    onShowPricing?: () => void;
    onTokenUpdate?: (val: number) => void;
}

const MissionControl: React.FC<MissionControlProps> = ({ logs, targetCount, initialTokens, onAbort, onBackToConfig, onNewMission, formTitle, onShowPricing, onTokenUpdate }) => {
    const [elapsedTime, setElapsedTime] = useState(0);
    const [tokenPhase, setTokenPhase] = useState<'IDLE' | 'REDUCING' | 'DONE'>('IDLE');
    const [displayedTokens, setDisplayedTokens] = useState(initialTokens);
    const [isTicking, setIsTicking] = useState(false);
    const [isAborting, setIsAborting] = useState(false);

    const startTokensRef = useRef(initialTokens);
    const containerRef = useRef<HTMLDivElement>(null);
    const logContainerRef = useRef<HTMLDivElement>(null);
    const completionRef = useRef<HTMLDivElement>(null);
    const abortRef = useRef<HTMLDivElement>(null);

    const currentCount = logs.length > 0 ? logs[logs.length - 1].count : 0;
    const currentStatus = logs.length > 0 ? logs[logs.length - 1].status : 'INITIALIZING';
    const progress = (currentCount / targetCount) * 100;

    // Scroll to top on mount
    useEffect(() => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }, []);

    const handleAbortClick = () => {
        setIsAborting(true);
        onAbort();
    };

    // Timer logic
    useEffect(() => {
        if (currentStatus === 'DONE' || currentStatus === 'ERROR' || currentStatus === 'ABORTED') return;
        const start = Date.now() - (elapsedTime * 1000);
        const interval = setInterval(() => {
            setElapsedTime(Math.floor((Date.now() - start) / 1000));
        }, 1000);
        return () => clearInterval(interval);
    }, [currentStatus]);

    // Auto-scroll logs
    useEffect(() => {
        if (logContainerRef.current) {
            logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
        }
    }, [logs]);

    // PRECISE FOCUS SHIFT: Handle smooth centering on completion or abort
    useEffect(() => {
        const target = tokenPhase === 'DONE' ? completionRef.current : (currentStatus === 'ABORTED' ? abortRef.current : null);
        if (target) {
            setTimeout(() => {
                target.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }, 300);
        }
    }, [tokenPhase, currentStatus]);

    // Trigger Reduction Phase
    useEffect(() => {
        if (currentStatus === 'DONE' && tokenPhase === 'IDLE') {
            setTokenPhase('REDUCING');
        }
    }, [currentStatus, tokenPhase]);

    // Token Reduction Animation
    useEffect(() => {
        if (tokenPhase === 'REDUCING') {
            const startDelay = setTimeout(() => {
                const startValue = startTokensRef.current;
                const endValue = startValue - currentCount;
                const duration = 2000;
                const startTime = Date.now();
                let lastValue = startValue;

                const animate = () => {
                    const now = Date.now();
                    const timeProgress = Math.min((now - startTime) / duration, 1);
                    const easeOut = 1 - Math.pow(1 - timeProgress, 3); // Cubic ease out
                    const current = Math.floor(startValue - (currentCount * easeOut));

                    if (current !== lastValue) {
                        setDisplayedTokens(current);
                        if (onTokenUpdate) onTokenUpdate(current);
                        setIsTicking(true);
                        setTimeout(() => setIsTicking(false), 50);
                        lastValue = current;
                    }

                    if (timeProgress < 1) requestAnimationFrame(animate);
                    else {
                        setDisplayedTokens(endValue);
                        setTimeout(() => setTokenPhase('DONE'), 800);
                    }
                };
                requestAnimationFrame(animate);
            }, 1000);
            return () => clearTimeout(startDelay);
        }
    }, [tokenPhase, currentCount, onTokenUpdate]);

    const formatTime = (s: number) => {
        const mins = Math.floor(s / 60);
        const secs = s % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    return (
        <div ref={containerRef} className="w-full max-w-6xl mx-auto space-y-10 animate-fade-in-up pb-20">
            {/* --- HUD HEADER (THE COCKPIT) --- */}
            <div className={`relative group p-[1px] rounded-[2rem] overflow-hidden transition-all duration-1000 ${currentStatus === 'ABORTED' ? 'opacity-40 grayscale' : 'shadow-[0_0_50px_rgba(245,158,11,0.05)]'}`}>
                <div className="absolute inset-0 bg-gradient-to-r from-amber-500/20 via-slate-500/10 to-amber-500/20 animate-shimmer-flow" />
                <div className="relative bg-[#020617]/90 backdrop-blur-3xl rounded-[2rem] p-8 md:p-10 flex flex-col md:flex-row items-center justify-between gap-10">
                    <div className="flex items-center gap-8">
                        {/* Status Orb & Progress */}
                        <div className="relative h-28 w-28 flex items-center justify-center">
                            <svg className="w-full h-full transform -rotate-90">
                                <circle cx="56" cy="56" r="50" stroke="currentColor" strokeWidth="2" fill="transparent" className="text-white/5" />
                                <circle
                                    cx="56" cy="56" r="50" stroke="currentColor" strokeWidth="3" fill="transparent"
                                    strokeDasharray={314} strokeDashoffset={314 - (314 * progress) / 100}
                                    className={`${currentStatus === 'DONE' ? 'text-emerald-500' : currentStatus === 'ABORTED' ? 'text-red-500' : 'text-amber-500 shadow-[0_0_15px_#f59e0b]'} transition-all duration-1000 ease-out`}
                                    strokeLinecap="round"
                                />
                            </svg>
                            <div className="absolute inset-0 flex flex-col items-center justify-center">
                                <span className="text-2xl font-mono font-black text-white">{Math.round(progress)}%</span>
                                <span className="text-[9px] text-slate-500 font-bold uppercase tracking-widest">Load</span>
                            </div>
                        </div>

                        <div className="space-y-3">
                            <div className="flex items-center gap-3">
                                <div className={`px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-[0.2em] flex items-center gap-1.5 border
                                    ${currentStatus === 'DONE' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' :
                                        currentStatus === 'ABORTED' ? 'bg-red-500/10 text-red-500 border-red-500/20' :
                                            'bg-amber-500/10 text-amber-500 border-amber-500/20 animate-pulse'}`}>
                                    <div className={`w-1.5 h-1.5 rounded-full ${currentStatus === 'DONE' ? 'bg-emerald-500' : currentStatus === 'ABORTED' ? 'bg-red-500' : 'bg-amber-500 shadow-[0_0_8px_#f59e0b]'}`} />
                                    {currentStatus === 'DONE' ? 'Mission Secured' : currentStatus === 'ABORTED' ? 'Safety Terminated' : 'Thread Active'}
                                </div>
                                <span className="text-[10px] text-slate-500 font-mono tracking-tighter opacity-50">KV4-OS.PRIME</span>
                            </div>
                            <h2 className="text-3xl md:text-4xl font-serif font-black text-white tracking-tight leading-none group-hover:text-amber-100 transition-colors">{formTitle}</h2>
                            <div className="flex items-center gap-4 text-slate-500 font-mono text-[10px]">
                                <span className="flex items-center gap-1.5"><Globe className="w-3 h-3" /> Global Relay</span>
                                <span className="w-1 h-1 bg-white/10 rounded-full" />
                                <span className="flex items-center gap-1.5"><Shield className="w-3 h-3 text-emerald-500/50" /> End-to-End Encryption</span>
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-col items-end gap-6 border-l border-white/5 pl-10">
                        <div className="text-right">
                            <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest mb-1">Time on Wing</p>
                            <div className="text-3xl font-mono font-black text-white tabular-nums flex items-center gap-3">
                                <Clock className="w-6 h-6 text-amber-500/30" />
                                {formatTime(elapsedTime)}
                            </div>
                        </div>

                        <div className="flex gap-4">
                            {currentStatus === 'DONE' ? (
                                <button onClick={onNewMission} className="px-8 py-3.5 bg-emerald-600 hover:bg-emerald-500 text-white font-black uppercase text-[10px] tracking-widest rounded-2xl transition-all shadow-xl shadow-emerald-900/20 active:scale-95 flex items-center gap-2">
                                    <Zap className="w-4 h-4 fill-current" /> New Sequence
                                </button>
                            ) : currentStatus === 'ABORTED' ? (
                                <button onClick={onBackToConfig} className="px-8 py-3.5 bg-amber-600/10 border border-amber-500/20 text-amber-500 font-black uppercase text-[10px] tracking-widest rounded-2xl hover:bg-amber-500 hover:text-white transition-all active:scale-95">
                                    Re-Configure
                                </button>
                            ) : (
                                <button
                                    onClick={handleAbortClick} disabled={isAborting}
                                    className={`px-8 py-3.5 font-black uppercase text-[10px] tracking-widest rounded-2xl transition-all shadow-xl active:scale-95 flex items-center gap-2 border
                                        ${isAborting ? 'bg-red-500/20 border-red-500/20 text-red-500/50 cursor-not-allowed' : 'bg-red-500/10 border-red-500/30 text-red-500 hover:bg-red-600 hover:text-white shadow-red-900/20'}`}>
                                    {isAborting ? <><Disc className="w-4 h-4 animate-spin" /> Killing Thread...</> : <><AlertCircle className="w-4 h-4" /> Abort Mission</>}
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* --- TOKEN REDUCTION CINEMATIC OVERLAY --- */}
            {tokenPhase === 'REDUCING' && (
                <div className="fixed inset-0 z-[200] bg-[#020617]/95 backdrop-blur-3xl flex items-center justify-center animate-fade-in p-6">
                    <div className="max-w-xl w-full text-center space-y-12">
                        <div className="relative group">
                            <div className="absolute inset-0 bg-amber-500/20 blur-[100px] rounded-full animate-pulse" />
                            <div className="relative bg-black rounded-[3rem] p-16 border border-amber-500/20 shadow-[0_0_100px_rgba(245,158,11,0.1)]">
                                <Crown className="w-20 h-20 text-amber-500 mx-auto animate-bounce mb-10" />
                                <p className="text-amber-500 font-black font-mono text-xs uppercase tracking-[0.5em] mb-4 opacity-50">Syncing Neural Memory</p>
                                <div className="text-9xl font-mono font-black text-white tabular-nums tracking-tighter transition-all duration-75">
                                    {displayedTokens}
                                </div>
                                <div className="flex items-center justify-center gap-4 mt-6">
                                    <div className="h-px w-10 bg-red-500/30" />
                                    <span className="text-red-500 font-black font-mono text-xl">-{targetCount} Units</span>
                                    <div className="h-px w-10 bg-red-500/30" />
                                </div>
                            </div>
                        </div>
                        <p className="text-slate-500 font-mono text-sm leading-relaxed max-w-sm mx-auto animate-pulse">
                            Finalizing secure handshake & anchoring submissions to distributed ledgers...
                        </p>
                    </div>
                </div>
            )}

            {/* --- COMPLETED / ABORTED CARDS (CLEAN FOCUS) --- */}
            <div className="flex flex-col items-center gap-10">
                {tokenPhase === 'DONE' && (
                    <div ref={completionRef} className="w-full max-w-3xl glass-panel p-12 rounded-[2.5rem] border-emerald-500/20 bg-emerald-500/[0.02] animate-fade-in-up text-center space-y-8 relative overflow-hidden group">
                        <div className="absolute inset-0 bg-gradient-to-b from-emerald-500/5 to-transparent pointer-events-none" />
                        <div className="relative mx-auto w-24 h-24 rounded-full bg-emerald-500/20 flex items-center justify-center border border-emerald-500/30 group-hover:scale-110 transition-transform duration-500">
                            <CheckCircle className="w-12 h-12 text-emerald-500" />
                        </div>
                        <div className="space-y-4">
                            <h3 className="text-5xl font-serif font-black text-white tracking-tight">Sequence complete</h3>
                            <p className="text-slate-400 text-lg max-w-lg mx-auto leading-relaxed">
                                Automation successful. All <span className="text-emerald-400 font-black">{targetCount} payloads</span> were delivered and confirmed by the remote host.
                            </p>
                        </div>
                        <div className="flex justify-center gap-6 pt-4">
                            <button onClick={onNewMission} className="px-10 py-5 bg-emerald-600 hover:bg-emerald-500 text-white font-black uppercase text-xs tracking-widest rounded-2xl transition-all shadow-xl active:scale-95 group/btn">
                                <span className="flex items-center gap-2">Initialize New mission <ChevronRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" /></span>
                            </button>
                            <button onClick={onBackToConfig} className="px-10 py-5 bg-white/5 hover:bg-white/10 border border-white/10 text-white font-black uppercase text-xs tracking-widest rounded-2xl transition-all active:scale-95">
                                Home Base
                            </button>
                        </div>
                    </div>
                )}

                {currentStatus === 'ABORTED' && (
                    <div ref={abortRef} className="w-full max-w-3xl glass-panel p-12 rounded-[2.5rem] border-red-500/20 bg-red-500/[0.02] animate-fade-in-up text-center space-y-8">
                        <div className="mx-auto w-20 h-20 rounded-full bg-red-500/10 flex items-center justify-center border border-red-500/20">
                            <AlertCircle className="w-10 h-10 text-red-500" />
                        </div>
                        <div className="space-y-2">
                            <h3 className="text-4xl font-serif font-black text-white tracking-tight">Thread Kill confirmed</h3>
                            <p className="text-slate-400 text-sm max-w-md mx-auto leading-relaxed">
                                Operation manually terminated. Deployment halted at <span className="text-red-400 font-black">{currentCount} / {targetCount}</span> items. No further resource deduction will occur.
                            </p>
                        </div>
                        <div className="flex justify-center gap-4">
                            <button onClick={onBackToConfig} className="px-8 py-4 bg-amber-600 text-white font-black uppercase text-[10px] tracking-widest rounded-2xl hover:bg-amber-500 transition-all active:scale-95">
                                Modify mission
                            </button>
                            <button onClick={onNewMission} className="px-8 py-4 bg-white/5 border border-white/10 text-white font-black uppercase text-[10px] tracking-widest rounded-2xl hover:bg-white/10 transition-all active:scale-95">
                                Emergency reset
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* --- STATS GRID (PREMIUM CARDS) --- */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 px-4 md:px-0">
                <StatCard icon={<Zap />} label="Neural Load" value={`${currentCount} / ${targetCount}`} sub="Payloads Deployed" color="text-amber-500" progress={progress} />
                <StatCard icon={<Cpu />} label="Kernel state" value={currentStatus === 'RUNNING' ? 'EXECUTING' : currentStatus} sub="Hardware status" color="text-blue-500" />
                <StatCard icon={<Activity />} label="Throughput" value={`${(currentCount / (elapsedTime / 60 || 1)).toFixed(1)}`} sub="Units / Minute" color="text-emerald-500" />
                <StatCard icon={<Shield />} label="Bypass protocol" value="STEALTH-V2" sub="Anti-Fingerprint" color="text-purple-500" />
            </div>

            {/* --- MONITORING BAR --- */}
            {currentStatus !== 'DONE' && currentStatus !== 'ABORTED' && (
                <div className="mx-4 md:mx-0 p-6 rounded-[1.5rem] bg-amber-500/[0.02] border border-amber-500/10 flex flex-col md:flex-row items-center gap-6 group hover:bg-amber-500/[0.04] transition-all">
                    <div className="h-14 w-14 rounded-2xl bg-amber-500/10 flex items-center justify-center border border-amber-500/20 group-hover:scale-110 transition-transform">
                        <Activity className="w-7 h-7 text-amber-500 animate-pulse" />
                    </div>
                    <div className="flex-1 text-center md:text-left">
                        <p className="text-amber-500 font-black text-[10px] uppercase tracking-[0.3em] mb-1">Safety Lock: Active</p>
                        <p className="text-slate-400 text-xs font-medium leading-relaxed">
                            Automation process is bound to browser context. Keep this <span className="text-amber-200 underline underline-offset-4 decoration-amber-500/50">TAB FOCUSED</span> to maintain system clock synchronization.
                        </p>
                    </div>
                    <div className="hidden lg:block px-4 py-2 rounded-xl bg-white/5 border border-white/5 text-[9px] font-black uppercase tracking-widest text-slate-500">
                        Handshake 200 OK
                    </div>
                </div>
            )}

            {/* --- NEURAL LINK TERMINAL --- */}
            <div className="mx-4 md:mx-0 group glass-panel rounded-[2rem] overflow-hidden border-white/5 shadow-2xl transition-all duration-700 hover:shadow-amber-500/5">
                <div className="bg-white/5 px-8 py-5 border-b border-white/5 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Terminal className="w-5 h-5 text-amber-500/50" />
                        <div>
                            <span className="text-[10px] font-black text-white uppercase tracking-[0.3em] block">Neural telemetry stream</span>
                            <span className="text-[9px] font-mono text-slate-500 block">CONNECTED: LOCALHOST/TRK-PRD-HUB</span>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="flex gap-1.5 mr-6">
                            {[1, 2, 3].map(i => <div key={i} className="w-1.5 h-1.5 rounded-full bg-white/10" />)}
                        </div>
                        <div className="px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center gap-2">
                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            <span className="text-[9px] font-black text-emerald-500 uppercase tracking-widest">Relay Up</span>
                        </div>
                    </div>
                </div>
                <div ref={logContainerRef} className="bg-[#020617]/95 p-10 h-[500px] overflow-y-auto font-mono text-[11px] leading-[1.8] custom-scrollbar selection:bg-amber-500/40 relative">
                    <div className="absolute inset-0 bg-scanning-pattern pointer-events-none opacity-5" />
                    {logs.length === 0 && (
                        <div className="h-full flex flex-col items-center justify-center opacity-20 space-y-4">
                            <Cpu className="w-16 h-16 text-amber-500 animate-spin-slow" />
                            <p className="text-amber-500 font-bold tracking-[0.5em] uppercase text-xs">Awaiting Initial Handshake...</p>
                        </div>
                    )}
                    {logs.map((log, i) => (
                        <div key={i} className="flex gap-8 group/line animate-slide-in-left border-b border-white/[0.02] py-3 first:pt-0">
                            <span className="text-slate-700 shrink-0 tabular-nums font-bold opacity-30 group-hover/line:opacity-100 transition-opacity">
                                {new Date(log.timestamp).toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                            </span>
                            <div className="flex-1 flex items-start gap-4">
                                <span className={`shrink-0 text-[10px] font-black uppercase tracking-tighter px-2 py-0.5 rounded leading-none mt-0.5
                                    ${log.status === 'DONE' ? 'bg-emerald-500 text-black' :
                                        log.status === 'ERROR' ? 'bg-red-500 text-black' :
                                            log.status === 'COOLDOWN' ? 'bg-purple-500 text-white' :
                                                'bg-white/10 text-slate-400'}`}>
                                    {log.status === 'RUNNING' ? 'DEPLOY' : log.status}
                                </span>
                                <span className={`transition-colors duration-300 ${log.status === 'DONE' ? 'text-emerald-400' : log.status === 'ERROR' ? 'text-red-400' : 'group-hover/line:text-white text-slate-400'}`}>
                                    {log.msg}
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <style>{`
                .bg-scanning-pattern {
                    background-image: linear-gradient(0deg, transparent 24%, rgba(255,255,255,0.05) 25%, rgba(255,255,255,0.05) 26%, transparent 27%, transparent 74%, rgba(255,255,255,0.05) 75%, rgba(255,255,255,0.05) 76%, transparent 77%, transparent);
                    background-size: 50px 50px;
                }
                .custom-scrollbar::-webkit-scrollbar { width: 5px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.05); border-radius: 10px; }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(245,158,11,0.2); }
                @keyframes slide-in-left { from { transform: translateX(-10px); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
                .animate-slide-in-left { animation: slide-in-left 0.4s ease-out forwards; }
                .animate-spin-slow { animation: spin 10s linear infinite; }
            `}</style>
        </div>
    );
};

const StatCard = ({ icon, label, value, sub, color, progress }: { icon: React.ReactNode, label: string, value: string, sub: string, color: string, progress?: number }) => (
    <div className="group relative glass-panel p-8 rounded-[2rem] border-white/5 hover:border-white/10 transition-all duration-700 hover:-translate-y-2">
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/[0.02] rounded-full blur-[60px] -translate-y-1/2 translate-x-1/2 group-hover:bg-white/[0.05] transition-all" />
        <div className="relative z-10 space-y-6">
            <div className="flex items-center justify-between">
                <div className={`p-3 rounded-2xl bg-white/5 border border-white/5 group-hover:bg-white/10 transition-all duration-500 ${color}`}>
                    {React.cloneElement(icon as React.ReactElement, { className: 'w-6 h-6' })}
                </div>
                {progress !== undefined && (
                    <div className="px-2 py-0.5 rounded-lg bg-white/5 text-[9px] font-black text-slate-500 opacity-50 uppercase tracking-widest">
                        {Math.round(progress)}% Peak
                    </div>
                )}
            </div>
            <div>
                <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-2 block group-hover:text-slate-400 transition-colors">{label}</span>
                <div className="text-3xl font-mono font-black text-white tracking-tighter mb-1 group-hover:text-amber-100 transition-colors">{value}</div>
                <div className="text-[10px] text-slate-600 font-bold uppercase tracking-widest">{sub}</div>
            </div>
        </div>
    </div>
);

export default MissionControl;
