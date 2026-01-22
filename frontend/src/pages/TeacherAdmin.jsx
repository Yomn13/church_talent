import React, { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

const TeacherAdmin = () => {
    const [activities, setActivities] = useState([]);
    const [students, setStudents] = useState([]);
    const [isStudentModalOpen, setIsStudentModalOpen] = useState(false);
    const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);

    // Log Management State
    const [currentStudent, setCurrentStudent] = useState(null);
    const [historyLogs, setHistoryLogs] = useState([]);
    const [isAddingLog, setIsAddingLog] = useState(false);

    // Forms
    const [formData, setFormData] = useState({ email: '', password: '', username: '', class_name: '', talent_point: 0 });
    const [logForm, setLogForm] = useState({ type: 'activity', activity_type: 'prayer', date: '', content: '', points: 1 });

    const navigate = useNavigate();

    useEffect(() => {
        checkAuth();
        fetchData();
    }, []);

    const checkAuth = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) { navigate('/login'); return; }

        const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
        if (profile?.role !== 'teacher') {
            alert('선생님만 접근 가능합니다.');
            navigate('/');
        }
    };

    const fetchData = async () => {
        try {
            // Fetch unapproved activity logs
            // We need username from profiles, so we join manually or use another query.
            // Supabase JS allows foreign table select if relationship exists.
            const { data: acts, error: actError } = await supabase
                .from('activity_logs')
                .select(`
                    *,
                    profiles:user_id ( username )
                `)
                .eq('is_approved', false)
                .order('created_at', { ascending: false });

            if (actError) throw actError;

            // Flatten for display
            const formattedActs = acts.map(a => ({
                ...a,
                username: a.profiles?.username || 'Unknown'
            }));
            setActivities(formattedActs);

            // Fetch students
            const { data: stds, error: stdError } = await supabase
                .from('profiles')
                .select('*')
                .eq('role', 'student')
                .order('username');

            if (stdError) throw stdError;
            setStudents(stds);

        } catch (err) {
            console.error(err);
        }
    };

    const refreshStudentHistory = async (studentId) => {
        try {
            // Fetch activities
            const { data: acts } = await supabase.from('activity_logs').select('*').eq('user_id', studentId).eq('is_approved', true);
            // Fetch attendance
            const { data: atts } = await supabase.from('attendance').select('*').eq('user_id', studentId);

            const combined = [
                ...(acts || []).map(a => ({ ...a, type: 'activity', name: a.activity_type })),
                ...(atts || []).map(a => ({ ...a, type: 'attendance', name: '출석', points: 1 }))
            ].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

            setHistoryLogs(combined);
        } catch (err) {
            console.error(err);
        }
    };

    // --- Actions ---
    const handleApprove = async (id, points) => {
        if (!window.confirm('승인하시겠습니까?')) return;
        try {
            // Update log approval and add points to profile (Trigger handles points usually, but if manual...)
            // Our schema trigger: "Auto-increment points when activity_logs.is_approved becomes true" -> YES.
            const { error } = await supabase.from('activity_logs').update({ is_approved: true }).eq('id', id);
            if (error) throw error;

            // Trigger should handle the profile update.
            fetchData();
        } catch (err) { alert('오류: ' + err.message); }
    };

    const handleAttendance = async (studentId, name) => {
        if (!window.confirm(`${name} 학생 출석 체크?`)) return;
        try {
            // Insert attendance. Trigger should add points.
            const { error } = await supabase.from('attendance').insert([{ user_id: studentId }]);
            if (error) throw error;
            alert('출석 완료!');
            fetchData();
        } catch (err) { alert(err.message); }
    };

    // --- Log CRUD ---
    const handleDeleteLog = async (log) => {
        if (!window.confirm('정말 삭제하시겠습니까? (달란트도 차감됩니다)')) return;
        try {
            // Deleting might need manual point adjustment unless we have a trigger for DELETE.
            // Our schema plan didn't explicitly include DELETE trigger for point decrement.
            // Let's implement manual decrement here for safety or assume trigger exists (it's better to add trigger later).
            // For now: Just delete. The points might desync if we don't handle it.
            // HACK: Manually decrement.
            const table = log.type === 'attendance' ? 'attendance' : 'activity_logs';
            await supabase.from(table).delete().eq('id', log.id);

            // Manually decrement points
            const { data: profile } = await supabase.from('profiles').select('talent_point').eq('id', currentStudent.id).single();
            if (profile) {
                await supabase.from('profiles').update({ talent_point: Math.max(0, profile.talent_point - log.points) }).eq('id', currentStudent.id);
            }

            // Refresh
            // Update local state if needed or re-fetch
            const { data: updatedStudent } = await supabase.from('profiles').select('*').eq('id', currentStudent.id).single();
            setCurrentStudent(updatedStudent);

            await refreshStudentHistory(currentStudent.id);
            fetchData();
        } catch (err) { alert('삭제 실패'); }
    };

    const handleAddLog = async (e) => {
        e.preventDefault();
        try {
            const userId = currentStudent.id;
            const date = logForm.date || new Date().toISOString();
            // Note: Our schema has 'created_at', we might need to override it or use 'date' column if it exists.
            // Activity Logs has 'created_at', Attendance has 'date'.

            if (logForm.type === 'attendance') {
                await supabase.from('attendance').insert([{ user_id: userId, date: date }]);
            } else {
                await supabase.from('activity_logs').insert([{
                    user_id: userId,
                    activity_type: logForm.activity_type,
                    content: logForm.content,
                    points: logForm.points,
                    is_approved: true, // Auto approve by teacher
                    created_at: date // Override creation time if needed
                }]);
            }
            alert('기록 추가 완료!');
            setLogForm({ type: 'activity', activity_type: 'prayer', date: '', content: '', points: 1 });
            setIsAddingLog(false);

            // Refresh student to see new points
            const { data: updatedStudent } = await supabase.from('profiles').select('*').eq('id', currentStudent.id).single();
            setCurrentStudent(updatedStudent);

            await refreshStudentHistory(userId);
            fetchData();
        } catch (err) { alert('추가 실패: ' + err.message); }
    };

    // --- Student Management (Create User) ---
    // Note: Creating users via Client SDK only works if "Enable Signup" is on, or we use Service Role Key (backend).
    // Client-side 'signUp' logs them in immediately, which overrides teacher session.
    // Solution: We can't easily create *other* users from client-side without logging out.
    // workaround: "Invite User" (admin only) or just use Supabase Dashboard for user creation.
    // OR: Use a secondary Supabase client instance (not easy in browser).
    // ALTERNATIVE: Just create a "Profile" record? No, need Auth User.
    // FOR THIS DEMO: We will assume we can't create users easily from this UI without Admin API. 
    // We will show a message or just allow editing existing profiles.

    // Actually, let's implement ONLY Profile editing here. User creation should happen via Signup Page or Dashboard.
    // But requirement says "Change all things...".

    // Updated Plan: The "Student Add" button will just simulate or guide them.
    // OR: We use `supabase.auth.signUp` but be aware it might sign out the teacher?
    // Actually `signUp` with autoConfirm OFF doesn't sign out. But we need to verify.
    // Let's stick to Editing for now to be safe, or direct them to a signup link.

    const handleStudentSave = async (e) => {
        e.preventDefault();
        try {
            if (currentStudent) {
                // Update Profile
                const { error } = await supabase.from('profiles').update({
                    class_name: formData.class_name,
                    talent_point: formData.talent_point
                    // username is not editable easily because it's linked to auth email, let's keep it fixed or complex to change
                }).eq('id', currentStudent.id);
                if (error) throw error;
            } else {
                // Create New Student via RPC
                const { data, error } = await supabase.rpc('create_student', {
                    username: formData.username,
                    password: formData.password,
                    class_name: formData.class_name,
                    talent_point: formData.talent_point
                });

                if (error) throw error;
            }
            setIsStudentModalOpen(false);
            fetchData();
            alert('저장되었습니다.');
        } catch (err) { alert('저장 실패: ' + err.message); }
    };

    const openStudentModal = (student = null) => {
        setCurrentStudent(student);
        setFormData(student ? { ...student, password: '' } : { username: '', password: '', name: '', class_name: '', talent_point: 0 });
        setIsStudentModalOpen(true);
    };

    return (
        <div className="min-h-screen bg-gray-50 p-6 font-sans">
            {/* Header */}
            <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-2xl font-black text-gray-800">👩‍🏫 선생님 관리 페이지</h1>
                    <p className="text-gray-500 font-bold mt-1">아이들을 사랑으로 격려해주세요!</p>
                </div>
                <button onClick={async () => { await supabase.auth.signOut(); navigate('/login'); }} className="px-6 py-2 bg-gray-100 rounded-full font-bold text-gray-600 hover:bg-gray-200 transition">로그아웃</button>
            </div>

            {/* Approvals */}
            <div className="mb-12">
                <h2 className="text-xl font-black mb-6 text-blue-600 flex items-center gap-2"><span>📫</span> 활동 승인 대기 ({activities.length})</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {activities.length === 0 && <div className="col-span-full bg-white p-8 rounded-3xl text-center text-gray-400 font-bold border-dashed border-2">대기 중인 활동이 없습니다.</div>}
                    {activities.map(act => (
                        <div key={act.id} className="bg-white p-6 rounded-3xl shadow-lg border-2 border-blue-50 flex flex-col gap-4">
                            <div className="flex justify-between items-center">
                                <span className="font-bold text-lg bg-yellow-100 px-3 py-1 rounded-full text-yellow-800">{act.username}</span>
                                <span className="font-bold text-sm text-blue-500 bg-blue-50 px-3 py-1 rounded-full">{act.activity_type}</span>
                            </div>
                            <div className="text-gray-700 bg-gray-50 p-4 rounded-2xl font-medium">{act.content || "내용 없음"}</div>
                            {act.photo_url && <img src={act.photo_url} alt="img" className="w-full h-40 object-cover rounded-2xl" />}
                            <button onClick={() => handleApprove(act.id, act.points)} className="mt-auto w-full bg-blue-500 text-white py-3 rounded-2xl hover:bg-blue-600 font-black shadow-md">승인 (+{act.points}달란트) ✅</button>
                        </div>
                    ))}
                </div>
            </div>

            {/* Student List */}
            <div>
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-black text-nature-green flex items-center gap-2"><span>🌱</span> 학생 목록</h2>
                </div>
                <div className="bg-white rounded-3xl shadow-sm overflow-hidden border border-gray-100">
                    <table className="w-full text-left">
                        <thead className="bg-nature-green/10">
                            <tr>
                                <th className="p-5 text-nature-darkGreen font-black">이름 (ID)</th>
                                <th className="p-5 text-nature-darkGreen font-black">반</th>
                                <th className="p-5 text-nature-darkGreen font-black">달란트</th>
                                <th className="p-5 text-nature-darkGreen font-black">출석</th>
                                <th className="p-5 text-nature-darkGreen font-black text-right">관리</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {students.map(std => (
                                <tr key={std.id} className="hover:bg-gray-50 transition">
                                    <td className="p-5">
                                        <div onClick={() => { setCurrentStudent(std); refreshStudentHistory(std.id); setIsHistoryModalOpen(true); }} className="font-bold text-gray-700 text-lg cursor-pointer hover:text-blue-500 hover:underline">
                                            {std.username}
                                        </div>
                                    </td>
                                    <td className="p-5 text-gray-600 font-medium">{std.class_name}</td>
                                    <td className="p-5"><span className="bg-nature-yellow px-4 py-1 rounded-full font-black text-nature-brown border border-yellow-200">{std.talent_point}</span></td>
                                    <td className="p-5"><button onClick={() => handleAttendance(std.id, std.username)} className="bg-green-100 text-green-700 px-3 py-1 rounded-lg font-bold hover:bg-green-200 text-sm">출석체크 ✅</button></td>
                                    <td className="p-5 text-right"><button onClick={() => openStudentModal(std)} className="bg-gray-100 text-gray-600 px-4 py-2 rounded-xl font-bold hover:bg-gray-200">수정 ✏️</button></td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Student Add/Edit Modal */}
            <AnimatePresence>
                {isStudentModalOpen && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                        <div className="bg-white rounded-3xl p-8 w-full max-w-lg shadow-2xl">
                            <h2 className="text-2xl font-black mb-6 text-gray-800">{currentStudent ? '학생 수정' : '학생 등록'}</h2>
                            <form onSubmit={handleStudentSave} className="space-y-4">
                                <input type="text" placeholder="반" value={formData.class_name || ''} onChange={e => setFormData({ ...formData, class_name: e.target.value })} className="w-full bg-gray-50 border p-3 rounded-xl font-bold" />
                                <input type="text" placeholder="아이디 (ID)" value={formData.username || ''} onChange={e => setFormData({ ...formData, username: e.target.value })} className="w-full bg-gray-50 border p-3 rounded-xl font-bold" required disabled={!!currentStudent} />

                                <div className="relative">
                                    <input type="text" placeholder={currentStudent ? "비밀번호 (변경시에만 입력)" : "비밀번호"} value={formData.password} onChange={e => setFormData({ ...formData, password: e.target.value })} className="w-full bg-gray-50 border p-3 rounded-xl font-bold" required={!currentStudent} />
                                </div>

                                <input type="number" placeholder="달란트" value={formData.talent_point} onChange={e => setFormData({ ...formData, talent_point: parseInt(e.target.value) || 0 })} className="w-full bg-gray-50 border p-3 rounded-xl font-bold" />

                                {/* Password Reset Button for Existing Students */}
                                {currentStudent && formData.password && (
                                    <button type="button" onClick={async () => {
                                        if (!window.confirm('비밀번호를 변경하시겠습니까?')) return;
                                        try {
                                            const { error } = await supabase.rpc('update_student_password', {
                                                target_user_id: currentStudent.id,
                                                new_password: formData.password
                                            });
                                            if (error) throw error;
                                            alert('비밀번호가 변경되었습니다.');
                                            setFormData({ ...formData, password: '' });
                                        } catch (err) { alert('변경 실패: ' + err.message); }
                                    }} className="w-full py-2 bg-red-100 text-red-500 rounded-xl font-bold text-sm">
                                        비밀번호만 변경하기 🔒
                                    </button>
                                )}

                                <div className="flex gap-3 mt-4">
                                    <button type="button" onClick={() => setIsStudentModalOpen(false)} className="flex-1 py-3 bg-gray-100 rounded-xl font-bold">취소</button>
                                    <button type="submit" className="flex-1 py-3 bg-nature-green text-white rounded-xl font-bold">{currentStudent ? '정보 수정' : '새 친구 등록'}</button>
                                </div>
                            </form>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* History Management Modal */}
            <AnimatePresence>
                {isHistoryModalOpen && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                        <div className="absolute inset-0" onClick={() => setIsHistoryModalOpen(false)}></div>
                        <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} className="bg-white rounded-[2rem] p-8 w-full max-w-2xl shadow-2xl relative z-10 max-h-[90vh] flex flex-col">
                            <h2 className="text-2xl font-black mb-2 text-gray-800">{currentStudent?.username}의 활동 기록 📜</h2>
                            <p className="text-gray-500 font-bold mb-6 border-b pb-4">총 {currentStudent?.talent_point} 달란트</p>

                            <button onClick={() => setIsAddingLog(!isAddingLog)} className="mb-4 w-full py-3 bg-blue-100 text-blue-700 rounded-xl font-black hover:bg-blue-200 transition">
                                {isAddingLog ? '닫기' : '+ 기록 직접 추가하기'}
                            </button>

                            {isAddingLog && (
                                <form onSubmit={handleAddLog} className="mb-6 bg-gray-50 p-4 rounded-xl border border-gray-200">
                                    <div className="grid grid-cols-2 gap-3 mb-3">
                                        <select value={logForm.type} onChange={e => setLogForm({ ...logForm, type: e.target.value })} className="p-3 rounded-lg border font-bold">
                                            <option value="activity">활동 (Activity)</option>
                                            <option value="attendance">출석 (Attendance)</option>
                                        </select>
                                        <input type="date" value={logForm.date} onChange={e => setLogForm({ ...logForm, date: e.target.value })} className="p-3 rounded-lg border font-bold" required />
                                    </div>
                                    {logForm.type === 'activity' && (
                                        <div className="space-y-3">
                                            <select value={logForm.activity_type} onChange={e => setLogForm({ ...logForm, activity_type: e.target.value })} className="w-full p-3 rounded-lg border font-bold">
                                                <option value="prayer">기도</option>
                                                <option value="word">말씀</option>
                                                <option value="transcribe">필사</option>
                                                <option value="qt">QT</option>
                                                <option value="other">기타 (직접 입력)</option>
                                            </select>

                                            {logForm.activity_type === 'other' && (
                                                <div className="flex gap-2">
                                                    <input
                                                        type="number"
                                                        placeholder="점수"
                                                        value={logForm.points}
                                                        onChange={e => setLogForm({ ...logForm, points: parseInt(e.target.value) || 0 })}
                                                        className="w-24 p-3 rounded-lg border font-bold"
                                                    />
                                                    <input
                                                        type="text"
                                                        placeholder="사유 (예: 친구 도와주기)"
                                                        value={logForm.content}
                                                        onChange={e => setLogForm({ ...logForm, content: e.target.value })}
                                                        className="flex-1 p-3 rounded-lg border font-bold"
                                                        required
                                                    />
                                                </div>
                                            )}

                                            {logForm.activity_type !== 'other' && (
                                                <input type="text" placeholder="내용 (선택)" value={logForm.content} onChange={e => setLogForm({ ...logForm, content: e.target.value })} className="w-full p-3 rounded-lg border font-bold" />
                                            )}
                                        </div>
                                    )}
                                    <button type="submit" className="mt-3 w-full py-3 bg-nature-green text-white rounded-lg font-bold">추가하기</button>
                                </form>
                            )}

                            <div className="overflow-y-auto flex-1 space-y-3 pr-2 custom-scrollbar">
                                {historyLogs.length === 0 ? <div className="text-center text-gray-400 py-10 font-bold">기록이 없습니다.</div> :
                                    historyLogs.map((log) => (
                                        <div key={`${log.type}-${log.id}`} className="flex items-center bg-gray-50 p-4 rounded-2xl border border-gray-100 group">
                                            <div className="text-2xl mr-4">{log.type === 'attendance' ? '📅' : '🙏'}</div>
                                            <div className="flex-1">
                                                <div className="font-bold text-gray-800">{log.name}</div>
                                                <div className="text-sm text-gray-500">{log.created_at || log.date} {log.content && `- ${log.content}`}</div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <span className="font-black text-nature-green mr-2">+{log.points}</span>
                                                <button onClick={() => handleDeleteLog(log)} className="text-red-400 hover:text-red-600 font-bold px-2 py-1 bg-white border border-red-100 rounded-lg text-sm">삭제</button>
                                            </div>
                                        </div>
                                    ))
                                }
                            </div>
                            <button onClick={() => setIsHistoryModalOpen(false)} className="mt-6 w-full py-3 bg-gray-100 rounded-xl font-bold text-gray-600 hover:bg-gray-200">닫기</button>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};
export default TeacherAdmin;
