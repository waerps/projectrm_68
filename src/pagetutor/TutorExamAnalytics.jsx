import { useState, useMemo, useEffect } from "react";
import { useSearchParams, Link } from "react-router-dom";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, LineChart, Line, Legend, Cell, ReferenceLine,
} from "recharts";
import {
  BarChart2, Users, TrendingUp, Download, AlertTriangle,
  CheckCircle, Search, Award, Clock, BookOpen, Info,
  X, Eye, ChevronRight, ArrowUpRight, ArrowDownRight, ChevronDown, Sparkles, Minus,
  Target, Timer, MessageCircle, Copy, Pencil, Check, Flame, PenLine,
} from "lucide-react";
import * as XLSX from "xlsx";
import { fmtScore } from "../utils/examScore";
import { tutorExamAnalyticsApi, fetchAiSummaries, updateAiSummary, analyzeExamWithAi } from "../utils/examShared";

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

// ─── กติกากลางของตัวเลข (ใช้ทุกแท็บ + ทุก PDF — แก้ที่นี่ที่เดียว) ─────────────
// 1) "สถิติระดับห้อง" (ค่าเฉลี่ย/อัตราผ่าน/สูง-ต่ำ/กราฟกระจาย/รายหมวดเฉลี่ย/ค่าเฉลี่ยห้องที่ใช้เทียบ)
//    นับเฉพาะคนที่ส่งแล้ว + มีคะแนนเต็ม + ไม่ได้ปฏิเสธความยินยอม exam_behavior ให้ตรงกับ
//    averageScorePct ที่ backend คำนวณ (services/examAnalytics.js)
//    (แก้บั๊ก) เดิมค่าเฉลี่ยตัดคนไม่ยินยอมออก แต่อัตราผ่าน/สูง-ต่ำ/SD นับทุกคน การ์ดแถวเดียวกัน
//    จึงมาจากนักเรียนคนละกลุ่ม — ข้อมูล "รายคน" ยังแสดงทุกคนตามปกติ
const isClassStatStudent = (s) => !!(s?.submittedAt && s.maxScore && s.examBehaviorConsent !== false);
const classStatStudents = (results) => (results?.students || []).filter(isClassStatStudent);

const median = (arr) => {
  if (!arr.length) return null;
  const s = [...arr].sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
};

// สถิติของรอบสอบ 1 รอบ — ใช้ทั้งแท็บภาพรวมและ Export PDF ของแท็บภาพรวม (ตัวเลขตรงกันเสมอ)
function computeRoundStats(results, topicBreakdown) {
  const allSubmitted = (results?.students || []).filter((s) => s.submittedAt && s.maxScore);
  const stat = classStatStudents(results);
  const statIds = new Set(stat.map((s) => s.userId));
  const pcts = stat.map((s) => s.totalScore / s.maxScore);
  const passCount = pcts.filter((p) => p * 100 >= PASS_PCT).length;
  return {
    stat,
    pcts,
    excludedCount: allSubmitted.length - stat.length,
    avgPct: pcts.length ? avg(pcts) : 0,
    medianPct: median(pcts),
    sdPct: pcts.length ? sdev(pcts) : 0,
    passCount,
    passRate: pcts.length ? passCount / pcts.length : 0,
    maxPct: pcts.length ? Math.max(...pcts) : 0,
    minPct: pcts.length ? Math.min(...pcts) : 0,
    maxScore: stat[0]?.maxScore ?? null,
    maxRawScore: stat.length ? Math.max(...stat.map((s) => s.totalScore)) : 0,
    minRawScore: stat.length ? Math.min(...stat.map((s) => s.totalScore)) : 0,
    topicBreakdown: (topicBreakdown || []).filter((u) => statIds.has(u.userId)),
    enrolledCount: results?.enrolledCount ?? null,
    joinedCount: results?.joinedCount ?? 0,
    submittedCount: results?.submittedCount ?? 0,
    absentCount: results?.absentStudents?.length ?? 0,
  };
}

// 2) "ดีขึ้น/ลดลง" รายคน = คะแนนรวม % ของรอบแรกที่สอบ → รอบล่าสุดที่สอบ (หน่วย: จุดเปอร์เซ็นต์)
//    ใช้ที่เดียวทั้งตารางรายคน หน้าต่างรายคน และ PDF — ส่วนแท็บ "เปรียบเทียบ" เป็นมุมมองระดับห้อง
//    เทียบรอบแรกกับรอบสุดท้ายที่มีข้อมูล เฉพาะคนที่สอบครบทุกรอบ (ดู buildCohortComparison)
const scoreChangeOf = (exams) => {
  const done = (exams || []).filter((e) => e.submitted);
  if (done.length < 2) return null;
  return Math.round((done[done.length - 1].pct - done[0].pct) * 1000) / 10;
};

// 3) สถานะนักเรียน (ไฟ 3 สี) — ใช้ร่วมกันทั้งคอลัมน์ "สถานะ" ในตาราง, ตัวกรอง "ต้องดูแล"
//    และหน้าต่างรายคน (เดิมคำนวณอยู่ในการ์ด AI อย่างเดียว ตารางเลยกรองหาคนที่ต้องดูแลไม่ได้)
const STUDENT_STATUS = {
  ok: { label: "ปกติ — ไปได้ดี", short: "ปกติ", level: 0, box: "bg-emerald-50 border-emerald-200", text: "text-emerald-700", pill: "bg-emerald-100 text-emerald-700 border-emerald-200" },
  watch: { label: "ควรติดตาม", short: "ควรติดตาม", level: 1, box: "bg-amber-50 border-amber-200", text: "text-amber-700", pill: "bg-amber-100 text-amber-700 border-amber-200" },
  care: { label: "ต้องดูแลพิเศษ", short: "ต้องดูแล", level: 2, box: "bg-red-50 border-red-200", text: "text-red-600", pill: "bg-red-100 text-red-600 border-red-200" },
};
const STATUS_LIGHT_ON = [
  "bg-emerald-500 ring-4 ring-emerald-100",
  "bg-amber-400 ring-4 ring-amber-100",
  "bg-red-500 ring-4 ring-red-100",
];

function computeStudentStatus({ exams, missedRounds = 0, misconceptionCount = 0 }) {
  const done = (exams || []).filter((e) => e.submitted);
  const latest = done[done.length - 1] || null;
  const change = scoreChangeOf(exams);
  const weak = Object.values(latest?.topicPcts || {}).filter((v) => v != null && v < 0.5).length;
  const below = latest?.pct != null && latest.pct * 100 < PASS_PCT;
  const reasons = [];
  if (!latest) reasons.push("ยังไม่ได้สอบเลย");
  if (below) reasons.push(`ต่ำกว่าเกณฑ์ ${PASS_PCT}%`);
  if (weak) reasons.push(`หมวดต่ำกว่า 50% ${weak} หมวด`);
  if (change != null && change < 0) reasons.push(`คะแนนลง ${Math.abs(change)} จุด`);
  if (missedRounds) reasons.push(`ขาดสอบ ${missedRounds} รอบ`);
  if (misconceptionCount >= 2) reasons.push(`จุดเข้าใจผิด ${misconceptionCount} เรื่อง`);
  let key = "ok";
  if (!latest || below || weak >= 2 || (change != null && change <= -5)) key = "care";
  else if (weak === 1 || misconceptionCount >= 2 || (change != null && change < 0) || missedRounds > 0) key = "watch";
  if (key === "ok") reasons.push("ผ่านเกณฑ์ ไม่มีจุดที่น่ากังวล");
  return { key, level: STUDENT_STATUS[key].level, reasons, change, weakCount: weak };
}

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

