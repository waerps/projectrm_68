# -*- coding: utf-8 -*-
# แก้บั๊ก REGRESSION: TutorStudents.jsx ยิง /coursestutor/:id/students และ /exam-summary
# โดยไม่แนบ token เลย
import io, os, shutil

path = os.path.join(os.environ["HOME"], "mnt", "react", "project", "src", "pagetutor", "TutorStudents.jsx")
BACKUP_DIR = os.path.join(os.environ["HOME"], "mnt", "react", "project", "_edit_scripts", "backup_20260920")
os.makedirs(BACKUP_DIR, exist_ok=True)
shutil.copyfile(path, os.path.join(BACKUP_DIR, "TutorStudents.jsx.before1.jsx"))

s = io.open(path, encoding="utf-8").read()
orig = s

old = """                const [response, summaryRes] = await Promise.all([
                    axios.get(`${API_URL}/coursestutor/${courseId}/students`),
                    axios.get(`${API_URL}/coursestutor/${courseId}/exam-summary`).catch((err) => {
                        console.error("Fetch exam summary failed:", err);
                        return null;
                    }),
                ]);"""
new = """                // (แก้บั๊ก) เดิมไม่แนบ token เลย ตอนนี้ backend ต้อง login ก่อนแล้ว
                const token = localStorage.getItem("student_token");
                const authHeaders = { headers: { Authorization: `Bearer ${token}` } };
                const [response, summaryRes] = await Promise.all([
                    axios.get(`${API_URL}/coursestutor/${courseId}/students`, authHeaders),
                    axios.get(`${API_URL}/coursestutor/${courseId}/exam-summary`, authHeaders).catch((err) => {
                        console.error("Fetch exam summary failed:", err);
                        return null;
                    }),
                ]);"""
cnt = s.count(old)
assert cnt == 1, f"คาดว่าจะพบ 1 ครั้ง แต่พบ {cnt} ครั้ง"
s = s.replace(old, new, 1)

assert s != orig
io.open(path, "w", encoding="utf-8").write(s)
print("DONE - TutorStudents.jsx: เพิ่ม Authorization header ให้ทั้งสอง request")
