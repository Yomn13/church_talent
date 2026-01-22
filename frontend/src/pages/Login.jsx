import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { motion } from 'framer-motion';

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const navigate = useNavigate();

    const handleLogin = async (e) => {
        e.preventDefault();
        try {
            // Append dummy domain for ID-based login
            const emailToUse = email.includes('@') ? email : `${email}@church.com`;

            const { data, error } = await supabase.auth.signInWithPassword({
                email: emailToUse,
                password,
            });

            if (error) throw error;

            // Check role from profiles table
            const { data: profile } = await supabase
                .from('profiles')
                .select('role')
                .eq('id', data.user.id)
                .single();

            if (profile?.role === 'teacher') {
                navigate('/teacher');
            } else {
                navigate('/dashboard');
            }
        } catch (error) {
            console.error(error);
            alert('로그인 실패: 이메일과 비밀번호를 확인하세요.');
        }
    };

    return (
        <div className="min-h-screen bg-nature-yellow/20 flex items-center justify-center p-4 relative overflow-hidden">
            {/* Decorative BG blobls */}
            <div className="absolute -top-20 -left-20 w-64 h-64 bg-pastel-pink rounded-full blur-3xl opacity-50"></div>
            <div className="absolute top-1/2 -right-20 w-80 h-80 bg-nature-sky rounded-full blur-3xl opacity-50"></div>

            <motion.div
                initial={{ y: 50, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                className="card-bubble bg-white p-8 w-full max-w-md relative z-10"
            >
                <div className="text-center mb-8">
                    <span className="text-6xl inline-block mb-4 animate-bounce">🌳</span>
                    <h1 className="text-3xl font-black text-nature-darkGreen mb-2">달란트 나무</h1>
                    <p className="text-nature-brown font-bold">우리들의 믿음이 쑥쑥 자라요!</p>
                </div>

                <form onSubmit={handleLogin} className="space-y-6">
                    <div>
                        <label className="block text-nature-brown mb-2 font-bold text-lg">아이디 (ID)</label>
                        <input
                            type="text"
                            value={email} // keeping variable name 'email' for state but it stores username
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full p-4 rounded-2xl bg-gray-50 border-2 border-gray-200 focus:border-nature-green outline-none transition text-lg font-bold"
                            placeholder="아이디를 입력하세요"
                        />
                    </div>
                    <div>
                        <label className="block text-nature-brown mb-2 font-bold text-lg">비밀번호</label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full p-4 rounded-2xl bg-gray-50 border-2 border-gray-200 focus:border-nature-green outline-none transition text-lg font-bold"
                            placeholder="비밀번호를 입력하세요"
                        />
                    </div>
                    <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        type="submit"
                        className="w-full bg-nature-green text-white py-4 rounded-2xl font-black text-xl hover:bg-green-400 transition shadow-[0_4px_0_0_#15803d]"
                    >
                        로그인하기 🚀
                    </motion.button>
                </form>
            </motion.div>
        </div>
    );
};

export default Login;
