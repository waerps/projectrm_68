// ===================== 3) StudentCourseDetail.jsx =====================
// สไตล์เป๊ะจาก TutorStudentDetail.jsx แต่ดึงข้อมูลของนักเรียนคนที่ล็อกอินอยู่เอง ในคอร์สที่เลือก
import { Link, useSearchParams } from "react-router-dom";
import { useState, useEffect } from "react";
import {
  Users, Calendar, Video, Award, BarChart2, ChevronRight, PlayCircle,
  CheckCircle, XCircle, Clock, TrendingUp, TrendingDown, Minus,
} from "lucide-react";
import {
  getStudentProfile, // ⚠️ ต้องมีฟังก์ชันนี้ใน callusers_student.js (เรียก GET /api/student/profile)
  getStudentAttendance, // ⚠️ ต้องมีฟังก์ชันนี้ (เรียก GET /api/student/attendance)
  getStudentVideos,
} from "../callapi/callusers_student";

const subjects = ["คณิต", "ไทย", "วิทย์", "สังคม", "อังกฤษ"];
const subjectColors = {
  คณิต: "bg-orange-500", ไทย: "bg-pink-500", วิทย์: "bg-blue-500",
  สังคม: "bg-yellow-600", อังกฤษ: "bg-purple-500",
};

