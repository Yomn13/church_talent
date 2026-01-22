import React from 'react';
import { motion } from 'framer-motion';

const SEASON_CONFIG = {
    default: {
        leafStart: 'bg-nature-green', leafEnd: 'bg-green-400',
        trunk: 'bg-nature-brown',
        bgElements: ['☀️', '☁️']
    },
    spring: {
        leafStart: 'bg-pink-300', leafEnd: 'bg-pink-200',
        trunk: 'bg-stone-500',
        bgElements: ['🌸', '🦋']
    },
    summer: {
        leafStart: 'bg-emerald-400', leafEnd: 'bg-teal-300',
        trunk: 'bg-amber-800',
        bgElements: ['☀️', '🏖️']
    },
    fall: {
        leafStart: 'bg-orange-500', leafEnd: 'bg-amber-500',
        trunk: 'bg-orange-900',
        bgElements: ['🍂', '🪁']
    },
    winter: {
        leafStart: 'bg-slate-200', leafEnd: 'bg-white',
        trunk: 'bg-slate-600',
        bgElements: ['❄️', '☃️']
    }
};

const FRUIT_CONFIG = {
    default: { attendance: '🍎', activity: '🍊' },
    spring: { attendance: '🌷', activity: '🍓' },
    summer: { attendance: '🥥', activity: '🍍' },
    fall: { attendance: '🍁', activity: '🌰' },
    winter: { attendance: '🧣', activity: '❄️' }
};

const TreeVisualizer = ({ profile, theme = 'default' }) => {
    // Determine talent points and history safely
    const talentCount = profile?.talent_point || 0;
    // Ensure point_history is an array. If it's undefined, default to []
    const point_history = Array.isArray(profile?.point_history) ? profile.point_history : [];
    const config = SEASON_CONFIG[theme] || SEASON_CONFIG.default;
    const fruitsConfig = FRUIT_CONFIG[theme] || FRUIT_CONFIG.default;

    // Logic for tree growth
    let scale = 0.5;
    let stageName = '새싹 🌱';

    if (talentCount >= 5) { scale = 0.7; stageName = '쑥쑥 자라는 묘목'; }
    if (talentCount >= 10) { scale = 0.8; stageName = '든든한 나무'; }
    if (talentCount >= 30) { scale = 1.0; stageName = '울창한 큰 나무'; }
    if (talentCount >= 60) { scale = 1.2; stageName = '전설의 세계수'; }

    const fruits = [];
    const displayHistory = point_history.slice(0, 40); // Cap at 40

    // Seeded random positions or just random
    for (let i = 0; i < displayHistory.length; i++) {
        const item = displayHistory[i];
        const angle = Math.random() * Math.PI * 2;
        const icon = item.type === 'attendance' ? fruitsConfig.attendance : fruitsConfig.activity;

        fruits.push(
            <motion.div
                key={i}
                drag
                dragConstraints={{ left: -100, right: 100, top: -100, bottom: 100 }}
                whileDrag={{ scale: 1.2, cursor: "grabbing" }}
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{
                    type: "spring", stiffness: 300, damping: 15, delay: i * 0.05
                }}
                className="absolute w-8 h-8 flex items-center justify-center z-10 group cursor-grab active:cursor-grabbing"
                style={{
                    top: `${40 + Math.sin(angle) * (Math.random() * 30)}%`,
                    left: `${50 + Math.cos(angle) * (Math.random() * 35)}%`,
                }}
            >
                <span className="text-xl drop-shadow-md transition-transform pointer-events-none select-none">
                    {icon}
                </span>

                {/* Tooltip */}
                <div className="absolute bottom-full mb-2 hidden group-hover:block w-32 bg-white text-xs p-2 rounded-lg shadow-xl text-center z-50 border-2 border-nature-green pointer-events-none">
                    <div className="font-bold text-gray-800">{item.date}</div>
                    <div className="text-gray-600 break-keep">{item.content || item.name}</div>
                </div>
            </motion.div>
        );
    }

    return (
        <div className="flex flex-col items-center w-full">
            <motion.div
                key={stageName}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white/80 backdrop-blur-sm px-6 py-2 rounded-full border-2 border-white/50 shadow-md mb-6"
            >
                <span className="text-xl font-bold text-gray-700">{stageName}</span>
                <span className="ml-2 px-3 py-1 bg-yellow-300 rounded-full text-yellow-900 font-black text-lg">
                    {talentCount} P
                </span>
            </motion.div>

            <div className="relative w-full max-w-sm h-96 flex items-end justify-center">
                {/* Bg Elements */}
                <motion.div
                    animate={{ y: [0, -10, 0] }}
                    transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
                    className="absolute top-0 right-10 text-6xl opacity-80"
                >
                    {config.bgElements[0]}
                </motion.div>
                <motion.div
                    animate={{ x: [0, 20, 0] }}
                    transition={{ repeat: Infinity, duration: 6, ease: "easeInOut" }}
                    className="absolute top-10 left-10 text-5xl opacity-60"
                >
                    {config.bgElements[1]}
                </motion.div>

                {/* Tree */}
                <motion.div
                    className="relative w-64 h-80 flex flex-col items-center justify-end"
                    animate={{ scale: scale }}
                    transition={{ type: "spring", bounce: 0.4 }}
                >
                    {/* Foliage */}
                    <div className={`absolute bottom-20 z-0 w-64 h-64 ${config.leafStart} rounded-[3rem] shadow-inner border-4 border-black/5 transform rotate-45 flex items-center justify-center transition-colors duration-500`}>
                        {/* Inner textural blob */}
                        <div className={`w-56 h-56 ${config.leafEnd} rounded-[2.5rem] opacity-50 absolute transition-colors duration-500`}></div>
                    </div>

                    {/* Trunk */}
                    <div className={`w-16 h-32 ${config.trunk} rounded-xl relative z-0 border-r-4 border-black/10 shadow-xl transition-colors duration-500`}>
                        <div className="w-full h-2 bg-black/10 mt-4 rounded-full"></div>
                        <div className="w-2/3 h-2 bg-black/10 mt-6 ml-2 rounded-full"></div>
                    </div>

                    {/* Fruits Layer */}
                    <div className="absolute inset-0 z-10 pointer-events-none">
                        {fruits}
                    </div>

                    {/* Grass Base */}
                    <div className={`absolute -bottom-4 w-48 h-12 ${config.leafStart} rounded-full -z-10 blur-sm opacity-50`}></div>
                </motion.div>
            </div>
        </div>
    );
};

export default TreeVisualizer;
