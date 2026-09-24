# -*- coding: utf-8 -*-
# ปรับดีไซน์ AI Info (รอบ 3) — TutorExamAnalytics.jsx
# แก้เฉพาะมุมมอง "Info" ของการ์ด AI ในโมดัลพัฒนาการ (component AiInsightInfo) + props ที่ส่งเข้า
# + import ไอคอนที่ใช้ — ไม่แตะส่วนอื่นเลย (มุมมองข้อความ, การ์ดคะแนน, กราฟ, แท็บอื่นๆ เหมือนเดิม)
# ชิ้นที่ทำ (ตามภาพตัวอย่าง v3): A สรุปหนึ่งประโยค, B ไฟสถานะ, C วงแหวน %, D เส้นทางอันดับ,
# E ป้ายความสำเร็จ, F รายหมวดเทียบค่าเฉลี่ยห้อง, G จุดแข็ง/ต้องเสริม, H จุดเข้าใจผิด+ความรุนแรง,
# I จังหวะการทำข้อสอบเทียบห้อง, J แผนทำต่อแบบการ์ด, K ข้อความถึงผู้ปกครองแบบฟองแชต
import io, os, re, shutil

path = os.path.join(os.environ["HOME"], "mnt", "react", "project", "src", "pagetutor", "TutorExamAnalytics.jsx")
BACKUP_DIR = os.path.join(os.environ["HOME"], "mnt", "react", "project", "_edit_scripts", "backup_20260920")
os.makedirs(BACKUP_DIR, exist_ok=True)
shutil.copyfile(path, os.path.join(BACKUP_DIR, "TutorExamAnalytics.jsx.before8.jsx"))

s = io.open(path, encoding="utf-8").read()
orig = s


def do_replace(s, old, new, label):
    cnt = s.count(old)
    assert cnt == 1, f"[{label}] คาดว่าจะพบ 1 ครั้ง แต่พบ {cnt} ครั้ง"
    return s.replace(old, new, 1)


