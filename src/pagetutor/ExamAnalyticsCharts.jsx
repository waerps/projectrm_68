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

export function TopicAvgChart({ topicStats }) {
  return (
    <ResponsiveContainer width="100%" height={220}>
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
