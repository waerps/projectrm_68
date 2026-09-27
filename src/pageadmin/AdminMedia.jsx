import { useCallback, useEffect, useMemo, useState } from "react";
import axios from "axios";
import {
  ArrowLeft, ChevronRight, Download, ExternalLink, Eye, FileText, FolderOpen, Library,
  Pencil, PlayCircle, Search, Trash2, Upload, Users, Video,
} from "lucide-react";
import { API_URL } from "../config";
import { getFileUrl } from "../utils/fileUrl";
import UIModal from "../components/ui/Modal";
import Spinner from "../components/ui/Spinner";
import EmptyState from "../components/ui/EmptyState";
import ErrorState from "../components/ui/ErrorState";
import { confirmDialog, toast } from "../components/ui/dialogs";
import { BTN, INPUT, PAGE_TITLE, PAGE_SUBTITLE } from "../components/ui/tokens";
import ClearFiltersButton from "../components/ui/ClearFiltersButton";

/* ─────────────────────────────────────────────────────────────────────────
   คลังสื่อ (แอดมิน) — ต่อ API จริง /api/admin/media
   - หน้าแรก: รายการคอร์ส-วิชา + จำนวนวิดีโอ/เอกสาร (ค้นหาได้)
   - เลือกแล้ว: ดู/แก้ชื่อ/ลบ วิดีโอและเอกสาร + เพิ่มเอกสาร
   ────────────────────────────────────────────────────────────────────── */

const API = `${API_URL}/api/admin/media`;
const authHeaders = () => ({ Authorization: `Bearer ${localStorage.getItem("token")}` });
const fmtDate = (v) => (v ? new Date(v).toLocaleDateString("th-TH", { day: "numeric", month: "short", year: "numeric" }) : "-");
const errMsg = (e, fallback) => e?.response?.data?.message || fallback;

function StatCard({ icon, label, value, color }) {
  const Icon = icon;
  return (
    <div className="flex min-w-0 items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl sm:h-12 sm:w-12 ${color}`}>
        <Icon className="h-5 w-5 text-white sm:h-6 sm:w-6" />
      </div>
      <div className="min-w-0">
        <p className="text-xs font-medium text-slate-600">{label}</p>
        <p className="truncate text-2xl font-bold text-slate-900">{Number(value || 0).toLocaleString("th-TH")}</p>
      </div>
    </div>
  );
}

