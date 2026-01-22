import React, { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';
import TreeVisualizer from '../components/TreeVisualizer';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

const THEMES = {
    default: { name: '기본 숲', bg: 'bg-orange-50', text: 'text-nature-brown', accent: 'text-nature-green' },
    spring: { name: '봄 🌸', bg: 'bg-pink-50', text: 'text-pink-800', accent: 'text-pink-500' },
    summer: { name: '여름 ☀️', bg: 'bg-blue-50', text: 'text-blue-900', accent: 'text-blue-500' },
    fall: { name: '가을 🍁', bg: 'bg-orange-100', text: 'text-red-900', accent: 'text-orange-600' },
    winter: { name: '겨울 ❄️', bg: 'bg-slate-100', text: 'text-slate-800', accent: 'text-sky-500' },
};

const Dashboard = () => {
    const [profile, setProfile] = useState(null);
    const [pointHistory, setPointHistory] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
    const [isThemeModalOpen, setIsThemeModalOpen] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        fetchProfile();
    }, []);

    const fetchProfile = async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                navigate('/login');
                return;
            }

            const { data: profileData, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', user.id)
                .single();

            if (error) {
                if (error.code === 'PGRST116') {
                    alert('프로필을 찾을 수 없습니다. 선생님께 문의해주세요. (Profile Missing)');
                } else {
                    console.error('Error fetching profile:', error);
                    alert('데이터를 불러오는데 실패했습니다: ' + error.message);
                }
                // Don't redirect immediately so they can see the error, or redirect to login after alert
                // navigate('/login'); 
                return;
            }

            // Fetch History (Activities + Attendance)
            const { data: activities } = await supabase.from('activity_logs').select('*').eq('user_id', user.id).eq('is_approved', true);
            const { data: attendance } = await supabase.from('attendance').select('*').eq('user_id', user.id);

            // Normalize history for display
            const normalizedActivities = (activities || []).map(a => ({ type: 'activity', name: a.activity_type, date: a.created_at.split('T')[0], points: a.points }));
            const normalizedAttendance = (attendance || []).map(a => ({ type: 'attendance', name: '출석', date: a.date, points: 1 }));

            setPointHistory([...normalizedActivities, ...normalizedAttendance].sort((a, b) => new Date(a.date) - new Date(b.date)));
            setProfile(profileData);

        } catch (err) {
            console.error(err);
            alert('알 수 없는 오류가 발생했습니다.');
            navigate('/login');
        } finally {
            setLoading(false);
        }
    };

    const handleThemeChange = async (themeKey) => {
        try {
            const { error } = await supabase.from('profiles').update({ theme: themeKey }).eq('id', profile.id);
            if (error) throw error;
            setProfile({ ...profile, theme: themeKey });
            setIsThemeModalOpen(false);
        } catch (err) {
            alert('테마 변경 실패');
        }
    };

    if (loading) return <div className="min-h-screen flex items-center justify-center text-2xl font-bold text-nature-green animate-bounce">나무를 불러오는 중... 🌱</div>;
    if (!profile) return null;

    // --- Gamification Logic ---
    const points = profile.talent_point;
    let level = 1;
    let maxPoints = 30;
    let levelTitle = "새싹 등급 🌱";
    let unlockedThemes = ['default'];

    if (points >= 30) {
        level = 2;
        maxPoints = 60;
        levelTitle = "무럭무럭 등급 🌿";
        unlockedThemes.push('spring', 'summer');
    }
    if (points >= 60) {
        level = 3;
        maxPoints = 90;
        levelTitle = "풍성한 숲 등급 🌳";
        unlockedThemes.push('fall', 'winter');
    }

    // Cap progress at 100%
    const progressPercent = Math.min((points / maxPoints) * 100, 100);
    const currentTheme = THEMES[profile.theme] || THEMES.default;

    return (
        <div className={`min-h-screen ${currentTheme.bg} font-sans pb-20 relative transition-colors duration-500`}>
            {/* Header */}
            <div className={`p-6 rounded-b-[3rem] shadow-lg mb-8 relative overflow-hidden transition-colors duration-500 ${profile.theme === 'spring' ? 'bg-pink-400' : profile.theme === 'summer' ? 'bg-blue-400' : profile.theme === 'fall' ? 'bg-orange-500' : profile.theme === 'winter' ? 'bg-slate-400' : 'bg-nature-green'}`}>
                <div className="absolute top-0 right-0 p-4 opacity-20 text-9xl">🌿</div>
                <h1 className="text-3xl text-center text-white font-bold drop-shadow-md relative z-10">
                    {profile.username}의 달란트 나무
                </h1>
                <div className="text-center text-white/90 mt-1 font-bold">{levelTitle} (Lv.{level})</div>

                {/* Progress Bar */}
                <div className="mt-6 bg-black/20 rounded-full h-6 relative overflow-hidden max-w-sm mx-auto border-2 border-white/30 backdrop-blur-sm">
                    <div className="absolute inset-0 flex items-center justify-center text-xs font-black text-white z-10 shadow-sm">
                        {points} / {maxPoints} 달란트
                    </div>
                    <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${progressPercent}%` }}
                        transition={{ duration: 1, ease: "easeOut" }}
                        className={`h-full ${profile.theme === 'winter' ? 'bg-sky-300' : 'bg-yellow-400'}`}
                    />
                </div>
            </div>

            <div className="px-4">
                {/* Safe pass of profile with history */}
                <TreeVisualizer profile={{ ...profile, point_history: pointHistory }} theme={profile.theme} />

                {/* Controls */}
                <div className="mt-10 grid grid-cols-2 gap-4 max-w-md mx-auto">

                    <motion.button
                        whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                        onClick={() => navigate('/upload')}
                        className={`col-span-2 btn-bubbly bg-white p-6 rounded-3xl flex flex-col items-center justify-center ${currentTheme.text} border-b-4 border-gray-200`}
                    >
                        <span className="text-5xl mb-3">📸</span>
                        <span className="font-bold text-xl">활동인증</span>
                        <span className="text-sm opacity-70 mt-1">오늘 한 활동을 올려주세요!</span>
                    </motion.button>

                    <motion.button
                        whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                        onClick={() => navigate('/forest')}
                        className={`col-span-2 btn-bubbly bg-white/60 p-6 rounded-3xl flex flex-row items-center justify-center gap-4 ${currentTheme.accent} border-b-4 border-gray-200`}
                    >
                        <span className="text-5xl">🌳</span>
                        <div className="text-left">
                            <div className="font-bold text-xl">친구들 숲 놀러가기</div>
                            <div className="text-sm opacity-70">다른 친구들 나무는 뭘까?</div>
                        </div>
                    </motion.button>

                    {/* Theme Selector Button */}
                    <motion.button
                        whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                        onClick={() => setIsThemeModalOpen(true)}
                        className="btn-bubbly bg-purple-100 p-4 rounded-3xl flex flex-col items-center justify-center text-purple-700 font-bold border-b-4 border-purple-200"
                    >
                        <span className="text-3xl mb-1">🎨</span>
                        <span>테마 변경</span>
                    </motion.button>

                    <motion.button
                        whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                        onClick={() => setIsHistoryModalOpen(true)}
                        className="btn-bubbly bg-yellow-100 p-4 rounded-3xl flex flex-col items-center justify-center text-nature-brown font-bold border-b-4 border-yellow-200"
                    >
                        <span className="text-3xl mb-1">📜</span>
                        <span>내 기록</span>
                    </motion.button>
                </div>

                <div className="mt-8 text-center pb-8">
                    <button onClick={async () => { await supabase.auth.signOut(); navigate('/login'); }} className={`${currentTheme.text} opacity-60 font-bold hover:opacity-100 transition`}>로그아웃 👋</button>
                </div>
            </div>

            {/* Theme Modal */}
            <AnimatePresence>
                {isThemeModalOpen && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                        <div className="absolute inset-0" onClick={() => setIsThemeModalOpen(false)}></div>
                        <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} className="bg-white rounded-[2rem] p-6 w-full max-w-sm shadow-2xl relative z-10">
                            <h2 className="text-2xl font-black mb-4 text-gray-800 text-center">테마 꾸미기 🎨</h2>
                            <p className="text-center text-gray-500 mb-6 text-sm">레벨이 오르면 새로운 계절이 열려요!</p>

                            <div className="grid grid-cols-1 gap-3">
                                {Object.entries(THEMES).map(([key, theme]) => {
                                    const isUnlocked = unlockedThemes.includes(key);
                                    return (
                                        <button
                                            key={key}
                                            disabled={!isUnlocked}
                                            onClick={() => handleThemeChange(key)}
                                            className={`p-4 rounded-2xl border-2 flex items-center justify-between transition-all
                                                ${profile.theme === key ? 'border-nature-green bg-green-50 ring-2 ring-green-200' : 'border-gray-100 bg-white'}
                                                ${!isUnlocked ? 'opacity-50 grayscale cursor-not-allowed' : 'hover:scale-105 active:scale-95 shadow-sm'}
                                            `}
                                        >
                                            <span className="font-bold text-gray-700">{theme.name}</span>
                                            {!isUnlocked && <span className="text-xs font-bold text-red-400 bg-red-50 px-2 py-1 rounded-full">잠김 🔒</span>}
                                            {profile.theme === key && <span className="text-nature-green">✅</span>}
                                        </button>
                                    );
                                })}
                            </div>
                            <button onClick={() => setIsThemeModalOpen(false)} className="mt-6 w-full py-3 bg-gray-100 rounded-xl font-bold text-gray-600">닫기</button>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* History Modal */}
            <AnimatePresence>
                {isHistoryModalOpen && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                        <div className="absolute inset-0" onClick={() => setIsHistoryModalOpen(false)}></div>
                        <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} className="bg-white rounded-[2rem] p-6 w-full max-w-lg shadow-2xl relative z-10 max-h-[80vh] flex flex-col">
                            <h2 className="text-2xl font-black mb-2 text-gray-800">내 활동 기록 📜</h2>
                            <div className="overflow-y-auto flex-1 space-y-3 pr-2 custom-scrollbar mt-4">
                                {pointHistory.length === 0 ? <div className="text-center text-gray-400 py-10 font-bold">기록이 없습니다.</div> :
                                    pointHistory.slice().reverse().map((log, idx) => (
                                        <div key={idx} className="flex items-center bg-gray-50 p-4 rounded-2xl border border-gray-100">
                                            <div className="text-2xl mr-4">{log.type === 'attendance' ? '📅' : '🙏'}</div>
                                            <div className="flex-1">
                                                <div className="font-bold text-gray-800">{log.name}</div>
                                                <div className="text-xs text-gray-500">{log.date}</div>
                                            </div>
                                            <div className="font-black text-nature-green text-lg">+{log.points}</div>
                                        </div>
                                    ))
                                }
                            </div>
                            <button onClick={() => setIsHistoryModalOpen(false)} className="mt-6 w-full py-3 bg-gray-100 rounded-xl font-bold text-gray-600">닫기</button>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default Dashboard;
