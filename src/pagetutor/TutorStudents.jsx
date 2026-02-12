import { Link } from "react-router-dom"
import { ChevronRight } from "lucide-react"
import { useState } from "react";
import {
    ArrowLeft,
    TrendingUp,
    TrendingDown,
    Minus,
    Calendar,
    Award,
    Mail,
    Phone,
    Video,
    Search,
    Download,
    MessageCircle,
    ChevronDown,
} from "lucide-react";

export default function TutorStudents() {
    const [search, setSearch] = useState("");
    const [sortBy, setSortBy] = useState("name");
    const [expandedStudent, setExpandedStudent] = useState(null);

    const courseInfo = {
        id: 1,
        name: "คอร์สเปิดเทอม ป.6 เทอม 1/2567",
        studentCount: 24,
    };

    const students = [
        {
            id: 1,
            name: "ด.ช. สมชาติ ใจดี",
            email: "somchat@email.com",
            phone: "081-111-2222",
            scores: {
                คณิต: { preTest: 45, midTerm: 68, postTest: 82, trend: "up", improvement: "+37" },
                ไทย: { preTest: 52, midTerm: 65, postTest: 75, trend: "up", improvement: "+23" },
                วิทย์: { preTest: 48, midTerm: 62, postTest: 78, trend: "up", improvement: "+30" },
                สังคม: { preTest: 55, midTerm: 70, postTest: 80, trend: "up", improvement: "+25" },
                อังกฤษ: { preTest: 40, midTerm: 58, postTest: 72, trend: "up", improvement: "+32" },
            },
            weakChapters: {
                คณิต: ["บทที่ 2", "บทที่ 5"],
                วิทย์: ["บทที่ 3"],
                อังกฤษ: ["Grammar", "Reading"],
            },
            videoViews: 86,
            totalVideos: 120,
            lastAccess: "2 ชม. ที่แล้ว",
        },
        {
            id: 2,
            name: "ด.ญ. สุดา รักเรียน",
            email: "suda@email.com",
            phone: "082-333-4444",
            scores: {
                คณิต: { preTest: 72, midTerm: 75, postTest: 78, trend: "stable", improvement: "+6" },
                ไทย: { preTest: 80, midTerm: 82, postTest: 85, trend: "stable", improvement: "+5" },
                วิทย์: { preTest: 75, midTerm: 78, postTest: 80, trend: "stable", improvement: "+5" },
                สังคม: { preTest: 78, midTerm: 80, postTest: 82, trend: "stable", improvement: "+4" },
                อังกฤษ: { preTest: 70, midTerm: 73, postTest: 76, trend: "stable", improvement: "+6" },
            },
            weakChapters: {
                คณิต: ["บทที่ 7"],
            },
            videoViews: 120,
            totalVideos: 120,
            lastAccess: "1 วัน ที่แล้ว",
        },
        {
            id: 3,
            name: "ด.ช. วิทย์ ช่างคิด",
            email: "wit@email.com",
            phone: "083-555-6666",
            scores: {
                คณิต: { preTest: 85, midTerm: 88, postTest: 92, trend: "up", improvement: "+7" },
                ไทย: { preTest: 82, midTerm: 85, postTest: 88, trend: "up", improvement: "+6" },
                วิทย์: { preTest: 88, midTerm: 90, postTest: 94, trend: "up", improvement: "+6" },
                สังคม: { preTest: 80, midTerm: 83, postTest: 87, trend: "up", improvement: "+7" },
                อังกฤษ: { preTest: 78, midTerm: 82, postTest: 86, trend: "up", improvement: "+8" },
            },
            weakChapters: {},
            videoViews: 110,
            totalVideos: 120,
            lastAccess: "5 ชม. ที่แล้ว",
        },
        {
            id: 4,
            name: "ด.ญ. มานี ขยัน",
            email: "manee@email.com",
            phone: "084-777-8888",
            scores: {
                คณิต: { preTest: 58, midTerm: 52, postTest: 48, trend: "down", improvement: "-10" },
                ไทย: { preTest: 60, midTerm: 55, postTest: 50, trend: "down", improvement: "-10" },
                วิทย์: { preTest: 55, midTerm: 50, postTest: 45, trend: "down", improvement: "-10" },
                สังคม: { preTest: 62, midTerm: 58, postTest: 54, trend: "down", improvement: "-8" },
                อังกฤษ: { preTest: 50, midTerm: 48, postTest: 45, trend: "down", improvement: "-5" },
            },
            weakChapters: {
                คณิต: ["บทที่ 3", "บทที่ 4", "บทที่ 6"],
                ไทย: ["บทที่ 2", "บทที่ 5"],
                วิทย์: ["บทที่ 1", "บทที่ 4"],
                สังคม: ["บทที่ 3"],
                อังกฤษ: ["Vocabulary", "Grammar"],
            },
            videoViews: 60,
            totalVideos: 120,
            lastAccess: "3 วัน ที่แล้ว",
        },
        {
            id: 5,
            name: "ด.ญ. สุภาพร บุญเกียง",
            email: "supha@email.com",
            phone: "082-333-4443",
            scores: {
                คณิต: { preTest: 72, midTerm: 75, postTest: 78, trend: "stable", improvement: "+6" },
                ไทย: { preTest: 80, midTerm: 82, postTest: 85, trend: "stable", improvement: "+5" },
                วิทย์: { preTest: 75, midTerm: 78, postTest: 80, trend: "stable", improvement: "+5" },
                สังคม: { preTest: 78, midTerm: 80, postTest: 82, trend: "stable", improvement: "+4" },
                อังกฤษ: { preTest: 70, midTerm: 73, postTest: 76, trend: "stable", improvement: "+6" },
            },
            weakChapters: {
                คณิต: ["บทที่ 7"],
            },
            videoViews: 120,
            totalVideos: 120,
            lastAccess: "1 วัน ที่แล้ว",
        },
        {
            id: 6,
            name: "ด.ช. สุวิทย์ สีดา",
            email: "suwit@email.com",
            phone: "083-555-6667",
            scores: {
                คณิต: { preTest: 85, midTerm: 88, postTest: 92, trend: "up", improvement: "+7" },
                ไทย: { preTest: 82, midTerm: 85, postTest: 88, trend: "up", improvement: "+6" },
                วิทย์: { preTest: 88, midTerm: 90, postTest: 94, trend: "up", improvement: "+6" },
                สังคม: { preTest: 80, midTerm: 83, postTest: 87, trend: "up", improvement: "+7" },
                อังกฤษ: { preTest: 78, midTerm: 82, postTest: 86, trend: "up", improvement: "+8" },
            },
            weakChapters: {},
            videoViews: 110,
            totalVideos: 120,
            lastAccess: "5 ชม. ที่แล้ว",
        },
        {
            id: 7,
            name: "ด.ญ. มาริน คูหา",
            email: "marin@email.com",
            phone: "084-777-8878",
            scores: {
                คณิต: { preTest: 58, midTerm: 52, postTest: 48, trend: "down", improvement: "-10" },
                ไทย: { preTest: 60, midTerm: 55, postTest: 50, trend: "down", improvement: "-10" },
                วิทย์: { preTest: 55, midTerm: 50, postTest: 45, trend: "down", improvement: "-10" },
                สังคม: { preTest: 62, midTerm: 58, postTest: 54, trend: "down", improvement: "-8" },
                อังกฤษ: { preTest: 50, midTerm: 48, postTest: 45, trend: "down", improvement: "-5" },
            },
            weakChapters: {
                คณิต: ["บทที่ 3", "บทที่ 4", "บทที่ 6"],
                ไทย: ["บทที่ 2", "บทที่ 5"],
                วิทย์: ["บทที่ 1", "บทที่ 4"],
                สังคม: ["บทที่ 3"],
                อังกฤษ: ["Vocabulary", "Grammar"],
            },
            videoViews: 60,
            totalVideos: 120,
            lastAccess: "3 วัน ที่แล้ว",
        },
        {
            id: 8,
            name: "ด.ญ. มาณัฐ ไขยัน",
            email: "manee@email.com",
            phone: "084-777-8889",
            scores: {
                คณิต: { preTest: 58, midTerm: 52, postTest: 48, trend: "down", improvement: "-10" },
                ไทย: { preTest: 60, midTerm: 55, postTest: 50, trend: "down", improvement: "-10" },
                วิทย์: { preTest: 55, midTerm: 50, postTest: 45, trend: "down", improvement: "-10" },
                สังคม: { preTest: 62, midTerm: 58, postTest: 54, trend: "down", improvement: "-8" },
                อังกฤษ: { preTest: 50, midTerm: 48, postTest: 45, trend: "down", improvement: "-5" },
            },
            weakChapters: {
                คณิต: ["บทที่ 3", "บทที่ 4", "บทที่ 6"],
                ไทย: ["บทที่ 2", "บทที่ 5"],
                วิทย์: ["บทที่ 1", "บทที่ 4"],
                สังคม: ["บทที่ 3"],
                อังกฤษ: ["Vocabulary", "Grammar"],
            },
            videoViews: 60,
            totalVideos: 120,
            lastAccess: "3 วัน ที่แล้ว",
        },
    ];

    const subjects = ["คณิต", "ไทย", "วิทย์", "สังคม", "อังกฤษ"];

    const subjectColors = {
        คณิต: "bg-orange-500",
        ไทย: "bg-pink-500",
        วิทย์: "bg-blue-500",
        สังคม: "bg-yellow-600",
        อังกฤษ: "bg-purple-500",
    };

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
        const improvements = Object.values(student.scores).map(s =>
            parseFloat(s.improvement.replace('+', ''))
        );
        const avg = improvements.reduce((a, b) => a + b, 0) / improvements.length;
        return avg > 0 ? `+${avg.toFixed(0)}` : avg.toFixed(0);
    };

    const getOverallTrend = (student) => {
        const trends = Object.values(student.scores).map(s => s.trend);
        const upCount = trends.filter(t => t === "up").length;
        const downCount = trends.filter(t => t === "down").length;

        if (upCount > downCount) return "up";
        if (downCount > upCount) return "down";
        return "stable";
    };

    const filteredStudents = students
        .filter(student =>
            student.name.toLowerCase().includes(search.toLowerCase()) ||
            student.email.toLowerCase().includes(search.toLowerCase())
        )
        .sort((a, b) => {
            if (sortBy === "name") {
                return a.name.localeCompare(b.name, 'th');
            } else if (sortBy === "improvement") {
                const avgA = parseFloat(getAverageImprovement(a).replace('+', ''));
                const avgB = parseFloat(getAverageImprovement(b).replace('+', ''));
                return avgB - avgA;
            } else if (sortBy === "videoProgress") {
                const progressA = (a.videoViews / a.totalVideos) * 100;
                const progressB = (b.videoViews / b.totalVideos) * 100;
                return progressB - progressA;
            }
            return 0;
        });

    const handleExport = () => {
        alert('กำลังดาวน์โหลดรายงาน PDF...');
    };

    const handleSendMessage = (student) => {
        alert(`เปิดหน้าส่งข้อความถึง ${student.name}`);
    };

    const handleBack = () => {
        console.log('Navigate back');
        // Use: navigate('/tutor/courses') with React Router
    };

    return (
        <div className="space-y-6 mt-[90px]">
            <div className="">
                {/* Header */}
                <div className="mb-6">
                    <div className="mb-6 flex items-center text-sm">
                        <Link
                            to="/tutor/courses"
                            className="font-medium text-gray-500 hover:text-orange-600 transition"
                        >
                            คอร์ส
                        </Link>

                        <ChevronRight className="mx-2 h-4 w-4 text-gray-400" />

                        <span className="font-medium text-gray-800">
                            จัดการคอร์ส
                        </span>
                    </div>

                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                        <div>
                            <h1 className="text-2xl font-bold text-neutral-900">ข้อมูลนักเรียน</h1>
                            <p className="text-sm text-neutral-500 mt-1">
                                {courseInfo.name} • นักเรียนทั้งหมด {courseInfo.studentCount} คน
                            </p>
                        </div>

                        <button
                            onClick={handleExport}
                            className="flex items-center gap-2 px-4 py-2 bg-linear-to-r from-orange-500 to-orange-600 text-white rounded-xl hover:shadow-lg hover:scale-105 transition font-medium"
                        >
                            <Download className="h-4 w-4" />
                            ดาวน์โหลดรายงาน
                        </button>
                    </div>
                </div>

                {/* Search & Sort Bar */}
                <div className="bg-white border border-neutral-200 rounded-xl p-3 mb-6">
                    <div className="flex flex-col md:flex-row gap-3">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
                            <input
                                type="text"
                                placeholder="ค้นหานักเรียน (ชื่อ หรือ อีเมล)..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="pl-10 pr-4 py-2 w-full bg-neutral-50 border border-neutral-200 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 focus:border-transparent transition"
                            />
                        </div>

                        <select
                            className="px-4 py-2 bg-neutral-50 border border-neutral-200 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 focus:border-transparent md:min-w-[200px]"
                            value={sortBy}
                            onChange={(e) => setSortBy(e.target.value)}
                        >
                            <option value="name">เรียงตามชื่อ</option>
                            <option value="improvement">เรียงตามพัฒนาการ</option>
                            <option value="videoProgress">เรียงตามการดูคลิป</option>
                        </select>
                    </div>
                </div>

                {/* Students List */}
                <div className="space-y-4">
                    {filteredStudents.length === 0 ? (
                        <div className="text-center py-12">
                            <div className="text-5xl mb-3">👨‍🎓</div>
                            <p className="text-neutral-500 text-sm">ไม่พบนักเรียนที่ค้นหา</p>
                        </div>
                    ) : (
                        filteredStudents.map((student) => (
                            <div
                                key={student.id}
                                className="bg-white rounded-2xl border-2 border-neutral-200 hover:border-orange-300 transition overflow-hidden"
                            >
                                {/* Student Header */}
                                <div className="p-5 bg-linear-to-br from-orange-50 to-amber-50 border-b border-orange-100">
                                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                        <div className="flex items-center gap-4">
                                            <div className="h-16 w-16 overflow-hidden rounded-xl border-2 border-orange-200 shrink-0 bg-white">
                                                <img
                                                    src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${student.name}&backgroundColor=fef3c7`}
                                                    alt={student.name}
                                                    className="h-full w-full object-cover"
                                                />
                                            </div>
                                            <div>
                                                <h3 className="text-lg font-bold text-neutral-900">{student.name}</h3>
                                                <div className="flex flex-wrap items-center gap-2 md:gap-3 text-xs text-neutral-600 mt-1">
                                                    <div className="flex items-center gap-1">
                                                        <Mail className="h-3 w-3" />
                                                        <span>{student.email}</span>
                                                    </div>
                                                    <div className="flex items-center gap-1">
                                                        <Phone className="h-3 w-3" />
                                                        <span>{student.phone}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-2 md:gap-3">
                                            <div className={`px-3 py-1.5 rounded-full border flex items-center gap-1.5 ${getTrendColor(getOverallTrend(student))}`}>
                                                {getTrendIcon(getOverallTrend(student))}
                                                <span className="font-bold text-sm">{getAverageImprovement(student)}</span>
                                            </div>

                                            {/* <button
                                                onClick={() => handleSendMessage(student)}
                                                className="p-2 hover:bg-white rounded-lg transition"
                                                title="ส่งข้อความ"
                                            >
                                                <MessageCircle className="h-5 w-5 text-orange-600" />
                                            </button> */}

                                            <button
                                                onClick={() => setExpandedStudent(expandedStudent === student.id ? null : student.id)}
                                                className="p-2 hover:bg-white rounded-lg transition"
                                            >
                                                <ChevronDown className={`h-5 w-5 text-neutral-600 transition-transform ${expandedStudent === student.id ? 'rotate-180' : ''}`} />
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                {/* Quick Overview */}
                                <div className="p-5 grid grid-cols-1 md:grid-cols-3 gap-4 bg-neutral-50">
                                    <div className="bg-white rounded-xl p-3 border border-neutral-200">
                                        <div className="flex items-center gap-2 mb-2">
                                            <Video className="h-4 w-4 text-orange-600" />
                                            <span className="text-xs font-semibold text-neutral-700">การดูคลิป</span>
                                        </div>
                                        <div className="space-y-1.5">
                                            <div className="flex justify-between text-xs">
                                                <span className="text-neutral-600">{student.videoViews}/{student.totalVideos}</span>
                                                <span className="font-bold text-orange-600">
                                                    {Math.round((student.videoViews / student.totalVideos) * 100)}%
                                                </span>
                                            </div>
                                            <div className="h-2 bg-neutral-200 rounded-full overflow-hidden">
                                                <div
                                                    className="h-full bg-linear-to-r from-orange-500 to-orange-600"
                                                    style={{ width: `${(student.videoViews / student.totalVideos) * 100}%` }}
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="bg-white rounded-xl p-3 border border-neutral-200">
                                        <div className="flex items-center gap-2 mb-2">
                                            <Calendar className="h-4 w-4 text-orange-600" />
                                            <span className="text-xs font-semibold text-neutral-700">เข้าใช้ล่าสุด</span>
                                        </div>
                                        <p className="text-sm font-medium text-neutral-900">{student.lastAccess}</p>
                                    </div>

                                    <div className="bg-white rounded-xl p-3 border border-neutral-200">
                                        <div className="flex items-center gap-2 mb-2">
                                            <Award className="h-4 w-4 text-orange-600" />
                                            <span className="text-xs font-semibold text-neutral-700">พัฒนาการรวม</span>
                                        </div>
                                        <p className={`text-lg font-bold ${getOverallTrend(student) === 'up' ? 'text-green-600' :
                                                getOverallTrend(student) === 'down' ? 'text-red-600' :
                                                    'text-yellow-600'
                                            }`}>
                                            {getAverageImprovement(student)}
                                        </p>
                                    </div>
                                </div>

                                {/* Expanded Details - Collapsible */}
                                {expandedStudent === student.id && (
                                    <div className="p-5 border-t border-neutral-200 space-y-4 bg-white">
                                        <div>
                                            <h4 className="font-bold text-neutral-900 mb-3 flex items-center gap-2">
                                                <Award className="h-5 w-5 text-orange-600" />
                                                คะแนนสอบทั้ง 5 วิชาหลัก
                                            </h4>
                                            <div className="space-y-3">
                                                {subjects.map((subject) => (
                                                    <div key={subject} className="bg-neutral-50 rounded-xl p-4 border border-neutral-200">
                                                        <div className="flex items-center justify-between mb-3">
                                                            <div className="flex items-center gap-2">
                                                                <div className={`w-3 h-3 rounded-full ${subjectColors[subject]}`}></div>
                                                                <span className="font-semibold text-neutral-900">{subject}</span>
                                                            </div>
                                                            <div className={`px-2 py-1 rounded-full flex items-center gap-1 text-xs border ${getTrendColor(student.scores[subject].trend)}`}>
                                                                {getTrendIcon(student.scores[subject].trend)}
                                                                <span className="font-bold">{student.scores[subject].improvement}</span>
                                                            </div>
                                                        </div>

                                                        <div className="grid grid-cols-4 gap-2">
                                                            <div className="bg-white p-2 rounded-lg text-center border border-neutral-200">
                                                                <p className="text-xs text-neutral-500 mb-1">ก่อนเรียน</p>
                                                                <p className="text-lg font-bold text-neutral-900">{student.scores[subject].preTest}</p>
                                                            </div>
                                                            <div className="bg-white p-2 rounded-lg text-center border border-neutral-200">
                                                                <p className="text-xs text-neutral-500 mb-1">กลางภาค</p>
                                                                <p className="text-lg font-bold text-neutral-900">{student.scores[subject].midTerm}</p>
                                                            </div>
                                                            <div className="bg-orange-50 p-2 rounded-lg text-center border border-orange-200">
                                                                <p className="text-xs text-orange-600 mb-1">หลังเรียน</p>
                                                                <p className="text-lg font-bold text-orange-600">{student.scores[subject].postTest}</p>
                                                            </div>
                                                            <div className="flex items-end justify-center gap-1 bg-white p-2 rounded-lg border border-neutral-200">
                                                                {['preTest', 'midTerm', 'postTest'].map((test, idx) => (
                                                                    <div
                                                                        key={idx}
                                                                        className={`w-2 rounded-t ${idx === 2 ? 'bg-orange-500' : 'bg-neutral-300'}`}
                                                                        style={{ height: `${Math.max((student.scores[subject][test] / 100) * 30, 2)}px` }}
                                                                    />
                                                                ))}
                                                            </div>
                                                        </div>

                                                        {student.weakChapters[subject] && student.weakChapters[subject].length > 0 && (
                                                            <div className="mt-3 pt-3 border-t border-neutral-200">
                                                                <p className="text-xs text-neutral-600 mb-1.5 font-medium">บทที่ต้องพัฒนา:</p>
                                                                <div className="flex flex-wrap gap-1.5">
                                                                    {student.weakChapters[subject].map((chapter, i) => (
                                                                        <span key={i} className="text-xs bg-red-50 text-red-700 px-2 py-1 rounded-md border border-red-200">
                                                                            {chapter}
                                                                        </span>
                                                                    ))}
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}