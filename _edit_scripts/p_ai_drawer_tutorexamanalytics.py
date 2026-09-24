# -*- coding: utf-8 -*-
# ฟีเจอร์: แยก "บทวิเคราะห์ AI แบบละเอียด" ออกจากโมดัลพัฒนาการ (StudentProgressModal)
# ไปเป็นแผงลอยด้านขวา (drawer) ของตัวเอง ตามแบบที่ 3 ที่เลือกไว้ พร้อมปุ่มสลับ
# "การ์ดสรุป (Info)" / "ข้อความเต็ม"
#   - ไม่แตะการ์ดคะแนน/กราฟ/Pre-Mid-Post หรือข้อมูลผลสอบหลักเลย
#   - มุมมอง "ข้อความเต็ม" ใช้ AiSummaryDetail ตัวเดิมทั้งก้อน (ไม่แก้ไฟล์ TutorExamDetail.jsx)
#   - มุมมอง "การ์ดสรุป" เป็น component ใหม่ AiSummaryInfo ที่จัดข้อมูลเดิม (byCategory /
#     misconceptions / focusNext / behavior / overview) เป็นการ์ด-ป้ายสั้นๆ
#   - drawer ใช้ createPortal ไปที่ document.body กันปัญหา stacking/clipping ของ Modal เดิม
import io, os, shutil

path = os.path.join(os.environ["HOME"], "mnt", "react", "project", "src", "pagetutor", "TutorExamAnalytics.jsx")
BACKUP_DIR = os.path.join(os.environ["HOME"], "mnt", "react", "project", "_edit_scripts", "backup_20260920")
os.makedirs(BACKUP_DIR, exist_ok=True)
shutil.copyfile(path, os.path.join(BACKUP_DIR, "TutorExamAnalytics.jsx.before6.jsx"))

s = io.open(path, encoding="utf-8").read()
orig = s


def do_replace(s, old, new, label):
    cnt = s.count(old)
    assert cnt == 1, f"[{label}] คาดว่าจะพบ 1 ครั้ง แต่พบ {cnt} ครั้ง"
    return s.replace(old, new, 1)


# ── 1) imports ─────────────────────────────────────────────────────────
s = do_replace(
    s,
    'import { useState, useMemo, useEffect } from "react";\n',
    'import { useState, useMemo, useEffect } from "react";\n'
    'import { createPortal } from "react-dom";\n',
    "import createPortal",
)
s = do_replace(
    s,
    "  X, Eye, ChevronRight, ArrowUpRight, ArrowDownRight, ChevronDown, Sparkles,\n} from \"lucide-react\";",
    "  X, Eye, ChevronRight, ArrowUpRight, ArrowDownRight, ChevronDown, Sparkles, Minus, PanelRightOpen,\n} from \"lucide-react\";",
    "import lucide icons",
)

