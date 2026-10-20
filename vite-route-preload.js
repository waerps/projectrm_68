// ปลั๊กอิน Vite: โหลดไฟล์ JS ของหน้าที่เปิดอยู่ "พร้อมกัน" กับไฟล์หลัก
// ปกติหน้าแบบ lazy จะเริ่มโหลดได้ก็ต่อเมื่อไฟล์หลัก (index-*.js) โหลดและรันเสร็จก่อน → ช้าไปหนึ่งรอบ
// ปลั๊กอินนี้สร้างสคริปต์เล็ก ๆ (assets/route-preload-*.js) ที่ดู URL แล้วสั่ง <link rel="modulepreload">
// ไฟล์ของหน้านั้นทันที ทำให้ Lighthouse LCP เร็วขึ้น
// ใช้ไฟล์ .js แยก (ไม่ใช่ inline script) เพราะ CSP ใน vercel.json ไม่อนุญาต inline script
//
// เพิ่มหน้าใหม่ใน main.jsx แล้วอยากให้โหลดเร็ว → เพิ่มบรรทัดใน ROUTES ด้านล่าง (ลืมเพิ่มก็ไม่พัง แค่ไม่ได้ preload)
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";

const P = "layouts/ProfileLayout.jsx", T = "layouts/TutorLayout.jsx", A = "layouts/AdminLayout.jsx";
// [regex ของ pathname, ไฟล์ใน src ที่หน้านั้นใช้, (ไม่บังคับ) true = ให้ regex ตรวจรวม query string ด้วย]
// ตรวจจากบนลงล่าง ใช้อันแรกที่ตรง
const ROUTES = [
  ["^/$", ["pages/Home.jsx"]],
  ["^/login", ["pages/Login.jsx"]],
  ["^/register/google", ["pages/GoogleRegister.jsx"]],
  ["^/register", ["pages/Register.jsx"]],
  ["^/forgot-password", ["pages/ForgotPassword.jsx"]],
  ["^/(reset-password|setup-credentials)", ["pages/ResetPassword.jsx"]],
  ["^/(virtual-tour|tour-preview)", ["pages/VirtualTour.jsx"]],
  ["^/courses/[^/]+", ["pages/Courses.jsx"]],
  ["^/courses/?$", ["pages/CourseSearch.jsx"]],
  ["^/private-courses", ["pages/PrivateCourses.jsx"]],
  ["^/news", ["pages/News.jsx"]],
  ["^/cart", ["pages/Cart.jsx"]],
  ["^/favorites", ["pages/Favorites.jsx"]],
  ["^/about", ["pages/About.jsx"]],
  ["^/promotion", ["pages/Promotion.jsx"]],
  ["^/exam/", ["pages/StudentExam.jsx"]],
  ["^/profile/?$", [P, "pages/Profile.jsx"]],
  ["^/profile/schedule", [P, "pages/Schedule.jsx"]],
  ["^/profile/notifications", [P, "pages/Notifications.jsx"]],
  ["^/profile/my-courses", [P, "pages/StudentCourses.jsx"]],
  ["^/profile/course/[^/]+/exams", [P, "pages/StudentExamOverview.jsx"]],
  ["^/profile/incidents", [P, "pages/MyIncidents.jsx"]],
  ["^/profile/course-detail/", [P, "pages/StudentCourseDetail.jsx"]],
  ["^/profile/course-content/", [P, "pages/StudentCourseContent.jsx"]],
  ["^/profile/course/[^/]+/subjects", [P, "pages/SubjectList.jsx"]],
  ["^/profile/course/[^/]+/subject/", [P, "pages/StudentSubjectDetail.jsx"]],
  ["^/tutor/?$", [T, "pagetutor/TutorMain.jsx"]],
  ["^/tutor/schedule", [T, "pagetutor/TutorSchedule.jsx"]],
  ["^/tutor/profile", [T, "pagetutor/TutorProfile.jsx"]],
  ["^/tutor/courses", [T, "pagetutor/TutorCourses.jsx"]],
  ["^/tutor/students/detail", [T, "pagetutor/TutorStudentDetail.jsx"]],
  ["^/tutor/students", [T, "pagetutor/TutorStudents.jsx"]],
  ["^/tutor/incidents", [T, "pagetutor/TutorIncidents.jsx"]],
  ["^/tutor/income", [T, "pagetutor/TutorIncome.jsx"]],
  ["^/tutor/notification", [T, "pagetutor/TutorNotification.jsx"]],
  ["^/tutor/exam-analytics", [T, "pagetutor/TutorExamAnalytics.jsx"]],
  ["^/tutor/exam-detail", [T, "pagetutor/TutorExamDetail.jsx"]],
  ["^/tutor/exam", [T, "pagetutor/TutorExam.jsx"]],
  ["^/tutor/manage", [T, "pagetutor/TutorManage.jsx"]],
  ["^/tutor/video-questions/", [T, "pagetutor/TutorVideoQuestions.jsx"]],
  ["^/tutor/question-bank\\?(.*&)?subjectId=", [T, "pagetutor/TutorQuestionBank.jsx", "pagetutor/TutorExamDetail.jsx"], true],
  ["^/tutor/question-bank", [T, "pagetutor/TutorQuestionBank.jsx"]],
  ["^/tutor/progress", [T, "pagetutor/TutorProgressOverview.jsx"]],
  ["^/admin/?$|^/admin/dashboard", [A, "pageadmin/AdminDashboard.jsx"]],
  ["^/admin/courses", [A, "pageadmin/AdminCourses.jsx"]],
  ["^/admin/schedule", [A, "pageadmin/AdminSchedule.jsx"]],
  ["^/admin/students", [A, "pageadmin/AdminStudents.jsx"]],
  ["^/admin/tutors", [A, "pageadmin/AdminTutors.jsx"]],
  ["^/admin/finance", [A, "pageadmin/AdminFinance.jsx"]],
  ["^/admin/announcements", [A, "pageadmin/AdminAnnouncements.jsx"]],
  ["^/admin/notification", [A, "pageadmin/AdminNotification.jsx"]],
  ["^/admin/rooms", [A, "pageadmin/AdminRooms.jsx"]],
  ["^/admin/common-facilities", [A, "pageadmin/AdminCommonFacilities.jsx"]],
  ["^/admin/management", [A, "pageadmin/AdminManagement.jsx"]],
  ["^/admin/profile", [A, "pageadmin/AdminProfile.jsx"]],
  ["^/admin/incidents", [A, "pageadmin/AdminIncidents.jsx"]],
  ["^/admin/progress", [A, "pageadmin/AdminProgressOverview.jsx"]],
  ["^/admin/exam-analytics", [A, "pageadmin/AdminExamAnalytics.jsx", "pagetutor/TutorExamAnalytics.jsx"]],
];

