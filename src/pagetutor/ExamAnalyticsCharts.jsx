// กราฟแท่งของแท็บ "ภาพรวม" ในหน้าวิเคราะห์ผลสอบ — แยกไฟล์ออกมาเพื่อโหลดไลบรารีกราฟ (recharts ~100 KB)
// แบบ lazy: หัวข้อและตัวเลขสรุปของหน้าแสดงได้ก่อน ไม่ต้องรอไลบรารีกราฟ (Lighthouse Performance)
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell, ReferenceLine,
} from "recharts";

const fmtPct = v => `${(v * 100).toFixed(1)}%`;

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

export function ScoreHistogramChart({ hist }) {
  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={hist} barCategoryGap="15%">
        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
        <XAxis dataKey="range" tick={{ fontSize: 10, fill: "#94a3b8" }} tickLine={false} axisLine={false} />
        <YAxis tick={{ fontSize: 10, fill: "#94a3b8" }} tickLine={false} axisLine={false} allowDecimals={false} />
        <Tooltip content={<ChartTooltip formatValue={(v) => `${v} คน`} />} cursor={{ fill: "#f8fafc" }} />
        <Bar dataKey="count" radius={[4, 4, 0, 0]} name="จำนวนนักเรียน">
          {hist.map((entry, i) => <Cell key={i} fill={i >= 5 ? "#22c55e" : i >= 4 ? "#f97316" : "#ef4444"} />)}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

// ชื่อหมวดบนแกนกราฟ: ตัดคำภาษาไทยตามคำ แบ่งได้สูงสุด 2 บรรทัด เกินนั้นต่อท้ายด้วย …
// (นับตามตัวอักษรที่เห็น ไม่แยกสระ/วรรณยุกต์ออกจากพยัญชนะ) ชื่อเต็มดูได้ใน tooltip
const graphemes = (str) => (typeof Intl !== "undefined" && Intl.Segmenter
  ? [...new Intl.Segmenter("th", { granularity: "grapheme" }).segment(str)].map((x) => x.segment)
  : [...str]);
const words = (str) => (typeof Intl !== "undefined" && Intl.Segmenter
  ? [...new Intl.Segmenter("th", { granularity: "word" }).segment(str)].map((x) => x.segment)
  : str.split(/(\s+)/));
const wrapTopic = (text, perLine = 14) => {
  const lines = [""];
  for (const w of words(String(text ?? ""))) {
    const cur = lines[lines.length - 1];
    if (graphemes(cur + w).length <= perLine || !cur) {
      lines[lines.length - 1] = cur + w;
    } else if (lines.length < 2) {
      lines.push(w.trimStart());
    } else {
      lines[1] += w;
    }
  }
  return lines.map((l, i) => {
    const g = graphemes(l.trim());
    return i === 1 && g.length > perLine ? `${g.slice(0, perLine - 1).join("")}…` : g.slice(0, i === 0 ? perLine + 2 : perLine + 1).join("");
  });
};
function TopicTick({ x, y, payload }) {
  const lines = wrapTopic(payload?.value);
  const dy0 = lines.length > 1 ? -5 : 3;
  return (
    <text x={x} y={y} textAnchor="end" fontSize={10} fill="#475569">
      <title>{payload?.value}</title>
      {lines.map((l, i) => <tspan key={i} x={x} dy={i === 0 ? dy0 : 12}>{l}</tspan>)}
    </text>
  );
}

export function TopicAvgChart({ topicStats }) {
  // หมวดเยอะ → กราฟสูงขึ้นตาม ชื่อไม่ทับกัน
  const height = Math.max(220, topicStats.length * 40);
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={topicStats} layout="vertical" barCategoryGap="20%">
        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
        <ReferenceLine x={0.5} stroke="#f97316" strokeDasharray="4 3" strokeWidth={1.5} />
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
          width={110}
          interval={0}
          tick={<TopicTick />}
          tickLine={false}
          axisLine={false}
        />
        <Tooltip
          content={({ active, payload, label }) => {
            if (!active || !payload?.length) return null;
            const pct = payload[0].value;
            const msg =
              pct >= 0.7 ? "ระดับดี ไม่ต้องสอนซ้ำ" :
                pct >= 0.5 ? "พอใช้ ควรทบทวนเล็กน้อย" :
                  "ควรสอนซ้ำบทนี้";
            return (
              <div className="bg-white border border-slate-200 rounded-xl shadow-lg px-3 py-2 text-xs">
                <p className="font-semibold text-slate-700 mb-1">{label}</p>
                <p className="text-slate-600">คะแนนเฉลี่ยรายหมวด {fmtPct(pct)}</p>
                <p className="text-slate-500">{topicStats.find((t) => t.topic === label)?.scoreText}</p>
                <p className={`mt-1 font-medium ${pct >= 0.7 ? "text-emerald-600" : pct >= 0.5 ? "text-amber-600" : "text-red-500"}`}>
                  → {msg}
                </p>
              </div>
            );
          }}
          cursor={{ fill: "#f8fafc" }}
        />
        <Bar dataKey="avgPct" radius={[0, 4, 4, 0]} name="คะแนนเฉลี่ยรายหมวด">
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
  );
}
