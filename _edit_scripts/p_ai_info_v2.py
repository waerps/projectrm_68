# -*- coding: utf-8 -*-
# ปรับดีไซน์ AI (รอบ 2) — TutorExamAnalytics.jsx
#  1) เลิกใช้แผงลอย (drawer) กลับมาเป็นการ์ดในโมดัลเดิม + ปุ่มสลับ Info / ข้อความ (แบบที่ 1)
#     มุมมอง Info จัดเต็ม: สรุปผล + ตัวเลข 4 ช่อง + แถบรายหมวด + จุดเข้าใจผิด + แผนทำต่อ
#     + พฤติกรรม + ข้อความถึงผู้ปกครอง (ใช้ไอคอน lucide ไม่ใช้อิโมจิ)
#     มุมมอง ข้อความ = AiSummaryDetail ตัวเดิม (ไม่แตะ TutorExamDetail.jsx)
#  2) ย้ายแถบ AI ของห้อง (สถานะ/วิเคราะห์ใหม่/ส่งออกรายงานผู้ปกครองทั้งห้อง) จากแท็บ
#     "ภาพรวม" ไปอยู่แท็บ "รายคน" อย่างเดียว พร้อมปุ่มเลือกรอบในแถบเอง
# ไม่แตะการ์ดคะแนน/กราฟ/Pre-Mid-Post หรือข้อมูลผลสอบหลัก
import io, os, shutil

path = os.path.join(os.environ["HOME"], "mnt", "react", "project", "src", "pagetutor", "TutorExamAnalytics.jsx")
BACKUP_DIR = os.path.join(os.environ["HOME"], "mnt", "react", "project", "_edit_scripts", "backup_20260920")
os.makedirs(BACKUP_DIR, exist_ok=True)
shutil.copyfile(path, os.path.join(BACKUP_DIR, "TutorExamAnalytics.jsx.before7.jsx"))

s = io.open(path, encoding="utf-8").read()
orig = s


def do_replace(s, old, new, label):
    cnt = s.count(old)
    assert cnt == 1, f"[{label}] คาดว่าจะพบ 1 ครั้ง แต่พบ {cnt} ครั้ง"
    return s.replace(old, new, 1)


def slice_replace(s, start_marker, end_marker, new, label, keep_end=True):
    assert s.count(start_marker) == 1, f"[{label}] start พบ {s.count(start_marker)} ครั้ง"
    a = s.index(start_marker)
    b = s.index(end_marker, a)
    assert b > a, f"[{label}] ลำดับ marker ผิด"
    return s[:a] + new + (s[b:] if keep_end else s[b + len(end_marker):])


# ── imports ───────────────────────────────────────────────────────────
s = do_replace(s, 'import { createPortal } from "react-dom";\n', "", "remove createPortal")
s = do_replace(
    s,
    "  X, Eye, ChevronRight, ArrowUpRight, ArrowDownRight, ChevronDown, Sparkles, Minus, PanelRightOpen,\n",
    "  X, Eye, ChevronRight, ArrowUpRight, ArrowDownRight, ChevronDown, Sparkles, Minus,\n"
    "  TrendingDown, Rocket, Target, ListChecks, Timer, MessageCircle, Copy, Pencil, Check,\n"
    "  AlertCircle, LayoutGrid, FileText,\n",
    "lucide imports",
)

