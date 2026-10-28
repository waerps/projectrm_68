import { useCallback, useEffect, useRef, useState } from "react";
import { CheckCircle2, Loader2, XCircle } from "lucide-react";
import { getVideoLearningState, submitVideoQuestionAnswer, updateVideoWatchSegments } from "../callapi/callusers_student";

const requestId = () => globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random()}`;

export default function InteractiveVideoPlayer(props) {
  return <VideoSession key={props.video.VideoId} {...props} />;
}

function VideoSession({ video, token, onProgress, onLearningChange, saveRef }) {
  const videoRef = useRef(null);
  const questionPanelRef = useRef(null);
  const loadingRef = useRef(true);
  const resumeRef = useRef(null);
  const initialProgress = useRef({ time: video.LastWatchTime, percent: video.WatchPercent });
  const pendingSegments = useRef(new Set());
  const pendingEvents = useRef([]);
  const currentVisit = useRef({ index: null, seconds: 0, reported: false });
  const watchSessionId = useRef(requestId());
  const lastSample = useRef(null);
  const furthestAllowed = useRef(0);
  const correctingSeek = useRef(false);
  const flushInFlight = useRef(null);
  const flushRef = useRef(null);
  const onProgressRef = useRef(onProgress);
  onProgressRef.current = onProgress;
  const learningRef = useRef({ questions: [] });
  const activeRef = useRef(null);
  const [learning, setLearning] = useState({ questions: [], correctPercent: 100 });
  const [active, setActive] = useState(null);
  const [selected, setSelected] = useState(null);
  const [feedback, setFeedback] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [savingProgress, setSavingProgress] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadAttempt, setLoadAttempt] = useState(0);
  useEffect(() => { if (active) questionPanelRef.current?.focus(); }, [active]);
  useEffect(() => { learningRef.current = learning; }, [learning]);
  useEffect(() => { activeRef.current = active; }, [active]);

  useEffect(() => {
    let cancelled = false;
    setActive(null); activeRef.current = null; setFeedback(null); setError(""); setLoading(true); loadingRef.current = true;
    getVideoLearningState(token, video.VideoId).then(data => { if (!cancelled) { learningRef.current = data; setLearning(data); setLoading(false); loadingRef.current = false; resumeRef.current?.(); } })
      .catch(err => { if (!cancelled) setError(String(err)); });
    return () => { cancelled = true; };
  }, [token, video.VideoId, loadAttempt]);

  const openQuestion = useCallback(question => {
    if (!question || activeRef.current) return;
    videoRef.current?.pause();
    if (document.fullscreenElement === videoRef.current) document.exitFullscreen?.().catch(() => {});
    videoRef.current?.webkitExitFullscreen?.();
    activeRef.current = question;
    setSelected(null); setFeedback(null); setActive(question);
  }, []);

  useEffect(() => {
    const element = videoRef.current;
    if (!element) return undefined;
    const flush = async (force = false) => {
      const position = element.currentTime;
      // Capture the position before waiting: closing can detach the media element.
      while (flushInFlight.current) await flushInFlight.current;
      if (!Number.isFinite(element.duration)) throw new Error("ยังไม่พร้อมบันทึกการรับชม กรุณาลองอีกครั้ง");
      const indexes = [...pendingSegments.current];
      const events = [...pendingEvents.current];
      if (!indexes.length && !events.length && !force) return;
      pendingSegments.current.clear();
      pendingEvents.current = [];
      setSavingProgress(true);
      const write = (async () => {
        try {
          const result = await updateVideoWatchSegments(token, video.VideoId, {
            segmentIndexes: indexes, segmentEvents: events,
            sessionId: watchSessionId.current, lastWatchTime: position,
          });
          const data = result?.data || {};
          onProgressRef.current?.(video.VideoId, Number(data.watchPercent || 0), Number(data.lastWatchTime ?? position));
          // blockedByQuestion identifies the next gate, not a question due now.
          return data;
        } catch (err) {
          indexes.forEach(i => pendingSegments.current.add(i));
          pendingEvents.current.unshift(...events);
          throw err;
        }
      })();
      flushInFlight.current = write;
      try { return await write; }
      finally { flushInFlight.current = null; setSavingProgress(false); }
    };
    flushRef.current = flush;
    if (saveRef) saveRef.current = () => flush(true);
    const saveInBackground = (force = false) => {
      flush(force).catch(() => setError("บันทึกการรับชมไม่สำเร็จ กรุณาตรวจสอบการเชื่อมต่อแล้วส่งคำตอบอีกครั้ง"));
    };
    const reset = () => { lastSample.current = null; };
    const sample = () => {
      if (activeRef.current || loadingRef.current) return;
      const current = element.currentTime;
      const due = learningRef.current.questions.filter(q => !q.answered).sort((a, b) => a.timestampMs - b.timestampMs)[0];
      if (due && current >= due.timestampMs / 1000) {
        openQuestion(due); saveInBackground(true); return;
      }
      const now = performance.now();
      const previous = lastSample.current;
      lastSample.current = { current, now };
      if (!previous || element.paused || element.seeking || document.hidden) return;
      const mediaDelta = current - previous.current;
      const wallDelta = (now - previous.now) / 1000;
      if (mediaDelta <= 0 || mediaDelta > 1.5 || wallDelta > 2 || Math.abs(mediaDelta - wallDelta * element.playbackRate) > 0.75) return;
      const index = Math.floor(previous.current / 10);
      if (Math.floor(current / 10) !== index) return;
      if (currentVisit.current.index !== index) currentVisit.current = { index, seconds: 0, reported: false };
      currentVisit.current.seconds = Math.min(10, currentVisit.current.seconds + mediaDelta);
      furthestAllowed.current = Math.max(furthestAllowed.current, current);
      if (!currentVisit.current.reported && currentVisit.current.seconds >= Math.max(1, Math.min(10, element.duration - index * 10) * 0.8)) {
        currentVisit.current.reported = true;
        pendingSegments.current.add(index);
        pendingEvents.current.push({ eventId: requestId(), segmentIndex: index });
      }
    };
    let resumed = false;
    const resume = () => {
      if (resumed || loadingRef.current || !Number.isFinite(element.duration)) return;
      resumed = true;
      const verified = element.duration * Number(initialProgress.current.percent || 0) / 100;
      const due = learningRef.current.questions.find(q => !q.answered);
      const position = Math.max(0, Math.min(Number(initialProgress.current.time || 0), element.duration, verified + 10, due ? due.timestampMs / 1000 : Infinity));
      furthestAllowed.current = Math.max(verified, position);
      // Keep the partial first unverified segment when continuing after a pause/close.
      currentVisit.current = { index: Math.floor(position / 10), seconds: position % 10, reported: false };
      if (position > 0) {
        correctingSeek.current = true;
        element.currentTime = position;
      }
    };
    resumeRef.current = resume;
    resume();
    const guardSeek = () => {
      reset();
      if (correctingSeek.current) return;
      currentVisit.current = { index: null, seconds: 0, reported: false };
      const nextQuestion = learningRef.current.questions.filter(q => !q.answered).sort((a, b) => a.timestampMs - b.timestampMs)[0];
      const questionLimit = nextQuestion ? nextQuestion.timestampMs / 1000 : Infinity;
      if (element.currentTime > Math.min(furthestAllowed.current + 1, questionLimit)) {
        correctingSeek.current = true;
        element.currentTime = Math.max(0, Math.min(furthestAllowed.current, questionLimit));
        queueMicrotask(() => { correctingSeek.current = false; });
      }
    };
    const pause = () => { reset(); if (!loadingRef.current) saveInBackground(true); };
    const seeked = () => { correctingSeek.current = false; reset(); };
    const visibility = () => { if (document.hidden) pause(); };
    document.addEventListener("visibilitychange", visibility);
    const guardPlay = () => { if (activeRef.current || loadingRef.current) element.pause(); else lastSample.current = { current: element.currentTime, now: performance.now() }; };
    const timer = setInterval(() => { if (!activeRef.current && !loadingRef.current) saveInBackground(true); }, 10000);
    element.addEventListener("loadedmetadata", resume, { once: true });
    element.addEventListener("play", guardPlay);
    element.addEventListener("timeupdate", sample); element.addEventListener("seeking", guardSeek);
    element.addEventListener("seeked", seeked); element.addEventListener("pause", pause); element.addEventListener("ended", pause);
    return () => { if (!loadingRef.current && element.currentTime > 0) saveInBackground(true); resumeRef.current = null; if (saveRef) saveRef.current = null; document.removeEventListener("visibilitychange", visibility); flushRef.current = null; clearInterval(timer); element.removeEventListener("play", guardPlay); element.removeEventListener("timeupdate", sample); element.removeEventListener("seeking", guardSeek); element.removeEventListener("seeked", seeked); element.removeEventListener("pause", pause); element.removeEventListener("ended", pause); };
  }, [token, video.VideoId, openQuestion, saveRef]);

  const answer = async () => {
    if (!selected || !active) return;
    setSubmitting(true); setError("");
    try {
      if (!flushRef.current) throw new Error("วิดีโอยังไม่พร้อม กรุณาลองอีกครั้ง");
      await flushRef.current(true);
      const result = await submitVideoQuestionAnswer(token, video.VideoId, active.questionId, selected, requestId());
      // A segment submitted before its question was answered may have been capped.
      if (currentVisit.current.reported) pendingSegments.current.add(currentVisit.current.index);
      setFeedback(result);
      const current = learningRef.current;
        const questions = current.questions.map(q => q.questionId === active.questionId ? { ...q, answered: true, isCorrect: result.isCorrect } : q);
        const correct = questions.filter(q => q.isCorrect).length;
        onLearningChange?.(video.VideoId, { correctCount: correct, totalQuestions: questions.length });
        const next = { ...current, questions, correctPercent: questions.length ? correct / questions.length * 100 : 100 };
        learningRef.current = next;
        setLearning(next);
    } catch (err) { setError(String(err)); } finally { setSubmitting(false); }
  };

  return <div className="relative isolate overflow-hidden rounded-xl bg-black">
    <video ref={videoRef} src={video.VideoUrl} controls={!active && !loading} inert={Boolean(active) || loading} tabIndex={active || loading ? -1 : 0} disablePictureInPicture controlsList="nodownload noremoteplayback" playsInline className="aspect-video w-full bg-black" preload="metadata" />
    {loading && <div className="absolute inset-0 z-20 grid place-items-center bg-black/70 p-4 text-center text-white"><div>{error || "กำลังเตรียมวิดีโอและคำถาม…"}{error && <button className="mt-3 block w-full rounded-lg bg-orange-500 p-2" onClick={() => setLoadAttempt(value => value + 1)}>ลองโหลดอีกครั้ง</button>}</div></div>}
    {error && !active && !loading && <div role="alert" className="absolute inset-x-0 top-0 z-10 bg-red-50 px-4 py-2 text-xs text-red-700">{error}</div>}
    {active && <div ref={questionPanelRef} tabIndex={-1} role="dialog" aria-label="คำถามระหว่างเรียน" className="absolute inset-0 z-20 overflow-y-auto overscroll-contain bg-black/75 p-3 backdrop-blur-sm sm:p-5">
      <div className="mx-auto w-full max-w-xl overflow-hidden rounded-[28px] bg-white shadow-[0_12px_40px_rgba(249,115,22,0.13)]">
        <div className="bg-gradient-to-r from-orange-400 to-amber-400 px-6 py-5 text-white"><p className="text-xl font-bold">หยุดคิดสักนิด 🌟</p><p className="mt-1 text-sm text-orange-50">คำถามสั้นๆ ระหว่างเรียน ช่วยเช็กว่าเราเข้าใจเนื้อหาช่วงนี้แล้วหรือยัง</p></div>
        <div className="p-4 sm:p-5">{error && <p role="alert" className="mb-3 rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</p>}<div className="mb-4 rounded-2xl bg-orange-50 p-4"><p className="text-xs font-bold text-orange-600">ทำอย่างไรถึงจะดูต่อได้?</p><p className="mt-1 text-sm text-neutral-700">เลือกคำตอบ 1 ข้อ แล้วกด “ส่งคำตอบ” ไม่ว่าจะตอบถูกหรือไม่ วิดีโอก็สามารถเล่นต่อได้</p></div>
        <h3 className="mb-4 text-lg font-bold text-neutral-900">{active.text}</h3>
        <div className="space-y-2">{active.options.map((option, index) => <button key={option.optionId} disabled={Boolean(feedback) || submitting} onClick={() => setSelected(option.optionId)} className={`flex w-full items-center gap-3 rounded-2xl border-0 px-4 py-3 text-left text-sm outline-none transition focus:outline-none ${selected === option.optionId ? "bg-orange-100 text-orange-900 shadow-[0_3px_12px_rgba(249,115,22,0.14)]" : "bg-neutral-50 text-neutral-700 hover:bg-orange-50"}`}><span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold ${selected === option.optionId ? "bg-orange-500 text-white" : "bg-white text-neutral-500 shadow-sm"}`}>{String.fromCharCode(65 + index)}</span>{option.text}</button>)}</div>
        {feedback && <div className={`mt-4 rounded-2xl p-4 text-sm ${feedback.isCorrect ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-800"}`}><div className="flex items-center gap-2 font-bold">{feedback.isCorrect ? <CheckCircle2 className="h-5 w-5" /> : <XCircle className="h-5 w-5" />}{feedback.isCorrect ? "เยี่ยมมาก! คำตอบนี้ถูกต้อง" : "ยังไม่ถูก แต่ไม่เป็นไร ลองจดไว้ทบทวนอีกครั้งนะ"}</div>{feedback.explanation && <p className="mt-2 leading-relaxed">{feedback.explanation}</p>}</div>}
        {!feedback ? <button onClick={answer} disabled={!selected || submitting || savingProgress} className="mt-5 flex w-full justify-center rounded-2xl border-0 bg-orange-500 py-3.5 font-bold text-white outline-none transition hover:bg-orange-600 focus:outline-none disabled:bg-neutral-200 disabled:text-neutral-400">{submitting || savingProgress ? <Loader2 className="h-5 w-5 animate-spin" /> : selected ? "ส่งคำตอบและตรวจผล" : "เลือกคำตอบก่อน"}</button> : <button onClick={() => { activeRef.current = null; setActive(null); setFeedback(null); setError(""); videoRef.current?.play()?.catch(() => {}); }} className="mt-5 w-full rounded-2xl border-0 bg-orange-500 py-3.5 font-bold text-white outline-none hover:bg-orange-600 focus:outline-none">เล่นวิดีโอต่อ ▶</button>}
        </div>
      </div>
    </div>}
  </div>;
}
