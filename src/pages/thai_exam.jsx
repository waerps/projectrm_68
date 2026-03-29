import { useState, useEffect } from "react";

const WEBHOOK_URL = "http://localhost:5678/webhook-test/exam-batch";

const questions = [
  {
    id: 1, topic: "การอ่าน",
    question: "ข้อใดคือความหมายของคำว่า \"อุปมา\" ในวรรณคดีไทย?",
    choices: ["การเปรียบเทียบโดยใช้คำว่า เหมือน หรือ ราว","การพรรณนาธรรมชาติอย่างละเอียด","การใช้คำที่มีเสียงเลียนแบบธรรมชาติ","การยกตัวอย่างเหตุการณ์จริง"],
    answer: 0
  },
  {
    id: 2, topic: "ไวยากรณ์",
    question: "ประโยคใดใช้คำกริยาไม่ถูกต้อง?",
    choices: ["เขาเดินทางไปกรุงเทพฯ เมื่อวานนี้","นักเรียนทุกคนตั้งใจเรียนอยู่","ครูสอนวิชาภาษาไทยทุกวัน","เธอได้รับรางวัลเกียรติยศเมื่อปีที่แล้วมา"],
    answer: 3
  },
  {
    id: 3, topic: "วรรณคดี",
    question: "ผู้แต่ง \"รามเกียรติ์\" ฉบับรัชกาลที่ 1 คือใคร?",
    choices: ["พระบาทสมเด็จพระพุทธยอดฟ้าจุฬาโลก","พระบาทสมเด็จพระพุทธเลิศหล้านภาลัย","พระบาทสมเด็จพระนั่งเกล้าเจ้าอยู่หัว","สุนทรภู่"],
    answer: 0
  },
  {
    id: 4, topic: "การเขียน",
    question: "ข้อใดคือลักษณะของ \"ย่อหน้า\" ที่ดี?",
    choices: ["มีประโยคสั้น ๆ จำนวนมาก","มีใจความสำคัญหนึ่งเรื่องและประโยคสนับสนุน","มีการใช้คำสันธานทุกประโยค","มีความยาวอย่างน้อย 10 ประโยคเสมอ"],
    answer: 1
  },
  {
    id: 5, topic: "คำศัพท์",
    question: "คำว่า \"พิสดาร\" มีความหมายตรงกับข้อใด?",
    choices: ["สวยงาม","แปลกประหลาด ซับซ้อน","เรียบง่าย","น่าเบื่อหน่าย"],
    answer: 1
  },
  {
    id: 6, topic: "ฉันทลักษณ์",
    question: "โคลงสี่สุภาพมีลักษณะบังคับข้อใด?",
    choices: ["๗-๗-๗-๙ คำ","๑๑-๑๑-๑๑-๑๑ คำ","๑๐-๗-๗-๙ คำ","๘-๘-๘-๘ คำ"],
    answer: 2
  },
  {
    id: 7, topic: "วรรณคดี",
    question: "\"กาพย์เห่ชมเครื่องคาวหวาน\" เป็นพระราชนิพนธ์ของรัชกาลใด?",
    choices: ["รัชกาลที่ 1","รัชกาลที่ 2","รัชกาลที่ 3","รัชกาลที่ 4"],
    answer: 1
  },
  {
    id: 8, topic: "การอ่าน",
    question: "การอ่านแบบ \"ตีความ\" หมายถึงสิ่งใด?",
    choices: ["การอ่านออกเสียงอย่างชัดเจน","การอ่านเพื่อหาข้อเท็จจริง","การอ่านเพื่อค้นหาความหมายที่ซ่อนอยู่","การอ่านเพื่อสรุปใจความสำคัญ"],
    answer: 2
  },
  {
    id: 9, topic: "ไวยากรณ์",
    question: "ข้อใดเป็นประโยคกรรมวาจก?",
    choices: ["แมวกินปลา","เขาเปิดหน้าต่าง","หนังสือถูกวางบนโต๊ะ","นักเรียนเขียนรายงาน"],
    answer: 2
  },
  {
    id: 10, topic: "คำศัพท์",
    question: "คำว่า \"สาธารณะ\" ตรงกับคำในข้อใด?",
    choices: ["ส่วนตัว","ส่วนรวม","พิเศษ","เฉพาะเจาะจง"],
    answer: 1
  },
  {
    id: 11, topic: "วรรณคดี",
    question: "ตัวละครใดในเรื่อง \"ขุนช้างขุนแผน\" เป็นตัวแทนของความซื่อสัตย์และความกล้าหาญ?",
    choices: ["ขุนช้าง","นางวันทอง","ขุนแผน","พลายงาม"],
    answer: 2
  },
  {
    id: 12, topic: "การเขียน",
    question: "จดหมายราชการใช้คำลงท้ายว่าอย่างไร?",
    choices: ["ด้วยความนับถือ","ขอแสดงความนับถือ","ด้วยความเคารพ","ขอบคุณอย่างสูง"],
    answer: 1
  },
  {
    id: 13, topic: "ฉันทลักษณ์",
    question: "กาพย์ยานีมีกี่คำต่อวรรค?",
    choices: ["๕ คำ","๖ คำ","๗ คำ","๘ คำ"],
    answer: 1
  },
  {
    id: 14, topic: "การอ่าน",
    question: "ข้อใดคือวัตถุประสงค์หลักของการอ่านเชิงวิเคราะห์?",
    choices: ["อ่านเพื่อความบันเทิง","อ่านเพื่อแยกแยะข้อเท็จจริงและความคิดเห็น","อ่านเพื่อท่องจำ","อ่านเพื่อความรวดเร็ว"],
    answer: 1
  },
  {
    id: 15, topic: "ไวยากรณ์",
    question: "คำว่า \"สวย\" ในประโยค \"เธอสวยมาก\" ทำหน้าที่อะไร?",
    choices: ["คำนาม","คำกริยา","คำวิเศษณ์","คำสรรพนาม"],
    answer: 1
  },
  {
    id: 16, topic: "คำศัพท์",
    question: "สำนวน \"น้ำขึ้นให้รีบตัก\" หมายความว่าอย่างไร?",
    choices: ["ควรดื่มน้ำให้มาก","ควรรีบฉวยโอกาสเมื่อมีโอกาส","ควรประหยัดน้ำ","ควรรอให้น้ำเต็มก่อน"],
    answer: 1
  },
  {
    id: 17, topic: "วรรณคดี",
    question: "\"อิเหนา\" เป็นนิทานพื้นบ้านของชาติใด?",
    choices: ["ไทย","มาเลย์-ชวา","พม่า","กัมพูชา"],
    answer: 1
  },
  {
    id: 18, topic: "การเขียน",
    question: "บทความแสดงความคิดเห็นควรมีลักษณะอย่างไร?",
    choices: ["นำเสนอข้อมูลอย่างเป็นกลาง","แสดงจุดยืนชัดเจนพร้อมเหตุผลสนับสนุน","บรรยายเหตุการณ์ตามลำดับ","ใช้ภาษาทางการสูง"],
    answer: 1
  },
  {
    id: 19, topic: "ฉันทลักษณ์",
    question: "\"อินทรวิเชียรฉันท์\" นับเป็นฉันท์ชนิดใด?",
    choices: ["ฉันท์ ๑๑","ฉันท์ ๑๒","ฉันท์ ๑๓","ฉันท์ ๑๔"],
    answer: 0
  },
  {
    id: 20, topic: "การอ่าน",
    question: "การอ่านบทกวีควรคำนึงถึงสิ่งใดมากที่สุด?",
    choices: ["ความเร็วในการอ่าน","ฉันทลักษณ์ จังหวะ และความหมาย","จำนวนคำในแต่ละบรรทัด","ตัวอักษรที่ใช้"],
    answer: 1
  }
];

