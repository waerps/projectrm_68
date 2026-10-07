import { useEffect, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { ClipboardList, ArrowRight, Loader2, RefreshCw } from 'lucide-react';
import { fetchExamOverview } from '../utils/studentExamShared';
import Breadcrumb from '../components/ui/Breadcrumb';
import { PAGE_TITLE, PAGE_SUBTITLE } from '../components/ui/tokens';

const slugs = ['pre-test', 'mid-test', 'post-test'];
const labels = ['ก่อนเรียน', 'กลางเรียน', 'ท้ายเรียน'];
const statuses = { submitted: 'สอบแล้ว', 'in-progress': 'กำลังทำข้อสอบ', open: 'เปิดสอบแล้ว', closed: 'ปิดสอบแล้ว', upcoming: 'ยังไม่เปิดสอบ' };
const number = value => new Intl.NumberFormat('th-TH', { maximumFractionDigits: 1 }).format(value);
const date = value => value && !Number.isNaN(new Date(value).getTime())
  ? new Date(value).toLocaleString('th-TH', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Bangkok' }) : null;

function RoundCard({ round, label, course, subject }) {
  const from = { courseId: course.courseId, courseName: course.courseName, subjectId: subject.subjectId, subjectName: subject.subjectName };
  return <section className="rounded-2xl border border-neutral-200 bg-white p-5 flex flex-col gap-3">
    <div className="flex items-center justify-between gap-2"><h3 className="font-bold text-neutral-900">{label}</h3>
      <span className={`text-xs rounded-full px-2.5 py-1 ${round?.status === 'submitted' ? 'bg-green-50 text-green-700' : round?.token ? 'bg-orange-50 text-orange-700' : 'bg-neutral-100 text-neutral-600'}`}>
        {round ? statuses[round.status] : 'ยังไม่มีกำหนดสอบ'}</span></div>
    <div className="min-h-16">{round?.percentage != null ? <><p className="text-3xl font-bold text-neutral-900">{number(round.percentage)}<span className="text-base text-neutral-500">%</span></p>
      <p className="text-sm text-neutral-500">{number(round.score)} / {number(round.maxScore)} คะแนน</p></>
      : <p className="text-lg font-semibold text-neutral-500">{round?.status === 'submitted' ? 'ยังไม่มีคะแนนที่ประเมินได้' : 'ยังไม่มีผลสอบ'}</p>}</div>
    <p className="text-xs text-neutral-500">{date(round?.submittedAt) ? `ส่งข้อสอบ ${date(round.submittedAt)}` : date(round?.examDate) ? `กำหนดสอบ ${date(round.examDate)} น.` : 'รอติวเตอร์แจ้งกำหนดการ'}</p>
    {round?.name && <p className="text-sm text-neutral-600">{round.name}</p>}
    {round?.token && <Link to={`/exam/${encodeURIComponent(round.token)}`} state={{ from }} className="mt-auto inline-flex justify-center items-center gap-2 bg-green-600 hover:bg-green-700 text-white rounded-xl px-4 py-2.5 font-semibold">
      <ClipboardList className="h-4 w-4" />{round.status === 'in-progress' ? 'ทำข้อสอบต่อ' : 'เข้าสอบ'}<ArrowRight className="h-4 w-4" /></Link>}
    {round?.status === 'upcoming' && <p className="text-xs text-neutral-500">{round.openMode === 'auto' ? 'ระบบเปิดสอบตามกำหนด' : 'ติวเตอร์เป็นผู้เปิดสอบ กำหนดการอาจเปลี่ยนแปลง'}</p>}
  </section>;
}

export function ExamOverviewContent({ data, initialSubjectId }) {
  const [selectedKey, setSelectedKey] = useState(null);
  const subjectMap = new Map();
  for (const row of data.subjects) {
    const id = String(row.subjectId);
    if (!subjectMap.has(id)) subjectMap.set(id, { id, name: row.subjectName, tutors: [] });
    subjectMap.get(id).tutors.push(row);
  }
  const subjects = [...subjectMap.values()].map(group => {
    const withExams = group.tutors.filter(tutor => tutor.rounds.length > 0);
    return { ...group, tutors: withExams.length ? withExams : group.tutors };
  });
  const selected = subjects.find(group => group.tutors.some(tutor => tutor.key === selectedKey))
    || subjects.find(group => group.id === String(initialSubjectId)) || subjects[0];
  const subject = selected?.tutors.find(tutor => tutor.key === selectedKey) || selected?.tutors[0];
  if (!subject) return <div className="rounded-2xl border border-dashed border-neutral-300 p-10 text-center text-neutral-500">ยังไม่มีข้อมูลวิชาและการสอบในคอร์สนี้ รอติวเตอร์เพิ่มข้อมูล</div>;
  const selectSubject = group => setSelectedKey(group.tutors[0].key);
  const onSubjectKeyDown = (event, index) => {
    const offsets = { ArrowRight: 1, ArrowLeft: -1 };
    let next;
    if (event.key in offsets) next = (index + offsets[event.key] + subjects.length) % subjects.length;
    else if (event.key === 'Home') next = 0;
    else if (event.key === 'End') next = subjects.length - 1;
    else return;
    event.preventDefault();
    selectSubject(subjects[next]);
    event.currentTarget.parentElement.querySelectorAll('[role="tab"]')[next].focus();
  };
  return <div className="space-y-6">
    <div className="flex gap-1 overflow-x-auto rounded-xl bg-neutral-100 p-1" role="tablist" aria-label="เลือกวิชา">{subjects.map((group, index) => <button type="button" role="tab" aria-selected={group.id === selected.id} tabIndex={group.id === selected.id ? 0 : -1} aria-controls="student-exam-subject" id={`exam-tab-${group.id}`} key={group.id} onClick={() => selectSubject(group)} onKeyDown={event => onSubjectKeyDown(event, index)}
      className={`min-w-max flex-1 whitespace-nowrap rounded-lg px-3 py-2.5 text-xs font-semibold sm:px-4 sm:py-3 sm:text-sm transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-400 ${group.id === selected.id ? 'bg-white shadow text-orange-600' : 'text-neutral-500 hover:text-neutral-700'}`}>
      {group.name}</button>)}</div>
    {selected.tutors.length > 1 && <div className="flex flex-col sm:flex-row sm:items-center gap-2">
      <label htmlFor="student-exam-tutor" className="text-sm font-medium text-neutral-600">ติวเตอร์</label>
      <select id="student-exam-tutor" value={subject.key} onChange={event => setSelectedKey(event.target.value)} className="h-10 w-full sm:w-auto sm:min-w-48 rounded-xl border border-neutral-200 bg-white px-3 text-sm text-neutral-700 outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100">
        {selected.tutors.map(tutor => <option key={tutor.key} value={tutor.key}>{tutor.tutorName || 'ไม่ระบุติวเตอร์'}</option>)}
      </select>
    </div>}
    <div id="student-exam-subject" role="tabpanel" aria-labelledby={`exam-tab-${selected.id}`} className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3"><div><h2 className="text-xl font-bold text-neutral-900">{subject.subjectName}</h2><p className="text-sm text-neutral-500">{subject.tutorName ? `ติวเตอร์ ${subject.tutorName} · ` : ''}ผลสอบก่อนเรียน → กลางเรียน → ท้ายเรียน</p></div>
        {subject.growth && <p className={`rounded-xl px-4 py-2 text-sm font-semibold ${subject.growth.delta < 0 ? 'bg-orange-50 text-orange-800' : 'bg-green-50 text-green-800'}`}>ท้ายเรียนเทียบก่อนเรียน: {subject.growth.delta > 0 ? '+' : ''}{number(subject.growth.delta)} จุดเปอร์เซ็นต์</p>}</div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">{slugs.map((slug, i) => <div key={slug} className="space-y-3">{subject.rounds.filter(r => r.slug === slug).length ? subject.rounds.filter(r => r.slug === slug).map(r => <RoundCard key={r.examId} round={r} label={labels[i]} course={data} subject={subject} />) : <RoundCard label={labels[i]} course={data} subject={subject} />}</div>)}</div>
      <p className="text-xs text-neutral-500">คะแนนแสดงเป็น % เพื่ออ่านเทียบกันได้ แต่แต่ละรอบอาจมีโจทย์และความยากต่างกัน</p>
      {!subject.analysisAllowed ? <div className="rounded-2xl border border-neutral-200 bg-neutral-50 p-5 text-sm text-neutral-600">แสดงคะแนนส่วนตัวได้ แต่ไม่แสดงการวิเคราะห์รายบทและพัฒนาการ เนื่องจากไม่ได้ยินยอมให้ใช้ข้อมูลการสอบรอบล่าสุด</div> : <>
        <section className="rounded-2xl border border-neutral-200 bg-white overflow-hidden">
          <div className="p-5 sm:p-6"><h3 className="font-bold text-neutral-900">ผลสอบแยกตามบท</h3><p className="text-sm text-neutral-500 mt-1">คะแนนรายบทในแต่ละรอบสอบ เรียงจากคะแนนล่าสุดน้อยไปมาก</p></div>
          {subject.topics.length ? <div className="overflow-x-auto"><table className="w-full text-sm text-left"><caption className="sr-only">คะแนนรายบทของวิชา {subject.subjectName}</caption><thead className="bg-neutral-50 text-neutral-500"><tr><th className="px-5 py-3 font-medium">บท / หัวข้อ</th>{labels.map(l => <th key={l} className="px-3 py-3 whitespace-nowrap font-medium">{l}</th>)}<th className="px-5 py-3 font-medium whitespace-nowrap">ผลล่าสุด</th></tr></thead>
            <tbody>{subject.topics.map(t => <tr key={t.name} className="border-t border-neutral-100"><th scope="row" className="px-5 py-4 font-medium min-w-36">{t.name}</th>{t.rounds.map(r => <td key={r.slug} className="px-3 py-4">{r.percentage == null ? <span className="text-neutral-400" title="ไม่มีข้อมูลในรอบนี้">—</span> : <><span className="font-semibold">{number(r.percentage)}%</span><span className="block text-xs text-neutral-500">{number(r.score)}/{number(r.maxScore)} คะแนน</span></>}</td>)}
              <td className="px-5 py-4"><span className={`inline-block rounded-full px-2 py-1 text-xs whitespace-nowrap ${t.needsReview ? 'bg-orange-50 text-orange-800' : 'bg-green-50 text-green-700'}`}>{!t.latest ? 'ยังประเมินไม่ได้' : t.needsReview ? 'ต่ำกว่า 50%'  : t.latest.percentage >= 70 ? 'ระดับดี' : 'พอใช้'}</span><span className="block text-xs text-neutral-500 mt-1">{t.latest?.label}</span></td></tr>)}</tbody></table></div>
          : <p className="px-5 pb-5 text-sm text-neutral-500">ยังไม่มีคะแนนรายบท</p>}
          <p className="px-5 py-4 text-xs text-neutral-500 border-t border-neutral-100">— หมายถึงไม่มีข้อมูล ไม่ใช่ 0 คะแนน · ชื่อบทอ้างอิงหมวดข้อสอบที่ติวเตอร์ระบุ</p>
        </section>
      </>}
    </div>
  </div>;
}

export function ExamOverviewHeader({ courseName }) {
  return <header>
    <h1 className={PAGE_TITLE}>การสอบ</h1>
    <p className={PAGE_SUBTITLE}>{courseName ? `${courseName} · ` : ''}ดูผลสอบก่อนเรียน กลางเรียน และท้ายเรียน แยกตามวิชา</p>
  </header>;
}

export default function StudentExamOverview() {
  const { courseId } = useParams();
  const [params] = useSearchParams();
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [retry, setRetry] = useState(0);
  useEffect(() => {
    let cancelled = false;
    setLoading(true); setError(''); setData(null);
    fetchExamOverview(courseId).then(value => { if (!cancelled) setData(value); })
      .catch(err => { if (!cancelled) setError(err.response?.data?.message || 'โหลดข้อมูลไม่สำเร็จ กรุณาลองอีกครั้ง'); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [courseId, retry]);
  return <div className="min-w-0 space-y-6 mt-[90px] pb-10">
    <Breadcrumb items={[{ label: 'คอร์สของฉัน', to: '/profile/my-courses' }, { label: data?.courseName || 'คอร์สเรียน', to: `/profile/course/${courseId}/subjects` }, { label: 'การสอบ' }]} />
    <ExamOverviewHeader courseName={data?.courseName} />
    {loading ? <div role="status" className="py-16 text-center text-neutral-500"><Loader2 className="h-6 w-6 animate-spin mx-auto mb-3" />กำลังโหลดข้อมูลการสอบ…</div>
      : error ? <div role="alert" className="rounded-2xl bg-orange-50 p-6 text-orange-800"><p>{error}</p><button onClick={() => setRetry(r => r + 1)} className="mt-3 inline-flex gap-2 items-center font-semibold"><RefreshCw className="h-4 w-4" />ลองอีกครั้ง</button></div>
        : data && <ExamOverviewContent key={courseId} data={data} initialSubjectId={params.get('subjectId')} />}
  </div>;
}
