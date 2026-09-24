# -*- coding: utf-8 -*-
# แก้บั๊ก REGRESSION ที่พึ่งเจอ: หน้า TutorExamAnalytics.jsx พังจริง ("OverviewTab is not
# defined") เพราะตอนลบ dead code StudentTab/StudentModal ในรอบก่อนหน้า (Low-severity round)
# ใช้ START_MARKER/END_MARKER ที่กว้างเกินไป ทำให้ลบ `function OverviewTab(...)` (component
# จริงที่ยังใช้งานอยู่ที่บรรทัด `{activeTab === "overview" && <OverviewTab .../>}`) และ
# คอมเมนต์บล็อก ItemAnalysisTab (ของเดิมที่ถูกคอมเมนต์ทิ้งไว้อยู่แล้ว ไม่มีผลรันไทม์) ที่อยู่
# "ระหว่าง" StudentModal กับ StudentTab ไปด้วยโดยไม่ได้ตั้งใจ
#
# แก้โดยดึงเนื้อหาที่ถูกลบผิดกลับมาจาก backup (before4.jsx ซึ่งเป็นไฟล์ก่อนรอบลบ dead code)
# แล้วแทรกกลับเข้าไปที่ตำแหน่งคอมเมนต์ "(ลบโค้ดที่ไม่ได้ใช้ออก) ..." — ยังคงลบ
# StudentTab/StudentModal ตามเดิม (ยืนยันแล้วว่าไม่มีจุดไหนเรียกใช้จริง) แต่คืนค่า OverviewTab
# และคอมเมนต์บล็อกเดิมกลับมาให้ครบ
import io, os, shutil

BACKUP_DIR = os.path.join(os.environ["HOME"], "mnt", "react", "project", "_edit_scripts", "backup_20260920")
backup_path = os.path.join(BACKUP_DIR, "TutorExamAnalytics.jsx.before4.jsx")
path = os.path.join(os.environ["HOME"], "mnt", "react", "project", "src", "pagetutor", "TutorExamAnalytics.jsx")

# สำรองไฟล์ปัจจุบัน (สถานะที่พังอยู่) ไว้ก่อนแก้ เผื่อต้องย้อนดู
shutil.copyfile(path, os.path.join(BACKUP_DIR, "TutorExamAnalytics.jsx.before5.jsx"))

b = io.open(backup_path, encoding="utf-8").read()

B_START = '// ─── Tab 1: ภาพรวม (ข้อมูลจริงจาก fetchExamResults) ────────────────────────\n'
B_END_MARK = '// ─── Tab 3: ผลนักเรียน — ปิดใช้งานชั่วคราว (mock, dead code — ไม่แตะ) ─────────\n'

assert b.count(B_START) == 1, f"B_START พบ {b.count(B_START)} ครั้งใน backup"
assert b.count(B_END_MARK) == 1, f"B_END_MARK พบ {b.count(B_END_MARK)} ครั้งใน backup"

b_start_idx = b.index(B_START)
b_end_idx = b.index(B_END_MARK)
assert b_end_idx > b_start_idx
block_b = b[b_start_idx:b_end_idx]  # OverviewTab component จริง + คอมเมนต์บล็อก ItemAnalysisTab เดิม

# ตรวจว่า block ที่ดึงมามี OverviewTab จริง และไม่มี StudentTab/StudentModal หลงมาด้วย
assert 'function OverviewTab(' in block_b, "ไม่พบ function OverviewTab ใน block ที่ดึงมา"
assert 'function StudentTab(' not in block_b, "block ที่ดึงมามี StudentTab หลงมาด้วย ผิดขอบเขต"
assert 'function StudentModal(' not in block_b, "block ที่ดึงมามี StudentModal หลงมาด้วย ผิดขอบเขต"

s = io.open(path, encoding="utf-8").read()
orig = s

old_placeholder = (
    '// (ลบโค้ดที่ไม่ได้ใช้ออก) StudentTab/StudentModal เป็น mock เก่าที่ไม่มีจุดไหนเรียกใช้แล้ว\n\n'
    '// ─── Tab: รายคน (cross-exam) — ข้อมูลจริงจาก fetchExamResults ────────────────'
)
cnt = s.count(old_placeholder)
assert cnt == 1, f"คาดว่าจะพบ 1 ครั้ง แต่พบ {cnt} ครั้ง"

new_placeholder = (
    '// (ลบโค้ดที่ไม่ได้ใช้ออก) StudentTab/StudentModal เป็น mock เก่าที่ไม่มีจุดไหนเรียกใช้แล้ว\n'
    '// (แก้บั๊ก) รอบลบ dead code ก่อนหน้านี้ลบเลยขอบเขตไปโดนฟังก์ชัน OverviewTab (component จริง\n'
    '// ที่ยังใช้แสดงแท็บ "ภาพรวม") กับคอมเมนต์บล็อก ItemAnalysisTab เดิมไปด้วยโดยไม่ได้ตั้งใจ —\n'
    '// ทำให้หน้านี้พังทั้งหน้า (ReferenceError: OverviewTab is not defined) คืนค่าทั้งสองกลับมา\n'
    '// ที่นี่ ส่วน StudentTab/StudentModal ยังคงลบตามเดิม (ยืนยันแล้วว่าไม่มีจุดไหนเรียกใช้จริง)\n\n'
    + block_b +
    '// ─── Tab: รายคน (cross-exam) — ข้อมูลจริงจาก fetchExamResults ────────────────'
)

s = s.replace(old_placeholder, new_placeholder, 1)
assert s != orig
assert 'function OverviewTab(' in s

io.open(path, "w", encoding="utf-8").write(s)
print("DONE - TutorExamAnalytics.jsx: คืนค่า OverviewTab ที่ถูกลบผิดพลาดกลับมาแล้ว")
