// ★ ใหม่ (ทั้งไฟล์): หน้ารายละเอียดของการ์ดสรุปในแท็บ "ชั่วโมงการสอน" (หน้าติวเตอร์ของแอดมิน)
//   เส้นทาง: /admin/tutors/attendance/:metric?month=10&year=2026
//   metric = avg-rate | missed | at-risk | full-checkin | top-release
//   แต่ละ metric แสดงเฉพาะข้อมูลที่เกี่ยวกับการ์ดนั้น · เปลี่ยนเดือน/ปีและสลับการ์ดได้ในหน้านี้เลย
import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import {
  ArrowLeft, Percent, Clock, AlertTriangle, CheckCircle, CalendarX,
  Search, ChevronDown, ChevronUp, Camera, BookOpen, Users,
} from 'lucide-react';
import { MapPin as LuMapPin } from 'lucide-react';
import Spinner from '../components/ui/Spinner';
import ErrorState from '../components/ui/ErrorState';
import { PAGE_TITLE, PAGE_SUBTITLE, STAT_LABEL, STAT_VALUE, STAT_UNIT } from '../components/ui/tokens';
import {
  API_BASE, buildRange, MONTH_NAMES_TH, YEAR_OPTIONS, toLocalISODate, shortDate,
  TutorAvatar, RateBar, readMonthParam, readYearParam,
} from './AdminAttendanceDashboard';

// ── ข้อมูลของแต่ละการ์ด ─────────────────────────────────────────
const METRICS = {
  'avg-rate': {
    title: 'อัตราเช็กอินเฉลี่ย',
    desc: 'ค่าเฉลี่ยอัตราเช็กอินของติวเตอร์ทุกคนที่มีคาบสอนในช่วงนี้ แยกตามระดับ ≥ 80% / 50–79% / ต่ำกว่า 50%',
    icon: Percent, color: 'bg-emerald-500',
  },
  missed: {
    title: 'คาบที่ยังไม่ได้เช็กอิน',
    desc: 'คาบที่ถึงเวลาสอนแล้วแต่ไม่มีการเช็กอิน แยกตามติวเตอร์ · กดที่ชื่อเพื่อดูว่าขาดคาบไหน วันที่เท่าไหร่',
    icon: Clock, color: 'bg-red-500',
  },
  'at-risk': {
    title: 'ติวเตอร์เช็กอินต่ำกว่า 50%',
    desc: 'ติวเตอร์ที่เช็กอินไม่ถึงครึ่งของคาบที่ต้องสอน เรียงจากอัตราต่ำสุด · กดที่ชื่อเพื่อดูคาบที่ขาด',
    icon: AlertTriangle, color: 'bg-red-500',
  },
  'full-checkin': {
    title: 'ติวเตอร์เช็กอินครบ 100%',
    desc: 'ติวเตอร์ที่เช็กอินครบทุกคาบในช่วงนี้ พร้อมจำนวนคาบที่หลักฐานรูปยังไม่ครบ',
    icon: CheckCircle, color: 'bg-emerald-500',
  },
  'top-release': {
    title: 'ปล่อยคลาสมากที่สุด',
    desc: 'ติวเตอร์ที่กดปล่อยคาบสอนให้คนอื่นรับแทน เรียงจากมากไปน้อย · กดที่ชื่อเพื่อดูแต่ละครั้ง',
    icon: CalendarX, color: 'bg-amber-500',
  },
};
const METRIC_KEYS = Object.keys(METRICS);

const hasRate = (t) => t.AttendanceRate !== null && t.AttendanceRate !== undefined;

const RELEASE_STATUS = {
  accepted: { label: 'มีผู้รับสอนแล้ว', cls: 'bg-emerald-50 text-emerald-700' },
  open: { label: 'รอผู้รับสอน', cls: 'bg-amber-50 text-amber-700' },
  expired: { label: 'หมดเวลา ไม่มีผู้รับสอน', cls: 'bg-red-50 text-red-700' },
};

