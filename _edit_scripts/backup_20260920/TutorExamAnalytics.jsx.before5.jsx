import { useState, useMemo, useEffect } from "react";
import { useSearchParams, Link } from "react-router-dom";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, LineChart, Line, Legend, Cell, ReferenceLine,
} from "recharts";
import {
  BarChart2, Users, TrendingUp, Download, AlertTriangle,
  CheckCircle, Search, Award, Clock, BookOpen, Info,
  X, Eye, ChevronRight, ArrowUpRight, ArrowDownRight, ChevronDown, Sparkles,
} from "lucide-react";
import * as XLSX from "xlsx";
import { fmtScore } from "../utils/examScore";
import { tutorExamAnalyticsApi, fetchAiSummaries, updateAiSummary, analyzeExamWithAi } from "../utils/examShared";
// เนื้อหาบทวิเคราะห์ AI แบบละเอียด (รายหมวด/จุดที่เข้าใจผิด/ข้อความถึงผู้ปกครอง) ใช้ตัวเดียวกับ
// ที่หน้ารายละเอียดรอบสอบใช้ ไม่ได้เขียนซ้ำ — เดิมหน้านี้เคยมีแท็บ "ผล AI" แยก (ใช้ AiSummaryPanel
// ซึ่งเป็นแผง accordion ทั้งห้อง) แต่ตัดออกแล้วเพราะซ้ำซ้อนกับแท็บ "รายคน" ที่มีอยู่แล้ว —
// ย้ายไปแสดงใน StudentProgressModal ด้านล่างแทน (ดูคอมเมนต์ตรงนั้น) AiSummaryPanel เลยถูกลบทิ้ง
import { AiSummaryDetail } from "./TutorExamDetail.jsx";

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

// คำนวณคะแนนเฉลี่ยรายหัวข้อจากข้อมูลจริง (topic-breakdown) — ไม่ใช้ TOPICS ที่ hardcode
// เพราะ category เป็น free text ที่ติวเตอร์พิมพ์เอง ต้องดึงชื่อหมวดจาก data จริงเท่านั้น
const computeTopicStatsReal = (topicBreakdown) => {
  if (!topicBreakdown || topicBreakdown.length === 0) return [];
  const catSet = new Set();
  topicBreakdown.forEach((u) => u.topics.forEach((t) => catSet.add(t.category)));
  return Array.from(catSet).map((cat) => {
    const rows = topicBreakdown.map((u) => u.topics.find((t) => t.category === cat)).filter(Boolean);
    const avgPct = rows.length ? avg(rows.map((r) => r.pct)) : 0;
    return { topic: cat, avgPct, color: TOPIC_COLORS[cat] || "#94a3b8" };
  });
};

const buildHistogram = (data) => {
  const bins = Array.from({ length: 10 }, (_, i) => ({ range: `${i * 10}–${(i + 1) * 10}%`, count: 0 }));
  data.forEach(s => { bins[Math.min(9, Math.floor(s.pct * 10))].count++; });
  return bins;
};

function topicPctsForUser(topicBreakdown, userId) {
  if (!topicBreakdown) return null;
  const entry = topicBreakdown.find((u) => u.userId === userId);
  if (!entry) return null;
  return entry.topics.reduce((acc, t) => { acc[t.category] = t.pct; return acc; }, {});
}

// ─── ข้อมูลจริงข้ามรอบสอบ (แทนที่ getStudentCrossExamData เดิมทั้งฟังก์ชัน) ──
// รวมคนคนเดียวกันข้าม 3 รอบด้วย userId จริงจาก backend (ไม่ใช่ index มั่วแบบ mock)
// topicPcts ยังเป็น null เสมอ — รอ backend endpoint สรุปคะแนนรายหัวข้อทั้งห้อง