# ── 1a) แทนที่ component ของ drawer ด้วย component มุมมอง Info ───────────
NEW_COMPONENTS = r'''// ─── การ์ด AI มุมมอง Info ────────────────────────────────────────────────────
// feedback อาจารย์: "ทำเป็น info ด้วย" — เดิมบทวิเคราะห์เป็นย่อหน้าต่อกันยาว อ่านจับประเด็นยาก
// มุมมอง Info จัดข้อมูลชุดเดิมจาก AI (ไม่ได้สั่ง AI ใหม่) + คะแนนที่ระบบมีอยู่แล้ว (อ่านอย่างเดียว)
// ให้เป็นตัวเลข/แถบ/ไอคอน ส่วนข้อความเต็มยังอยู่ครบในมุมมอง "ข้อความ" (AiSummaryDetail ตัวเดิม)

// trend จาก AI เป็นข้อความอิสระ (ไม่มี enum ตายตัว) เดาทิศทางจากคำเพื่อใส่ลูกศรประกอบ
// ถ้าเดาไม่ได้ให้เป็นกลาง และยังโชว์ข้อความ trend เดิมควบคู่เสมอ กันการตีความผิด
const aiTrendDirection = (trend) => {
  const t = String(trend || "");
  if (/ดีขึ้น|พัฒนา|เพิ่มขึ้น|ก้าวหน้า|สูงขึ้น|ดีมาก|แข็งแรง/.test(t)) return "up";
  if (/ลดลง|แย่ลง|ถดถอย|ต่ำลง|ตกลง|อ่อน|ต้องปรับ/.test(t)) return "down";
  return "flat";
};

// ตัดข้อความยาวเหลือไม่เกิน max ตัวอักษร (ใช้ในมุมมอง Info เท่านั้น ข้อความเต็มอยู่ในมุมมอง "ข้อความ")
const aiSnippet = (text, max = 110) => {
  const t = String(text || "").trim();
  if (t.length <= max) return t;
  return `${t.slice(0, max).trimEnd()}…`;
};

// ดึงเลขข้อจากหลักฐานของ AI เช่น "ข้อ 12, 18 และ 24" → ["12","18","24"] (ไม่เจอคืน [])
const aiQuestionRefs = (text) => {
  const out = [];
  const re = /ข้อ(?:ที่)?\s*(\d+(?:\s*(?:,|และ)\s*\d+)*)/g;
  let m;
  while ((m = re.exec(String(text || ""))) !== null) {
    m[1].split(/\s*(?:,|และ)\s*/).forEach((n) => {
      if (n && !out.includes(n)) out.push(n);
    });
  }
  return out.slice(0, 8);
};

// คำสรุปพัฒนาการจากคะแนนรวม % ที่เปลี่ยนไป (scoreChange คำนวณไว้แล้วในโมดัล)
const aiVerdict = (scoreChange) => {
  if (scoreChange == null) return null;
  if (scoreChange >= 5) return { label: "พัฒนาขึ้นชัดเจน", icon: Rocket, tone: "emerald" };
  if (scoreChange > 0) return { label: "พัฒนาขึ้นเล็กน้อย", icon: TrendingUp, tone: "emerald" };
  if (scoreChange === 0) return { label: "คะแนนเท่าเดิม", icon: Minus, tone: "slate" };
  if (scoreChange > -5) return { label: "ลดลงเล็กน้อย", icon: TrendingDown, tone: "amber" };
  return { label: "คะแนนลดลง ควรติดตาม", icon: TrendingDown, tone: "red" };
};

const AI_TONE = {
  emerald: { box: "bg-emerald-50 border-emerald-200", icon: "text-emerald-600", text: "text-emerald-700" },
  slate: { box: "bg-slate-50 border-slate-200", icon: "text-slate-500", text: "text-slate-700" },
  amber: { box: "bg-amber-50 border-amber-200", icon: "text-amber-600", text: "text-amber-700" },
  red: { box: "bg-red-50 border-red-200", icon: "text-red-500", text: "text-red-600" },
};

function AiInfoSection({ title, icon: Icon, hint, className = "mt-2.5", children }) {
  return (
    <div className={`bg-white border border-orange-100 rounded-xl px-3.5 py-3 ${className}`}>
      <p className="text-[11px] font-bold text-orange-700 flex items-center gap-1.5 mb-2.5">
        {Icon && <Icon className="h-3.5 w-3.5" />} {title}
        {hint && <span className="ml-auto font-medium text-[10px] text-slate-400">{hint}</span>}
      </p>
      {children}
    </div>
  );
}

function AiInsightInfo({ row, exams, latestIndex, scoreChange, first, last, parentMessage, onEditText }) {
  const [openTopics, setOpenTopics] = useState(() => new Set());
  const [copied, setCopied] = useState(false);

  const latest = exams[latestIndex];
  const topicPcts = latest?.topicPcts || {};
  const aiTopics = (row.byCategory || []).filter((c) => c.topic);
  // ถ้า AI ไม่ได้ส่งรายหมวดมา แต่ระบบมี % รายหมวดอยู่แล้ว ก็ยังแสดงแถบได้ (แค่ไม่มีป้ายแนวโน้ม)
  const topics = aiTopics.length > 0
    ? aiTopics.map((c) => ({ topic: c.topic, trend: c.trend, comment: c.comment, pct: topicPcts[c.topic] }))
    : Object.keys(topicPcts).map((t) => ({ topic: t, trend: null, comment: null, pct: topicPcts[t] }));
  const upCount = aiTopics.filter((c) => c.trend && aiTrendDirection(c.trend) === "up").length;
  const downCount = aiTopics.filter((c) => c.trend && aiTrendDirection(c.trend) === "down").length;
  const misconceptions = row.misconceptions || [];
  const focusNext = row.focusNext || [];
  const verdict = aiVerdict(scoreChange);
  const tone = AI_TONE[verdict?.tone || "slate"];
  const VerdictIcon = verdict?.icon || BarChart2;

  const toggleTopic = (i) => {
    setOpenTopics((prev) => {
      const next = new Set(prev);
      if (next.has(i)) next.delete(i);
      else next.add(i);
      return next;
    });
  };

  // รูปแบบเดียวกับปุ่ม "คัดลอกเฉพาะท่อนนี้" ใน AiSummaryDetail (ชื่อ + ข้อความ)
  const copyMessage = async () => {
    try {
      await navigator.clipboard.writeText(`${row.nickname || row.studentName}\n\n${parentMessage}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Copy failed:", err);
    }
  };

  const kpis = [
    { icon: TrendingUp, n: upCount, label: "หมวดที่ดีขึ้น", color: "text-emerald-600" },
    { icon: TrendingDown, n: downCount, label: "หมวดที่ต้องเสริม", color: "text-red-500" },
    { icon: AlertCircle, n: misconceptions.length, label: "จุดเข้าใจผิด", color: "text-amber-600" },
    { icon: ListChecks, n: focusNext.length, label: "สิ่งที่ควรทำต่อ", color: "text-orange-600" },
  ];

  return (
    <div>
      {/* สรุปผล */}
      <div className={`grid grid-cols-[auto_1fr] sm:grid-cols-[auto_1fr_auto] gap-3.5 items-center border rounded-xl p-3.5 ${tone.box}`}>
        <div className="h-12 w-12 rounded-2xl bg-white flex items-center justify-center shadow-sm">
          <VerdictIcon className={`h-6 w-6 ${tone.icon}`} />
        </div>
        <div className="min-w-0">
          {verdict ? (
            <p className={`text-base font-black ${tone.text}`}>
              {verdict.label} {scoreChange > 0 ? "+" : ""}{scoreChange}%
            </p>
          ) : (
            <p className="text-base font-black text-slate-700">ผลสอบรอบ {latest?.label}</p>
          )}
          <p className="text-[11px] text-slate-500 mt-0.5">
            {verdict
              ? `คะแนนรวม ${fmtPct(first.pct)} → ${fmtPct(last.pct)}`
              : `ได้ ${fmtPct(latest.pct)} · ต้องสอบอย่างน้อย 2 รอบถึงจะเทียบพัฒนาการได้`}
            {latest?.rank != null && ` · อันดับล่าสุด ${latest.rank}/${latest.totalStudents}`}
          </p>
        </div>
        <div className="col-span-2 sm:col-span-1 flex items-end justify-center gap-2.5">
          {exams.map((e, i) => (
            <div key={e.label} className="flex flex-col items-center gap-1">
              <span className="text-[10px] font-bold text-slate-600">{e.submitted ? Math.round(e.pct * 100) : "–"}</span>
              <div
                className={`w-5 rounded-t-md rounded-b-sm ${e.submitted ? (i === latestIndex ? "bg-orange-500" : "bg-orange-200") : "bg-slate-200"}`}
                style={{ height: `${e.submitted ? Math.max(6, Math.round(e.pct * 44)) : 6}px` }}
              />
              <span className="text-[9px] font-semibold text-slate-400">{String(e.label).replace(/-test$/i, "")}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ตัวเลขสรุป 4 ช่อง */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-2.5">
        {kpis.map((k) => {
          const KpiIcon = k.icon;
          return (
            <div key={k.label} className="bg-white border border-orange-100 rounded-xl p-2.5 text-center">
              <KpiIcon className={`h-4 w-4 mx-auto ${k.color}`} />
              <p className={`text-xl font-black leading-tight mt-0.5 ${k.color}`}>{k.n}</p>
              <p className="text-[10px] font-semibold text-slate-500">{k.label}</p>
            </div>
          );
        })}
      </div>

      {/* แถบความเข้าใจรายหมวด */}
      {topics.length > 0 && (
        <AiInfoSection
          title={`ความเข้าใจรายหมวด (รอบ ${latest?.label})`}
          icon={BarChart2}
          hint={topics.some((t) => t.comment) ? "กดที่แถบเพื่อดูคำอธิบาย" : null}
        >
          <div className="space-y-2">
            {topics.map((t, i) => {
              const dir = aiTrendDirection(t.trend);
              const hasPct = t.pct != null;
              const bar = !hasPct ? "bg-slate-200" : t.pct >= 0.7 ? "bg-emerald-500" : t.pct >= 0.5 ? "bg-amber-400" : "bg-red-500";
              const open = openTopics.has(i);
              return (
                <div key={i}>
                  <button
                    type="button"
                    onClick={() => t.comment && toggleTopic(i)}
                    className={`w-full flex items-center gap-2 text-left ${t.comment ? "cursor-pointer" : "cursor-default"}`}
                  >
                    <span className="w-28 flex-shrink-0 flex items-center gap-1 text-xs font-bold text-slate-700 min-w-0">
                      {t.trend && (dir === "up" ? <ArrowUpRight className="h-3.5 w-3.5 text-emerald-600 flex-shrink-0" />
                        : dir === "down" ? <ArrowDownRight className="h-3.5 w-3.5 text-red-500 flex-shrink-0" />
                          : <Minus className="h-3.5 w-3.5 text-slate-400 flex-shrink-0" />)}
                      <span className="truncate" title={t.topic}>{t.topic}</span>
                    </span>
                    <span className="flex-1 h-2.5 rounded-full bg-slate-100 overflow-hidden">
                      <span className={`block h-full rounded-full ${bar}`} style={{ width: hasPct ? `${Math.round(t.pct * 100)}%` : "0%" }} />
                    </span>
                    <span className="w-10 text-right text-[11px] font-black text-slate-700">{hasPct ? `${Math.round(t.pct * 100)}%` : "—"}</span>
                    {t.trend && (
                      <span
                        title={t.trend}
                        className={`flex-shrink-0 max-w-[7rem] truncate text-[10px] font-bold rounded-full px-2 py-0.5 ${dir === "up" ? "bg-emerald-50 text-emerald-700" : dir === "down" ? "bg-red-50 text-red-600" : "bg-slate-100 text-slate-500"}`}
                      >
                        {t.trend}
                      </span>
                    )}
                    {t.comment && <ChevronDown className={`h-3.5 w-3.5 text-slate-400 flex-shrink-0 transition ${open ? "rotate-180" : ""}`} />}
                  </button>
                  {open && t.comment && (
                    <p className="mt-1.5 sm:ml-[7.5rem] text-[11px] text-slate-500 bg-slate-50 rounded-lg px-2.5 py-1.5 leading-relaxed">{t.comment}</p>
                  )}
                </div>
              );
            })}
          </div>
        </AiInfoSection>
      )}

      {/* จุดเข้าใจผิด + แผนทำต่อ */}
      {(misconceptions.length > 0 || focusNext.length > 0) && (
        <div className={`grid gap-2.5 mt-2.5 ${misconceptions.length > 0 && focusNext.length > 0 ? "md:grid-cols-2" : ""}`}>
          {misconceptions.length > 0 && (
            <AiInfoSection title="จุดที่น่าจะเข้าใจผิด" icon={AlertTriangle} className="">
              <div className="space-y-2">
                {misconceptions.map((m, i) => {
                  const refs = aiQuestionRefs(m.evidence);
                  return (
                    <div key={i} className="flex gap-2.5 bg-red-50 border border-red-100 rounded-xl p-2.5">
                      <span className="h-7 w-7 rounded-lg bg-white border border-red-100 flex items-center justify-center flex-shrink-0">
                        <AlertCircle className="h-4 w-4 text-red-500" />
                      </span>
                      <div className="min-w-0">
                        <p className="text-xs font-black text-red-800">{m.topic}</p>
                        <p className="text-[11px] text-red-900/80 leading-relaxed mt-0.5">{aiSnippet(m.pattern, 90)}</p>
                        {refs.length > 0 ? (
                          <div className="flex flex-wrap gap-1 mt-1.5">
                            {refs.map((n) => (
                              <span key={n} className="text-[10px] font-bold bg-white border border-red-200 text-red-600 rounded-md px-1.5 py-0.5">ข้อ {n}</span>
                            ))}
                          </div>
                        ) : m.evidence ? (
                          <p className="text-[10px] text-red-700/70 mt-1">หลักฐาน: {aiSnippet(m.evidence, 60)}</p>
                        ) : null}
                      </div>
                    </div>
                  );
                })}
              </div>
            </AiInfoSection>
          )}
          {focusNext.length > 0 && (
            <AiInfoSection title="แผนที่ควรทำต่อ" icon={Target} className="">
              <ol>
                {focusNext.map((f, i) => {
                  const action = typeof f === "string" ? f : f.action;
                  const why = typeof f === "string" ? null : f.why;
                  const isLast = i === focusNext.length - 1;
                  return (
                    <li key={i} className={`relative flex gap-2.5 ${isLast ? "" : "pb-3"}`}>
                      {!isLast && <span className="absolute left-[11px] top-6 bottom-0 w-0.5 bg-orange-200" />}
                      <span className="relative z-10 h-6 w-6 rounded-full bg-orange-500 text-white text-[11px] font-black flex items-center justify-center flex-shrink-0">
                        {i + 1}
                      </span>
                      <div className="min-w-0 pt-0.5">
                        <p className="text-xs font-bold text-slate-800 leading-relaxed">{action}</p>
                        {why && <p className="text-[10.5px] text-slate-400 leading-relaxed">{aiSnippet(why, 70)}</p>}
                      </div>
                    </li>
                  );
                })}
              </ol>
            </AiInfoSection>
          )}
        </div>
      )}

      {/* พฤติกรรม + ข้อความถึงผู้ปกครอง */}
      <div className={`grid gap-2.5 mt-2.5 ${row.behavior ? "md:grid-cols-2" : ""}`}>
        {row.behavior && (
          <AiInfoSection title="พฤติกรรมการทำข้อสอบ" icon={Timer} className="">
            <div className="flex gap-2.5 items-start">
              <span className="h-8 w-8 rounded-lg bg-orange-50 flex items-center justify-center flex-shrink-0">
                <Clock className="h-4 w-4 text-orange-600" />
              </span>
              <p className="text-[11.5px] text-slate-700 leading-relaxed">{aiSnippet(row.behavior, 110)}</p>
            </div>
          </AiInfoSection>
        )}
        <AiInfoSection title="ข้อความถึงผู้ปกครอง" icon={MessageCircle} className="">
          {parentMessage ? (
            <p className="text-[11.5px] text-slate-700 bg-slate-50 rounded-lg px-2.5 py-2 leading-relaxed">{aiSnippet(parentMessage, 120)}</p>
          ) : (
            <p className="text-[11px] text-slate-400">ยังไม่มีข้อความ</p>
          )}
          <div className="flex gap-1.5 mt-2">
            <button
              type="button"
              onClick={copyMessage}
              disabled={!parentMessage}
              className="flex items-center gap-1 text-[11px] font-bold text-orange-700 bg-orange-50 hover:bg-orange-100 border border-orange-200 rounded-lg px-2.5 py-1 transition disabled:opacity-40"
            >
              {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />} {copied ? "คัดลอกแล้ว" : "คัดลอก"}
            </button>
            <button
              type="button"
              onClick={onEditText}
              className="flex items-center gap-1 text-[11px] font-bold text-slate-600 hover:text-orange-700 bg-white border border-slate-200 hover:border-orange-200 rounded-lg px-2.5 py-1 transition"
            >
              <Pencil className="h-3.5 w-3.5" /> แก้ไข
            </button>
          </div>
        </AiInfoSection>
      </div>
    </div>
  );
}

'''
s = slice_replace(
    s,
    "// ─── บทวิเคราะห์ AI แบบแผงลอย (drawer) ─────────────────────────────────────────\n",
    "function StudentProgressModal({ studentId, crossExamData, aiSummaries, courseName, subjectName, onClose }) {",
    NEW_COMPONENTS,
    "replace drawer components",
)

