# -*- coding: utf-8 -*-
# แก้บั๊ก REGRESSION: หลังจากล็อก backend (tutor.routes.js) ให้ต้อง login ก่อนแล้ว
# หน้า TutorProfile.jsx ยังยิง axios โดยไม่แนบ Authorization header เลย ทำให้โดน 401 ทันที
# หน้าโปรไฟล์ติวเตอร์เลยใช้งานไม่ได้ (ดู/แก้ไข/อัปโหลดรูปไม่ได้เลย)
import io, os, shutil

path = os.path.join(os.environ["HOME"], "mnt", "react", "project", "src", "pagetutor", "TutorProfile.jsx")
BACKUP_DIR = os.path.join(os.environ["HOME"], "mnt", "react", "project", "_edit_scripts", "backup_20260920")
os.makedirs(BACKUP_DIR, exist_ok=True)
shutil.copyfile(path, os.path.join(BACKUP_DIR, "TutorProfile.jsx.before1.jsx"))

s = io.open(path, encoding="utf-8").read()
orig = s


def do_replace(s, old, new, label):
    cnt = s.count(old)
    assert cnt == 1, f"[{label}] คาดว่าจะพบ 1 ครั้ง แต่พบ {cnt} ครั้ง"
    return s.replace(old, new, 1)


# ── เพิ่มตัวแปร token ──────────────────────────────────────────────────
old_id = '    const TUTOR_ID = JSON.parse(localStorage.getItem("user"))?.id;\n'
new_id = (
    '    const TUTOR_ID = JSON.parse(localStorage.getItem("user"))?.id;\n'
    '    // (แก้บั๊ก) เดิมไม่แนบ token เลย ตอนนี้ backend (/api/tutor/:id ฯลฯ) ต้อง login\n'
    '    // ก่อนแล้ว ถ้าไม่แนบ Authorization header จะโดน 401 ทันที\n'
    '    const token = localStorage.getItem("student_token");\n'
)
s = do_replace(s, old_id, new_id, "add token var")

# ── GET /api/tutor/:id ───────────────────────────────────────────────
old_get = 'const response = await axios.get(`${API_URL}/api/tutor/${TUTOR_ID}`);'
new_get = (
    'const response = await axios.get(`${API_URL}/api/tutor/${TUTOR_ID}`, {\n'
    '                    headers: { Authorization: `Bearer ${token}` },\n'
    '                });'
)
s = do_replace(s, old_get, new_get, "GET /:id auth header")

# ── POST /:id/upload-profile ─────────────────────────────────────────
old_upload = """const res = await axios.post(`${API_URL}/api/tutor/${TUTOR_ID}/upload-profile`, data, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });"""
new_upload = """const res = await axios.post(`${API_URL}/api/tutor/${TUTOR_ID}/upload-profile`, data, {
                headers: { 'Content-Type': 'multipart/form-data', Authorization: `Bearer ${token}` }
            });"""
s = do_replace(s, old_upload, new_upload, "POST upload-profile auth header")

# ── ใส่ token เข้า dependency array ของ useEffect (กัน eslint warning ใหม่) ─────
old_deps = "        fetchTutorData();\n    }, [TUTOR_ID]);"
new_deps = "        fetchTutorData();\n    }, [TUTOR_ID, token]);"
s = do_replace(s, old_deps, new_deps, "useEffect deps add token")

# ── PUT /:id ──────────────────────────────────────────────────────────
old_put = 'await axios.put(`${API_URL}/api/tutor/${TUTOR_ID}`, formData);'
new_put = (
    'await axios.put(`${API_URL}/api/tutor/${TUTOR_ID}`, formData, {\n'
    '                headers: { Authorization: `Bearer ${token}` },\n'
    '            });'
)
s = do_replace(s, old_put, new_put, "PUT /:id auth header")

assert s != orig
io.open(path, "w", encoding="utf-8").write(s)
print("DONE - TutorProfile.jsx: เพิ่ม Authorization header ให้ทุก request")
