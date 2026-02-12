import { ArrowLeft, TrendingUp, Users, Video, FileText, Award, Clock, Eye, Download, BarChart3 } from "lucide-react";

export default function TutorAnalytics() {
  const courseInfo = {
    id: 1,
    name: "คณิตศาสตร์ ม.3 เทอม 1/2567",
  };

  const overallStats = [
    { label: "นักเรียนเข้าเรียนครบ", value: "22/24", percentage: 92, icon: Users, color: "text-green-600", bgColor: "bg-green-50" },
    { label: "คะแนนเฉลี่ยพัฒนาการ", value: "+18.5", percentage: null, icon: TrendingUp, color: "text-orange-500", bgColor: "bg-orange-50" },
    { label: "อัตราการดูคลิปเฉลี่ย", value: "87%", percentage: 87, icon: Video, color: "text-orange-600", bgColor: "bg-orange-50" },
    { label: "เวลาเรียนเฉลี่ย", value: "42 ชม.", percentage: null, icon: Clock, color: "text-purple-600", bgColor: "bg-purple-50" },
  ];

  const topVideos = [
    { title: "บทที่ 1: เลขยกกำลัง", views: 156, avgWatchTime: "38 นาที" },
    { title: "บทที่ 3: ฟังก์ชันเชิงเส้น", views: 142, avgWatchTime: "42 นาที" },
    { title: "บทที่ 2: สมการและอสมการ", views: 138, avgWatchTime: "45 นาที" },
    { title: "บทที่ 5: ระบบสมการ", views: 124, avgWatchTime: "35 นาที" },
  ];

  const topDocuments = [
    { title: "แบบฝึกหัดบทที่ 1", downloads: 24, size: "2.4 MB" },
    { title: "สรุปสูตรพีชคณิต", downloads: 23, size: "1.8 MB" },
    { title: "ข้อสอบกลางภาค", downloads: 22, size: "3.2 MB" },
    { title: "แบบทดสอบบทที่ 3", downloads: 20, size: "2.1 MB" },
  ];

  const studentProgress = [
    { range: "90-100", count: 4, color: "bg-green-600" },
    { range: "80-89", count: 6, color: "bg-green-500" },
    { range: "70-79", count: 8, color: "bg-yellow-500" },
    { range: "60-69", count: 4, color: "bg-orange-500" },
    { range: "0-59", count: 2, color: "bg-red-500" },
  ];

  const attendanceData = [
    { week: "สัปดาห์ 1", attendance: 24 },
    { week: "สัปดาห์ 2", attendance: 23 },
    { week: "สัปดาห์ 3", attendance: 24 },
    { week: "สัปดาห์ 4", attendance: 22 },
    { week: "สัปดาห์ 5", attendance: 22 },
    { week: "สัปดาห์ 6", attendance: 23 },
  ];

  const maxAttendance = Math.max(...attendanceData.map(d => d.attendance));

  return (
    <div className="min-h-screen pt-10">
      <div className="mx-auto max-w-7xl px-4 py-8 md:px-6 md:py-12">
        {/* Header */}
        <div className="mb-8">
          <a href="/tutor/courses" className="mb-4 inline-flex items-center gap-2 text-orange-600 hover:text-orange-700">
            <ArrowLeft className="h-4 w-4" />
            กลับไปหน้าคอร์ส
          </a>
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-gray-900 md:text-4xl">
                วิเคราะห์และรายงาน
              </h1>
              <p className="mt-2 text-gray-500">{courseInfo.name}</p>
            </div>
            <div className="flex gap-3">
              <a href={`/courses/${courseInfo.id}/students`} className="inline-flex items-center gap-2 rounded border border-gray-300 px-3 py-1 text-gray-700 hover:border-orange-500 hover:bg-orange-50">
                <Users className="h-4 w-4" />
                ดูนักเรียน
              </a>
              <a href={`/courses/${courseInfo.id}/manage`} className="inline-flex items-center gap-2 rounded border border-gray-300 px-3 py-1 text-gray-700 hover:border-orange-500 hover:bg-orange-50">
                <BarChart3 className="h-4 w-4" />
                จัดการคอร์ส
              </a>
            </div>
          </div>
        </div>

        {/* Overall Stats */}
        <div className="mb-8 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {overallStats.map((stat, idx) => {
            const Icon = stat.icon;
            return (
              <div key={idx} className="flex items-center justify-between rounded-lg bg-white p-6 shadow-md transition-all hover:shadow-lg">
                <div className="flex-1">
                  <p className="text-sm text-gray-500">{stat.label}</p>
                  <p className="mt-2 text-3xl font-bold text-gray-900">{stat.value}</p>
                  {stat.percentage !== null && (
                    <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-gray-200">
                      <div className="h-full bg-orange-500 transition-all" style={{ width: `${stat.percentage}%` }} />
                    </div>
                  )}
                </div>
                <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${stat.bgColor}`}>
                  <Icon className={`h-6 w-6 ${stat.color}`} />
                </div>
              </div>
            );
          })}
        </div>

        {/* Student Score Distribution & Attendance */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Student Score Distribution */}
          <div className="rounded-lg bg-white p-6 shadow-md">
            <div className="flex items-center gap-2 text-xl font-semibold mb-4">
              <Award className="h-5 w-5 text-orange-500" />
              การกระจายคะแนนนักเรียน
            </div>
            <div className="space-y-4">
              {studentProgress.map((range, idx) => (
                <div key={idx}>
                  <div className="mb-2 flex items-center justify-between text-sm">
                    <span className="font-medium text-gray-900">{range.range} คะแนน</span>
                    <span className="text-gray-500">{range.count} คน</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="h-8 flex-1 overflow-hidden rounded-lg bg-gray-200">
                      <div className={`${range.color} h-full transition-all`} style={{ width: `${(range.count / 24) * 100}%` }} />
                    </div>
                    <span className="w-12 text-right text-sm font-semibold text-gray-900">{Math.round((range.count / 24) * 100)}%</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Attendance */}
          <div className="rounded-lg bg-white p-6 shadow-md">
            <div className="flex items-center gap-2 text-xl font-semibold mb-4">
              <Users className="h-5 w-5 text-orange-500" />
              แนวโน้มการเข้าเรียน
            </div>
            <div className="flex h-48 items-end justify-between gap-2">
              {attendanceData.map((data, idx) => (
                <div key={idx} className="flex flex-1 flex-col items-center gap-2">
                  <div className="relative w-full">
                    <div className="w-full rounded-t-lg bg-orange-500 transition-all hover:bg-orange-600" style={{ height: `${(data.attendance / maxAttendance) * 160}px` }}>
                      <span className="absolute -top-6 left-1/2 -translate-x-1/2 text-xs font-semibold text-gray-900">{data.attendance}</span>
                    </div>
                  </div>
                  <span className="text-xs text-gray-500">{data.week.replace("สัปดาห์ ", "ส.")}</span>
                </div>
              ))}
            </div>
            <div className="mt-4 rounded-lg bg-gray-100 p-3 text-center">
              <p className="text-sm text-gray-500">
                อัตราการเข้าเรียนเฉลี่ย:{" "}
                <span className="font-semibold text-orange-500">
                  {Math.round((attendanceData.reduce((sum, d) => sum + d.attendance, 0) / attendanceData.length / 24) * 100)}%
                </span>
              </p>
            </div>
          </div>
        </div>

        {/* Top Videos */}
        <div className="mt-6 space-y-6">
          <div>
            <div className="flex items-center gap-2 text-xl font-semibold mb-3">
              <Video className="h-5 w-5 text-orange-500" />
              คลิปยอดนิยม
            </div>
            <div className="space-y-3">
              {topVideos.map((video, idx) => (
                <div key={idx} className="flex items-center justify-between rounded-lg border border-gray-200 bg-white p-3 transition-all hover:shadow-md">
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-orange-100 font-bold text-orange-500">{idx + 1}</div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">{video.title}</p>
                      <p className="text-xs text-gray-500">เวลาเฉลี่ย: {video.avgWatchTime}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 text-sm">
                    <Eye className="h-4 w-4 text-orange-500" />
                    <span className="font-semibold text-gray-900">{video.views}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Top Documents */}
          <div>
            <div className="flex items-center gap-2 text-xl font-semibold mb-3">
              <FileText className="h-5 w-5 text-orange-500" />
              เอกสารยอดนิยม
            </div>
            <div className="space-y-3">
              {topDocuments.map((doc, idx) => (
                <div key={idx} className="flex items-center justify-between rounded-lg border border-gray-200 bg-white p-3 transition-all hover:shadow-md">
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-orange-100 font-bold text-orange-500">{idx + 1}</div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">{doc.title}</p>
                      <p className="text-xs text-gray-500">ขนาด: {doc.size}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 text-sm">
                    <Download className="h-4 w-4 text-orange-500" />
                    <span className="font-semibold text-gray-900">{doc.downloads}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Summary Card */}
        <div className="mt-6 rounded-lg bg-linear-to-br from-orange-50 via-orange-100 to-gray-50 p-6 shadow-md">
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-orange-100">
              <TrendingUp className="h-8 w-8 text-orange-500" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-gray-900">สรุปภาพรวม</h3>
              <p className="mt-1 text-sm leading-relaxed text-gray-500">
                คอร์สนี้มีผลการเรียนที่ดีเยี่ยม นักเรียนส่วนใหญ่มีพัฒนาการดีขึ้นอย่างต่อเนื่อง อัตราการเข้าเรียนและการดูคลิปอยู่ในเกณฑ์ที่ดี
                แนะนำให้เพิ่มเติมเนื้อหาเสริมสำหรับนักเรียนที่ต้องการพัฒนาเพิ่มเติม
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