// ── รายการคาบที่ขาดของติวเตอร์ 1 คน (ใช้ endpoint เดิม missed-session-detail) ──
//   endpoint เดิมบังคับส่ง dayOfWeek จึงยิง 7 ครั้ง (อา–ส) แล้วรวมผล — ไม่ต้องแก้ backend
function MissedSessionsPanel({ adminId, start, end }) {
  const [rows, setRows] = useState(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    let alive = true;
    const s = start || '2020-01-01';
    const e = end || toLocalISODate(new Date());
    setRows(null); setError(false);
    Promise.all([1, 2, 3, 4, 5, 6, 7].map(dow =>
      fetch(`${API_BASE}/tutors/missed-session-detail?adminId=${adminId}&weekStart=${s}&weekEnd=${e}&dayOfWeek=${dow}`)
        .then(r => (r.ok ? r.json() : Promise.reject(new Error(`HTTP ${r.status}`))))
    ))
      .then(lists => {
        if (!alive) return;
        const all = lists.flat().filter(Boolean);
        all.sort((a, b) => `${a.ClassDate} ${a.StartTime}`.localeCompare(`${b.ClassDate} ${b.StartTime}`));
        setRows(all);
      })
      .catch(() => { if (alive) setError(true); });
    return () => { alive = false; };
  }, [adminId, start, end]);

  if (error) return <p className="px-4 py-4 text-xs text-red-600">โหลดรายการคาบที่ขาดไม่สำเร็จ</p>;
  if (!rows) return <Spinner block label="กำลังโหลดคาบที่ขาด..." wrapperClassName="py-6" />;
  if (rows.length === 0) return <p className="px-4 py-4 text-xs text-slate-500">ไม่พบรายละเอียดคาบที่ขาด</p>;

  return (
    <ul className="divide-y divide-slate-100">
      {rows.map((s, i) => (
        <li key={`${s.ClassDate}-${s.StartTime}-${i}`} className="flex items-start gap-3 px-4 sm:px-6 py-3">
          <span className="w-16 shrink-0">
            <span className="block text-xs font-bold text-slate-800">{shortDate(s.ClassDate)}</span>
            <span className="block text-[11px] text-slate-500">{s.StartTime}–{s.EndTime}</span>
          </span>
          <span className="block min-w-0 flex-1">
            <span className="block text-sm font-semibold text-slate-800 break-words">{s.SubjectName || s.CourseName}</span>
            <span className="block text-[11px] text-slate-500 break-words">
              {s.CourseName}
              {s.RoomDetail && <> · <LuMapPin className="inline h-3 w-3" /> {s.RoomDetail}</>}
            </span>
            {Boolean(Number(s.WasReleasedUnfilled)) && (
              <span className="mt-1 inline-block rounded-md bg-orange-50 border border-orange-200 px-2 py-0.5 text-[11px] font-semibold text-orange-700">
                ปล่อยคลาสแต่ไม่มีผู้รับสอน{s.ReleaseReason ? ` · ${s.ReleaseReason}` : ''}
              </span>
            )}
          </span>
        </li>
      ))}
    </ul>
  );
}

// ── รายการปล่อยคลาสของติวเตอร์ 1 คน ─────────────────────────────
function ReleasesPanel({ adminId, start, end }) {
  const [rows, setRows] = useState(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    let alive = true;
    setRows(null); setError(false);
    const url = (start && end)
      ? `${API_BASE}/tutors/${adminId}/releases?startDate=${start}&endDate=${end}`
      : `${API_BASE}/tutors/${adminId}/releases`;
    fetch(url)
      .then(r => (r.ok ? r.json() : Promise.reject(new Error(`HTTP ${r.status}`))))
      .then(d => { if (alive) setRows(Array.isArray(d) ? d : []); })
      .catch(() => { if (alive) setError(true); });
    return () => { alive = false; };
  }, [adminId, start, end]);

  if (error) return <p className="px-4 py-4 text-xs text-red-600">โหลดรายการปล่อยคลาสไม่สำเร็จ</p>;
  if (!rows) return <Spinner block label="กำลังโหลด..." wrapperClassName="py-6" />;
  if (rows.length === 0) return <p className="px-4 py-4 text-xs text-slate-500">ไม่พบรายการ</p>;

  return (
    <ul className="divide-y divide-slate-100">
      {rows.map(r => {
        const st = RELEASE_STATUS[r.Status] || { label: 'ยกเลิกแล้ว', cls: 'bg-slate-100 text-slate-500' };
        return (
          <li key={r.ReleaseId} className="flex items-start gap-3 px-4 sm:px-6 py-3">
            <span className="w-16 shrink-0">
              <span className="block text-xs font-bold text-slate-800">{shortDate(r.ClassDate)}</span>
              <span className="block text-[11px] text-slate-500">{r.StartTime}–{r.EndTime}</span>
            </span>
            <span className="block min-w-0 flex-1">
              <span className="block text-sm font-semibold text-slate-800 break-words">{r.SubjectName || r.CourseName}</span>
              {r.Reason && <span className="block text-[11px] text-slate-600">เหตุผล: {r.Reason}</span>}
              {r.Status === 'accepted' && r.AcceptedByNickname && (
                <span className="block text-[11px] text-emerald-600">รับสอนโดย: {r.AcceptedByNickname}</span>
              )}
            </span>
            <span className={`shrink-0 px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${st.cls}`}>{st.label}</span>
          </li>
        );
      })}
    </ul>
  );
}