# ── 2) component ใหม่: AiSummaryInfo + AiAnalysisDrawer (วางก่อน StudentProgressModal) ──
NEW_COMPONENTS = r'''// ─── บทวิเคราะห์ AI แบบแผงลอย (drawer) ─────────────────────────────────────────
// เดิมบทวิเคราะห์แบบละเอียดขยายแทรกอยู่ในโมดัลพัฒนาการ ทำให้โมดัลยาวมากและเป็นย่อหน้า
// ต่อกันยาว อ่านจับประเด็นยาก (feedback อาจารย์: "ทำเป็น info ด้วย") จึงแยกออกมาเป็นแผงลอย
// ด้านขวาของตัวเอง มี 2 มุมมอง:
//   - การ์ดสรุป (ค่าเริ่มต้น) — จัดข้อมูลชุดเดิมจาก AI เป็นการ์ด/ป้ายสั้นๆ ให้กวาดตาดูได้เร็ว
//   - ข้อความเต็ม — ใช้ AiSummaryDetail ตัวเดิมทั้งก้อน (ย่อหน้าเต็ม + แก้ข้อความถึงผู้ปกครอง)
// ไม่ได้เปลี่ยนข้อมูลที่ AI ส่งมา แค่เปลี่ยนวิธีแสดงผลเท่านั้น

// trend จาก AI เป็นข้อความอิสระ (ไม่มี enum ตายตัว) เดาทิศทางจากคำเพื่อใส่ลูกศรประกอบ
// ถ้าเดาไม่ได้ให้เป็นกลางไว้ก่อน และยังโชว์ข้อความ trend เดิมควบคู่เสมอ กันการตีความผิด
const aiTrendDirection = (trend) => {
  const t = String(trend || "");
  if (/ดีขึ้น|พัฒนา|เพิ่มขึ้น|ก้าวหน้า|สูงขึ้น|ดีมาก|แข็งแรง/.test(t)) return "up";
  if (/ลดลง|แย่ลง|ถดถอย|ต่ำลง|ตกลง|อ่อน|ต้องปรับ/.test(t)) return "down";
  return "flat";
};

// ตัดข้อความยาวให้เหลือประโยคแรก/ไม่เกิน max ตัวอักษร (ใช้ในมุมมองการ์ดสรุปเท่านั้น
// ข้อความเต็มยังอยู่ครบในมุมมอง "ข้อความเต็ม")
const aiSnippet = (text, max = 110) => {
  const t = String(text || "").trim();
  if (t.length <= max) return t;
  return `${t.slice(0, max).trimEnd()}…`;
};

function AiInfoTile({ label, icon: Icon, children, tone = "default" }) {
  const box = tone === "warn" ? "bg-amber-50 border-amber-200" : "bg-white border-orange-100";
  const head = tone === "warn" ? "text-amber-800" : "text-orange-700/80";
  return (
    <div className={`border rounded-xl px-3.5 py-3 ${box}`}>
      <p className={`text-[10.5px] font-bold flex items-center gap-1.5 mb-1.5 ${head}`}>
        {Icon && <Icon className="h-3.5 w-3.5" />} {label}
      </p>
      {children}
    </div>
  );
}

function AiSummaryInfo({ row, scoreChange, fromLabel, toLabel, onShowFullText }) {
  const trends = (row.byCategory || []).filter((c) => c.topic);
  const misconceptions = row.misconceptions || [];
  const focusNext = row.focusNext || [];

  return (
    <div className="px-4 pb-4 space-y-2.5">
      <div className="grid grid-cols-2 gap-2.5">
        <AiInfoTile label="พัฒนาการรวม" icon={TrendingUp}>
          {scoreChange != null ? (
            <>
              <p className={`text-lg font-black ${scoreChange > 0 ? "text-emerald-600" : scoreChange < 0 ? "text-red-500" : "text-slate-600"}`}>
                {scoreChange > 0 ? "▲ +" : scoreChange < 0 ? "▼ " : ""}{scoreChange}%
              </p>
              <p className="text-[10.5px] text-slate-400">{fromLabel} → {toLabel}</p>
            </>
          ) : (
            <p className="text-xs text-slate-400">ต้องสอบอย่างน้อย 2 รอบถึงจะเทียบได้</p>
          )}
        </AiInfoTile>
        <AiInfoTile label="จุดที่ควรระวัง" icon={AlertTriangle}>
          <p className={`text-lg font-black ${misconceptions.length > 0 ? "text-amber-600" : "text-emerald-600"}`}>
            {misconceptions.length > 0 ? `${misconceptions.length} เรื่อง` : "ไม่มี"}
          </p>
          <p className="text-[10.5px] text-slate-400">จากการวิเคราะห์คำตอบ</p>
        </AiInfoTile>
      </div>

      {trends.length > 0 && (
        <AiInfoTile label="แนวโน้มรายหมวด" icon={BarChart2}>
          <div className="flex flex-wrap gap-1.5">
            {trends.map((c, i) => {
              const dir = aiTrendDirection(c.trend);
              return (
                <span
                  key={i}
                  title={c.comment || ""}
                  className="inline-flex items-center gap-1 text-[11px] font-semibold rounded-lg px-2 py-1 border border-slate-200 bg-slate-50 text-slate-700"
                >
                  {dir === "up" ? <ArrowUpRight className="h-3 w-3 text-emerald-600" />
                    : dir === "down" ? <ArrowDownRight className="h-3 w-3 text-red-500" />
                      : <Minus className="h-3 w-3 text-slate-400" />}
                  {c.topic}
                  {c.trend && <span className="font-normal text-slate-400">· {c.trend}</span>}
                </span>
              );
            })}
          </div>
        </AiInfoTile>
      )}

      {misconceptions.length > 0 && (
        <AiInfoTile label="จุดที่น่าจะเข้าใจผิด" icon={AlertTriangle} tone="warn">
          <div className="space-y-1.5">
            {misconceptions.map((m, i) => (
              <div key={i} className="flex items-start gap-2">
                <span className="flex-shrink-0 text-[10.5px] font-bold bg-white border border-amber-200 text-amber-800 rounded-md px-1.5 py-0.5">
                  {m.topic}
                </span>
                <p className="text-xs text-amber-900 leading-relaxed min-w-0">{aiSnippet(m.pattern, 80)}</p>
              </div>
            ))}
          </div>
        </AiInfoTile>
      )}

      {focusNext.length > 0 && (
        <AiInfoTile label="ควรทำต่อ" icon={CheckCircle}>
          <div className="space-y-1">
            {focusNext.map((f, i) => (
              <div key={i} className="flex items-start gap-2">
                <span className="flex-shrink-0 h-[18px] w-[18px] rounded-full bg-orange-100 text-orange-700 text-[10px] font-bold flex items-center justify-center mt-0.5">
                  {i + 1}
                </span>
                <p className="text-xs text-slate-700 leading-relaxed">{typeof f === "string" ? f : f.action}</p>
              </div>
            ))}
          </div>
        </AiInfoTile>
      )}

      {row.behavior && (
        <AiInfoTile label="ข้อสังเกตจากเวลาที่ใช้" icon={Clock}>
          <p className="text-xs text-slate-600 leading-relaxed">{aiSnippet(row.behavior, 90)}</p>
        </AiInfoTile>
      )}

      {row.overview && (
        <div className="border border-dashed border-orange-200 rounded-xl px-3.5 py-2.5">
          <p className="text-xs text-slate-500 leading-relaxed">"{aiSnippet(row.overview)}"</p>
          <button onClick={onShowFullText} className="mt-1 text-[11px] font-bold text-orange-600 hover:text-orange-700">
            อ่านข้อความเต็ม / แก้ข้อความถึงผู้ปกครอง →
          </button>
        </div>
      )}
    </div>
  );
}

function AiAnalysisDrawer({
  row, examLabel, studentName, scoreChange, fromLabel, toLabel,
  parentMessage, dirty, saving, onDraftChange, onSave, onClose,
}) {
  const [view, setView] = useState("info"); // "info" | "text"
  const [entered, setEntered] = useState(false); // ใช้ทำ animation เลื่อนเข้าจากขวา

  useEffect(() => {
    const id = requestAnimationFrame(() => setEntered(true));
    const onKey = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => { cancelAnimationFrame(id); window.removeEventListener("keydown", onKey); };
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-[60]">
      {/* ฉากหลังจางๆ — โมดัลพัฒนาการยังมองเห็นอยู่ด้านหลัง กดตรงนี้เพื่อปิดแผง */}
      <div
        className={`absolute inset-0 bg-black/20 transition-opacity duration-200 ${entered ? "opacity-100" : "opacity-0"}`}
        onClick={onClose}
      />
      <aside
        className={`absolute top-0 right-0 h-full w-full sm:w-[440px] bg-white shadow-2xl flex flex-col transition-transform duration-200 ease-out ${entered ? "translate-x-0" : "translate-x-full"}`}
        role="dialog"
        aria-label="บทวิเคราะห์แบบละเอียด"
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-orange-100 bg-gradient-to-r from-orange-500 to-amber-500 shrink-0">
          <div className="min-w-0">
            <h3 className="flex items-center gap-2 text-sm font-bold text-white">
              <Sparkles className="h-4 w-4" /> บทวิเคราะห์แบบละเอียด
            </h3>
            <p className="text-[11px] text-orange-100 truncate">{studentName} · {examLabel}</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-xl text-white/70 hover:bg-white/20 hover:text-white transition">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="px-4 pt-3.5 pb-3 shrink-0">
          <div className="inline-flex bg-orange-50 border border-orange-100 rounded-full p-0.5">
            {[["info", "การ์ดสรุป"], ["text", "ข้อความเต็ม"]].map(([key, label]) => (
              <button
                key={key}
                onClick={() => setView(key)}
                className={`px-3.5 py-1.5 text-xs font-bold rounded-full transition ${view === key ? "bg-orange-500 text-white shadow-sm" : "text-orange-700 hover:text-orange-800"}`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-y-auto flex-1">
          {view === "info" ? (
            <AiSummaryInfo
              row={row}
              scoreChange={scoreChange}
              fromLabel={fromLabel}
              toLabel={toLabel}
              onShowFullText={() => setView("text")}
            />
          ) : (
            <AiSummaryDetail
              row={row}
              parentMessage={parentMessage}
              dirty={dirty}
              saving={saving}
              onDraftChange={onDraftChange}
              onSave={onSave}
            />
          )}
          {view === "info" && row.model && (
            <p className="px-4 pb-4 text-[10.5px] text-slate-400">วิเคราะห์โดย {row.model}</p>
          )}
        </div>
      </aside>
    </div>
  );
}

'''
anchor = "function StudentProgressModal({ studentId, crossExamData, aiSummaries, courseName, subjectName, onClose }) {"
s = do_replace(s, anchor, NEW_COMPONENTS + anchor, "insert drawer components")

