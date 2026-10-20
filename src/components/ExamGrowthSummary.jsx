// สรุปพัฒนาการคะแนนสอบของนักเรียน 1 คน (หน้า "รายละเอียดนักเรียน" ฝั่งติวเตอร์)
// ออกแบบให้อ่านได้ใน 3 ขั้น:
//   ① แถบเดียว 0 → คะแนนเต็ม: คะแนนเดิม / คะแนนที่เพิ่มขึ้น / คะแนนที่ยังพัฒนาได้
//   ② ตัวเลขหลักตัวเดียว: พัฒนาการสัมพัทธ์ + ระดับ
//   ③ "วิธีอ่าน" (กดเปิด) อธิบายด้วยตัวเลขของนักเรียนคนนั้นเอง
// ชื่อเรียก/ระดับมาจาก utils/growthText.js ให้ตรงกับทุกหน้า
//
// improvement (จาก backend): { from, to, max, delta, basis: 'pre-mid'|'pre-post',
//   subjectsCounted, growth, growthCapped, fromPct, room }
import { TrendingUp, TrendingDown, Minus, Info, HelpCircle } from "lucide-react";
import { fmtScore } from "../utils/examScore";
import { GROWTH_LABEL, fmtGrowth, fmtChange, basisLabel } from "../utils/growthText";
import GrowthLevelBadge from "./ui/GrowthLevelBadge";

const TONE = {
  up: { chip: "bg-green-50 text-green-800 border-green-200", bar: "bg-green-500", Icon: TrendingUp },
  down: { chip: "bg-red-50 text-red-800 border-red-200", bar: "bg-red-500", Icon: TrendingDown },
  same: { chip: "bg-amber-50 text-amber-800 border-amber-200", bar: "bg-amber-500", Icon: Minus },
};
const pctOf = (v, max) => (max > 0 ? Math.max(0, Math.min(100, (Number(v) / Number(max)) * 100)) : 0);

// แถบเดียวตั้งแต่ 0 ถึงคะแนนเต็ม
function JourneyBar({ from, to, max, toLabel }) {
  const up = to >= from;
  const base = pctOf(Math.min(from, to), max);
  const diff = pctOf(Math.abs(to - from), max);
  return (
    <div>
      <div className="flex h-4 w-full overflow-hidden rounded-full bg-slate-100 ring-1 ring-inset ring-slate-200" aria-hidden="true">
        <div className="h-full bg-slate-400" style={{ width: `${base}%` }} />
        {diff > 0 && <div className={`h-full ${up ? "bg-green-500" : "bg-red-400 [background-image:repeating-linear-gradient(45deg,transparent_0_4px,rgba(255,255,255,.45)_4px_8px)]"}`} style={{ width: `${diff}%` }} />}
      </div>
      <div className="mt-1.5 flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-slate-600">
        <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm bg-slate-400" />{up ? `คะแนน Pre-test ${fmtScore(from)}` : `คะแนน ${toLabel} ${fmtScore(to)}`}</span>
        {diff > 0 && (
          <span className="flex items-center gap-1.5"><span className={`h-2.5 w-2.5 rounded-sm ${up ? "bg-green-500" : "bg-red-400"}`} />{up ? `เพิ่มขึ้นใน ${toLabel} ${fmtScore(to - from)}` : `ลดลงจาก Pre-test ${fmtScore(from - to)}`}</span>
        )}
        <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm bg-slate-100 ring-1 ring-inset ring-slate-300" />ยังพัฒนาได้อีก {fmtScore(Math.max(0, max - Math.max(from, to)))}</span>
        <span className="ml-auto tabular-nums text-slate-500">คะแนนเต็ม {fmtScore(max)}</span>
      </div>
    </div>
  );
}

