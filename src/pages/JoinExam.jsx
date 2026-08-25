import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { LogIn, AlertCircle } from "lucide-react";

function getCurrentUserId() {
  return JSON.parse(localStorage.getItem("user") || "null")?.id || null;
}

export default function JoinExam() {
  const navigate = useNavigate();
  const [code, setCode] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!getCurrentUserId()) navigate("/login?returnTo=/join");
  }, [navigate]);

  const handleChange = (e) => {
    // Only letters/digits, max 6, always uppercase — matches the code format from tutor.exam.routes.js
    const clean = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 6);
    setCode(clean);
    setError("");
  };

  const handleJoin = () => {
    if (code.length !== 6) {
      setError("กรุณากรอกรหัสให้ครบ 6 หลัก");
      return;
    }
    navigate(`/exam/${code}`);
  };

  return (
    <div className="max-w-sm mx-auto mt-24 px-4 text-center space-y-6">
      <div>
        <h1 className="text-xl font-bold text-neutral-900">เข้าสู่ห้องสอบ</h1>
        <p className="text-sm text-neutral-500 mt-1">กรอกรหัสที่ติวเตอร์ให้มา</p>
      </div>

      <input
        type="text"
        value={code}
        onChange={handleChange}
        onKeyDown={(e) => e.key === "Enter" && handleJoin()}
        placeholder="รหัส 6 หลัก"
        autoFocus
        className="w-full text-center text-3xl font-mono font-bold tracking-[0.3em] uppercase border-2 border-neutral-200 rounded-2xl py-4 focus:outline-none focus:ring-2 focus:ring-orange-300 focus:border-orange-400"
      />

      {error && (
        <div className="flex items-center justify-center gap-2 text-red-500 text-sm">
          <AlertCircle className="h-4 w-4" /> {error}
        </div>
      )}

      <button
        onClick={handleJoin}
        disabled={code.length !== 6}
        className="w-full flex items-center justify-center gap-2 bg-orange-500 hover:bg-orange-600 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-xl py-3 text-sm font-semibold transition"
      >
        <LogIn className="h-4 w-4" /> เข้าสอบ
      </button>
    </div>
  );
}