# ── 3) ปุ่มเดิม "ดู/ซ่อนบทวิเคราะห์แบบละเอียด" → เปิด drawer ──────────────────
old_btn = """            <button
              onClick={() => setAiDetailOpen((v) => !v)}
              className="flex items-center gap-1 text-xs font-semibold text-orange-600 hover:text-orange-700"
            >
              <ChevronRight className={`h-3.5 w-3.5 transition ${aiDetailOpen ? "rotate-90" : ""}`} />
              {aiDetailOpen ? "ซ่อนบทวิเคราะห์แบบละเอียด" : "ดูบทวิเคราะห์แบบละเอียด"}
            </button>"""
new_btn = """            {/* (ปรับดีไซน์) เปิดบทวิเคราะห์แบบละเอียดเป็นแผงลอยด้านขวาแทนการขยายแทรกในโมดัล */}
            <button
              onClick={() => setAiDetailOpen(true)}
              className="flex items-center gap-1.5 text-xs font-semibold text-white bg-orange-500 hover:bg-orange-600 rounded-lg px-2.5 py-1 transition"
            >
              <PanelRightOpen className="h-3.5 w-3.5" /> เปิดบทวิเคราะห์แบบละเอียด
            </button>"""
s = do_replace(s, old_btn, new_btn, "open-drawer button")

