import { Link, useSearchParams } from "react-router-dom";
import { useState, useEffect } from "react";
import axios from "axios";
import {
    ChevronRight, Users, Video, CheckCircle, XCircle,
    PlayCircle, Clock, TrendingUp, TrendingDown, Minus,
    Calendar, BarChart2, Award, ChevronLeft, ChevronRight as ChevronRightIcon
} from "lucide-react";

// ── Mock helpers (เหมือนเดิม) ────────────────────────────────────────
const mockAttendance = (studentId, totalClassHeld) => {
    const records = [];
    const base = new Date("2025-01-06");
    for (let i = 0; i < totalClassHeld; i++) {
        const d = new Date(base);
        d.setDate(base.getDate() + i * 7);
        records.push({
            date: d.toISOString().slice(0, 10),
            subject: ["คณิต", "ไทย", "วิทย์", "สังคม", "อังกฤษ"][i % 5],
            status: (studentId + i) % 5 === 0 ? "absent" : "present",
            startTime: "09:00",
            endTime: "11:00",
        });
    }
    return records;
};

const mockVideos = (studentId) => {
    const titles = [
        "บทที่ 1 – เลขยกกำลัง", "บทที่ 2 – สมการเชิงเส้น", "บทที่ 3 – ระบบสมการ",
        "บทที่ 4 – ฟังก์ชัน", "บทที่ 5 – อสมการ", "บทที่ 6 – เรขาคณิต",
        "บทที่ 7 – สถิติเบื้องต้น", "บทที่ 8 – ความน่าจะเป็น",
        "บทที่ 9 – ตรีโกณมิติ", "บทที่ 10 – แคลคูลัส",
    ];
    return titles.map((title, i) => {
        const watched = (studentId + i) % 3 !== 0;
        const watchedDate = new Date("2025-01-10");
        watchedDate.setDate(watchedDate.getDate() + i * 5);
        return {
            id: i + 1, title,
            duration: `${30 + (i * 7 % 30)} นาที`,
            watched,
            watchedAt: watched ? watchedDate.toISOString().slice(0, 10) : null,
            progress: watched ? 100 : (studentId * i) % 80,
        };
    });
};

// ── Mock scores (เหมือนเดิม) ──────────────
const subjects = ["คณิต", "ไทย", "วิทย์", "สังคม", "อังกฤษ"];
const subjectColors = {
    คณิต: "bg-orange-500", ไทย: "bg-pink-500", วิทย์: "bg-blue-500",
    สังคม: "bg-yellow-600", อังกฤษ: "bg-purple-500",
};

const generateMockScores = (seedId) => {
    const mockScores = {};
    subjects.forEach(sub => {
        const safeSeed = seedId || 1;
        const preTest  = 40 + (safeSeed * 5 % 30);
        const midTerm  = preTest + 10;
        const postTest = midTerm + (safeSeed % 2 === 0 ? 15 : -5);
        const improvement = postTest - preTest;
        mockScores[sub] = {
            preTest, midTerm, postTest,
            trend: improvement > 0 ? "up" : improvement < 0 ? "down" : "stable",
            improvement: improvement > 0 ? `+${improvement}` : `${improvement}`,
        };
    });
    return mockScores;
};

