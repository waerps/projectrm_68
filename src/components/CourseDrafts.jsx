import { useCallback, useEffect, useState } from "react";
import axios from "axios";
import {
  BookOpen, CalendarDays, Check, FileClock, Loader2, PlayCircle, Trash2, UserRound,
} from "lucide-react";
import { API_URL } from "../config";
import Modal from "./ui/Modal";
import Badge from "./ui/Badge";
import EmptyState from "./ui/EmptyState";
import Spinner from "./ui/Spinner";
import { BTN, CALLOUT, CALLOUT_ICON } from "./ui/tokens";
import { confirmDialog, toast } from "./ui/dialogs";

/* ─────────────────────────────────────────────────────────────────────────
   การแก้ไขคอร์สที่ "รอเผยแพร่" — ใช้ร่วมกันในหน้าคอร์ส / ตารางสอน / ติวเตอร์
   - useCourseDrafts      ดึงรายการร่าง (ทั้งคอร์สเดียว หรือกรองตามติวเตอร์/ประเภท)
   - PendingDraftsCallout แถบเตือนในหน้า + ปุ่มเปิดรายการ
   - CourseDraftsModal    รายการร่างอ่านรู้เรื่อง ยกเลิกทีละรายการ และเผยแพร่ทีละคอร์ส
   เมื่อมีการบันทึกร่างใหม่ (API ตอบ 202) ระบบยิง event COURSE_DRAFTS_CHANGED ให้ทุกจุดโหลดใหม่เอง
   ────────────────────────────────────────────────────────────────────── */

const API_BASE = `${API_URL}/api/admin`;
export const COURSE_DRAFTS_CHANGED = "course-drafts-changed";
export const notifyCourseDraftsChanged = () => window.dispatchEvent(new Event(COURSE_DRAFTS_CHANGED));

const KIND = {
  add: { label: "เพิ่ม", tone: "success", tile: "bg-emerald-50 text-emerald-600" },
  edit: { label: "แก้ไข", tone: "info", tile: "bg-blue-50 text-blue-600" },
  remove: { label: "ลบ", tone: "danger", tile: "bg-red-50 text-red-600" },
};
const CATEGORY_ICON = { schedule: CalendarDays, tutor: UserRound, course: BookOpen, video: PlayCircle };

const savedAt = (value) => {
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? "" : d.toLocaleString("th-TH", {
    day: "numeric", month: "short", hour: "2-digit", minute: "2-digit",
  });
};

export function useCourseDrafts({ courseId, tutorId, category, enabled = true } = {}) {
  const [state, setState] = useState({ groups: [], matchCount: 0, loading: true });

  const reload = useCallback(async () => {
    if (!enabled) return;
    try {
      if (courseId) {
        const { data } = await axios.get(`${API_BASE}/courses/${courseId}/drafts`);
        const items = Array.isArray(data) ? data : [];
        setState({
          groups: items.length ? [{ CourseID: courseId, CourseName: items[0].CourseName, matchCount: items.length, items }] : [],
          matchCount: items.length,
          loading: false,
        });
      } else {
        const { data } = await axios.get(`${API_BASE}/course-drafts`, { params: { tutorId, category } });
        setState({ groups: data.groups || [], matchCount: data.matchCount || 0, loading: false });
      }
    } catch (e) {
      console.error("[course drafts]", e);
      setState((s) => ({ ...s, loading: false }));
    }
  }, [courseId, tutorId, category, enabled]);

  useEffect(() => { reload(); }, [reload]);
  useEffect(() => {
    window.addEventListener(COURSE_DRAFTS_CHANGED, reload);
    return () => window.removeEventListener(COURSE_DRAFTS_CHANGED, reload);
  }, [reload]);

  return { ...state, reload };
}

export async function publishCourse(courseId) {
  const { data } = await axios.post(`${API_BASE}/courses/${courseId}/publish`);
  notifyCourseDraftsChanged();
  return data;
}

