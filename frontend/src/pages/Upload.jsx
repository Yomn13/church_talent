import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { motion } from 'framer-motion';

const UploadActivity = () => {
    const [activityType, setActivityType] = useState('prayer');
    const [content, setContent] = useState('');
    const [file, setFile] = useState(null);
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        const formData = new FormData();
        formData.append('activity_type', activityType);
        formData.append('content', content);
        if (file) formData.append('photo', file);

        try {
            await api.post('/activities/', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            alert('🎉 활동이 올라갔어요! 선생님이 곧 봐주실 거예요.');
            navigate('/');
        } catch (err) {
            alert('업로드 실패');
            console.error(err);
        }
    };

    return (
        <div className="min-h-screen bg-nature-yellow/30 p-4 font-sans flex items-center justify-center">
            <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="bg-white rounded-[2rem] shadow-xl p-8 border-4 border-white w-full max-w-md"
            >
                <h2 className="text-3xl font-black text-nature-brown mb-6 text-center">✨ 오늘의 활동 올리기 ✨</h2>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label className="block mb-2 font-bold text-lg text-nature-darkGreen">어떤 활동을 했나요?</label>
                        <select
                            value={activityType}
                            onChange={(e) => setActivityType(e.target.value)}
                            className="w-full p-4 rounded-2xl bg-gray-50 border-2 border-gray-200 focus:border-nature-green outline-none font-bold text-lg"
                        >
                            <option value="prayer">🙏 기도했어요</option>
                            <option value="word">📖 말씀 읽었어요</option>
                            <option value="transcribe">✍️ 성경 필사했어요</option>
                            <option value="qt">💭 QT 했어요</option>
                        </select>
                    </div>
                    <div>
                        <label className="block mb-2 font-bold text-lg text-nature-darkGreen">이야기를 들려주세요 (선택)</label>
                        <textarea
                            value={content}
                            onChange={(e) => setContent(e.target.value)}
                            className="w-full p-4 rounded-2xl bg-gray-50 border-2 border-gray-200 focus:border-nature-green outline-none font-bold input-placeholder-color"
                            placeholder="재미있었던 점이나 느낀 점을 적어보세요!"
                            rows="3"
                        />
                    </div>
                    <div>
                        <label className="block mb-2 font-bold text-lg text-nature-darkGreen">사진 찰칵! 📸</label>
                        <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => setFile(e.target.files[0])}
                            className="w-full p-2 bg-gray-100 rounded-xl"
                        />
                    </div>
                    <div className="pt-4 flex gap-3">
                        <button
                            type="button"
                            onClick={() => navigate(-1)}
                            className="flex-1 py-4 bg-gray-200 rounded-2xl font-bold text-gray-600 hover:bg-gray-300 transition"
                        >
                            그만할래요
                        </button>
                        <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            type="submit"
                            className="flex-1 py-4 bg-nature-green text-white rounded-2xl font-black text-lg shadow-[0_4px_0_0_#15803d]"
                        >
                            다 했어요! 👍
                        </motion.button>
                    </div>
                </form>
            </motion.div>
        </div>
    );
};

export default UploadActivity;