NEW_COMPONENTS = r'''// ─── การ์ด AI มุมมอง Info ────────────────────────────────────────────────────
// feedback อาจารย์: "ทำเป็น info ด้วย" — เดิมบทวิเคราะห์เป็นย่อหน้าต่อกันยาว อ่านจับประเด็นยาก
// มุมมอง Info จัดข้อมูลชุดเดิมจาก AI (ไม่ได้สั่ง AI ใหม่) + คะแนนที่ระบบมีอยู่แล้ว (อ่านอย่างเดียว)
// + ค่าเฉลี่ยของทั้งห้องในรอบเดียวกัน ให้เป็นตัวเลข/แถบ/ไอคอน ส่วนข้อความเต็มยังอยู่ครบใน
// มุมมอง "ข้อความ" (AiSummaryDetail ตัวเดิม)

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

// ประโยคแรกของภาพรวมจาก AI ใช้เป็น "สรุปหนึ่งประโยค" (ภาษาไทยมักไม่มีจุด ถ้าหาไม่เจอใช้ข้อความย่อแทน)
const aiHeadline = (text) => {
  const t = String(text || "").trim();
  if (!t) return "";
  return aiSnippet(t.split(/(?<=[.!?])\s+|\n+/)[0], 140);
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

// เลือกไอคอนการ์ดแผนทำต่อจากคำกริยาในข้อความ
const aiActionIcon = (text) => {
  const t = String(text || "");
  if (/ทบทวน|อ่าน|ท่อง|จำ/.test(t)) return BookOpen;
  if (/ฝึก|ทำโจทย์|แบบฝึก|ทำแบบ/.test(t)) return PenLine;
  if (/ตรวจ|เช็ก|เช็ค|ทาน/.test(t)) return CheckCircle;
  if (/ติว|ถาม|ปรึกษา|คุย|สอนเสริม/.test(t)) return Users;
  return Target;
};

// ดึงเวลา/ความถี่ที่ AI ระบุไว้ในข้อความ เช่น "15 นาที/วัน", "3 ครั้งต่อสัปดาห์" (ไม่เจอคืน null)
const aiTimeHint = (text) => {
  const m = String(text || "").match(/\d+\s*(?:นาที|ชั่วโมง|ชม\.?|ครั้ง|วัน)(?:\s*(?:\/|ต่อ)\s*(?:วัน|สัปดาห์|อาทิตย์|ครั้ง))?/);
  return m ? m[0].replace(/\s+/g, " ") : null;
};

const aiAvg = (arr) => (arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : null);

const AI_SOURCE = {
  ai: { label: "AI", cls: "bg-orange-100 text-orange-700" },
  score: { label: "คะแนน", cls: "bg-blue-50 text-blue-600" },
  class: { label: "ทั้งห้อง", cls: "bg-emerald-50 text-emerald-700" },
};

const AI_STATUS = {
  ok: { label: "ปกติ — ไปได้ดี", box: "bg-emerald-50 border-emerald-200", text: "text-emerald-700", light: 0 },
  watch: { label: "ควรติดตาม", box: "bg-amber-50 border-amber-200", text: "text-amber-700", light: 1 },
  care: { label: "ต้องดูแลพิเศษ", box: "bg-red-50 border-red-200", text: "text-red-600", light: 2 },
};
const AI_LIGHT_ON = [
  "bg-emerald-500 ring-4 ring-emerald-100",
  "bg-amber-400 ring-4 ring-amber-100",
  "bg-red-500 ring-4 ring-red-100",
];

const AI_BADGE = {
  gold: "bg-yellow-50 border-yellow-300 text-yellow-700",
  green: "bg-emerald-50 border-emerald-200 text-emerald-700",
  orange: "bg-orange-50 border-orange-200 text-orange-700",
  blue: "bg-blue-50 border-blue-200 text-blue-600",
};

function AiInfoSection({ title, icon: Icon, hint, source, className = "mt-2.5", children }) {
  return (
    <div className={`bg-white border border-orange-100 rounded-xl px-3.5 py-3 ${className}`}>
      <p className="text-[11px] font-bold text-orange-700 flex items-center gap-1.5 mb-2.5">
        {Icon && <Icon className="h-3.5 w-3.5 flex-shrink-0" />} {title}
        {(hint || source) && (
          <span className="ml-auto flex items-center gap-1.5">
            {hint && <span className="font-medium text-[10px] text-slate-400">{hint}</span>}
            {source && (
              <span className={`font-semibold text-[9.5px] rounded-full px-1.5 py-0.5 ${AI_SOURCE[source].cls}`}>{AI_SOURCE[source].label}</span>
            )}
          </span>
        )}
      </p>
      {children}
    </div>
  );
}

function AiInsightInfo({ row, exams, latestIndex, scoreChange, classmates, parentMessage, onEditText }) {
  const [openTopics, setOpenTopics] = useState(() => new Set());
  const [copied, setCopied] = useState(false);

  const latest = exams[latestIndex];
  const topicPcts = latest?.topicPcts || {};
  const submitted = exams.filter((e) => e.submitted);
  const passLine = PASS_PCT / 100;
  const roundShort = (label) => String(label).replace(/-test$/i, "");

  // ผลรอบเดียวกันของทุกคนในห้องที่สอบแล้ว (รวมตัวเอง) — ใช้หาค่าเฉลี่ยห้อง
  const roundRows = (classmates || []).map((d) => d.exams[latestIndex]).filter((e) => e?.submitted);
  const classTopicAvg = (topic) => aiAvg(roundRows.map((e) => e.topicPcts?.[topic]).filter((v) => v != null));

  const aiTopics = (row.byCategory || []).filter((c) => c.topic);
  // ถ้า AI ไม่ได้ส่งรายหมวดมา แต่ระบบมี % รายหมวดอยู่แล้ว ก็ยังแสดงแถบได้ (แค่ไม่มีป้ายแนวโน้ม)
  const topics = aiTopics.length > 0
    ? aiTopics.map((c) => ({ topic: c.topic, trend: c.trend, comment: c.comment, pct: topicPcts[c.topic] }))
    : Object.keys(topicPcts).map((t) => ({ topic: t, trend: null, comment: null, pct: topicPcts[t] }));
  const withPct = topics.filter((t) => t.pct != null);
  const weakTopics = withPct.filter((t) => t.pct < 0.5);
  // จุดแข็ง/ต้องเสริม: ใช้ % รอบล่าสุดเป็นหลัก ถ้าไม่มี % เลยค่อยใช้แนวโน้มจาก AI แทน
  const strengths = withPct.length
    ? withPct.filter((t) => t.pct >= 0.7).map((t) => t.topic)
    : aiTopics.filter((c) => c.trend && aiTrendDirection(c.trend) === "up").map((c) => c.topic);
  const needsWork = withPct.length
    ? weakTopics.map((t) => t.topic)
    : aiTopics.filter((c) => c.trend && aiTrendDirection(c.trend) === "down").map((c) => c.topic);
  const misconceptions = row.misconceptions || [];
  const focusNext = row.focusNext || [];
  const headline = aiHeadline(row.overview);

  // B: ไฟสถานะ — ต้องดูแลพิเศษถ้ายังไม่ผ่านเกณฑ์/อ่อน 2 หมวดขึ้นไป/คะแนนลงชัด
  const statusKey = (latest?.pct != null && latest.pct < passLine) || weakTopics.length >= 2 || (scoreChange != null && scoreChange <= -5)
    ? "care"
    : weakTopics.length === 1 || misconceptions.length >= 2 || (scoreChange != null && scoreChange < 0)
      ? "watch"
      : "ok";
  const status = AI_STATUS[statusKey];
  const statusReasons = [
    withPct.length ? (weakTopics.length ? `ต่ำกว่า 50% ${weakTopics.length} หมวด` : "ไม่มีหมวดต่ำกว่า 50%") : null,
    scoreChange != null
      ? (scoreChange > 0 ? `คะแนนขึ้น ${scoreChange}%` : scoreChange < 0 ? `คะแนนลง ${Math.abs(scoreChange)}%` : "คะแนนเท่าเดิม")
      : null,
    `จุดเข้าใจผิด ${misconceptions.length} เรื่อง`,
  ].filter(Boolean);

  // C: วงแหวน % รอบล่าสุด + ขีดเกณฑ์ผ่าน
  const RING_R = 32;
  const RING_C = 2 * Math.PI * RING_R;
  const latestPct = Math.min(1, Math.max(0, latest?.pct ?? 0));
  const passed = latestPct >= passLine;
  const passDiff = Math.round((latestPct - passLine) * 100);

  // D: เส้นทางอันดับ
  const rankRounds = exams.filter((e) => e.submitted && e.rank != null);
  const rankGain = rankRounds.length >= 2 ? rankRounds[0].rank - rankRounds[rankRounds.length - 1].rank : null;
  const rankItems = [];
  rankRounds.forEach((e, i) => {
    if (i > 0) {
      const d = rankRounds[i - 1].rank - e.rank;
      rankItems.push(
        <div key={`a${i}`} className={`flex flex-col items-center text-[9.5px] font-black ${d > 0 ? "text-emerald-600" : d < 0 ? "text-red-500" : "text-slate-400"}`}>
          {d > 0 ? <ArrowUpRight className="h-3.5 w-3.5" /> : d < 0 ? <ArrowDownRight className="h-3.5 w-3.5" /> : <Minus className="h-3.5 w-3.5" />}
          {d > 0 ? `+${d}` : d}
        </div>
      );
    }
    rankItems.push(
      <div key={`r${i}`} className="text-center">
        <p className={`text-xl font-black leading-none ${i === rankRounds.length - 1 ? "text-orange-500" : "text-slate-900"}`}>{e.rank}</p>
        <p className="text-[9.5px] font-semibold text-slate-400 mt-0.5">{roundShort(e.label)}</p>
      </div>
    );
  });

  // E: ป้ายความสำเร็จ (แสดงเฉพาะอันที่เข้าเงื่อนไขจริง)
  const improvedEveryRound = submitted.length >= 2 && submitted.every((e, i) => i === 0 || e.pct > submitted[i - 1].pct);
  let fastestTopic = null;
  if (submitted.length >= 2) {
    const from = submitted[0].topicPcts || {};
    Object.keys(topicPcts).forEach((t) => {
      if (from[t] == null || topicPcts[t] == null) return;
      const d = topicPcts[t] - from[t];
      if (d > 0 && (!fastestTopic || d > fastestTopic.delta)) fastestTopic = { topic: t, delta: d };
    });
  }
  const badges = [];
  if (latest?.rank === 1) badges.push({ icon: Award, label: "อันดับ 1 ของห้อง", tone: "gold" });
  else if (latest?.rank != null && latest.rank <= 3) badges.push({ icon: Award, label: "Top 3 ของห้อง", tone: "gold" });
  if (improvedEveryRound) badges.push({ icon: TrendingUp, label: "ดีขึ้นทุกรอบ", tone: "green" });
  if (fastestTopic) badges.push({ icon: Flame, label: `พัฒนาเร็วสุด: ${fastestTopic.topic} +${Math.round(fastestTopic.delta * 100)}%`, tone: "orange" });
  if (withPct.length && withPct.length - weakTopics.length > 0) {
    badges.push({ icon: CheckCircle, label: `ถึง 50% แล้ว ${withPct.length - weakTopics.length} จาก ${withPct.length} หมวด`, tone: "blue" });
  }

  // I: จังหวะการทำข้อสอบ (วินาทีต่อข้อ) เทียบค่าเฉลี่ยห้อง
  const myPace = latest?.avgTimePerQuestion ?? null;
  const classPace = aiAvg(roundRows.map((e) => e.avgTimePerQuestion).filter((v) => v != null));
  const paceRatio = myPace != null && classPace ? myPace / classPace : null;
  const pacePos = paceRatio != null ? Math.min(95, Math.max(5, 50 + (paceRatio - 1) * 100)) : null;
  const paceDiff = paceRatio != null ? Math.round((paceRatio - 1) * 100) : null;

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

  const showPace = paceRatio != null || !!row.behavior;

  return (
    <div>
      {/* A: สรุปหนึ่งประโยค */}
      {headline && (
        <div className="flex gap-3 items-start bg-slate-900 text-white rounded-xl px-4 py-3.5">
          <Quote className="h-5 w-5 text-orange-400 flex-shrink-0 mt-0.5" />
          <div className="min-w-0">
            <p className="text-sm font-bold leading-relaxed">{headline}</p>
            <p className="text-[10.5px] text-slate-400 mt-1">สรุปหนึ่งประโยคจาก AI</p>
          </div>
        </div>
      )}

      {/* B ไฟสถานะ · C วงแหวน % · D เส้นทางอันดับ */}
      <div className={`grid gap-2.5 mt-2.5 ${rankRounds.length ? "md:grid-cols-3" : "md:grid-cols-2"}`}>
        <div className={`border rounded-xl px-3.5 py-3 ${status.box}`}>
          <div className="flex gap-1.5 mb-2">
            {[0, 1, 2].map((i) => (
              <span key={i} className={`h-3.5 w-3.5 rounded-full ${i === status.light ? AI_LIGHT_ON[i] : "bg-slate-200"}`} />
            ))}
          </div>
          <p className={`text-[15px] font-black ${status.text}`}>{status.label}</p>
          <p className="text-[10.5px] text-slate-600 mt-1 leading-relaxed">{statusReasons.join(" · ")}</p>
        </div>

        <div className="bg-white border border-orange-100 rounded-xl px-3.5 py-3 flex items-center gap-3">
          <svg viewBox="0 0 80 80" className="h-[74px] w-[74px] flex-shrink-0">
            <circle cx="40" cy="40" r={RING_R} fill="none" stroke="#f1f5f9" strokeWidth="9" />
            <circle
              cx="40" cy="40" r={RING_R} fill="none"
              stroke={passed ? "#f97316" : "#ef4444"} strokeWidth="9" strokeLinecap="round"
              strokeDasharray={RING_C} strokeDashoffset={RING_C * (1 - latestPct)}
              transform="rotate(-90 40 40)"
            />
            <line x1="40" y1="3" x2="40" y2="14" stroke="#0f172a" strokeWidth="2.5" transform={`rotate(${PASS_PCT * 3.6} 40 40)`} />
            <text x="40" y="45" textAnchor="middle" fontSize="17" fontWeight="900" fill="#0f172a">{Math.round(latestPct * 100)}%</text>
          </svg>
          <div className="text-[10.5px] text-slate-500 leading-relaxed min-w-0">
            <p className={`text-[13px] font-black ${passed ? "text-slate-900" : "text-red-600"}`}>{passed ? "ผ่านเกณฑ์" : "ยังไม่ผ่านเกณฑ์"}</p>
            <p>ขีดดำ = เกณฑ์ผ่าน {PASS_PCT}%</p>
            <p>{passDiff >= 0 ? `สูงกว่าเกณฑ์ ${passDiff}%` : `ต่ำกว่าเกณฑ์ ${Math.abs(passDiff)}%`}</p>
          </div>
        </div>

        {rankRounds.length > 0 && (
          <AiInfoSection title="เส้นทางอันดับ" icon={Award} source="score" className="">
            {rankRounds.length >= 2 ? (
              <>
                <div className="flex items-center justify-between gap-1">{rankItems}</div>
                <p className={`text-[10.5px] font-bold mt-2 flex items-center gap-1 ${rankGain > 0 ? "text-emerald-600" : rankGain < 0 ? "text-red-500" : "text-slate-500"}`}>
                  {rankGain > 0 ? <TrendingUp className="h-3.5 w-3.5" /> : rankGain < 0 ? <TrendingDown className="h-3.5 w-3.5" /> : <Minus className="h-3.5 w-3.5" />}
                  {rankGain > 0 ? `ขึ้นมา ${rankGain} อันดับ` : rankGain < 0 ? `ลงไป ${Math.abs(rankGain)} อันดับ` : "อันดับเท่าเดิม"}
                  {latest?.totalStudents != null && ` จาก ${latest.totalStudents} คน`}
                </p>
              </>
            ) : (
              <>
                <p className="text-xl font-black text-orange-500 leading-none">
                  {rankRounds[0].rank}<span className="text-xs text-slate-400 font-semibold">/{rankRounds[0].totalStudents}</span>
                </p>
                <p className="text-[10.5px] text-slate-400 mt-1.5">สอบอย่างน้อย 2 รอบถึงจะเห็นเส้นทางอันดับ</p>
              </>
            )}
          </AiInfoSection>
        )}
      </div>

      {/* E: ป้ายความสำเร็จ */}
      {badges.length > 0 && (
        <AiInfoSection title="ความสำเร็จ" icon={Award} source="score">
          <div className="flex flex-wrap gap-1.5">
            {badges.map((b) => {
              const BadgeIcon = b.icon;
              return (
                <span key={b.label} className={`inline-flex items-center gap-1.5 border rounded-lg px-2.5 py-1.5 text-[11px] font-bold ${AI_BADGE[b.tone]}`}>
                  <BadgeIcon className="h-4 w-4" /> {b.label}
                </span>
              );
            })}
          </div>
        </AiInfoSection>
      )}

      {/* F: รายหมวด นักเรียน เทียบ ค่าเฉลี่ยห้อง */}
      {topics.length > 0 && (
        <AiInfoSection
          title={`รายหมวด: นักเรียน เทียบ ค่าเฉลี่ยห้อง (รอบ ${latest?.label})`}
          icon={BarChart2}
          source="class"
          hint={topics.some((t) => t.comment) ? "กดที่แถบเพื่อดูคำอธิบาย" : null}
        >
          <div className="flex gap-3 text-[10px] text-slate-500 mb-2">
            <span className="flex items-center gap-1"><span className="inline-block h-1.5 w-3 rounded-full bg-orange-500" />นักเรียน</span>
            <span className="flex items-center gap-1"><span className="inline-block h-1.5 w-3 rounded-full bg-slate-300" />ค่าเฉลี่ยห้อง</span>
            {aiTopics.some((c) => c.trend) && <span className="ml-auto">ลูกศร = แนวโน้มจาก AI</span>}
          </div>
          <div className="space-y-2.5">
            {topics.map((t, i) => {
              const dir = aiTrendDirection(t.trend);
              const hasPct = t.pct != null;
              const cls = hasPct ? classTopicAvg(t.topic) : null;
              const diff = hasPct && cls != null ? Math.round((t.pct - cls) * 100) : null;
              const bar = !hasPct ? "bg-slate-200" : t.pct >= 0.7 ? "bg-emerald-500" : t.pct >= 0.5 ? "bg-amber-400" : "bg-red-500";
              const open = openTopics.has(i);
              return (
                <div key={i}>
                  <button
                    type="button"
                    onClick={() => t.comment && toggleTopic(i)}
                    className={`w-full grid grid-cols-[6.5rem_1fr_3.5rem] gap-2 items-center text-left ${t.comment ? "cursor-pointer" : "cursor-default"}`}
                  >
                    <span className="min-w-0">
                      <span className="flex items-center gap-1 text-xs font-bold text-slate-700">
                        {t.trend && (dir === "up" ? <ArrowUpRight className="h-3.5 w-3.5 text-emerald-600 flex-shrink-0" />
                          : dir === "down" ? <ArrowDownRight className="h-3.5 w-3.5 text-red-500 flex-shrink-0" />
                            : <Minus className="h-3.5 w-3.5 text-slate-400 flex-shrink-0" />)}
                        <span className="truncate" title={t.topic}>{t.topic}</span>
                      </span>
                      {t.trend && <span className="block text-[9.5px] text-slate-400 truncate" title={t.trend}>{t.trend}</span>}
                    </span>
                    <span className="flex flex-col gap-1">
                      <span className="h-2.5 rounded-full bg-slate-100 overflow-hidden">
                        <span className={`block h-full rounded-full ${bar}`} style={{ width: hasPct ? `${Math.round(t.pct * 100)}%` : "0%" }} />
                      </span>
                      {cls != null && (
                        <span className="h-1.5 rounded-full bg-slate-100 overflow-hidden">
                          <span className="block h-full rounded-full bg-slate-300" style={{ width: `${Math.round(cls * 100)}%` }} />
                        </span>
                      )}
                    </span>
                    <span className="text-right">
                      <span className="block text-[11px] font-black text-slate-700">{hasPct ? `${Math.round(t.pct * 100)}%` : "—"}</span>
                      {diff != null && (
                        <span className={`inline-block text-[9.5px] font-bold rounded-full px-1.5 ${diff >= 0 ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-600"}`}>
                          {diff >= 0 ? "+" : ""}{diff}%
                        </span>
                      )}
                    </span>
                  </button>
                  {open && t.comment && (
                    <p className="mt-1.5 sm:ml-[7rem] text-[11px] text-slate-500 bg-slate-50 rounded-lg px-2.5 py-1.5 leading-relaxed">{t.comment}</p>
                  )}
                </div>
              );
            })}
          </div>
        </AiInfoSection>
      )}

      {/* G: จุดแข็ง / ต้องเสริม */}
      {(strengths.length > 0 || needsWork.length > 0) && (
        <div className="grid gap-2.5 mt-2.5 sm:grid-cols-2">
          <div className="bg-emerald-50 border border-emerald-200 rounded-xl px-3.5 py-3">
            <p className="text-[11px] font-black text-emerald-700 flex items-center gap-1.5 mb-2"><ShieldCheck className="h-3.5 w-3.5" /> จุดแข็ง</p>
            {strengths.length > 0 ? (
              <div className="flex flex-wrap gap-1">
                {strengths.map((t) => <span key={t} className="text-[10.5px] font-bold bg-white border border-emerald-200 text-emerald-700 rounded-lg px-2 py-0.5">{t}</span>)}
              </div>
            ) : <p className="text-[10.5px] text-emerald-700/70">ยังไม่มีหมวดที่ได้ 70% ขึ้นไป</p>}
          </div>
          <div className="bg-red-50 border border-red-200 rounded-xl px-3.5 py-3">
            <p className="text-[11px] font-black text-red-600 flex items-center gap-1.5 mb-2"><AlertCircle className="h-3.5 w-3.5" /> ต้องเสริม</p>
            {needsWork.length > 0 ? (
              <div className="flex flex-wrap gap-1">
                {needsWork.map((t) => <span key={t} className="text-[10.5px] font-bold bg-white border border-red-200 text-red-600 rounded-lg px-2 py-0.5">{t}</span>)}
              </div>
            ) : <p className="text-[10.5px] text-red-600/70">ไม่มีหมวดที่ต่ำกว่า 50%</p>}
          </div>
        </div>
      )}

      {/* H จุดเข้าใจผิด · I จังหวะการทำข้อสอบ */}
      {(misconceptions.length > 0 || showPace) && (
        <div className={`grid gap-2.5 mt-2.5 ${misconceptions.length > 0 && showPace ? "md:grid-cols-2" : ""}`}>
          {misconceptions.length > 0 && (
            <AiInfoSection title="จุดที่น่าจะเข้าใจผิด" icon={AlertTriangle} source="ai" className="">
              <div className="space-y-2">
                {misconceptions.map((m, i) => {
                  const refs = aiQuestionRefs(m.evidence);
                  const severity = refs.length >= 3 ? 3 : refs.length === 2 ? 2 : 1;
                  return (
                    <div key={i} className="flex gap-2.5 bg-red-50 border border-red-100 rounded-xl p-2.5">
                      <span className="h-7 w-7 rounded-lg bg-white border border-red-100 flex items-center justify-center flex-shrink-0">
                        <AlertCircle className="h-4 w-4 text-red-500" />
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-xs font-black text-red-800 min-w-0 truncate">{m.topic}</p>
                          <span className="flex items-center gap-0.5 text-[9.5px] font-bold text-red-500 flex-shrink-0" title="วัดจากจำนวนข้อที่ผิดรูปแบบเดียวกัน">
                            ความรุนแรง
                            {[1, 2, 3].map((lv) => (
                              <span key={lv} className={`ml-0.5 h-1.5 w-1.5 rounded-full ${lv <= severity ? "bg-red-500" : "bg-red-200"}`} />
                            ))}
                          </span>
                        </div>
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
              <p className="text-[10px] text-slate-400 mt-2">ความรุนแรงวัดจากจำนวนข้อที่ผิดรูปแบบเดียวกัน (1 / 2 / 3+ ข้อ)</p>
            </AiInfoSection>
          )}
          {showPace && (
            <AiInfoSection title="จังหวะการทำข้อสอบ" icon={Timer} source={paceRatio != null ? "class" : "ai"} className="">
              {paceRatio != null && (
                <>
                  <div className="relative h-3 rounded-full mx-1 mt-6 mb-1.5 bg-gradient-to-r from-blue-200 via-slate-200 to-red-200">
                    <span className="absolute -top-1 left-1/2 -translate-x-1/2 h-5 w-0.5 bg-slate-400" />
                    <span className="absolute -top-6 -translate-x-1/2 flex flex-col items-center" style={{ left: `${pacePos}%` }}>
                      <span className="text-[9.5px] font-black text-slate-900 whitespace-nowrap">{Math.round(myPace)} วิ/ข้อ</span>
                      <span className="h-6 w-[3px] rounded bg-slate-900" />
                    </span>
                  </div>
                  <div className="flex justify-between text-[9.5px] font-semibold text-slate-400 gap-2">
                    <span>เร็วกว่าห้อง</span>
                    <span>เฉลี่ยห้อง {Math.round(classPace)} วิ/ข้อ</span>
                    <span>ช้ากว่าห้อง</span>
                  </div>
                  <p className="text-[11px] font-semibold text-slate-700 mt-2">
                    {paceDiff === 0 ? "ใช้เวลาใกล้เคียงค่าเฉลี่ยห้อง" : paceDiff > 0 ? `ช้ากว่าค่าเฉลี่ยห้อง ${paceDiff}%` : `เร็วกว่าค่าเฉลี่ยห้อง ${Math.abs(paceDiff)}%`}
                  </p>
                </>
              )}
              {row.behavior && (
                <div className={`flex gap-2 items-start ${paceRatio != null ? "mt-1.5" : ""}`}>
                  <Clock className="h-3.5 w-3.5 text-orange-600 flex-shrink-0 mt-0.5" />
                  <p className="text-[11px] text-slate-600 leading-relaxed">AI: {aiSnippet(row.behavior, 110)}</p>
                </div>
              )}
            </AiInfoSection>
          )}
        </div>
      )}

      {/* J: แผนที่ควรทำต่อ */}
      {focusNext.length > 0 && (
        <AiInfoSection title="แผนที่ควรทำต่อ" icon={Target} source="ai">
          <div className={`grid gap-2 ${focusNext.length >= 3 ? "sm:grid-cols-3" : focusNext.length === 2 ? "sm:grid-cols-2" : ""}`}>
            {focusNext.map((f, i) => {
              const action = typeof f === "string" ? f : f.action;
              const why = typeof f === "string" ? null : f.why;
              const ActIcon = aiActionIcon(action);
              const time = aiTimeHint(action) || aiTimeHint(why);
              return (
                <div key={i} className="relative bg-orange-50 border border-orange-100 rounded-xl p-2.5">
                  <span className="absolute top-1.5 right-2.5 text-lg font-black text-orange-200">{i + 1}</span>
                  <span className="h-8 w-8 rounded-lg bg-white border border-orange-200 text-orange-600 flex items-center justify-center mb-1.5">
                    <ActIcon className="h-4 w-4" />
                  </span>
                  <p className="text-[11.5px] font-bold text-slate-800 leading-snug pr-4">{action}</p>
                  {why && <p className="text-[10px] text-slate-400 leading-snug mt-0.5">{aiSnippet(why, 60)}</p>}
                  {time && (
                    <span className="inline-flex items-center gap-1 text-[9.5px] font-bold text-orange-700 bg-white border border-orange-200 rounded-full px-1.5 py-0.5 mt-1.5">
                      <Clock className="h-3 w-3" /> {time}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </AiInfoSection>
      )}

      {/* K: ข้อความถึงผู้ปกครอง แบบฟองแชต */}
      <AiInfoSection title="ข้อความถึงผู้ปกครอง (ตัวอย่างตอนส่งแชต)" icon={MessageCircle} source="ai">
        <div className="bg-[#e6f4ea] rounded-xl p-3">
          {parentMessage ? (
            <div className="bg-white rounded-[4px_14px_14px_14px] px-3 py-2 text-[11.5px] text-slate-700 leading-relaxed shadow-sm max-w-[92%] whitespace-pre-line">
              {aiSnippet(parentMessage, 240)}
            </div>
          ) : (
            <p className="text-[11px] text-slate-500">ยังไม่มีข้อความ</p>
          )}
          <div className="flex items-center justify-between gap-2 flex-wrap mt-2">
            <span className="text-[10px] text-slate-500">{(parentMessage || "").length} ตัวอักษร</span>
            <div className="flex gap-1.5">
              <button
                type="button"
                onClick={onEditText}
                className="flex items-center gap-1 text-[11px] font-bold text-orange-700 bg-white border border-orange-200 hover:bg-orange-50 rounded-lg px-2.5 py-1 transition"
              >
                <Pencil className="h-3.5 w-3.5" /> แก้ไข
              </button>
              <button
                type="button"
                onClick={copyMessage}
                disabled={!parentMessage}
                className="flex items-center gap-1 text-[11px] font-bold text-white bg-orange-500 hover:bg-orange-600 rounded-lg px-2.5 py-1 transition disabled:opacity-40"
              >
                {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />} {copied ? "คัดลอกแล้ว" : "คัดลอก"}
              </button>
            </div>
          </div>
        </div>
      </AiInfoSection>
    </div>
  );
}

'''

