import { useState, useMemo, useEffect } from "react";
import { useSearchParams, Link, useNavigate } from "react-router-dom";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, LineChart, Line, Legend, Cell, ReferenceLine,
} from "recharts";
import {
  BarChart2, Users, TrendingUp, Download, AlertTriangle,
  CheckCircle, Search, Award, Clock, BookOpen, Info,
  X, Eye, ChevronRight, ArrowUpRight, ArrowDownRight, ChevronDown, ChevronLeft,
} from "lucide-react";
import * as XLSX from "xlsx";
import { fetchExams, fetchExamResults } from "../utils/examShared";

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

// ─── Questions (mock — ยังใช้กับ Export Excel / ตัวเลขคำถามชั่วคราว จนกว่าจะมี item-level endpoint จริง) ──

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

// ─── Pseudo-random helpers (mock — ยังใช้กับ Export Excel ชั่วคราว) ────────────

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

// ─── ข้อมูลจริงข้ามรอบสอบ (แทนที่ getStudentCrossExamData เดิมทั้งฟังก์ชัน) ──
// รวมคนคนเดียวกันข้าม 3 รอบด้วย userId จริงจาก backend (ไม่ใช่ index มั่วแบบ mock)
// topicPcts ยังเป็น null เสมอ — รอ backend endpoint สรุปคะแนนรายหัวข้อทั้งห้อง

function buildRealCrossExamData(examResults) {
  const userMap = new Map(); // userId -> { userId, name, exams: [null,null,null] }

  examResults.forEach((r, examId) => {
    if (!r) return;
    const sorted = [...r.students].filter(s => s.submittedAt && s.maxScore)
      .sort((a, b) => (b.totalScore / b.maxScore) - (a.totalScore / a.maxScore));
    const rankByUser = new Map(sorted.map((s, i) => [s.userId, i + 1]));

    r.students.forEach((s) => {
      if (!userMap.has(s.userId)) userMap.set(s.userId, { userId: s.userId, name: s.name, exams: [null, null, null] });
      const entry = userMap.get(s.userId);
      if (s.submittedAt && s.maxScore) {
        entry.exams[examId] = {
          label: EXAMS_META[examId].label,
          submitted: true,
          pct: s.totalScore / s.maxScore,
          totalScore: s.totalScore,
          maxScore: s.maxScore,
          rank: rankByUser.get(s.userId),
          totalStudents: sorted.length,
          avgTimePerQuestion: s.secondsUsed != null && s.totalQuestions ? s.secondsUsed / s.totalQuestions : null,
        };
      }
    });
  });

  return Array.from(userMap.values()).map((u) => ({
    studentId: u.userId,
    name: u.name,
    exams: u.exams.map((e, i) => e || {
      label: EXAMS_META[i].label, submitted: false, pct: null, totalScore: null,
      maxScore: null, topicPcts: null, rank: null, totalStudents: null, avgTimePerQuestion: null,
    }),
  }));
}

// ─── UI Primitives ──────────────────────────────────────────────────────────

const LevelBadge = { "ง่าย": "bg-emerald-100 text-emerald-700", "ปานกลาง": "bg-amber-100 text-amber-700", "ยาก": "bg-red-100 text-red-700" };

function Modal({ title, icon: Icon, onClose, children, wide }) {
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className={`bg-white rounded-2xl w-full shadow-2xl overflow-hidden max-h-[90vh] flex flex-col ${wide ? "max-w-4xl" : "max-w-2xl"}`}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-orange-100 bg-gradient-to-r from-orange-500 to-amber-500 shrink-0">
          <h3 className="flex items-center gap-2.5 text-base font-bold text-white">
            {Icon && (
              <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-white/20">
                <Icon className="h-4 w-4 text-white" />
              </span>
            )}
            {title}
          </h3>
          <button onClick={onClose} className="p-1.5 rounded-xl text-white/70 hover:bg-white/20 hover:text-white transition">
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="overflow-y-auto flex-1 p-6">{children}</div>
      </div>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, sub, color = "bg-orange-500", tooltip }) {
  return (
    <div className="flex items-center gap-3 p-4 bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition h-full">
      <div className={`h-11 w-11 rounded-xl ${color} flex items-center justify-center shrink-0`}>
        <Icon className="h-5 w-5 text-white" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          <p className="text-xs text-slate-500 font-medium">{label}</p>
          {tooltip && (
            <div className="relative group">
              <span className="h-3.5 w-3.5 rounded-full border border-slate-300 flex items-center justify-center text-[9px] text-slate-400 cursor-default shrink-0">
                ?
              </span>
              <div className="absolute bottom-full left-0 mb-2 w-60 bg-white border border-slate-200 rounded-xl p-3 text-xs text-slate-600 leading-relaxed shadow-lg hidden group-hover:block z-10">
                {tooltip}
              </div>
            </div>
          )}
        </div>
        <p className="text-xl font-black text-slate-900">{value}</p>
        {sub && <p className="text-[11px] text-slate-400 mt-0.5 truncate">{sub}</p>}
      </div>
    </div>
  );
}