function buildRealCrossExamData(examResults, topicResults) {
  const userMap = new Map(); // userId -> { userId, name, exams: [null,null,null] }

  examResults.forEach((r, examId) => {
    if (!r) return;
    // อันดับต้องเรียงเหมือนกันทุกที่ในระบบ: คะแนน% มาก→น้อย เท่ากันใช้ชื่อไทย (ก-ฮ) ตัดสิน
    // (เดิมไม่มี tie-break ตรงนี้ ทำให้คนคะแนนเท่ากันได้อันดับสลับกันไปมาแล้วแต่ลำดับที่ backend ส่งมา)
    const sorted = [...r.students].filter(s => s.submittedAt && s.maxScore)
      .sort((a, b) => {
        const pa = a.totalScore / a.maxScore;
        const pb = b.totalScore / b.maxScore;
        if (pb !== pa) return pb - pa;
        return (a.name || "").localeCompare(b.name || "", "th");
      });
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
          topicPcts: topicPctsForUser(topicResults[examId], s.userId),
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

// รวมคะแนนเฉลี่ยรายหัวข้อของทั้งห้อง ข้าม 3 รอบสอบ — ใช้ทั้งในแท็บ "เปรียบเทียบ" และปุ่ม Export PDF
// ที่ย้ายไปอยู่แถวเดียวกับแท็บ (แยกเป็นฟังก์ชันกลางกันลอจิกซ้ำกัน 2 ที่)
function buildTopicTrendData(topicResults) {
  const catSet = new Set();
  topicResults.forEach((r) => (r || []).forEach((u) => u.topics.forEach((t) => catSet.add(t.category))));
  return Array.from(catSet).map((cat) => {
    const row = { topic: cat };
    EXAMS_META.forEach((meta, i) => {
      const r = topicResults[i];
      if (!r) { row[meta.label] = null; return; }
      const rows = r.map((u) => u.topics.find((t) => t.category === cat)).filter(Boolean);
      row[meta.label] = rows.length ? parseFloat((avg(rows.map((x) => x.pct)) * 100).toFixed(1)) : null;
    });
    return row;
  });
}

// สรุปแถวข้อมูลต่อนักเรียนสำหรับแท็บ "รายคน" — ใช้ทั้งในตารางของแท็บเองและปุ่ม Export PDF
// ที่ย้ายไปอยู่แถวเดียวกับแท็บ (แยกเป็นฟังก์ชันกลางกันลอจิกซ้ำกัน 2 ที่)
function buildProgressRows(crossExamData) {
  return crossExamData.map((d) => {
    const submittedList = d.exams.filter(e => e.submitted);
    const latest = submittedList[submittedList.length - 1] ?? null;
    const first = submittedList[0] ?? null;
    // ใช้คะแนนดิบ (%) เทียบ ไม่ใช่อันดับ/เปอร์เซ็นไทล์ — ที่นี่วัดว่านักเรียนเก่งขึ้นจากตัวเองไหม
    // ไม่ได้วัดว่าเก่งกว่าเพื่อนไหม (เคยลองใช้เปอร์เซ็นไทล์เทียบเพื่อนร่วมห้องแล้ว แต่ไม่ตรงกับ
    // เป้าหมายตรงนี้ จึงย้อนกลับมาใช้คะแนนดิบเหมือนเดิม)
    const scoreChange = (first && latest && first !== latest)
      ? Math.round((latest.pct - first.pct) * 1000) / 10
      : null;
    return {
      studentId: d.studentId, name: d.name,
      submittedCount: submittedList.length, totalExams: d.exams.length,
      latestPct: latest?.pct ?? null,
      latestRank: latest?.rank ?? null,
      totalStudents: latest?.totalStudents ?? null,
      scoreChange,
    };
  });
}


// สรุปว่านักเรียนกี่คนดีขึ้น/แย่ลง/เท่าเดิม เทียบ Pre-test (index 0) กับ Post-test (index 2)
// ใช้เฉพาะคนที่สอบครบทั้ง 2 รอบนี้เท่านั้น — คนที่ขาดสอบรอบใดรอบหนึ่งไม่เทียบได้ จึงไม่นับ
function computeImprovementSummary(crossExamData) {
  const comparable = crossExamData.filter((d) => d.exams[0]?.submitted && d.exams[2]?.submitted);
  let improved = 0, declined = 0, same = 0;
  comparable.forEach((d) => {
    // ใช้คะแนนดิบ (%) เทียบตรงๆ — ที่นี่วัดว่านักเรียนเก่งขึ้นจากตัวเองไหม ไม่ได้วัดว่าเก่งกว่า
    // เพื่อนไหม (เคยลองเปลี่ยนไปใช้อันดับ/เปอร์เซ็นไทล์เทียบเพื่อนร่วมห้องแล้ว แต่ไม่ตรงกับ
    // เป้าหมายของที่นี่ จึงย้อนกลับมาใช้คะแนนดิบเหมือนเดิม)
    const prePct = Math.round(d.exams[0].pct * 1000) / 10;
    const postPct = Math.round(d.exams[2].pct * 1000) / 10;
    if (postPct > prePct) improved++;
    else if (postPct < prePct) declined++;
    else same++;
  });
  const total = comparable.length;
  return {
    total,
    improved, declined, same,
    improvedPct: total ? Math.round((improved / total) * 100) : 0,
    declinedPct: total ? Math.round((declined / total) * 100) : 0,
    samePct: total ? Math.round((same / total) * 100) : 0,
  };
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

function StatCard({ icon, label, value, sub, color = "bg-orange-500", tooltip }) {
  const Icon = icon;
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
              <div className="absolute bottom-full right-0 mb-2 w-60 max-w-[80vw] bg-white border border-slate-200 rounded-xl p-3 text-xs text-slate-600 leading-relaxed shadow-lg hidden group-hover:block z-10">
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

function SectionCard({ title, icon: Icon, children, action, tooltip, className = "" }) {
  return (
    <div className={`bg-white rounded-2xl border border-slate-100 shadow-sm p-5 ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
          {Icon && <Icon className="h-4 w-4 text-orange-500" />}
          {title}
          {tooltip && (
            <div className="relative group">
              <span className="h-4 w-4 rounded-full border border-slate-300 flex items-center justify-center text-[10px] font-normal text-slate-400 cursor-default shrink-0">
                ?
              </span>
              <div className="absolute top-full left-0 mt-2 w-64 bg-white border border-slate-200 rounded-xl p-3 text-xs font-normal text-slate-600 leading-relaxed shadow-lg hidden group-hover:block z-10">
                {tooltip}
              </div>
            </div>
          )}
        </h3>
        {action}
      </div>
      {children}
    </div>
  );
}

// formatValue เป็น optional — ใส่มาก็ใช้ตรงๆ (เช่นกราฟจำนวนคน ไม่อยากให้เดาว่าเป็น %)
// ถ้าไม่ใส่ ใช้ heuristic เดิม (ค่า < 1.5 = สัดส่วน 0–1 ต้องแปลงเป็น %) ไว้เหมือนที่อื่นที่ยังใช้อยู่
const ChartTooltip = ({ active, payload, label, formatValue }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-slate-200 rounded-xl shadow-lg px-3 py-2 text-xs">
      <p className="font-semibold text-slate-700 mb-1">{label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color }}>{p.name}: <strong>{formatValue ? formatValue(p.value) : (typeof p.value === "number" && p.value < 1.5 ? fmtPct(p.value) : p.value)}</strong></p>
      ))}
    </div>
  );
};

// (ลบโค้ดที่ไม่ได้ใช้ออก) StudentTab/StudentModal เป็น mock เก่าที่ไม่มีจุดไหนเรียกใช้แล้ว

// ─── Tab: รายคน (cross-exam) — ข้อมูลจริงจาก fetchExamResults ────────────────

function StudentProgressTab({ examResults, topicResults, aiSummaries, loading, courseName, subjectName }) {
  // ── Hooks ทั้งหมด (useState + useMemo) ต้องอยู่บนสุด ก่อน early return ทุกอัน ──
  // เดิม sortKey/sortDir (useState) และ useMemo อีก 2 ตัวถูกประกาศ "หลัง" `if (loading) return`
  // ทำให้ตอน loading=true เรียกแค่ 2 hooks (search, selected) แต่พอ loading=false เรียก 8 hooks
  // จำนวน hook ไม่เท่ากันข้าม render เดียวกัน → React แครช จึงย้ายทุก hook มาไว้บนสุด
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState(null);
  const [sortKey, setSortKey] = useState("scoreChange");
  const [sortDir, setSortDir] = useState(-1); // เริ่มด้วย "ดีขึ้นมากสุดก่อน"

  const crossExamData = useMemo(() => buildRealCrossExamData(examResults, topicResults), [examResults, topicResults]);

  const students = useMemo(() => buildProgressRows(crossExamData), [crossExamData]);

  const filteredBase = useMemo(() => students.filter(s => s.name.includes(search)), [students, search]);

  const filtered = useMemo(() => {
    const arr = [...filteredBase];
    return arr.sort((a, b) => {
      let res;
      if (sortKey === "name") res = a.name.localeCompare(b.name, "th");
      else res = (a[sortKey] ?? -Infinity) - (b[sortKey] ?? -Infinity);
      if (res !== 0) return sortDir * res;
      return a.name.localeCompare(b.name, "th");
    });
  }, [filteredBase, sortKey, sortDir]);

  const handleSort = (key) => {
    if (sortKey === key) setSortDir((d) => d * -1);
    else { setSortKey(key); setSortDir(-1); }
  };
  const SortIcon = ({ k }) => sortKey === k ? <span className="ml-0.5 text-orange-500">{sortDir === -1 ? "▼" : "▲"}</span> : null;

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-14 bg-slate-100 rounded-xl" />
        <div className="h-72 bg-slate-100 rounded-2xl" />
      </div>
    );
  }

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
        <p className="text-xs text-slate-400 mt-2 pl-1">แสดง {filtered.length} จาก {students.length} คน · "แนวโน้ม" เทียบจากคะแนนรวม (%) ของรอบแรกที่สอบกับรอบล่าสุดที่สอบ ("จุด" = จุดเปอร์เซ็นต์ที่เปลี่ยนไป)</p>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                {[["name", "ชื่อ"], [null, "สอบครบ"], ["latestPct", "คะแนน/อันดับล่าสุด"], ["scoreChange", "แนวโน้ม"], [null, ""]].map(([k, label]) => (
                  <th key={label} onClick={k ? () => handleSort(k) : undefined}
                    className={`text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide ${k ? "cursor-pointer hover:text-slate-700 select-none" : ""}`}>
                    {label}{k && <SortIcon k={k} />}
                  </th>
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
                    {s.scoreChange == null ? (
                      <span className="text-xs text-slate-300">ยังเทียบไม่ได้</span>
                    ) : s.scoreChange > 0 ? (
                      <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600"><ArrowUpRight className="h-3.5 w-3.5" /> พัฒนาขึ้น {s.scoreChange}%</span>
                    ) : s.scoreChange < 0 ? (
                      <span className="inline-flex items-center gap-1 text-xs font-semibold text-red-500"><ArrowDownRight className="h-3.5 w-3.5" /> ลดลง {Math.abs(s.scoreChange)}%</span>
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

      {selected != null && <StudentProgressModal studentId={selected} crossExamData={crossExamData} aiSummaries={aiSummaries} courseName={courseName} subjectName={subjectName} onClose={() => setSelected(null)} />}
    </div>
  );
}

function StudentProgressModal({ studentId, crossExamData, aiSummaries, courseName, subjectName, onClose }) {
  // hook ต้องอยู่บนสุดก่อน early return เสมอ (Rules of Hooks — ดูคอมเมนต์เดียวกันที่
  // OverviewTab/StudentProgressTab ด้านบนที่เคยแก้บั๊กนี้มาแล้ว) เผื่ออนาคตมี early
  // return เพิ่มจนทำให้จำนวน hook ไม่เท่ากันข้าม render
  const [aiDetailOpen, setAiDetailOpen] = useState(false);
  const [aiDraft, setAiDraft] = useState(null); // ข้อความถึงผู้ปกครองที่แก้ค้างไว้ก่อนบันทึก (เฉพาะโมดัลนี้)
  const [aiSavedMessage, setAiSavedMessage] = useState(null); // ค่าที่บันทึกสำเร็จล่าสุดในโมดัลนี้ (เผื่อ props ยังไม่รีเฟรช)
  const [aiSaving, setAiSaving] = useState(false);

  const data = crossExamData.find(d => d.studentId === studentId);
  if (!data) return null;

  const submittedExams = data.exams.filter(e => e.submitted);
  const hasEnoughData = submittedExams.length >= 2;
  const missingExams = data.exams.filter(e => !e.submitted);

  // ผลวิเคราะห์ AI ของ "รอบล่าสุดที่นักเรียนคนนี้สอบ" — ใช้ index ตรงจาก data.exams
  // (0=pre,1=mid,2=post) แทนที่จะพึ่ง submittedExams ที่ผ่าน filter ไปแล้ว (ไม่เหลือ
  // index เดิมให้ใช้) หา index สูงสุดที่ submitted=true คือรอบล่าสุดที่สอบจริง
  const lastSubmittedIndex = [2, 1, 0].find((i) => data.exams[i]?.submitted) ?? null;
  const aiSummaryRow = lastSubmittedIndex != null
    ? (aiSummaries?.[lastSubmittedIndex] || []).find((r) => r.userId === studentId) || null
    : null;
  const aiBaselineMessage = aiSavedMessage ?? aiSummaryRow?.parentMessage ?? "";
  const aiParentMessage = aiDraft ?? aiBaselineMessage;
  const aiDirty = aiDraft != null && aiDraft !== aiBaselineMessage;

  const saveAiSummary = async () => {
    if (!aiSummaryRow) return;
    setAiSaving(true);
    try {
      await updateAiSummary(aiSummaryRow.id, { parentMessage: aiParentMessage });
      setAiSavedMessage(aiParentMessage);
      setAiDraft(null);
    } catch (err) {
      console.error("Update AI summary failed:", err);
    } finally { setAiSaving(false); }
  };

  const first = submittedExams[0];
  const last = submittedExams[submittedExams.length - 1];
  // ใช้คะแนนดิบ (%) เทียบ ไม่ใช่อันดับ/เปอร์เซ็นไทล์ — วัดว่านักเรียนคนนี้เก่งขึ้นจากตัวเองไหม
  const scoreChange = hasEnoughData ? Math.round((last.pct - first.pct) * 1000) / 10 : null; // + = ดีขึ้น

  const lineData = data.exams.map(e => ({ label: e.label, pct: e.submitted ? Math.round(e.pct * 1000) / 10 : null }));

  // รวมรายชื่อหมวดจริงจากทุกรอบที่สอบแล้ว (category เป็น free text จาก topic-breakdown)
  const allTopics = hasEnoughData
    ? Array.from(new Set(submittedExams.flatMap((e) => Object.keys(e.topicPcts || {}))))
    : [];

  // เดิมเช็คว่า "อ่อนทุกรอบที่เคยสอบมา" (ไม่เคยถึง 50% เลยสักรอบ) แต่คำว่า "จุดอ่อนตอนนี้"
  // ควรดูแค่ผลรอบล่าสุดที่สอบเท่านั้น — ถ้าเคยอ่อนตอน Pre แต่รอบหลังสุด (เช่น Post) ทำได้
  // เกิน 50% แล้ว ก็ไม่ควรถูกตราหน้าว่ายังมีจุดอ่อนอยู่ทั้งที่ปัจจุบันไม่ใช่แล้ว
  const currentWeakTopics = hasEnoughData
    ? allTopics.filter((topic) => (last.topicPcts?.[topic] ?? 1) < 0.5)
    : [];

  const mostImproved = hasEnoughData && allTopics.length
    ? allTopics
      .filter((topic) => first.topicPcts?.[topic] != null && last.topicPcts?.[topic] != null)
      .map((topic) => ({ topic, delta: last.topicPcts[topic] - first.topicPcts[topic] }))
      .reduce((best, t) => (t.delta > best.delta ? t : best), { topic: null, delta: -Infinity })
    : { topic: null, delta: -Infinity };

  const topicTrend = allTopics.map((topic) => {
    const row = { topic, label: topic };
    data.exams.forEach((e) => { row[e.label] = e.submitted && e.topicPcts?.[topic] != null ? Math.round(e.topicPcts[topic] * 1000) / 10 : null; });
    return row;
  });

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
                <p className="text-[11px] text-slate-400 mt-0.5">{fmtScore(e.totalScore)}/{fmtScore(e.maxScore)} คะแนน</p>
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

      {aiSummaryRow && (
        <div className="mb-6 bg-gradient-to-br from-orange-50 to-amber-50 border border-orange-100 rounded-xl px-4 py-3.5">
          <div className="flex items-start justify-between gap-3 flex-wrap">
            <div className="min-w-0 flex-1">
              <p className="text-xs font-bold text-orange-700 flex items-center gap-1.5 mb-1">
                <Sparkles className="h-3.5 w-3.5" /> สรุปโดย AI · {data.exams[lastSubmittedIndex].label}
              </p>
              <p className="text-sm text-slate-700 leading-relaxed">{aiSummaryRow.overview}</p>
              {(aiSummaryRow.byCategory?.some((c) => c.trend) || aiSummaryRow.misconceptions?.length > 0) && (
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {aiSummaryRow.byCategory?.filter((c) => c.trend).map((c, i) => (
                    <span key={i} className="text-[11px] font-medium bg-white border border-orange-200 text-orange-700 rounded-full px-2 py-0.5">
                      {c.topic} · {c.trend}
                    </span>
                  ))}
                  {aiSummaryRow.misconceptions?.length > 0 && (
                    <span className="text-[11px] font-medium bg-amber-100 border border-amber-200 text-amber-800 rounded-full px-2 py-0.5">
                      จุดที่ควรระวัง {aiSummaryRow.misconceptions.length} เรื่อง
                    </span>
                  )}
                </div>
              )}
            </div>
            {aiSummaryRow.model && <span className="text-[10px] text-slate-400 flex-shrink-0">โดย {aiSummaryRow.model}</span>}
          </div>
          <div className="mt-3 flex items-center gap-3 flex-wrap">
            <button
              onClick={() => setAiDetailOpen((v) => !v)}
              className="flex items-center gap-1 text-xs font-semibold text-orange-600 hover:text-orange-700"
            >
              <ChevronRight className={`h-3.5 w-3.5 transition ${aiDetailOpen ? "rotate-90" : ""}`} />
              {aiDetailOpen ? "ซ่อนบทวิเคราะห์แบบละเอียด" : "ดูบทวิเคราะห์แบบละเอียด"}
            </button>
            {/* (Phase 3) ส่งออกรายงานคนนี้เป็น PDF เดี่ยว — ใช้ฟังก์ชันกลางร่วมกับปุ่ม
                "ส่งออกทั้งห้อง" ในแท็บ "ภาพรวม" (ดู buildStudentReportPageHtml ด้านล่าง) */}
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
              className="flex items-center gap-1 text-xs font-semibold text-orange-600 bg-orange-50 hover:bg-orange-100 border border-orange-100 rounded-lg px-2.5 py-1 transition"
            >
              <Download className="h-3.5 w-3.5" /> ส่งออกรายงาน PDF
            </button>
          </div>
          {aiDetailOpen && (
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
          )}
        </div>
      )}

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
          {scoreChange != null && (
            <div className={`flex items-center gap-3 rounded-2xl p-4 mb-5 border ${scoreChange > 0 ? "bg-emerald-50 border-emerald-100" : scoreChange < 0 ? "bg-red-50 border-red-100" : "bg-slate-50 border-slate-100"}`}>
              <div className={`h-10 w-10 rounded-xl flex items-center justify-center shrink-0 ${scoreChange > 0 ? "bg-emerald-500" : scoreChange < 0 ? "bg-red-400" : "bg-slate-400"}`}>
                {scoreChange > 0 ? <ArrowUpRight className="h-5 w-5 text-white" />
                  : scoreChange < 0 ? <ArrowDownRight className="h-5 w-5 text-white" />
                    : <span className="text-white text-xs font-bold">=</span>}
              </div>
              <div>
                <p className={`text-sm font-bold ${scoreChange > 0 ? "text-emerald-700" : scoreChange < 0 ? "text-red-600" : "text-slate-600"}`}>
                  คะแนนรวม {fmtPct(first.pct)} → {fmtPct(last.pct)}
                  {scoreChange > 0 && ` (พัฒนาขึ้น ${scoreChange}%)`}
                  {scoreChange < 0 && ` (ลดลง ${Math.abs(scoreChange)}%)`}
                  {scoreChange === 0 && ` (เท่าเดิม)`}
                </p>
                <p className="text-xs text-slate-500 mt-0.5">
                  เทียบจาก {first.label} ถึง {last.label}
                </p>
              </div>
            </div>
          )}

          {allTopics.length === 0 ? (
            <div className="flex gap-2 bg-blue-50 border border-blue-100 rounded-xl p-3 mb-5">
              <Info className="h-4 w-4 text-blue-500 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-blue-700">ยังไม่มีข้อมูลรายหัวข้อของนักเรียนคนนี้ — ต้องตั้งค่า Category ในข้อสอบก่อน</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-5">
              <div className={`rounded-2xl p-4 border ${currentWeakTopics.length > 0 ? "bg-red-50 border-red-100" : "bg-emerald-50 border-emerald-100"}`}>
                <p className={`text-xs font-bold flex items-center gap-1.5 mb-2 ${currentWeakTopics.length > 0 ? "text-red-700" : "text-emerald-700"}`}>
                  {currentWeakTopics.length > 0 ? <AlertTriangle className="h-3.5 w-3.5" /> : <CheckCircle className="h-3.5 w-3.5" />}
                  {currentWeakTopics.length > 0 ? "มีจุดอ่อนที่ยังค้างอยู่ — ควรแทรกแซงเป็นพิเศษ" : "ไม่มีจุดอ่อนที่ยังค้างอยู่ตอนนี้"}
                </p>
                {currentWeakTopics.length > 0 ? (
                  <>
                    <div className="flex flex-wrap gap-1.5">
                      {currentWeakTopics.map(t => (
                        <span key={t} className="text-[11px] font-semibold px-2 py-1 rounded-lg" style={{ backgroundColor: TOPIC_LIGHT[t] || "#f1f5f9", color: TOPIC_COLORS[t] || "#475569" }}>{t}</span>
                      ))}
                    </div>
                    <p className="text-[11px] text-red-500 mt-2">(เกณฑ์: หัวข้อนี้ในรอบล่าสุดที่สอบ ({last.label}) ยังทำได้ต่ำกว่า 50%)</p>
                  </>
                ) : (
                  <p className="text-[11px] text-emerald-600">(เกณฑ์: ทุกหัวข้อในรอบล่าสุดที่สอบ ({last.label}) ทำได้ตั้งแต่ 50% ขึ้นไป)</p>
                )}
              </div>

              <div className={`rounded-2xl p-4 border ${mostImproved.topic && mostImproved.delta > 0 ? "bg-blue-50 border-blue-100" : "bg-slate-50 border-slate-100"}`}>
                <p className={`text-xs font-bold flex items-center gap-1.5 mb-2 ${mostImproved.topic && mostImproved.delta > 0 ? "text-blue-700" : "text-slate-500"}`}>
                  <TrendingUp className="h-3.5 w-3.5" /> พัฒนาเร็วที่สุด
                </p>
                {mostImproved.topic && mostImproved.delta > 0 ? (
                  <>
                    <p className="text-sm font-bold" style={{ color: TOPIC_COLORS[mostImproved.topic] || "#475569" }}>{mostImproved.topic}</p>
                    <p className="text-[11px] text-blue-600 mt-1">+{(mostImproved.delta * 100).toFixed(1)}% จาก {first.label} → {last.label}</p>
                  </>
                ) : (
                  <p className="text-[11px] text-slate-400">ยังไม่มีหัวข้อที่ดีขึ้นชัดเจนในช่วงนี้</p>
                )}
              </div>
            </div>
          )}

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


          {allTopics.length > 0 && (
            <SectionCard title="พัฒนาการรายหัวข้อ" icon={BookOpen} className="mb-5">
              <div className="space-y-3">
                {topicTrend.map(row => (
                  <div key={row.topic} className="flex items-center gap-3">
                    <p className="text-xs text-slate-500 w-28 flex-shrink-0 truncate">{row.label}</p>
                    <div className="flex-1 flex items-center gap-2">
                      {data.exams.map(e => {
                        const v = row[e.label];
                        return (
                          <div key={e.label} className="flex-1">
                            <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                              {v != null && <div className="h-full rounded-full" style={{ width: `${v}%`, backgroundColor: TOPIC_COLORS[row.topic] || "#94a3b8" }} />}
                            </div>
                            <p className="text-[10px] text-slate-400 mt-0.5 text-center">{v != null ? `${v}%` : "—"}</p>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex justify-center gap-4 mt-3">
                {data.exams.map(e => <span key={e.label} className="text-[10px] text-slate-400">{e.label}</span>)}
              </div>
            </SectionCard>
          )}

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
function ComparisonTab({ examResults, topicResults, loading }) {
  // ── Hooks ก่อน early return ทั้งหมด (เหตุผลเดียวกับ OverviewTab ด้านบน) ──
  const validResults = examResults.filter(r => r && r.submittedCount > 0);

  const crossExamData = useMemo(() => buildRealCrossExamData(examResults, topicResults), [examResults, topicResults]);
  const summary = useMemo(() => computeImprovementSummary(crossExamData), [crossExamData]);

  // รวมรายชื่อหมวดจากทั้ง 3 รอบ (category เป็น free text ตามที่ติวเตอร์ตั้ง อาจไม่เหมือนกันทุกรอบ)
  const topicTrendData = useMemo(() => buildTopicTrendData(topicResults), [topicResults]);

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1, 2, 3].map(i => <div key={i} className="h-32 bg-slate-100 rounded-2xl" />)}
        </div>
        <div className="h-72 bg-slate-100 rounded-2xl" />
      </div>
    );
  }

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
      {summary.total === 0 ? (
        <div className="flex gap-2 bg-blue-50 border border-blue-100 rounded-xl p-3">
          <Info className="h-4 w-4 text-blue-500 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-blue-700">ยังไม่มีนักเรียนที่สอบครบทั้ง Pre-test และ Post-test — ต้องมีอย่างน้อย 1 คนที่สอบทั้ง 2 รอบ ถึงจะสรุปภาพรวมพัฒนาการได้</p>
        </div>
      ) : (
        <SectionCard title="ภาพรวมพัฒนาการทั้งห้อง (Pre → Post)" icon={TrendingUp}>
          <p className="text-xs text-slate-400 mb-4">เทียบจากนักเรียน {summary.total} คนที่สอบครบทั้ง 2 รอบ (คนที่ขาดสอบรอบใดรอบหนึ่งไม่นับรวม)</p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-5 text-center">
              <div className="h-9 w-9 rounded-xl bg-emerald-500 flex items-center justify-center mx-auto mb-2">
                <ArrowUpRight className="h-4 w-4 text-white" />
              </div>
              <p className="text-2xl font-black text-emerald-700">{summary.improved}</p>
              <p className="text-xs text-emerald-600 font-semibold mt-0.5">คน ดีขึ้น</p>
              <p className="text-[11px] text-emerald-500 mt-0.5">{summary.improvedPct}%</p>
            </div>
            <div className="bg-red-50 border border-red-100 rounded-2xl p-5 text-center">
              <div className="h-9 w-9 rounded-xl bg-red-400 flex items-center justify-center mx-auto mb-2">
                <ArrowDownRight className="h-4 w-4 text-white" />
              </div>
              <p className="text-2xl font-black text-red-600">{summary.declined}</p>
              <p className="text-xs text-red-500 font-semibold mt-0.5">คน แย่ลง</p>
              <p className="text-[11px] text-red-400 mt-0.5">{summary.declinedPct}%</p>
            </div>
            <div className="bg-slate-50 border border-slate-100 rounded-2xl p-5 text-center">
              <div className="h-9 w-9 rounded-xl bg-slate-400 flex items-center justify-center mx-auto mb-2">
                <span className="text-white text-sm font-bold">=</span>
              </div>
              <p className="text-2xl font-black text-slate-700">{summary.same}</p>
              <p className="text-xs text-slate-500 font-semibold mt-0.5">คน เท่าเดิม</p>
              <p className="text-[11px] text-slate-400 mt-0.5">{summary.samePct}%</p>
            </div>
          </div>
        </SectionCard>
      )}
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

      {topicTrendData.length === 0 ? (
        <div className="flex gap-2 bg-blue-50 border border-blue-100 rounded-xl p-3">
          <Info className="h-4 w-4 text-blue-500 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-blue-700">ยังไม่มีข้อมูลรายหัวข้อ — ต้องตั้งค่า Category ในข้อสอบก่อน</p>
        </div>
      ) : (
        <SectionCard title="พัฒนาการรายหัวข้อ (Pre → Mid → Post)" icon={TrendingUp}>
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={topicTrendData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="topic" tick={{ fontSize: 10, fill: "#475569" }} tickLine={false} axisLine={false} />
              <YAxis domain={[0, 100]} tickFormatter={v => `${v}%`} tick={{ fontSize: 10, fill: "#94a3b8" }} tickLine={false} axisLine={false} />
              <Tooltip formatter={v => (v == null ? "ไม่มีข้อมูล" : `${v}%`)} content={<ChartTooltip />} />
              <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: "11px" }} />
              <Line type="monotone" dataKey="Pre-test" stroke="#93c5fd" strokeWidth={2} dot={{ fill: "#93c5fd", r: 4 }} activeDot={{ r: 6 }} connectNulls={false} />
              <Line type="monotone" dataKey="Mid-test" stroke="#f97316" strokeWidth={2} dot={{ fill: "#f97316", r: 4 }} activeDot={{ r: 6 }} connectNulls={false} />
              <Line type="monotone" dataKey="Post-test" stroke="#22c55e" strokeWidth={2.5} dot={{ fill: "#22c55e", r: 4 }} activeDot={{ r: 6 }} connectNulls={false} />
            </LineChart>
          </ResponsiveContainer>
        </SectionCard>
      )}
    </div>
  );
}

// ─── Export (ข้อมูลจริงจาก fetchExamResults — sheet "วิเคราะห์ข้อสอบ" ตัดออก
// ชั่วคราวเพราะยังไม่มี item-level endpoint ที่สรุป P-value/D-index จากข้อมูลจริง) ──

// แยก logic การสร้างแถวข้อมูลออกจากการเขียนไฟล์ เพื่อให้เอาแถวเดียวกันไปโชว์เป็นพรีวิวก่อน export ได้
const buildExcelRows = (results) => {
  if (!results || !results.students?.length) return [];

  // (แก้บั๊ก) เดิมไม่มี tie-break ทำให้นักเรียนคะแนนเท่ากันได้ "อันดับ" ต่างจากที่โชว์ในหน้า
  // อื่น (exportToPdf/buildRealCrossExamData ที่ tie-break ด้วยชื่อภาษาไทยเหมือนกัน) จึง
  // เพิ่ม tie-break แบบเดียวกันให้ตรงกันทุกที่
  const ranked = [...results.students]
    .filter(s => s.submittedAt && s.maxScore)
    .sort((a, b) => {
      const pa = a.totalScore / a.maxScore;
      const pb = b.totalScore / b.maxScore;
      if (pb !== pa) return pb - pa;
      return (a.name || "").localeCompare(b.name || "", "th");
    });
  const rankByJoinId = new Map(ranked.map((s, i) => [s.examJoinId, i + 1]));

  return results.students.map((s) => {
    const pct = s.maxScore ? Math.round((s.totalScore / s.maxScore) * 1000) / 10 : null;
    // (แก้บั๊ก) ตัดสิน "ผ่าน/ไม่ผ่าน" ด้วยเปอร์เซ็นต์ดิบ (ไม่ปัดเศษ) — ปัดเศษไว้ใช้แค่แสดงผลใน
    // คอลัมน์ "เปอร์เซ็นต์" เท่านั้น เดิมใช้ pct ที่ปัดเศษแล้วตัดสิน ทำให้คนที่ได้เช่น 59.95%
    // อาจถูกปัดขึ้นเป็น 60.0% แล้วโชว์ว่า "ผ่าน" ทั้งที่จริงไม่ผ่านเกณฑ์
    const rawPct = s.maxScore ? (s.totalScore / s.maxScore) * 100 : null;
    return {
      "อันดับ": rankByJoinId.get(s.examJoinId) ?? "—",
      "ชื่อนักเรียน": s.name,
      "สถานะ": s.status || (s.submittedAt ? "ส่งข้อสอบแล้ว" : "กำลังทำ"),
      "คะแนนรวม": s.totalScore ?? "—",
      "คะแนนเต็ม": s.maxScore ?? "—",
      "เปอร์เซ็นต์": pct != null ? `${pct}%` : "—",
      "ผล": rawPct != null ? (rawPct >= PASS_PCT ? "ผ่าน" : "ไม่ผ่าน") : "—",
      "เวลาที่ใช้ (นาที)": s.secondsUsed != null ? Math.round(s.secondsUsed / 60) : "—",
    };
  });
};

const exportToExcel = (rows, examLabel) => {
  if (!rows?.length) return;
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(rows), "ผลนักเรียน");
  XLSX.writeFile(wb, `exam_analytics_${examLabel.replace(/\s/g, "_")}.xlsx`);
};

// พรีวิวข้อมูลก่อน export เป็น Excel จริง — โชว์เป็นตารางให้ดูก่อนกดยืนยัน
const ExcelPreviewModal = ({ rows, examLabel, onClose, onConfirm }) => {
  const columns = rows.length ? Object.keys(rows[0]) : [];
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-4xl max-h-[85vh] flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h3 className="font-bold text-slate-800">พรีวิวก่อน Export Excel · {examLabel}</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="overflow-auto px-6 py-4 flex-1">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="bg-slate-50">
                {columns.map((col) => (
                  <th key={col} className="text-left px-3 py-2 font-bold text-slate-600 border-b border-slate-200 whitespace-nowrap">
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, i) => (
                <tr key={i} className="border-b border-slate-100 hover:bg-slate-50">
                  {columns.map((col) => (
                    <td key={col} className="px-3 py-2 text-slate-700 whitespace-nowrap">{row[col]}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-slate-100">
          <button onClick={onClose}
            className="px-4 py-2 rounded-xl text-sm font-bold text-slate-600 border border-slate-200 hover:bg-slate-50 transition">
            ยกเลิก
          </button>
          <button onClick={onConfirm}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 transition">
            <Download className="h-4 w-4" /> Export Excel
          </button>
        </div>
      </div>
    </div>
  );
};

// เปิดหน้าต่างใหม่พร้อม HTML ที่จัดหน้าไว้แล้ว แล้วเรียก window.print() — ผู้ใช้จะเห็น
// พรีวิวของเบราว์เซอร์ก่อนเสมอ (เลือก "บันทึกเป็น PDF" ในหน้าต่างพรีวิวนั้นได้เลย)
// รูปแบบเดียวกับ downloadPDF ใน TutorStudents.jsx / TutorIncome.jsx และ exportResultsPdf ใน TutorExamDetail.jsx
const exportToPdf = (results, examLabel, courseName, subjectName, topicBreakdown) => {
  if (!results || !results.students?.length) return;

  const submitted = results.students.filter((s) => s.submittedAt && s.maxScore);
  const pcts = submitted.map((s) => s.totalScore / s.maxScore);
  // (แก้บั๊ก) ใช้ค่าเฉลี่ยจาก backend (results.averageScorePct) ที่ตัดคนไม่ยินยอมออกแล้ว
  // เหมือนกับ exportComparisonToPdf/ComparisonTab แทนการคำนวณเองจากทุกคนที่ส่งข้อสอบ
  const avgPct = results.averageScorePct != null ? results.averageScorePct / 100 : (pcts.length ? avg(pcts) : 0);
  const sdPct = pcts.length ? sdev(pcts) : 0;
  const passRate = pcts.length ? submitted.filter((s) => (s.totalScore / s.maxScore) * 100 >= PASS_PCT).length / submitted.length : 0;
  const maxPct = pcts.length ? Math.max(...pcts) : 0;
  const minPct = pcts.length ? Math.min(...pcts) : 0;

  const hist = buildHistogram(submitted.map((s) => ({ pct: s.totalScore / s.maxScore })));
  const topicStats = computeTopicStatsReal(topicBreakdown);

  const ranked = [...results.students]
    .filter((s) => s.submittedAt && s.maxScore)
    .sort((a, b) => {
      const pa = a.totalScore / a.maxScore;
      const pb = b.totalScore / b.maxScore;
      if (pb !== pa) return pb - pa;
      return (a.name || "").localeCompare(b.name || "", "th");
    });
  const rankByJoinId = new Map(ranked.map((s, i) => [s.examJoinId, i + 1]));

  const studentRows = results.students.map((s) => {
    const pct = s.maxScore ? Math.round((s.totalScore / s.maxScore) * 1000) / 10 : null;
    // (แก้บั๊ก) ใช้เปอร์เซ็นต์ดิบตัดสินผ่าน/ไม่ผ่าน ให้สอดคล้องกับ passRate ด้านบนที่ใช้เศษ
    // ส่วนดิบเหมือนกัน — เดิมใช้ pct ที่ปัดเศษแล้ว ทำให้บางแถวโชว์ "ผ่าน" แต่ไม่ถูกนับในอัตรา
    // ผ่านของสรุปด้านบนในรายงานเดียวกัน
    const rawPct = s.maxScore ? (s.totalScore / s.maxScore) * 100 : null;
    const passed = s.submittedAt && rawPct != null ? rawPct >= PASS_PCT : null;
    return `<tr>
      <td>${rankByJoinId.get(s.examJoinId) ?? "—"}</td>
      <td>${s.name}</td>
      <td>${s.status || (s.submittedAt ? "ส่งข้อสอบแล้ว" : "กำลังทำ")}</td>
      <td style="text-align:right">${s.totalScore ?? "—"} / ${s.maxScore ?? "—"}</td>
      <td style="text-align:right">${pct != null ? `${pct}%` : "—"}</td>
      <td style="text-align:center;${passed == null ? "" : passed ? "color:#16a34a" : "color:#dc2626"}">${passed == null ? "—" : passed ? "ผ่าน" : "ไม่ผ่าน"}</td>
    </tr>`;
  }).join("");

  const distRows = hist.map((b) => `<tr><td>${b.range}</td><td style="text-align:right">${b.count} คน</td></tr>`).join("");
  const topicRows = topicStats.map((t) => `<tr><td>${t.topic}</td><td style="text-align:right">${fmtPct(t.avgPct)}</td></tr>`).join("");

  const printWindow = window.open("", "_blank");
  const today = new Date().toLocaleDateString("th-TH", { day: "numeric", month: "long", year: "numeric" });
  printWindow.document.write(`<!DOCTYPE html><html><head><meta charset="UTF-8"><title>วิเคราะห์ข้อสอบ - ${examLabel}</title>
    <link href="https://fonts.googleapis.com/css2?family=Sarabun:wght@400;600;700&display=swap" rel="stylesheet">
    <style>* { box-sizing:border-box;margin:0;padding:0; } body{font-family:'Sarabun',sans-serif;padding:32px;font-size:13px;color:#1f2937;}
    .header{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:24px;border-bottom:2px solid #f97316;padding-bottom:16px;}
    .header h1{font-size:22px;font-weight:700;color:#f97316;} .header p{font-size:12px;color:#6b7280;margin-top:4px;}
    .summary-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin-bottom:28px;}
    .summary-card{background:#fff7ed;border:1px solid #fed7aa;border-radius:8px;padding:12px 14px;}
    .summary-card .label{font-size:11px;color:#9a3412;margin-bottom:4px;} .summary-card .value{font-size:16px;font-weight:700;color:#ea580c;}
    .two-col{display:grid;grid-template-columns:1fr 1fr;gap:20px;}
    h2{font-size:15px;font-weight:700;color:#1f2937;margin-bottom:10px;margin-top:24px;padding-left:10px;border-left:3px solid #f97316;}
    table{width:100%;border-collapse:collapse;margin-bottom:8px;} th{background:#f97316;color:white;padding:8px 10px;text-align:left;font-size:11px;font-weight:600;}
    td{padding:7px 10px;border-bottom:1px solid #e5e7eb;font-size:12px;} tr:nth-child(even) td{background:#fff7ed;}
    .footer{margin-top:28px;padding-top:12px;border-top:1px solid #e5e7eb;font-size:11px;color:#9ca3af;text-align:center;}
    @media print{body{padding:16px;}}</style></head><body>
    <div class="header"><div><h1>วิเคราะห์ข้อสอบ: ${examLabel}</h1><p>${courseName || ""}${subjectName ? ` · ${subjectName}` : ""} &nbsp;|&nbsp; ออกรายงานวันที่: ${today}</p></div></div>
    <div class="summary-grid">
      <div class="summary-card"><div class="label">คะแนนเฉลี่ย</div><div class="value">${fmtPct(avgPct)}</div></div>
      <div class="summary-card"><div class="label">อัตราผ่าน</div><div class="value">${fmtPct(passRate)}</div></div>
      <div class="summary-card"><div class="label">สูงสุด / ต่ำสุด</div><div class="value">${fmtPct(maxPct)} / ${fmtPct(minPct)}</div></div>
      <div class="summary-card"><div class="label">ส่วนเบี่ยงเบนมาตรฐาน</div><div class="value">${fmtPct(sdPct)}</div></div>
    </div>
    <div class="two-col">
      <div><h2>การกระจายตัวของคะแนน</h2><table><thead><tr><th>ช่วงคะแนน</th><th style="text-align:right">จำนวนนักเรียน</th></tr></thead><tbody>${distRows}</tbody></table></div>
      <div><h2>คะแนนเฉลี่ยรายหัวข้อ</h2><table><thead><tr><th>หัวข้อ</th><th style="text-align:right">คะแนนเฉลี่ย</th></tr></thead><tbody>${topicRows || '<tr><td colspan="2">ไม่มีข้อมูลหมวดหมู่</td></tr>'}</tbody></table></div>
    </div>
    <h2>รายชื่อนักเรียน</h2>
    <table><thead><tr><th>อันดับ</th><th>ชื่อ</th><th>สถานะ</th><th style="text-align:right">คะแนน</th><th style="text-align:right">เปอร์เซ็นต์</th><th style="text-align:center">ผล</th></tr></thead>
    <tbody>${studentRows}</tbody></table>
    <div class="footer">ออกรายงานโดยระบบจัดการติวเตอร์ &nbsp;|&nbsp; ${today}</div>
    <script>window.onload = () => window.print();</script></body></html>`);
  printWindow.document.close();
};

// Export PDF สำหรับแท็บ "เปรียบเทียบ" — รวมสรุปดีขึ้น/แย่ลง/เท่าเดิมทั้งห้อง,
// คะแนนเฉลี่ย+อัตราผ่านแต่ละรอบ (Pre/Mid/Post) และพัฒนาการรายหัวข้อ ในรายงานเดียว
const exportComparisonToPdf = (examResults, summary, topicTrendData, courseName, subjectName) => {
  const roundRows = EXAMS_META.map((e, i) => {
    const r = examResults[i];
    if (!r) return `<tr><td>${e.label}</td><td colspan="3" style="text-align:center;color:#94a3b8">ยังไม่มีข้อมูล</td></tr>`;
    const passCount = r.students?.filter(s => s.submittedAt && s.maxScore && (s.totalScore / s.maxScore) * 100 >= PASS_PCT).length || 0;
    const passEligible = r.students?.filter(s => s.submittedAt && s.maxScore).length || 0;
    const passPct = passEligible ? Math.round((passCount / passEligible) * 100) : 0;
    return `<tr>
      <td>${e.label}</td>
      <td style="text-align:right">${r.averageScorePct}%</td>
      <td style="text-align:right">${r.submittedCount} คน</td>
      <td style="text-align:right">${passPct}%</td>
    </tr>`;
  }).join("");

  const summaryBlock = !summary || summary.total === 0
    ? `<p style="color:#6b7280;font-size:12px;">ยังไม่มีนักเรียนที่สอบครบทั้ง Pre-test และ Post-test ให้สรุปภาพรวมพัฒนาการ</p>`
    : `<table><thead><tr><th>ผล</th><th style="text-align:right">จำนวนคน</th><th style="text-align:right">สัดส่วน</th></tr></thead><tbody>
        <tr><td>ดีขึ้น</td><td style="text-align:right">${summary.improved} คน</td><td style="text-align:right">${summary.improvedPct}%</td></tr>
        <tr><td>แย่ลง</td><td style="text-align:right">${summary.declined} คน</td><td style="text-align:right">${summary.declinedPct}%</td></tr>
        <tr><td>เท่าเดิม</td><td style="text-align:right">${summary.same} คน</td><td style="text-align:right">${summary.samePct}%</td></tr>
      </tbody></table>
      <p style="color:#9ca3af;font-size:11px;margin-top:6px;">เทียบจากนักเรียน ${summary.total} คนที่สอบครบทั้ง 2 รอบ โดยเทียบเปอร์เซ็นต์คะแนนดิบของตัวเองระหว่าง Pre-test กับ Post-test (วัดพัฒนาการของตัวเอง ไม่ได้เทียบอันดับกับเพื่อนร่วมห้อง)</p>`;

  const topicRows = (topicTrendData || []).length
    ? topicTrendData.map((row) => `<tr>
        <td>${row.topic}</td>
        <td style="text-align:right">${row["Pre-test"] != null ? `${row["Pre-test"]}%` : "—"}</td>
        <td style="text-align:right">${row["Mid-test"] != null ? `${row["Mid-test"]}%` : "—"}</td>
        <td style="text-align:right">${row["Post-test"] != null ? `${row["Post-test"]}%` : "—"}</td>
      </tr>`).join("")
    : `<tr><td colspan="4" style="text-align:center;color:#94a3b8">ยังไม่มีข้อมูลรายหัวข้อ — ต้องตั้งค่า Category ในข้อสอบก่อน</td></tr>`;

  const printWindow = window.open("", "_blank");
  const today = new Date().toLocaleDateString("th-TH", { day: "numeric", month: "long", year: "numeric" });
  printWindow.document.write(`<!DOCTYPE html><html><head><meta charset="UTF-8"><title>เปรียบเทียบพัฒนาการทั้งห้อง</title>
    <link href="https://fonts.googleapis.com/css2?family=Sarabun:wght@400;600;700&display=swap" rel="stylesheet">
    <style>* { box-sizing:border-box;margin:0;padding:0; } body{font-family:'Sarabun',sans-serif;padding:32px;font-size:13px;color:#1f2937;}
    .header{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:24px;border-bottom:2px solid #f97316;padding-bottom:16px;}
    .header h1{font-size:22px;font-weight:700;color:#f97316;} .header p{font-size:12px;color:#6b7280;margin-top:4px;}
    h2{font-size:15px;font-weight:700;color:#1f2937;margin-bottom:10px;margin-top:24px;padding-left:10px;border-left:3px solid #f97316;}
    table{width:100%;border-collapse:collapse;margin-bottom:8px;} th{background:#f97316;color:white;padding:8px 10px;text-align:left;font-size:11px;font-weight:600;}
    td{padding:7px 10px;border-bottom:1px solid #e5e7eb;font-size:12px;} tr:nth-child(even) td{background:#fff7ed;}
    .footer{margin-top:28px;padding-top:12px;border-top:1px solid #e5e7eb;font-size:11px;color:#9ca3af;text-align:center;}
    @media print{body{padding:16px;}}</style></head><body>
    <div class="header"><div><h1>เปรียบเทียบพัฒนาการทั้งห้อง (Pre → Mid → Post)</h1><p>${courseName || ""}${subjectName ? ` · ${subjectName}` : ""} &nbsp;|&nbsp; ออกรายงานวันที่: ${today}</p></div></div>
    <h2>ภาพรวมพัฒนาการทั้งห้อง (Pre → Post)</h2>
    ${summaryBlock}
    <h2>คะแนนเฉลี่ยแต่ละรอบ</h2>
    <table><thead><tr><th>รอบสอบ</th><th style="text-align:right">คะแนนเฉลี่ย</th><th style="text-align:right">ส่งแล้ว</th><th style="text-align:right">อัตราผ่าน</th></tr></thead>
    <tbody>${roundRows}</tbody></table>
    <h2>พัฒนาการรายหัวข้อ</h2>
    <table><thead><tr><th>หัวข้อ</th><th style="text-align:right">Pre-test</th><th style="text-align:right">Mid-test</th><th style="text-align:right">Post-test</th></tr></thead>
    <tbody>${topicRows}</tbody></table>
    <div class="footer">ออกรายงานโดยระบบจัดการติวเตอร์ &nbsp;|&nbsp; ${today}</div>
    <script>window.onload = () => window.print();</script></body></html>`);
  printWindow.document.close();
};

// Export PDF สำหรับแท็บ "รายคน" — สรุปพัฒนาการของทุกคนเป็นตารางเดียว (ไม่มี Export Excel
// เพราะข้อมูลชุดนี้เป็นสรุปเปรียบเทียบข้ามรอบต่อคน ไม่ใช่รายละเอียดคำตอบทีละข้อแบบแท็บภาพรวม)
const exportProgressToPdf = (students, courseName, subjectName) => {
  if (!students || !students.length) return;

  const rows = students.map((s) => {
    const trend = s.scoreChange == null
      ? "ยังเทียบไม่ได้"
      : s.scoreChange > 0 ? `พัฒนาขึ้น ${s.scoreChange}%`
        : s.scoreChange < 0 ? `ลดลง ${Math.abs(s.scoreChange)}%`
          : "เท่าเดิม";
    const trendColor = s.scoreChange == null ? "#94a3b8" : s.scoreChange > 0 ? "#16a34a" : s.scoreChange < 0 ? "#dc2626" : "#64748b";
    return `<tr>
      <td>${s.name}</td>
      <td style="text-align:center">${s.submittedCount}/${s.totalExams} รอบ</td>
      <td style="text-align:right">${s.latestPct != null ? `${fmtPct(s.latestPct)}${s.latestRank != null ? ` (อันดับ ${s.latestRank}/${s.totalStudents})` : ""}` : "—"}</td>
      <td style="text-align:center;color:${trendColor}">${trend}</td>
    </tr>`;
  }).join("");

  const printWindow = window.open("", "_blank");
  const today = new Date().toLocaleDateString("th-TH", { day: "numeric", month: "long", year: "numeric" });
  printWindow.document.write(`<!DOCTYPE html><html><head><meta charset="UTF-8"><title>เปรียบเทียบพัฒนาการรายคน</title>
    <link href="https://fonts.googleapis.com/css2?family=Sarabun:wght@400;600;700&display=swap" rel="stylesheet">
    <style>* { box-sizing:border-box;margin:0;padding:0; } body{font-family:'Sarabun',sans-serif;padding:32px;font-size:13px;color:#1f2937;}
    .header{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:24px;border-bottom:2px solid #f97316;padding-bottom:16px;}
    .header h1{font-size:22px;font-weight:700;color:#f97316;} .header p{font-size:12px;color:#6b7280;margin-top:4px;}
    table{width:100%;border-collapse:collapse;margin-bottom:8px;} th{background:#f97316;color:white;padding:8px 10px;text-align:left;font-size:11px;font-weight:600;}
    td{padding:7px 10px;border-bottom:1px solid #e5e7eb;font-size:12px;} tr:nth-child(even) td{background:#fff7ed;}
    .footer{margin-top:28px;padding-top:12px;border-top:1px solid #e5e7eb;font-size:11px;color:#9ca3af;text-align:center;}
    @media print{body{padding:16px;}}</style></head><body>
    <div class="header"><div><h1>เปรียบเทียบพัฒนาการรายคน (Pre → Mid → Post)</h1><p>${courseName || ""}${subjectName ? ` · ${subjectName}` : ""} &nbsp;|&nbsp; ออกรายงานวันที่: ${today}</p></div></div>
    <table><thead><tr><th>ชื่อ</th><th style="text-align:center">สอบครบ</th><th style="text-align:right">คะแนน/อันดับล่าสุด</th><th style="text-align:center">แนวโน้ม</th></tr></thead>
    <tbody>${rows}</tbody></table>
    <div class="footer">ออกรายงานโดยระบบจัดการติวเตอร์ &nbsp;|&nbsp; ${today}</div>
    <script>window.onload = () => window.print();</script></body></html>`);
  printWindow.document.close();
};


// ─── Phase 3: รายงานผลสอบสำหรับผู้ปกครอง (PDF) ──────────────────────────────
// โครงสร้างต่อนักเรียน 1 คน (1 หน้า): ช่วงบน ~60-70% เป็น "info-graphic" อ่านเร็ว
// (วงคะแนน, ตรายางผ่าน/ไม่ผ่าน, แท่งคะแนนรายหมวด+ลูกศรแนวโน้มเทียบรอบก่อน, การ์ด
// "จุดแข็ง"/"จุดที่ควรพัฒนา", กล่องข้อความสรุปถึงผู้ปกครอง) คั่นเส้นแล้วตามด้วยเนื้อหา
// แบบข้อความเต็มด้านล่าง (ภาพรวม/รายหมวด/จุดที่เข้าใจผิด/คำแนะนำ/ข้อความถึงผู้ปกครอง)
// สำหรับใครที่อยากอ่านละเอียด — ใช้ CSS ล้วน/emoji/SVG ไม่ต้องมี chart library เพิ่ม
// เรียกใช้จากทั้งปุ่ม "ส่งออกรายงาน PDF" รายคน (StudentProgressModal) และปุ่ม
// "ส่งออกรายงานผู้ปกครองทั้งห้อง" (แท็บ "ภาพรวม" ใน ExamAnalyticsView) — โค้ดสร้างหน้า
// อยู่ที่นี่ที่เดียว ไม่เขียนซ้ำสองที่ (แพทเทิร์น window.open()+print() เดียวกับ
// exportToPdf/exportComparisonToPdf/exportProgressToPdf ด้านบน)
const GAUGE_R = 52;
const GAUGE_CIRC = 2 * Math.PI * GAUGE_R;

function scoreColor(pct) {
  return pct >= 0.8 ? "#22c55e" : pct >= 0.6 ? "#f97316" : "#ef4444";
}

function buildScoreGaugeSvg(pct) {
  const safePct = Math.max(0, Math.min(1, pct ?? 0));
  const color = scoreColor(safePct);
  const offset = GAUGE_CIRC * (1 - safePct);
  return `<svg width="128" height="128" viewBox="0 0 120 120">
    <circle cx="60" cy="60" r="${GAUGE_R}" fill="none" stroke="#f1f5f9" stroke-width="12" />
    <circle cx="60" cy="60" r="${GAUGE_R}" fill="none" stroke="${color}" stroke-width="12" stroke-linecap="round"
      stroke-dasharray="${GAUGE_CIRC}" stroke-dashoffset="${offset}" transform="rotate(-90 60 60)" />
    <text x="60" y="58" text-anchor="middle" font-size="26" font-weight="800" fill="${color}" font-family="Sarabun,sans-serif">${Math.round(safePct * 100)}%</text>
    <text x="60" y="76" text-anchor="middle" font-size="10" fill="#94a3b8" font-family="Sarabun,sans-serif">คะแนนรวม</text>
  </svg>`;
}

function buildPassStamp(passed) {
  const color = passed ? "#16a34a" : "#dc2626";
  return `<div style="width:92px;height:92px;border-radius:50%;border:5px solid ${color};
    display:flex;align-items:center;justify-content:center;transform:rotate(-10deg);flex-shrink:0;">
    <span style="font-size:15px;font-weight:900;color:${color};letter-spacing:1px;">${passed ? "ผ่าน" : "ไม่ผ่าน"}</span>
  </div>`;
}

// ลูกศรแนวโน้มของแต่ละหมวด เทียบกับรอบก่อนหน้า (ถ้ามี) — ▲เขียวขึ้น ▼แดงลง –เท่าเดิม/ไม่มีข้อมูลเทียบ
function topicTrendArrowHtml(curPct, prevPct) {
  if (prevPct == null || curPct == null) return `<span style="color:#94a3b8;">–</span>`;
  const delta = curPct - prevPct;
  if (Math.abs(delta) < 0.01) return `<span style="color:#94a3b8;">–</span>`;
  return delta > 0
    ? `<span style="color:#16a34a;">▲ ${Math.round(delta * 100)}%</span>`
    : `<span style="color:#dc2626;">▼ ${Math.round(Math.abs(delta) * 100)}%</span>`;
}

function buildTopicBarsHtml(topicPcts, prevTopicPcts) {
  const topics = Object.keys(topicPcts || {});
  if (!topics.length) return `<p style="font-size:11px;color:#94a3b8;">ยังไม่มีข้อมูลคะแนนรายหมวด</p>`;
  return topics.map((t) => {
    const pct = topicPcts[t];
    const prev = prevTopicPcts ? prevTopicPcts[t] : null;
    return `<div style="margin-bottom:8px;">
      <div style="display:flex;justify-content:space-between;font-size:11px;margin-bottom:2px;">
        <span style="color:#475569;font-weight:600;">${t}</span>
        <span>${Math.round(pct * 100)}% ${topicTrendArrowHtml(pct, prev)}</span>
      </div>
      <div style="height:8px;background:#f1f5f9;border-radius:4px;overflow:hidden;">
        <div style="height:100%;width:${Math.round(pct * 100)}%;background:${scoreColor(pct)};border-radius:4px;"></div>
      </div>
    </div>`;
  }).join("");
}

function buildHighlightCardsHtml(topicPcts) {
  const entries = Object.entries(topicPcts || {});
  const strengths = entries.filter(([, p]) => p >= 0.7).sort((a, b) => b[1] - a[1]).slice(0, 3);
  const weak = entries.filter(([, p]) => p < 0.5).sort((a, b) => a[1] - b[1]).slice(0, 3);
  const strengthHtml = strengths.length
    ? strengths.map(([t]) => `<li>${t}</li>`).join("")
    : `<li style="color:#94a3b8;list-style:none;">ยังไม่มีหมวดที่โดดเด่นเป็นพิเศษ</li>`;
  const weakHtml = weak.length
    ? weak.map(([t]) => `<li>${t}</li>`).join("")
    : `<li style="color:#94a3b8;list-style:none;">ไม่มีจุดที่น่าเป็นห่วงเป็นพิเศษ 🎉</li>`;
  return `<div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;">
    <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:10px;padding:10px 12px;">
      <p style="font-size:11px;font-weight:700;color:#15803d;margin-bottom:4px;">✅ จุดแข็ง</p>
      <ul style="font-size:11px;color:#166534;padding-left:16px;margin:0;">${strengthHtml}</ul>
    </div>
    <div style="background:#fffbeb;border:1px solid #fde68a;border-radius:10px;padding:10px 12px;">
      <p style="font-size:11px;font-weight:700;color:#b45309;margin-bottom:4px;">🎯 จุดที่ควรพัฒนา</p>
      <ul style="font-size:11px;color:#92400e;padding-left:16px;margin:0;">${weakHtml}</ul>
    </div>
  </div>`;
}

// เนื้อหาข้อความเต็มด้านล่าง — โครงเดียวกับที่ AiSummaryDetail แสดงในแอป แต่ประกอบเป็น HTML ธรรมดา
function buildAiTextSectionHtml(row) {
  const byCategoryHtml = (row.byCategory || []).length
    ? `<h3 style="font-size:12px;font-weight:700;color:#1f2937;margin:14px 0 6px;">รายหมวด</h3>
      <table style="width:100%;border-collapse:collapse;margin-bottom:6px;">
        <tbody>${row.byCategory.map((c) => `<tr>
          <td style="padding:4px 8px;font-size:11px;font-weight:600;color:#374151;border-bottom:1px solid #f1f5f9;white-space:nowrap;">${c.topic}${c.trend ? ` (${c.trend})` : ""}</td>
          <td style="padding:4px 8px;font-size:11px;color:#4b5563;border-bottom:1px solid #f1f5f9;">${c.comment || ""}</td>
        </tr>`).join("")}</tbody>
      </table>`
    : "";
  const misconceptionsHtml = (row.misconceptions || []).length
    ? `<h3 style="font-size:12px;font-weight:700;color:#1f2937;margin:14px 0 6px;">จุดที่น่าจะเข้าใจผิด</h3>
      <ul style="font-size:11px;color:#374151;padding-left:18px;margin:0;">${row.misconceptions.map((m) => `<li style="margin-bottom:3px;"><b>${m.topic}</b> — ${m.pattern}${m.evidence ? ` <span style="color:#9ca3af;">(หลักฐาน: ${m.evidence})</span>` : ""}</li>`).join("")}</ul>`
    : "";
  const focusNextHtml = (row.focusNext || []).length
    ? `<h3 style="font-size:12px;font-weight:700;color:#1f2937;margin:14px 0 6px;">คำแนะนำ — ควรทำต่อ เรียงตามลำดับ</h3>
      <ol style="font-size:11px;color:#374151;padding-left:18px;margin:0;">${row.focusNext.map((f) => `<li style="margin-bottom:3px;">${typeof f === "string" ? f : f.action}${typeof f !== "string" && f.why ? ` <span style="color:#9ca3af;">— ${f.why}</span>` : ""}</li>`).join("")}</ol>`
    : "";
  const parentMessageHtml = row.parentMessage
    ? `<h3 style="font-size:12px;font-weight:700;color:#1f2937;margin:14px 0 6px;">ข้อความถึงผู้ปกครอง</h3>
      <p style="font-size:11px;color:#374151;white-space:pre-line;background:#fafafa;border:1px solid #e5e7eb;border-radius:8px;padding:8px 10px;">${row.parentMessage}</p>`
    : "";
  return `<h3 style="font-size:12px;font-weight:700;color:#1f2937;margin:0 0 6px;">ภาพรวม</h3>
    <p style="font-size:11px;color:#374151;line-height:1.6;">${row.overview || "—"}</p>
    ${byCategoryHtml}${misconceptionsHtml}${focusNextHtml}${parentMessageHtml}
    ${row.model ? `<p style="font-size:10px;color:#9ca3af;margin-top:10px;">วิเคราะห์โดย ${row.model}</p>` : ""}`;
}

// สร้าง HTML "1 หน้า" ของนักเรียน 1 คน — ใช้ประกอบเป็นรายงานเดี่ยวหรือรวมทั้งห้องก็ได้
function buildStudentReportPageHtml({ name, examLabel, courseName, subjectName, examInfo, prevTopicPcts, aiRow, today }) {
  const pct = examInfo?.pct ?? null;
  const passed = pct != null ? (pct * 100) >= PASS_PCT : null;
  return `<div class="report-page">
    <div style="display:flex;justify-content:space-between;align-items:flex-start;border-bottom:2px solid #f97316;padding-bottom:14px;margin-bottom:18px;">
      <div>
        <h1 style="font-size:20px;font-weight:700;color:#f97316;">รายงานผลสอบ — ${name}</h1>
        <p style="font-size:11px;color:#6b7280;margin-top:4px;">${courseName || ""}${subjectName ? ` · ${subjectName}` : ""} · รอบสอบ ${examLabel} &nbsp;|&nbsp; วันที่ออกรายงาน: ${today}</p>
      </div>
    </div>

    <div style="display:flex;align-items:center;gap:24px;margin-bottom:18px;flex-wrap:wrap;">
      ${buildScoreGaugeSvg(pct)}
      ${passed != null ? buildPassStamp(passed) : ""}
      <div style="flex:1;min-width:180px;">
        <p style="font-size:12px;color:#475569;">คะแนนที่ได้: <b>${examInfo ? `${fmtScore(examInfo.totalScore)} / ${fmtScore(examInfo.maxScore)}` : "—"}</b></p>
        ${examInfo?.rank != null ? `<p style="font-size:12px;color:#475569;margin-top:2px;">อันดับในห้อง: <b>${examInfo.rank} / ${examInfo.totalStudents}</b></p>` : ""}
      </div>
    </div>

    ${examInfo?.topicPcts ? `<div style="margin-bottom:18px;">
      <p style="font-size:12px;font-weight:700;color:#1f2937;margin-bottom:8px;">คะแนนรายหมวด</p>
      ${buildTopicBarsHtml(examInfo.topicPcts, prevTopicPcts)}
    </div>
    <div style="margin-bottom:18px;">${buildHighlightCardsHtml(examInfo.topicPcts)}</div>` : ""}

    ${aiRow?.parentMessage ? `<div style="background:linear-gradient(135deg,#fff7ed,#fffbeb);border:1px solid #fed7aa;border-radius:12px;padding:14px 16px;margin-bottom:20px;">
      <p style="font-size:11px;font-weight:700;color:#c2410c;margin-bottom:4px;">📩 สรุปถึงผู้ปกครอง</p>
      <p style="font-size:12px;color:#78350f;line-height:1.7;white-space:pre-line;">${aiRow.parentMessage}</p>
    </div>` : ""}

    <div style="border-top:1px dashed #d1d5db;margin:20px 0;"></div>
    <p style="font-size:10px;color:#9ca3af;text-align:center;margin-bottom:12px;">— รายละเอียดฉบับเต็ม —</p>
    ${aiRow ? buildAiTextSectionHtml(aiRow) : `<p style="font-size:11px;color:#94a3b8;">ยังไม่มีบทวิเคราะห์ AI สำหรับนักเรียนคนนี้</p>`}
  </div>`;
}

function openPrintReport(title, bodyHtml) {
  const printWindow = window.open("", "_blank");
  printWindow.document.write(`<!DOCTYPE html><html><head><meta charset="UTF-8"><title>${title}</title>
    <link href="https://fonts.googleapis.com/css2?family=Sarabun:wght@400;600;700;800&display=swap" rel="stylesheet">
    <style>* { box-sizing:border-box;margin:0;padding:0; } body{font-family:'Sarabun',sans-serif;padding:32px;color:#1f2937;}
    .report-page{padding-bottom:8px;} .report-page:not(:last-child){page-break-after:always;}
    @media print{body{padding:16px;}}</style></head><body>
    ${bodyHtml}
    <script>window.onload = () => window.print();</script></body></html>`);
  printWindow.document.close();
}

// ปุ่ม "ส่งออกรายงาน PDF" รายคน — เรียกจาก StudentProgressModal (แท็บ "รายคน")
const exportStudentAiReportPdf = ({ name, examLabel, courseName, subjectName, examInfo, prevTopicPcts, aiRow }) => {
  const today = new Date().toLocaleDateString("th-TH", { day: "numeric", month: "long", year: "numeric" });
  const html = buildStudentReportPageHtml({ name, examLabel, courseName, subjectName, examInfo, prevTopicPcts, aiRow, today });
  openPrintReport(`รายงานผลสอบ - ${name}`, html);
};

// ปุ่ม "ส่งออกรายงานผู้ปกครองทั้งห้อง (PDF)" — เรียกจากแท็บ "ภาพรวม" สโคปตามรอบที่เลือกอยู่
// ส่งออกเฉพาะคนที่มีผลวิเคราะห์ AI ของรอบนั้นแล้วเท่านั้น (คนที่ยังไม่มีจะข้ามไป ไม่ error)
const exportRoomAiReportPdf = (crossExamData, examId, aiSummariesForRound, courseName, subjectName, examLabel) => {
  const today = new Date().toLocaleDateString("th-TH", { day: "numeric", month: "long", year: "numeric" });
  const aiByUserId = new Map((aiSummariesForRound || []).map((r) => [r.userId, r]));
  const pages = crossExamData
    .filter((d) => d.exams[examId]?.submitted && aiByUserId.has(d.studentId))
    .map((d) => buildStudentReportPageHtml({
      name: d.name,
      examLabel,
      courseName,
      subjectName,
      examInfo: d.exams[examId],
      prevTopicPcts: examId > 0 ? d.exams[examId - 1]?.topicPcts : null,
      aiRow: aiByUserId.get(d.studentId),
      today,
    }));
  if (!pages.length) return;
  openPrintReport(`รายงานผลสอบทั้งห้อง - ${examLabel}`, pages.join(""));
};

// ─── Main ─────────────────────────────────────────────────────────────────────

const TABS = [
  { id: "overview", label: "ภาพรวม", icon: BarChart2 },
  { id: "compare", label: "เปรียบเทียบ", icon: TrendingUp },
  { id: "progress", label: "รายคน", icon: Users },
];

// ─── ตัวแสดงผลกลาง — ใช้ร่วมกันทั้งฝั่งติวเตอร์และฝั่งแอดมิน ─────────────────
// โจทย์คือ "ติวเตอร์เห็นแบบไหน แอดมินต้องเห็นแบบนั้น" ถ้าแยกเป็นสองไฟล์
// สุดท้ายมันจะค่อยๆ เพี้ยนจากกันเวลาแก้ฝั่งเดียว จึงต้องเป็น component ตัวเดียวกัน
// ต่างกันแค่สองจุดเท่านั้น:
//   1) api      — แหล่งข้อมูล ฝั่งติวเตอร์ยิง /api/exam ฝั่งแอดมินยิง /api/admin/progress
//   2) breadcrumb / roleNote — เส้นทางกลับกับป้ายบอกบทบาท ต่างกันตามผู้ใช้
// (ไม่มีเรื่องอนุมัติผล AI แยกตามบทบาทแล้ว — ตัดขั้นตอนอนุมัติออกทั้งระบบ)
//
// ⚠ api ต้องถูก memo ไว้แล้วจากฝั่งผู้เรียก ({ fetchExams, fetchExamResults, fetchTopicBreakdown })
//   ถ้าสร้าง object ใหม่ทุกรอบ render effect ที่มี api เป็น dependency จะวนไม่จบ
//
// breadcrumb เป็น render prop เพราะ breadcrumb ฝั่งติวเตอร์ต้องรู้ว่าตอนนี้ดูรอบไหนอยู่
// ซึ่งเป็น state ที่อยู่ข้างในตัวนี้ ไม่ใช่ข้างนอก
export function ExamAnalyticsView({
  courseId,
  subjectId,
  courseName = "",
  subjectName = "",
  api,
  breadcrumb = null,
  roleNote = null,
  initialExamId = 1,
  initialTab = "overview",
}) {
  const [activeTab, setActiveTab] = useState(initialTab);
  const [examId, setExamId] = useState(initialExamId);
  const [excelPreviewRows, setExcelPreviewRows] = useState(null);

  // ── Step 1: รายชื่อ exam จริงจาก backend ─────────────────────────────────
  const [examList, setExamList] = useState([]);
  const [loadingExams, setLoadingExams] = useState(true);

  useEffect(() => {
    if (!courseId || !subjectId || !api) {
      setLoadingExams(false);
      return;
    }
    let cancelled = false;
    setLoadingExams(true);
    api
      .fetchExams()
      .then((data) => { if (!cancelled) setExamList(Array.isArray(data) ? data : []); })
      .catch((err) => console.error("Fetch exam list failed:", err))
      .finally(() => { if (!cancelled) setLoadingExams(false); });
    return () => { cancelled = true; };
  }, [courseId, subjectId, api]);

  // จับคู่ EXAMS_META (pre/mid/post) กับ examId จริงจาก backend ตามลำดับ type
  const realExamId = (id) => examList.find((e) => e.type === ["pre-test", "mid-test", "post-test"][id])?.id ?? null;

  // ── Step 2: ผลสอบจริงต่อรอบ ──────────────────────────────────────────────
  const [examResults, setExamResults] = useState([null, null, null]); // ผลจริงของ pre/mid/post
  const [loadingResults, setLoadingResults] = useState(true);

  useEffect(() => {
    if (loadingExams) return; // ยังรอรายชื่อ exam อยู่
    if (examList.length === 0) { setLoadingResults(false); return; } // โหลด exam list เสร็จแต่ไม่มี exam เลย
    // (แก้บั๊ก) เดิมไม่มีการกัน request เก่ามาทับ request ใหม่ (race condition) — ถ้าสลับดูวิชา/
    // ติวเตอร์เร็วๆ แล้ว request ของอันเก่า resolve ช้ากว่าอันใหม่ จะเผลอเอาผลลัพธ์เก่าทับผล
    // ลัพธ์ใหม่ที่โหลดเสร็จไปแล้ว ใช้ pattern เดียวกับ effect โหลด examList ด้านบน (cancelled flag)
    let cancelled = false;
    setLoadingResults(true);
    Promise.all(
      [0, 1, 2].map((i) => {
        const id = realExamId(i);
        if (!id) return Promise.resolve(null);
        return api.fetchExamResults(id).catch((err) => {
          console.error(`Fetch results for exam ${id} failed:`, err);
          return null;
        });
      })
    ).then((data) => { if (!cancelled) setExamResults(data); })
      .finally(() => { if (!cancelled) setLoadingResults(false); });
    return () => { cancelled = true; };
  }, [loadingExams, examList]);

  // ── Step 6: คะแนนรายหัวข้อจริงต่อรอบ (topic-breakdown) ───────────────────
  const [topicResults, setTopicResults] = useState([null, null, null]); // topic-breakdown ของ pre/mid/post

  useEffect(() => {
    if (loadingExams || examList.length === 0) return;
    // (แก้บั๊ก) กัน request เก่ามาทับ request ใหม่เหมือนกับ examResults ด้านบน
    let cancelled = false;
    Promise.all(
      [0, 1, 2].map((i) => {
        const id = realExamId(i);
        if (!id) return Promise.resolve(null);
        return api.fetchTopicBreakdown(id).catch((err) => {
          console.error(`Fetch topic breakdown for exam ${id} failed:`, err);
          return null;
        });
      })
    ).then((data) => { if (!cancelled) setTopicResults(data); });
    return () => { cancelled = true; };
  }, [loadingExams, examList]);

  // ── Step 7: ผลวิเคราะห์ AI ต่อรอบ (ใช้ใน StudentProgressModal แท็บ "รายคน") ──────
  // ดึงพร้อมกับข้อมูลรอบอื่นๆ ตั้งแต่โหลดหน้า ไม่ต้องรอกดเข้าแท็บไหนก่อน (แพทเทิร์นเดียวกับ
  // topicResults ด้านบน) — เดิมตอนยังมีแท็บ "ผล AI" แยก ปล่อยให้ AiSummaryPanel ดึงเองตอน
  // กดเข้าแท็บ แต่ตอนนี้ย้ายมาดึงรวมตรงนี้แทน เพื่อให้ StudentProgressModal ใช้ได้ทันที
  const [aiSummaries, setAiSummaries] = useState([null, null, null]); // ผลวิเคราะห์ AI ของ pre/mid/post

  useEffect(() => {
    if (loadingExams || examList.length === 0) return;
    // (แก้บั๊ก) กัน request เก่ามาทับ request ใหม่เหมือนกับ 2 effect ด้านบน
    let cancelled = false;
    Promise.all(
      [0, 1, 2].map((i) => {
        const id = realExamId(i);
        if (!id) return Promise.resolve(null);
        return fetchAiSummaries(id).catch((err) => {
          console.error(`Fetch AI summaries for exam ${id} failed:`, err);
          return null;
        });
      })
    ).then((data) => { if (!cancelled) setAiSummaries(data); });
    return () => { cancelled = true; };
  }, [loadingExams, examList]);

  const examLabel = EXAMS_META[examId].label;
  const dataLoading = loadingExams || loadingResults;

  // ข้อมูลสำหรับปุ่ม Export PDF ของแท็บ "เปรียบเทียบ"/"รายคน" — ย้ายปุ่มมาอยู่แถวเดียวกับ
  // แท็บนำทางแล้ว (เดิมปุ่มอยู่ในตัว ComparisonTab/StudentProgressTab เอง) เลยต้องคำนวณ
  // ข้อมูลชุดเดียวกันตรงนี้แทน โดยใช้ฟังก์ชันกลางตัวเดียวกับที่ตัวแท็บใช้เอง (ไม่ซ้ำ logic)
  const crossExamDataForExport = useMemo(() => buildRealCrossExamData(examResults, topicResults), [examResults, topicResults]);
  const comparisonSummaryForExport = useMemo(() => computeImprovementSummary(crossExamDataForExport), [crossExamDataForExport]);
  const topicTrendDataForExport = useMemo(() => buildTopicTrendData(topicResults), [topicResults]);
  // หมายเหตุ: export ฝั่ง "รายคน" นี้เป็นรายชื่อทั้งหมดเสมอ ไม่ได้กรองตามช่องค้นหาที่พิมพ์ไว้ในแท็บ
  // (ช่องค้นหาเป็น state ภายใน StudentProgressTab เอง ปุ่มที่ย้ายออกมาแล้วเข้าไม่ถึง)
  const progressRowsForExport = useMemo(() => buildProgressRows(crossExamDataForExport), [crossExamDataForExport]);

  // ── ปุ่ม "วิเคราะห์ใหม่" ของห้อง (ย้ายมาจาก TutorExamDetail.jsx ตามที่ตกลงกัน — ฟังก์ชัน
  // เกี่ยวกับประมวลผล AI ทั้งหมดอยู่หน้านี้ที่เดียว) สโคปตามรอบที่เลือกอยู่ (examId) เท่านั้น
  // ไม่กระทบรอบอื่น — รีเฟรช aiSummaries เฉพาะ index ของรอบนั้นหลังวิเคราะห์เสร็จ
  const [reanalyzing, setReanalyzing] = useState(false);
  const [reanalyzeError, setReanalyzeError] = useState("");

  const handleReanalyze = async () => {
    const realId = realExamId(examId);
    if (!realId) return;
    setReanalyzing(true);
    setReanalyzeError("");
    try {
      const res = await analyzeExamWithAi(realId);
      const list = await fetchAiSummaries(realId).catch(() => []);
      setAiSummaries((prev) => {
        const next = [...prev];
        next[examId] = Array.isArray(list) ? list : [];
        return next;
      });
      if (res?.failed > 0) setReanalyzeError(`วิเคราะห์สำเร็จ ${res.analyzed} คน ไม่สำเร็จ ${res.failed} คน กดวิเคราะห์ใหม่เพื่อลองอีกครั้ง`);
    } catch (err) {
      console.error("Analyze failed:", err);
      setReanalyzeError(err.response?.data?.message || "วิเคราะห์ไม่สำเร็จ ลองใหม่อีกครั้ง");
    } finally {
      setReanalyzing(false);
    }
  };

  return (
    <div className="space-y-6 mt-[90px]">
      {typeof breadcrumb === "function"
        ? breadcrumb({ examId, examLabel, realExamId })
        : breadcrumb}

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">ภาพรวมพัฒนาการนักเรียน</h1>
          <p className="text-sm text-slate-500 mt-1">
            {courseName} {subjectName ? `· ${subjectName}` : ""} · นักเรียนส่งแล้ว {examResults[examId]?.submittedCount ?? 0} คน
            {examResults[examId]?.totalQuestions != null && ` · ${examResults[examId].totalQuestions} ข้อ`}
            {(examResults[examId]?.students?.find(s => s.maxScore != null)?.maxScore) != null &&
              ` · ${fmtScore(examResults[examId].students.find(s => s.maxScore != null).maxScore)} คะแนน`}
          </p>
          {roleNote}
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {activeTab === "overview" && (
            <div className="flex rounded-xl overflow-hidden border border-slate-200">
              {EXAMS_META.map(e => (
                <button key={e.id} onClick={() => setExamId(e.id)}
                  className={`px-3 py-2 text-xs font-bold transition ${examId === e.id ? "bg-orange-500 text-white" : "bg-white text-slate-600 hover:bg-slate-50"}`}>
                  {e.label}
                </button>
              ))}
            </div>
          )}
          {activeTab === "overview" && (
            <>
              <button onClick={() => setExcelPreviewRows(buildExcelRows(examResults[examId]))}
                disabled={!examResults[examId]?.students?.length}
                className="flex items-center gap-2 border border-emerald-200 bg-emerald-50 hover:bg-emerald-100 disabled:opacity-40 disabled:cursor-not-allowed text-emerald-700 rounded-xl px-4 py-2 text-sm font-bold transition">
                <Download className="h-4 w-4" /> Export Excel
              </button>
              <button onClick={() => exportToPdf(examResults[examId], examLabel, courseName, subjectName, topicResults[examId])}
                disabled={!examResults[examId]?.students?.length}
                className="flex items-center gap-2 border border-orange-200 bg-orange-50 hover:bg-orange-100 disabled:opacity-40 disabled:cursor-not-allowed text-orange-700 rounded-xl px-4 py-2 text-sm font-bold transition">
                <Download className="h-4 w-4" /> Export PDF
              </button>
            </>
          )}
        </div>
      </div>

      {/* (Phase 3) แถบ AI ของห้อง — สถานะ + ปุ่ม "วิเคราะห์ใหม่" (ย้ายมาจากหน้า "จัดการรอบสอบ")
          + ปุ่ม "ส่งออกรายงานผู้ปกครองทั้งห้อง (PDF)" ใหม่ — อยู่แค่ในแท็บ "ภาพรวม" สโคปตามรอบ
          ที่เลือกอยู่ (examId) เท่านั้น เพราะฟังก์ชัน AI ทั้งหมดต้องมารวมที่หน้านี้ที่เดียว */}
      {activeTab === "overview" && (
        <div className="bg-white border border-slate-200 rounded-2xl px-5 py-3.5 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 min-w-0">
            <Sparkles className="h-4 w-4 text-amber-500 flex-shrink-0" />
            <p className="text-xs text-slate-500 truncate">
              {aiSummaries[examId] == null
                ? "กำลังตรวจสอบสถานะวิเคราะห์ AI…"
                : aiSummaries[examId].length > 0
                  ? `AI วิเคราะห์แล้ว ${aiSummaries[examId].length} จาก ${examResults[examId]?.submittedCount || 0} คน ของรอบ ${examLabel}`
                  : examResults[examId]?.submittedCount
                    ? `ยังไม่มีผลวิเคราะห์ AI ของรอบ ${examLabel} — ปกติจะขึ้นเองไม่นานหลังปิดสอบ`
                    : `ยังไม่มีนักเรียนส่งคำตอบรอบ ${examLabel} จึงยังวิเคราะห์ไม่ได้`}
            </p>
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

      {/* Tab Nav — Export PDF ของแท็บ "เปรียบเทียบ"/"รายคน" อยู่แถวเดียวกันนี้เลย (ไม่ใช่แถวแยก
          ด้านล่างเหมือนเดิม จะได้ไม่มีช่องว่างเว้นเยอะระหว่างแท็บกับปุ่ม export) */}
      <div className="flex items-center justify-between gap-2 flex-wrap">
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
        {activeTab === "compare" && (
          <button
            onClick={() => exportComparisonToPdf(examResults, comparisonSummaryForExport, topicTrendDataForExport, courseName, subjectName)}
            disabled={dataLoading}
            className="flex items-center gap-2 border border-orange-200 bg-orange-50 hover:bg-orange-100 disabled:opacity-40 disabled:cursor-not-allowed text-orange-700 rounded-xl px-4 py-2 text-sm font-bold transition">
            <Download className="h-4 w-4" /> Export PDF
          </button>
        )}
        {activeTab === "progress" && (
          <button
            onClick={() => exportProgressToPdf(progressRowsForExport, courseName, subjectName)}
            disabled={dataLoading || !progressRowsForExport.length}
            className="flex items-center gap-2 border border-orange-200 bg-orange-50 hover:bg-orange-100 disabled:opacity-40 disabled:cursor-not-allowed text-orange-700 rounded-xl px-4 py-2 text-sm font-bold transition">
            <Download className="h-4 w-4" /> Export PDF
          </button>
        )}
      </div>

      {/* Content */}
      {activeTab === "overview" && <OverviewTab results={examResults[examId]} topicBreakdown={topicResults[examId]} loading={dataLoading} />}
      {activeTab === "compare" && <ComparisonTab examResults={examResults} topicResults={topicResults} loading={dataLoading} />}
      {activeTab === "progress" && <StudentProgressTab examResults={examResults} topicResults={topicResults} aiSummaries={aiSummaries} loading={dataLoading} courseName={courseName} subjectName={subjectName} />}
      {excelPreviewRows && (
        <ExcelPreviewModal
          rows={excelPreviewRows}
          examLabel={examLabel}
          onClose={() => setExcelPreviewRows(null)}
          onConfirm={() => { exportToExcel(excelPreviewRows, examLabel); setExcelPreviewRows(null); }}
        />
      )}
    </div>
  );
}

// ─── หน้าของติวเตอร์ — ตัวห่อบางๆ อ่าน query param แล้วส่งต่อให้ตัวกลาง ──────
export default function TutorExamAnalytics() {
  const [searchParams] = useSearchParams();
  const courseId = searchParams.get("courseId");
  const subjectId = searchParams.get("subjectId");
  const courseName = searchParams.get("courseName") || "";
  const subjectName = searchParams.get("subjectName") || "";
  // เข้ามาจากหน้ารายละเอียดรอบสอบ (exam-detail) หรือไม่ — ใช้ตัดสินว่า breadcrumb
  // ต้องแทรกชั้น "รอบสอบ" คั่นไว้ให้กดกลับไปหน้านั้นได้ไหม (ถ้าเข้าจากหน้ารายการสอบตรงๆ ไม่ต้องมี)
  const fromExamDetail = searchParams.get("from") === "exam-detail";
  // เข้ามาจากหน้า "ภาพรวมพัฒนาการ" (/tutor/progress) หรือไม่ — ถ้าใช่ breadcrumb ต้อง
  // ชี้กลับไปหน้านั้นแทนที่จะโผล่ "คอร์ส > จัดการการสอบ" เหมือนเข้าจากหน้าคอร์สตรงๆ
  const fromProgress = searchParams.get("from") === "progress";

  const TYPE_TO_ID = { "pre-test": 0, "mid-test": 1, "post-test": 2 };
  const initialExamId = TYPE_TO_ID[searchParams.get("examType")] ?? 1;
  const requestedTab = searchParams.get("tab") ?? "overview";
  const initialTab = (requestedTab === "items" || requestedTab === "students") ? "overview" : requestedTab;

  const adminId = JSON.parse(localStorage.getItem("user") || "null")?.id;

  const api = useMemo(
    () => (courseId && subjectId && adminId ? tutorExamAnalyticsApi({ courseId, subjectId, adminId }) : null),
    [courseId, subjectId, adminId]
  );

  return (
    <ExamAnalyticsView
      courseId={courseId}
      subjectId={subjectId}
      courseName={courseName}
      subjectName={subjectName}
      api={api}
      initialExamId={initialExamId}
      initialTab={initialTab}
      breadcrumb={({ examId, examLabel, realExamId }) => (
        // ไม่มีปุ่ม "ย้อนกลับ" แล้ว เพราะซ้ำซ้อนกับ breadcrumb เส้นนี้
        // ถ้าเข้ามาจากหน้ารอบสอบ (from=exam-detail) จะแทรกชั้นรอบสอบให้ด้วย และชั้นนั้น
        // จะเปลี่ยนตามรอบที่กำลังดูอยู่บนหน้านี้ (กดสลับ Pre/Mid/Post แล้ว breadcrumb ตามไปด้วย)
        <div className="flex items-center flex-wrap gap-x-1.5 gap-y-1 text-sm text-slate-400">
          {fromProgress ? (
            // เข้ามาจากหน้า "ภาพรวมพัฒนาการ" (/tutor/progress) — เป็นเส้นทางของตัวเอง
            // แยกจากกิ่งปกติเด็ดขาด ไม่ใช้ท้ายเส้นร่วมกัน กันไม่ให้ ChevronRight ซ้อนกันเป็นช่องว่าง
            <>
              <Link to="/tutor" className="hover:text-orange-600 transition font-medium">หน้าแรก</Link>
              <ChevronRight className="h-4 w-4" />
              <Link to="/tutor/progress" className="hover:text-orange-600 transition font-medium">ภาพรวมพัฒนาการ</Link>
              <ChevronRight className="h-4 w-4" />
              <span className="font-semibold text-slate-700">{subjectName || "วิชา"}</span>
            </>
          ) : (
            <>
              <Link to="/tutor/courses" className="hover:text-orange-600 transition font-medium">คอร์ส</Link>
              <ChevronRight className="h-4 w-4" />
              <Link
                to={`/tutor/exam?${new URLSearchParams({ courseId, subjectId, courseName, subjectName }).toString()}`}
                className="hover:text-orange-600 transition font-medium"
              >
                {subjectName || "จัดการการสอบ"}
              </Link>
              {fromExamDetail && (
                <>
                  <ChevronRight className="h-4 w-4" />
                  {realExamId(examId) ? (
                    <Link
                      to={`/tutor/exam-detail?${new URLSearchParams({
                        courseId: courseId || "",
                        subjectId: subjectId || "",
                        courseName,
                        subjectName,
                        examId: String(realExamId(examId)),
                      }).toString()}`}
                      className="hover:text-orange-600 transition font-medium"
                    >
                      {examLabel}
                    </Link>
                  ) : (
                    // ยังโหลดรายชื่อ exam ไม่เสร็จ (หรือรอบนี้ไม่มีข้อสอบจริง) — โชว์ชื่อไว้ก่อนแบบกดไม่ได้
                    // กันไม่ให้ breadcrumb กระพริบสลับความยาวไปมาตอนโหลด
                    <span className="font-medium">{examLabel}</span>
                  )}
                </>
              )}
              <ChevronRight className="h-4 w-4" />
              <span className="font-semibold text-slate-700">ภาพรวมพัฒนาการนักเรียน</span>
            </>
          )}
        </div>
      )}
    />
  );
}
