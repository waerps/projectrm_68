import { useState, useMemo } from "react";
import { useSearchParams, Link } from "react-router-dom";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, LineChart, Line, Legend, Cell, ReferenceLine,
} from "recharts";
import {
  BarChart2, Target, Users, TrendingUp, Download, AlertTriangle,
  CheckCircle, Search, Info, Award, Clock, BookOpen,
  X, Eye, ChevronRight, ArrowUpRight, ArrowDownRight,
  ChevronDown,
} from "lucide-react";
import * as XLSX from "xlsx";

// ─── Config ───────────────────────────────────────────────────────────────────

const PASS_PCT = 60;

const TOPICS = [
  "พีชคณิต", "เรขาคณิต", "ตรีโกณมิติ",
  "อัลกอริทึม", "ลำดับและอนุกรม", "สถิติ",
];

const TOPIC_COLORS = {
  "พีชคณิต": "#f97316", "เรขาคณิต": "#3b82f6", "ตรีโกณมิติ": "#10b981",
  "อัลกอริทึม": "#ef4444", "ลำดับและอนุกรม": "#8b5cf6", "สถิติ": "#ec4899",
};

const TOPIC_LIGHT = {
  "พีชคณิต": "#fff7ed", "เรขาคณิต": "#eff6ff", "ตรีโกณมิติ": "#f0fdf4",
  "อัลกอริทึม": "#fef2f2", "ลำดับและอนุกรม": "#f5f3ff", "สถิติ": "#fdf4ff",
};

const EXAMS_META = [
  { id: 0, label: "Pre-test", badge: "bg-blue-50 text-blue-700" },
  { id: 1, label: "Mid-test", badge: "bg-amber-50 text-amber-700" },
  { id: 2, label: "Post-test", badge: "bg-pink-50 text-pink-700" },
];

// ─── Questions ────────────────────────────────────────────────────────────────

const QUESTIONS = [
  { id: 1, topic: "พีชคณิต", level: "ง่าย", score: 1, text: "x² − 5x + 6 = 0 แล้ว x มีค่าเท่ากับ" },
  { id: 2, topic: "พีชคณิต", level: "ง่าย", score: 1, text: "f(x) = 2x + 3 หา f(5)" },
  { id: 3, topic: "พีชคณิต", level: "ปานกลาง", score: 2, text: "แก้สมการ 3x − 7 = 2x + 5" },
  { id: 4, topic: "พีชคณิต", level: "ปานกลาง", score: 2, text: "x² + 4x + 4 = 0 มีคำตอบเป็น" },
  { id: 5, topic: "พีชคณิต", level: "ยาก", score: 3, text: "2x² − 3x − 2 = 0 มีคำตอบเป็น" },
  { id: 6, topic: "เรขาคณิต", level: "ง่าย", score: 1, text: "พื้นที่สามเหลี่ยมฐาน 6 ซม. สูง 4 ซม." },
  { id: 7, topic: "เรขาคณิต", level: "ง่าย", score: 1, text: "เส้นรอบรูปสี่เหลี่ยมจัตุรัสด้าน 5 ซม." },
  { id: 8, topic: "เรขาคณิต", level: "ปานกลาง", score: 2, text: "พื้นที่วงกลมรัศมี 7 ซม. (π = 22/7)" },
  { id: 9, topic: "เรขาคณิต", level: "ปานกลาง", score: 2, text: "ทฤษฎีพีทาโกรัส ด้าน 5, 12 หายาวด้านตรงข้ามมุมฉาก" },
  { id: 10, topic: "เรขาคณิต", level: "ยาก", score: 3, text: "ปริมาตรทรงกระบอก r = 3 h = 7 ซม." },
  { id: 11, topic: "ตรีโกณมิติ", level: "ง่าย", score: 1, text: "sin 30° + cos 60° มีค่าเท่าใด" },
  { id: 12, topic: "ตรีโกณมิติ", level: "ปานกลาง", score: 2, text: "tan 45° มีค่าเท่าใด" },
  { id: 13, topic: "ตรีโกณมิติ", level: "ปานกลาง", score: 2, text: "cos 0° + sin 90° มีค่าเท่าใด" },
  { id: 14, topic: "ตรีโกณมิติ", level: "ยาก", score: 3, text: "sin²x + cos²x = ?" },
  { id: 15, topic: "ตรีโกณมิติ", level: "ยาก", score: 3, text: "หา sin 150° โดยใช้สูตรมุมสัมพัทธ์" },
  { id: 16, topic: "อัลกอริทึม", level: "ปานกลาง", score: 2, text: "log₁₀ 1000 มีค่าเท่าใด" },
  { id: 17, topic: "อัลกอริทึม", level: "ปานกลาง", score: 2, text: "log₂ 8 มีค่าเท่าใด" },
  { id: 18, topic: "อัลกอริทึม", level: "ยาก", score: 3, text: "log₂ x = 5 แล้ว x = ?" },
  { id: 19, topic: "อัลกอริทึม", level: "ยาก", score: 3, text: "log 2 + log 5 มีค่าเท่าใด" },
  { id: 20, topic: "อัลกอริทึม", level: "ยาก", score: 3, text: "log₃ 81 มีค่าเท่าใด" },
  { id: 21, topic: "ลำดับและอนุกรม", level: "ง่าย", score: 1, text: "ลำดับ 3, 7, 11, 15 … พจน์ที่ 10 คือ" },
  { id: 22, topic: "ลำดับและอนุกรม", level: "ง่าย", score: 1, text: "ผลบวก 10 พจน์แรกของ 1 + 2 + 3 + …" },
  { id: 23, topic: "ลำดับและอนุกรม", level: "ปานกลาง", score: 2, text: "ลำดับเรขาคณิต 2, 6, 18 … พจน์ที่ 5 คือ" },
  { id: 24, topic: "ลำดับและอนุกรม", level: "ปานกลาง", score: 2, text: "ผลบวก GP a = 3, r = 2, n = 5" },
  { id: 25, topic: "ลำดับและอนุกรม", level: "ยาก", score: 3, text: "หา S∞ ของอนุกรม 1 + 1/2 + 1/4 + …" },
  { id: 26, topic: "สถิติ", level: "ง่าย", score: 1, text: "ค่าเฉลี่ยของ 5, 8, 3, 9, 10 คือ" },
  { id: 27, topic: "สถิติ", level: "ปานกลาง", score: 2, text: "มัธยฐานของ 3, 5, 7, 9, 11 คือ" },
  { id: 28, topic: "สถิติ", level: "ปานกลาง", score: 2, text: "ฐานนิยมของ 2, 3, 3, 4, 5, 3 คือ" },
  { id: 29, topic: "สถิติ", level: "ยาก", score: 3, text: "ส่วนเบี่ยงเบนมาตรฐานของ 2, 4, 6, 8 คือ" },
  { id: 30, topic: "สถิติ", level: "ยาก", score: 3, text: "ถ้า σ = 2.5 หา variance" },
];