// ── แถวติวเตอร์ (กดขยายได้ถ้ามี panel) ──────────────────────────
function TutorRow({ tutor, idx, right, sub, expandable, open, onToggle, children }) {
  const Inner = (
    <>
      <span className="text-xs font-bold text-slate-400 w-6 shrink-0 text-right">{idx + 1}</span>
      <TutorAvatar tutor={tutor} idx={idx} className="w-9 h-9 rounded-xl" />
      <span className="block min-w-0 flex-1">
        <span className="block text-sm font-semibold text-slate-900 truncate">{tutor.Nickname}</span>
        <span className="block text-[11px] text-slate-500 truncate">
          {[tutor.Firstname, tutor.Lastname].filter(Boolean).join(' ')}{sub ? ` · ${sub}` : ''}
        </span>
      </span>
      <span className="shrink-0 flex items-center gap-2">{right}</span>
      {expandable && (open
        ? <ChevronUp className="w-4 h-4 text-slate-400 shrink-0" />
        : <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />)}
    </>
  );
  return (
    <li className="border-b border-slate-100 last:border-0">
      {expandable ? (
        <button type="button" onClick={onToggle} aria-expanded={open}
          className="w-full flex items-center gap-3 px-4 sm:px-5 py-3 text-left hover:bg-orange-50/40 transition">
          {Inner}
        </button>
      ) : (
        <div className="flex items-center gap-3 px-4 sm:px-5 py-3">{Inner}</div>
      )}
      {expandable && open && <div className="bg-slate-50/70 border-t border-slate-100">{children}</div>}
    </li>
  );
}

function Pill({ tone = 'slate', children }) {
  const cls = {
    slate: 'bg-slate-100 text-slate-700',
    red: 'bg-red-50 text-red-700',
    amber: 'bg-amber-50 text-amber-700',
    green: 'bg-emerald-50 text-emerald-700',
  }[tone];
  return <span className={`inline-block whitespace-nowrap px-2.5 py-0.5 rounded-full text-xs font-semibold ${cls}`}>{children}</span>;
}

