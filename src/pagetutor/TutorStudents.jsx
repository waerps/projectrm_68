import { API_URL } from "../config";
import { getFileUrl } from "../utils/fileUrl";
import { Link, useSearchParams, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import axios from "axios";
import {
    TrendingUp, TrendingDown, Minus, Award,
    Phone, Video, Search, Download, ChevronDown, ChevronRight,
    ChevronLeft, Users
} from "lucide-react";
import * as XLSX from "xlsx";
import { fmtScore as fmtScoreNum } from "../utils/examScore";

const ITEMS_PER_PAGE = 5;

// ── รูปโปรไฟล์นักเรียน ────────────────────────────────────────────────
// ใช้รูปที่อัปโหลดไว้จริง (users.Photo) ถ้ามี — ถ้ายังไม่มีรูป หรือไฟล์โหลดไม่ขึ้น
// ค่อย fallback เป็น avatar ที่ generate จากชื่อ (ข้อมูลเก่าหลายคนยังไม่ได้อัปรูป)
function StudentAvatar({ student, className = "h-full w-full object-cover" }) {
    const [imgErr, setImgErr] = useState(false);
    const uploaded = student?.Photo || student?.photo || "";
    const src = uploaded && !imgErr
        ? getFileUrl(uploaded)
        : `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(student?.name || "student")}&backgroundColor=fef3c7`;
    return (
        <img
            src={src}
            alt={student?.name || "นักเรียน"}
            className={className}
            onError={() => { if (uploaded) setImgErr(true); }}
        />
    );
}


export default function TutorStudents() {
    const [searchParams] = useSearchParams();
    const courseId = searchParams.get("courseId");

    const [search, setSearch] = useState("");
    const [sortBy, setSortBy] = useState("name");
    const [loading, setLoading] = useState(true);
    const [courseInfo, setCourseInfo] = useState({ name: "กำลังโหลด...", studentCount: 0 });
    const [students, setStudents] = useState([]);
    const [currentPage, setCurrentPage] = useState(1);
    const [examSummary, setExamSummary] = useState(null);
    const navigate = useNavigate();


    const getReportData = () => filteredStudents.map(student => ({
        ชื่อ: student.name,
        โรงเรียน: student.school,
        เบอร์โทร: student.phone,
        เข้าเรียน: getAttendanceRate(student) !== null
            ? `${student.totalAttended}/${student.totalClassHeld} (${getAttendanceRate(student)}%)`
            : "ไม่มีข้อมูล",
        ดูคลิป: student.totalVideos ? `${student.videoViews}/${student.totalVideos} (${Math.round((student.videoViews / student.totalVideos) * 100)}%)` : "ยังไม่มีคลิปในคอร์ส",
        GPA: student.gpa ?? "-",
        คะแนนสอบ: student.exam?.improvement
            ? `ก่อนเรียน ${fmtScoreNum(student.exam.improvement.from)} → ${student.exam.improvement.basis === 'pre-mid' ? 'กลางภาค' : 'หลังเรียน'} ${fmtScoreNum(student.exam.improvement.to)} (${getAverageImprovement(student)} จากเต็ม ${student.exam.improvement.max})`
            : "ยังไม่มีข้อมูลสอบ",
        // แยกคอลัมน์: คะแนนดิบใช้ดูรายคน ส่วน "พัฒนาการ" คือตัวที่เอาไปเรียง/เทียบข้ามคนได้
        พัฒนาการ: getGrowthText(student),
    }));

    const downloadExcel = () => {
        const data = getReportData();
        const ws = XLSX.utils.json_to_sheet(data);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "รายงานนักเรียน");
        ws["!cols"] = [{ wch: 30 }, { wch: 30 }, { wch: 15 }, { wch: 20 }, { wch: 10 }, { wch: 8 }, { wch: 12 }];
        XLSX.writeFile(wb, `รายงานนักเรียน_${courseInfo.name}.xlsx`);
    };

    const downloadPDF = () => {
        const printWindow = window.open("", "_blank");
        const rows = filteredStudents.map(student => {
            const rate = getAttendanceRate(student);
            return `<tr>
                <td>${student.name}</td><td>${student.school}</td><td>${student.phone}</td>
                <td style="${rate !== null && rate < 60 ? 'color:red' : ''}">
                    ${rate !== null ? `${student.totalAttended}/${student.totalClassHeld} (${rate}%)` : "ไม่มีข้อมูล"}
                </td>
                <td>${student.totalVideos ? Math.round((student.videoViews / student.totalVideos) * 100) + '%' : '-'}</td>
                <td>${student.gpa ?? "-"}</td>
                <td>${getAverageImprovement(student)}</td>
            </tr>`;
        }).join("");
        printWindow.document.write(`<!DOCTYPE html><html><head><meta charset="UTF-8">
            <title>รายงานนักเรียน - ${courseInfo.name}</title>
            <link href="https://fonts.googleapis.com/css2?family=Sarabun:wght@400;700&display=swap" rel="stylesheet">
            <style>body{font-family:'Sarabun',sans-serif;padding:24px;font-size:13px}h1{font-size:18px;margin-bottom:4px}p{color:#666;margin:2px 0 16px;font-size:12px}table{width:100%;border-collapse:collapse}th{background:#f97316;color:white;padding:8px 12px;text-align:left;font-size:12px}td{padding:7px 12px;border-bottom:1px solid #e5e7eb;font-size:12px}tr:nth-child(even) td{background:#fff7ed}@media print{body{padding:0}}</style>
            </head><body>
            <h1>รายงานนักเรียน: ${courseInfo.name}</h1>
            <p>จำนวนนักเรียน: ${filteredStudents.length} คน | วันที่: ${new Date().toLocaleDateString("th-TH")}</p>
            <table><thead><tr><th>ชื่อ</th><th>โรงเรียน</th><th>เบอร์โทร</th><th>การเข้าเรียน</th><th>ดูคลิป</th><th>GPA</th><th>พัฒนาการ</th></tr></thead>
            <tbody>${rows}</tbody></table>
            <script>window.onload=()=>window.print();</script></body></html>`);
        printWindow.document.close();
    };

    useEffect(() => {
        const fetchData = async () => {
            if (!courseId || courseId === "undefined") { setLoading(false); return; }
            try {
                // ดึงรายชื่อนักเรียน + สรุปคะแนนสอบข้ามวิชาพร้อมกัน (สรุปคะแนนพลาดได้ ไม่ทำให้หน้าพัง)
                const [response, summaryRes] = await Promise.all([
                    axios.get(`${API_URL}/coursestutor/${courseId}/students`),
                    axios.get(`${API_URL}/coursestutor/${courseId}/exam-summary`).catch((err) => {
                        console.error("Fetch exam summary failed:", err);
                        return null;
                    }),
                ]);
                const dataFromApi = response.data;
                setCourseInfo(dataFromApi.courseInfo);

                const summary = summaryRes?.data || null;
                setExamSummary(summary);
                const examByUserId = new Map((summary?.students || []).map((s) => [s.userId, s]));
                const mappedStudents = dataFromApi.students.map((std, index) => {
                    const studentId = std.UserId || std.id || (index + 1);
                    return {
                        id: studentId,
                        name: std.name ?? 'ไม่ระบุชื่อ',
                        // ★ แก้: ของเดิมไม่ได้ copy field รูปโปรไฟล์มาเลย ทำให้ StudentAvatar
                        //   เห็น student.Photo เป็น undefined เสมอ แม้ backend จะส่งรูปมาถูกต้องแล้ว
                        //   จึง fallback ไปใช้ avatar การ์ตูนตลอด ทั้งที่นักเรียนมีรูปจริงอยู่แล้ว
                        Photo: std.Photo || std.photo || null,
                        lineId: std.lineId || std.LineID || "ไม่มีไอดีไลน์",
                        phone: std.PhoneNo || std.phoneNo || "ไม่มีเบอร์โทร",
                        school: std.SchoolName || std.schoolName || "ไม่ระบุโรงเรียน",
                        gradeLevel: std.gradeLevel || 'ไม่ระบุชั้น',
                        gpa: std.gpa ?? '-',
                        birthDate: std.BirthOfDate ?? null,
                        totalAttended: std.totalAttended ?? 0,
                        totalClassHeld: std.totalClassHeld ?? 0,
                        exam: examByUserId.get(studentId) || null,   // คะแนนสอบจริงข้ามทุกวิชา
                        videoViews: std.watchedVideos ?? 0,          // จำนวนคลิปที่ดูจบแล้ว (>=80%)
                        totalVideos: std.totalVideos ?? 0,
                    };
                });
                setStudents(mappedStudents);
            } catch (error) {
                console.error("Error fetching students:", error);
                setStudents([]);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [courseId]);

    useEffect(() => { setCurrentPage(1); }, [search, sortBy]);

    const getTrendIcon = (trend) => {
        if (trend === "up") return <TrendingUp className="h-4 w-4 text-green-600" />;
        if (trend === "down") return <TrendingDown className="h-4 w-4 text-red-600" />;
        return <Minus className="h-4 w-4 text-yellow-600" />;
    };

    const getTrendColor = (trend) => {
        if (trend === "up") return "text-green-600 bg-green-50 border-green-200";
        if (trend === "down") return "text-red-600 bg-red-50 border-red-200";
        return "text-yellow-600 bg-yellow-50 border-yellow-200";
    };

    // ตัวเลขพัฒนาการรวมทั้งแพ็กเกจ — คิดจากคะแนนสอบจริง ปรับฐานทุกวิชาเป็น 20 คะแนนแล้วรวมกัน
    // นับเฉพาะวิชาที่สอบครบทั้งรอบแรกและรอบเทียบ (ฝั่ง backend คัดมาให้แล้ว)
    // ใช้ fmtScore เป็นฐานเดียวกับที่โชว์คะแนน (ปัด 2 ตำแหน่ง ตัดศูนย์ท้าย)
    // ถ้าปัดคนละจำนวนตำแหน่ง เลขในหน้าเดียวกันจะบวกลบไม่ลงตัว เช่น 16.84 − 2 ควรได้ 14.84 ไม่ใช่ 14.8
    const fmtDelta = (d) => (d > 0 ? `+${fmtScoreNum(d)}` : fmtScoreNum(d));

    const getAverageImprovement = (student) => {
        const imp = student.exam?.improvement;
        if (!imp) return "—";
        return fmtDelta(imp.delta);
    };

    // ตัวเลข "พัฒนาการ" ที่ใช้เทียบข้ามคนได้จริง — backend คำนวณด้วยสูตรกลางตัวเดียว
    // กับหน้าแอดมิน (ปิดช่องว่างที่ตัวเองมีไปได้กี่ %) ห้ามเอาผลต่างคะแนนดิบมาเทียบข้ามคน
    // เพราะเด็กที่ทำรอบแรกได้สูงอยู่แล้วมีเพดานให้เพิ่มน้อยกว่าโดยธรรมชาติ
    const getGrowth = (student) => {
        const g = student.exam?.improvement?.growth;
        return g == null ? null : g;
    };
    const getGrowthText = (student) => {
        const g = getGrowth(student);
        return g == null ? "—" : `${g}%`;
    };

    const getOverallTrend = (student) => {
        const imp = student.exam?.improvement;
        if (!imp) return "stable";
        return imp.delta > 0 ? "up" : imp.delta < 0 ? "down" : "stable";
    };

    const calculateAge = (birthDate) => {
        if (!birthDate) return '-';
        const today = new Date();
        const birth = new Date(birthDate);
        const age = today.getFullYear() - birth.getFullYear();
        const monthDiff = today.getMonth() - birth.getMonth();
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) return age - 1;
        return age;
    };

    const getAttendanceRate = (student) => {
        if (!student.totalClassHeld || student.totalClassHeld === 0) return null;
        return Math.round((student.totalAttended / student.totalClassHeld) * 100);
    };

    const getAttendanceColor = (rate) => {
        if (rate === null) return 'text-neutral-400';
        if (rate >= 80) return 'text-green-600';
        if (rate >= 60) return 'text-orange-500';
        return 'text-red-500';
    };

    const getAttendanceBarColor = (rate) => {
        if (rate >= 80) return 'bg-green-500';
        if (rate >= 60) return 'bg-orange-500';
        return 'bg-red-500';
    };

    const filteredStudents = students
        .filter(s =>
            (s.name?.toLowerCase() ?? '').includes(search.toLowerCase()) ||
            (s.lineId?.toLowerCase() ?? '').includes(search.toLowerCase()) ||
            (s.school?.toLowerCase() ?? '').includes(search.toLowerCase()) ||
            (s.phone ?? '').includes(search)
        )
        .sort((a, b) => {
            if (sortBy === "name") return a.name.localeCompare(b.name, 'th');
            // เรียงด้วย growth (ปรับเพดานแล้ว) ไม่ใช่ผลต่างคะแนนดิบ — ถ้าเรียงด้วยผลต่างดิบ
            // เด็กที่ทำรอบแรกได้สูงจะร่วงท้ายตารางเสมอทั้งที่พัฒนาขึ้นจริง
            if (sortBy === "improvement") return (getGrowth(b) ?? -1) - (getGrowth(a) ?? -1);
            if (sortBy === "videoProgress") return (b.videoViews / b.totalVideos) - (a.videoViews / a.totalVideos);
            if (sortBy === "attendance") return (getAttendanceRate(b) ?? -1) - (getAttendanceRate(a) ?? -1);
            if (sortBy === "gpa") return (parseFloat(b.gpa) || 0) - (parseFloat(a.gpa) || 0);
            return 0;
        });

    const totalPages = Math.ceil(filteredStudents.length / ITEMS_PER_PAGE);
    const paginatedStudents = filteredStudents.slice(
        (currentPage - 1) * ITEMS_PER_PAGE,
        currentPage * ITEMS_PER_PAGE
    );

    const getLowAttendanceStudents = () =>
        filteredStudents.filter(s => { const r = getAttendanceRate(s); return r !== null && r < 60; });

    const getPageNumbers = () => {
        const pages = [];
        for (let i = 1; i <= totalPages; i++) {
            if (i === 1 || i === totalPages || Math.abs(i - currentPage) <= 1) {
                pages.push(i);
            } else if (i === 2 && currentPage > 3) {
                pages.push('...');
            } else if (i === totalPages - 1 && currentPage < totalPages - 2) {
                pages.push('...');
            }
        }
        return pages.filter((p, idx) => pages.indexOf(p) === idx);
    };

    if (loading) return (
        <div className="mt-[90px] text-center p-10 font-medium text-orange-600">
            กำลังโหลดข้อมูลนักเรียน...
        </div>
    );

    return (
        <div className="space-y-6 mt-[90px]">
            <div className="">
                {/* Header */}
                <div className="mb-6">
                    <div className="mb-6 flex items-center text-sm">
                        <Link to="/tutor/courses" className="font-medium text-gray-500 hover:text-orange-600 transition">คอร์ส</Link>
                        <ChevronRight className="mx-2 h-4 w-4 text-gray-400" />
                        <span className="font-medium text-gray-800">ข้อมูลนักเรียน</span>
                    </div>
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                        <div>
                            <h1 className="text-2xl font-bold text-neutral-900">ข้อมูลนักเรียน</h1>
                            <p className="text-sm text-neutral-500 mt-1">
                                {courseInfo.name} • นักเรียนทั้งหมด {courseInfo.studentCount} คน
                            </p>
                        </div>
                        <div className="relative group">
                            <button className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-xl hover:shadow-lg hover:scale-105 transition font-medium">
                                <Download className="h-4 w-4" />ดาวน์โหลดรายงาน<ChevronDown className="h-4 w-4" />
                            </button>
                            <div className="absolute right-0 mt-1 w-44 bg-white rounded-xl border border-neutral-200 shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10">
                                <button onClick={downloadExcel} className="w-full flex items-center gap-2 px-4 py-3 text-sm text-neutral-700 hover:bg-orange-50 hover:text-orange-600 rounded-t-xl transition font-medium">📊 ดาวน์โหลด Excel</button>
                                <button onClick={downloadPDF} className="w-full flex items-center gap-2 px-4 py-3 text-sm text-neutral-700 hover:bg-orange-50 hover:text-orange-600 rounded-b-xl transition font-medium">📄 ดาวน์โหลด PDF</button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Search & Sort */}
                <div className="bg-white border border-neutral-200 rounded-xl p-3 mb-6">
                    <div className="flex flex-col md:flex-row gap-3">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
                            <input type="text" placeholder="ค้นหานักเรียน (ชื่อ, Line ID, โรงเรียน, เบอร์โทร)..."
                                value={search} onChange={(e) => setSearch(e.target.value)}
                                className="pl-10 pr-4 py-2 w-full bg-neutral-50 border border-neutral-200 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 focus:border-transparent transition" />
                        </div>
                        <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}
                            className="px-4 py-2 bg-neutral-50 border border-neutral-200 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 focus:border-transparent md:min-w-[200px]">
                            <option value="name">เรียงตามชื่อ</option>
                            <option value="attendance">เรียงตามการเข้าเรียน</option>
                            <option value="gpa">เรียงตามเกรด</option>
                            <option value="improvement">เรียงตามพัฒนาการ</option>
                            <option value="videoProgress">เรียงตามการดูคลิป</option>
                        </select>
                    </div>
                </div>

                {/* Low Attendance Warning */}
                {getLowAttendanceStudents().length > 0 && (
                    <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
                        <div className="flex items-center gap-3 mb-3">
                            <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center shrink-0">
                                <span className="text-lg">⚠️</span>
                            </div>
                            <div>
                                <p className="font-bold text-red-700 text-sm">มีนักเรียน {getLowAttendanceStudents().length} คน ที่เข้าเรียนต่ำกว่า 60%</p>
                                <p className="text-xs text-red-500 mt-0.5">ควรติดต่อนักเรียนเหล่านี้โดยเร็ว</p>
                            </div>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            {getLowAttendanceStudents().map(s => (
                                <div key={s.id} className="flex items-center gap-2 bg-white border border-red-200 rounded-lg px-3 py-1.5">
                                    <span className="text-xs font-bold text-red-700">{s.name}</span>
                                    <span className="text-xs text-red-400">{s.totalAttended}/{s.totalClassHeld} คาบ ({getAttendanceRate(s)}%)</span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Students List */}
                <div className="space-y-4">
                    {filteredStudents.length === 0 ? (
                        <div className="text-center py-12 bg-white rounded-xl border border-neutral-200">
                            <div className="text-5xl mb-3">👨‍🎓</div>
                            <p className="text-neutral-500 text-sm">ไม่พบนักเรียนในคอร์สนี้</p>
                        </div>
                    ) : paginatedStudents.map((student) => (
                        <div key={student.id} className="bg-white rounded-2xl border-2 border-neutral-200 hover:border-orange-300 transition overflow-hidden">

                            {/* Student Header */}
                            <div className="p-5 bg-gradient-to-br from-orange-50 to-amber-50 border-b border-orange-100">
                                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                    <div className="flex items-center gap-4">
                                        <div className="h-16 w-16 overflow-hidden rounded-xl border-2 border-orange-200 shrink-0 bg-white">
                                            <StudentAvatar student={student} />
                                        </div>
                                        <div>
                                            <h3 className="text-lg font-bold text-neutral-900">{student.name}</h3>
                                            {getAttendanceRate(student) !== null && getAttendanceRate(student) < 60 && (
                                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-100 text-red-600 text-xs font-bold border border-red-200 mt-1">
                                                    ⚠️ เข้าเรียนต่ำกว่า 60%
                                                </span>
                                            )}
                                            <div className="flex flex-wrap items-center gap-2 md:gap-3 text-xs text-neutral-600 mt-1">
                                                <div className="flex items-center gap-1"><span className="text-green-500 font-bold text-xs">LINE</span><span>{student.lineId}</span></div>
                                                <div className="flex items-center gap-1"><Phone className="h-3 w-3" /><span>{student.phone}</span></div>
                                                <div className="flex items-center gap-1 font-medium bg-white px-2 py-0.5 rounded border">🏫 {student.school}</div>
                                                <div className="flex items-center gap-1 font-medium bg-blue-50 text-blue-700 px-2 py-0.5 rounded border border-blue-200">{student.gradeLevel}</div>
                                                <div className="flex items-center gap-1 font-medium bg-purple-50 text-purple-700 px-2 py-0.5 rounded border border-purple-200">อายุ {calculateAge(student.birthDate)} ปี</div>
                                                {/* GPA เป็นเกรดจากโรงเรียนของนักเรียน ไม่ใช่ผลจากระบบเรา จึงย้ายมาอยู่กับข้อมูลโปรไฟล์
                                                    ไม่ให้ปนกับตัวชี้วัดผลการเรียนของสถาบัน (เข้าเรียน/ดูคลิป/พัฒนาการ) */}
                                                {student.gpa && student.gpa !== '-' && (
                                                    <div className="flex items-center gap-1 font-medium bg-white px-2 py-0.5 rounded border" title="เกรดเฉลี่ยจากโรงเรียนของนักเรียน">GPA {student.gpa}</div>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    {/* ── ลบ expandedStudent button ออก เหลือแค่ trend + ปุ่มดูรายละเอียด ── */}
                                    <div className="flex items-center gap-2 md:gap-3">
                                        {student.exam?.improvement && (
                                            <div
                                                className={`px-3 py-1.5 rounded-full border flex items-center gap-1.5 ${getTrendColor(getOverallTrend(student))}`}
                                                title={`พัฒนาการ ${getGrowthText(student)} — ปิดช่องว่างที่เหลือจากรอบแรกไปได้เท่านี้ (คะแนนดิบ ${getAverageImprovement(student)} คะแนน)`}
                                            >
                                                {getTrendIcon(getOverallTrend(student))}
                                                <span className="font-bold text-sm">{getGrowthText(student)}</span>
                                            </div>
                                        )}
                                        <button
                                            onClick={() => navigate(`/tutor/students/detail?courseId=${courseId}&studentId=${student.id}`)}
                                            className="flex items-center gap-1.5 px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white text-xs font-semibold rounded-lg transition"
                                        >
                                            ดูรายละเอียด <ChevronRight className="h-3.5 w-3.5" />
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* Quick Overview (stats cards ยังคงอยู่) */}
                            <div className="p-5 grid grid-cols-1 md:grid-cols-3 gap-4 bg-neutral-50">
                                <div className="bg-white rounded-xl p-3 border border-neutral-200">
                                    <div className="flex items-center gap-2 mb-2"><Users className="h-4 w-4 text-orange-600" /><span className="text-xs font-semibold text-neutral-700">การเข้าเรียน</span></div>
                                    {getAttendanceRate(student) === null ? <p className="text-xs text-neutral-400">ยังไม่มีข้อมูล</p> : (
                                        <div className="space-y-1.5">
                                            <div className="flex justify-between text-xs">
                                                <span className="text-neutral-600">{student.totalAttended}/{student.totalClassHeld} คาบ</span>
                                                <span className={`font-bold ${getAttendanceColor(getAttendanceRate(student))}`}>{getAttendanceRate(student)}%</span>
                                            </div>
                                            <div className="h-2 bg-neutral-200 rounded-full overflow-hidden">
                                                <div className={`h-full rounded-full ${getAttendanceBarColor(getAttendanceRate(student))}`} style={{ width: `${getAttendanceRate(student)}%` }} />
                                            </div>
                                        </div>
                                    )}
                                </div>
                                <div className="bg-white rounded-xl p-3 border border-neutral-200">
                                    <div className="flex items-center gap-2 mb-2"><Video className="h-4 w-4 text-orange-600" /><span className="text-xs font-semibold text-neutral-700">การดูคลิป</span></div>
                                    <div className="space-y-1.5">
                                        <div className="flex justify-between text-xs">
                                            <span className="text-neutral-600">{student.videoViews}/{student.totalVideos}</span>
                                            <span className="font-bold text-orange-600">{student.totalVideos ? `${Math.round((student.videoViews / student.totalVideos) * 100)}%` : "—"}</span>
                                        </div>
                                        <div className="h-2 bg-neutral-200 rounded-full overflow-hidden">
                                            <div className="h-full bg-gradient-to-r from-orange-500 to-orange-600" style={{ width: `${student.totalVideos ? (student.videoViews / student.totalVideos) * 100 : 0}%` }} />
                                        </div>
                                    </div>
                                </div>
                                <div className="bg-white rounded-xl p-3 border border-neutral-200">
                                    <div className="flex items-center gap-2 mb-2"><Award className="h-4 w-4 text-orange-600" /><span className="text-xs font-semibold text-neutral-700">พัฒนาการรวม</span></div>
                                    {student.exam?.improvement ? (
                                        <>
                                            <p className="text-sm font-bold text-neutral-800 leading-relaxed">
                                                ก่อนเรียน {fmtScoreNum(student.exam.improvement.from)} → {student.exam.improvement.basis === 'pre-mid' ? 'กลางภาค' : 'หลังเรียน'} {fmtScoreNum(student.exam.improvement.to)}
                                            </p>
                                            <p className={`text-xs font-bold mt-1 ${getOverallTrend(student) === 'up' ? 'text-green-600' : getOverallTrend(student) === 'down' ? 'text-red-600' : 'text-yellow-600'}`}>
                                                {getAverageImprovement(student)} คะแนน
                                                <span className="font-medium text-neutral-400">
                                                    {" "}· เต็ม {student.exam.improvement.max} (นับ {student.exam.improvement.subjectsCounted} จาก {examSummary?.subjectCount ?? student.exam.bySubject.length} วิชา)
                                                </span>
                                            </p>
                                            {student.exam.improvement.growth != null && (
                                                <p className="text-xs text-neutral-500 mt-1 leading-relaxed">
                                                    พัฒนาการ <span className="font-bold text-neutral-700">{getGrowthText(student)}</span> ของช่องว่างที่เหลือ
                                                    {student.exam.improvement.growthCapped
                                                        ? " · พื้นฐานสูงอยู่แล้ว ตัวเลขนี้เทียบกับเด็กพื้นฐานต่ำกว่าตรง ๆ ไม่ได้"
                                                        : ""}
                                                </p>
                                            )}
                                        </>
                                    ) : student.exam?.latest ? (
                                        <>
                                            <p className="text-sm font-bold text-neutral-800 leading-relaxed">
                                                ได้ {fmtScoreNum(student.exam.latest.score)} จากเต็ม {student.exam.latest.max} คะแนน
                                            </p>
                                            <p className="text-xs text-neutral-400 mt-1">
                                                สอบแล้ว {student.exam.latest.subjectsCounted} วิชา · ยังเทียบพัฒนาการไม่ได้ เพราะมีแค่รอบเดียว
                                            </p>
                                        </>
                                    ) : (
                                        <p className="text-lg font-bold text-neutral-300">ยังไม่มีข้อมูลสอบ</p>
                                    )}
                                </div>
                            </div>

                        </div>
                    ))}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                    <div className="mt-6 flex items-center justify-between">
                        <p className="text-sm text-neutral-500">
                            แสดง <span className="font-semibold text-neutral-700">{(currentPage - 1) * ITEMS_PER_PAGE + 1}–{Math.min(currentPage * ITEMS_PER_PAGE, filteredStudents.length)}</span>
                            {' '}จาก <span className="font-semibold text-neutral-700">{filteredStudents.length}</span> คน
                        </p>
                        <div className="flex items-center gap-1.5">
                            <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}
                                className="flex h-9 w-9 items-center justify-center rounded-lg border border-neutral-200 bg-white text-neutral-600 hover:border-orange-300 hover:text-orange-600 disabled:opacity-30 disabled:cursor-not-allowed transition">
                                <ChevronLeft className="h-4 w-4" />
                            </button>
                            {getPageNumbers().map((page, idx) =>
                                page === '...' ? (
                                    <span key={`dots-${idx}`} className="flex h-9 w-9 items-center justify-center text-neutral-400 text-sm">…</span>
                                ) : (
                                    <button key={page} onClick={() => setCurrentPage(page)}
                                        className={`flex h-9 w-9 items-center justify-center rounded-lg text-sm font-medium transition ${currentPage === page ? 'bg-orange-500 text-white shadow-sm' : 'border border-neutral-200 bg-white text-neutral-600 hover:border-orange-300 hover:text-orange-600'}`}>
                                        {page}
                                    </button>
                                )
                            )}
                            <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}
                                className="flex h-9 w-9 items-center justify-center rounded-lg border border-neutral-200 bg-white text-neutral-600 hover:border-orange-300 hover:text-orange-600 disabled:opacity-30 disabled:cursor-not-allowed transition">
                                <ChevronRight className="h-4 w-4" />
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}