const MAX_SCORE = QUESTIONS.reduce((s, q) => s + q.score, 0);

// ─── Pseudo-random helpers ────────────────────────────────────────────────────

const pr = (a, b, c = 0) => {
  let x = (Math.imul(a | 0, 2654435761) ^ Math.imul(b | 0, 2246822519) ^ Math.imul(c | 0, 1664525)) >>> 0;
  x = Math.imul(x ^ (x >>> 16), 0x45d9f3b) >>> 0;
  return x / 0xffffffff;
};

const STUDENT_NAMES = Array.from({ length: 24 }, (_, i) => `นักเรียน ${String(i + 1).padStart(2, "0")}`);
const ABILITIES = [0.88, 0.85, 0.82, 0.79, 0.76, 0.74, 0.71, 0.68, 0.65, 0.63, 0.60, 0.57, 0.54, 0.51, 0.49, 0.46, 0.43, 0.40, 0.38, 0.35, 0.32, 0.29, 0.26, 0.22];
const P_BASE = { "ง่าย": 0.80, "ปานกลาง": 0.60, "ยาก": 0.38 };

const generateData = (abilityDelta, examId) =>
  ABILITIES.map((base, si) => {
    const ability = Math.min(0.97, Math.max(0.05, base + abilityDelta + (pr(si, 97, examId) - 0.5) * 0.06));
    const answers = QUESTIONS.map((q, qi) => {
      const pv = P_BASE[q.level];
      const threshold = ability * 0.55 + pv * 0.45;
      const isCorrect = pr(si, qi, examId) < threshold;
      const correctOpt = qi % 4;
      const wrongOpts = [0, 1, 2, 3].filter(o => o !== correctOpt);
      const chosen = isCorrect ? correctOpt : wrongOpts[Math.floor(pr(si + 100, qi, examId) * 3)];
      const tBase = q.level === "ง่าย" ? 55 : q.level === "ปานกลาง" ? 110 : 178;
      const timeSec = Math.max(12, Math.round(tBase + (pr(si * 3, qi * 3, examId) - 0.5) * 70));
      return { qi, chosen, correct: isCorrect, timeSec };
    });
    const totalScore = answers.reduce((s, a, i) => s + (a.correct ? QUESTIONS[i].score : 0), 0);
    return { id: si + 1, name: STUDENT_NAMES[si], answers, totalScore, pct: totalScore / MAX_SCORE, passed: totalScore / MAX_SCORE >= PASS_PCT / 100, timeSec: answers.reduce((s, a) => s + a.timeSec, 0) };
  });

const ALL_DATA = [
  generateData(-0.24, 0),
  generateData(0, 1),
  generateData(+0.13, 2),
];

// ─── Stat helpers ─────────────────────────────────────────────────────────────

const avg = arr => arr.reduce((s, v) => s + v, 0) / arr.length;
const sdev = arr => { const m = avg(arr); return Math.sqrt(arr.reduce((s, v) => s + (v - m) ** 2, 0) / arr.length); };
const fmtPct = v => `${(v * 100).toFixed(1)}%`;
const fmtMin = sec => `${Math.floor(sec / 60)}:${String(sec % 60).padStart(2, "0")} น.`;

const computeItemAnalysis = (data) => {
  const n = data.length;
  const sorted = [...data].sort((a, b) => b.pct - a.pct);
  const upper = sorted.slice(0, Math.ceil(n * 0.27));
  const lower = sorted.slice(Math.floor(n * 0.73));
  return QUESTIONS.map((q, qi) => {
    const nCorrect = data.filter(s => s.answers[qi].correct).length;
    const pValue = nCorrect / n;
    const uC = upper.filter(s => s.answers[qi].correct).length / upper.length;
    const lC = lower.filter(s => s.answers[qi].correct).length / lower.length;
    const dIndex = uC - lC;
    const optCounts = [0, 1, 2, 3].map(opt => data.filter(s => s.answers[qi].chosen === opt).length);
    const correctOpt = qi % 4;
    const avgTimeSec = avg(data.map(s => s.answers[qi].timeSec));
    const flag = pValue < 0.25 || pValue > 0.92 || dIndex < 0.15;
    return { ...q, qi, pValue, dIndex, optCounts, correctOpt, avgTimeSec, flag };
  });
};

const computeTopicStats = (data) =>
  TOPICS.map(topic => {
    const qIdx = QUESTIONS.map((q, i) => ({ q, i })).filter(({ q }) => q.topic === topic).map(({ i }) => i);
    const maxTopicScore = qIdx.reduce((s, i) => s + QUESTIONS[i].score, 0);
    const scores = data.map(s => qIdx.reduce((sc, i) => sc + (s.answers[i].correct ? QUESTIONS[i].score : 0), 0));
    return { topic, avgPct: avg(scores) / maxTopicScore, maxScore: maxTopicScore, color: TOPIC_COLORS[topic] };
  });

const buildHistogram = (data) => {
  const bins = Array.from({ length: 10 }, (_, i) => ({ range: `${i * 10}–${(i + 1) * 10}%`, count: 0 }));
  data.forEach(s => { bins[Math.min(9, Math.floor(s.pct * 10))].count++; });
  return bins;
};

// ─── UI Helpers ───────────────────────────────────────────────────────────────

const PValColor = v => v >= 0.7 ? "text-green-700 bg-green-50" : v >= 0.3 ? "text-amber-700 bg-amber-50" : "text-red-700 bg-red-50";
const DIdxColor = v => v >= 0.3 ? "text-green-700 bg-green-50" : v >= 0.2 ? "text-amber-700 bg-amber-50" : "text-red-700 bg-red-50";
const LevelBadge = { "ง่าย": "bg-green-100 text-green-700", "ปานกลาง": "bg-amber-100 text-amber-700", "ยาก": "bg-red-100 text-red-700" };

function StatCard({ icon: Icon, label, value, sub, color = "orange", tooltip }) {
  const cfg = {
    orange: { ring: "bg-orange-100", ic: "text-orange-500", val: "text-orange-600" },
    green: { ring: "bg-green-100", ic: "text-green-500", val: "text-green-600" },
    blue: { ring: "bg-blue-100", ic: "text-blue-500", val: "text-blue-600" },
    red: { ring: "bg-red-100", ic: "text-red-500", val: "text-red-600" },
    purple: { ring: "bg-purple-100", ic: "text-purple-500", val: "text-purple-600" },
  }[color];

  return (
    <div className="bg-white rounded-2xl border border-neutral-200 p-5 flex flex-col gap-3">
      <div className={`h-10 w-10 rounded-xl ${cfg.ring} flex items-center justify-center`}>
        <Icon className={`h-5 w-5 ${cfg.ic}`} />
      </div>
      <div>
        <p className={`text-3xl font-bold ${cfg.val}`}>{value}</p>

        <div className="flex items-center gap-1.5 mt-0.5">
          <p className="text-sm font-medium text-neutral-700">{label}</p>
          {tooltip && (
            <div className="relative group">
              <span className="h-4 w-4 rounded-full border border-neutral-300 flex items-center justify-center text-[10px] text-neutral-400 cursor-default">
                ?
              </span>
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-52 bg-white border border-neutral-200 rounded-xl p-3 text-xs text-neutral-600 leading-relaxed shadow-lg hidden group-hover:block z-10">
                {tooltip}
              </div>
            </div>
          )}
        </div>

        {sub && <p className="text-xs text-neutral-400 mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

const ChartTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-neutral-200 rounded-xl shadow-lg px-3 py-2 text-xs">
      <p className="font-semibold text-neutral-700 mb-1">{label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color }}>{p.name}: <strong>{typeof p.value === "number" && p.value < 1.5 ? fmtPct(p.value) : p.value}</strong></p>
      ))}
    </div>
  );
};

