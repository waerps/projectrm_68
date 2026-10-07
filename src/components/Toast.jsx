const icons = { success: "✓", error: "✕", warning: "!", info: "i" };

const barColors = {
  success: "#22c55e",
  error:   "#ef4444",
  warning: "#f59e0b",
  info:    "#3b82f6",
};

const iconStyle = {
  success: { background: "#dcfce7", color: "#15803d" },
  error:   { background: "#fee2e2", color: "#dc2626" },
  warning: { background: "#fef3c7", color: "#d97706" },
  info:    { background: "#dbeafe", color: "#2563eb" },
};

// keyframes slideIn / shrinkBar อยู่ใน src/index.css

export function ToastContainer({ toasts, onRemove }) {
  return (
    <>

      <div style={{
        position: "fixed",
        top: 20,
        right: 20,
        display: "flex",
        flexDirection: "column",
        gap: 10,
        zIndex: 9999,
        minWidth: 300,
      }}>
        {toasts.map(t => (
          <div
            key={t.id}
            style={{
              position: "relative",
              display: "flex",
              alignItems: "flex-start",
              gap: 12,
              background: "#ffffff",
              border: "1px solid #f1f5f9",
              borderRadius: 16,
              padding: "14px 16px",
              boxShadow: "0 4px 24px rgba(0,0,0,0.10)",
              overflow: "hidden",
              animation: "slideIn 0.3s ease",
            }}
          >
            {/* Icon */}
            <div style={{
              width: 32,
              height: 32,
              borderRadius: 8,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 14,
              fontWeight: 700,
              flexShrink: 0,
              ...iconStyle[t.type],
            }}>
              {icons[t.type]}
            </div>

            {/* Text */}
            <div style={{ flex: 1 }}>
              <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: "#0f172a" }}>
                {t.title}
              </p>
              {t.message && (
                <p style={{ margin: "2px 0 0", fontSize: 12, color: "#64748b" }}>
                  {t.message}
                </p>
              )}
            </div>

            {/* Close button */}
            <button
              onClick={() => onRemove(t.id)}
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                color: "#cbd5e1",
                fontSize: 20,
                lineHeight: 1,
                padding: 0,
                flexShrink: 0,
              }}
            >
              ×
            </button>

            {/* ✅ Progress bar — เส้นวิ่งข้างล่าง */}
            <div style={{
              position: "absolute",
              bottom: 0,
              left: 0,
              height: 3,
              background: barColors[t.type],
              animation: "shrinkBar 3.5s linear forwards", // ✅ ตรงกับ setTimeout 3500ms ใน useToast
            }} />
          </div>
        ))}
      </div>
    </>
  );
}