# ── 1b) state ─────────────────────────────────────────────────────────
s = do_replace(
    s,
    "  const [aiDetailOpen, setAiDetailOpen] = useState(false);\n",
    '  const [aiView, setAiView] = useState("info"); // มุมมองการ์ด AI: "info" | "text"\n',
    "state aiView",
)

# ── 1c) การ์ด AI ในโมดัล ──────────────────────────────────────────────
NEW_CARD = r'''      {aiSummaryRow && (
        <div className="mb-6 bg-gradient-to-br from-orange-50 to-amber-50 border border-orange-100 rounded-xl px-4 py-3.5">
          {/* (ปรับดีไซน์ตาม feedback อาจารย์) เปิดโมดัลมาเห็นมุมมอง Info ทันที สลับเป็นข้อความเต็มได้ */}
          <div className="flex items-center justify-between gap-3 flex-wrap mb-3">
            <p className="text-xs font-bold text-orange-700 flex items-center gap-1.5 flex-wrap">
              <Sparkles className="h-3.5 w-3.5" /> สรุปโดย AI · {data.exams[lastSubmittedIndex].label}
              {aiSummaryRow.model && <span className="font-normal text-[10px] text-slate-400">· โดย {aiSummaryRow.model}</span>}
            </p>
            <div className="flex items-center gap-2 flex-wrap">
              <div className="inline-flex bg-white border border-orange-200 rounded-full p-0.5">
                {[["info", "Info", LayoutGrid], ["text", "ข้อความ", FileText]].map((opt) => {
                  const [key, label] = opt;
                  const ViewIcon = opt[2];
                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() => setAiView(key)}
                      className={`flex items-center gap-1 px-3 py-1 text-[11px] font-bold rounded-full transition ${aiView === key ? "bg-orange-500 text-white shadow-sm" : "text-orange-700 hover:text-orange-800"}`}
                    >
                      <ViewIcon className="h-3.5 w-3.5" /> {label}
                    </button>
                  );
                })}
              </div>
              {/* (Phase 3) ส่งออกรายงานคนนี้เป็น PDF เดี่ยว — ใช้ฟังก์ชันกลางร่วมกับปุ่ม
                  "ส่งออกทั้งห้อง" ในแท็บ "รายคน" (ดู buildStudentReportPageHtml ด้านล่าง) */}
              <button
                onClick={() => exportStudentAiReportPdf({
                  name: data.name,
                  examLabel: data.exams[lastSubmittedIndex].label,
                  courseName,
                  subjectName,
                  examInfo: data.exams[lastSubmittedIndex],
                  prevTopicPcts: lastSubmittedIndex > 0 ? data.exams[lastSubmittedIndex - 1]?.topicPcts : null,
                  aiRow: aiSummaryRow,
                })}
                className="flex items-center gap-1 text-[11px] font-bold text-orange-600 bg-white hover:bg-orange-100 border border-orange-200 rounded-full px-3 py-1 transition"
              >
                <Download className="h-3.5 w-3.5" /> PDF
              </button>
            </div>
          </div>
          {aiView === "info" ? (
            <AiInsightInfo
              row={aiSummaryRow}
              exams={data.exams}
              latestIndex={lastSubmittedIndex}
              scoreChange={scoreChange}
              first={first}
              last={last}
              parentMessage={aiParentMessage}
              onEditText={() => setAiView("text")}
            />
          ) : (
            <div className="-mx-4 -mb-3.5">
              <AiSummaryDetail
                row={aiSummaryRow}
                parentMessage={aiParentMessage}
                dirty={aiDirty}
                saving={aiSaving}
                onDraftChange={setAiDraft}
                onSave={saveAiSummary}
              />
            </div>
          )}
        </div>
      )}

'''
s = slice_replace(
    s,
    '      {aiSummaryRow && (\n        <div className="mb-6 bg-gradient-to-br from-orange-50 to-amber-50',
    "      {!hasEnoughData ? (",
    NEW_CARD,
    "replace AI card",
)

