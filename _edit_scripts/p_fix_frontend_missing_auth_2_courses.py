# -*- coding: utf-8 -*-
# แก้บั๊ก REGRESSION: TutorCourses.jsx มีตัวแปร token อยู่แล้ว (ใช้กับ endpoint อื่น) แต่ไม่ได้
# แนบไปกับ request หลักที่ดึงรายการคอร์ส (/coursestutor?adminId=) ทำให้โดน 401 หน้าคอร์สว่างเปล่า
import io, os, shutil

path = os.path.join(os.environ["HOME"], "mnt", "react", "project", "src", "pagetutor", "TutorCourses.jsx")
BACKUP_DIR = os.path.join(os.environ["HOME"], "mnt", "react", "project", "_edit_scripts", "backup_20260920")
os.makedirs(BACKUP_DIR, exist_ok=True)
shutil.copyfile(path, os.path.join(BACKUP_DIR, "TutorCourses.jsx.before1.jsx"))

s = io.open(path, encoding="utf-8").read()
orig = s

old = '        const response = await axios.get(`${API_URL}/coursestutor?adminId=${tutorId}`);'
new = (
    '        // (แก้บั๊ก) เดิมไม่แนบ token เลย ตอนนี้ backend ต้อง login ก่อนแล้ว\n'
    '        const response = await axios.get(`${API_URL}/coursestutor?adminId=${tutorId}`, {\n'
    '          headers: { Authorization: `Bearer ${token}` },\n'
    '        });'
)
cnt = s.count(old)
assert cnt == 1, f"คาดว่าจะพบ 1 ครั้ง แต่พบ {cnt} ครั้ง"
s = s.replace(old, new, 1)

assert s != orig
io.open(path, "w", encoding="utf-8").write(s)
print("DONE - TutorCourses.jsx: เพิ่ม Authorization header ให้ request หลัก")
