import katex from "katex";
import "katex/dist/katex.min.css";

// Only explicit delimiters are interpreted inside prose. A field consisting of
// a single LaTeX expression may also be entered without delimiters.
const MATH_PATTERN = /\$\$([\s\S]+?)\$\$|\\\[([\s\S]+?)\\\]|\\\(([\s\S]+?)\\\)|(?<!\\)\$([^\n$]+?)\$/g;

function renderMath(source, displayMode) {
  try {
    return katex.renderToString(source, {
      displayMode,
      throwOnError: true,
      trust: false,
      maxExpand: 1000,
      output: "html",
    });
  } catch {
    return null;
  }
}

export default function ExamMathText({ text }) {
  const value = String(text ?? "");
  const parts = [];
  let cursor = 0;
  for (const match of value.matchAll(MATH_PATTERN)) {
    const start = match.index;
    if (start > cursor) parts.push(value.slice(cursor, start));
    const formula = match[1] ?? match[2] ?? match[3] ?? match[4];
    const html = renderMath(formula, Boolean(match[1] ?? match[2]));
    parts.push(html ? <span key={start} dangerouslySetInnerHTML={{ __html: html }} /> : match[0]);
    cursor = start + match[0].length;
  }
  if (cursor === 0 && /^\s*\\[A-Za-z]+/.test(value)) {
    const html = renderMath(value.trim(), false);
    if (html) return <span dangerouslySetInnerHTML={{ __html: html }} />;
  }
  if (cursor < value.length) parts.push(value.slice(cursor));
  return <>{parts.length ? parts : value}</>;
}