# ── 2) ย้ายแถบ AI ของห้องไปแท็บ "รายคน" ─────────────────────────────────
# 2a) ลบออกจากตำแหน่งเดิม (อยู่ก่อน Tab Nav และแสดงเฉพาะแท็บภาพรวม)
s = slice_replace(
    s,
    '      {/* (Phase 3) แถบ AI ของห้อง — สถานะ + ปุ่ม "วิเคราะห์ใหม่" (ย้ายมาจากหน้า "จัดการรอบสอบ")\n',
    "      {/* Tab Nav",
    "",
    "remove strip from overview",
)

# 2b) ใส่ไว้ใต้แถวแท็บ แสดงเฉพาะแท็บรายคน พร้อมปุ่มเลือกรอบในแถบเอง
NEW_STRIP = r'''      {/* แถบ AI ของห้อง — สถานะ + ปุ่ม "วิเคราะห์ใหม่" + "ส่งออกรายงานผู้ปกครองทั้งห้อง (PDF)"
          (ย้ายจากแท็บ "ภาพรวม" มาอยู่แท็บ "รายคน" อย่างเดียว) ปุ่มเลือกรอบเดิมอยู่แค่แท็บภาพรวม
          จึงใส่ปุ่มเลือกรอบไว้ในแถบนี้เองด้วย (ใช้ state examId ร่วมกับแท็บภาพรวม) */}
      {activeTab === "progress" && (
        <div className="bg-white border border-slate-200 rounded-2xl px-5 py-3.5 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0 flex-wrap">
            <Sparkles className="h-4 w-4 text-amber-500 flex-shrink-0" />
            <p className="text-xs text-slate-500">
              {aiSummaries[examId] == null
                ? "กำลังตรวจสอบสถานะวิเคราะห์ AI…"
                : aiSummaries[examId].length > 0
                  ? `AI วิเคราะห์แล้ว ${aiSummaries[examId].length} จาก ${examResults[examId]?.submittedCount || 0} คน ของรอบ ${examLabel}`
                  : examResults[examId]?.submittedCount
                    ? `ยังไม่มีผลวิเคราะห์ AI ของรอบ ${examLabel} — ปกติจะขึ้นเองไม่นานหลังปิดสอบ`
                    : `ยังไม่มีนักเรียนส่งคำตอบรอบ ${examLabel} จึงยังวิเคราะห์ไม่ได้`}
            </p>
            <div className="flex rounded-lg overflow-hidden border border-slate-200 flex-shrink-0">
              {EXAMS_META.map(e => (
                <button key={e.id} onClick={() => setExamId(e.id)}
                  className={`px-2.5 py-1 text-[11px] font-bold transition ${examId === e.id ? "bg-orange-500 text-white" : "bg-white text-slate-600 hover:bg-slate-50"}`}>
                  {e.label}
                </button>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              onClick={handleReanalyze}
              disabled={reanalyzing || !examResults[examId]?.submittedCount}
              className="flex items-center gap-1.5 text-xs font-semibold text-orange-600 hover:text-orange-700 bg-orange-50 hover:bg-orange-100 disabled:opacity-40 border border-orange-100 rounded-lg px-3 py-1.5 transition"
            >
              <Sparkles className="h-3.5 w-3.5" />
              {reanalyzing ? "กำลังวิเคราะห์…" : "วิเคราะห์ใหม่"}
            </button>
            <button
              onClick={() => exportRoomAiReportPdf(crossExamDataForExport, examId, aiSummaries[examId], courseName, subjectName, examLabel)}
              disabled={!(aiSummaries[examId]?.length)}
              className="flex items-center gap-1.5 border border-orange-200 bg-orange-50 hover:bg-orange-100 disabled:opacity-40 disabled:cursor-not-allowed text-orange-700 rounded-xl px-3 py-1.5 text-xs font-bold transition"
            >
              <Download className="h-3.5 w-3.5" /> ส่งออกรายงานผู้ปกครองทั้งห้อง (PDF)
            </button>
          </div>
          {reanalyzeError && <p className="w-full text-[11px] text-amber-600">{reanalyzeError}</p>}
        </div>
      )}

'''
s = do_replace(s, "      {/* Content */}\n", NEW_STRIP + "      {/* Content */}\n", "insert strip in progress tab")

