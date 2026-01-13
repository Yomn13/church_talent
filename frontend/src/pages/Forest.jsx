import React, { useEffect, useState } from 'react';
import api from '../api/axios';
import TreeVisualizer from '../components/TreeVisualizer';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

const Forest = () => {
    const [students, setStudents] = useState([]);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchStudents = async () => {
            try {
                const res = await api.get('/students/');
                setStudents(res.data);
            } catch (err) {
                console.error(err);
            }
        };
        fetchStudents();
    }, []);

    return (
        <div className="min-h-screen bg-green-50 p-4 font-sans pb-20">
            <div className="max-w-6xl mx-auto mb-8 flex justify-between items-center">
                <div className="bg-white px-6 py-3 rounded-full shadow-md border-2 border-green-100 flex items-center gap-2">
                    <span className="text-3xl">🌳</span>
                    <h1 className="text-2xl font-black text-nature-darkGreen">친구들 숲</h1>
                </div>
                <button onClick={() => navigate('/')} className="bg-white px-6 py-3 rounded-full font-bold text-nature-brown shadow-sm border-2 border-orange-100 hover:bg-orange-50 transition">
                    🏠 우리 집으로
                </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
                {students.map((student, index) => (
                    <motion.div
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ delay: index * 0.1 }}
                        key={student.username}
                        className="bg-white p-6 rounded-[2.5rem] shadow-xl flex flex-col items-center border-4 border-white ring-4 ring-green-50 relative"
                    >
                        <div className="absolute -top-4 bg-nature-yellow px-4 py-1 rounded-full font-black text-nature-brown shadow-sm border-2 border-white">
                            {student.username}
                        </div>
                        <div className="mt-4 transform scale-90 w-full" style={{ height: '320px' }}>
                            <TreeVisualizer profile={student} theme={student.theme} />
                        </div>
                    </motion.div>
                ))}
            </div>
        </div>
    );
};
export default Forest;