// ─── ข้อมูลจริงข้ามรอบสอบ ─────────────────────────────────────────────────────
// รวมคนคนเดียวกันข้าม 3 รอบด้วย userId จริงจาก backend
// + (เพิ่ม) รวมคนที่ลงทะเบียนแต่ยังไม่เคยเข้าสอบเลยสักรอบ (จาก absentStudents) ให้โผล่ในแท็บ
//   "รายคน" ด้วย — คนกลุ่มนี้คือคนที่ครูต้องตามมากที่สุด เดิมหายไปจากตารางเลย
// + missedRounds = จำนวนรอบที่ "มีคนสอบแล้ว" แต่คนนี้ไม่ได้สอบ, roundsWithData = รอบที่มีข้อมูลแล้ว
function buildRealCrossExamData(examResults, topicResults) {
  const userMap = new Map(); // userId -> { userId, name, exams: [null,null,null] }
  const roundsWithData = [0, 1, 2].filter((i) => (examResults[i]?.students || []).some((s) => s.submittedAt && s.maxScore));
  const ensure = (userId, name) => {
    if (!userMap.has(userId)) userMap.set(userId, { userId, name, exams: [null, null, null] });
    return userMap.get(userId);
  };
  examResults.forEach((r, examId) => {
    if (!r) return;
    // อันดับต้องเรียงเหมือนกันทุกที่ในระบบ: คะแนน% มาก→น้อย เท่ากันใช้ชื่อไทย (ก-ฮ) ตัดสิน
    const sorted = [...r.students].filter(s => s.submittedAt && s.maxScore)
      .sort((a, b) => {
        const pa = a.totalScore / a.maxScore;
        const pb = b.totalScore / b.maxScore;
        if (pb !== pa) return pb - pa;
        return (a.name || "").localeCompare(b.name || "", "th");
      });
    const rankByUser = new Map(sorted.map((s, i) => [s.userId, i + 1]));
    r.students.forEach((s) => {
      const entry = ensure(s.userId, s.name);
      if (s.submittedAt && s.maxScore) {
        entry.exams[examId] = {
          label: EXAMS_META[examId].label,
          submitted: true,
          consent: s.examBehaviorConsent !== false, // ใช้ตัดสินว่านับเข้า "ค่าเฉลี่ยห้อง" ไหม
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
    (r.absentStudents || []).forEach((a) => ensure(a.userId, a.name));
  });
  return Array.from(userMap.values()).map((u) => {
    const exams = u.exams.map((e, i) => e || {
      label: EXAMS_META[i].label, submitted: false, pct: null, totalScore: null, consent: true,
      maxScore: null, topicPcts: null, rank: null, totalStudents: null, avgTimePerQuestion: null,
    });
    return {
      studentId: u.userId,
      name: u.name,
      exams,
      roundsWithData,
      missedRounds: roundsWithData.filter((i) => !exams[i].submitted).length,
    };
  });
}

// ─── แท็บ "เปรียบเทียบ": ห้องนี้ทั้ง 3 รอบ (ดูเฉพาะการเปลี่ยนแปลง) ────────────────
// นับเฉพาะ "กลุ่มเดียวกันทุกรอบ" (cohort) = คนที่อยู่ในสถิติระดับห้องของทุกรอบที่มีข้อมูลแล้ว
// (แก้บั๊ก) เดิมแต่ละรอบเฉลี่ยจากคนคนละกลุ่ม กราฟรายหมวดจึงดูเหมือนดีขึ้นได้ทั้งที่แค่มีคน
// อ่อนขาดสอบรอบหลัง — ใช้ทั้งในตัวแท็บและ Export PDF ของแท็บ
function buildCohortComparison(examResults, topicResults) {
  const rounds = [0, 1, 2].filter((i) => classStatStudents(examResults[i]).length > 0);
  const base = { rounds, labels: rounds.map((i) => EXAMS_META[i].label), cohortSize: 0, excludedCount: 0 };
  if (rounds.length < 2) return base;

  const byRound = rounds.map((i) => new Map(classStatStudents(examResults[i]).map((s) => [s.userId, s])));
  const everyone = new Set();
  byRound.forEach((m) => m.forEach((_, id) => everyone.add(id)));
  const cohortIds = [...everyone].filter((id) => byRound.every((m) => m.has(id)));
  const pctOf = (s) => s.totalScore / s.maxScore;

  const gains = cohortIds.map((id) => Math.round((pctOf(byRound[byRound.length - 1].get(id)) - pctOf(byRound[0].get(id))) * 1000) / 10);
  const improved = gains.filter((g) => g > 0).length;
  const declined = gains.filter((g) => g < 0).length;
  const same = gains.length - improved - declined;
  const share = (n) => (gains.length ? Math.round((n / gains.length) * 100) : 0);

  const roundAvg = rounds.map((i, k) => ({
    label: EXAMS_META[i].label,
    pct: cohortIds.length ? avg(cohortIds.map((id) => pctOf(byRound[k].get(id)))) : null,
  }));

  const GAIN_BINS = [
    { label: "ลดลง > 10", test: (g) => g < -10, tone: "down" },
    { label: "ลดลง 0–10", test: (g) => g < 0 && g >= -10, tone: "down" },
    { label: "เท่าเดิม", test: (g) => g === 0, tone: "flat" },
    { label: "+0–10", test: (g) => g > 0 && g <= 10, tone: "up" },
    { label: "+10–20", test: (g) => g > 10 && g <= 20, tone: "up" },
    { label: "+20–30", test: (g) => g > 20 && g <= 30, tone: "up" },
    { label: "มากกว่า +30", test: (g) => g > 30, tone: "up" },
  ];
  const gainBins = GAIN_BINS.map((b) => ({ label: b.label, tone: b.tone, count: gains.filter(b.test).length }));

  // หมวด × รอบ (เฉพาะ cohort) + Δ รอบแรก → รอบสุดท้าย เรียง Δ น้อย → มาก (หมวดที่ไม่ขยับขึ้นก่อน)
  const cohortSet = new Set(cohortIds);
  const catSet = new Set();
  rounds.forEach((i) => (topicResults[i] || []).forEach((u) => {
    if (cohortSet.has(u.userId)) u.topics.forEach((t) => catSet.add(t.category));
  }));
  const topicRows = [...catSet].map((cat) => {
    const values = rounds.map((i) => {
      const vals = (topicResults[i] || [])
        .filter((u) => cohortSet.has(u.userId))
        .map((u) => u.topics.find((t) => t.category === cat)?.pct)
        .filter((v) => v != null);
      return vals.length ? avg(vals) : null;
    });
    const first = values[0];
    const last = values[values.length - 1];
    const delta = first != null && last != null ? Math.round((last - first) * 1000) / 10 : null;
    return { topic: cat, values, delta };
  }).sort((a, b) => (a.delta ?? Infinity) - (b.delta ?? Infinity));

  return {
    ...base,
    cohortSize: cohortIds.length,
    excludedCount: everyone.size - cohortIds.length,
    fromLabel: EXAMS_META[rounds[0]].label,
    toLabel: EXAMS_META[rounds[rounds.length - 1]].label,
    improved, declined, same,
    improvedPct: share(improved), declinedPct: share(declined), samePct: share(same),
    avgGain: gains.length ? Math.round(avg(gains) * 10) / 10 : null,
    roundAvg,
    gainBins,
    topicRows,
  };
}

// ─── แท็บ "รายคน": 1 แถวต่อนักเรียน — ใช้ทั้งตารางในแท็บและ Export PDF ───────────
function buildProgressRows(crossExamData, aiSummaries) {
  return crossExamData.map((d) => {
    const submittedList = d.exams.filter(e => e.submitted);
    const latest = submittedList[submittedList.length - 1] ?? null;
    const latestIndex = [2, 1, 0].find((i) => d.exams[i]?.submitted) ?? null;
    const ai = latestIndex != null ? (aiSummaries?.[latestIndex] || []).find((r) => r.userId === d.studentId) : null;
    const status = computeStudentStatus({ exams: d.exams, missedRounds: d.missedRounds, misconceptionCount: ai?.misconceptions?.length || 0 });
    return {
      studentId: d.studentId, name: d.name,
      submittedCount: submittedList.length,
      totalExams: d.roundsWithData.length,
      latestPct: latest?.pct ?? null,
      latestLabel: latest?.label ?? null,
      scoreChange: status.change,
      status: status.key,
      statusLevel: status.level,
      statusReasons: status.reasons,
    };
  });
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
// (แก้บั๊ก) รอบลบ dead code ก่อนหน้านี้ลบเลยขอบเขตไปโดนฟังก์ชัน OverviewTab (component จริง
// ที่ยังใช้แสดงแท็บ "ภาพรวม") กับคอมเมนต์บล็อก ItemAnalysisTab เดิมไปด้วยโดยไม่ได้ตั้งใจ —
// ทำให้หน้านี้พังทั้งหน้า (ReferenceError: OverviewTab is not defined) คืนค่าทั้งสองกลับมา
// ที่นี่ ส่วน StudentTab/StudentModal ยังคงลบตามเดิม (ยืนยันแล้วว่าไม่มีจุดไหนเรียกใช้จริง)

// ─── Tab 1: ภาพรวม — "ห้องนี้เข้าใจเนื้อหารอบนี้แค่ไหน" (ระดับห้อง ไม่มีข้อมูลรายคน) ──
function OverviewTab({ results, topicBreakdown, loading }) {
  // ── Hooks ต้องถูกเรียกแบบไม่มีเงื่อนไขทุก render (Rules of Hooks) — อยู่บนสุดก่อน early return ──
  const stats = useMemo(() => computeRoundStats(results, topicBreakdown), [results, topicBreakdown]);

  const hist = useMemo(() => {
    const bins = Array.from({ length: 10 }, (_, i) => ({ range: `${i * 10}–${(i + 1) * 10}%`, count: 0 }));
    stats.pcts.forEach((p) => { bins[Math.min(9, Math.floor(p * 10))].count++; });
    return bins;
  }, [stats]);

  const topicStats = useMemo(() => computeTopicStatsReal(stats.topicBreakdown), [stats]);

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => <div key={i} className="h-24 bg-slate-100 rounded-2xl" />)}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="h-64 bg-slate-100 rounded-2xl" />
          <div className="h-64 bg-slate-100 rounded-2xl" />
        </div>
      </div>
    );
  }

  if (!results || stats.stat.length === 0) {
    return (
      <div className="flex flex-col items-center text-center gap-3 bg-slate-50 border border-dashed border-slate-200 rounded-2xl p-10">
        <BarChart2 className="h-10 w-10 text-slate-300" />
        <p className="text-sm font-semibold text-slate-600">ยังไม่มีข้อมูลผลสอบรอบนี้</p>
        <p className="text-xs text-slate-400">ต้องมีนักเรียนส่งข้อสอบอย่างน้อย 1 คน</p>
      </div>
    );
  }

  const { avgPct, medianPct, sdPct, passRate, passCount, maxPct, minPct, maxScore, maxRawScore, minRawScore } = stats;
  const notSubmitted = Math.max(0, stats.joinedCount - stats.submittedCount);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          icon={Award}
          label="คะแนนเฉลี่ย"
          value={fmtPct(avgPct)}
          sub={`มัธยฐาน ${medianPct != null ? fmtPct(medianPct) : "—"} · ${fmtScore(avgPct * maxScore)}/${fmtScore(maxScore)} คะแนน`}
          color="bg-orange-500"
          tooltip={`ค่าเฉลี่ย = เอาคะแนนทุกคนมาเฉลี่ย ส่วนมัธยฐาน = คะแนนของคนที่อยู่ตรงกลางห้อง ถ้าสองค่านี้ต่างกันมาก แปลว่ามีบางคนได้คะแนนสูงหรือต่ำผิดปกติดึงค่าเฉลี่ยไป · ส่วนเบี่ยงเบนมาตรฐาน ${fmtPct(sdPct)} (ยิ่งมาก = คะแนนในห้องยิ่งห่างกัน มีทั้งกลุ่มเก่งและกลุ่มที่ต้องช่วยปนกัน)`}
        />
        <StatCard icon={CheckCircle} label="อัตราผ่าน" value={fmtPct(passRate)} sub={`${passCount} จาก ${stats.stat.length} คน (เกณฑ์ ${PASS_PCT}%)`} color="bg-emerald-500" />
        <StatCard icon={TrendingUp} label="สูงสุด / ต่ำสุด" value={`${fmtPct(maxPct)} / ${fmtPct(minPct)}`} sub={`${fmtScore(maxRawScore)}/${fmtScore(maxScore)} - ${fmtScore(minRawScore)}/${fmtScore(maxScore)} คะแนน`} color="bg-blue-500" />
        <StatCard
          icon={Users}
          label="การเข้าสอบ"
          value={stats.enrolledCount ? `${stats.submittedCount}/${stats.enrolledCount}` : `${stats.submittedCount}`}
          sub={`ขาดสอบ ${stats.absentCount} คน${notSubmitted ? ` · ยังไม่ส่ง ${notSubmitted} คน` : ""}`}
          color="bg-slate-500"
          tooltip="จำนวนคนที่ส่งข้อสอบ เทียบกับจำนวนคนที่ลงทะเบียนคอร์สนี้ — รายชื่อคนขาดสอบดูได้ที่หน้ารอบสอบ หรือแท็บ &quot;รายคน&quot;"
        />
      </div>

      {stats.excludedCount > 0 && (
        <p className="text-[11px] text-slate-400 -mt-3 flex items-center gap-1.5">
          <Info className="h-3.5 w-3.5 flex-shrink-0" />
          ตัวเลขสรุปของห้องไม่นับ {stats.excludedCount} คนที่ไม่ยินยอมให้เก็บข้อมูลพฤติกรรมระหว่างสอบ (ผลรายคนของเขายังดูได้ตามปกติ)
        </p>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <SectionCard title="การกระจายตัวของคะแนน" icon={BarChart2}>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={hist} barCategoryGap="15%">
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
              <XAxis dataKey="range" tick={{ fontSize: 10, fill: "#94a3b8" }} tickLine={false} axisLine={false} />
              <YAxis tick={{ fontSize: 10, fill: "#94a3b8" }} tickLine={false} axisLine={false} allowDecimals={false} />
              <Tooltip content={<ChartTooltip formatValue={(v) => `${v} คน`} />} cursor={{ fill: "#f8fafc" }} />
              <Bar dataKey="count" radius={[4, 4, 0, 0]} name="จำนวนนักเรียน">
                {hist.map((entry, i) => <Cell key={i} fill={i >= 6 ? "#22c55e" : i >= 4 ? "#f97316" : "#ef4444"} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          <div className="flex gap-4 justify-center mt-2 flex-wrap">
            {[["#ef4444", "0–39% ไม่ผ่าน"], ["#f97316", "40–59% ใกล้ผ่าน"], ["#22c55e", "60%+ ผ่าน"]].map(([c, l]) => (
              <span key={l} className="flex items-center gap-1.5 text-[11px] text-slate-500">
                <span className="h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: c }} />{l}
              </span>
            ))}
          </div>
        </SectionCard>
        <SectionCard title="คะแนนเฉลี่ยรายหัวข้อ" icon={BookOpen}>
          {topicStats.length === 0 ? (
            <div className="flex flex-col items-center text-center gap-2 py-10">
              <Info className="h-6 w-6 text-slate-300" />
              <p className="text-xs text-slate-400">ยังไม่มีข้อมูลรายหัวข้อ — ต้องตั้งค่า Category ในข้อสอบก่อน</p>
            </div>
          ) : (
            <>
              <p className="text-xs text-slate-400 mb-3">ห้องนี้เข้าใจเรื่องไหนดี และเรื่องไหนที่ควรสอนซ้ำ</p>
              <div className="flex items-center gap-4 mb-4 flex-wrap">
                <span className="flex items-center gap-1.5 text-[11px] text-slate-500">
                  <span className="h-2 w-2 rounded-full bg-emerald-400" /> 70%+ ผ่านเกณฑ์ดี
                </span>
                <span className="flex items-center gap-1.5 text-[11px] text-slate-500">
                  <span className="h-2 w-2 rounded-full bg-amber-400" /> 50–69% พอใช้
                </span>
                <span className="flex items-center gap-1.5 text-[11px] text-slate-500">
                  <span className="h-2 w-2 rounded-full bg-red-400" /> ต่ำกว่า 50% ควรทบทวน
                </span>
              </div>

              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={topicStats} layout="vertical" barCategoryGap="20%">
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
                  <ReferenceLine x={0.6} stroke="#f97316" strokeDasharray="4 3" strokeWidth={1.5} />
                  <XAxis
                    type="number"
                    domain={[0, 1]}
                    tickFormatter={v => `${(v * 100).toFixed(0)}%`}
                    tick={{ fontSize: 10, fill: "#94a3b8" }}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    dataKey="topic"
                    type="category"
                    width={100}
                    tick={{ fontSize: 10, fill: "#475569" }}
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
                        <div className="bg-white border border-slate-200 rounded-xl shadow-lg px-3 py-2 text-xs">
                          <p className="font-semibold text-slate-700 mb-1">{label}</p>
                          <p className="text-slate-600">{fmtPct(pct)}</p>
                          <p className={`mt-1 font-medium ${pct >= 0.7 ? "text-emerald-600" : pct >= 0.5 ? "text-amber-600" : "text-red-500"}`}>
                            → {msg}
                          </p>
                        </div>
                      );
                    }}
                    cursor={{ fill: "#f8fafc" }}
                  />
                  <Bar dataKey="avgPct" radius={[0, 4, 4, 0]} name="คะแนนเฉลี่ย">
                    {topicStats.map((entry, i) => (
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

              {topicStats.some(t => t.avgPct < 0.5) && (
                <div className="mt-3 flex items-start gap-2 bg-red-50 border border-red-100 rounded-xl px-3 py-2.5">
                  <AlertTriangle className="h-3.5 w-3.5 text-red-400 flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-red-600">
                    <span className="font-semibold">
                      {topicStats.filter(t => t.avgPct < 0.5).map(t => t.topic).join(", ")}
                    </span>
                    {" "}— นักเรียนส่วนใหญ่ทำได้ต่ำกว่า 50% ควรพิจารณาสอนซ้ำก่อนสอบครั้งถัดไป
                  </p>
                </div>
              )}
            </>
          )}
        </SectionCard>
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

// ─── Tab: รายคน — "น้องคนนี้เป็นยังไง ต้องช่วยตรงไหน บอกผู้ปกครองว่าอะไร" ──────────
// ตารางมีไว้ "หาคนที่ต้องดูแล" (สถานะ + ตัวกรอง) ส่วนรายละเอียดทั้งหมดอยู่ในหน้าต่างรายคน
// (ตัดคอลัมน์อันดับออกจากตาราง — อันดับไม่ช่วยตัดสินใจว่าต้องช่วยใคร ยังดูได้ในหน้าต่างรายคน)

const STATUS_FILTERS = [
  { id: "all", label: "ทั้งหมด" },
  { id: "attention", label: "ต้องดูแล / ควรติดตาม" },
  { id: "care", label: "ต้องดูแลพิเศษ" },
];

function StudentProgressTab({ examResults, topicResults, aiSummaries, loading, courseName, subjectName, initialStudentId = null }) {
  // ── Hooks ทั้งหมดต้องอยู่บนสุด ก่อน early return ทุกอัน (Rules of Hooks) ──
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selected, setSelected] = useState(initialStudentId);
  const [sortKey, setSortKey] = useState("statusLevel");
  const [sortDir, setSortDir] = useState(-1); // เริ่มด้วย "คนที่ต้องดูแลมากสุดก่อน"

  const crossExamData = useMemo(() => buildRealCrossExamData(examResults, topicResults), [examResults, topicResults]);
  const students = useMemo(() => buildProgressRows(crossExamData, aiSummaries), [crossExamData, aiSummaries]);

  const counts = useMemo(() => ({
    all: students.length,
    attention: students.filter((s) => s.statusLevel >= 1).length,
    care: students.filter((s) => s.statusLevel === 2).length,
  }), [students]);

  const filtered = useMemo(() => {
    const arr = students.filter((s) => {
      if (!s.name.includes(search)) return false;
      if (statusFilter === "attention") return s.statusLevel >= 1;
      if (statusFilter === "care") return s.statusLevel === 2;
      return true;
    });
    return arr.sort((a, b) => {
      let res;
      if (sortKey === "name") res = a.name.localeCompare(b.name, "th");
      else res = (a[sortKey] ?? -Infinity) - (b[sortKey] ?? -Infinity);
      if (res !== 0) return sortDir * res;
      return a.name.localeCompare(b.name, "th");
    });
  }, [students, search, statusFilter, sortKey, sortDir]);

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
      <div className="bg-white border border-slate-200 rounded-xl p-3 shadow-sm space-y-2.5">
        <div className="flex flex-col sm:flex-row gap-2.5">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              value={search} onChange={e => setSearch(e.target.value)}
              placeholder="ค้นหานักเรียน..."
              className="pl-10 pr-4 py-2 w-full bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-orange-400 focus:border-transparent outline-none transition"
            />
          </div>
          <div className="flex gap-1.5 flex-wrap">
            {STATUS_FILTERS.map((f) => (
              <button
                key={f.id}
                onClick={() => setStatusFilter(f.id)}
                className={`px-3 py-2 rounded-lg text-xs font-bold border transition ${statusFilter === f.id ? "bg-orange-500 border-orange-500 text-white" : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"}`}
              >
                {f.label} ({counts[f.id]})
              </button>
            ))}
          </div>
        </div>
        <p className="text-xs text-slate-400 pl-1">
          แสดง {filtered.length} จาก {students.length} คน · "แนวโน้ม" = คะแนนรวมรอบแรกที่สอบ → รอบล่าสุดที่สอบ (หน่วยเป็นจุดเปอร์เซ็นต์) · "สถานะ" ดูจากเกณฑ์ผ่าน, หมวดที่ต่ำกว่า 50%, คะแนนที่ลดลง, การขาดสอบ และจุดเข้าใจผิดจาก AI
        </p>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                {[["name", "ชื่อ"], [null, "สอบแล้ว"], ["latestPct", "คะแนนล่าสุด"], ["scoreChange", "แนวโน้ม"], ["statusLevel", "สถานะ"], [null, ""]].map(([k, label]) => (
                  <th key={label || "action"} onClick={k ? () => handleSort(k) : undefined}
                    className={`text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide ${k ? "cursor-pointer hover:text-slate-700 select-none" : ""}`}>
                    {label}{k && <SortIcon k={k} />}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map(s => {
                const st = STUDENT_STATUS[s.status];
                return (
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
                          <span className="text-slate-400 text-xs ml-1.5">{s.latestLabel}</span>
                        </>
                      ) : "—"}
                    </td>
                    <td className="px-4 py-3">
                      {s.scoreChange == null ? (
                        <span className="text-xs text-slate-300">ยังเทียบไม่ได้</span>
                      ) : s.scoreChange > 0 ? (
                        <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600"><ArrowUpRight className="h-3.5 w-3.5" /> +{s.scoreChange} จุด</span>
                      ) : s.scoreChange < 0 ? (
                        <span className="inline-flex items-center gap-1 text-xs font-semibold text-red-500"><ArrowDownRight className="h-3.5 w-3.5" /> −{Math.abs(s.scoreChange)} จุด</span>
                      ) : (
                        <span className="text-xs text-slate-400">เท่าเดิม</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span title={s.statusReasons.join(" · ")} className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-bold border cursor-default ${st.pill}`}>
                        {st.short}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <button onClick={() => setSelected(s.studentId)} className="flex items-center gap-1 px-2.5 py-1.5 text-[11px] font-bold text-orange-600 bg-orange-50 border border-orange-100 rounded-lg hover:bg-orange-100 transition">
                        <Eye className="h-3.5 w-3.5" /> ดูพัฒนาการ
                      </button>
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr><td colSpan={6} className="px-4 py-8 text-center text-xs text-slate-400">ไม่มีนักเรียนตามเงื่อนไขนี้</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {selected != null && <StudentProgressModal studentId={selected} crossExamData={crossExamData} aiSummaries={aiSummaries} courseName={courseName} subjectName={subjectName} onClose={() => setSelected(null)} />}
    </div>
  );
}

// ─── ตัวช่วยอ่านผล AI (ข้อความอิสระ) ─────────────────────────────────────────
// trend จาก AI เป็นข้อความอิสระ (ไม่มี enum ตายตัว) เดาทิศทางจากคำเพื่อใส่ลูกศรประกอบ
const aiTrendDirection = (trend) => {
  const t = String(trend || "");
  if (/ดีขึ้น|พัฒนา|เพิ่มขึ้น|ก้าวหน้า|สูงขึ้น|ดีมาก|แข็งแรง/.test(t)) return "up";
  if (/ลดลง|แย่ลง|ถดถอย|ต่ำลง|ตกลง|อ่อน|ต้องปรับ/.test(t)) return "down";
  return "flat";
};

const aiSnippet = (text, max = 110) => {
  const t = String(text || "").trim();
  if (t.length <= max) return t;
  return `${t.slice(0, max).trimEnd()}…`;
};

// ประโยคแรกของภาพรวมจาก AI ใช้เป็น "สรุปหนึ่งประโยค"
const aiHeadline = (text) => {
  const t = String(text || "").trim();
  if (!t) return "";
  return aiSnippet(t.split(/(?<=[.!?])\s+|\n+/)[0], 140);
};

// ดึงเลขข้อจากหลักฐานของ AI เช่น "ข้อ 12, 18 และ 24" → ["12","18","24"]
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

const aiActionIcon = (text) => {
  const t = String(text || "");
  if (/ทบทวน|อ่าน|ท่อง|จำ/.test(t)) return BookOpen;
  if (/ฝึก|ทำโจทย์|แบบฝึก|ทำแบบ/.test(t)) return PenLine;
  if (/ตรวจ|เช็ก|เช็ค|ทาน/.test(t)) return CheckCircle;
  if (/ติว|ถาม|ปรึกษา|คุย|สอนเสริม/.test(t)) return Users;
  return Target;
};

const aiTimeHint = (text) => {
  const m = String(text || "").match(/\d+\s*(?:นาที|ชั่วโมง|ชม\.?|ครั้ง|วัน)(?:\s*(?:\/|ต่อ)\s*(?:วัน|สัปดาห์|อาทิตย์|ครั้ง))?/);
  return m ? m[0].replace(/\s+/g, " ") : null;
};

const aiAvg = (arr) => (arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : null);

const AI_BADGE = {
  green: "bg-emerald-50 border-emerald-200 text-emerald-700",
  orange: "bg-orange-50 border-orange-200 text-orange-700",
  blue: "bg-blue-50 border-blue-200 text-blue-600",
};

// ข้อความทั้งฉบับสำหรับปุ่ม "คัดลอกทั้งหมด" (ย้ายมาจาก AiSummaryDetail ที่เลิกใช้แล้ว)
const buildAiFullText = (row, parentMessage) => {
  const L = [];
  L.push(row.nickname ? `${row.studentName} (${row.nickname})` : row.studentName);
  if (row.overview) L.push("", "ภาพรวม", row.overview);
  if (row.byCategory?.length) {
    L.push("", "รายหมวด");
    row.byCategory.forEach((c) => L.push(`- ${c.topic}${c.trend ? ` · ${c.trend}` : ""} — ${c.comment}`));
  }
  if (row.misconceptions?.length) {
    L.push("", "จุดที่น่าจะเข้าใจผิด");
    row.misconceptions.forEach((m) => {
      L.push(`- ${m.topic} — ${m.pattern}`);
      if (m.evidence) L.push(`  หลักฐาน: ${m.evidence}`);
    });
  }
  if (row.behavior) L.push("", "ข้อสังเกตจากเวลาที่ใช้", row.behavior);
  if (row.focusNext?.length) {
    L.push("", "ควรทำต่อ เรียงตามลำดับ");
    row.focusNext.forEach((f, i) => L.push(typeof f === "string" ? `${i + 1}. ${f}` : `${i + 1}. ${f.action}${f.why ? ` — ${f.why}` : ""}`));
  }
  if (parentMessage) L.push("", "ข้อความสำหรับผู้ปกครอง", parentMessage);
  return L.join("\n");
};

// ─── หน้าต่างรายคน — 5 ส่วน แต่ละเรื่องขึ้นที่เดียว ──────────────────────────────
// (รวมใหม่) เดิมมีการ์ดคะแนนรายรอบ + วงแหวน % + เส้นทางอันดับ + กราฟคะแนน (เรื่องเดียวกัน 4 ที่),
// แถบรายหมวดเทียบห้อง + จุดแข็ง/ต้องเสริม + จุดอ่อนค้าง + พัฒนาเร็วสุด + กราฟรายหัวข้อ (5 ที่),
// จังหวะทำข้อสอบ + เวลาเฉลี่ยต่อข้อ (2 ที่) และมุมมอง Info/ข้อความที่ซ้ำกันทั้งชุด
//   1) สรุป        — สถานะ (ไฟ 3 สี) + สรุปจาก AI + ป้ายความสำเร็จ
//   2) คะแนนข้ามรอบ — กราฟนักเรียน vs ค่าเฉลี่ยห้อง + คะแนน/อันดับ/ผ่านเกณฑ์รายรอบ
//   3) รายหมวด      — รอบล่าสุด นักเรียน vs ห้อง + เปลี่ยนไปเท่าไรจากรอบแรก + คำอธิบาย AI
//   4) สิ่งที่ต้องช่วย — จุดเข้าใจผิด + จังหวะการทำข้อสอบ + แผนที่ควรทำต่อ (ข้อความเต็ม)
//   5) ข้อความถึงผู้ปกครอง — แก้ไข/บันทึก/คัดลอก
function StudentProgressModal({ studentId, crossExamData, aiSummaries, courseName, subjectName, onClose }) {
  // hook ต้องอยู่บนสุดก่อน early return เสมอ (Rules of Hooks)
  const [draft, setDraft] = useState(null);          // ข้อความถึงผู้ปกครองที่แก้ค้างไว้ก่อนบันทึก
  const [savedMessage, setSavedMessage] = useState(null); // ค่าที่บันทึกสำเร็จล่าสุด (เผื่อ props ยังไม่รีเฟรช)
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState(null);
  const [showFullOverview, setShowFullOverview] = useState(false);
  const [openTopics, setOpenTopics] = useState(() => new Set());

  const data = crossExamData.find(d => d.studentId === studentId);
  if (!data) return null;

  const exams = data.exams;
  const done = exams.filter((e) => e.submitted);
  const latestIndex = [2, 1, 0].find((i) => exams[i]?.submitted) ?? null;
  const latest = latestIndex != null ? exams[latestIndex] : null;
  const first = done[0] ?? null;
  const missingExams = data.roundsWithData.filter((i) => !exams[i].submitted).map((i) => exams[i].label);

  const aiRow = latestIndex != null
    ? (aiSummaries?.[latestIndex] || []).find((r) => r.userId === studentId) || null
    : null;
  const misconceptions = aiRow?.misconceptions || [];
  const focusNext = aiRow?.focusNext || [];
  const status = computeStudentStatus({ exams, missedRounds: data.missedRounds, misconceptionCount: misconceptions.length });
  const st = STUDENT_STATUS[status.key];
  const change = status.change;

  // ค่าเฉลี่ยห้อง — ใช้กติกาเดียวกับสถิติระดับห้องทุกแท็บ (ไม่นับคนที่ไม่ยินยอม)
  const classRound = (i) => crossExamData.map((d) => d.exams[i]).filter((e) => e?.submitted && e.consent);
  const classAvgPct = (i) => aiAvg(classRound(i).map((e) => e.pct));
  const classTopicAvg = (i, topic) => aiAvg(classRound(i).map((e) => e.topicPcts?.[topic]).filter((v) => v != null));
  const classPace = (i) => aiAvg(classRound(i).map((e) => e.avgTimePerQuestion).filter((v) => v != null));

  // ── 1) ป้ายความสำเร็จ (ไม่มีป้ายอันดับ — ไม่อยากให้ภาพรวมของเด็กผูกกับการแข่งกับเพื่อน)
  const topicPcts = latest?.topicPcts || {};
  const improvedEveryRound = done.length >= 2 && done.every((e, i) => i === 0 || e.pct > done[i - 1].pct);
  let fastestTopic = null;
  if (done.length >= 2) {
    const from = first.topicPcts || {};
    Object.keys(topicPcts).forEach((t) => {
      if (from[t] == null || topicPcts[t] == null) return;
      const d = topicPcts[t] - from[t];
      if (d > 0 && (!fastestTopic || d > fastestTopic.delta)) fastestTopic = { topic: t, delta: d };
    });
  }
  const topicVals = Object.values(topicPcts).filter((v) => v != null);
  const badges = [];
  if (improvedEveryRound) badges.push({ icon: TrendingUp, label: "ดีขึ้นทุกรอบ", tone: "green" });
  if (fastestTopic) badges.push({ icon: Flame, label: `พัฒนาเร็วสุด: ${fastestTopic.topic} +${Math.round(fastestTopic.delta * 100)} จุด`, tone: "orange" });
  if (topicVals.length && topicVals.some((v) => v >= 0.5)) {
    badges.push({ icon: CheckCircle, label: `ถึง 50% แล้ว ${topicVals.filter((v) => v >= 0.5).length} จาก ${topicVals.length} หมวด`, tone: "blue" });
  }

  // ── 2) กราฟคะแนนข้ามรอบ
  const lineData = exams.map((e, i) => ({
    label: e.label,
    pct: e.submitted ? Math.round(e.pct * 1000) / 10 : null,
    cls: classAvgPct(i) != null ? Math.round(classAvgPct(i) * 1000) / 10 : null,
  }));

  // ── 3) รายหมวด — รวมหมวดจากคะแนนรอบล่าสุด + หมวดที่ AI พูดถึง
  const aiTopicMap = new Map((aiRow?.byCategory || []).filter((c) => c.topic).map((c) => [c.topic, c]));
  const topicNames = Array.from(new Set([...Object.keys(topicPcts), ...aiTopicMap.keys()]));
  const topics = topicNames.map((topic) => {
    const pct = topicPcts[topic] ?? null;
    const cls = latestIndex != null ? classTopicAvg(latestIndex, topic) : null;
    const firstPct = first && first !== latest ? first.topicPcts?.[topic] : null;
    const ai = aiTopicMap.get(topic);
    return {
      topic, pct, cls,
      vsClass: pct != null && cls != null ? Math.round((pct - cls) * 100) : null,
      sinceFirst: pct != null && firstPct != null ? Math.round((pct - firstPct) * 100) : null,
      trend: ai?.trend || null,
      comment: ai?.comment || null,
    };
  }).sort((a, b) => (a.pct ?? 2) - (b.pct ?? 2)); // หมวดที่อ่อนสุดขึ้นก่อน

  const toggleTopic = (topic) => setOpenTopics((prev) => {
    const next = new Set(prev);
    if (next.has(topic)) next.delete(topic); else next.add(topic);
    return next;
  });

  // ── 4) จังหวะการทำข้อสอบ (รอบล่าสุด เทียบห้อง + เทียบรอบก่อนของตัวเอง)
  const myPace = latest?.avgTimePerQuestion ?? null;
  const roomPace = latestIndex != null ? classPace(latestIndex) : null;
  const paceRatio = myPace != null && roomPace ? myPace / roomPace : null;
  const pacePos = paceRatio != null ? Math.min(95, Math.max(5, 50 + (paceRatio - 1) * 100)) : null;
  const paceDiff = paceRatio != null ? Math.round((paceRatio - 1) * 100) : null;
  const prevDone = done.length >= 2 ? done[done.length - 2] : null;
  const timeDelta = prevDone && myPace != null && prevDone.avgTimePerQuestion != null ? myPace - prevDone.avgTimePerQuestion : null;
  const pctDelta = prevDone ? latest.pct - prevDone.pct : null;
  const paceNote = timeDelta == null ? null
    : timeDelta < 0 && pctDelta >= 0 ? { tone: "text-emerald-600", text: `เร็วขึ้น ${Math.abs(Math.round(timeDelta))} วิ/ข้อ และคะแนนไม่ลด — เข้าใจแม่นขึ้นจริง` }
      : timeDelta < 0 && pctDelta < 0 ? { tone: "text-red-500", text: `เร็วขึ้น ${Math.abs(Math.round(timeDelta))} วิ/ข้อ แต่คะแนนลดลง — อาจรีบหรือเดา` }
        : { tone: "text-slate-500", text: `${timeDelta > 0 ? "ช้าลง" : "ใช้เวลาเท่าเดิม"} ${timeDelta ? `${Math.abs(Math.round(timeDelta))} วิ/ข้อ ` : ""}จาก${prevDone.label}` };

  // ── 5) ข้อความถึงผู้ปกครอง
  const baselineMessage = savedMessage ?? aiRow?.parentMessage ?? "";
  const parentMessage = draft ?? baselineMessage;
  const dirty = draft != null && draft !== baselineMessage;
  const saveMessage = async () => {
    if (!aiRow) return;
    setSaving(true);
    try {
      await updateAiSummary(aiRow.id, { parentMessage });
      setSavedMessage(parentMessage);
      setDraft(null);
    } catch (err) {
      console.error("Update AI summary failed:", err);
    } finally { setSaving(false); }
  };
  const copyText = async (text, mark) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(mark);
      setTimeout(() => setCopied(null), 2000);
    } catch (err) { console.error("Copy failed:", err); }
  };

  const headline = aiHeadline(aiRow?.overview);
  const hasMoreOverview = aiRow?.overview && aiRow.overview.trim() !== headline;
  const noAiNote = latest
    ? `ยังไม่มีผลวิเคราะห์ AI ของรอบ ${latest.label} — ปกติจะขึ้นเองไม่นานหลังปิดสอบ หรือกด "วิเคราะห์ใหม่" ด้านบน`
    : "นักเรียนคนนี้ยังไม่ได้สอบรอบไหนเลย";

  return (
    <Modal title={`พัฒนาการของ ${data.name}`} icon={TrendingUp} onClose={onClose} wide>
      <div className="flex items-start justify-between gap-3 flex-wrap mb-4">
        {missingExams.length > 0 ? (
          <div className="flex items-start gap-2 bg-amber-50 border border-amber-100 rounded-xl px-3 py-2 flex-1 min-w-[16rem]">
            <AlertTriangle className="h-4 w-4 text-amber-500 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-amber-700">ขาดสอบ: {missingExams.join(", ")}</p>
          </div>
        ) : <span />}
        {aiRow && latest && (
          <button
            onClick={() => exportStudentAiReportPdf({
              name: data.name,
              examLabel: latest.label,
              courseName,
              subjectName,
              examInfo: latest,
              prevTopicPcts: latestIndex > 0 ? exams[latestIndex - 1]?.topicPcts : null,
              aiRow: { ...aiRow, parentMessage: baselineMessage },
            })}
            className="flex items-center gap-1 text-xs font-bold text-orange-600 bg-orange-50 hover:bg-orange-100 border border-orange-200 rounded-lg px-3 py-1.5 transition"
          >
            <Download className="h-3.5 w-3.5" /> รายงานผู้ปกครอง (PDF)
          </button>
        )}
      </div>

      {/* ── 1) สรุป ─────────────────────────────────────────────────────── */}
      <SectionCard title="สรุป" icon={Sparkles} className="mb-4">
        <div className="grid gap-3 md:grid-cols-[14rem_1fr]">
          <div className={`border rounded-xl px-3.5 py-3 ${st.box}`}>
            <div className="flex gap-1.5 mb-2">
              {[0, 1, 2].map((i) => (
                <span key={i} className={`h-3.5 w-3.5 rounded-full ${i === st.level ? STATUS_LIGHT_ON[i] : "bg-slate-200"}`} />
              ))}
            </div>
            <p className={`text-[15px] font-black ${st.text}`}>{st.label}</p>
            <p className="text-[11px] text-slate-600 mt-1 leading-relaxed">{status.reasons.join(" · ")}</p>
          </div>
          <div className="min-w-0">
            {aiRow ? (
              <>
                <p className="text-[11px] font-bold text-orange-700 mb-1 flex items-center gap-1.5">
                  สรุปจาก AI · {latest.label}{aiRow.model && <span className="font-normal text-slate-400">· {aiRow.model}</span>}
                </p>
                <p className="text-sm text-slate-800 leading-relaxed">{showFullOverview ? aiRow.overview : headline}</p>
                {hasMoreOverview && (
                  <button onClick={() => setShowFullOverview((v) => !v)} className="text-[11px] font-semibold text-orange-600 hover:text-orange-700 mt-1">
                    {showFullOverview ? "ย่อ" : "อ่านต่อ"}
                  </button>
                )}
              </>
            ) : (
              <p className="text-xs text-slate-400 leading-relaxed">{noAiNote}</p>
            )}
            {badges.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-3">
                {badges.map((b) => {
                  const BadgeIcon = b.icon;
                  return (
                    <span key={b.label} className={`inline-flex items-center gap-1.5 border rounded-lg px-2.5 py-1 text-[11px] font-bold ${AI_BADGE[b.tone]}`}>
                      <BadgeIcon className="h-3.5 w-3.5" /> {b.label}
                    </span>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </SectionCard>

      {/* ── 2) คะแนนข้ามรอบ ─────────────────────────────────────────────── */}
      {done.length > 0 && (
        <SectionCard title="คะแนนข้ามรอบ" icon={TrendingUp} className="mb-4">
          {change != null && (
            <p className={`text-sm font-bold mb-3 ${change > 0 ? "text-emerald-600" : change < 0 ? "text-red-500" : "text-slate-500"}`}>
              {first.label} {fmtPct(first.pct)} → {latest.label} {fmtPct(latest.pct)}
              {change > 0 ? ` (+${change} จุด)` : change < 0 ? ` (−${Math.abs(change)} จุด)` : " (เท่าเดิม)"}
            </p>
          )}
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={lineData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="label" tick={{ fontSize: 11, fill: "#475569" }} tickLine={false} axisLine={false} />
              <YAxis domain={[0, 100]} tickFormatter={v => `${v}%`} tick={{ fontSize: 10, fill: "#94a3b8" }} tickLine={false} axisLine={false} />
              <ReferenceLine y={PASS_PCT} stroke="#cbd5e1" strokeDasharray="4 3" />
              <Tooltip content={<ChartTooltip formatValue={(v) => (v == null ? "ไม่มีข้อมูล" : `${v}%`)} />} />
              <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: "11px" }} />
              <Line type="monotone" dataKey="cls" stroke="#cbd5e1" strokeWidth={2} strokeDasharray="5 4" dot={{ fill: "#cbd5e1", r: 3 }} connectNulls={false} name="ค่าเฉลี่ยห้อง" />
              <Line type="monotone" dataKey="pct" stroke="#f97316" strokeWidth={2.5} dot={{ fill: "#f97316", r: 5 }} activeDot={{ r: 7 }} connectNulls={false} name={data.name} />
            </LineChart>
          </ResponsiveContainer>
          <div className="grid grid-cols-3 gap-2 mt-3">
            {exams.map((e) => (
              <div key={e.label} className={`rounded-xl px-3 py-2 text-center ${e.submitted ? "bg-slate-50" : "border border-dashed border-slate-200"}`}>
                <p className="text-[11px] font-bold text-slate-500">{e.label}</p>
                {e.submitted ? (
                  <>
                    <p className={`text-base font-black ${e.pct * 100 >= PASS_PCT ? "text-slate-900" : "text-red-600"}`}>{fmtPct(e.pct)}</p>
                    <p className="text-[10px] text-slate-400">
                      {fmtScore(e.totalScore)}/{fmtScore(e.maxScore)} คะแนน{e.rank != null ? ` · อันดับ ${e.rank}/${e.totalStudents}` : ""}
                    </p>
                  </>
                ) : <p className="text-xs text-slate-300 italic mt-1">ยังไม่สอบ</p>}
              </div>
            ))}
          </div>
          <p className="text-[10.5px] text-slate-400 mt-2">เส้นประแนวนอน = เกณฑ์ผ่าน {PASS_PCT}% · ตัวเลขสีแดง = ต่ำกว่าเกณฑ์</p>
        </SectionCard>
      )}

      {/* ── 3) รายหมวด ──────────────────────────────────────────────────── */}
      {latest && (
        <SectionCard title={`รายหมวด (รอบ ${latest.label})`} icon={BookOpen} className="mb-4">
          {topics.length === 0 ? (
            <p className="text-xs text-slate-400">ยังไม่มีข้อมูลรายหมวด — ต้องตั้งค่า Category ในข้อสอบก่อน</p>
          ) : (
            <>
              <div className="flex gap-3 text-[10px] text-slate-500 mb-2.5 flex-wrap">
                <span className="flex items-center gap-1"><span className="inline-block h-1.5 w-3 rounded-full bg-orange-500" />นักเรียน</span>
                <span className="flex items-center gap-1"><span className="inline-block h-1.5 w-3 rounded-full bg-slate-300" />ค่าเฉลี่ยห้อง</span>
                {first && first !== latest && <span>· "จาก{first.label}" = เปลี่ยนไปกี่จุดจากรอบแรกที่สอบ</span>}
                {topics.some((t) => t.comment) && <span className="ml-auto">กดที่หมวดเพื่ออ่านคำอธิบายจาก AI</span>}
              </div>
              <div className="space-y-2.5">
                {topics.map((t) => {
                  const dir = aiTrendDirection(t.trend);
                  const hasPct = t.pct != null;
                  const bar = !hasPct ? "bg-slate-200" : t.pct >= 0.7 ? "bg-emerald-500" : t.pct >= 0.5 ? "bg-amber-400" : "bg-red-500";
                  const open = openTopics.has(t.topic);
                  return (
                    <div key={t.topic}>
                      <button
                        type="button"
                        onClick={() => t.comment && toggleTopic(t.topic)}
                        className={`w-full grid grid-cols-[7rem_1fr_4.5rem] gap-2 items-center text-left ${t.comment ? "cursor-pointer" : "cursor-default"}`}
                      >
                        <span className="min-w-0">
                          <span className="flex items-center gap-1 text-xs font-bold text-slate-700">
                            {t.trend && (dir === "up" ? <ArrowUpRight className="h-3.5 w-3.5 text-emerald-600 flex-shrink-0" />
                              : dir === "down" ? <ArrowDownRight className="h-3.5 w-3.5 text-red-500 flex-shrink-0" />
                                : <Minus className="h-3.5 w-3.5 text-slate-400 flex-shrink-0" />)}
                            <span className="truncate" title={t.topic}>{t.topic}</span>
                          </span>
                          {t.trend && <span className="block text-[9.5px] text-slate-400 truncate" title={t.trend}>AI: {t.trend}</span>}
                        </span>
                        <span className="flex flex-col gap-1">
                          <span className="h-2.5 rounded-full bg-slate-100 overflow-hidden">
                            <span className={`block h-full rounded-full ${bar}`} style={{ width: hasPct ? `${Math.round(t.pct * 100)}%` : "0%" }} />
                          </span>
                          {t.cls != null && (
                            <span className="h-1.5 rounded-full bg-slate-100 overflow-hidden">
                              <span className="block h-full rounded-full bg-slate-300" style={{ width: `${Math.round(t.cls * 100)}%` }} />
                            </span>
                          )}
                        </span>
                        <span className="text-right leading-tight">
                          <span className="block text-[11px] font-black text-slate-700">{hasPct ? `${Math.round(t.pct * 100)}%` : "—"}</span>
                          {t.vsClass != null && (
                            <span className={`block text-[9.5px] font-bold ${t.vsClass >= 0 ? "text-emerald-600" : "text-red-500"}`}>
                              {t.vsClass >= 0 ? "+" : ""}{t.vsClass} จากห้อง
                            </span>
                          )}
                          {t.sinceFirst != null && (
                            <span className={`block text-[9.5px] font-semibold ${t.sinceFirst > 0 ? "text-emerald-600" : t.sinceFirst < 0 ? "text-red-500" : "text-slate-400"}`}>
                              {t.sinceFirst > 0 ? "+" : ""}{t.sinceFirst} จาก{first.label.replace(/-test$/i, "")}
                            </span>
                          )}
                        </span>
                      </button>
                      {open && t.comment && (
                        <p className="mt-1.5 sm:ml-[7.5rem] text-[11px] text-slate-500 bg-slate-50 rounded-lg px-2.5 py-1.5 leading-relaxed">{t.comment}</p>
                      )}
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </SectionCard>
      )}

      {/* ── 4) สิ่งที่ต้องช่วย ────────────────────────────────────────────── */}
      {latest && (
        <SectionCard title="สิ่งที่ต้องช่วย" icon={Target} className="mb-4">
          <div className="space-y-4">
            <div>
              <p className="text-[11px] font-bold text-slate-500 mb-2 flex items-center gap-1.5"><AlertTriangle className="h-3.5 w-3.5" /> จุดที่น่าจะเข้าใจผิด (AI)</p>
              {!aiRow ? (
                <p className="text-xs text-slate-400">{noAiNote}</p>
              ) : misconceptions.length === 0 ? (
                <p className="text-xs text-slate-400">AI ไม่พบรูปแบบการตอบผิดที่ซ้ำกัน</p>
              ) : (
                <div className="grid gap-2 sm:grid-cols-2">
                  {misconceptions.map((m, i) => {
                    const refs = aiQuestionRefs(m.evidence);
                    return (
                      <div key={i} className="bg-red-50 border border-red-100 rounded-xl p-2.5">
                        <p className="text-xs font-black text-red-800">{m.topic}</p>
                        <p className="text-[11.5px] text-red-900/80 leading-relaxed mt-0.5">{m.pattern}</p>
                        {refs.length > 0 ? (
                          <div className="flex flex-wrap gap-1 mt-1.5">
                            {refs.map((n) => <span key={n} className="text-[10px] font-bold bg-white border border-red-200 text-red-600 rounded-md px-1.5 py-0.5">ข้อ {n}</span>)}
                          </div>
                        ) : m.evidence ? <p className="text-[10.5px] text-red-700/70 mt-1">หลักฐาน: {m.evidence}</p> : null}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {(paceRatio != null || paceNote || aiRow?.behavior) && (
              <div>
                <p className="text-[11px] font-bold text-slate-500 mb-2 flex items-center gap-1.5"><Timer className="h-3.5 w-3.5" /> จังหวะการทำข้อสอบ ({latest.label})</p>
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
                      <span>เฉลี่ยห้อง {Math.round(roomPace)} วิ/ข้อ</span>
                      <span>ช้ากว่าห้อง</span>
                    </div>
                    <p className="text-[11px] font-semibold text-slate-700 mt-2">
                      {paceDiff === 0 ? "ใช้เวลาใกล้เคียงค่าเฉลี่ยห้อง" : paceDiff > 0 ? `ช้ากว่าค่าเฉลี่ยห้อง ${paceDiff}%` : `เร็วกว่าค่าเฉลี่ยห้อง ${Math.abs(paceDiff)}%`}
                    </p>
                  </>
                )}
                {paceNote && <p className={`text-[11px] font-semibold mt-1 ${paceNote.tone}`}>{paceNote.text}</p>}
                {aiRow?.behavior && <p className="text-[11px] text-slate-600 leading-relaxed mt-1">AI: {aiRow.behavior}</p>}
              </div>
            )}

            {focusNext.length > 0 && (
              <div>
                <p className="text-[11px] font-bold text-slate-500 mb-2 flex items-center gap-1.5"><Target className="h-3.5 w-3.5" /> แผนที่ควรทำต่อ (AI)</p>
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
                        {why && <p className="text-[10.5px] text-slate-500 leading-snug mt-0.5">{why}</p>}
                        {time && (
                          <span className="inline-flex items-center gap-1 text-[9.5px] font-bold text-orange-700 bg-white border border-orange-200 rounded-full px-1.5 py-0.5 mt-1.5">
                            <Clock className="h-3 w-3" /> {time}
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </SectionCard>
      )}

      {/* ── 5) ข้อความถึงผู้ปกครอง ──────────────────────────────────────── */}
      {aiRow && (
        <SectionCard
          title="ข้อความถึงผู้ปกครอง"
          icon={MessageCircle}
          action={
            <div className="flex items-center gap-2">
              <button
                onClick={() => copyText(buildAiFullText(aiRow, parentMessage), "all")}
                className="flex items-center gap-1 text-xs font-semibold text-slate-500 hover:text-slate-700"
              >
                {copied === "all" ? "คัดลอกทั้งฉบับแล้ว" : "คัดลอกทั้งฉบับ"}
              </button>
              <button
                onClick={() => copyText(`${aiRow.nickname || aiRow.studentName}\n\n${parentMessage}`, "message")}
                disabled={!parentMessage}
                className="flex items-center gap-1 text-xs font-bold text-white bg-orange-500 hover:bg-orange-600 rounded-lg px-2.5 py-1 transition disabled:opacity-40"
              >
                {copied === "message" ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />} {copied === "message" ? "คัดลอกแล้ว" : "คัดลอกข้อความ"}
              </button>
            </div>
          }
        >
          <textarea
            value={parentMessage}
            rows={5}
            onChange={(e) => setDraft(e.target.value)}
            className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm leading-relaxed focus:outline-none focus:ring-2 focus:ring-orange-300"
          />
          <div className="flex items-center justify-between gap-2 mt-2 flex-wrap">
            <span className="text-[10.5px] text-slate-400">
              {(parentMessage || "").length} ตัวอักษร · AI ร่างให้ ครูอ่านทบทวนก่อนส่งทุกครั้ง · กด "วิเคราะห์ใหม่" จะเขียนทับข้อความที่แก้ไว้
            </span>
            {dirty && (
              <button
                onClick={saveMessage}
                disabled={saving}
                className="flex items-center gap-1 text-xs font-bold text-orange-700 bg-white border border-orange-200 hover:bg-orange-50 rounded-lg px-3 py-1.5 disabled:opacity-40"
              >
                <Pencil className="h-3.5 w-3.5" /> {saving ? "กำลังบันทึก…" : "บันทึกข้อความ"}
              </button>
            )}
          </div>
        </SectionCard>
      )}
    </Modal>
  );
}

// ─── Tab: เปรียบเทียบ — "ตลอดคอร์ส ห้องนี้เก่งขึ้นจริงไหม ตรงไหน" ──────────────────
// ดูเฉพาะ "การเปลี่ยนแปลง" ของกลุ่มเดียวกันทุกรอบ (ตัวเลขของรอบเดียวแบบเดี่ยวๆ อยู่แท็บภาพรวม)
// (ตัดการ์ดคะแนนเฉลี่ยแยกรายรอบออก — ซ้ำกับแท็บภาพรวม, เปลี่ยนกราฟเส้นรายหัวข้อเป็นตาราง
//  หมวด × รอบ เพราะกราฟเส้นที่แกน X เป็นชื่อหมวดอ่านยากเมื่อมีหลายหมวด)
const heatCell = (v) => (v == null ? "bg-slate-50 text-slate-300" : v >= 0.7 ? "bg-emerald-100 text-emerald-800" : v >= 0.5 ? "bg-amber-100 text-amber-800" : "bg-red-100 text-red-700");

function ComparisonTab({ examResults, topicResults, loading }) {
  // ── Hooks ก่อน early return ทั้งหมด ──
  const cmp = useMemo(() => buildCohortComparison(examResults, topicResults), [examResults, topicResults]);

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-28 bg-slate-100 rounded-2xl" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="h-64 bg-slate-100 rounded-2xl" />
          <div className="h-64 bg-slate-100 rounded-2xl" />
        </div>
      </div>
    );
  }

  if (cmp.rounds.length < 2) {
    return (
      <div className="flex flex-col items-center text-center gap-3 bg-slate-50 border border-dashed border-slate-200 rounded-2xl p-10">
        <TrendingUp className="h-10 w-10 text-slate-300" />
        <p className="text-sm font-semibold text-slate-600">ยังมีข้อมูลไม่พอเปรียบเทียบ</p>
        <p className="text-xs text-slate-400 max-w-sm">ต้องมีอย่างน้อย 2 รอบสอบที่มีคนส่งข้อสอบแล้ว ถึงจะเทียบพัฒนาการได้</p>
      </div>
    );
  }

  if (cmp.cohortSize === 0) {
    return (
      <div className="flex gap-2 bg-blue-50 border border-blue-100 rounded-xl p-3">
        <Info className="h-4 w-4 text-blue-500 flex-shrink-0 mt-0.5" />
        <p className="text-xs text-blue-700">ยังไม่มีนักเรียนที่สอบครบทุกรอบ ({cmp.labels.join(", ")}) — ต้องมีอย่างน้อย 1 คนที่สอบครบ ถึงจะเทียบพัฒนาการของห้องได้แบบไม่เอนเอียง</p>
      </div>
    );
  }

  const gainTone = cmp.avgGain > 0 ? "text-emerald-600" : cmp.avgGain < 0 ? "text-red-500" : "text-slate-600";

  return (
    <div className="space-y-6">
      {/* หัวแท็บ: กลุ่มที่ใช้เทียบ + คะแนนเพิ่มเฉลี่ย + ค่าเฉลี่ยของกลุ่มนี้แต่ละรอบ */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
        <div className="flex flex-col md:flex-row md:items-center gap-5">
          <div className="md:w-56 flex-shrink-0">
            <p className="text-xs text-slate-500 font-medium">คะแนนเพิ่มเฉลี่ย ({cmp.fromLabel} → {cmp.toLabel})</p>
            <p className={`text-3xl font-black ${gainTone}`}>{cmp.avgGain > 0 ? "+" : ""}{cmp.avgGain} <span className="text-base">จุด</span></p>
            <p className="text-[11px] text-slate-400 mt-0.5">จากนักเรียน {cmp.cohortSize} คนที่สอบครบทุกรอบ</p>
          </div>
          <div className="flex-1 flex items-center gap-2 flex-wrap">
            {cmp.roundAvg.map((r, i) => (
              <div key={r.label} className="flex items-center gap-2">
                {i > 0 && <ChevronRight className="h-4 w-4 text-slate-300" />}
                <div className="bg-slate-50 rounded-xl px-4 py-2.5 text-center">
                  <p className="text-[11px] font-bold text-slate-500">{r.label}</p>
                  <p className="text-lg font-black text-slate-900">{r.pct != null ? fmtPct(r.pct) : "—"}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
        <p className="text-[11px] text-slate-400 mt-3 flex items-start gap-1.5">
          <Info className="h-3.5 w-3.5 flex-shrink-0 mt-px" />
          ทุกตัวเลขในแท็บนี้นับเฉพาะคนที่สอบครบทุกรอบ เพื่อให้เทียบกลุ่มเดียวกันจริง
          {cmp.excludedCount > 0 ? ` (ไม่นับ ${cmp.excludedCount} คนที่ขาดบางรอบ)` : ""} และไม่นับคนที่ไม่ยินยอมให้เก็บข้อมูลพฤติกรรมระหว่างสอบ · ค่าเฉลี่ยจึงอาจต่างจากแท็บภาพรวมที่นับทุกคนในรอบนั้น
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <SectionCard title={`ดีขึ้น / ลดลง / เท่าเดิม`} icon={Users}>
          <div className="grid grid-cols-3 gap-3">
            {[
              { n: cmp.improved, p: cmp.improvedPct, label: "ดีขึ้น", box: "bg-emerald-50 border-emerald-100", num: "text-emerald-700", icon: <ArrowUpRight className="h-4 w-4 text-white" />, iconBg: "bg-emerald-500" },
              { n: cmp.declined, p: cmp.declinedPct, label: "ลดลง", box: "bg-red-50 border-red-100", num: "text-red-600", icon: <ArrowDownRight className="h-4 w-4 text-white" />, iconBg: "bg-red-400" },
              { n: cmp.same, p: cmp.samePct, label: "เท่าเดิม", box: "bg-slate-50 border-slate-100", num: "text-slate-700", icon: <span className="text-white text-sm font-bold">=</span>, iconBg: "bg-slate-400" },
            ].map((b) => (
              <div key={b.label} className={`border rounded-2xl p-4 text-center ${b.box}`}>
                <div className={`h-8 w-8 rounded-xl flex items-center justify-center mx-auto mb-2 ${b.iconBg}`}>{b.icon}</div>
                <p className={`text-2xl font-black ${b.num}`}>{b.n}</p>
                <p className="text-xs text-slate-500 font-semibold">คน {b.label}</p>
                <p className="text-[11px] text-slate-400">{b.p}%</p>
              </div>
            ))}
          </div>
          <p className="text-[11px] text-slate-400 mt-3">เทียบคะแนนรวม % ของแต่ละคนเองระหว่าง {cmp.fromLabel} กับ {cmp.toLabel} (ไม่ได้เทียบกับเพื่อน)</p>
        </SectionCard>

        <SectionCard
          title="คะแนนเปลี่ยนไปกี่จุด"
          icon={BarChart2}
          tooltip="แต่ละแท่ง = จำนวนนักเรียนที่คะแนนเปลี่ยนไปในช่วงนั้น ถ้าแท่งกองอยู่ฝั่งขวาทั้งห้อง แปลว่าดีขึ้นกันถ้วนหน้า ถ้ากระจายสองฝั่ง แปลว่าบางกลุ่มดีขึ้นแต่บางกลุ่มยังไม่ขยับ"
        >
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={cmp.gainBins} barCategoryGap="15%">
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
              <XAxis dataKey="label" tick={{ fontSize: 10, fill: "#94a3b8" }} tickLine={false} axisLine={false} interval={0} />
              <YAxis tick={{ fontSize: 10, fill: "#94a3b8" }} tickLine={false} axisLine={false} allowDecimals={false} />
              <Tooltip content={<ChartTooltip formatValue={(v) => `${v} คน`} />} cursor={{ fill: "#f8fafc" }} />
              <Bar dataKey="count" radius={[4, 4, 0, 0]} name="จำนวนนักเรียน">
                {cmp.gainBins.map((b, i) => <Cell key={i} fill={b.tone === "up" ? "#22c55e" : b.tone === "down" ? "#ef4444" : "#94a3b8"} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          <p className="text-[11px] text-slate-400 mt-1 text-center">หน่วย: จุดเปอร์เซ็นต์ ({cmp.fromLabel} → {cmp.toLabel})</p>
        </SectionCard>
      </div>

      {cmp.topicRows.length === 0 ? (
        <div className="flex gap-2 bg-blue-50 border border-blue-100 rounded-xl p-3">
          <Info className="h-4 w-4 text-blue-500 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-blue-700">ยังไม่มีข้อมูลรายหัวข้อ — ต้องตั้งค่า Category ในข้อสอบก่อน</p>
        </div>
      ) : (
        <SectionCard title="พัฒนาการรายหมวด (หมวด × รอบ)" icon={BookOpen}>
          <p className="text-xs text-slate-400 mb-3">เรียงจากหมวดที่ขยับน้อยที่สุดขึ้นก่อน — หมวดบนสุดคือที่ควรปรับวิธีสอนหรือเพิ่มเวลา</p>
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-separate border-spacing-1">
              <thead>
                <tr>
                  <th className="text-left px-2 py-1.5 text-xs font-semibold text-slate-500">หมวด</th>
                  {cmp.labels.map((l) => <th key={l} className="px-2 py-1.5 text-xs font-semibold text-slate-500 text-center">{l}</th>)}
                  <th className="px-2 py-1.5 text-xs font-semibold text-slate-500 text-center">เปลี่ยนไป</th>
                </tr>
              </thead>
              <tbody>
                {cmp.topicRows.map((r) => (
                  <tr key={r.topic}>
                    <td className="px-2 py-2 text-xs font-semibold text-slate-700">{r.topic}</td>
                    {r.values.map((v, i) => (
                      <td key={i} className={`px-2 py-2 text-xs font-bold text-center rounded-lg ${heatCell(v)}`}>{v != null ? `${Math.round(v * 100)}%` : "—"}</td>
                    ))}
                    <td className={`px-2 py-2 text-xs font-black text-center ${r.delta == null ? "text-slate-300" : r.delta > 0 ? "text-emerald-600" : r.delta < 0 ? "text-red-500" : "text-slate-500"}`}>
                      {r.delta == null ? "—" : `${r.delta > 0 ? "+" : ""}${r.delta} จุด`}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="flex items-center gap-4 mt-3 flex-wrap">
            {[["bg-emerald-100", "70%+"], ["bg-amber-100", "50–69%"], ["bg-red-100", "ต่ำกว่า 50%"]].map(([c, l]) => (
              <span key={l} className="flex items-center gap-1.5 text-[11px] text-slate-500"><span className={`h-2.5 w-2.5 rounded-sm ${c}`} />{l}</span>
            ))}
          </div>
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

  // ตัวเลขสรุปใช้ computeRoundStats ตัวเดียวกับแท็บภาพรวม (กลุ่มคนเดียวกัน ตัวเลขตรงกันเสมอ)
  const rs = computeRoundStats(results, topicBreakdown);
  const { avgPct, sdPct, passRate, maxPct, minPct } = rs;
  const hist = buildHistogram(rs.pcts.map((pct) => ({ pct })));
  const topicStats = computeTopicStatsReal(rs.topicBreakdown);

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
      <div class="summary-card"><div class="label">มัธยฐาน · SD</div><div class="value">${rs.medianPct != null ? fmtPct(rs.medianPct) : "—"} · ${fmtPct(sdPct)}</div></div>
    </div>
    <p style="color:#6b7280;font-size:11px;margin:-16px 0 16px;">เข้าสอบ ${rs.submittedCount}${rs.enrolledCount ? `/${rs.enrolledCount}` : ""} คน · ขาดสอบ ${rs.absentCount} คน${rs.excludedCount ? ` · ตัวเลขสรุปไม่นับ ${rs.excludedCount} คนที่ไม่ยินยอมให้เก็บข้อมูลพฤติกรรม` : ""}</p>
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

// Export PDF สำหรับแท็บ "เปรียบเทียบ" — ใช้ข้อมูลชุดเดียวกับตัวแท็บ (buildCohortComparison)
const exportComparisonToPdf = (cmp, courseName, subjectName) => {
  if (!cmp || cmp.rounds.length < 2) return;
  const noCohort = !cmp.cohortSize;
  const summaryBlock = noCohort
    ? `<p style="color:#6b7280;font-size:12px;">ยังไม่มีนักเรียนที่สอบครบทุกรอบ (${cmp.labels.join(", ")})</p>`
    : `<div class="summary-grid">
        <div class="summary-card"><div class="label">คะแนนเพิ่มเฉลี่ย (${cmp.fromLabel} → ${cmp.toLabel})</div><div class="value">${cmp.avgGain > 0 ? "+" : ""}${cmp.avgGain} จุด</div></div>
        ${cmp.roundAvg.map((r) => `<div class="summary-card"><div class="label">ค่าเฉลี่ยกลุ่มนี้ · ${r.label}</div><div class="value">${r.pct != null ? fmtPct(r.pct) : "—"}</div></div>`).join("")}
      </div>
      <table><thead><tr><th>ผล</th><th style="text-align:right">จำนวนคน</th><th style="text-align:right">สัดส่วน</th></tr></thead><tbody>
        <tr><td>ดีขึ้น</td><td style="text-align:right">${cmp.improved} คน</td><td style="text-align:right">${cmp.improvedPct}%</td></tr>
        <tr><td>ลดลง</td><td style="text-align:right">${cmp.declined} คน</td><td style="text-align:right">${cmp.declinedPct}%</td></tr>
        <tr><td>เท่าเดิม</td><td style="text-align:right">${cmp.same} คน</td><td style="text-align:right">${cmp.samePct}%</td></tr>
      </tbody></table>
      <p style="color:#9ca3af;font-size:11px;margin-top:6px;">นับเฉพาะนักเรียน ${cmp.cohortSize} คนที่สอบครบทุกรอบ${cmp.excludedCount ? ` (ไม่นับ ${cmp.excludedCount} คนที่ขาดบางรอบ)` : ""} และไม่นับคนที่ไม่ยินยอมให้เก็บข้อมูลพฤติกรรมระหว่างสอบ</p>
      <h2>คะแนนเปลี่ยนไปกี่จุด</h2>
      <table><thead><tr><th>ช่วง (จุดเปอร์เซ็นต์)</th><th style="text-align:right">จำนวนคน</th></tr></thead><tbody>
        ${cmp.gainBins.map((b) => `<tr><td>${b.label}</td><td style="text-align:right">${b.count} คน</td></tr>`).join("")}
      </tbody></table>`;

  const topicRows = !noCohort && cmp.topicRows.length
    ? cmp.topicRows.map((r) => `<tr><td>${r.topic}</td>${r.values.map((v) => `<td style="text-align:right">${v != null ? `${Math.round(v * 100)}%` : "—"}</td>`).join("")}<td style="text-align:right">${r.delta == null ? "—" : `${r.delta > 0 ? "+" : ""}${r.delta} จุด`}</td></tr>`).join("")
    : `<tr><td colspan="${cmp.labels.length + 2}" style="text-align:center;color:#94a3b8">ยังไม่มีข้อมูลรายหัวข้อ</td></tr>`;

  const printWindow = window.open("", "_blank");
  const today = new Date().toLocaleDateString("th-TH", { day: "numeric", month: "long", year: "numeric" });
  printWindow.document.write(`<!DOCTYPE html><html><head><meta charset="UTF-8"><title>เปรียบเทียบพัฒนาการทั้งห้อง</title>
    <link href="https://fonts.googleapis.com/css2?family=Sarabun:wght@400;600;700&display=swap" rel="stylesheet">
    <style>* { box-sizing:border-box;margin:0;padding:0; } body{font-family:'Sarabun',sans-serif;padding:32px;font-size:13px;color:#1f2937;}
    .header{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:24px;border-bottom:2px solid #f97316;padding-bottom:16px;}
    .header h1{font-size:22px;font-weight:700;color:#f97316;} .header p{font-size:12px;color:#6b7280;margin-top:4px;}
    .summary-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin-bottom:16px;}
    .summary-card{background:#fff7ed;border:1px solid #fed7aa;border-radius:8px;padding:12px 14px;}
    .summary-card .label{font-size:11px;color:#9a3412;margin-bottom:4px;} .summary-card .value{font-size:16px;font-weight:700;color:#ea580c;}
    h2{font-size:15px;font-weight:700;color:#1f2937;margin-bottom:10px;margin-top:24px;padding-left:10px;border-left:3px solid #f97316;}
    table{width:100%;border-collapse:collapse;margin-bottom:8px;} th{background:#f97316;color:white;padding:8px 10px;text-align:left;font-size:11px;font-weight:600;}
    td{padding:7px 10px;border-bottom:1px solid #e5e7eb;font-size:12px;} tr:nth-child(even) td{background:#fff7ed;}
    .footer{margin-top:28px;padding-top:12px;border-top:1px solid #e5e7eb;font-size:11px;color:#9ca3af;text-align:center;}
    @media print{body{padding:16px;}}</style></head><body>
    <div class="header"><div><h1>เปรียบเทียบพัฒนาการทั้งห้อง (${cmp.labels.join(" → ")})</h1><p>${courseName || ""}${subjectName ? ` · ${subjectName}` : ""} &nbsp;|&nbsp; ออกรายงานวันที่: ${today}</p></div></div>
    <h2>ภาพรวมพัฒนาการ</h2>
    ${summaryBlock}
    <h2>พัฒนาการรายหมวด (เรียงจากขยับน้อยสุด)</h2>
    <table><thead><tr><th>หมวด</th>${cmp.labels.map((l) => `<th style="text-align:right">${l}</th>`).join("")}<th style="text-align:right">เปลี่ยนไป</th></tr></thead>
    <tbody>${topicRows}</tbody></table>
    <div class="footer">ออกรายงานโดยระบบจัดการติวเตอร์ &nbsp;|&nbsp; ${today}</div>
    <script>window.onload = () => window.print();</script></body></html>`);
  printWindow.document.close();
};

// Export PDF สำหรับแท็บ "รายคน" — ตารางเดียวกับในแท็บ (ใช้ buildProgressRows ตัวเดียวกัน)
const exportProgressToPdf = (students, courseName, subjectName) => {
  if (!students || !students.length) return;

  const rows = [...students].sort((a, b) => (b.statusLevel - a.statusLevel) || a.name.localeCompare(b.name, "th")).map((s) => {
    const trend = s.scoreChange == null
      ? "ยังเทียบไม่ได้"
      : s.scoreChange > 0 ? `+${s.scoreChange} จุด`
        : s.scoreChange < 0 ? `−${Math.abs(s.scoreChange)} จุด`
          : "เท่าเดิม";
    const trendColor = s.scoreChange == null ? "#94a3b8" : s.scoreChange > 0 ? "#16a34a" : s.scoreChange < 0 ? "#dc2626" : "#64748b";
    const statusColor = s.statusLevel === 2 ? "#dc2626" : s.statusLevel === 1 ? "#d97706" : "#16a34a";
    return `<tr>
      <td>${s.name}</td>
      <td style="text-align:center">${s.submittedCount}/${s.totalExams} รอบ</td>
      <td style="text-align:right">${s.latestPct != null ? `${fmtPct(s.latestPct)} (${s.latestLabel})` : "—"}</td>
      <td style="text-align:center;color:${trendColor}">${trend}</td>
      <td style="color:${statusColor}"><b>${STUDENT_STATUS[s.status].short}</b><br><span style="color:#6b7280;font-size:10px">${s.statusReasons.join(" · ")}</span></td>
    </tr>`;
  }).join("");

  const printWindow = window.open("", "_blank");
  const today = new Date().toLocaleDateString("th-TH", { day: "numeric", month: "long", year: "numeric" });
  printWindow.document.write(`<!DOCTYPE html><html><head><meta charset="UTF-8"><title>พัฒนาการรายคน</title>
    <link href="https://fonts.googleapis.com/css2?family=Sarabun:wght@400;600;700&display=swap" rel="stylesheet">
    <style>* { box-sizing:border-box;margin:0;padding:0; } body{font-family:'Sarabun',sans-serif;padding:32px;font-size:13px;color:#1f2937;}
    .header{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:24px;border-bottom:2px solid #f97316;padding-bottom:16px;}
    .header h1{font-size:22px;font-weight:700;color:#f97316;} .header p{font-size:12px;color:#6b7280;margin-top:4px;}
    table{width:100%;border-collapse:collapse;margin-bottom:8px;} th{background:#f97316;color:white;padding:8px 10px;text-align:left;font-size:11px;font-weight:600;}
    td{padding:7px 10px;border-bottom:1px solid #e5e7eb;font-size:12px;vertical-align:top;} tr:nth-child(even) td{background:#fff7ed;}
    .footer{margin-top:28px;padding-top:12px;border-top:1px solid #e5e7eb;font-size:11px;color:#9ca3af;text-align:center;}
    @media print{body{padding:16px;}}</style></head><body>
    <div class="header"><div><h1>พัฒนาการรายคน (Pre → Mid → Post)</h1><p>${courseName || ""}${subjectName ? ` · ${subjectName}` : ""} &nbsp;|&nbsp; ออกรายงานวันที่: ${today}</p></div></div>
    <table><thead><tr><th>ชื่อ</th><th style="text-align:center">สอบแล้ว</th><th style="text-align:right">คะแนนล่าสุด</th><th style="text-align:center">แนวโน้ม</th><th>สถานะ</th></tr></thead>
    <tbody>${rows}</tbody></table>
    <p style="color:#9ca3af;font-size:11px;">แนวโน้ม = คะแนนรวมรอบแรกที่สอบ → รอบล่าสุดที่สอบ (จุดเปอร์เซ็นต์)</p>
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
// "ส่งออกรายงานผู้ปกครองทั้งห้อง" (แท็บ "รายคน" ใน ExamAnalyticsView) — โค้ดสร้างหน้า
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

// ปุ่ม "ส่งออกรายงานผู้ปกครองทั้งห้อง (PDF)" — เรียกจากแท็บ "รายคน" สโคปตามรอบที่เลือกอยู่
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
  initialStudentId = null,
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
  const comparisonForExport = useMemo(() => buildCohortComparison(examResults, topicResults), [examResults, topicResults]);
  // หมายเหตุ: export ฝั่ง "รายคน" เป็นรายชื่อทั้งหมดเสมอ ไม่ได้กรองตามช่องค้นหา/ตัวกรองในแท็บ
  const progressRowsForExport = useMemo(() => buildProgressRows(crossExamDataForExport, aiSummaries), [crossExamDataForExport, aiSummaries]);

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
            onClick={() => exportComparisonToPdf(comparisonForExport, courseName, subjectName)}
            disabled={dataLoading || comparisonForExport.rounds.length < 2}
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

      {/* แถบ AI ของห้อง — สถานะ + ปุ่ม "วิเคราะห์ใหม่" + "ส่งออกรายงานผู้ปกครองทั้งห้อง (PDF)"
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

      {/* Content */}
      {activeTab === "overview" && <OverviewTab results={examResults[examId]} topicBreakdown={topicResults[examId]} loading={dataLoading} />}
      {activeTab === "compare" && <ComparisonTab examResults={examResults} topicResults={topicResults} loading={dataLoading} />}
      {activeTab === "progress" && <StudentProgressTab examResults={examResults} topicResults={topicResults} aiSummaries={aiSummaries} loading={dataLoading} courseName={courseName} subjectName={subjectName} initialStudentId={initialStudentId} />}
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
  // เปิดหน้าต่างรายคนของนักเรียนคนนี้ทันที (มาจากปุ่ม "ดูพัฒนาการเต็ม" ในหน้ารอบสอบ)
  const initialStudentId = searchParams.get("studentId") ? Number(searchParams.get("studentId")) : null;

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
      initialStudentId={initialStudentId}
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