# 2c) อัปเดตคอมเมนต์ที่อ้างถึงตำแหน่งปุ่มเดิม
s = do_replace(
    s,
    '// "ส่งออกรายงานผู้ปกครองทั้งห้อง" (แท็บ "ภาพรวม" ใน ExamAnalyticsView) — โค้ดสร้างหน้า',
    '// "ส่งออกรายงานผู้ปกครองทั้งห้อง" (แท็บ "รายคน" ใน ExamAnalyticsView) — โค้ดสร้างหน้า',
    "comment 1",
)
s = do_replace(
    s,
    '// ปุ่ม "ส่งออกรายงานผู้ปกครองทั้งห้อง (PDF)" — เรียกจากแท็บ "ภาพรวม" สโคปตามรอบที่เลือกอยู่',
    '// ปุ่ม "ส่งออกรายงานผู้ปกครองทั้งห้อง (PDF)" — เรียกจากแท็บ "รายคน" สโคปตามรอบที่เลือกอยู่',
    "comment 2",
)

assert "createPortal" not in s and "AiAnalysisDrawer" not in s and "aiDetailOpen" not in s
assert s.count('AI วิเคราะห์แล้ว ${aiSummaries[examId].length}') == 1
assert s != orig
io.open(path, "w", encoding="utf-8").write(s)
print("DONE - TutorExamAnalytics.jsx: การ์ด AI แบบ Info/ข้อความ + ย้ายแถบ AI ไปแท็บรายคน")