// ─── Student Drill-down Modal ─────────────────────────────────────────────────

function StudentModal({ student, examLabel, onClose }) {
  if (!student) return null;
  const topicBreakdown = TOPICS.map(topic => {
    const qIdx = QUESTIONS.map((q, i) => ({ q, i })).filter(({ q }) => q.topic === topic).map(({ i }) => i);
    const maxSc = qIdx.reduce((s, i) => s + QUESTIONS[i].score, 0);
    const sc = qIdx.reduce((s, i) => s + (student.answers[i].correct ? QUESTIONS[i].score : 0), 0);
    return { topic, sc, maxSc, pct: sc / maxSc, color: TOPIC_COLORS[topic] };
  });
  const grade = student.pct >= 0.90 ? "A" : student.pct >= 0.80 ? "B+" : student.pct >= 0.70 ? "B" : student.pct >= 0.60 ? "C" : "F";
  const gradeColor = student.pct >= 0.70 ? "text-green-600" : student.pct >= 0.60 ? "text-amber-600" : "text-red-600";

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden" onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-start p-6 border-b border-neutral-100">
          <div className="flex items-center gap-3">
            <div className="h-11 w-11 rounded-xl bg-orange-100 flex items-center justify-center">
              <span className="text-lg font-bold text-orange-600">{student.id}</span>
            </div>
            <div>
              <p className="font-bold text-neutral-900 text-lg">{student.name}</p>
              <p className="text-xs text-neutral-500">{examLabel} • ใช้เวลา {fmtMin(student.timeSec)}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-center">
              <p className={`text-4xl font-black ${gradeColor}`}>{grade}</p>
              <p className="text-xs text-neutral-400">เกรด</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-neutral-800">{student.totalScore}/{MAX_SCORE}</p>
              <p className="text-xs text-neutral-400">{fmtPct(student.pct)}</p>
            </div>
            <button onClick={onClose} className="h-8 w-8 flex items-center justify-center rounded-lg hover:bg-neutral-100 text-neutral-400 transition">
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>
        <div className="overflow-y-auto flex-1 p-6 space-y-5">
          <div>
            <p className="text-sm font-semibold text-neutral-700 mb-3">คะแนนรายหัวข้อ</p>
            <div className="space-y-2.5">
              {topicBreakdown.map(t => (
                <div key={t.topic} className="flex items-center gap-3">
                  <p className="text-xs text-neutral-600 w-36 flex-shrink-0">{t.topic}</p>
                  <div className="flex-1 h-5 bg-neutral-100 rounded-full overflow-hidden">
                    <div className="h-full rounded-full transition-all" style={{ width: `${t.pct * 100}%`, backgroundColor: t.color }} />
                  </div>
                  <p className="text-xs font-semibold text-neutral-700 w-16 text-right">{t.sc}/{t.maxSc} ({Math.round(t.pct * 100)}%)</p>
                </div>
              ))}
            </div>
          </div>
          <div>
            <p className="text-sm font-semibold text-neutral-700 mb-3">รายข้อ</p>
            <div className="border border-neutral-100 rounded-xl overflow-hidden">
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-neutral-50 border-b border-neutral-100">
                    {["ข้อ", "หัวข้อ", "ระดับ", "ผล", "คะแนน", "เวลา"].map(h => (
                      <th key={h} className="text-left font-semibold text-neutral-500 px-3 py-2">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {QUESTIONS.map((q, qi) => {
                    const ans = student.answers[qi];
                    return (
                      <tr key={q.id} className={`border-b border-neutral-50 last:border-0 ${ans.correct ? "bg-green-50/30" : "bg-red-50/30"}`}>
                        <td className="px-3 py-2 font-medium text-neutral-600">{q.id}</td>
                        <td className="px-3 py-2"><span className="px-1.5 py-0.5 rounded-md text-[10px] font-semibold" style={{ backgroundColor: TOPIC_LIGHT[q.topic], color: TOPIC_COLORS[q.topic] }}>{q.topic}</span></td>
                        <td className="px-3 py-2"><span className={`px-1.5 py-0.5 rounded-md text-[10px] font-semibold ${LevelBadge[q.level]}`}>{q.level}</span></td>
                        <td className="px-3 py-2">{ans.correct ? <span className="flex items-center gap-1 text-green-700 font-semibold"><CheckCircle className="h-3 w-3" /> ถูก</span> : <span className="flex items-center gap-1 text-red-500 font-semibold"><X className="h-3 w-3" /> ผิด</span>}</td>
                        <td className="px-3 py-2 text-neutral-700">{ans.correct ? q.score : 0}/{q.score}</td>
                        <td className="px-3 py-2 text-neutral-500">{Math.floor(ans.timeSec / 60)}:{String(ans.timeSec % 60).padStart(2, "0")} น.</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Tab 1: ภาพรวม ────────────────────────────────────────────────────────────
// ตัด Heatmap ออก เหลือแค่ stat cards + histogram + topic chart

function OverviewTab({ data }) {
  const pcts = data.map(s => s.pct);
  const avgPct = avg(pcts);
  const sdPct = sdev(pcts);
  const passRate = data.filter(s => s.passed).length / data.length;
  const maxPct = Math.max(...pcts);
  const minPct = Math.min(...pcts);

  const hist = useMemo(() => buildHistogram(data), [data]);
  const topicData = useMemo(() => computeTopicStats(data), [data]);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard icon={Award} label="คะแนนเฉลี่ย" value={fmtPct(avgPct)} sub={`${(avgPct * MAX_SCORE).toFixed(1)} / ${MAX_SCORE} คะแนน`} color="orange" />
        <StatCard icon={CheckCircle} label="อัตราผ่าน" value={fmtPct(passRate)} sub={`${data.filter(s => s.passed).length} จาก ${data.length} คน`} color="green" />
        <StatCard icon={TrendingUp} label="สูงสุด / ต่ำสุด" value={`${fmtPct(maxPct)} / ${fmtPct(minPct)}`} sub="ช่วงคะแนน" color="blue" />
        <StatCard
          icon={BarChart2}
          label="ส่วนเบี่ยงเบนมาตรฐาน"
          value={fmtPct(sdPct)}
          sub="σ (sigma)"
          color="purple"
          tooltip={
            <div className="space-y-2">
              <p className="font-medium text-neutral-800">ส่วนเบี่ยงเบนมาตรฐาน (σ) คืออะไร?</p>
              <p className="text-neutral-500 leading-relaxed">
                วัดว่าคะแนนนักเรียนกระจายห่างจากค่าเฉลี่ยมากแค่ไหน
                ค่ายิ่งสูง = นักเรียนมีระดับต่างกันมาก
              </p>
              <div className="space-y-1 pt-1 border-t border-neutral-100">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-green-400 flex-shrink-0" />
                  <span><span className="font-medium text-neutral-700">น้อยกว่า 10%</span> — คะแนนใกล้เคียงกัน นักเรียนอยู่ในระดับเดียวกัน</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-amber-400 flex-shrink-0" />
                  <span><span className="font-medium text-neutral-700">10–20%</span> — มีความต่างบ้าง แต่ยังแยกระดับได้ดี</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-red-400 flex-shrink-0" />
                  <span><span className="font-medium text-neutral-700">มากกว่า 20%</span> — ช่องว่างสูง เด็กเก่งกับเด็กอ่อนห่างกันมาก</span>
                </div>
              </div>
              <p className="text-neutral-400 text-[11px] pt-1 border-t border-neutral-100">
                ค่าของคุณตอนนี้: <span className="font-medium text-purple-600">{fmtPct(sdPct)}</span>
                {sdPct < 0.10 ? " — นักเรียนมีระดับใกล้เคียงกัน"
                  : sdPct < 0.20 ? " — กระจายตัวในเกณฑ์ดี"
                    : " — ควรพิจารณาแบ่งกลุ่ม"}
              </p>
            </div>
          }
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Score Distribution */}
        <div className="bg-white rounded-2xl border border-neutral-200 p-5">
          <div className="flex items-center gap-2 mb-4">
            <div className="h-7 w-7 rounded-lg bg-orange-100 flex items-center justify-center">
              <BarChart2 className="h-3.5 w-3.5 text-orange-500" />
            </div>
            <p className="text-sm font-bold text-neutral-800">การกระจายตัวของคะแนน</p>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={hist} barCategoryGap="15%">
              <CartesianGrid strokeDasharray="3 3" stroke="#f5f5f5" vertical={false} />
              <XAxis dataKey="range" tick={{ fontSize: 10, fill: "#a3a3a3" }} tickLine={false} axisLine={false} />
              <YAxis tick={{ fontSize: 10, fill: "#a3a3a3" }} tickLine={false} axisLine={false} allowDecimals={false} />
              <Tooltip content={<ChartTooltip />} cursor={{ fill: "#fafafa" }} />
              <Bar dataKey="count" radius={[4, 4, 0, 0]} name="จำนวนนักเรียน">
                {hist.map((entry, i) => <Cell key={i} fill={i >= 6 ? "#22c55e" : i >= 4 ? "#f97316" : "#ef4444"} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          <div className="flex gap-4 justify-center mt-2 flex-wrap">
            {[["#ef4444", "0–39% ไม่ผ่าน"], ["#f97316", "40–59% ใกล้ผ่าน"], ["#22c55e", "60%+ ผ่าน"]].map(([c, l]) => (
              <span key={l} className="flex items-center gap-1.5 text-[11px] text-neutral-500">
                <span className="h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: c }} />{l}
              </span>
            ))}
          </div>
        </div>

        {/* Topic Performance */}
        <div className="bg-white rounded-2xl border border-neutral-200 p-5">
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-2">
              <div className="h-7 w-7 rounded-lg bg-blue-100 flex items-center justify-center">
                <BookOpen className="h-3.5 w-3.5 text-blue-500" />
              </div>
              <p className="text-sm font-bold text-neutral-800">คะแนนเฉลี่ยรายหัวข้อ</p>
            </div>
          </div>

          {/* คำอธิบาย */}
          <p className="text-xs text-neutral-400 mb-1 ml-9">
            ห้องนี้เข้าใจเรื่องไหนดี และเรื่องไหนที่ควรสอนซ้ำ
          </p>

          {/* Legend เกณฑ์ */}
          <div className="flex items-center gap-4 mb-4 ml-9">
            <span className="flex items-center gap-1.5 text-[11px] text-neutral-500">
              <span className="h-2 w-2 rounded-full bg-green-400" />
              70%+ ผ่านเกณฑ์ดี
            </span>
            <span className="flex items-center gap-1.5 text-[11px] text-neutral-500">
              <span className="h-2 w-2 rounded-full bg-amber-400" />
              50–69% พอใช้
            </span>
            <span className="flex items-center gap-1.5 text-[11px] text-neutral-500">
              <span className="h-2 w-2 rounded-full bg-red-400" />
              ต่ำกว่า 50% ควรทบทวน
            </span>
          </div>

          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={topicData} layout="vertical" barCategoryGap="20%">
              <CartesianGrid strokeDasharray="3 3" stroke="#f5f5f5" horizontal={false} />
              {/* เส้นเกณฑ์ 60% */}
              <ReferenceLine x={0.6} stroke="#f97316" strokeDasharray="4 3" strokeWidth={1.5} />
              <XAxis
                type="number"
                domain={[0, 1]}
                tickFormatter={v => `${(v * 100).toFixed(0)}%`}
                tick={{ fontSize: 10, fill: "#a3a3a3" }}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                dataKey="topic"
                type="category"
                width={100}
                tick={{ fontSize: 10, fill: "#525252" }}
                tickLine={false}
                axisLine={false}
              />
              <Tooltip
                content={({ active, payload, label }) => {
                  if (!active || !payload?.length) return null;
                  const pct = payload[0].value;
                  const msg =
                    pct >= 0.7 ? "ผ่านเกณฑ์ดี ไม่ต้องสอนซ้ำ" :
                      pct >= 0.5 ? "พอใช้ ควรทบทวนเล็กน้อย" :
                        "ควรสอนซ้ำบทนี้";
                  return (
                    <div className="bg-white border border-neutral-200 rounded-xl shadow-lg px-3 py-2 text-xs">
                      <p className="font-semibold text-neutral-700 mb-1">{label}</p>
                      <p className="text-neutral-600">{fmtPct(pct)}</p>
                      <p className={`mt-1 font-medium ${pct >= 0.7 ? "text-green-600" : pct >= 0.5 ? "text-amber-600" : "text-red-500"}`}>
                        → {msg}
                      </p>
                    </div>
                  );
                }}
                cursor={{ fill: "#fafafa" }}
              />
              <Bar dataKey="avgPct" radius={[0, 4, 4, 0]} name="คะแนนเฉลี่ย">
                {topicData.map((entry, i) => (
                  <Cell
                    key={i}
                    fill={
                      entry.avgPct >= 0.7 ? "#22c55e" :
                        entry.avgPct >= 0.5 ? "#f97316" :
                          "#ef4444"
                    }
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>

          {/* Action hint สำหรับ bar สีแดง */}
          {topicData.some(t => t.avgPct < 0.5) && (
            <div className="mt-3 flex items-start gap-2 bg-red-50 border border-red-100 rounded-xl px-3 py-2.5">
              <AlertTriangle className="h-3.5 w-3.5 text-red-400 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-red-600">
                <span className="font-semibold">
                  {topicData.filter(t => t.avgPct < 0.5).map(t => t.topic).join(", ")}
                </span>
                {" "}— นักเรียนส่วนใหญ่ทำได้ต่ำกว่า 50% ควรพิจารณาสอนซ้ำก่อนสอบครั้งถัดไป
              </p>
            </div>
          )
          }
        </div>
      </div>
    </div>
  );
}

// ─── Tab 2: วิเคราะห์ข้อสอบ ──────────────────────────────────────────────────
// ตัด legend ยาว + ย้าย P-value/D-index คำอธิบายไปอยู่ใน tooltip แทน

function ItemAnalysisTab({ data }) {
  const [filterTopic, setFilterTopic] = useState("ทั้งหมด");
  const [filterFlag, setFilterFlag] = useState("ทั้งหมด");
  const [filterLevel, setFilterLevel] = useState("ทั้งหมด");
  const [expandedQ, setExpandedQ] = useState(null);
  const [sortKey, setSortKey] = useState("id");
  const [sortDir, setSortDir] = useState(1);

  const ia = useMemo(() => computeItemAnalysis(data), [data]);
  const filtered = useMemo(() => {
    let r = ia;
    if (filterTopic !== "ทั้งหมด") r = r.filter(q => q.topic === filterTopic);
    if (filterLevel !== "ทั้งหมด") r = r.filter(q => q.level === filterLevel);
    if (filterFlag === "ปัญหา") r = r.filter(q => q.flag);
    if (filterFlag === "ดี") r = r.filter(q => !q.flag);
    return [...r].sort((a, b) => {
      const va = a[sortKey] ?? 0, vb = b[sortKey] ?? 0;
      return sortDir * (va < vb ? -1 : va > vb ? 1 : 0);
    });
  }, [ia, filterTopic, filterLevel, filterFlag, sortKey, sortDir]);

  const flaggedCount = ia.filter(q => q.flag).length;
  const avgPVal = avg(ia.map(q => q.pValue));
  const avgDIdx = avg(ia.map(q => q.dIndex));

  const handleSort = (key) => {
    if (sortKey === key) setSortDir(d => d * -1);
    else { setSortKey(key); setSortDir(-1); }
  };
  const SortIcon = ({ k }) => sortKey === k
    ? <ChevronDown className={`h-3 w-3 inline ml-0.5 transition-transform ${sortDir === -1 ? "rotate-180" : ""}`} />
    : null;

  return (
    <div className="space-y-5">
      {/* Summary — compact 3 cards */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-neutral-200 p-4 flex items-center gap-3">
          <div className="h-9 w-9 rounded-lg bg-red-100 flex items-center justify-center flex-shrink-0"><AlertTriangle className="h-4 w-4 text-red-500" /></div>
          <div><p className="text-xl font-bold text-red-600">{flaggedCount} ข้อ</p><p className="text-xs text-neutral-500">ต้องพิจารณาแก้ไข</p></div>
        </div>
        <div className="bg-white rounded-xl border border-neutral-200 p-4 flex items-center gap-3">
          <div className="h-9 w-9 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0"><Target className="h-4 w-4 text-blue-500" /></div>
          <div>
            <p className="text-xl font-bold text-blue-600">{fmtPct(avgPVal)}</p>
            <p className="text-xs text-neutral-500">P-value เฉลี่ย <span className="text-neutral-400">(เป้า 0.3–0.7)</span></p>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-neutral-200 p-4 flex items-center gap-3">
          <div className="h-9 w-9 rounded-lg bg-green-100 flex items-center justify-center flex-shrink-0"><TrendingUp className="h-4 w-4 text-green-500" /></div>
          <div>
            <p className="text-xl font-bold text-green-600">{fmtPct(avgDIdx)}</p>
            <p className="text-xs text-neutral-500">D-index เฉลี่ย <span className="text-neutral-400">(เป้า ≥0.3)</span></p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        <select value={filterTopic} onChange={e => setFilterTopic(e.target.value)} className="border border-neutral-200 rounded-xl px-3 py-2 text-xs text-neutral-700 focus:outline-none focus:ring-2 focus:ring-orange-300">
          <option>ทั้งหมด</option>
          {TOPICS.map(t => <option key={t}>{t}</option>)}
        </select>
        <select value={filterLevel} onChange={e => setFilterLevel(e.target.value)} className="border border-neutral-200 rounded-xl px-3 py-2 text-xs text-neutral-700 focus:outline-none focus:ring-2 focus:ring-orange-300">
          <option>ทั้งหมด</option>
          <option>ง่าย</option><option>ปานกลาง</option><option>ยาก</option>
        </select>
        <div className="flex rounded-xl overflow-hidden border border-neutral-200">
          {["ทั้งหมด", "ปัญหา", "ดี"].map(f => (
            <button key={f} onClick={() => setFilterFlag(f)} className={`px-3 py-2 text-xs font-medium transition ${filterFlag === f ? "bg-orange-500 text-white" : "bg-white text-neutral-600 hover:bg-neutral-50"}`}>
              {f === "ปัญหา" ? "⚠️ มีปัญหา" : f === "ดี" ? "✓ ผ่านเกณฑ์" : f}
            </button>
          ))}
        </div>
        <p className="ml-auto flex items-center text-xs text-neutral-400 self-center">{filtered.length} ข้อ</p>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-neutral-200 overflow-hidden">
        <table className="w-full text-xs">
          <thead>
            <tr className="bg-neutral-50 border-b border-neutral-100">
              <th onClick={() => handleSort("id")} className="cursor-pointer text-left font-semibold text-neutral-500 px-4 py-3 w-10">ข้อ <SortIcon k="id" /></th>
              <th className="text-left font-semibold text-neutral-500 px-3 py-3">หัวข้อ</th>
              <th className="text-left font-semibold text-neutral-500 px-3 py-3">ระดับ</th>
              <th onClick={() => handleSort("pValue")} className="cursor-pointer text-left font-semibold text-neutral-500 px-3 py-3">P-value <SortIcon k="pValue" /></th>
              <th onClick={() => handleSort("dIndex")} className="cursor-pointer text-left font-semibold text-neutral-500 px-3 py-3">D-index <SortIcon k="dIndex" /></th>
              <th className="text-left font-semibold text-neutral-500 px-3 py-3 min-w-[160px]">การเลือกตัวเลือก</th>
              <th onClick={() => handleSort("avgTimeSec")} className="cursor-pointer text-left font-semibold text-neutral-500 px-3 py-3">เวลาเฉลี่ย <SortIcon k="avgTimeSec" /></th>
              <th className="px-3 py-3 w-8" />
            </tr>
          </thead>
          <tbody>
            {filtered.map(q => {
              const isExpanded = expandedQ === q.id;
              const totalOpts = q.optCounts.reduce((s, c) => s + c, 0);
              return (
                <>
                  <tr key={q.id} className={`border-b border-neutral-50 hover:bg-neutral-50/60 transition cursor-pointer ${q.flag ? "bg-red-50/20" : ""}`} onClick={() => setExpandedQ(isExpanded ? null : q.id)}>
                    <td className="px-4 py-3 font-bold text-neutral-700">{q.flag && <AlertTriangle className="h-3 w-3 text-red-400 inline mr-1" />}{q.id}</td>
                    <td className="px-3 py-3"><span className="px-2 py-0.5 rounded-md font-semibold text-[10px]" style={{ backgroundColor: TOPIC_LIGHT[q.topic], color: TOPIC_COLORS[q.topic] }}>{q.topic}</span></td>
                    <td className="px-3 py-3"><span className={`px-2 py-0.5 rounded-full font-semibold text-[10px] ${LevelBadge[q.level]}`}>{q.level}</span></td>
                    <td className="px-3 py-3"><span className={`px-2 py-1 rounded-lg font-bold ${PValColor(q.pValue)}`}>{fmtPct(q.pValue)}</span></td>
                    <td className="px-3 py-3"><span className={`px-2 py-1 rounded-lg font-bold ${DIdxColor(q.dIndex)}`}>{q.dIndex >= 0 ? "+" : ""}{fmtPct(q.dIndex)}</span></td>
                    <td className="px-3 py-3">
                      <div className="space-y-0.5 w-40">
                        {["A", "B", "C", "D"].map((label, oi) => {
                          const pct = totalOpts > 0 ? q.optCounts[oi] / totalOpts : 0;
                          const isCorrect = oi === q.correctOpt;
                          return (
                            <div key={label} className="flex items-center gap-1.5">
                              <span className={`text-[9px] font-bold w-3.5 ${isCorrect ? "text-green-600" : "text-neutral-400"}`}>{label}</span>
                              <div className="flex-1 h-3 bg-neutral-100 rounded-sm overflow-hidden">
                                <div className="h-full rounded-sm transition-all" style={{ width: `${pct * 100}%`, backgroundColor: isCorrect ? "#22c55e" : "#e5e7eb" }} />
                              </div>
                              <span className={`text-[9px] w-5 text-right ${isCorrect ? "text-green-600 font-bold" : "text-neutral-400"}`}>{q.optCounts[oi]}</span>
                            </div>
                          );
                        })}
                      </div>
                    </td>
                    <td className="px-3 py-3 text-neutral-500">{Math.floor(q.avgTimeSec / 60)}:{String(Math.round(q.avgTimeSec % 60)).padStart(2, "0")} น.</td>
                    <td className="px-3 py-3"><ChevronDown className={`h-4 w-4 text-neutral-400 transition-transform ${isExpanded ? "rotate-180" : ""}`} /></td>
                  </tr>
                  {isExpanded && (
                    <tr key={`${q.id}-detail`} className="border-b border-neutral-100 bg-neutral-50/60">
                      <td colSpan={8} className="px-6 py-3">
                        <div className="flex gap-6 items-start">
                          <div className="flex-1">
                            <p className="text-xs font-semibold text-neutral-700 mb-1">โจทย์ข้อที่ {q.id}</p>
                            <p className="text-xs text-neutral-600">{q.text}</p>
                          </div>
                          {q.flag && (
                            <div className="bg-red-50 border border-red-100 rounded-xl p-3 max-w-xs">
                              <p className="text-xs font-semibold text-red-700 flex items-center gap-1 mb-1"><AlertTriangle className="h-3 w-3" /> คำแนะนำ</p>
                              <ul className="text-xs text-red-600 space-y-0.5">
                                {q.pValue < 0.25 && <li>• P-value ต่ำมาก — ข้อนี้อาจยากเกินไปหรือโจทย์ไม่ชัดเจน</li>}
                                {q.pValue > 0.92 && <li>• P-value สูงมาก — ข้อนี้อาจง่ายเกินไป</li>}
                                {q.dIndex < 0.15 && <li>• D-index ต่ำ — ข้อนี้ไม่ช่วยแยกแยะความสามารถนักเรียน</li>}
                              </ul>
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  )}
                </>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── Tab 3: ผลนักเรียน ───────────────────────────────────────────────────────

function StudentTab({ data, examLabel }) {
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState("rank");
  const [sortDir, setSortDir] = useState(1);
  const [filterPass, setFilterPass] = useState("ทั้งหมด");
  const [selected, setSelected] = useState(null);

  const sorted = useMemo(() =>
    [...data].sort((a, b) => b.pct - a.pct).map((s, i) => ({ ...s, rank: i + 1 }))
    , [data]);

  const displayed = useMemo(() => {
    let r = sorted;
    if (search) r = r.filter(s => s.name.includes(search));
    if (filterPass === "ผ่าน") r = r.filter(s => s.passed);
    if (filterPass === "ไม่ผ่าน") r = r.filter(s => !s.passed);
    return [...r].sort((a, b) => {
      const va = a[sortKey] ?? 0, vb = b[sortKey] ?? 0;
      return sortDir * (va < vb ? -1 : va > vb ? 1 : 0);
    });
  }, [sorted, search, filterPass, sortKey, sortDir]);

  const handleSort = (key) => {
    if (sortKey === key) setSortDir(d => d * -1);
    else { setSortKey(key); setSortDir(key === "rank" ? 1 : -1); }
  };
  const SortIcon = ({ k }) => sortKey === k ? <span className="ml-0.5 text-orange-500">{sortDir === 1 ? "▲" : "▼"}</span> : null;

  const passCount = data.filter(s => s.passed).length;

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-neutral-200 p-4 flex items-center gap-3">
          <CheckCircle className="h-8 w-8 text-green-500 flex-shrink-0" />
          <div><p className="text-2xl font-bold text-green-600">{passCount}</p><p className="text-xs text-neutral-500">ผ่าน ({fmtPct(passCount / data.length)})</p></div>
        </div>
        <div className="bg-white rounded-xl border border-neutral-200 p-4 flex items-center gap-3">
          <X className="h-8 w-8 text-red-400 flex-shrink-0" />
          <div><p className="text-2xl font-bold text-red-500">{data.length - passCount}</p><p className="text-xs text-neutral-500">ไม่ผ่าน ({fmtPct((data.length - passCount) / data.length)})</p></div>
        </div>
        <div className="bg-white rounded-xl border border-neutral-200 p-4 flex items-center gap-3">
          <Clock className="h-8 w-8 text-blue-400 flex-shrink-0" />
          <div><p className="text-xl font-bold text-blue-600">{fmtMin(Math.round(avg(data.map(s => s.timeSec))))}</p><p className="text-xs text-neutral-500">เวลาเฉลี่ย</p></div>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 items-center">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-neutral-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="ค้นหานักเรียน…" className="pl-9 pr-3 py-2 text-xs border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-300 w-48" />
        </div>
        <div className="flex rounded-xl overflow-hidden border border-neutral-200">
          {["ทั้งหมด", "ผ่าน", "ไม่ผ่าน"].map(f => (
            <button key={f} onClick={() => setFilterPass(f)} className={`px-3 py-2 text-xs font-medium transition ${filterPass === f ? "bg-orange-500 text-white" : "bg-white text-neutral-600 hover:bg-neutral-50"}`}>{f}</button>
          ))}
        </div>
        <p className="ml-auto text-xs text-neutral-400">{displayed.length} / {data.length} คน</p>
      </div>

      <div className="bg-white rounded-2xl border border-neutral-200 overflow-hidden">
        <table className="w-full text-xs">
          <thead>
            <tr className="bg-neutral-50 border-b border-neutral-100">
              {[["rank", "อันดับ"], ["name", "ชื่อ"], ["totalScore", "คะแนน"], [null, "รายหัวข้อ"], ["timeSec", "เวลา"], [null, "ผล"], [null, ""]].map(([k, label]) => (
                <th key={label} onClick={k ? () => handleSort(k) : undefined} className={`text-left font-semibold text-neutral-500 px-4 py-3 ${k ? "cursor-pointer hover:text-neutral-700" : ""}`}>
                  {label}{k && <SortIcon k={k} />}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {displayed.map(s => {
              const topicPcts = TOPICS.map(topic => {
                const qIdx = QUESTIONS.map((q, i) => ({ q, i })).filter(({ q }) => q.topic === topic).map(({ i }) => i);
                const maxSc = qIdx.reduce((sum, i) => sum + QUESTIONS[i].score, 0);
                const sc = qIdx.reduce((sum, i) => sum + (s.answers[i].correct ? QUESTIONS[i].score : 0), 0);
                return sc / maxSc;
              });
              return (
                <tr key={s.id} className="border-b border-neutral-50 last:border-0 hover:bg-neutral-50/60 transition">
                  <td className="px-4 py-3">
                    <span className={`h-6 w-6 rounded-full flex items-center justify-center text-[10px] font-bold ${s.rank === 1 ? "bg-amber-400 text-white" : s.rank === 2 ? "bg-neutral-400 text-white" : s.rank === 3 ? "bg-amber-700 text-white" : "bg-neutral-100 text-neutral-500"}`}>{s.rank}</span>
                  </td>
                  <td className="px-4 py-3 font-medium text-neutral-800">{s.name}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-20 h-1.5 bg-neutral-100 rounded-full overflow-hidden">
                        <div className="h-full rounded-full" style={{ width: `${s.pct * 100}%`, backgroundColor: s.pct >= 0.7 ? "#22c55e" : s.pct >= 0.6 ? "#f97316" : "#ef4444" }} />
                      </div>
                      <span className="font-semibold text-neutral-700">{Math.round(s.pct * 100)}%</span>
                    </div>
                    <p className="text-neutral-400 mt-0.5">{s.totalScore}/{MAX_SCORE}</p>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1">
                      {topicPcts.map((pct, ti) => (
                        <div key={ti} title={`${TOPICS[ti]}: ${Math.round(pct * 100)}%`} className="h-4 w-4 rounded-sm" style={{ backgroundColor: pct >= 0.7 ? TOPIC_COLORS[TOPICS[ti]] : pct >= 0.4 ? `${TOPIC_COLORS[TOPICS[ti]]}88` : "#fee2e2" }} />
                      ))}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-neutral-500">{fmtMin(s.timeSec)}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded-full text-[10px] font-bold ${s.passed ? "bg-green-100 text-green-700" : "bg-red-100 text-red-600"}`}>{s.passed ? "✓ ผ่าน" : "✗ ไม่ผ่าน"}</span>
                  </td>
                  <td className="px-4 py-3">
                    <button onClick={() => setSelected(s)} className="flex items-center gap-1 border border-neutral-200 hover:bg-neutral-100 text-neutral-600 rounded-lg px-2 py-1 text-[10px] font-semibold transition">
                      <Eye className="h-3 w-3" /> ดูผล
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {selected && <StudentModal student={selected} examLabel={examLabel} onClose={() => setSelected(null)} />}
    </div>
  );
}

// ─── Tab 4: เปรียบเทียบ ──────────────────────────────────────────────────────
// ตัด "นักเรียนที่พัฒนา/ต้องเอาใจใส่" ออก เหลือแค่ progress summary + topic trend

function ComparisonTab() {
  const topicTrendData = useMemo(() =>
    TOPICS.map(topic => {
      const qIdx = QUESTIONS.map((q, i) => ({ q, i })).filter(({ q }) => q.topic === topic).map(({ i }) => i);
      const maxSc = qIdx.reduce((s, i) => s + QUESTIONS[i].score, 0);
      const calc = (data) => avg(data.map(s => qIdx.reduce((sc, i) => sc + (s.answers[i].correct ? QUESTIONS[i].score : 0), 0))) / maxSc;
      return {
        topic: topic.replace("ลำดับและอนุกรม", "ลำดับฯ"),
        "Pre-test": parseFloat((calc(ALL_DATA[0]) * 100).toFixed(1)),
        "Mid-test": parseFloat((calc(ALL_DATA[1]) * 100).toFixed(1)),
        "Post-test": parseFloat((calc(ALL_DATA[2]) * 100).toFixed(1)),
      };
    }), []);

  const overallAvg = ALL_DATA.map(d => (avg(d.map(s => s.pct)) * 100).toFixed(1));
  const passRates = ALL_DATA.map(d => (d.filter(s => s.passed).length / d.length * 100).toFixed(1));

  return (
    <div className="space-y-6">
      {/* Progress summary cards */}
      <div className="grid grid-cols-3 gap-4">
        {EXAMS_META.map((e, i) => (
          <div key={e.id} className="bg-white rounded-2xl border border-neutral-200 p-5">
            <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${e.badge}`}>{e.label}</span>
            <p className="text-4xl font-black text-neutral-800 mt-2">{overallAvg[i]}%</p>
            <p className="text-xs text-neutral-500 mt-0.5">คะแนนเฉลี่ย</p>
            <div className="mt-2 flex items-center gap-1.5 text-xs text-neutral-500">
              <span className="font-semibold text-green-600">{passRates[i]}%</span> อัตราผ่าน
            </div>
            {i > 0 && (
              <div className={`mt-2 flex items-center gap-1 text-xs font-semibold ${+overallAvg[i] > +overallAvg[i - 1] ? "text-green-600" : "text-red-500"}`}>
                {+overallAvg[i] > +overallAvg[i - 1]
                  ? <><ArrowUpRight className="h-3.5 w-3.5" /> +{(+overallAvg[i] - +overallAvg[i - 1]).toFixed(1)}% จาก {EXAMS_META[i - 1].label}</>
                  : <><ArrowDownRight className="h-3.5 w-3.5" /> {(+overallAvg[i] - +overallAvg[i - 1]).toFixed(1)}% จาก {EXAMS_META[i - 1].label}</>}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Topic trend chart */}
      <div className="bg-white rounded-2xl border border-neutral-200 p-5">
        <div className="flex items-center gap-2 mb-4">
          <div className="h-7 w-7 rounded-lg bg-green-100 flex items-center justify-center">
            <TrendingUp className="h-3.5 w-3.5 text-green-500" />
          </div>
          <p className="text-sm font-bold text-neutral-800">พัฒนาการรายหัวข้อ (Pre → Mid → Post)</p>
        </div>
        <ResponsiveContainer width="100%" height={280}>
          <LineChart data={topicTrendData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f5f5f5" />
            <XAxis dataKey="topic" tick={{ fontSize: 10, fill: "#525252" }} tickLine={false} axisLine={false} />
            <YAxis domain={[0, 100]} tickFormatter={v => `${v}%`} tick={{ fontSize: 10, fill: "#a3a3a3" }} tickLine={false} axisLine={false} />
            <Tooltip formatter={v => `${v}%`} content={<ChartTooltip />} />
            <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: "11px" }} />
            <Line type="monotone" dataKey="Pre-test" stroke="#93c5fd" strokeWidth={2} dot={{ fill: "#93c5fd", r: 4 }} activeDot={{ r: 6 }} />
            <Line type="monotone" dataKey="Mid-test" stroke="#f97316" strokeWidth={2} dot={{ fill: "#f97316", r: 4 }} activeDot={{ r: 6 }} />
            <Line type="monotone" dataKey="Post-test" stroke="#22c55e" strokeWidth={2.5} dot={{ fill: "#22c55e", r: 4 }} activeDot={{ r: 6 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

// ─── Export ───────────────────────────────────────────────────────────────────

const exportToExcel = (data, examLabel) => {
  const wb = XLSX.utils.book_new();
  const s1 = data.map((s, i) => ({
    "อันดับ": i + 1, "ชื่อนักเรียน": s.name,
    "คะแนนรวม": s.totalScore, "คะแนนเต็ม": MAX_SCORE,
    "เปอร์เซ็นต์": `${(s.pct * 100).toFixed(1)}%`,
    "ผล": s.passed ? "ผ่าน" : "ไม่ผ่าน",
    "เวลาที่ใช้ (นาที)": Math.round(s.timeSec / 60),
  }));
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(s1), "ผลนักเรียน");
  const ia = computeItemAnalysis(data);
  const s2 = ia.map(q => ({
    "ข้อที่": q.id, "หัวข้อ": q.topic, "ระดับ": q.level, "คะแนน": q.score,
    "P-value": (q.pValue * 100).toFixed(1) + "%",
    "D-index": (q.dIndex * 100).toFixed(1) + "%",
    "ตอบถูก (คน)": Math.round(q.pValue * data.length),
    "เวลาเฉลี่ย (วิ)": Math.round(q.avgTimeSec),
    "มีปัญหา": q.flag ? "ใช่" : "ไม่",
  }));
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(s2), "วิเคราะห์ข้อสอบ");
  XLSX.writeFile(wb, `exam_analytics_${examLabel.replace(/\s/g, "_")}.xlsx`);
};

// ─── Main ─────────────────────────────────────────────────────────────────────

const TABS = [
  { id: "overview", label: "ภาพรวม", icon: BarChart2 },
  { id: "items", label: "วิเคราะห์ข้อสอบ", icon: Target },
  { id: "students", label: "ผลนักเรียน", icon: Users },
  { id: "compare", label: "เปรียบเทียบ", icon: TrendingUp },
];

export default function TutorExamAnalytics() {
  const [searchParams] = useSearchParams();
  const TYPE_TO_ID = { "pre-test": 0, "mid-test": 1, "post-test": 2 };
  const initialExamId = TYPE_TO_ID[searchParams.get("examType")] ?? 1;
  const initialTab = searchParams.get("tab") ?? "overview";

  const [activeTab, setActiveTab] = useState(initialTab);
  const [examId, setExamId] = useState(initialExamId);

  const data = ALL_DATA[examId];
  const examLabel = EXAMS_META[examId].label;

  return (
    <div className="space-y-6 mt-[90px]">
      {/* Breadcrumb */}
      <div className="flex items-center text-sm gap-2 text-neutral-500">
        <Link to="/tutor/courses" className="hover:text-orange-600 transition font-medium">คอร์ส</Link>
        <ChevronRight className="h-4 w-4" />
        <Link to="/tutor/exams" className="hover:text-orange-600 transition font-medium">จัดการการสอบ</Link>
        <ChevronRight className="h-4 w-4" />
        <span className="font-semibold text-neutral-800">Analytics</span>
      </div>

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">Analytics & Reporting</h1>
          <p className="text-sm text-neutral-500 mt-1">คณิตศาสตร์ ม.3 เทอม 1/2567 • นักเรียน {data.length} คน • {QUESTIONS.length} ข้อ • {MAX_SCORE} คะแนน</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {/* Exam Selector — เหลือแค่ที่นี่ที่เดียว */}
          <div className="flex rounded-xl overflow-hidden border border-neutral-200">
            {EXAMS_META.map(e => (
              <button key={e.id} onClick={() => setExamId(e.id)} className={`px-3 py-2 text-xs font-semibold transition ${examId === e.id ? "bg-neutral-900 text-white" : "bg-white text-neutral-600 hover:bg-neutral-50"}`}>
                {e.label}
              </button>
            ))}
          </div>
          <button onClick={() => exportToExcel(data, examLabel)} className="flex items-center gap-2 border border-green-200 bg-green-50 hover:bg-green-100 text-green-700 rounded-xl px-4 py-2 text-sm font-medium transition">
            <Download className="h-4 w-4" /> Export Excel
          </button>
        </div>
      </div>

      {/* Tab Nav */}
      <div className="flex gap-1 bg-neutral-100 rounded-2xl p-1 w-fit">
        {TABS.map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all ${isActive ? "bg-white text-orange-600 shadow-sm" : "text-neutral-500 hover:text-neutral-700"}`}>
              <Icon className="h-4 w-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Content */}
      {activeTab === "overview" && <OverviewTab data={data} />}
      {activeTab === "items" && <ItemAnalysisTab data={data} />}
      {activeTab === "students" && <StudentTab data={data} examLabel={examLabel} />}
      {activeTab === "compare" && <ComparisonTab />}
    </div>
  );
}