// ⚠️ คะแนนสอบยังไม่มี endpoint จริงในระบบ (ของติวเตอร์ก็ยังเป็น mock)
// ใช้สูตร mock เดียวกันไปก่อนเพื่อให้ไปในทางเดียวกัน จนกว่าจะมีตาราง exam score จริง
const generateMockScores = (seedId) => {
  const mockScores = {};
  subjects.forEach((sub) => {
    const safeSeed = seedId || 1;
    const preTest = 40 + ((safeSeed * 5) % 30);
    const midTerm = preTest + 10;
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

export default function StudentCourseDetail() {
  const [searchParams] = useSearchParams();
  const courseId = searchParams.get("courseId");
  const courseName = searchParams.get("courseName") || "คอร์สเรียน";
  const token = localStorage.getItem("student_token");

  const [loading, setLoading] = useState(true);
  const [student, setStudent] = useState(null);
  const [attendance, setAttendance] = useState([]);
  const [videos, setVideos] = useState([]);
  const [scores, setScores] = useState({});
  const [activeTab, setActiveTab] = useState("attendance");

  useEffect(() => {
    (async () => {
      try {
        const profile = await getStudentProfile(token);
        setStudent(profile);
        setScores(generateMockScores(profile.UserId));

        // ⚠️ ตอนนี้ /api/student/attendance คืนทุกคอร์สรวมกัน ต้องกรองด้วย CourseName
        //     ทางที่ดีควรแก้ backend ให้ส่ง CourseID กลับมาด้วย แล้ว filter ด้วย id แทนชื่อ (แม่นกว่า)
        try {
          const att = await getStudentAttendance(token);
          setAttendance(att.filter((a) => a.CourseName === courseName));
        } catch { setAttendance([]); }

        try {
          const vids = await getStudentVideos(token, courseId);
          setVideos(
            (vids || []).map((v) => ({
              id: v.VideoId,
              title: v.VideoTitle,
              duration: v.Duration || "-",
              watched: (v.WatchPercent || 0) >= 80,
              watchedAt: v.WatchDate,
              progress: Math.round(v.WatchPercent || 0),
            }))
          );
        } catch { setVideos([]); }
      } catch (e) {
        console.error(e);
      } finally { setLoading(false); }
    })();
  }, [courseId]);

  const attendedCount = attendance.filter((a) => a.Status === "present").length;
  const absentCount = attendance.filter((a) => a.Status === "absent").length;
  const attendanceRate = attendance.length ? Math.round((attendedCount / attendance.length) * 100) : 0;
  const watchedCount = videos.filter((v) => v.watched).length;
  const videoRate = videos.length ? Math.round((watchedCount / videos.length) * 100) : 0;

  const getAverageImprovement = () => {
    if (!Object.keys(scores).length) return "+0";
    const vals = Object.values(scores).map((s) => parseFloat(s.improvement.replace("+", "")));
    const avg = vals.reduce((a, b) => a + b, 0) / vals.length;
    return avg > 0 ? `+${avg.toFixed(0)}` : avg.toFixed(0);
  };
  const getOverallTrend = () => {
    if (!Object.keys(scores).length) return "stable";
    const trends = Object.values(scores).map((s) => s.trend);
    const up = trends.filter((t) => t === "up").length;
    const dn = trends.filter((t) => t === "down").length;
    return up > dn ? "up" : dn > up ? "down" : "stable";
  };
  const getTrendIcon = (t) =>
    t === "up" ? <TrendingUp className="h-4 w-4 text-green-600" /> :
    t === "down" ? <TrendingDown className="h-4 w-4 text-red-600" /> :
    <Minus className="h-4 w-4 text-yellow-600" />;
  const getTrendColor = (t) =>
    t === "up" ? "text-green-600 bg-green-50 border-green-200" :
    t === "down" ? "text-red-600 bg-red-50 border-red-200" :
    "text-yellow-600 bg-yellow-50 border-yellow-200";

  const rateColor = attendanceRate >= 80 ? "bg-green-500" : attendanceRate >= 60 ? "bg-orange-500" : "bg-red-500";
  const rateText = attendanceRate >= 80 ? "text-green-600" : attendanceRate >= 60 ? "text-orange-500" : "text-red-500";

  if (loading) return <div className="mt-[90px] text-center p-10 text-orange-600 font-medium">กำลังโหลดข้อมูล...</div>;
  if (!student) return <div className="mt-[90px] text-center p-10 text-neutral-500">ไม่พบข้อมูลนักเรียน</div>;

  return (
    <div className="space-y-6 mt-[90px]">
      <div className="flex items-center text-sm text-neutral-500 gap-2">
        <Link to="/student/courses" className="hover:text-orange-600 transition font-medium">คอร์สเรียนของฉัน</Link>
        <ChevronRight className="h-4 w-4" />
        <span className="text-neutral-800 font-semibold">{courseName}</span>
      </div>

      <div className="bg-gradient-to-br from-orange-50 to-amber-50 border-2 border-orange-200 rounded-2xl p-5">
        <div className="flex flex-col md:flex-row md:items-center gap-4">
          <div className="h-20 w-20 rounded-xl border-2 border-orange-200 overflow-hidden shrink-0 bg-white">
            <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${student.Nickname}&backgroundColor=fef3c7`} alt="" className="h-full w-full object-cover" />
          </div>
          <div className="flex-1">
            <h1 className="text-xl font-bold text-neutral-900">{student.Firstname} {student.Lastname}</h1>
            <div className="flex flex-wrap gap-2 mt-1 text-xs text-neutral-600">
              <span className="bg-white border rounded px-2 py-0.5">🏫 {student.SchoolName || "ไม่ระบุ"}</span>
              <span className="bg-white border rounded px-2 py-0.5">📞 {student.PhoneNo || "-"}</span>
              <span className="bg-blue-50 text-blue-700 border border-blue-200 rounded px-2 py-0.5">{student.GradeDetail}</span>
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

      <div className="flex gap-1 bg-neutral-100 p-1 rounded-xl w-fit flex-wrap">
        {[
          { key: "attendance", label: "ตารางเข้าเรียน", icon: <Calendar className="h-4 w-4" /> },
          { key: "videos", label: "รายการคลิป", icon: <Video className="h-4 w-4" /> },
          { key: "scores", label: "คะแนนสอบ", icon: <Award className="h-4 w-4" /> },
          { key: "overview", label: "ภาพรวม", icon: <BarChart2 className="h-4 w-4" /> },
        ].map((tab) => (
          <button key={tab.key} onClick={() => setActiveTab(tab.key)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold transition ${
              activeTab === tab.key ? "bg-white shadow text-orange-600" : "text-neutral-500 hover:text-neutral-700"
            }`}>
            {tab.icon}{tab.label}
          </button>
        ))}
      </div>

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
                  <th className="text-center px-4 py-3 font-semibold">สถานะ</th>
                </tr>
              </thead>
              <tbody>
                {attendance.length === 0 ? (
                  <tr><td colSpan={3} className="text-center py-10 text-neutral-400">ยังไม่มีข้อมูลการเข้าเรียน</td></tr>
                ) : attendance.map((rec, idx) => (
                  <tr key={idx} className={`border-t border-neutral-100 ${rec.Status === "absent" ? "bg-red-50" : "hover:bg-neutral-50"}`}>
                    <td className="px-4 py-3 font-medium text-neutral-800">
                      {new Date(rec.StartDateTime).toLocaleDateString("th-TH", { weekday: "short", year: "numeric", month: "short", day: "numeric" })}
                    </td>
                    <td className="px-4 py-3 text-neutral-600">{rec.SubjectName || "-"}</td>
                    <td className="px-4 py-3 text-center">
                      {rec.Status === "present" ? (
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
        </div>
      )}

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
            {videos.length === 0 ? (
              <div className="text-center py-10 text-neutral-400">ยังไม่มีคลิปในคอร์สนี้</div>
            ) : videos.map((vid) => (
              <div key={vid.id} className={`flex items-center gap-4 px-4 py-3.5 ${vid.watched ? "" : "bg-neutral-50"}`}>
                <div className={`h-10 w-10 rounded-xl flex items-center justify-center shrink-0 ${vid.watched ? "bg-orange-100" : "bg-neutral-200"}`}>
                  <PlayCircle className={`h-5 w-5 ${vid.watched ? "text-orange-600" : "text-neutral-400"}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-semibold truncate ${vid.watched ? "text-neutral-900" : "text-neutral-400"}`}>{vid.title}</p>
                  <div className="flex items-center gap-3 mt-0.5 text-xs text-neutral-400">
                    <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{vid.duration}</span>
                    {vid.watchedAt && <span>ดูเมื่อ {new Date(vid.watchedAt).toLocaleDateString("th-TH", { day: "numeric", month: "short", year: "numeric" })}</span>}
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
        </div>
      )}

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
              {getTrendIcon(getOverallTrend())} {getAverageImprovement()} คะแนน
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
                      {getTrendIcon(s.trend)}<span className="font-bold">{s.improvement}</span>
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
                      {["preTest", "midTerm", "postTest"].map((t, idx) => (
                        <div key={idx} className={`w-2 rounded-t ${idx === 2 ? "bg-orange-500" : "bg-neutral-300"}`}
                          style={{ height: `${Math.max((s[t] / 100) * 30, 2)}px` }} />
                      ))}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {activeTab === "overview" && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { label: "คาบทั้งหมด", value: attendance.length, color: "text-neutral-700", icon: <Calendar className="h-5 w-5 text-neutral-500" /> },
              { label: "มาเรียน", value: `${attendedCount} คาบ`, color: "text-green-600", icon: <CheckCircle className="h-5 w-5 text-green-500" /> },
              { label: "ขาดเรียน", value: `${absentCount} คาบ`, color: "text-red-500", icon: <XCircle className="h-5 w-5 text-red-400" /> },
              { label: "คลิปที่ยังไม่ดู", value: `${videos.length - watchedCount} คลิป`, color: "text-orange-600", icon: <Video className="h-5 w-5 text-orange-500" /> },
            ].map((s, i) => (
              <div key={i} className="bg-white border border-neutral-200 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-2">{s.icon}<span className="text-xs text-neutral-500 font-medium">{s.label}</span></div>
                <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
              </div>
            ))}
          </div>

          <div className="bg-white border border-neutral-200 rounded-2xl p-5">
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp className="h-5 w-5 text-orange-600" />
              <h2 className="font-bold text-neutral-900">Timeline การเข้าเรียน</h2>
            </div>
            <div className="flex flex-wrap gap-2">
              {attendance.map((rec, idx) => (
                <div key={idx}
                  title={`${rec.StartDateTime} – ${rec.SubjectName} – ${rec.Status === "present" ? "มาเรียน" : "ขาดเรียน"}`}
                  className={`group relative h-10 w-10 rounded-lg flex items-center justify-center text-xs font-bold cursor-default border-2 transition ${
                    rec.Status === "present" ? "bg-green-100 border-green-300 text-green-700" : "bg-red-100 border-red-300 text-red-600"
                  }`}>
                  {idx + 1}
                </div>
              ))}
            </div>
            <div className="flex gap-4 mt-3 text-xs text-neutral-500">
              <span className="flex items-center gap-1.5"><span className="h-3 w-3 rounded bg-green-300 inline-block" /> มาเรียน</span>
              <span className="flex items-center gap-1.5"><span className="h-3 w-3 rounded bg-red-300 inline-block" /> ขาดเรียน</span>
            </div>
          </div>

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
                    <div className={`h-full rounded-full ${vid.watched ? "bg-orange-500" : "bg-neutral-300"}`} style={{ width: `${vid.watched ? 100 : vid.progress}%` }} />
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