function SectionCard({ title, icon: Icon, children, action, className = "" }) {
  return (
    <div className={`bg-white rounded-2xl border border-slate-100 shadow-sm p-5 ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
          {Icon && <Icon className="h-4 w-4 text-orange-500" />}
          {title}
        </h3>
        {action}
      </div>
      {children}
    </div>
  );
}

const ChartTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-slate-200 rounded-xl shadow-lg px-3 py-2 text-xs">
      <p className="font-semibold text-slate-700 mb-1">{label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color }}>{p.name}: <strong>{typeof p.value === "number" && p.value < 1.5 ? fmtPct(p.value) : p.value}</strong></p>
      ))}
    </div>
  );
};

// ─── Student Drill-down Modal (mock — ใช้ใน StudentTab ที่ปิดใช้งานอยู่) ──────

function StudentModal({ student, examLabel, onClose }) {
  if (!student) return null;
  const topicBreakdown = TOPICS.map(topic => {
    const qIdx = QUESTIONS.map((q, i) => ({ q, i })).filter(({ q }) => q.topic === topic).map(({ i }) => i);
    const maxSc = qIdx.reduce((s, i) => s + QUESTIONS[i].score, 0);
    const sc = qIdx.reduce((s, i) => s + (student.answers[i].correct ? QUESTIONS[i].score : 0), 0);
    return { topic, sc, maxSc, pct: sc / maxSc, color: TOPIC_COLORS[topic] };
  });
  const grade = student.pct >= 0.90 ? "A" : student.pct >= 0.80 ? "B+" : student.pct >= 0.70 ? "B" : student.pct >= 0.60 ? "C" : "F";

  return (
    <Modal title={`ผลสอบ: ${student.name}`} icon={Eye} onClose={onClose} wide>
      <div className="flex items-center gap-4 mb-6 p-4 bg-gradient-to-br from-orange-500 to-amber-600 rounded-2xl text-white">
        <div className="h-16 w-16 rounded-2xl bg-white/20 border-2 border-white/30 flex items-center justify-center shrink-0">
          <span className="text-lg font-bold text-white">{student.id}</span>
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-bold text-lg">{student.name}</p>
          <p className="text-sm text-orange-100">{examLabel} · ใช้เวลา {fmtMin(student.timeSec)}</p>
        </div>
        <div className="flex gap-3 shrink-0">
          <div className="bg-white/20 rounded-xl px-3 py-2 text-center">
            <p className="text-xl font-black">{grade}</p>
            <p className="text-[10px] text-orange-100">เกรด</p>
          </div>
          <div className="bg-white/20 rounded-xl px-3 py-2 text-center">
            <p className="text-xl font-black">{student.totalScore}/{MAX_SCORE}</p>
            <p className="text-[10px] text-orange-100">{fmtPct(student.pct)}</p>
          </div>
        </div>
      </div>

      <div className="space-y-5">
        <div>
          <p className="text-sm font-bold text-slate-800 mb-3">คะแนนรายหัวข้อ</p>
          <div className="space-y-2.5">
            {topicBreakdown.map(t => (
              <div key={t.topic} className="flex items-center gap-3">
                <p className="text-xs text-slate-500 w-36 flex-shrink-0">{t.topic}</p>
                <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full rounded-full transition-all" style={{ width: `${t.pct * 100}%`, backgroundColor: t.color }} />
                </div>
                <p className="text-xs font-semibold text-slate-700 w-20 text-right">{t.sc}/{t.maxSc} ({Math.round(t.pct * 100)}%)</p>
              </div>
            ))}
          </div>
        </div>

        <div>
          <p className="text-sm font-bold text-slate-800 mb-3">รายข้อ</p>
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200">
                    {["ข้อ", "หัวข้อ", "ระดับ", "ผล", "คะแนน", "เวลา"].map(h => (
                      <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {QUESTIONS.map((q, qi) => {
                    const ans = student.answers[qi];
                    return (
                      <tr key={q.id} className={ans.correct ? "bg-emerald-50/30" : "bg-red-50/30"}>
                        <td className="px-4 py-2.5 font-medium text-slate-600">{q.id}</td>
                        <td className="px-4 py-2.5"><span className="px-1.5 py-0.5 rounded-md text-[10px] font-semibold" style={{ backgroundColor: TOPIC_LIGHT[q.topic], color: TOPIC_COLORS[q.topic] }}>{q.topic}</span></td>
                        <td className="px-4 py-2.5"><span className={`px-1.5 py-0.5 rounded-md text-[10px] font-semibold ${LevelBadge[q.level]}`}>{q.level}</span></td>
                        <td className="px-4 py-2.5">{ans.correct ? <span className="flex items-center gap-1 text-emerald-700 font-semibold text-xs"><CheckCircle className="h-3 w-3" /> ถูก</span> : <span className="flex items-center gap-1 text-red-500 font-semibold text-xs"><X className="h-3 w-3" /> ผิด</span>}</td>
                        <td className="px-4 py-2.5 text-slate-700">{ans.correct ? q.score : 0}/{q.score}</td>
                        <td className="px-4 py-2.5 text-slate-500">{Math.floor(ans.timeSec / 60)}:{String(ans.timeSec % 60).padStart(2, "0")} น.</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
}

// ─── Tab 1: ภาพรวม (ข้อมูลจริงจาก fetchExamResults) ────────────────────────

function OverviewTab({ results }) {
  const submitted = (results?.students || []).filter(s => s.submittedAt && s.maxScore);

  if (!results || submitted.length === 0) {
    return (
      <div className="flex flex-col items-center text-center gap-3 bg-slate-50 border border-dashed border-slate-200 rounded-2xl p-10">
        <BarChart2 className="h-10 w-10 text-slate-300" />
        <p className="text-sm font-semibold text-slate-600">ยังไม่มีข้อมูลผลสอบรอบนี้</p>
        <p className="text-xs text-slate-400">ต้องมีนักเรียนส่งข้อสอบอย่างน้อย 1 คน</p>
      </div>
    );
  }

  const pcts = submitted.map(s => s.totalScore / s.maxScore);
  const avgPct = avg(pcts);
  const sdPct = sdev(pcts);
  const passRate = submitted.filter(s => (s.totalScore / s.maxScore) * 100 >= PASS_PCT).length / submitted.length;
  const maxPct = Math.max(...pcts);
  const minPct = Math.min(...pcts);
  const maxScore = submitted[0].maxScore;

  const hist = useMemo(() => {
    const bins = Array.from({ length: 10 }, (_, i) => ({ range: `${i * 10}–${(i + 1) * 10}%`, count: 0 }));
    submitted.forEach(s => { bins[Math.min(9, Math.floor((s.totalScore / s.maxScore) * 10))].count++; });
    return bins;
  }, [submitted]);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard icon={Award} label="คะแนนเฉลี่ย" value={fmtPct(avgPct)} sub={`${(avgPct * maxScore).toFixed(1)} / ${maxScore} คะแนน`} color="bg-orange-500" />
        <StatCard icon={CheckCircle} label="อัตราผ่าน" value={fmtPct(passRate)} sub={`${submitted.filter(s => (s.totalScore / s.maxScore) * 100 >= PASS_PCT).length} จาก ${submitted.length} คน`} color="bg-emerald-500" />
        <StatCard icon={TrendingUp} label="สูงสุด / ต่ำสุด" value={`${fmtPct(maxPct)} / ${fmtPct(minPct)}`} sub="ช่วงคะแนน" color="bg-blue-500" />
        <StatCard icon={BarChart2} label="ส่วนเบี่ยงเบนมาตรฐาน" value={fmtPct(sdPct)} sub="σ (sigma)" color="bg-amber-500" />
      </div>

      <SectionCard title="การกระจายตัวของคะแนน" icon={BarChart2}>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={hist} barCategoryGap="15%">
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
            <XAxis dataKey="range" tick={{ fontSize: 10, fill: "#94a3b8" }} tickLine={false} axisLine={false} />
            <YAxis tick={{ fontSize: 10, fill: "#94a3b8" }} tickLine={false} axisLine={false} allowDecimals={false} />
            <Tooltip content={<ChartTooltip />} cursor={{ fill: "#f8fafc" }} />
            <Bar dataKey="count" radius={[4, 4, 0, 0]} name="จำนวนนักเรียน">
              {hist.map((entry, i) => <Cell key={i} fill={i >= 6 ? "#22c55e" : i >= 4 ? "#f97316" : "#ef4444"} />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </SectionCard>

      {/* กราฟ "คะแนนเฉลี่ยรายหัวข้อ" เอาออกชั่วคราว — รอ backend endpoint ใหม่ */}
      <div className="flex gap-2 bg-blue-50 border border-blue-100 rounded-xl p-3">
        <Info className="h-4 w-4 text-blue-500 flex-shrink-0 mt-0.5" />
        <p className="text-xs text-blue-700">คะแนนแยกรายหัวข้อจะกลับมาแสดงเมื่อเชื่อมข้อมูลจริงเสร็จ (ต้องเพิ่ม backend endpoint เพิ่มเติม)</p>
      </div>
    </div>
  );
}

// ─── Tab 2: วิเคราะห์ข้อสอบ — ปิดใช้งานชั่วคราว (mock, ไม่แตะ) ────────────────
/*
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
*/

// ─── Tab 3: ผลนักเรียน — ปิดใช้งานชั่วคราว (mock, dead code — ไม่แตะ) ─────────

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
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard icon={CheckCircle} label="ผ่านเกณฑ์" value={passCount} sub={fmtPct(passCount / data.length)} color="bg-emerald-500" />
        <StatCard icon={X} label="ไม่ผ่านเกณฑ์" value={data.length - passCount} sub={fmtPct((data.length - passCount) / data.length)} color="bg-red-500" />
        <StatCard icon={Clock} label="เวลาเฉลี่ย" value={fmtMin(Math.round(avg(data.map(s => s.timeSec))))} sub="ต่อคน" color="bg-blue-500" />
      </div>

      <div className="bg-white border border-slate-200 rounded-xl p-3 shadow-sm">
        <div className="flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              value={search} onChange={e => setSearch(e.target.value)}
              placeholder="ค้นหานักเรียน..."
              className="pl-10 pr-4 py-2 w-full bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-orange-400 focus:border-transparent outline-none transition"
            />
          </div>
          <div className="flex rounded-xl overflow-hidden border border-slate-200 shrink-0">
            {["ทั้งหมด", "ผ่าน", "ไม่ผ่าน"].map(f => (
              <button key={f} onClick={() => setFilterPass(f)}
                className={`px-3 py-2 text-xs font-bold transition ${filterPass === f ? "bg-orange-500 text-white" : "bg-white text-slate-600 hover:bg-slate-50"}`}>
                {f}
              </button>
            ))}
          </div>
        </div>
        <p className="text-xs text-slate-400 mt-2 pl-1">แสดง {displayed.length} จาก {data.length} คน</p>
      </div>

      {displayed.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-slate-200">
          <p className="text-slate-500 font-medium">ไม่พบนักเรียนที่ค้นหา</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  {[["rank", "อันดับ"], ["name", "ชื่อ"], ["totalScore", "คะแนน"], [null, "รายหัวข้อ"], ["timeSec", "เวลา"], [null, "ผล"], [null, ""]].map(([k, label]) => (
                    <th key={label} onClick={k ? () => handleSort(k) : undefined}
                      className={`text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide ${k ? "cursor-pointer hover:text-slate-700" : ""}`}>
                      {label}{k && <SortIcon k={k} />}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {displayed.map(s => {
                  const topicPcts = TOPICS.map(topic => {
                    const qIdx = QUESTIONS.map((q, i) => ({ q, i })).filter(({ q }) => q.topic === topic).map(({ i }) => i);
                    const maxSc = qIdx.reduce((sum, i) => sum + QUESTIONS[i].score, 0);
                    const sc = qIdx.reduce((sum, i) => sum + (s.answers[i].correct ? QUESTIONS[i].score : 0), 0);
                    return sc / maxSc;
                  });
                  return (
                    <tr key={s.id} className="hover:bg-orange-50/40 transition-colors">
                      <td className="px-4 py-3">
                        <span className={`h-6 w-6 rounded-full flex items-center justify-center text-[10px] font-bold ${s.rank === 1 ? "bg-amber-400 text-white" : s.rank === 2 ? "bg-slate-400 text-white" : s.rank === 3 ? "bg-amber-700 text-white" : "bg-slate-100 text-slate-500"}`}>{s.rank}</span>
                      </td>
                      <td className="px-4 py-3 font-semibold text-slate-900">{s.name}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-20 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                            <div className="h-full rounded-full" style={{ width: `${s.pct * 100}%`, backgroundColor: s.pct >= 0.7 ? "#22c55e" : s.pct >= 0.6 ? "#f97316" : "#ef4444" }} />
                          </div>
                          <span className="font-semibold text-slate-700">{Math.round(s.pct * 100)}%</span>
                        </div>
                        <p className="text-slate-400 mt-0.5 text-xs">{s.totalScore}/{MAX_SCORE}</p>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-1">
                          {topicPcts.map((pct, ti) => (
                            <div key={ti} title={`${TOPICS[ti]}: ${Math.round(pct * 100)}%`} className="h-4 w-4 rounded-sm" style={{ backgroundColor: pct >= 0.7 ? TOPIC_COLORS[TOPICS[ti]] : pct >= 0.4 ? `${TOPIC_COLORS[TOPICS[ti]]}88` : "#fee2e2" }} />
                          ))}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-slate-500">{fmtMin(s.timeSec)}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-bold border ${s.passed ? "bg-emerald-100 text-emerald-700 border-emerald-200" : "bg-red-100 text-red-600 border-red-200"}`}>{s.passed ? "✓ ผ่าน" : "✗ ไม่ผ่าน"}</span>
                      </td>
                      <td className="px-4 py-3">
                        <button onClick={() => setSelected(s)}
                          className="flex items-center gap-1 px-2.5 py-1.5 text-[11px] font-bold text-orange-600 bg-orange-50 border border-orange-100 rounded-lg hover:bg-orange-100 transition">
                          <Eye className="h-3.5 w-3.5" /> ดูผล
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
      {selected && <StudentModal student={selected} examLabel={examLabel} onClose={() => setSelected(null)} />}
    </div>
  );
}