// ไม้บรรทัดระดับ 4 ช่วง + หมุดบอกว่านักเรียนอยู่ตรงไหน (มองเห็นตลอด ไม่ต้องกดเปิด)
const LEVEL_SEGMENTS = [
  { to: 25, label: "ต้น", cls: "bg-slate-300" },
  { to: 50, label: "กลาง", cls: "bg-amber-300" },
  { to: 75, label: "สูง", cls: "bg-emerald-400" },
  { to: 100, label: "สูงมาก", cls: "bg-green-600" },
];
function LevelRuler({ growth }) {
  const g = Math.max(0, Math.min(100, Number(growth) || 0));
  return (
    <div className="mt-3" aria-label={`พัฒนาการสัมพัทธ์ ${Math.round(g)}% บนเกณฑ์ 4 ระดับ`} role="img">
      <div className="relative">
        <div className="flex h-2.5 overflow-hidden rounded-full">
          {LEVEL_SEGMENTS.map((s) => <div key={s.label} className={`h-full flex-1 ${s.cls}`} />)}
        </div>
        {/* หมุดตำแหน่งนักเรียน */}
        <div className="absolute -top-1.5 h-5 w-5 -translate-x-1/2 rounded-full border-[3px] border-white bg-slate-900 shadow" style={{ left: `${g}%` }} />
      </div>
      <div className="mt-1.5 grid grid-cols-4 text-center text-[10.5px] leading-4 text-slate-500">
        {LEVEL_SEGMENTS.map((s, i) => (
          <span key={s.label}>
            <b className="block font-semibold text-slate-700">{s.label}</b>
            {i === 0 ? 0 : LEVEL_SEGMENTS[i - 1].to + 1}–{s.to}%
          </span>
        ))}
      </div>
    </div>
  );
}