# ── 4) แผงขยายแทรกเดิม → drawer ผ่าน portal ─────────────────────────────
old_inline = """          {aiDetailOpen && (
            <div className="mt-3 -mx-4 -mb-3.5 border-t border-orange-100">
              <AiSummaryDetail
                row={aiSummaryRow}
                parentMessage={aiParentMessage}
                dirty={aiDirty}
                saving={aiSaving}
                onDraftChange={setAiDraft}
                onSave={saveAiSummary}
              />
            </div>
          )}"""
new_inline = """          {aiDetailOpen && createPortal(
            <AiAnalysisDrawer
              row={aiSummaryRow}
              examLabel={data.exams[lastSubmittedIndex].label}
              studentName={data.name}
              scoreChange={scoreChange}
              fromLabel={first?.label}
              toLabel={last?.label}
              parentMessage={aiParentMessage}
              dirty={aiDirty}
              saving={aiSaving}
              onDraftChange={setAiDraft}
              onSave={saveAiSummary}
              onClose={() => setAiDetailOpen(false)}
            />,
            document.body
          )}"""
s = do_replace(s, old_inline, new_inline, "inline panel -> portal drawer")

assert s != orig
io.open(path, "w", encoding="utf-8").write(s)
print("DONE - TutorExamAnalytics.jsx: แยกบทวิเคราะห์ AI เป็น drawer + สลับ Info/ข้อความเต็ม")
