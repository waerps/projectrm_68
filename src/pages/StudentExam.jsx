import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useRef, useState, useCallback } from "react";
import { Check, AlertCircle, Clock, ChevronLeft, ChevronRight, CheckCircle2 } from "lucide-react";

import {
  getCurrentUserId, formatTime,
  fetchExamByToken, startExam, saveAnswer, submitExam, fetchExamResult,
} from "../utils/studentExamShared";

const OPTION_LABELS = ["A", "B", "C", "D"];

// ─── Landing screen (before starting / resuming) ────────────────────────────

function LandingCard({ status, exam, onStart, starting }) {
  return (
    <div className="max-w-md mx-auto mt-24 bg-white border border-neutral-200 rounded-2xl p-6 text-center space-y-4">
      <h1 className="text-lg font-bold text-neutral-900">{exam.name}</h1>
      <div className="flex justify-center gap-6 text-sm text-neutral-600">
        <div className="flex items-center gap-1.5"><Clock className="h-4 w-4 text-neutral-400" />{exam.duration} นาที</div>
        <div>{exam.totalQuestions} ข้อ</div>
      </div>
      {status === "in-progress" && (
        <div className="flex gap-2 bg-amber-50 border border-amber-200 rounded-xl p-3 text-left">
          <AlertCircle className="h-4 w-4 text-amber-500 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-amber-700">คุณเข้าสอบชุดนี้ไปแล้ว กดปุ่มด้านล่างเพื่อทำต่อจากเดิม</p>
        </div>
      )}
      <button
        onClick={onStart}
        disabled={starting}
        className="w-full bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white rounded-xl py-3 text-sm font-semibold transition"
      >
        {starting ? "กำลังเข้าสู่ห้องสอบ…" : status === "in-progress" ? "ทำข้อสอบต่อ" : "เริ่มทำข้อสอบ"}
      </button>
    </div>
  );
}

// ─── Taking the exam ─────────────────────────────────────────────────────────