// countedSubjects = ชื่อวิชาที่นำมาคิด (สอบครบทั้งสองรอบ) · pendingSubjects = สอบไปแล้วแต่ยังไม่ครบสองรอบ
export default function ExamGrowthSummary({ improvement, totalSubjects, untestedSubjects = [], countedSubjects = [], pendingSubjects = [], variant = "compact" }) {
  if (!improvement) return null;
  const { from, to, max, delta, basis, subjectsCounted, growth, growthCapped, room } = improvement;
  const tone = delta > 0 ? TONE.up : delta < 0 ? TONE.down : TONE.same;
  const ToneIcon = tone.Icon;
  const toLabel = basis === "pre-mid" ? "Mid-test" : "Post-test";
  const full = variant === "full";
  const multi = subjectsCounted > 1;
  // คะแนนที่ยังพัฒนาได้ (ตัวหารของสูตร) — ถ้าพื้นฐานสูง ระบบใช้ฐานขั้นต่ำ 30% ของคะแนนเต็ม
  const roomPts = room != null ? (Number(room) / 100) * Number(max) : Math.max(0, max - from);

  const scope = multi ? `คะแนนรวม ${subjectsCounted} วิชา` : "คะแนน";
  const headline = delta > 0 ? `${scope}เพิ่มขึ้น ${fmtScore(delta)} คะแนน`
    : delta < 0 ? `${scope}ลดลง ${fmtScore(Math.abs(delta))} คะแนน`
      : `${scope}เท่าเดิม`;

  const notes = [];
  notes.push(`คำนวณจาก ${subjectsCounted}${totalSubjects && subjectsCounted < totalSubjects ? ` จาก ${totalSubjects}` : ""} วิชาที่สอบครบทั้งสองรอบ (วิชาละ ${fmtScore(max / Math.max(1, subjectsCounted))} คะแนน)`);
  if (pendingSubjects.length) notes.push(`ยังไม่นับ ${pendingSubjects.join(", ")} (สอบยังไม่ครบสองรอบ)`);
  if (untestedSubjects.length) notes.push(`ยังไม่นับ ${untestedSubjects.join(", ")} (ยังไม่ได้สอบ)`);
  if (basis === "pre-mid") notes.push("ยังไม่มีผล Post-test จึงเทียบกับ Mid-test");

  return (
    // วางเป็น 2 แถวเต็มความกว้าง: แถวบน = คะแนน (แถบเดียว) · แถวล่าง = พัฒนาการสัมพัทธ์ (ตัวเลข | ไม้บรรทัดระดับ)
    // แทน 2 คอลัมน์ซ้าย-ขวา ที่ฝั่งซ้ายสั้นจนเหลือที่ว่าง
    <div className="space-y-4">
      {/* ── ① คะแนนบนแถบเดียว ── */}
      <div className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <p className={`font-bold text-slate-900 ${full ? "text-base" : "text-sm"}`}>{headline}</p>
            <p className="text-xs text-slate-500">{basisLabel(basis)}{multi ? " · คะแนนรวม" : ""}</p>
          </div>
          <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-bold ${tone.chip}`}>
            <ToneIcon className="h-3.5 w-3.5" aria-hidden="true" />{fmtChange(delta)}
          </span>
        </div>
        <JourneyBar from={from} to={to} max={max} toLabel={toLabel} />
        {countedSubjects.length > 0 && (
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-[11px] text-slate-500">วิชาที่นำมาคิด:</span>
            {countedSubjects.map((name) => (
              <span key={name} className="rounded-full border border-slate-200 bg-white px-2 py-0.5 text-[11px] font-medium text-slate-700">{name}</span>
            ))}
          </div>
        )}
      </div>

      {/* ── ② ตัวเลขหลัก + ③ วิธีอ่าน ── */}
      <div className={full ? "rounded-xl border border-slate-200 bg-white p-4" : "rounded-lg bg-slate-50 p-2.5"}>
        <p className="text-xs font-semibold text-slate-600">{GROWTH_LABEL}</p>
        {delta > 0 && growth != null ? (
          <>
            <div className={full ? "grid items-center gap-x-8 gap-y-3 md:grid-cols-[minmax(0,15rem)_minmax(0,1fr)]" : ""}>
              <div>
                <div className="mt-1 flex flex-wrap items-center gap-2">
                  <span className={`tabular-nums font-bold text-green-700 ${full ? "text-3xl" : "text-lg"}`}>{fmtGrowth(growth)}</span>
                  <GrowthLevelBadge growth={growth} />
                </div>
                <p className="mt-1 text-xs leading-5 text-slate-600">
                  เพิ่มขึ้น {fmtScore(delta)} คะแนน จาก {fmtScore(roomPts)} คะแนนที่ยังพัฒนาได้
                </p>
              </div>
              <LevelRuler growth={growth} />
            </div>
            <details className="group mt-2 rounded-lg bg-orange-50/60 px-3 py-2 text-xs leading-5 text-slate-700">
              <summary className="flex cursor-pointer list-none items-center gap-1 font-semibold text-orange-700">
                <HelpCircle className="h-3.5 w-3.5" aria-hidden="true" /> วิธีอ่านตัวเลขนี้
              </summary>
              <ol className="mt-1.5 list-decimal space-y-1 pl-4">
                <li>Pre-test ได้ {fmtScore(from)} จาก {fmtScore(max)} คะแนน จึงยังพัฒนาได้อีก {fmtScore(max - from)} คะแนน</li>
                <li>{toLabel} ได้ {fmtScore(to)} คะแนน เพิ่มขึ้น {fmtScore(delta)} คะแนน</li>
                <li>{fmtScore(delta)} ÷ {fmtScore(roomPts)} × 100 = <b>{fmtGrowth(growth)}</b> หมายถึง จากส่วนที่ยังทำไม่ได้ตอน Pre-test นักเรียนทำได้เพิ่มแล้ว {fmtGrowth(growth)}</li>
              </ol>
              <p className="mt-1.5 text-slate-600">ระดับใช้เกณฑ์คะแนนพัฒนาการสัมพัทธ์ 4 ระดับ (ศิริชัย กาญจนวาสี, 2552)</p>
              {growthCapped && (
                <p className="mt-1.5 text-slate-600">นักเรียนมีพื้นฐานเดิมสูง ระบบจึงใช้ฐานขั้นต่ำ 30% ของคะแนนเต็ม ({fmtScore(roomPts)} คะแนน) เป็นตัวหาร เพื่อไม่ให้ค่าสูงเกินจริงจากคะแนนที่เพิ่มเพียงเล็กน้อย</p>
              )}
            </details>
          </>
        ) : (
          <p className="mt-1 text-xs leading-5 text-slate-600">
            {delta < 0 ? "คะแนนลดลงจาก Pre-test จึงไม่คำนวณพัฒนาการสัมพัทธ์" : delta === 0 ? "คะแนนเท่าเดิม พัฒนาการสัมพัทธ์ 0%" : "ยังคำนวณพัฒนาการสัมพัทธ์ไม่ได้"}
          </p>
        )}
        <p className={`flex items-start gap-1 text-[11px] leading-5 text-slate-500 ${full ? "mt-3 border-t border-slate-100 pt-2" : "mt-1.5"}`}>
          <Info className="mt-0.5 h-3 w-3 shrink-0" aria-hidden="true" />
          <span>{notes.join(" · ")}</span>
        </p>
      </div>
    </div>
  );
}