/* ── หน้าแรก: รายการคอร์ส-วิชา ─────────────────────────────────────────── */
function MediaOverview({ onOpen }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [search, setSearch] = useState("");
  const [onlyWithMedia, setOnlyWithMedia] = useState("all");

  const load = useCallback(async () => {
    setLoading(true); setError(false);
    try {
      const res = await axios.get(`${API}/overview`, { headers: authHeaders() });
      setData(res.data);
    } catch (e) {
      console.error("[AdminMedia] overview", e);
      setError(true);
    } finally { setLoading(false); }
  }, []);
  useEffect(() => { load(); }, [load]);

  const items = useMemo(() => {
    const q = search.trim().toLowerCase();
    return (data?.items || []).filter((i) => {
      if (onlyWithMedia === "has" && !(i.videoCount + i.fileCount)) return false;
      if (onlyWithMedia === "none" && i.videoCount + i.fileCount) return false;
      if (!q) return true;
      return [i.courseName, i.subjectName, i.tutorName].some((t) => String(t || "").toLowerCase().includes(q));
    });
  }, [data, search, onlyWithMedia]);

  const filtered = search.trim() || onlyWithMedia !== "all";

  return (
    <div className="space-y-6">
      <div>
        <h1 className={PAGE_TITLE}>คลังสื่อการสอน</h1>
        <p className={PAGE_SUBTITLE}>วิดีโอและเอกสารประกอบการสอนของทุกคอร์สและวิชา</p>
      </div>

      {loading ? (
        <Spinner block label="กำลังโหลดคลังสื่อ..." />
      ) : error ? (
        <ErrorState description="โหลดข้อมูลคลังสื่อไม่สำเร็จ กรุณาลองใหม่อีกครั้ง" onRetry={load} />
      ) : (
        <>
          <div className="grid grid-cols-1 gap-3 min-[360px]:grid-cols-2 sm:gap-4 md:grid-cols-3 min-[360px]:[&>*:last-child:nth-child(odd)]:col-span-2 md:[&>*:last-child:nth-child(odd)]:col-span-1">
            <StatCard icon={FolderOpen} label="คอร์ส-วิชาทั้งหมด" value={data?.totals?.groups} color="bg-orange-500" />
            <StatCard icon={Video} label="วิดีโอทั้งหมด" value={data?.totals?.videos} color="bg-blue-500" />
            <StatCard icon={FileText} label="เอกสารทั้งหมด" value={data?.totals?.files} color="bg-emerald-500" />
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
            <div className="flex flex-col gap-3 md:flex-row">
              <div className="relative flex-1">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="ค้นหาคอร์ส วิชา หรือชื่อติวเตอร์..."
                  className={`${INPUT} pl-9`} />
              </div>
              <select value={onlyWithMedia} onChange={(e) => setOnlyWithMedia(e.target.value)}
                className={`${INPUT} md:w-56 truncate`}>
                <option value="all">ทั้งหมด</option>
                <option value="has">มีสื่อแล้ว</option>
                <option value="none">ยังไม่มีสื่อ</option>
              </select>
            </div>
            <div className="mt-2 flex items-center justify-between gap-2 pl-1">
              <p className="text-xs text-slate-500">แสดง {items.length} จาก {data?.items?.length || 0} รายการ</p>
              <ClearFiltersButton show={!!filtered} onClick={() => { setSearch(""); setOnlyWithMedia("all"); }} />
            </div>
          </div>

          {items.length === 0 ? (
            <EmptyState icon={Library} title={filtered ? "ไม่พบรายการที่ค้นหา" : "ยังไม่มีคอร์สที่มอบหมายวิชาให้ติวเตอร์"}
              description={filtered ? "ลองเปลี่ยนคำค้นหาหรือตัวกรอง" : "เมื่อกำหนดวิชาและติวเตอร์ในหน้าคอร์สแล้ว รายการจะแสดงที่นี่"} />
          ) : (
            <div className="grid gap-3 md:grid-cols-2">
              {items.map((i) => (
                <button key={`${i.courseId}-${i.subjectId}`} type="button" onClick={() => onOpen(i)}
                  className="group flex min-w-0 items-start gap-3 rounded-2xl border border-slate-200 bg-white p-4 text-left shadow-sm transition hover:border-orange-300 hover:shadow-md">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-orange-50">
                    <FolderOpen className="h-5 w-5 text-orange-500" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="line-clamp-2 break-words font-semibold text-slate-900">{i.courseName}</p>
                    <p className="mt-0.5 truncate text-sm text-slate-500">{i.subjectName || "-"}{i.tutorName ? ` · ${i.tutorName}` : ""}</p>
                    <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
                      <span className="inline-flex items-center gap-1 rounded-full border border-blue-200 bg-blue-50 px-2.5 py-0.5 font-semibold text-blue-700">
                        <Video className="h-3 w-3" /> {i.videoCount} วิดีโอ
                      </span>
                      <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-0.5 font-semibold text-emerald-700">
                        <FileText className="h-3 w-3" /> {i.fileCount} เอกสาร
                      </span>
                      {i.lastUpdated && <span className="text-slate-500">อัปเดต {fmtDate(i.lastUpdated)}</span>}
                    </div>
                  </div>
                  <ChevronRight className="mt-2 h-4 w-4 shrink-0 text-slate-400 transition group-hover:text-orange-500" />
                </button>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}

/* ── รายละเอียด: วิดีโอ + เอกสารของคอร์ส-วิชา ───────────────────────────── */
function MediaDetail({ group, onBack }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [editing, setEditing] = useState(null);   // { kind: 'video'|'file', id, value }
  const [uploadOpen, setUploadOpen] = useState(false);
  const [uploadName, setUploadName] = useState("");
  const [uploadFile, setUploadFile] = useState(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    setLoading(true); setError(false);
    try {
      const res = await axios.get(API, { params: { courseId: group.courseId, subjectId: group.subjectId }, headers: authHeaders() });
      setData(res.data);
    } catch (e) {
      console.error("[AdminMedia] detail", e);
      setError(true);
    } finally { setLoading(false); }
  }, [group.courseId, group.subjectId]);
  useEffect(() => { load(); }, [load]);

  const saveEdit = async () => {
    const value = editing.value.trim();
    if (!value) return toast(editing.kind === "video" ? "กรุณาระบุชื่อวิดีโอ" : "กรุณาระบุชื่อเอกสาร", "warning");
    setBusy(true);
    try {
      const body = editing.kind === "video" ? { title: value } : { name: value };
      await axios.put(`${API}/${editing.kind}/${editing.id}`, body, { headers: authHeaders() });
      toast(editing.kind === "video" ? "แก้ไขชื่อวิดีโอเรียบร้อยแล้ว" : "แก้ไขชื่อเอกสารเรียบร้อยแล้ว", "success");
      setEditing(null);
      load();
    } catch (e) {
      toast(errMsg(e, "บันทึกไม่สำเร็จ"), "error");
    } finally { setBusy(false); }
  };

  const remove = async (kind, item) => {
    const ok = await confirmDialog(
      kind === "video"
        ? `ลบวิดีโอ "${item.title}"?\nประวัติการดูและคำถามระหว่างวิดีโอของคลิปนี้จะถูกลบด้วย`
        : `ลบเอกสาร "${item.name}"?`,
      { title: kind === "video" ? "ยืนยันการลบวิดีโอ" : "ยืนยันการลบเอกสาร", confirmText: "ลบ", danger: true }
    );
    if (!ok) return;
    try {
      await axios.delete(`${API}/${kind}/${item.id}`, { headers: authHeaders() });
      toast(kind === "video" ? "ลบวิดีโอเรียบร้อยแล้ว" : "ลบเอกสารเรียบร้อยแล้ว", "success");
      load();
    } catch (e) {
      toast(errMsg(e, "ลบไม่สำเร็จ"), "error");
    }
  };

  const upload = async () => {
    if (!uploadFile) return toast("กรุณาเลือกไฟล์", "warning");
    setBusy(true);
    try {
      const fd = new FormData();
      fd.append("file", uploadFile);
      fd.append("name", uploadName.trim());
      fd.append("courseId", group.courseId);
      fd.append("subjectId", group.subjectId);
      await axios.post(`${API}/file`, fd, { headers: authHeaders() });
      toast("เพิ่มเอกสารเรียบร้อยแล้ว", "success");
      setUploadOpen(false); setUploadName(""); setUploadFile(null);
      load();
    } catch (e) {
      toast(errMsg(e, "เพิ่มเอกสารไม่สำเร็จ"), "error");
    } finally { setBusy(false); }
  };

  const course = data?.course;
  const videos = data?.videos || [];
  const files = data?.files || [];
  const iconBtn = "inline-flex min-h-10 min-w-10 items-center justify-center rounded-xl text-slate-500 transition hover:bg-slate-100 lg:min-h-8 lg:min-w-8";

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-2 text-sm text-slate-500">
        <button type="button" onClick={onBack} className="inline-flex items-center gap-1 font-medium transition hover:text-orange-600">
          <ArrowLeft className="h-4 w-4" /> คลังสื่อ
        </button>
        <ChevronRight className="h-4 w-4" />
        <span className="min-w-0 truncate font-semibold text-slate-800">{group.subjectName || group.courseName}</span>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <h1 className={`${PAGE_TITLE} break-words`}>{group.courseName}</h1>
          <p className={PAGE_SUBTITLE}>
            {group.subjectName || "-"}{group.tutorName ? ` · ${group.tutorName}` : ""}
            {course ? ` · นักเรียน ${course.studentCount.toLocaleString("th-TH")} คน` : ""}
          </p>
        </div>
        <button type="button" onClick={() => setUploadOpen(true)}
          className={`${BTN.base} ${BTN.primary} ${BTN.md} w-full sm:w-auto`}>
          <Upload className="h-4 w-4" /> เพิ่มเอกสาร
        </button>
      </div>

      {loading ? (
        <Spinner block label="กำลังโหลดสื่อของวิชานี้..." />
      ) : error ? (
        <ErrorState description="โหลดสื่อของวิชานี้ไม่สำเร็จ กรุณาลองใหม่อีกครั้ง" onRetry={load} />
      ) : (
        <div className="grid gap-6 lg:grid-cols-2">
          {/* วิดีโอ */}
          <section className="min-w-0 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="flex items-center gap-2 border-b border-slate-100 px-4 py-3 sm:px-5">
              <Video className="h-4 w-4 text-orange-500" />
              <h2 className="text-base font-bold text-slate-900">วิดีโอ</h2>
              <span className="text-sm text-slate-500">({videos.length})</span>
            </div>
            {videos.length === 0 ? (
              <EmptyState icon={Video} title="ยังไม่มีวิดีโอ" description="ติวเตอร์อัปโหลดวิดีโอได้จากหน้าจัดการเนื้อหาของวิชา" className="m-4 border-0" />
            ) : (
              <ul className="divide-y divide-slate-100">
                {videos.map((v) => (
                  <li key={v.id} className="flex min-w-0 items-start gap-3 px-4 py-3 sm:px-5">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50">
                      <PlayCircle className="h-5 w-5 text-blue-500" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="line-clamp-2 break-words text-sm font-semibold text-slate-900">{v.title}</p>
                      <p className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-slate-500">
                        <span>{fmtDate(v.createdAt)}</span>
                        <span className="inline-flex items-center gap-1"><Eye className="h-3 w-3" /> ดู {v.viewers} คน</span>
                        {v.uploader && <span className="truncate">โดย {v.uploader}</span>}
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center">
                      {v.url && (
                        <a href={v.url} target="_blank" rel="noreferrer" aria-label="เปิดวิดีโอ" title="เปิดวิดีโอ" className={iconBtn}>
                          <ExternalLink className="h-4 w-4" />
                        </a>
                      )}
                      <button type="button" aria-label="แก้ไขชื่อ" title="แก้ไขชื่อ" className={iconBtn}
                        onClick={() => setEditing({ kind: "video", id: v.id, value: v.title })}>
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button type="button" aria-label="ลบ" title="ลบ" className={`${iconBtn} hover:bg-red-50 hover:text-red-600`}
                        onClick={() => remove("video", v)}>
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>

          {/* เอกสาร */}
          <section className="min-w-0 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="flex items-center gap-2 border-b border-slate-100 px-4 py-3 sm:px-5">
              <FileText className="h-4 w-4 text-orange-500" />
              <h2 className="text-base font-bold text-slate-900">เอกสาร</h2>
              <span className="text-sm text-slate-500">({files.length})</span>
            </div>
            {files.length === 0 ? (
              <EmptyState icon={FileText} title="ยังไม่มีเอกสาร" description="กด “เพิ่มเอกสาร” เพื่ออัปโหลดไฟล์ประกอบการสอน" className="m-4 border-0" />
            ) : (
              <ul className="divide-y divide-slate-100">
                {files.map((f) => (
                  <li key={f.id} className="flex min-w-0 items-start gap-3 px-4 py-3 sm:px-5">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50">
                      <FileText className="h-5 w-5 text-emerald-600" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="line-clamp-2 break-words text-sm font-semibold text-slate-900">{f.name}</p>
                      <p className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-slate-500">
                        <span>{fmtDate(f.createdAt)}</span>
                        {f.size && <span>{f.size}</span>}
                        {f.uploader && <span className="truncate">โดย {f.uploader}</span>}
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center">
                      {f.path && (
                        <a href={getFileUrl(f.path)} target="_blank" rel="noreferrer" download aria-label="ดาวน์โหลด" title="ดาวน์โหลด" className={iconBtn}>
                          <Download className="h-4 w-4" />
                        </a>
                      )}
                      <button type="button" aria-label="แก้ไขชื่อ" title="แก้ไขชื่อ" className={iconBtn}
                        onClick={() => setEditing({ kind: "file", id: f.id, value: f.name })}>
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button type="button" aria-label="ลบ" title="ลบ" className={`${iconBtn} hover:bg-red-50 hover:text-red-600`}
                        onClick={() => remove("file", f)}>
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      )}

      {editing && (
        <UIModal title={editing.kind === "video" ? "แก้ไขชื่อวิดีโอ" : "แก้ไขชื่อเอกสาร"} icon={Pencil} onClose={() => setEditing(null)} size="md"
          footer={<>
            <button type="button" onClick={() => setEditing(null)} className={`${BTN.base} ${BTN.secondary} ${BTN.md}`}>ยกเลิก</button>
            <button type="button" onClick={saveEdit} disabled={busy} className={`${BTN.base} ${BTN.primary} ${BTN.md}`}>{busy ? "กำลังบันทึก..." : "บันทึก"}</button>
          </>}>
          <label className="mb-1.5 block text-sm font-medium text-slate-700">{editing.kind === "video" ? "ชื่อวิดีโอ" : "ชื่อเอกสาร"}</label>
          <input autoFocus value={editing.value} onChange={(e) => setEditing({ ...editing, value: e.target.value })}
            onKeyDown={(e) => { if (e.key === "Enter") saveEdit(); }} className={INPUT} />
          {editing.kind === "video" && <p className="mt-2 text-xs text-slate-500">แก้เฉพาะชื่อ ไฟล์วิดีโอและประวัติการดูของนักเรียนไม่เปลี่ยน</p>}
        </UIModal>
      )}

      {uploadOpen && (
        <UIModal title="เพิ่มเอกสาร" icon={Upload} onClose={() => setUploadOpen(false)} size="md"
          footer={<>
            <button type="button" onClick={() => setUploadOpen(false)} className={`${BTN.base} ${BTN.secondary} ${BTN.md}`}>ยกเลิก</button>
            <button type="button" onClick={upload} disabled={busy} className={`${BTN.base} ${BTN.primary} ${BTN.md}`}>{busy ? "กำลังอัปโหลด..." : "อัปโหลด"}</button>
          </>}>
          <div className="space-y-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">ชื่อเอกสาร <span className="font-normal text-slate-500">(ไม่ระบุ = ใช้ชื่อไฟล์)</span></label>
              <input value={uploadName} onChange={(e) => setUploadName(e.target.value)} placeholder="เช่น แบบฝึกหัดบทที่ 1" className={INPUT} />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">ไฟล์</label>
              <input type="file" onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
                className="block w-full text-sm text-slate-600 file:mr-3 file:rounded-xl file:border-0 file:bg-orange-50 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-orange-700 hover:file:bg-orange-100" />
              {uploadFile && <p className="mt-1.5 truncate text-xs text-slate-500">{uploadFile.name}</p>}
            </div>
          </div>
        </UIModal>
      )}
    </div>
  );
}

export default function AdminMedia() {
  const [group, setGroup] = useState(null);
  return (
    <div className="px-4 lg:px-0">
      {group ? <MediaDetail group={group} onBack={() => setGroup(null)} /> : <MediaOverview onOpen={setGroup} />}
    </div>
  );
}
