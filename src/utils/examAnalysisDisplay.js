// A saved AI response is displayable only after the server verified its source data.
export const isVerifiedAiSummary = (row) => Boolean(
  row && row.validation?.status === "passed" && row.analysisAvailable === true
  && !row.stale && !row.numberWarnings?.length
);

export function aiAnalysisNotice(row) {
  if (!row) return "ยังไม่มีผลวิเคราะห์โดย AI ของรอบนี้";
  if (row.notice || row.analysisNotice) return row.notice || row.analysisNotice;
  if (row.stale) return "ข้อมูลผลสอบมีการเปลี่ยนแปลง กรุณาวิเคราะห์ใหม่ด้วย AI";
  if (row.validation?.status === "failed" || row.numberWarnings?.length) {
    return "ผลวิเคราะห์โดย AI ยังไม่ผ่านการตรวจสอบ จึงแสดงเฉพาะข้อมูลผลสอบ";
  }
  return "ผลวิเคราะห์เดิมยังไม่ผ่านการตรวจสอบกับข้อมูลผลสอบ กรุณาวิเคราะห์ใหม่ด้วย AI";
}

const validSeconds = (value) => (typeof value === "number" || (typeof value === "string" && value.trim() !== ""))
  && Number.isFinite(Number(value)) && Number(value) >= 0;

export function examTimingForDisplay(student) {
  const status = student?.timingStatus || "unavailable";
  const unavailable = status !== "complete";
  const seconds = validSeconds(student?.secondsUsed) ? Number(student.secondsUsed) : null;
  const questionCount = Number(student?.totalQuestions);
  // Use the server's verified average; missing/null/legacy timing must stay unavailable.
  const average = !unavailable && validSeconds(student?.avgTimePerQuestion)
    ? Number(student.avgTimePerQuestion) : null;
  return {
    avgTimePerQuestion: average,
    secondsUsed: unavailable || average == null ? null : seconds,
    totalQuestions: Number.isInteger(questionCount) && questionCount > 0 ? questionCount : null,
    timingStatus: status,
    timingIssues: Array.isArray(student?.timingIssues) ? student.timingIssues : [],
    ...(Object.prototype.hasOwnProperty.call(student || {}, "classAvgTimePerQuestion")
      ? { classAvgTimePerQuestion: validSeconds(student.classAvgTimePerQuestion) ? Number(student.classAvgTimePerQuestion) : null }
      : {}),
  };
}

export const formatSecondsPerQuestion = (value) => validSeconds(value)
  ? Number(value).toLocaleString("th-TH", { minimumFractionDigits: 1, maximumFractionDigits: 1 })
  : "—";

export const parentMessageAttribution = (row) => row?.teacherEdited
  ? "ร่างโดย AI · ผู้สอนปรับแก้"
  : "ร่างโดย AI";

export function parentMessageParts(row, message = row?.parentMessage || "") {
  const prefix = row?.factualIntro || row?.overview || "";
  return { prefix, editable: prefix && message.startsWith(prefix) ? message.slice(prefix.length).trimStart() : message };
}