// ── หน้าหลัก ────────────────────────────────────────────────────
export default function AdminAttendanceMetricDetail() {
  const { metric } = useParams();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const monthNum = readMonthParam(`?${searchParams.toString()}`);
  const year = readYearParam(`?${searchParams.toString()}`);
  const range = useMemo(() => buildRange(monthNum, year), [monthNum, year]);
  const meta = METRICS[metric];

  const [tutors, setTutors] = useState([]);
  const [release, setRelease] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);
  const [search, setSearch] = useState('');
  const [bucket, setBucket] = useState('all'); // ใช้กับ avg-rate: all | good | watch | risk
  const [openId, setOpenId] = useState(null);

  // โหลดข้อมูล attendance + release ranking ของช่วงเดือน/ปีที่เลือก
  useEffect(() => {
    let alive = true;
    setLoading(true); setLoadError(false); setOpenId(null);
    const q = range.start && range.end ? `startDate=${range.start}&endDate=${range.end}` : '';
    Promise.all([
      fetch(`${API_BASE}/tutors/attendance${q ? `?${q}` : ''}`).then(r => (r.ok ? r.json() : Promise.reject(new Error(`HTTP ${r.status}`)))),
      // limit=all → ขอติวเตอร์ทุกคน (backend เวอร์ชันเก่าจะส่งมาแค่ top 5)
      fetch(`${API_BASE}/tutors/release-ranking?${q ? `${q}&` : ''}limit=all`).then(r => (r.ok ? r.json() : null)).catch(() => null),
    ])
      .then(([att, rel]) => {
        if (!alive) return;
        setTutors(att?.tutors || []);
        setRelease(rel);
      })
      .catch(() => { if (alive) { setTutors([]); setLoadError(true); } })
      .finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
  }, [range, reloadKey]);

  useEffect(() => { setSearch(''); setBucket('all'); setOpenId(null); }, [metric]);

  // ── ค่าของการ์ดทั้ง 5 (คำนวณแบบเดียวกับหน้า dashboard) ──
  const withRate = tutors.filter(hasRate);
  const avgRate = withRate.length ? Math.round(withRate.reduce((s, t) => s + t.AttendanceRate, 0) / withRate.length) : 0;
  const missedTotal = tutors.reduce((s, t) => s + (t.MissedCount ?? 0), 0);
  const riskList = withRate.filter(t => t.AttendanceRate < 50);
  const fullList = withRate.filter(t => t.AttendanceRate === 100);
  const releaseTutors = release?.tutors || [];
  const cardValue = {
    'avg-rate': `${avgRate}%`,
    missed: `${missedTotal} คาบ`,
    'at-risk': `${riskList.length} คน`,
    'full-checkin': `${fullList.length} คน`,
    'top-release': releaseTutors[0] ? releaseTutors[0].Nickname : '—',
  };

  const matchSearch = (t) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return [t.Nickname, t.Firstname, t.Lastname].some(v => (v || '').toLowerCase().includes(q));
  };

  const setPeriod = (key, value) => {
    const next = new URLSearchParams(searchParams);
    next.set(key, String(value));
    setSearchParams(next, { replace: true });
  };
  const periodQS = `month=${monthNum}&year=${year}`;
  const goBack = () => navigate(`/admin/tutors?tab=attendance&${periodQS}`);
  const goMetric = (k) => navigate(`/admin/tutors/attendance/${k}?${periodQS}`);
  const periodText = range.start ? `${shortDate(range.start)} – ${shortDate(range.end)} (${range.label})` : range.label;

  if (!meta) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 p-10 text-center">
        <p className="text-sm text-slate-600">ไม่พบหน้ารายละเอียดนี้</p>
        <button onClick={goBack} className="mt-3 text-sm font-semibold text-orange-600">กลับไปหน้าชั่วโมงการสอน</button>
      </div>
    );
  }
  const Icon = meta.icon;

  // ── สรุปตัวเลข + รายการ ตาม metric ──
  let summary = [];
  let list = [];
  let renderRow = null;
  let emptyText = 'ไม่มีข้อมูลในช่วงเวลานี้';

  if (metric === 'avg-rate') {
    const good = withRate.filter(t => t.AttendanceRate >= 80);
    const watch = withRate.filter(t => t.AttendanceRate >= 50 && t.AttendanceRate < 80);
    summary = [
      { label: 'อัตราเช็กอินเฉลี่ย', value: avgRate, unit: '%' },
      { label: 'ติวเตอร์ที่มีคาบสอน', value: withRate.length, unit: 'คน' },
      { label: 'คาบทั้งหมด / เช็กอิน', value: `${tutors.reduce((s, t) => s + (t.TotalScheduled ?? 0), 0)} / ${tutors.reduce((s, t) => s + (t.TotalCheckin ?? 0), 0)}`, unit: 'คาบ' },
    ];
    const buckets = { good, watch, risk: riskList, all: withRate };
    list = [...buckets[bucket]].filter(matchSearch).sort((a, b) => a.AttendanceRate - b.AttendanceRate);
    renderRow = (t, i) => (
      <TutorRow key={t.AdminId} tutor={t} idx={i}
        sub={`${t.TotalCheckin}/${t.TotalScheduled} คาบ`}
        right={<span className="w-28 sm:w-40"><RateBar rate={t.AttendanceRate} /></span>} />
    );
    emptyText = 'ไม่มีติวเตอร์ในระดับนี้';
  } else if (metric === 'missed') {
    const missedTutors = tutors.filter(t => (t.MissedCount ?? 0) > 0);
    const scheduled = tutors.reduce((s, t) => s + (t.TotalScheduled ?? 0), 0);
    summary = [
      { label: 'คาบที่ยังไม่ได้เช็กอิน', value: missedTotal, unit: 'คาบ' },
      { label: 'จากคาบทั้งหมด', value: scheduled ? Math.round((missedTotal / scheduled) * 100) : 0, unit: `% (${scheduled} คาบ)` },
      { label: 'ติวเตอร์ที่มีคาบขาด', value: missedTutors.length, unit: 'คน' },
    ];
    list = missedTutors.filter(matchSearch).sort((a, b) => (b.MissedCount ?? 0) - (a.MissedCount ?? 0));
    renderRow = (t, i) => (
      <TutorRow key={t.AdminId} tutor={t} idx={i} expandable
        open={openId === t.AdminId} onToggle={() => setOpenId(openId === t.AdminId ? null : t.AdminId)}
        sub={`สอน ${t.TotalScheduled} คาบ`}
        right={<Pill tone="red">ขาด {t.MissedCount} คาบ</Pill>}>
        <MissedSessionsPanel adminId={t.AdminId} start={range.start} end={range.end} />
      </TutorRow>
    );
    emptyText = 'ไม่มีคาบที่ยังไม่ได้เช็กอินในช่วงนี้';
  } else if (metric === 'at-risk') {
    summary = [
      { label: 'ติวเตอร์เช็กอินต่ำกว่า 50%', value: riskList.length, unit: 'คน' },
      { label: 'คาบที่ขาดรวมของกลุ่มนี้', value: riskList.reduce((s, t) => s + (t.MissedCount ?? 0), 0), unit: 'คาบ' },
      { label: 'อัตราต่ำสุด', value: riskList.length ? Math.min(...riskList.map(t => t.AttendanceRate)) : '—', unit: riskList.length ? '%' : '' },
    ];
    list = riskList.filter(matchSearch).sort((a, b) => a.AttendanceRate - b.AttendanceRate);
    renderRow = (t, i) => (
      <TutorRow key={t.AdminId} tutor={t} idx={i} expandable
        open={openId === t.AdminId} onToggle={() => setOpenId(openId === t.AdminId ? null : t.AdminId)}
        sub={`ขาด ${t.MissedCount} จาก ${t.TotalScheduled} คาบ`}
        right={<span className="w-28 sm:w-40"><RateBar rate={t.AttendanceRate} /></span>}>
        <MissedSessionsPanel adminId={t.AdminId} start={range.start} end={range.end} />
      </TutorRow>
    );
    emptyText = 'ไม่มีติวเตอร์ที่เช็กอินต่ำกว่า 50% ในช่วงนี้';
  } else if (metric === 'full-checkin') {
    const photoIssue = fullList.filter(t => (t.IncompletePhotoCount ?? 0) > 0).length;
    summary = [
      { label: 'ติวเตอร์เช็กอินครบ 100%', value: fullList.length, unit: `จาก ${withRate.length} คน` },
      { label: 'คาบที่เช็กอินรวม', value: fullList.reduce((s, t) => s + (t.TotalCheckin ?? 0), 0), unit: 'คาบ' },
      { label: 'ในกลุ่มนี้ที่รูปยังไม่ครบ', value: photoIssue, unit: 'คน' },
    ];
    list = fullList.filter(matchSearch).sort((a, b) => (b.TotalCheckin ?? 0) - (a.TotalCheckin ?? 0));
    renderRow = (t, i) => (
      <TutorRow key={t.AdminId} tutor={t} idx={i}
        sub={`ล่าสุด ${t.LastCheckinAt ? shortDate(t.LastCheckinAt) : '—'}`}
        right={<>
          <Pill tone="green">{t.TotalCheckin} คาบ</Pill>
          {(t.IncompletePhotoCount ?? 0) > 0 && (
            <span className="hidden sm:inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700">
              <Camera className="w-3 h-3" />รูปไม่ครบ {t.IncompletePhotoCount}
            </span>
          )}
        </>} />
    );
    emptyText = 'ยังไม่มีติวเตอร์ที่เช็กอินครบ 100% ในช่วงนี้';
  } else if (metric === 'top-release') {
    const accepted = releaseTutors.reduce((s, t) => s + Number(t.AcceptedCount || 0), 0);
    const unfilled = releaseTutors.reduce((s, t) => s + Number(t.UnfilledCount || 0), 0);
    summary = [
      { label: 'ปล่อยคลาสทั้งหมด', value: release?.totalReleases ?? 0, unit: 'ครั้ง' },
      { label: 'มีผู้รับสอนแทน', value: accepted, unit: 'ครั้ง' },
      { label: 'ไม่มีผู้รับสอน', value: unfilled, unit: 'ครั้ง' },
    ];
    list = releaseTutors.filter(matchSearch);
    renderRow = (t, i) => (
      <TutorRow key={t.AdminId} tutor={t} idx={i} expandable
        open={openId === t.AdminId} onToggle={() => setOpenId(openId === t.AdminId ? null : t.AdminId)}
        sub={`รับแทน ${t.AcceptedCount} · ไม่มีผู้รับ ${t.UnfilledCount}`}
        right={<Pill tone="amber">{t.ReleaseCount} ครั้ง</Pill>}>
        <ReleasesPanel adminId={t.AdminId} start={range.start} end={range.end} />
      </TutorRow>
    );
    emptyText = 'ไม่มีการปล่อยคลาสในช่วงนี้';
  }

  return (
    <div className="space-y-6">
      {/* ── Header ── */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-orange-50 via-amber-50/60 to-white border border-orange-100 shadow-sm p-5 sm:p-6">
        <div className="absolute -right-10 -top-14 h-48 w-48 rounded-full bg-orange-200/30 blur-3xl" />
        <div className="relative flex flex-col md:flex-row md:items-end md:justify-between gap-4">
          <div className="min-w-0">
            <button onClick={goBack}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-orange-700 hover:text-orange-800">
              <ArrowLeft className="h-4 w-4" /> กลับไปหน้าชั่วโมงการสอน
            </button>
            <div className="mt-3 flex items-center gap-3">
              <span className={`h-11 w-11 rounded-xl ${meta.color} flex items-center justify-center shrink-0`}>
                <Icon className="h-5 w-5 text-white" />
              </span>
              <div className="min-w-0">
                <h1 className={PAGE_TITLE}>{meta.title}</h1>
                <p className={`${PAGE_SUBTITLE} !mt-0`}>{periodText}</p>
              </div>
            </div>
            <p className="mt-3 text-sm text-slate-600 max-w-2xl">{meta.desc}</p>
          </div>
          <div className="flex gap-2 flex-wrap">
            <select value={monthNum} onChange={e => setPeriod('month', e.target.value)}
              className="px-3 h-10 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-600 focus:ring-2 focus:ring-orange-400 outline-none shadow-sm">
              <option value="all">ทุกเดือน</option>
              {MONTH_NAMES_TH.map((name, i) => <option key={name} value={i + 1}>{name}</option>)}
            </select>
            <select value={year} onChange={e => setPeriod('year', e.target.value)}
              className="px-3 h-10 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-600 focus:ring-2 focus:ring-orange-400 outline-none shadow-sm">
              <option value="all">ทุกปี</option>
              {YEAR_OPTIONS.map(y => <option key={y} value={y}>{y + 543}</option>)}
            </select>
          </div>
        </div>
      </div>

      {/* ── สลับไปดูการ์ดอื่นได้โดยไม่ต้องกลับ ── */}
      <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
        {METRIC_KEYS.map(k => {
          const M = METRICS[k]; const I = M.icon; const active = k === metric;
          return (
            <button key={k} type="button" onClick={() => goMetric(k)} aria-current={active ? 'page' : undefined}
              className={`shrink-0 inline-flex items-center gap-2 h-10 px-3 rounded-xl border text-xs font-bold transition ${active
                ? 'bg-orange-600 border-orange-600 text-white shadow-sm'
                : 'bg-white border-slate-200 text-slate-600 hover:border-orange-300 hover:text-orange-700'}`}>
              <I className="h-4 w-4" />
              <span className="whitespace-nowrap">{M.title}</span>
              {!loading && <span className={`whitespace-nowrap rounded-md px-1.5 py-0.5 ${active ? 'bg-white/20' : 'bg-slate-100'}`}>{cardValue[k]}</span>}
            </button>
          );
        })}
      </div>

      {loadError && !loading ? (
        <ErrorState onRetry={() => setReloadKey(k => k + 1)} />
      ) : loading ? (
        <Spinner block label="กำลังโหลด..." wrapperClassName="bg-white rounded-2xl border border-slate-200 p-10" />
      ) : (
        <>
          {/* ── ตัวเลขสรุปของการ์ดนี้ ── */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {summary.map(s => (
              <div key={s.label} className="p-4 bg-white rounded-2xl border border-slate-200 shadow-sm">
                <p className={STAT_LABEL}>{s.label}</p>
                <p className={`${STAT_VALUE} mt-0.5`}>{s.value}{s.unit && <span className={STAT_UNIT}>{s.unit}</span>}</p>
              </div>
            ))}
          </div>

          {/* ── avg-rate: แถบสัดส่วนแต่ละระดับ + ปุ่มกรอง ── */}
          {metric === 'avg-rate' && withRate.length > 0 && (() => {
            const parts = [
              { k: 'good', label: '≥ 80%', n: withRate.filter(t => t.AttendanceRate >= 80).length, bar: 'bg-emerald-500' },
              { k: 'watch', label: '50–79%', n: withRate.filter(t => t.AttendanceRate >= 50 && t.AttendanceRate < 80).length, bar: 'bg-amber-500' },
              { k: 'risk', label: '< 50%', n: riskList.length, bar: 'bg-red-500' },
            ];
            return (
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 space-y-3">
                <div className="flex h-3 rounded-full overflow-hidden bg-slate-100">
                  {parts.map(p => p.n > 0 && <div key={p.k} className={p.bar} style={{ width: `${(p.n / withRate.length) * 100}%` }} />)}
                </div>
                <div className="flex flex-wrap gap-2">
                  {[{ k: 'all', label: 'ทั้งหมด', n: withRate.length, bar: 'bg-slate-400' }, ...parts].map(p => (
                    <button key={p.k} type="button" onClick={() => setBucket(p.k)}
                      className={`inline-flex items-center gap-1.5 h-9 px-3 rounded-xl border text-xs font-bold transition ${bucket === p.k
                        ? 'border-orange-400 bg-orange-50 text-orange-700' : 'border-slate-200 text-slate-600 hover:bg-slate-50'}`}>
                      <span className={`w-2.5 h-2.5 rounded-full ${p.bar}`} />{p.label} ({p.n})
                    </button>
                  ))}
                </div>
              </div>
            );
          })()}

          {/* ── รายชื่อ ── */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-4 sm:px-5 py-3 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center gap-2 sm:justify-between">
              <p className="text-sm font-bold text-slate-800 flex items-center gap-2">
                <Users className="h-4 w-4 text-slate-400" /> รายชื่อติวเตอร์ ({list.length} คน)
              </p>
              <div className="relative sm:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="ค้นหาชื่อติวเตอร์..."
                  className="pl-9 pr-3 h-10 w-full bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-orange-400 outline-none" />
              </div>
            </div>
            {list.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-14 text-slate-400">
                <BookOpen className="w-10 h-10 mb-2 opacity-30" />
                <p className="text-sm">{search ? 'ไม่พบติวเตอร์ที่ค้นหา' : emptyText}</p>
              </div>
            ) : (
              <ul>{list.map((t, i) => renderRow(t, i))}</ul>
            )}
          </div>
        </>
      )}
    </div>
  );
}