// ─── Tab: รายคน (cross-exam) — ข้อมูลจริงจาก fetchExamResults ────────────────

function StudentProgressTab({ examResults }) {
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState(null);

  const crossExamData = useMemo(() => buildRealCrossExamData(examResults), [examResults]);

  const students = useMemo(() =>
    crossExamData.map((d) => {
      const submittedList = d.exams.filter(e => e.submitted);
      const latest = submittedList[submittedList.length - 1] ?? null;
      const first = submittedList[0] ?? null;
      const rankChange = (first && latest && first !== latest) ? first.rank - latest.rank : null;
      return {
        studentId: d.studentId, name: d.name,
        submittedCount: submittedList.length, totalExams: d.exams.length,
        latestPct: latest?.pct ?? null,
        latestRank: latest?.rank ?? null,
        totalStudents: latest?.totalStudents ?? null,
        rankChange,
      };
    }), [crossExamData]);

  const filtered = useMemo(() => students.filter(s => s.name.includes(search)), [students, search]);

  if (crossExamData.length === 0) {
    return (
      <div className="flex flex-col items-center text-center gap-3 bg-slate-50 border border-dashed border-slate-200 rounded-2xl p-10">
        <Users className="h-10 w-10 text-slate-300" />
        <p className="text-sm font-semibold text-slate-600">ยังไม่มีข้อมูลนักเรียน</p>
        <p className="text-xs text-slate-400">ต้องมีนักเรียนส่งข้อสอบอย่างน้อย 1 คนในรอบใดรอบหนึ่ง</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white border border-slate-200 rounded-xl p-3 shadow-sm">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            value={search} onChange={e => setSearch(e.target.value)}
            placeholder="ค้นหานักเรียน..."
            className="pl-10 pr-4 py-2 w-full bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-orange-400 focus:border-transparent outline-none transition"
          />
        </div>
        <p className="text-xs text-slate-400 mt-2 pl-1">แสดง {filtered.length} จาก {students.length} คน</p>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                {["ชื่อ", "สอบครบ", "คะแนน/อันดับล่าสุด", "แนวโน้ม", ""].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map(s => (
                <tr key={s.studentId} className="hover:bg-orange-50/40 transition-colors">
                  <td className="px-4 py-3 font-semibold text-slate-900">{s.name}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-bold border ${s.submittedCount === s.totalExams ? "bg-emerald-100 text-emerald-700 border-emerald-200" : "bg-amber-100 text-amber-700 border-amber-200"
                      }`}>
                      {s.submittedCount}/{s.totalExams} รอบ
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-600">
                    {s.latestPct != null ? (
                      <>
                        <span className="font-semibold">{fmtPct(s.latestPct)}</span>
                        {s.latestRank != null && <span className="text-slate-400 text-xs ml-1.5">อันดับ {s.latestRank}/{s.totalStudents}</span>}
                      </>
                    ) : "—"}
                  </td>
                  <td className="px-4 py-3">
                    {s.rankChange == null ? (
                      <span className="text-xs text-slate-300">ยังเทียบไม่ได้</span>
                    ) : s.rankChange > 0 ? (
                      <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600"><ArrowUpRight className="h-3.5 w-3.5" /> ดีขึ้น {s.rankChange} อันดับ</span>
                    ) : s.rankChange < 0 ? (
                      <span className="inline-flex items-center gap-1 text-xs font-semibold text-red-500"><ArrowDownRight className="h-3.5 w-3.5" /> ลดลง {Math.abs(s.rankChange)} อันดับ</span>
                    ) : (
                      <span className="text-xs text-slate-400">เท่าเดิม</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <button onClick={() => setSelected(s.studentId)} className="flex items-center gap-1 px-2.5 py-1.5 text-[11px] font-bold text-orange-600 bg-orange-50 border border-orange-100 rounded-lg hover:bg-orange-100 transition">
                      <Eye className="h-3.5 w-3.5" /> ดูพัฒนาการ
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {selected != null && <StudentProgressModal studentId={selected} crossExamData={crossExamData} onClose={() => setSelected(null)} />}
    </div>
  );
}

function StudentProgressModal({ studentId, crossExamData, onClose }) {
  const data = crossExamData.find(d => d.studentId === studentId);
  if (!data) return null;

  const submittedExams = data.exams.filter(e => e.submitted);
  const hasEnoughData = submittedExams.length >= 2;
  const missingExams = data.exams.filter(e => !e.submitted);

  const first = submittedExams[0];
  const last = submittedExams[submittedExams.length - 1];
  const rankChange = hasEnoughData ? first.rank - last.rank : null; // + = อันดับดีขึ้น (เลขน้อยลง)

  const lineData = data.exams.map(e => ({ label: e.label, pct: e.submitted ? Math.round(e.pct * 1000) / 10 : null }));

  return (
    <Modal title={`พัฒนาการของ ${data.name}`} icon={TrendingUp} onClose={onClose} wide>
      {missingExams.length > 0 && (
        <div className="flex items-start gap-2 bg-amber-50 border border-amber-100 rounded-xl p-3 mb-5">
          <AlertTriangle className="h-4 w-4 text-amber-500 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-amber-700">
            ยังไม่มีข้อมูล: {missingExams.map(e => e.label).join(", ")} — กราฟแสดงเฉพาะรอบที่มีข้อมูลจริงเท่านั้น
          </p>
        </div>
      )}

      {/* การ์ดคะแนน+อันดับต่อรอบ */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        {data.exams.map(e => (
          <div key={e.label} className={`rounded-2xl border p-4 text-center ${e.submitted ? "border-slate-100 bg-white" : "border-dashed border-slate-200 bg-slate-50"}`}>
            <p className="text-xs font-bold text-slate-500 mb-1">{e.label}</p>
            {e.submitted ? (
              <>
                <p className="text-2xl font-black text-slate-900">{fmtPct(e.pct)}</p>
                <p className="text-[11px] text-slate-400 mt-0.5">{e.totalScore}/{e.maxScore} คะแนน</p>
                {e.rank != null && (
                  <p className="text-[11px] font-semibold text-orange-600 mt-1.5 inline-flex items-center gap-1 bg-orange-50 px-2 py-0.5 rounded-full">
                    อันดับ {e.rank}/{e.totalStudents}
                  </p>
                )}
              </>
            ) : <p className="text-sm text-slate-300 italic mt-2">ยังไม่สอบ</p>}
          </div>
        ))}
      </div>

      {!hasEnoughData ? (
        <div className="flex flex-col items-center text-center gap-3 bg-slate-50 border border-dashed border-slate-200 rounded-2xl p-10">
          <div className="h-12 w-12 rounded-full bg-white border border-slate-200 flex items-center justify-center">
            <TrendingUp className="h-5 w-5 text-slate-300" />
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-600">ยังมีข้อมูลไม่พอเทียบพัฒนาการ</p>
            <p className="text-xs text-slate-400 mt-1 max-w-sm">
              ต้องปิดสอบอีกอย่างน้อย 1 รอบ ถึงจะเห็นอันดับที่เปลี่ยนไปและคะแนนรวมเทียบข้ามรอบ
            </p>
          </div>
        </div>
      ) : (
        <>
          {rankChange != null && (
            <div className={`flex items-center gap-3 rounded-2xl p-4 mb-5 border ${rankChange > 0 ? "bg-emerald-50 border-emerald-100" : rankChange < 0 ? "bg-red-50 border-red-100" : "bg-slate-50 border-slate-100"}`}>
              <div className={`h-10 w-10 rounded-xl flex items-center justify-center shrink-0 ${rankChange > 0 ? "bg-emerald-500" : rankChange < 0 ? "bg-red-400" : "bg-slate-400"}`}>
                {rankChange > 0 ? <ArrowUpRight className="h-5 w-5 text-white" />
                  : rankChange < 0 ? <ArrowDownRight className="h-5 w-5 text-white" />
                    : <span className="text-white text-xs font-bold">=</span>}
              </div>
              <div>
                <p className={`text-sm font-bold ${rankChange > 0 ? "text-emerald-700" : rankChange < 0 ? "text-red-600" : "text-slate-600"}`}>
                  อันดับ {first.rank}/{first.totalStudents} → {last.rank}/{last.totalStudents}
                  {rankChange > 0 && ` (ดีขึ้น ${rankChange} อันดับ)`}
                  {rankChange < 0 && ` (ลดลง ${Math.abs(rankChange)} อันดับ)`}
                  {rankChange === 0 && ` (อันดับเท่าเดิม)`}
                </p>
                <p className="text-xs text-slate-500 mt-0.5">
                  เทียบจาก {first.label} ถึง {last.label} — ใช้อันดับเพราะข้อสอบแต่ละรอบยากง่ายไม่เท่ากัน คะแนนดิบเทียบตรงๆ ไม่ยุติธรรม
                </p>
              </div>
            </div>
          )}

          {/* หัวข้ออ่อนซ้ำ / พัฒนาเร็วที่สุด — ตัดออกชั่วคราว (topicPcts ยังเป็น null) */}
          <div className="flex gap-2 bg-blue-50 border border-blue-100 rounded-xl p-3 mb-5">
            <Info className="h-4 w-4 text-blue-500 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-blue-700">หัวข้ออ่อนซ้ำ / หัวข้อที่พัฒนาเร็วที่สุด จะกลับมาแสดงเมื่อเชื่อมข้อมูลจริงเสร็จ (ต้องเพิ่ม backend endpoint สำหรับคะแนนรายหัวข้อ)</p>
          </div>

          <SectionCard title="คะแนนรวม % ข้ามรอบ" icon={TrendingUp} className="mb-5">
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={lineData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="label" tick={{ fontSize: 11, fill: "#475569" }} tickLine={false} axisLine={false} />
                <YAxis domain={[0, 100]} tickFormatter={v => `${v}%`} tick={{ fontSize: 10, fill: "#94a3b8" }} tickLine={false} axisLine={false} />
                <Tooltip formatter={v => (v == null ? "ไม่มีข้อมูล" : `${v}%`)} content={<ChartTooltip />} />
                <Line type="monotone" dataKey="pct" stroke="#f97316" strokeWidth={2.5} dot={{ fill: "#f97316", r: 5 }} activeDot={{ r: 7 }} connectNulls={false} name="คะแนนรวม" />
              </LineChart>
            </ResponsiveContainer>
          </SectionCard>

          {/* เวลาเฉลี่ยต่อข้อ — ใช้ต่อได้เลย เพราะคำนวณจาก secondsUsed/totalQuestions ที่มาจาก backend จริง */}
          <SectionCard title="เวลาเฉลี่ยต่อข้อ เทียบข้ามรอบ" icon={Clock}>
            <div className="grid gap-3" style={{ gridTemplateColumns: `repeat(${submittedExams.length}, 1fr)` }}>
              {submittedExams.map((e, i) => {
                const prev = submittedExams[i - 1];
                const timeDelta = (prev && e.avgTimePerQuestion != null && prev.avgTimePerQuestion != null) ? e.avgTimePerQuestion - prev.avgTimePerQuestion : null;
                const pctDelta = prev ? e.pct - prev.pct : null;
                const genuineImprovement = timeDelta != null && timeDelta < 0 && pctDelta != null && pctDelta >= 0;
                const guessingWarning = timeDelta != null && timeDelta < 0 && pctDelta != null && pctDelta < 0;
                return (
                  <div key={e.label} className="bg-slate-50 rounded-xl p-3 text-center">
                    <p className="text-[11px] font-semibold text-slate-500 mb-1">{e.label}</p>
                    {e.avgTimePerQuestion != null ? (
                      <>
                        <p className="text-lg font-black text-slate-800">{Math.round(e.avgTimePerQuestion)} วิ</p>
                        <p className="text-[10px] text-slate-400">ต่อข้อ (เฉลี่ย)</p>
                      </>
                    ) : <p className="text-xs text-slate-300 italic mt-2">ไม่มีข้อมูล</p>}
                    {timeDelta != null && (
                      <p className={`text-[10px] mt-1.5 font-semibold ${timeDelta < 0 ? "text-blue-600" : timeDelta > 0 ? "text-amber-600" : "text-slate-400"}`}>
                        {timeDelta < 0 ? "▼" : timeDelta > 0 ? "▲" : "="} {Math.abs(Math.round(timeDelta))} วิ จากรอบก่อน
                      </p>
                    )}
                    {genuineImprovement && <p className="text-[10px] text-emerald-600 font-semibold mt-1">⚡ เร็วขึ้น + แม่นขึ้น</p>}
                    {guessingWarning && <p className="text-[10px] text-red-500 font-semibold mt-1">⚠️ เร็วขึ้นแต่แม่นน้อยลง</p>}
                  </div>
                );
              })}
            </div>
            <p className="text-[11px] text-slate-400 mt-3">ถ้าเวลาลดลงแต่คะแนนเท่าเดิมหรือดีขึ้น แปลว่าเข้าใจแม่นขึ้นจริง ไม่ใช่แค่เดาถูก</p>
          </SectionCard>
        </>
      )}
    </Modal>
  );
}

// ─── Tab 4: เปรียบเทียบ (ข้อมูลจริงจาก fetchExamResults) ────────────────────

function ComparisonTab({ examResults }) {
  const validResults = examResults.filter(r => r && r.submittedCount > 0);

  if (validResults.length < 2) {
    return (
      <div className="flex flex-col items-center text-center gap-3 bg-slate-50 border border-dashed border-slate-200 rounded-2xl p-10">
        <TrendingUp className="h-10 w-10 text-slate-300" />
        <p className="text-sm font-semibold text-slate-600">ยังมีข้อมูลไม่พอเปรียบเทียบ</p>
        <p className="text-xs text-slate-400 max-w-sm">ต้องมีอย่างน้อย 2 รอบสอบที่มีคนส่งข้อสอบแล้ว ถึงจะเทียบพัฒนาการได้</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {EXAMS_META.map((e, i) => {
          const r = examResults[i];
          const passCount = r?.students?.filter(s => s.submittedAt && s.maxScore && (s.totalScore / s.maxScore) * 100 >= PASS_PCT).length || 0;
          const passEligible = r?.students?.filter(s => s.submittedAt && s.maxScore).length || 0;
          return (
            <div key={e.id} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${e.badge}`}>{e.label}</span>
              {r ? (
                <>
                  <p className="text-3xl font-black text-slate-900 mt-2">{r.averageScorePct}%</p>
                  <p className="text-xs text-slate-500 mt-0.5">คะแนนเฉลี่ย · {r.submittedCount} คนส่งแล้ว</p>
                  <div className="mt-2 flex items-center gap-1.5 text-xs text-slate-500">
                    <span className="font-semibold text-emerald-600">{passEligible ? Math.round((passCount / passEligible) * 100) : 0}%</span> อัตราผ่าน
                  </div>
                </>
              ) : <p className="text-sm text-slate-300 italic mt-2">ยังไม่มีข้อมูล</p>}
            </div>
          );
        })}
      </div>

      {/* กราฟ "พัฒนาการรายหัวข้อ" เอาออกชั่วคราว — รอ backend endpoint ใหม่ */}
      <div className="flex gap-2 bg-blue-50 border border-blue-100 rounded-xl p-3">
        <Info className="h-4 w-4 text-blue-500 flex-shrink-0 mt-0.5" />
        <p className="text-xs text-blue-700">กราฟพัฒนาการรายหัวข้อ (Pre → Mid → Post) จะกลับมาแสดงเมื่อเชื่อมข้อมูลจริงเสร็จ (ต้องเพิ่ม backend endpoint สำหรับคะแนนรายหัวข้อ)</p>
      </div>
    </div>
  );
}

