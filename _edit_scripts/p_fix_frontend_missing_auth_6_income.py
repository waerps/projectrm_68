# -*- coding: utf-8 -*-
# แก้บั๊ก REGRESSION: TutorIncome.jsx ใช้ fetch() ธรรมดา ไม่แนบ token เลย
import io, os, shutil

path = os.path.join(os.environ["HOME"], "mnt", "react", "project", "src", "pagetutor", "TutorIncome.jsx")
BACKUP_DIR = os.path.join(os.environ["HOME"], "mnt", "react", "project", "_edit_scripts", "backup_20260920")
os.makedirs(BACKUP_DIR, exist_ok=True)
shutil.copyfile(path, os.path.join(BACKUP_DIR, "TutorIncome.jsx.before1.jsx"))

s = io.open(path, encoding="utf-8").read()
orig = s

old = """      const res = await fetch(`${API_BASE}/income/${adminId}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);"""
new = """      // (แก้บั๊ก) เดิมไม่แนบ token เลย ตอนนี้ backend ต้อง login ก่อนแล้ว
      const token = localStorage.getItem("student_token");
      const res = await fetch(`${API_BASE}/income/${adminId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);"""
cnt = s.count(old)
assert cnt == 1, f"คาดว่าจะพบ 1 ครั้ง แต่พบ {cnt} ครั้ง"
s = s.replace(old, new, 1)

assert s != orig
io.open(path, "w", encoding="utf-8").write(s)
print("DONE - TutorIncome.jsx: เพิ่ม Authorization header")
