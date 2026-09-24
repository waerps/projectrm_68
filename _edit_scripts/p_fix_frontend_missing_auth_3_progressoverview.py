# -*- coding: utf-8 -*-
# แก้บั๊ก REGRESSION: TutorProgressOverview.jsx ยิง /coursestutor?adminId= โดยไม่แนบ token เลย
import io, os, shutil

path = os.path.join(os.environ["HOME"], "mnt", "react", "project", "src", "pagetutor", "TutorProgressOverview.jsx")
BACKUP_DIR = os.path.join(os.environ["HOME"], "mnt", "react", "project", "_edit_scripts", "backup_20260920")
os.makedirs(BACKUP_DIR, exist_ok=True)
shutil.copyfile(path, os.path.join(BACKUP_DIR, "TutorProgressOverview.jsx.before1.jsx"))

s = io.open(path, encoding="utf-8").read()
orig = s


def do_replace(s, old, new, label):
    cnt = s.count(old)
    assert cnt == 1, f"[{label}] คาดว่าจะพบ 1 ครั้ง แต่พบ {cnt} ครั้ง"
    return s.replace(old, new, 1)


old_id = '  const tutorId = JSON.parse(localStorage.getItem("user") || "{}")?.id;\n'
new_id = (
    '  const tutorId = JSON.parse(localStorage.getItem("user") || "{}")?.id;\n'
    '  // (แก้บั๊ก) เดิมไม่แนบ token เลย ตอนนี้ backend ต้อง login ก่อนแล้ว\n'
    '  const token = localStorage.getItem("student_token");\n'
)
s = do_replace(s, old_id, new_id, "add token var")

old_call = '      .get(`${API_URL}/coursestutor?adminId=${tutorId}`)'
new_call = (
    '      .get(`${API_URL}/coursestutor?adminId=${tutorId}`, {\n'
    '        headers: { Authorization: `Bearer ${token}` },\n'
    '      })'
)
s = do_replace(s, old_call, new_call, "GET /coursestutor auth header")

old_deps = '  }, [tutorId]);'
new_deps = '  }, [tutorId, token]);'
s = do_replace(s, old_deps, new_deps, "useEffect deps add token")

assert s != orig
io.open(path, "w", encoding="utf-8").write(s)
print("DONE - TutorProgressOverview.jsx: เพิ่ม Authorization header")