// ─── Export (mock — ยังไม่ต่อข้อมูลจริง จนกว่าจะมี item-level endpoint) ──────

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
  { id: "compare", label: "เปรียบเทียบ", icon: TrendingUp },
  { id: "progress", label: "รายคน", icon: Users },
];

export default function TutorExamAnalytics() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const courseId = searchParams.get("courseId");
  const subjectId = searchParams.get("subjectId");
  const courseName = searchParams.get("courseName") || "";
  const subjectName = searchParams.get("subjectName") || "";

  const TYPE_TO_ID = { "pre-test": 0, "mid-test": 1, "post-test": 2 };
  const initialExamId = TYPE_TO_ID[searchParams.get("examType")] ?? 1;
  const requestedTab = searchParams.get("tab") ?? "overview";
  const initialTab = (requestedTab === "items" || requestedTab === "students") ? "overview" : requestedTab;

  const [activeTab, setActiveTab] = useState(initialTab);
  const [examId, setExamId] = useState(initialExamId);

  // ── Step 1: รายชื่อ exam จริงจาก backend ─────────────────────────────────
  const adminId = JSON.parse(localStorage.getItem("user") || "null")?.id;

  const [examList, setExamList] = useState([]); // [{id, type, ...}] จาก backend จริง
  const [loadingExams, setLoadingExams] = useState(true);

  useEffect(() => {
    if (!courseId || !subjectId || !adminId) {
      setLoadingExams(false);
      return;
    }
    fetchExams({ courseId, subjectId, adminId })
      .then((data) => setExamList(data))
      .catch((err) => console.error("Fetch exam list failed:", err))
      .finally(() => setLoadingExams(false));
  }, [courseId, subjectId, adminId]);

  // จับคู่ EXAMS_META (pre/mid/post) กับ examId จริงจาก backend ตามลำดับ type
  const realExamId = (id) => examList.find((e) => e.type === ["pre-test", "mid-test", "post-test"][id])?.id ?? null;

  // ── Step 2: ผลสอบจริงต่อรอบ ──────────────────────────────────────────────
  const [examResults, setExamResults] = useState([null, null, null]); // ผลจริงของ pre/mid/post

  useEffect(() => {
    if (loadingExams || examList.length === 0) return;
    Promise.all(
      [0, 1, 2].map((i) => {
        const id = realExamId(i);
        if (!id) return Promise.resolve(null);
        return fetchExamResults(id).catch((err) => {
          console.error(`Fetch results for exam ${id} failed:`, err);
          return null;
        });
      })
    ).then(setExamResults);
  }, [loadingExams, examList]);

  // mock — ยังใช้กับ Export Excel เท่านั้น จนกว่าจะมี item-level endpoint จริง
  const data = ALL_DATA[examId];
  const examLabel = EXAMS_META[examId].label;

  return (
    <div className="space-y-6 mt-[90px]">
      {/* ปุ่มย้อนกลับ — กลับไปหน้าที่ผู้ใช้กดเข้ามาจริงๆ ผ่าน browser history */}
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-orange-600 transition font-medium"
      >
        <ChevronLeft className="h-4 w-4" /> ย้อนกลับ
      </button>

      {/* Breadcrumb */}
      <div className="flex items-center gap-1.5 text-sm text-slate-400">
        <Link to="/tutor/courses" className="hover:text-orange-600 transition font-medium">คอร์ส</Link>
        <ChevronRight className="h-4 w-4" />
        <Link
          to={`/tutor/exam?${new URLSearchParams({ courseId, subjectId, courseName, subjectName }).toString()}`}
          className="hover:text-orange-600 transition font-medium"
        >
          {subjectName || "จัดการการสอบ"}
        </Link>
        <ChevronRight className="h-4 w-4" />
        <span className="font-semibold text-slate-700">ภาพรวมพัฒนาการนักเรียน</span>
      </div>

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">ภาพรวมพัฒนาการนักเรียน</h1>
          <p className="text-sm text-slate-500 mt-1">
            คณิตศาสตร์ ม.3 เทอม 1/2567 · นักเรียนส่งแล้ว {examResults[examId]?.submittedCount ?? 0} คน · {QUESTIONS.length} ข้อ · {MAX_SCORE} คะแนน
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {activeTab === "overview" && (
            <>
              <div className="flex rounded-xl overflow-hidden border border-slate-200">
                {EXAMS_META.map(e => (
                  <button key={e.id} onClick={() => setExamId(e.id)}
                    className={`px-3 py-2 text-xs font-bold transition ${examId === e.id ? "bg-orange-500 text-white" : "bg-white text-slate-600 hover:bg-slate-50"}`}>
                    {e.label}
                  </button>
                ))}
              </div>
              <button onClick={() => exportToExcel(data, examLabel)}
                className="flex items-center gap-2 border border-emerald-200 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-xl px-4 py-2 text-sm font-bold transition">
                <Download className="h-4 w-4" /> Export Excel
              </button>
            </>
          )}
        </div>
      </div>

      {/* Tab Nav */}
      <div className="flex gap-2 flex-wrap">
        {TABS.map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition
                ${isActive ? "bg-orange-500 text-white shadow-sm" : "border border-slate-200 text-slate-600 hover:bg-slate-50"}`}>
              <Icon className="h-4 w-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Content */}
      {activeTab === "overview" && <OverviewTab results={examResults[examId]} />}
      {activeTab === "compare" && <ComparisonTab examResults={examResults} />}
      {activeTab === "progress" && <StudentProgressTab examResults={examResults} />}
    </div>
  );
}