async function cancelDraft(item) {
  const ok = await confirmDialog(
    `ยกเลิก "${item.Title}"?\nการแก้ไขนี้จะไม่ถูกนำไปใช้ตอนเผยแพร่`,
    { title: "ยกเลิกรายการแก้ไข", confirmText: "ยกเลิกรายการ", cancelText: "เก็บไว้", danger: true },
  );
  if (!ok) return false;
  try {
    await axios.delete(`${API_BASE}/courses/${item.CourseID}/drafts/${item.ActionId}`);
    toast("ยกเลิกรายการแก้ไขแล้ว", "success");
    notifyCourseDraftsChanged();
    return true;
  } catch (e) {
    toast(e.response?.data?.message || "ยกเลิกรายการแก้ไขไม่สำเร็จ", "error");
    return false;
  }
}

function DraftRow({ item, onCancel, busy, muted = false }) {
  const kind = KIND[item.Kind] || KIND.edit;
  const Icon = CATEGORY_ICON[item.Category] || BookOpen;
  return (
    <li className="flex items-start gap-3 py-3">
      <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${muted ? "bg-slate-100 text-slate-400" : kind.tile}`}>
        <Icon className="h-4 w-4" />
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <Badge tone={muted ? "neutral" : kind.tone}>{kind.label}</Badge>
          <p className={`min-w-0 text-sm break-words ${muted ? "font-medium text-slate-600" : "font-semibold text-slate-800"}`}>{item.Title}</p>
        </div>
        {item.Detail && <p className={`mt-1 text-xs leading-relaxed break-words ${muted ? "text-slate-400" : "text-slate-500"}`}>{item.Detail}</p>}
        <p className="mt-1 text-[11px] text-slate-400">บันทึกเมื่อ {savedAt(item.CreatedAt)}</p>
      </div>
      <button type="button" onClick={() => onCancel(item)} disabled={busy}
        aria-label={`ยกเลิกรายการ ${item.Title}`} title="ยกเลิกรายการนี้"
        className="shrink-0 rounded-xl p-2 text-slate-400 transition hover:bg-red-50 hover:text-red-600 disabled:opacity-50">
        <Trash2 className="h-4 w-4" />
      </button>
    </li>
  );
}

/* รายการของคอร์สเดียว: รายการที่เกี่ยวกับหน้านี้ (IsMatch) แสดงก่อนตามปกติ
   ส่วนรายการอื่นของคอร์สเดียวกันแยกไว้ด้านล่างแบบสีจาง — ยังเห็นครบก่อนกดเผยแพร่ */
function DraftGroup({ group, showHeader, onCancel, onPublish, busy }) {
  const related = group.items.filter((item) => item.IsMatch !== false);
  const others = group.items.filter((item) => item.IsMatch === false);
  return (
    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
      {showHeader && (
        <header className="flex flex-col gap-2 border-b border-slate-100 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <p className="truncate text-sm font-bold text-slate-900">{group.CourseName}</p>
            <p className="text-xs text-slate-500">
              {others.length
                ? `เกี่ยวกับหน้านี้ ${related.length} รายการ · อื่น ๆ ${others.length} รายการ`
                : `รอเผยแพร่ ${group.items.length} รายการ`}
            </p>
          </div>
          <button type="button" onClick={() => onPublish(group)} disabled={busy}
            className={`${BTN.base} ${BTN.primary} ${BTN.sm} w-full sm:w-auto`}>
            <Check className="h-3.5 w-3.5" /> เผยแพร่คอร์สนี้ ({group.items.length})
          </button>
        </header>
      )}
      {related.length > 0 && (
        <ul className="divide-y divide-slate-100 px-4">
          {related.map((item) => (
            <DraftRow key={item.ActionId} item={item} onCancel={onCancel} busy={busy} />
          ))}
        </ul>
      )}
      {others.length > 0 && (
        <div className={`bg-slate-50/70 ${related.length ? "border-t border-slate-100" : ""}`}>
          <p className="px-4 pt-3 text-xs font-semibold text-slate-500">การแก้ไขอื่นของคอร์สนี้ที่จะเผยแพร่พร้อมกัน</p>
          <ul className="divide-y divide-slate-100 px-4">
            {others.map((item) => (
              <DraftRow key={item.ActionId} item={item} onCancel={onCancel} busy={busy} muted />
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}

/* รายการร่างหลายคอร์ส (เปิดจากแถบเตือน) — เผยแพร่ทีละคอร์สได้ในกล่องนี้ */
export function CourseDraftsModal({ drafts, onClose, onChanged, note }) {
  const [busy, setBusy] = useState(false);

  const handleCancel = async (item) => {
    setBusy(true);
    if (await cancelDraft(item)) { await drafts.reload(); onChanged?.(); }
    setBusy(false);
  };

  const handlePublish = async (group) => {
    const ok = await confirmDialog(
      `เผยแพร่การแก้ไข ${group.items.length} รายการของคอร์ส "${group.CourseName}"?\nนักเรียนและติวเตอร์จะเห็นข้อมูลใหม่ทันที`,
      { title: "เผยแพร่คอร์ส", confirmText: "เผยแพร่", danger: false },
    );
    if (!ok) return;
    setBusy(true);
    try {
      const data = await publishCourse(group.CourseID);
      toast(data?.message || "เผยแพร่คอร์สแล้ว", "success");
      await drafts.reload();
      onChanged?.();
    } catch (e) {
      toast(e.response?.data?.message || "เผยแพร่คอร์สไม่สำเร็จ", "error");
      await drafts.reload();
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal title="การแก้ไขที่รอเผยแพร่" subtitle="ตรวจทานก่อนเผยแพร่ หรือยกเลิกรายการที่ไม่ต้องการ"
      icon={FileClock} onClose={onClose} size="lg"
      footer={<button type="button" onClick={onClose} className={`${BTN.base} ${BTN.secondary} ${BTN.md}`}>ปิด</button>}>
      {drafts.loading ? (
        <Spinner block label="กำลังโหลดรายการ..." />
      ) : drafts.groups.length === 0 ? (
        <EmptyState icon={Check} title="ไม่มีการแก้ไขที่รอเผยแพร่" description="ทุกการแก้ไขถูกเผยแพร่หรือยกเลิกแล้ว" />
      ) : (
        <div className="space-y-4">
          {note && <p className="text-xs text-slate-500">{note}</p>}
          {drafts.groups.map((group) => (
            <DraftGroup key={group.CourseID} group={group} showHeader onCancel={handleCancel} onPublish={handlePublish} busy={busy} />
          ))}
        </div>
      )}
    </Modal>
  );
}

/* กล่องเผยแพร่คอร์สเดียว (เปิดจากปุ่ม "เผยแพร่" บนการ์ดคอร์ส) */
export function CoursePublishModal({ course, onClose, onPublished }) {
  const drafts = useCourseDrafts({ courseId: course.CourseID });
  const [busy, setBusy] = useState(false);
  const items = drafts.groups[0]?.items || [];

  const handleCancel = async (item) => {
    setBusy(true);
    if (await cancelDraft(item)) await drafts.reload();
    setBusy(false);
  };

  const handlePublish = async () => {
    setBusy(true);
    try {
      const data = await publishCourse(course.CourseID);
      toast(data?.message || "เผยแพร่คอร์สแล้ว", "success");
      onPublished?.();
      onClose();
    } catch (e) {
      toast(e.response?.data?.message || "เผยแพร่คอร์สไม่สำเร็จ", "error");
      await drafts.reload();
      onPublished?.();
    } finally {
      setBusy(false);
    }
  };

  const nothingToPublish = !drafts.loading && course.IsPublished && items.length === 0;

  return (
    <Modal title="เผยแพร่คอร์ส" subtitle={course.CourseName} icon={FileClock} onClose={onClose} size="lg"
      footer={<>
        <button type="button" onClick={onClose} disabled={busy} className={`${BTN.base} ${BTN.secondary} ${BTN.md}`}>ยกเลิก</button>
        <button type="button" onClick={handlePublish} disabled={busy || drafts.loading || nothingToPublish}
          className={`${BTN.base} ${BTN.primary} ${BTN.md}`}>
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />} เผยแพร่ตอนนี้
        </button>
      </>}>
      {drafts.loading ? (
        <Spinner block label="กำลังโหลดรายการ..." />
      ) : (
        <div className="space-y-4">
          <div className={`${CALLOUT.box} ${CALLOUT.info}`}>
            <FileClock className={`h-5 w-5 shrink-0 ${CALLOUT_ICON.info}`} />
            <p>
              {course.IsPublished
                ? items.length
                  ? `มีการแก้ไขรอเผยแพร่ ${items.length} รายการ เมื่อเผยแพร่ นักเรียนและติวเตอร์จะเห็นข้อมูลใหม่ทันที`
                  : "ไม่มีการแก้ไขที่รอเผยแพร่แล้ว"
                : "คอร์สนี้ยังเป็นฉบับร่าง เมื่อเผยแพร่ นักเรียนและติวเตอร์จะเห็นคอร์สนี้"}
            </p>
          </div>
          {items.length > 0 && (
            <DraftGroup group={drafts.groups[0]} showHeader={false} onCancel={handleCancel} busy={busy} />
          )}
        </div>
      )}
    </Modal>
  );
}

/* แถบเตือนในหน้า: บอกว่ามีการแก้ไขที่ยังไม่แสดงในหน้านี้ + ปุ่มเปิดรายการ */
export function PendingDraftsCallout({ courseId, tutorId, category, what = "", onChanged, className = "" }) {
  const drafts = useCourseDrafts({ courseId, tutorId, category });
  const [open, setOpen] = useState(false);
  if (drafts.loading || drafts.matchCount === 0) {
    return open ? <CourseDraftsModal drafts={drafts} onClose={() => setOpen(false)} onChanged={onChanged} /> : null;
  }
  const courseCount = drafts.groups.length;
  return (
    <>
      <div className={`${CALLOUT.box} ${CALLOUT.warning} flex-col sm:flex-row sm:items-center ${className}`}>
        <div className="flex min-w-0 flex-1 items-start gap-3">
          <FileClock className={`h-5 w-5 shrink-0 ${CALLOUT_ICON.warning}`} />
          <div className="min-w-0">
            <p className="font-semibold">
              มีการแก้ไข{what}รอเผยแพร่ {drafts.matchCount} รายการ{courseCount > 1 ? ` ใน ${courseCount} คอร์ส` : ""}
            </p>
            <p className="mt-0.5 text-xs opacity-80">ข้อมูลในหน้านี้ยังเป็นฉบับที่เผยแพร่อยู่ การแก้ไขจะแสดงหลังกดเผยแพร่</p>
          </div>
        </div>
        <button type="button" onClick={() => setOpen(true)}
          className={`${BTN.base} ${BTN.secondary} ${BTN.sm} w-full shrink-0 sm:w-auto`}>
          ดูรายการและเผยแพร่
        </button>
      </div>
      {open && (
        <CourseDraftsModal drafts={drafts} onClose={() => setOpen(false)} onChanged={onChanged}
          note={courseId ? null : "รายการที่เกี่ยวกับหน้านี้แสดงก่อน ส่วนการแก้ไขอื่นของคอร์สเดียวกันจะถูกเผยแพร่พร้อมกันเมื่อกด \"เผยแพร่คอร์สนี้\""} />
      )}
    </>
  );
}