const TOTAL = questions.length;
const STUDENT_ID = `STU-${Math.random().toString(36).substr(2,6).toUpperCase()}`;

export default function ThaiExam() {
  const [phase, setPhase] = useState("intro");
  const [answers, setAnswers] = useState({});
  const [current, setCurrent] = useState(0);
  const [timeLeft, setTimeLeft] = useState(30 * 60);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [flagged, setFlagged] = useState(new Set());

  useEffect(() => {
    if (phase !== "exam") return;
    const t = setInterval(() => {
      setTimeLeft(p => {
        if (p <= 1) { clearInterval(t); handleSubmit(); return 0; }
        return p - 1;
      });
    }, 1000);
    return () => clearInterval(t);
  }, [phase]);

  const answered = Object.keys(answers).length;
  const progress = (answered / TOTAL) * 100;
  const mm = String(Math.floor(timeLeft / 60)).padStart(2, "0");
  const ss = String(timeLeft % 60).padStart(2, "0");
  const timeWarning = timeLeft < 300;

  function selectAnswer(qId, idx) {
    setAnswers(p => ({ ...p, [qId]: idx }));
  }

  function toggleFlag(id) {
    setFlagged(p => {
      const n = new Set(p);
      n.has(id) ? n.delete(id) : n.add(id);
      return n;
    });
  }

  async function handleSubmit() {
    setPhase("submitting");
    const submissions = [{
      userId: STUDENT_ID,
      answers: questions.map(q => ({
        questionId: q.id,
        topic: q.topic,
        correct: answers[q.id] === q.answer,
        selected: answers[q.id] ?? null
      }))
    }];

    try {
      const res = await fetch(WEBHOOK_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ submissions })
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      const item = Array.isArray(data) ? data[0] : data;
      setResult(item);
    } catch (e) {
      const correct = questions.filter(q => answers[q.id] === q.answer).length;
      const topicMistakes = {};
      questions.forEach(q => {
        if (answers[q.id] !== q.answer) topicMistakes[q.topic] = (topicMistakes[q.topic]||0)+1;
      });
      setResult({
        userId: STUDENT_ID,
        overall: { scorePct: Math.round((correct/TOTAL)*100), rank: "—", percentile: "—", level: correct>=15?"top":correct>=10?"mid":"low", summary: "ผลการประมวลผลเบื้องต้น (ไม่สามารถเชื่อมต่อ server ได้)" },
        weaknesses: Object.entries(topicMistakes).map(([topic,mistakes])=>({topic,mistakes,why:"ตอบผิดหลายข้อ",practice:"ควรทบทวนเพิ่มเติม"})),
        recommendations: ["ทบทวนหัวข้อที่ตอบผิด","ฝึกทำข้อสอบเพิ่มเติม"],
        _offline: true
      });
      setError("⚠️ ไม่สามารถส่งข้อมูลไปยัง n8n ได้ แสดงผลจากการคำนวณในเครื่อง");
    }
    setPhase("result");
  }

  // ─── INTRO ─────────────────────────────────────────────────────────────
  if (phase === "intro") return (
    <div style={s.page}>
      <link href="https://fonts.googleapis.com/css2?family=Sarabun:wght@300;400;500;600;700&family=Noto+Serif+Thai:wght@700;900&display=swap" rel="stylesheet"/>
      <div style={s.introCard}>
        <div style={s.badge}>ภาษาไทย ม.6</div>
        <h1 style={s.heroTitle}>แบบทดสอบ<br/>ภาษาไทย</h1>
        <p style={s.heroSub}>ชั้นมัธยมศึกษาปีที่ 6</p>
        <div style={s.metaRow}>
          {[["📝","20 ข้อ"],["⏱","30 นาที"],["📚","5 หัวข้อ"]].map(([ic,lb])=>(
            <div key={lb} style={s.metaChip}><span>{ic}</span><span>{lb}</span></div>
          ))}
        </div>
        <div style={s.topicList}>
          {["การอ่าน","ไวยากรณ์","วรรณคดี","การเขียน","คำศัพท์ & ฉันทลักษณ์"].map(t=>(
            <span key={t} style={s.topicTag}>{t}</span>
          ))}
        </div>
        <div style={s.studentBadge}>ชื่อนักเรียน: <strong>น้องโลตัส</strong></div>
        <button style={s.startBtn} onClick={()=>setPhase("exam")}>
          เริ่มทำข้อสอบ →
        </button>
      </div>
    </div>
  );

  // ─── SUBMITTING ─────────────────────────────────────────────────────────
  if (phase === "submitting") return (
    <div style={s.page}>
      <link href="https://fonts.googleapis.com/css2?family=Sarabun:wght@300;400;500;600;700&family=Noto+Serif+Thai:wght@700;900&display=swap" rel="stylesheet"/>
      <div style={{...s.introCard, gap:24, alignItems:"center", justifyContent:"center", minHeight:260}}>
        <div style={s.spinner}/>
        <p style={{color:"#ff4d05",fontSize:18,fontWeight:600}}>กำลังส่งข้อมูลและประมวลผลการสอบ...</p>
        <p style={{color:"#9ca3af",fontSize:14}}>รอสักครู่</p>
      </div>
    </div>
  );

  // ─── RESULT ─────────────────────────────────────────────────────────────
  if (phase === "result" && result) {
    const ov = result.overall || {};
    const score = ov.scorePct ?? 0;
    const lvlColor = ov.level==="top"?"#16a34a":ov.level==="mid"?"#d97706":"#dc2626";
    const lvlBg = ov.level==="top"?"#dcfce7":ov.level==="mid"?"#fef3c7":"#fee2e2";
    const lvlLabel = ov.level==="top"?"ดีเยี่ยม 🎉":ov.level==="mid"?"ปานกลาง 📘":"ต้องพัฒนา 💪";

    const correctCount = questions.filter(q => answers[q.id] === q.answer).length;
    const wrongCount = TOTAL - correctCount;

    return (
      <div style={s.page}>
        {/* <link href="https://fonts.googleapis.com/css2?family=Sarabun:wght@300;400;500;600;700&family=Noto+Serif+Thai:wght@700;900&display=swap" rel="stylesheet"/> */}
        <div style={s.resultWrap}>
          {error && <div style={s.errorBanner}>{error}</div>}

          {/* ── SCORE HERO ── */}
          <div style={s.scoreHero}>
            <div style={s.scoreHeroInner}>
              <div style={s.scoreLabelTop}>ผลการทดสอบ</div>
              <div style={{...s.scoreCircle, borderColor: lvlColor}}>
                <span style={{fontSize:52,fontWeight:900,color:lvlColor,lineHeight:1}}>{score}</span>
                <span style={{fontSize:20,fontWeight:700,color:lvlColor}}>%</span>
              </div>
              <div style={{...s.levelPill, background:lvlBg, color:lvlColor}}>{lvlLabel}</div>
              <p style={{color:"#6b7280",fontSize:13,margin:0,textAlign:"center"}}>{result.userId}</p>
            </div>

            {/* Stats row */}
            <div style={s.statsRow}>
              <div style={{...s.statBox, borderColor:"#bbf7d0"}}>
                <span style={{fontSize:32,fontWeight:900,color:"#16a34a"}}>{correctCount}</span>
                <span style={{fontSize:12,color:"#16a34a",fontWeight:600}}>ตอบถูก</span>
              </div>
              <div style={{...s.statBox, borderColor:"#fecaca"}}>
                <span style={{fontSize:32,fontWeight:900,color:"#dc2626"}}>{wrongCount}</span>
                <span style={{fontSize:12,color:"#dc2626",fontWeight:600}}>ตอบผิด</span>
              </div>
              <div style={{...s.statBox, borderColor:"#e0e7ff"}}>
                <span style={{fontSize:28,fontWeight:900,color:"#4f46e5"}}>{ov.rank ?? "—"}</span>
                <span style={{fontSize:12,color:"#4f46e5",fontWeight:600}}>อันดับ</span>
              </div>
              <div style={{...s.statBox, borderColor:"#fde68a"}}>
                <span style={{fontSize:28,fontWeight:900,color:"#d97706"}}>{typeof ov.percentile==="number"?`${ov.percentile}%`:"—"}</span>
                <span style={{fontSize:12,color:"#d97706",fontWeight:600}}>เปอร์เซ็นไทล์</span>
              </div>
            </div>

            {ov.summary && (
              <p style={{color:"#6b7280",fontSize:13,textAlign:"center",margin:"0 0 4px",padding:"0 8px"}}>{ov.summary}</p>
            )}
          </div>

          {/* ── WEAKNESSES ── */}
          {result.weaknesses?.length > 0 && (
            <div style={s.section}>
              <div style={s.sectionHeader}>
                <span style={s.sectionIcon}>🔍</span>
                <h3 style={s.sectionTitle}>จุดอ่อนที่ต้องพัฒนา</h3>
              </div>
              <div style={{display:"flex",flexDirection:"column",gap:10}}>
                {result.weaknesses.map((w,i)=>(
                  <div key={i} style={s.weakCard}>
                    <div style={s.weakLeft}>
                      <span style={s.weakTopic}>{w.topic}</span>
                      <span style={s.weakCount}>ผิด {w.mistakes} ข้อ</span>
                    </div>
                    <div style={s.weakRight}>
                      {w.why && <p style={s.weakText}>⚡ {w.why}</p>}
                      {w.practice && <p style={s.weakPractice}>📖 {w.practice}</p>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── RECOMMENDATIONS ── */}
          {result.recommendations?.length > 0 && (
            <div style={s.section}>
              <div style={s.sectionHeader}>
                <span style={s.sectionIcon}>💡</span>
                <h3 style={s.sectionTitle}>คำแนะนำ</h3>
              </div>
              <div style={{display:"flex",flexDirection:"column",gap:8}}>
                {result.recommendations.map((r,i)=>(
                  <div key={i} style={s.recItem}>
                    <span style={s.recNum}>{i+1}</span>
                    <span style={{color:"#374151",fontSize:14}}>{r}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── ANSWER REVIEW ── */}
          <div style={s.section}>
            <div style={s.sectionHeader}>
              <span style={s.sectionIcon}>📋</span>
              <h3 style={s.sectionTitle}>เฉลยข้อสอบ</h3>
            </div>
            <div style={{display:"flex",flexDirection:"column",gap:10}}>
              {questions.map(q=>{
                const sel = answers[q.id];
                const isCorrect = sel === q.answer;
                const noAnswer = sel === undefined || sel === null;
                return (
                  <div key={q.id} style={{
                    ...s.reviewCard,
                    borderLeft: `4px solid ${isCorrect ? "#16a34a" : "#dc2626"}`
                  }}>
                    {/* Question row */}
                    <div style={s.reviewTop}>
                      <div style={{
                        ...s.reviewNum,
                        background: isCorrect ? "#16a34a" : "#dc2626"
                      }}>{q.id}</div>
                      <div style={{flex:1}}>
                        <div style={s.reviewTopicPill}>{q.topic}</div>
                        <p style={s.reviewQuestion}>{q.question}</p>
                      </div>
                      <div style={{...s.reviewStatus, color: isCorrect?"#16a34a":"#dc2626"}}>
                        {noAnswer ? "—" : isCorrect ? "✓" : "✗"}
                      </div>
                    </div>

                    {/* Choices */}
                    <div style={s.reviewChoices}>
                      {q.choices.map((ch, idx) => {
                        const isAnswer = idx === q.answer;
                        const isSelected = idx === sel;
                        const isWrongPick = isSelected && !isCorrect;

                        let bg = "#f9fafb";
                        let border = "1px solid #e5e7eb";
                        let color = "#6b7280";
                        let fontWeight = 400;

                        if (isAnswer) {
                          bg = "#f0fdf4";
                          border = "1.5px solid #86efac";
                          color = "#15803d";
                          fontWeight = 600;
                        }
                        if (isWrongPick) {
                          bg = "#fef2f2";
                          border = "1.5px solid #fca5a5";
                          color = "#dc2626";
                          fontWeight = 600;
                        }

                        return (
                          <div key={idx} style={{
                            ...s.reviewChoice,
                            background: bg,
                            border,
                            color,
                            fontWeight
                          }}>
                            <span style={{
                              ...s.reviewChoiceLetter,
                              background: isAnswer ? "#16a34a" : isWrongPick ? "#dc2626" : "#e5e7eb",
                              color: (isAnswer || isWrongPick) ? "#fff" : "#9ca3af"
                            }}>{String.fromCharCode(65+idx)}</span>
                            <span style={{fontSize:13}}>{ch}</span>
                            {isAnswer && <span style={{marginLeft:"auto",fontSize:12,color:"#16a34a",fontWeight:700}}>✓ เฉลย</span>}
                            {isWrongPick && <span style={{marginLeft:"auto",fontSize:12,color:"#dc2626",fontWeight:700}}>✗ คำตอบคุณ</span>}
                          </div>
                        );
                      })}
                      {noAnswer && (
                        <div style={s.noAnswerTag}>ไม่ได้ตอบข้อนี้</div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <button style={s.retryBtn} onClick={()=>{setPhase("intro");setAnswers({});setCurrent(0);setTimeLeft(30*60);setResult(null);setError(null);setFlagged(new Set());}}>
            ↺ ทำข้อสอบอีกครั้ง
          </button>
        </div>
      </div>
    );
  }

  // ─── EXAM ───────────────────────────────────────────────────────────────
  const q = questions[current];
  return (
    <div style={s.page}>


      <div style={s.examHeader}>
        <div style={s.examTitle}>แบบทดสอบภาษาไทย ม.6</div>
        <div style={{...s.timer, color: timeWarning?"#dc2626":"#ff4d05"}}>
          {timeWarning && "⚠️ "}{mm}:{ss}
        </div>
        <div style={{color:"#9ca3af"}}>ชื่อนักเรียน: น้องโลตัส</div>
      </div>

      <div style={s.progressWrap}>
        <div style={{...s.progressBar, width:`${progress}%`}}/>
      </div>
      <div style={s.progressLabel}>{answered}/{TOTAL} ข้อ</div>

      <div style={s.qGrid}>
        {questions.map((qq,i)=>(
          <button key={qq.id} onClick={()=>setCurrent(i)} style={{
            ...s.qDot, 
            background: answers[qq.id]!==undefined ? "#ff4d05" : i===current ? "#fff1eb" : "#f3f4f6",
            border: i===current ? "2px solid #ff4d05" : flagged.has(qq.id)?"2px solid #f59e0b":"2px solid transparent",
            color: answers[qq.id]!==undefined ? "#fff" : i===current?"#ff4d05" : "#6b7280",
            fontWeight: i===current?"700":"400"
          }}>{qq.id}</button>
        ))}
      </div>

      <div style={s.qCard}>
        <div style={s.qMeta}>
          <span style={s.topicBadge}>{q.topic}</span>
          <span style={{color:"#9ca3af",fontSize:13}}>ข้อ {current+1} จาก {TOTAL}</span>
          {/* <button onClick={()=>toggleFlag(q.id)} style={{...s.flagBtn, color: flagged.has(q.id)?"#f59e0b":"#d1d5db"}}>
            {flagged.has(q.id)?"🚩 ติดธงแล้ว":"⚑ ทำเครื่องหมาย"}
          </button> */}
        </div>
        <p style={s.qText}>{q.question}</p>
        <div style={{display:"flex",flexDirection:"column",gap:10}}>
          {q.choices.map((ch,idx)=>{
            const sel = answers[q.id] === idx;
            return (
              <button key={idx} onClick={()=>selectAnswer(q.id,idx)} style={{
                ...s.choiceBtn,
                background: sel ? "#fff5f2" : "#ffffff",
                border: sel ? "2px solid #ff4d05" : "2px solid #e5e7eb",
                color: sel ? "#ff4d05" : "#374151",
                boxShadow: sel ? "0 0 0 3px rgba(255,77,5,0.10)" : "none"
              }}>
                <span style={{
                  ...s.choiceLetter,
                  background: sel ? "#ff4d05" : "#f3f4f6",
                  color: sel ? "#fff" : "#9ca3af"
                }}>
                  {String.fromCharCode(65+idx)}
                </span>
                <span style={{fontSize:15,textAlign:"left",fontWeight:sel?600:400}}>{ch}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div style={s.navRow}>
        <button disabled={current===0} onClick={()=>setCurrent(p=>p-1)} style={{...s.navBtn, opacity:current===0?0.3:1}}>← ก่อนหน้า</button>
        {current < TOTAL-1
          ? <button onClick={()=>setCurrent(p=>p+1)} style={s.navBtnPrimary}>ถัดไป →</button>
          : <button onClick={handleSubmit} style={s.submitBtn}>ส่งข้อสอบ ✓</button>
        }
      </div>
    </div>
  );
}

const s = {
  page: {
    minHeight:"100vh",
    background:"#f8f9fa",
    display:"flex",
    flexDirection:"column",
    alignItems:"center",
    padding:"20px 16px 60px",
    // fontFamily:"'Sarabun',sans-serif",
  },

  // ── INTRO ──
  introCard: {
    background:"#ffffff",
    border:"1px solid #e5e7eb",
    borderRadius:24,
    padding:"48px 40px",
    maxWidth:520,
    width:"100%",
    display:"flex",
    flexDirection:"column",
    alignItems:"center",
    gap:20,
    marginTop:40,
    boxShadow:"0 10px 30px rgba(0,0,0,0.06)",
  },
  badge:{
    background:"#fff1eb",
    color:"#ff4d05",
    padding:"4px 14px",
    borderRadius:99,
    fontSize:12,
    fontWeight:700,
    letterSpacing:0.5
  },
  heroTitle:{
    fontSize:48,
    fontWeight:900,
    color:"#111827",
    textAlign:"center",
    lineHeight:1.1,
    margin:0,
    // fontFamily:"'Noto Serif Thai',serif"
  },
  heroSub:{color:"#9ca3af",fontSize:16,margin:0},
  metaRow:{display:"flex",gap:12,flexWrap:"wrap",justifyContent:"center"},
  metaChip:{
    background:"#f9fafb",
    border:"1px solid #e5e7eb",
    borderRadius:99,
    padding:"6px 16px",
    fontSize:14,
    color:"#374151",
    display:"flex",gap:6,alignItems:"center"
  },
  topicList:{display:"flex",flexWrap:"wrap",gap:8,justifyContent:"center"},
  topicTag:{
    background:"#fff1eb",
    color:"#ff4d05",
    padding:"4px 12px",
    borderRadius:99,
    fontSize:12,
    border:"1px solid #ffd5c5",
    fontWeight:500
  },
  studentBadge:{
    background:"#f9fafb",
    color:"#4b5563",
    padding:"8px 20px",
    borderRadius:99,
    fontSize:13,
    border:"1px solid #e5e7eb"
  },
  startBtn:{
    background:"#ff4d05",
    color:"#fff",
    border:"none",
    borderRadius:12,
    padding:"14px 40px",
    fontSize:16,
    fontWeight:700,
    cursor:"pointer",
    width:"100%",
    letterSpacing:0.5
  },

  // ── SPINNER ──
  spinner:{
    width:44,height:44,
    border:"4px solid #ffe5d9",
    borderTop:"4px solid #ff4d05",
    borderRadius:"50%",
    animation:"spin 0.8s linear infinite"
  },

  // ── EXAM ──
  examHeader:{
    width:"100%",maxWidth:700,
    display:"flex",alignItems:"center",justifyContent:"space-between",
    padding:"12px 0",marginBottom:8
  },
  examTitle:{color:"#111827",fontWeight:700,fontSize:15},
  timer:{fontSize:22,fontWeight:900,letterSpacing:2},
  progressWrap:{
    width:"100%",maxWidth:700,height:6,
    background:"#e5e7eb",borderRadius:99,overflow:"hidden",marginBottom:4
  },
  progressBar:{height:"100%",background:"#ff4d05",transition:"width 0.3s"},
  progressLabel:{
    width:"100%",maxWidth:700,
    textAlign:"right",fontSize:12,color:"#9ca3af",marginBottom:12
  },
  qGrid:{
    display:"flex",flexWrap:"wrap",gap:6,
    maxWidth:700,width:"100%",marginBottom:16,justifyContent:"center"
  },
  qDot:{width:32,height:32,borderRadius:8,fontSize:12,cursor:"pointer"},
  qCard:{
    background:"#ffffff",
    border:"1px solid #e5e7eb",
    borderRadius:20,
    padding:"28px 24px",
    maxWidth:700,width:"100%",marginBottom:16,
    boxShadow:"0 4px 16px rgba(0,0,0,0.05)"
  },
  qMeta:{display:"flex",alignItems:"center",gap:10,marginBottom:16,flexWrap:"wrap"},
  topicBadge:{
    background:"#fff1eb",color:"#ff4d05",
    padding:"3px 10px",borderRadius:99,fontSize:12,
    border:"1px solid #ffd5c5",fontWeight:700
  },
  flagBtn:{marginLeft:"auto",background:"none",border:"none",cursor:"pointer",fontSize:12},
  qText:{color:"#111827",fontSize:17,lineHeight:1.7,marginBottom:20,fontWeight:500},
  choiceBtn:{
    display:"flex",alignItems:"center",gap:12,
    padding:"14px 16px",borderRadius:12,cursor:"pointer",
    width:"100%",transition:"all 0.15s"
  },
  choiceLetter:{
    minWidth:28,height:28,borderRadius:8,
    display:"flex",alignItems:"center",justifyContent:"center",
    fontSize:13,fontWeight:700,flexShrink:0
  },
  navRow:{display:"flex",gap:12,maxWidth:700,width:"100%",justifyContent:"space-between"},
  navBtn:{
    background:"#ffffff",color:"#374151",
    border:"1px solid #e5e7eb",borderRadius:10,
    padding:"10px 20px",cursor:"pointer",fontSize:14,
    // fontFamily:"'Sarabun',sans-serif"
  },
  navBtnPrimary:{
    background:"#ff4d05",color:"#fff",border:"none",
    borderRadius:10,padding:"10px 24px",cursor:"pointer",
    fontSize:14,fontWeight:700
  },
  submitBtn:{
    background:"#16a34a",color:"#fff",border:"none",
    borderRadius:10,padding:"10px 28px",cursor:"pointer",
    fontSize:15,fontWeight:700
  },

  // ── RESULT ──
  resultWrap:{
    width:"100%",maxWidth:700,
    display:"flex",flexDirection:"column",gap:16,marginTop:16
  },
  errorBanner:{
    background:"#fef3c7",border:"1px solid #fde68a",
    borderRadius:12,padding:"12px 16px",
    color:"#92400e",fontSize:13,
  },

  // Score hero
  scoreHero:{
    background:"#ffffff",
    border:"1px solid #e5e7eb",
    borderRadius:24,
    padding:"36px 28px 28px",
    display:"flex",flexDirection:"column",alignItems:"center",gap:20,
    boxShadow:"0 8px 24px rgba(0,0,0,0.06)"
  },
  scoreHeroInner:{
    display:"flex",flexDirection:"column",alignItems:"center",gap:12
  },
  scoreLabelTop:{
    color:"#9ca3af",fontSize:13,fontWeight:500,
    textTransform:"uppercase",letterSpacing:1
  },
  scoreCircle:{
    width:140,height:140,borderRadius:"50%",
    border:"6px solid #16a34a",
    display:"flex",flexDirection:"column",
    alignItems:"center",justifyContent:"center",
    background:"#ffffff",
    boxShadow:"0 4px 20px rgba(0,0,0,0.08)"
  },
  levelPill:{
    padding:"6px 20px",borderRadius:99,
    fontSize:15,fontWeight:700
  },
  statsRow:{
    display:"flex",gap:10,width:"100%",justifyContent:"center",flexWrap:"wrap"
  },
  statBox:{
    flex:"1 1 100px",maxWidth:140,
    background:"#ffffff",border:"2px solid #e5e7eb",
    borderRadius:14,padding:"14px 12px",
    display:"flex",flexDirection:"column",alignItems:"center",gap:4,
    boxShadow:"0 2px 8px rgba(0,0,0,0.04)"
  },

  // Section
  section:{
    background:"#ffffff",
    border:"1px solid #e5e7eb",
    borderRadius:20,padding:"22px 20px",
    boxShadow:"0 4px 12px rgba(0,0,0,0.04)"
  },
  sectionHeader:{display:"flex",alignItems:"center",gap:8,marginBottom:16},
  sectionIcon:{fontSize:20},
  sectionTitle:{
    color:"#111827",fontSize:16,fontWeight:700,
    margin:0
  },

  // Weakness
  weakCard:{
    background:"#fafafa",border:"1px solid #f0f0f0",
    borderRadius:12,padding:"14px 16px",
    display:"flex",gap:16,flexWrap:"wrap"
  },
  weakLeft:{display:"flex",flexDirection:"column",gap:4,minWidth:100},
  weakTopic:{
    background:"#fff1eb",color:"#ff4d05",
    padding:"3px 10px",borderRadius:99,fontSize:12,
    border:"1px solid #ffd5c5",fontWeight:700,alignSelf:"flex-start"
  },
  weakCount:{color:"#dc2626",fontSize:13,fontWeight:700},
  weakRight:{flex:1,display:"flex",flexDirection:"column",gap:4},
  weakText:{margin:0,color:"#374151",fontSize:13},
  weakPractice:{margin:0,color:"#4f46e5",fontSize:13},

  // Recommendations
  recItem:{
    display:"flex",alignItems:"flex-start",gap:10,
    background:"#f9fafb",borderRadius:10,padding:"10px 14px",
    border:"1px solid #f0f0f0"
  },
  recNum:{
    minWidth:24,height:24,background:"#ff4d05",color:"#fff",
    borderRadius:6,display:"flex",alignItems:"center",
    justifyContent:"center",fontSize:12,fontWeight:700,flexShrink:0
  },

  // Review cards
  reviewCard:{
    background:"#ffffff",
    borderRadius:14,
    padding:"16px",
    border:"1px solid #e5e7eb",
    borderLeft:"4px solid #e5e7eb",
  },
  reviewTop:{
    display:"flex",alignItems:"flex-start",gap:12,marginBottom:12
  },
  reviewNum:{
    minWidth:26,height:26,borderRadius:7,
    display:"flex",alignItems:"center",justifyContent:"center",
    fontSize:12,fontWeight:700,color:"#fff",flexShrink:0,marginTop:2
  },
  reviewTopicPill:{
    display:"inline-block",
    background:"#fff1eb",color:"#ff4d05",
    padding:"2px 8px",borderRadius:99,fontSize:11,
    border:"1px solid #ffd5c5",fontWeight:600,marginBottom:4
  },
  reviewQuestion:{
    margin:0,color:"#111827",fontSize:14,lineHeight:1.6,
    fontWeight:500
  },
  reviewStatus:{
    fontSize:22,fontWeight:900,flexShrink:0,marginLeft:"auto"
  },
  reviewChoices:{
    display:"flex",flexDirection:"column",gap:6,paddingLeft:38
  },
  reviewChoice:{
    display:"flex",alignItems:"center",gap:8,
    padding:"9px 12px",borderRadius:9,
  },
  reviewChoiceLetter:{
    minWidth:22,height:22,borderRadius:6,
    display:"flex",alignItems:"center",justifyContent:"center",
    fontSize:11,fontWeight:700,flexShrink:0
  },
  noAnswerTag:{
    color:"#9ca3af",fontSize:12,
    fontStyle:"italic",padding:"4px 0"
  },

  retryBtn:{
    background:"#ffffff",color:"#374151",
    border:"2px solid #e5e7eb",borderRadius:12,
    padding:"12px 32px",cursor:"pointer",
    fontSize:15,
    fontWeight:600,alignSelf:"center",
    boxShadow:"0 2px 8px rgba(0,0,0,0.04)"
  },
};