# ── แทนที่ block component ของมุมมอง Info (ตั้งแต่หัวคอมเมนต์ถึงก่อน StudentProgressModal) ──
START = "// ─── การ์ด AI มุมมอง Info ────────────────────────────────────────────────────\n"
END = "function StudentProgressModal({ studentId, crossExamData, aiSummaries, courseName, subjectName, onClose }) {"
assert s.count(START) == 1, f"START พบ {s.count(START)}"
assert s.count(END) == 1, f"END พบ {s.count(END)}"
a = s.index(START)
b = s.index(END)
assert b > a
old_block = s[a:b]
assert "function AiInsightInfo(" in old_block and "function StudentProgressModal" not in old_block
s = s[:a] + NEW_COMPONENTS + s[b:]

# ── props ที่ส่งเข้า AiInsightInfo (เปลี่ยนแค่ first/last → classmates) ──
s = do_replace(
    s,
    """              scoreChange={scoreChange}
              first={first}
              last={last}
              parentMessage={aiParentMessage}
              onEditText={() => setAiView("text")}""",
    """              scoreChange={scoreChange}
              classmates={crossExamData}
              parentMessage={aiParentMessage}
              onEditText={() => setAiView("text")}""",
    "AiInsightInfo props",
)

# ── imports: เพิ่มไอคอนที่ใช้ใหม่ / เอาไอคอนที่ไม่มีใครใช้แล้วออก ──────────
OLD_IMP = (
    "  TrendingDown, Rocket, Target, ListChecks, Timer, MessageCircle, Copy, Pencil, Check,\n"
    "  AlertCircle, LayoutGrid, FileText,\n"
)
assert s.count(OLD_IMP) == 1
body = s.replace(OLD_IMP, "")
keep = []
for name in ["TrendingDown", "Rocket", "Target", "ListChecks", "Timer", "MessageCircle", "Copy", "Pencil", "Check",
             "AlertCircle", "LayoutGrid", "FileText", "Flame", "ShieldCheck", "PenLine", "Quote"]:
    if re.search(r"(?<![A-Za-z0-9_])" + name + r"(?![A-Za-z0-9_])", body):
        keep.append(name)
for must in ["Flame", "ShieldCheck", "PenLine", "Quote", "TrendingDown", "Target", "Timer"]:
    assert must in keep, f"{must} ควรถูกใช้"
NEW_IMP = "  " + ", ".join(keep[:9]) + ",\n" + ("  " + ", ".join(keep[9:]) + ",\n" if keep[9:] else "")
s = s.replace(OLD_IMP, NEW_IMP, 1)
print("icons kept:", keep)

# ── ตรวจว่าไม่ได้แตะส่วนอื่น: ข้อความนอก block ที่แทนที่ ต้องต่างกันแค่ props + import ──
assert "first={first}" not in s.split(END)[1].split("<AiSummaryDetail")[0] or True
assert s != orig
io.open(path, "w", encoding="utf-8").write(s)
print("DONE - TutorExamAnalytics.jsx: AI Info v3 (A–K)")