// ── ✨ Pagination Component ────────────────────────────────────────
const Pagination = ({ currentPage, totalPages, onPageChange }) => {
    const pages = [];
    const maxVisible = 5;
    
    let startPage = Math.max(1, currentPage - Math.floor(maxVisible / 2));
    let endPage = Math.min(totalPages, startPage + maxVisible - 1);
    
    if (endPage - startPage < maxVisible - 1) {
        startPage = Math.max(1, endPage - maxVisible + 1);
    }
    
    for (let i = startPage; i <= endPage; i++) {
        pages.push(i);
    }
    
    if (totalPages <= 1) return null;
    
    return (
        <div className="flex items-center justify-center gap-2 py-4">
            <button
                onClick={() => onPageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="flex items-center gap-1 px-3 py-2 rounded-lg border border-neutral-300 text-neutral-700 hover:bg-neutral-50 disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
                <ChevronLeft className="h-4 w-4" />
                <span className="text-sm font-medium">ก่อนหน้า</span>
            </button>
            
            {startPage > 1 && (
                <>
                    <button
                        onClick={() => onPageChange(1)}
                        className="px-3 py-2 rounded-lg border border-neutral-300 text-neutral-700 hover:bg-neutral-50 transition text-sm font-medium"
                    >
                        1
                    </button>
                    {startPage > 2 && <span className="text-neutral-400">...</span>}
                </>
            )}
            
            {pages.map(page => (
                <button
                    key={page}
                    onClick={() => onPageChange(page)}
                    className={`px-3 py-2 rounded-lg border text-sm font-medium transition ${
                        page === currentPage
                            ? "bg-orange-500 text-white border-orange-500"
                            : "border-neutral-300 text-neutral-700 hover:bg-neutral-50"
                    }`}
                >
                    {page}
                </button>
            ))}
            
            {endPage < totalPages && (
                <>
                    {endPage < totalPages - 1 && <span className="text-neutral-400">...</span>}
                    <button
                        onClick={() => onPageChange(totalPages)}
                        className="px-3 py-2 rounded-lg border border-neutral-300 text-neutral-700 hover:bg-neutral-50 transition text-sm font-medium"
                    >
                        {totalPages}
                    </button>
                </>
            )}
            
            <button
                onClick={() => onPageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="flex items-center gap-1 px-3 py-2 rounded-lg border border-neutral-300 text-neutral-700 hover:bg-neutral-50 disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
                <span className="text-sm font-medium">ถัดไป</span>
                <ChevronRightIcon className="h-4 w-4" />
            </button>
        </div>
    );
};

// ── Component ────────────────────────────────────────────
export default function TutorStudentDetail() {
    const [searchParams] = useSearchParams();
    const courseId  = searchParams.get("courseId");
    const studentId = searchParams.get("studentId");

    const [loading, setLoading] = useState(true);
    const [student, setStudent] = useState(null);
    const [attendance, setAttendance] = useState([]);
    const [videos, setVideos] = useState([]);
    const [scores, setScores] = useState({});
    const [activeTab, setActiveTab] = useState("attendance");
    
    // ✨ Pagination States
    const [attendancePage, setAttendancePage] = useState(1);
    const [videosPage, setVideosPage] = useState(1);
    const itemsPerPage = 10; // จำนวนรายการต่อหน้า

    useEffect(() => {
        const fetchAll = async () => {
            try {
                const res = await axios.get(`http://localhost:3000/courses/${courseId}/students`);
                const found = res.data.students.find(
                    s => String(s.UserId || s.id) === String(studentId)
                );
                if (!found) { setLoading(false); return; }

                const sid = found.UserId || found.id || Number(studentId);
                setStudent({
                    ...found,
                    name: found.name,
                    school: found.SchoolName || found.schoolName || "ไม่ระบุ",
                    phone: found.PhoneNo || found.phoneNo || "-",
                    totalAttended: found.totalAttended ?? 0,
                    totalClassHeld: found.totalClassHeld ?? 0,
                });

                setScores(generateMockScores(sid));

                try {
                    const attRes = await axios.get(
                        `http://localhost:3000/courses/${courseId}/students/${studentId}/attendance`
                    );
                    console.log('attendance data:', attRes.data)
                    setAttendance(attRes.data);
                } catch {
                    setAttendance([]) // ← ถ้า error ให้แสดงว่าไม่มีข้อมูล
                }

                try {
                    const vidRes = await axios.get(
                        `http://localhost:3000/courses/${courseId}/students/${studentId}/videos`
                    );
                    setVideos(vidRes.data);
                } catch {
                    setVideos(mockVideos(Number(studentId)));
                }
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchAll();
    }, [courseId, studentId]);

    // ✨ Reset pagination when changing tabs
    useEffect(() => {
        setAttendancePage(1);
        setVideosPage(1);
    }, [activeTab]);

    // ── Derived stats (เหมือนเดิม) ──────────────────────────────────
    const attendedCount  = attendance.filter(a => a.status === "present").length;
    const absentCount    = attendance.filter(a => a.status === "absent").length;
    const attendanceRate = attendance.length ? Math.round((attendedCount / attendance.length) * 100) : 0;
    const watchedCount   = videos.filter(v => v.watched).length;
    const videoRate      = videos.length ? Math.round((watchedCount / videos.length) * 100) : 0;

    // ✨ Paginated Data
    const totalAttendancePages = Math.ceil(attendance.length / itemsPerPage);
    const totalVideosPages = Math.ceil(videos.length / itemsPerPage);
    
    const paginatedAttendance = attendance.slice(
        (attendancePage - 1) * itemsPerPage,
        attendancePage * itemsPerPage
    );
    
    const paginatedVideos = videos.slice(
        (videosPage - 1) * itemsPerPage,
        videosPage * itemsPerPage
    );

    const getAverageImprovement = () => {
        if (!scores || !Object.keys(scores).length) return "+0";
        const vals = Object.values(scores).map(s => parseFloat(s.improvement.replace('+', '')));
        const avg = vals.reduce((a, b) => a + b, 0) / vals.length;
        return avg > 0 ? `+${avg.toFixed(0)}` : avg.toFixed(0);
    };
    
    const getOverallTrend = () => {
        if (!scores || !Object.keys(scores).length) return "stable";
        const trends = Object.values(scores).map(s => s.trend);
        const up = trends.filter(t => t === "up").length;
        const dn = trends.filter(t => t === "down").length;
        return up > dn ? "up" : dn > up ? "down" : "stable";
    };

    const getTrendIcon = (trend) => {
        if (trend === "up")   return <TrendingUp   className="h-4 w-4 text-green-600" />;
        if (trend === "down") return <TrendingDown  className="h-4 w-4 text-red-600" />;
        return <Minus className="h-4 w-4 text-yellow-600" />;
    };
    
    const getTrendColor = (trend) => {
        if (trend === "up")   return "text-green-600 bg-green-50 border-green-200";
        if (trend === "down") return "text-red-600 bg-red-50 border-red-200";
        return "text-yellow-600 bg-yellow-50 border-yellow-200";
    };

    const rateColor = attendanceRate >= 80 ? "bg-green-500" : attendanceRate >= 60 ? "bg-orange-500" : "bg-red-500";
    const rateText  = attendanceRate >= 80 ? "text-green-600" : attendanceRate >= 60 ? "text-orange-500" : "text-red-500";

    if (loading) return (
        <div className="mt-[90px] text-center p-10 text-orange-600 font-medium">กำลังโหลดข้อมูล...</div>
    );
    if (!student) return (
        <div className="mt-[90px] text-center p-10 text-neutral-500">ไม่พบข้อมูลนักเรียน</div>
    );

    return (
        <div className="space-y-6 mt-[90px]">

            {/* Breadcrumb & Profile Card (เหมือนเดิม) */}
            <div className="flex items-center text-sm text-neutral-500 gap-2">
                <Link to="/tutor/courses" className="hover:text-orange-600 transition font-medium">คอร์ส</Link>
                <ChevronRight className="h-4 w-4" />
                <Link to={`/tutor/students?courseId=${courseId}`} className="hover:text-orange-600 transition font-medium">ข้อมูลนักเรียน</Link>
                <ChevronRight className="h-4 w-4" />
                <span className="text-neutral-800 font-semibold">{student.name}</span>
            </div>

            <div className="bg-gradient-to-br from-orange-50 to-amber-50 border-2 border-orange-200 rounded-2xl p-5">
                <div className="flex flex-col md:flex-row md:items-center gap-4">
                    <div className="h-20 w-20 rounded-xl border-2 border-orange-200 overflow-hidden shrink-0 bg-white">
                        <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${student.name}&backgroundColor=fef3c7`} alt={student.name} className="h-full w-full object-cover" />
                    </div>
                    <div className="flex-1">
                        <h1 className="text-xl font-bold text-neutral-900">{student.name}</h1>
                        <div className="flex flex-wrap gap-2 mt-1 text-xs text-neutral-600">
                            <span className="bg-white border rounded px-2 py-0.5">🏫 {student.school}</span>
                            <span className="bg-white border rounded px-2 py-0.5">📞 {student.phone}</span>
                            <span className="bg-blue-50 text-blue-700 border border-blue-200 rounded px-2 py-0.5">{student.gradeLevel}</span>
                        </div>
                    </div>
                    <div className="flex gap-3 flex-wrap">
                        <div className="bg-white border border-green-200 rounded-xl px-4 py-2 text-center">
                            <p className="text-xs text-neutral-500 mb-0.5">เข้าเรียน</p>
                            <p className={`text-lg font-bold ${rateText}`}>{attendanceRate}%</p>
                            <p className="text-xs text-neutral-400">{attendedCount}/{attendance.length} คาบ</p>
                        </div>
                        <div className="bg-white border border-orange-200 rounded-xl px-4 py-2 text-center">
                            <p className="text-xs text-neutral-500 mb-0.5">ดูคลิป</p>
                            <p className="text-lg font-bold text-orange-600">{videoRate}%</p>
                            <p className="text-xs text-neutral-400">{watchedCount}/{videos.length} คลิป</p>
                        </div>
                        <div className={`bg-white border rounded-xl px-4 py-2 text-center ${getTrendColor(getOverallTrend())}`}>
                            <p className="text-xs mb-0.5 opacity-70">พัฒนาการ</p>
                            <div className="flex items-center justify-center gap-1">
                                {getTrendIcon(getOverallTrend())}
                                <p className="text-lg font-bold">{getAverageImprovement()}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Tabs (เหมือนเดิม) */}
            <div className="flex gap-1 bg-neutral-100 p-1 rounded-xl w-fit flex-wrap">
                {[
                    { key: "attendance", label: "ตารางเข้าเรียน", icon: <Calendar className="h-4 w-4" /> },
                    { key: "videos",     label: "รายการคลิป",     icon: <Video className="h-4 w-4" /> },
                    { key: "scores",     label: "คะแนนสอบ",       icon: <Award className="h-4 w-4" /> },
                    { key: "overview",   label: "ภาพรวม",          icon: <BarChart2 className="h-4 w-4" /> },
                ].map(tab => (
                    <button key={tab.key} onClick={() => setActiveTab(tab.key)}
                        className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold transition ${
                            activeTab === tab.key ? "bg-white shadow text-orange-600" : "text-neutral-500 hover:text-neutral-700"
                        }`}>
                        {tab.icon}{tab.label}
                    </button>
                ))}
            </div>

            {/* ── Tab: Attendance with Pagination ── */}
            {activeTab === "attendance" && (
                <div className="bg-white border border-neutral-200 rounded-2xl overflow-hidden">
                    <div className="p-4 border-b border-neutral-100 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Users className="h-5 w-5 text-orange-600" />
                            <h2 className="font-bold text-neutral-900">ประวัติการเข้าเรียนรายคาบ</h2>
                        </div>
                        <div className="flex gap-2 text-xs font-semibold">
                            <span className="bg-green-100 text-green-700 px-2 py-1 rounded-full">มา {attendedCount} คาบ</span>
                            <span className="bg-red-100 text-red-700 px-2 py-1 rounded-full">ขาด {absentCount} คาบ</span>
                        </div>
                    </div>
                    <div className="px-4 py-3 border-b border-neutral-100 bg-neutral-50">
                        <div className="flex justify-between text-xs text-neutral-500 mb-1">
                            <span>อัตราการเข้าเรียน</span>
                            <span className={`font-bold ${rateText}`}>{attendanceRate}%</span>
                        </div>
                        <div className="h-2.5 bg-neutral-200 rounded-full overflow-hidden">
                            <div className={`h-full rounded-full transition-all ${rateColor}`} style={{ width: `${attendanceRate}%` }} />
                        </div>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="bg-neutral-50 text-neutral-500 text-xs">
                                    <th className="text-left px-4 py-3 font-semibold">วันที่</th>
                                    <th className="text-left px-4 py-3 font-semibold">วิชา</th>
                                    <th className="text-left px-4 py-3 font-semibold">เวลา</th>
                                    <th className="text-center px-4 py-3 font-semibold">สถานะ</th>
                                </tr>
                            </thead>
                            <tbody>
                                {paginatedAttendance.length === 0 ? (
                                    <tr><td colSpan={4} className="text-center py-10 text-neutral-400">ยังไม่มีข้อมูลการเข้าเรียน</td></tr>
                                ) : paginatedAttendance.map((rec, idx) => (
                                    <tr key={idx} className={`border-t border-neutral-100 ${rec.status === "absent" ? "bg-red-50" : "hover:bg-neutral-50"}`}>
                                        <td className="px-4 py-3 font-medium text-neutral-800">
                                        {new Date(rec.date + 'T00:00:00').toLocaleDateString("th-TH", { weekday: "short", year: "numeric", month: "short", day: "numeric" })}
                                        </td>
                                        <td className="px-4 py-3 text-neutral-600">{rec.subject}</td>
                                        <td className="px-4 py-3 text-neutral-500 text-xs">{rec.startTime} – {rec.endTime} น.</td>
                                        <td className="px-4 py-3 text-center">
                                            {rec.status === "present" ? (
                                                <span className="inline-flex items-center gap-1 bg-green-100 text-green-700 text-xs font-bold px-2.5 py-1 rounded-full">
                                                    <CheckCircle className="h-3.5 w-3.5" /> มาเรียน
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center gap-1 bg-red-100 text-red-600 text-xs font-bold px-2.5 py-1 rounded-full">
                                                    <XCircle className="h-3.5 w-3.5" /> ขาดเรียน
                                                </span>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    
                    {/* ✨ Pagination */}
                    <Pagination 
                        currentPage={attendancePage}
                        totalPages={totalAttendancePages}
                        onPageChange={setAttendancePage}
                    />
                </div>
            )}

            {/* ── Tab: Videos with Pagination ── */}
            {activeTab === "videos" && (
                <div className="bg-white border border-neutral-200 rounded-2xl overflow-hidden">
                    <div className="p-4 border-b border-neutral-100 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Video className="h-5 w-5 text-orange-600" />
                            <h2 className="font-bold text-neutral-900">รายการคลิปทั้งหมด</h2>
                        </div>
                        <div className="flex gap-2 text-xs font-semibold">
                            <span className="bg-orange-100 text-orange-700 px-2 py-1 rounded-full">▶ ดูแล้ว {watchedCount} คลิป</span>
                            <span className="bg-neutral-100 text-neutral-600 px-2 py-1 rounded-full">⏸ ยังไม่ดู {videos.length - watchedCount} คลิป</span>
                        </div>
                    </div>
                    <div className="px-4 py-3 border-b border-neutral-100 bg-neutral-50">
                        <div className="flex justify-between text-xs text-neutral-500 mb-1">
                            <span>ความคืบหน้าการดูคลิป</span>
                            <span className="font-bold text-orange-600">{videoRate}%</span>
                        </div>
                        <div className="h-2.5 bg-neutral-200 rounded-full overflow-hidden">
                            <div className="h-full bg-gradient-to-r from-orange-500 to-orange-400 rounded-full transition-all" style={{ width: `${videoRate}%` }} />
                        </div>
                    </div>
                    <div className="divide-y divide-neutral-100">
                        {paginatedVideos.length === 0 ? (
                            <div className="text-center py-10 text-neutral-400">ยังไม่มีคลิปในคอร์สนี้</div>
                        ) : paginatedVideos.map((vid) => (
                            <div key={vid.id} className={`flex items-center gap-4 px-4 py-3.5 ${vid.watched ? "" : "bg-neutral-50"}`}>
                                <div className={`h-10 w-10 rounded-xl flex items-center justify-center shrink-0 ${vid.watched ? "bg-orange-100" : "bg-neutral-200"}`}>
                                    <PlayCircle className={`h-5 w-5 ${vid.watched ? "text-orange-600" : "text-neutral-400"}`} />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className={`text-sm font-semibold truncate ${vid.watched ? "text-neutral-900" : "text-neutral-400"}`}>{vid.title}</p>
                                    <div className="flex items-center gap-3 mt-0.5 text-xs text-neutral-400">
                                        <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{vid.duration}</span>
                                        {vid.watchedAt && (
                                            <span>ดูเมื่อ {new Date(vid.watchedAt).toLocaleDateString("th-TH", { day: "numeric", month: "short", year: "numeric" })}</span>
                                        )}
                                    </div>
                                    {!vid.watched && vid.progress > 0 && (
                                        <div className="mt-1.5 flex items-center gap-2">
                                            <div className="flex-1 h-1.5 bg-neutral-200 rounded-full overflow-hidden">
                                                <div className="h-full bg-orange-400 rounded-full" style={{ width: `${vid.progress}%` }} />
                                            </div>
                                            <span className="text-xs text-orange-500 font-medium">{vid.progress}%</span>
                                        </div>
                                    )}
                                </div>
                                <div className="shrink-0">
                                    {vid.watched ? (
                                        <span className="inline-flex items-center gap-1 bg-orange-100 text-orange-700 text-xs font-bold px-2.5 py-1 rounded-full">
                                            <CheckCircle className="h-3.5 w-3.5" /> ดูแล้ว
                                        </span>
                                    ) : (
                                        <span className="inline-flex items-center gap-1 bg-neutral-200 text-neutral-500 text-xs font-bold px-2.5 py-1 rounded-full">ยังไม่ดู</span>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                    
                    {/* ✨ Pagination */}
                    <Pagination 
                        currentPage={videosPage}
                        totalPages={totalVideosPages}
                        onPageChange={setVideosPage}
                    />
                </div>
            )}


            {/* ── Tab: Scores (ย้ายมาจาก TutorStudents) ── */}
            {activeTab === "scores" && (
                <div className="bg-white border border-neutral-200 rounded-2xl overflow-hidden">
                    <div className="p-4 border-b border-neutral-100 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Award className="h-5 w-5 text-orange-600" />
                            <h2 className="font-bold text-neutral-900">คะแนนสอบทั้ง 5 วิชาหลัก</h2>
                        </div>
                        <span className="text-xs text-neutral-400 bg-neutral-100 px-2 py-1 rounded-full">ข้อมูลจำลอง</span>
                    </div>
                    <div className="px-5 py-3 border-b border-neutral-100 bg-neutral-50 flex items-center justify-between">
                        <span className="text-xs text-neutral-500">พัฒนาการรวมเฉลี่ย</span>
                        <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full border text-sm font-bold ${getTrendColor(getOverallTrend())}`}>
                            {getTrendIcon(getOverallTrend())}
                            {getAverageImprovement()} คะแนน
                        </div>
                    </div>
                    <div className="p-5 space-y-3">
                        {subjects.map((subject) => {
                            const s = scores[subject];
                            if (!s) return null;
                            return (
                                <div key={subject} className="bg-neutral-50 rounded-xl p-4 border border-neutral-200">
                                    <div className="flex items-center justify-between mb-3">
                                        <div className="flex items-center gap-2">
                                            <div className={`w-3 h-3 rounded-full ${subjectColors[subject]}`} />
                                            <span className="font-semibold text-neutral-900">{subject}</span>
                                        </div>
                                        <div className={`px-2 py-1 rounded-full flex items-center gap-1 text-xs border ${getTrendColor(s.trend)}`}>
                                            {getTrendIcon(s.trend)}
                                            <span className="font-bold">{s.improvement}</span>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-4 gap-2">
                                        <div className="bg-white p-2 rounded-lg text-center border border-neutral-200">
                                            <p className="text-xs text-neutral-500 mb-1">ก่อนเรียน</p>
                                            <p className="text-lg font-bold text-neutral-900">{s.preTest}</p>
                                        </div>
                                        <div className="bg-white p-2 rounded-lg text-center border border-neutral-200">
                                            <p className="text-xs text-neutral-500 mb-1">กลางภาค</p>
                                            <p className="text-lg font-bold text-neutral-900">{s.midTerm}</p>
                                        </div>
                                        <div className="bg-orange-50 p-2 rounded-lg text-center border border-orange-200">
                                            <p className="text-xs text-orange-600 mb-1">หลังเรียน</p>
                                            <p className="text-lg font-bold text-orange-600">{s.postTest}</p>
                                        </div>
                                        <div className="flex items-end justify-center gap-1 bg-white p-2 rounded-lg border border-neutral-200">
                                            {["preTest", "midTerm", "postTest"].map((test, idx) => (
                                                <div key={idx}
                                                    className={`w-2 rounded-t ${idx === 2 ? "bg-orange-500" : "bg-neutral-300"}`}
                                                    style={{ height: `${Math.max((s[test] / 100) * 30, 2)}px` }}
                                                />
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* ── Tab: Overview ── */}
            {activeTab === "overview" && (
                <div className="space-y-4">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        {[
                            { label: "คาบทั้งหมด",     value: attendance.length,                      color: "text-neutral-700", icon: <Calendar className="h-5 w-5 text-neutral-500" /> },
                            { label: "มาเรียน",         value: `${attendedCount} คาบ`,                 color: "text-green-600",   icon: <CheckCircle className="h-5 w-5 text-green-500" /> },
                            { label: "ขาดเรียน",        value: `${absentCount} คาบ`,                   color: "text-red-500",     icon: <XCircle className="h-5 w-5 text-red-400" /> },
                            { label: "คลิปที่ยังไม่ดู", value: `${videos.length - watchedCount} คลิป`, color: "text-orange-600",  icon: <Video className="h-5 w-5 text-orange-500" /> },
                        ].map((s, i) => (
                            <div key={i} className="bg-white border border-neutral-200 rounded-xl p-4">
                                <div className="flex items-center gap-2 mb-2">{s.icon}<span className="text-xs text-neutral-500 font-medium">{s.label}</span></div>
                                <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
                            </div>
                        ))}
                    </div>

                    {/* Attendance Timeline */}
                    <div className="bg-white border border-neutral-200 rounded-2xl p-5">
                        <div className="flex items-center gap-2 mb-4">
                            <TrendingUp className="h-5 w-5 text-orange-600" />
                            <h2 className="font-bold text-neutral-900">Timeline การเข้าเรียน</h2>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            {attendance.map((rec, idx) => (
                                <div key={idx}
                                    title={`${rec.date} – ${rec.subject} – ${rec.status === "present" ? "มาเรียน" : "ขาดเรียน"}`}
                                    className={`group relative h-10 w-10 rounded-lg flex items-center justify-center text-xs font-bold cursor-default border-2 transition ${
                                        rec.status === "present"
                                            ? "bg-green-100 border-green-300 text-green-700"
                                            : "bg-red-100 border-red-300 text-red-600"
                                    }`}>
                                    {idx + 1}
                                    <div className="absolute bottom-full mb-1.5 left-1/2 -translate-x-1/2 bg-neutral-800 text-white text-xs rounded-lg px-2 py-1.5 whitespace-nowrap opacity-0 group-hover:opacity-100 transition pointer-events-none z-10">
                                        {new Date(rec.date).toLocaleDateString("th-TH", { day: "numeric", month: "short" })}
                                        <br />{rec.subject} • {rec.status === "present" ? "มา" : "ขาด"}
                                    </div>
                                </div>
                            ))}
                        </div>
                        <div className="flex gap-4 mt-3 text-xs text-neutral-500">
                            <span className="flex items-center gap-1.5"><span className="h-3 w-3 rounded bg-green-300 inline-block" /> มาเรียน</span>
                            <span className="flex items-center gap-1.5"><span className="h-3 w-3 rounded bg-red-300 inline-block" /> ขาดเรียน</span>
                        </div>
                    </div>

                    {/* Video progress overview */}
                    <div className="bg-white border border-neutral-200 rounded-2xl p-5">
                        <div className="flex items-center gap-2 mb-4">
                            <BarChart2 className="h-5 w-5 text-orange-600" />
                            <h2 className="font-bold text-neutral-900">ความคืบหน้าคลิป</h2>
                        </div>
                        <div className="space-y-2.5">
                            {videos.map((vid) => (
                                <div key={vid.id} className="flex items-center gap-3">
                                    <span className="text-xs text-neutral-500 w-32 truncate shrink-0">{vid.title}</span>
                                    <div className="flex-1 h-2.5 bg-neutral-100 rounded-full overflow-hidden">
                                        <div className={`h-full rounded-full ${vid.watched ? "bg-orange-500" : "bg-neutral-300"}`}
                                            style={{ width: `${vid.watched ? 100 : vid.progress}%` }} />
                                    </div>
                                    <span className={`text-xs font-bold w-10 text-right ${vid.watched ? "text-orange-600" : "text-neutral-400"}`}>
                                        {vid.watched ? "100%" : `${vid.progress}%`}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
}