function ExamRunner({ examJoinId, userId, joinedAt, durationMinutes, questions: initialQuestions, onSubmitted }) {
  const [questions, setQuestions] = useState(initialQuestions);
  const [activeIdx, setActiveIdx] = useState(0);
  const [remainingSec, setRemainingSec] = useState(() => {
    const deadline = new Date(joinedAt).getTime() + durationMinutes * 60 * 1000;
    return Math.max(0, Math.round((deadline - Date.now()) / 1000));
  });
  const [submitting, setSubmitting] = useState(false);
  const [confirmSubmit, setConfirmSubmit] = useState(false);
  const [error, setError] = useState("");
  const submittedRef = useRef(false);

  const current = questions[activeIdx];
  const answeredCount = questions.filter((q) => q.selected !== null && q.selected !== undefined).length;

  const doSubmit = useCallback(async () => {
    if (submittedRef.current) return;
    submittedRef.current = true;
    setSubmitting(true);
    try {
      const result = await submitExam(examJoinId, userId);
      onSubmitted(result);
    } catch (err) {
      console.error("Submit failed:", err);
      setError("ส่งข้อสอบไม่สำเร็จ กรุณาลองใหม่อีกครั้ง");
      submittedRef.current = false;
    } finally {
      setSubmitting(false);
    }
  }, [examJoinId, userId, onSubmitted]);

  // Countdown — auto-submits the moment time runs out.
  useEffect(() => {
    if (remainingSec <= 0) { doSubmit(); return; }
    const iv = setInterval(() => setRemainingSec((s) => Math.max(0, s - 1)), 1000);
    return () => clearInterval(iv);
  }, [remainingSec, doSubmit]);

  const pickAnswer = (optIdx) => {
    setQuestions((prev) => prev.map((q, i) => (i === activeIdx ? { ...q, selected: optIdx } : q)));
    saveAnswer({ examJoinId, userId, questionId: current.id, selected: optIdx }).catch((err) => {
      console.error("Autosave failed:", err);
    });
  };

  const lowTime = remainingSec <= 60;

  return (
    <div className="max-w-2xl mx-auto mt-8 space-y-4 px-4">
      {/* Timer bar */}
      <div className={`flex items-center justify-between rounded-xl px-4 py-2.5 border ${lowTime ? "bg-red-50 border-red-200" : "bg-neutral-50 border-neutral-200"}`}>
        <span className="text-sm font-medium text-neutral-600">ตอบแล้ว {answeredCount}/{questions.length} ข้อ</span>
        <div className={`flex items-center gap-1.5 font-mono font-bold ${lowTime ? "text-red-600" : "text-neutral-700"}`}>
          <Clock className="h-4 w-4" /> {formatTime(remainingSec)}
        </div>
      </div>

      {/* Question navigator */}
      <div className="flex flex-wrap gap-1.5">
        {questions.map((q, i) => {
          const answered = q.selected !== null && q.selected !== undefined;
          const isActive = i === activeIdx;
          return (
            <button
              key={q.id}
              onClick={() => setActiveIdx(i)}
              className={`h-8 w-8 rounded-lg text-xs font-semibold border-2 transition ${
                isActive ? "border-orange-500 text-orange-600" : answered ? "border-green-300 bg-green-50 text-green-700" : "border-neutral-200 text-neutral-500"
              }`}
            >
              {i + 1}
            </button>
          );
        })}
      </div>

      {/* Question card */}
      <div className="bg-white border border-neutral-200 rounded-2xl p-6">
        <div className="flex items-baseline gap-3 mb-5">
          <span className="text-lg font-black text-orange-500">{activeIdx + 1}.</span>
          <p className="text-base font-medium text-neutral-900 leading-relaxed">{current.text}</p>
        </div>
        <div className="space-y-2.5">
          {OPTION_LABELS.map((label, optIdx) => {
            const isSelected = current.selected === optIdx;
            return (
              <button
                key={label}
                onClick={() => pickAnswer(optIdx)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border-2 text-left transition ${isSelected ? "border-orange-400 bg-orange-50" : "border-neutral-200 hover:border-orange-200"}`}
              >
                <span className={`h-6 w-6 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0 ${isSelected ? "bg-orange-500 text-white" : "bg-neutral-100 text-neutral-600"}`}>{label}</span>
                <span className="text-sm text-neutral-800">{current.options?.[optIdx]}</span>
                {isSelected && <Check className="h-4 w-4 text-orange-600 ml-auto" />}
              </button>
            );
          })}
        </div>

        <div className="flex items-center justify-between mt-6 pt-4 border-t border-neutral-100">
          <button onClick={() => setActiveIdx((i) => Math.max(0, i - 1))} disabled={activeIdx === 0} className="flex items-center gap-1 text-sm text-neutral-500 disabled:opacity-30">
            <ChevronLeft className="h-4 w-4" /> ข้อก่อนหน้า
          </button>
          {activeIdx < questions.length - 1 ? (
            <button onClick={() => setActiveIdx((i) => Math.min(questions.length - 1, i + 1))} className="flex items-center gap-1 text-sm text-orange-600 font-semibold">
              ข้อถัดไป <ChevronRight className="h-4 w-4" />
            </button>
          ) : (
            <button onClick={() => setConfirmSubmit(true)} className="bg-orange-500 hover:bg-orange-600 text-white rounded-xl px-5 py-2 text-sm font-semibold">
              ส่งข้อสอบ
            </button>
          )}
        </div>
      </div>

      {error && <p className="text-sm text-red-500 text-center">{error}</p>}

      {confirmSubmit && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setConfirmSubmit(false)}>
          <div className="bg-white rounded-2xl max-w-sm w-full p-6" onClick={(e) => e.stopPropagation()}>
            <div className="text-center mb-5">
              <div className="h-14 w-14 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-3"><AlertCircle className="h-7 w-7 text-orange-600" /></div>
              <h3 className="text-lg font-bold text-neutral-900 mb-1">ยืนยันส่งข้อสอบ?</h3>
              <p className="text-sm text-neutral-500">
                คุณตอบแล้ว {answeredCount}/{questions.length} ข้อ
                {answeredCount < questions.length && " — ข้อที่ไม่ได้ตอบจะได้ 0 คะแนน"}
              </p>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setConfirmSubmit(false)} className="flex-1 border border-neutral-200 rounded-xl py-2.5 text-sm font-semibold text-neutral-700">ตรวจทานอีกครั้ง</button>
              <button onClick={doSubmit} disabled={submitting} className="flex-1 bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white rounded-xl py-2.5 text-sm font-semibold">
                {submitting ? "กำลังส่ง…" : "ยืนยันส่ง"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Result screen ───────────────────────────────────────────────────────────

function ResultCard({ result }) {
  const pct = result.percentage ?? (result.maxScore ? Math.round((result.totalScore / result.maxScore) * 100) : 0);
  return (
    <div className="max-w-md mx-auto mt-24 bg-white border border-neutral-200 rounded-2xl p-6 text-center space-y-4">
      <CheckCircle2 className="h-12 w-12 text-green-500 mx-auto" />
      <h1 className="text-lg font-bold text-neutral-900">ส่งข้อสอบเรียบร้อยแล้ว</h1>
      <div className="bg-neutral-50 rounded-xl p-5">
        <p className="text-3xl font-bold text-orange-600">{result.totalScore}/{result.maxScore}</p>
        <p className="text-sm text-neutral-500 mt-1">{pct}%</p>
      </div>
      {result.correctCount != null && (
        <p className="text-sm text-neutral-500">ตอบถูก {result.correctCount}/{result.totalQuestions} ข้อ</p>
      )}
    </div>
  );
}

// ─── Main ────────────────────────────────────────────────────────────────────

export default function StudentExam() {
  const { token } = useParams();
  const navigate = useNavigate();
  const userId = getCurrentUserId();

  const [phase, setPhase] = useState("loading"); // loading | landing | running | result | error
  const [landing, setLanding] = useState(null);
  const [runData, setRunData] = useState(null);
  const [result, setResult] = useState(null);
  const [starting, setStarting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    if (!userId) {
      navigate(`/login?returnTo=/exam/${token}`);
      return;
    }
    let cancelled = false;
    fetchExamByToken(token, userId)
      .then((data) => {
        if (cancelled) return;
        if (data.status === "submitted") {
          setResult(data.result);
          setPhase("result");
        } else {
          setLanding(data);
          setPhase("landing");
        }
      })
      .catch((err) => {
        if (cancelled) return;
        setErrorMsg(err.response?.data?.message || "ไม่สามารถเข้าสอบได้");
        setPhase("error");
      });
    return () => { cancelled = true; };
  }, [token, userId, navigate]);

  const handleStart = async () => {
    setStarting(true);
    try {
      const data = await startExam(token, userId);
      setRunData(data);
      setPhase("running");
    } catch (err) {
      setErrorMsg(err.response?.data?.message || "เริ่มสอบไม่สำเร็จ");
      setPhase("error");
    } finally {
      setStarting(false);
    }
  };

  const handleSubmitted = async (submitResult) => {
    setResult(submitResult);
    setPhase("result");
    // best-effort refresh with the full breakdown; falls back to the submit response
    try {
      const full = await fetchExamResult(runData.examJoinId, userId);
      setResult(full);
    } catch { /* keep the submit response as-is */ }
  };

  if (phase === "loading") {
    return <div className="mt-24 text-center text-sm text-neutral-400">กำลังโหลดข้อมูลการสอบ...</div>;
  }
  if (phase === "error") {
    return (
      <div className="max-w-md mx-auto mt-24 text-center space-y-3">
        <AlertCircle className="h-10 w-10 text-red-400 mx-auto" />
        <p className="text-sm text-neutral-600">{errorMsg}</p>
      </div>
    );
  }
  if (phase === "landing") {
    return <LandingCard status={landing.status} exam={landing.exam} onStart={handleStart} starting={starting} />;
  }
  if (phase === "running") {
    return (
      <ExamRunner
        examJoinId={runData.examJoinId}
        userId={userId}
        joinedAt={runData.joinedAt}
        durationMinutes={runData.durationMinutes}
        questions={runData.questions}
        onSubmitted={handleSubmitted}
      />
    );
  }
  if (phase === "result") {
    return <ResultCard result={result} />;
  }
  return null;
}