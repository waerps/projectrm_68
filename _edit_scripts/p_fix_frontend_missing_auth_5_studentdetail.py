# -*- coding: utf-8 -*-
# แก้บั๊ก REGRESSION: TutorStudentDetail.jsx ยิง 4 endpoint ของ /coursestutor โดยไม่แนบ token
import io, os, shutil

path = os.path.join(os.environ["HOME"], "mnt", "react", "project", "src", "pagetutor", "TutorStudentDetail.jsx")
BACKUP_DIR = os.path.join(os.environ["HOME"], "mnt", "react", "project", "_edit_scripts", "backup_20260920")
os.makedirs(BACKUP_DIR, exist_ok=True)
shutil.copyfile(path, os.path.join(BACKUP_DIR, "TutorStudentDetail.jsx.before1.jsx"))

s = io.open(path, encoding="utf-8").read()
orig = s


def do_replace(s, old, new, label):
    cnt = s.count(old)
    assert cnt == 1, f"[{label}] คาดว่าจะพบ 1 ครั้ง แต่พบ {cnt} ครั้ง"
    return s.replace(old, new, 1)


old_fetchall = """    useEffect(() => {
        const fetchAll = async () => {
            try {
                const res = await axios.get(`${API_URL}/coursestutor/${courseId}/students`);"""
new_fetchall = """    useEffect(() => {
        const fetchAll = async () => {
            // (แก้บั๊ก) เดิมไม่แนบ token เลย ตอนนี้ backend ต้อง login ก่อนแล้ว
            const token = localStorage.getItem("student_token");
            const authHeaders = { headers: { Authorization: `Bearer ${token}` } };
            try {
                const res = await axios.get(`${API_URL}/coursestutor/${courseId}/students`, authHeaders);"""
s = do_replace(s, old_fetchall, new_fetchall, "add token + GET students auth header")

old_summary = 'const sumRes = await axios.get(`${API_URL}/coursestutor/${courseId}/exam-summary`);'
new_summary = 'const sumRes = await axios.get(`${API_URL}/coursestutor/${courseId}/exam-summary`, authHeaders);'
s = do_replace(s, old_summary, new_summary, "GET exam-summary auth header")

old_att = """const attRes = await axios.get(
                        `${API_URL}/coursestutor/${courseId}/students/${studentId}/attendance`
                    );"""
new_att = """const attRes = await axios.get(
                        `${API_URL}/coursestutor/${courseId}/students/${studentId}/attendance`,
                        authHeaders
                    );"""
s = do_replace(s, old_att, new_att, "GET attendance auth header")

old_vid = """const vidRes = await axios.get(
                        `${API_URL}/coursestutor/${courseId}/students/${studentId}/videos`
                    );"""
new_vid = """const vidRes = await axios.get(
                        `${API_URL}/coursestutor/${courseId}/students/${studentId}/videos`,
                        authHeaders
                    );"""
s = do_replace(s, old_vid, new_vid, "GET videos auth header")

assert s != orig
io.open(path, "w", encoding="utf-8").write(s)
print("DONE - TutorStudentDetail.jsx: เพิ่ม Authorization header ให้ทั้ง 4 request")