export default function routePreload() {
  let root = ".";
  return {
    name: "route-preload",
    apply: "build",
    configResolved(config) { root = config.root; },
    writeBundle(options, bundle) {
      const outDir = options.dir;
      const chunks = Object.values(bundle).filter((c) => c.type === "chunk");
      const byModule = new Map(chunks.filter((c) => c.facadeModuleId).map((c) => [path.normalize(c.facadeModuleId), c]));
      const byFile = new Map(chunks.map((c) => [c.fileName, c]));
      const entryFiles = new Set();
      for (const c of chunks.filter((c) => c.isEntry)) {
        const stack = [c.fileName];
        while (stack.length) { const f = stack.pop(); if (entryFiles.has(f)) continue; entryFiles.add(f); stack.push(...(byFile.get(f)?.imports || [])); }
      }
      const table = [];
      for (const [pattern, files, withQuery] of ROUTES) {
        const js = new Set(), css = new Set();
        for (const file of files) {
          const chunk = byModule.get(path.normalize(path.resolve(root, "src", file)));
          if (!chunk) continue;
          const stack = [chunk.fileName];
          while (stack.length) {
            const f = stack.pop();
            if (js.has(f) || entryFiles.has(f)) continue;
            js.add(f);
            const c = byFile.get(f);
            c?.viteMetadata?.importedCss?.forEach((s) => css.add(s));
            stack.push(...(c?.imports || []));
          }
        }
        if (js.size) table.push([pattern, [...js], [...css], withQuery ? 1 : 0]);
      }
      // เก็บชื่อไฟล์ครั้งเดียวในลิสต์ f แล้วอ้างด้วยเลข index เพื่อให้สคริปต์เล็ก
      const files = [], index = new Map();
      const id = (name) => { const short = name.replace(/^assets\//, ""); if (!index.has(short)) { index.set(short, files.length); files.push(short); } return index.get(short); };
      const compact = table.map(([pattern, js, css, q]) => q ? [pattern, js.map(id), css.map(id), 1] : [pattern, js.map(id), css.map(id)]);
      const code = `(function(){var f=${JSON.stringify(files)},t=${JSON.stringify(compact)},p=location.pathname,h=document.head;` +
        `function l(r,i,a){var e=document.createElement("link");e.rel=r;e.href="/assets/"+f[i];if(a)e.as=a;e.crossOrigin="";h.appendChild(e)}` +
        `for(var i=0;i<t.length;i++){if(new RegExp(t[i][0]).test(t[i][3]?p+location.search:p)){t[i][1].forEach(function(x){l("modulepreload",x)});t[i][2].forEach(function(x){l("preload",x,"style")});break}}})();\n`;
      const name = `assets/route-preload-${crypto.createHash("sha256").update(code).digest("hex").slice(0, 8)}.js`;
      fs.writeFileSync(path.join(outDir, name), code);
      const htmlPath = path.join(outDir, "index.html");
      const html = fs.readFileSync(htmlPath, "utf8");
      fs.writeFileSync(htmlPath, html.replace(/(\s*)<script type="module"/, `$1<script src="/${name}"></script>$1<script type="module"`));
    },
  };
}
