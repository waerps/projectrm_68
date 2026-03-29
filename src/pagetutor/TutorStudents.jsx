import { Link, useSearchParams, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import axios from "axios";
import {
    TrendingUp, TrendingDown, Minus, Award,
    Phone, Video, Search, Download, ChevronDown, ChevronRight,
    ChevronLeft, Users
} from "lucide-react";
import * as XLSX from "xlsx";

const ITEMS_PER_PAGE = 5;

export default function TutorStudents() {
    const [searchParams] = useSearchParams();
    const courseId = searchParams.get("courseId");

    const [search, setSearch] = useState("");
    const [sortBy, setSortBy] = useState("name");
    const [loading, setLoading] = useState(true);
    const [courseInfo, setCourseInfo] = useState({ name: "กำลังโหลด...", studentCount: 0 });
    const [students, setStudents] = useState([]);
    const [currentPage, setCurrentPage] = useState(1);
    const navigate = useNavigate();

    const subjects = ["คณิต", "ไทย", "วิทย์", "สังคม", "อังกฤษ"];

    const getReportData = () => filteredStudents.map(student => ({
        ชื่อ: student.name,
        โรงเรียน: student.school,
        เบอร์โทร: student.phone,
        เข้าเรียน: getAttendanceRate(student) !== null
            ? `${student.totalAttended}/${student.totalClassHeld} (${getAttendanceRate(student)}%)`
            : "ไม่มีข้อมูล",
        ดูคลิป: `${Math.round((student.videoViews / student.totalVideos) * 100)}%`,
        GPA: student.gpa ?? "-",
        พัฒนาการ: getAverageImprovement(student),
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
                <td>${Math.round((student.videoViews / student.totalVideos) * 100)}%</td>
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

    const generateMockScores = (seedId) => {
        const mockScores = {};
        subjects.forEach(sub => {
            const safeSeed = seedId || 1;
            const preTest = 40 + (safeSeed * 5 % 30);
            const midTerm = preTest + 10;
            const postTest = midTerm + (safeSeed % 2 === 0 ? 15 : -5);
            const improvement = postTest - preTest;
            mockScores[sub] = {
                preTest, midTerm, postTest,
                trend: improvement > 0 ? "up" : improvement < 0 ? "down" : "stable",
                improvement: improvement > 0 ? `+${improvement}` : `${improvement}`
            };
        });
        return mockScores;
    };

    useEffect(() => {
        const fetchData = async () => {
            if (!courseId || courseId === "undefined") { setLoading(false); return; }
            try {
                const response = await axios.get(`http://localhost:3000/courses/${courseId}/students`);
                const dataFromApi = response.data;
                setCourseInfo(dataFromApi.courseInfo);
                const mappedStudents = dataFromApi.students.map((std, index) => {
                    const studentId = std.UserId || std.id || (index + 1);
                    return {
                        id: studentId,
                        name: std.name ?? 'ไม่ระบุชื่อ',
                        lineId: std.lineId || std.LineID || "ไม่มีไอดีไลน์",
                        phone: std.PhoneNo || std.phoneNo || "ไม่มีเบอร์โทร",
                        school: std.SchoolName || std.schoolName || "ไม่ระบุโรงเรียน",
                        gradeLevel: std.gradeLevel || 'ไม่ระบุชั้น',
                        gpa: std.gpa ?? '-',
                        birthDate: std.BirthOfDate ?? null,
                        totalAttended: std.totalAttended ?? 0,
                        totalClassHeld: std.totalClassHeld ?? 0,
                        scores: generateMockScores(studentId),
                        videoViews: 50 + (studentId * 10 % 50),
                        totalVideos: 100,
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

    const getAverageImprovement = (student) => {
        if (!student.scores) return "+0";
        const improvements = Object.values(student.scores).map(s => parseFloat(s.improvement.replace('+', '')));
        const avg = improvements.reduce((a, b) => a + b, 0) / improvements.length;
        return avg > 0 ? `+${avg.toFixed(0)}` : avg.toFixed(0);
    };

    const getOverallTrend = (student) => {
        if (!student.scores) return "stable";
        const trends = Object.values(student.scores).map(s => s.trend);
        const upCount = trends.filter(t => t === "up").length;
        const downCount = trends.filter(t => t === "down").length;
        if (upCount > downCount) return "up";
        if (downCount > upCount) return "down";
        return "stable";
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
            if (sortBy === "improvement") return parseFloat(getAverageImprovement(b).replace('+', '')) - parseFloat(getAverageImprovement(a).replace('+', ''));
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
                                            <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${student.name}&backgroundColor=fef3c7`} alt={student.name} className="h-full w-full object-cover" />
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
                                            </div>
                                        </div>
                                    </div>

                                    {/* ── ลบ expandedStudent button ออก เหลือแค่ trend + ปุ่มดูรายละเอียด ── */}
                                    <div className="flex items-center gap-2 md:gap-3">
                                        <div className={`px-3 py-1.5 rounded-full border flex items-center gap-1.5 ${getTrendColor(getOverallTrend(student))}`}>
                                            {getTrendIcon(getOverallTrend(student))}
                                            <span className="font-bold text-sm">{getAverageImprovement(student)}</span>
                                        </div>
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
                            <div className="p-5 grid grid-cols-2 md:grid-cols-4 gap-4 bg-neutral-50">
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
                                            <span className="font-bold text-orange-600">{Math.round((student.videoViews / student.totalVideos) * 100)}%</span>
                                        </div>
                                        <div className="h-2 bg-neutral-200 rounded-full overflow-hidden">
                                            <div className="h-full bg-gradient-to-r from-orange-500 to-orange-600" style={{ width: `${(student.videoViews / student.totalVideos) * 100}%` }} />
                                        </div>
                                    </div>
                                </div>
                                <div className="bg-white rounded-xl p-3 border border-neutral-200">
                                    <div className="flex items-center gap-2 mb-2"><Award className="h-4 w-4 text-orange-600" /><span className="text-xs font-semibold text-neutral-700">พัฒนาการรวม</span></div>
                                    <p className={`text-lg font-bold ${getOverallTrend(student) === 'up' ? 'text-green-600' : getOverallTrend(student) === 'down' ? 'text-red-600' : 'text-yellow-600'}`}>
                                        {getAverageImprovement(student)}
                                    </p>
                                </div>
                                <div className="bg-white rounded-xl p-3 border border-neutral-200">
                                    <div className="flex items-center gap-2 mb-2"><Award className="h-4 w-4 text-purple-600" /><span className="text-xs font-semibold text-neutral-700">เกรดเฉลี่ย (GPA)</span></div>
                                    <p className={`text-lg font-bold ${student.gpa >= 3.5 ? 'text-green-600' : student.gpa >= 2.5 ? 'text-orange-500' : student.gpa === '-' ? 'text-neutral-400' : 'text-red-500'}`}>
                                        {student.gpa}
                                    </p>
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