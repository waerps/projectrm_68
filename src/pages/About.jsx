import { Award, BookOpen, Facebook, Heart, MapPin, MessageCircle, Phone, Users } from "lucide-react";
import PublicPageHero from "../components/PublicPageHero";

const LINE_ID = "";

export default function About() {
  return (
    <div className="pb-20 pt-[110px] text-neutral-900">
      <div className="mx-auto max-w-[1200px] px-4 md:px-6">
        <PublicPageHero
          eyebrow="เกี่ยวกับศรเสริมติวเตอร์"
          title="รู้จัก"
          highlight="ศรเสริม ติวเตอร์"
          description="สถาบันกวดวิชาในจังหวัดขอนแก่น ที่มุ่งเน้นการติวให้เห็นผลจริงและใส่ใจพัฒนาการของนักเรียนเป็นรายบุคคล"
          icon={Heart}
          note="ติวจริง ติดจริง มีผลงาน ใส่ใจทุกพัฒนาการของนักเรียน"
        />

        <div className="mt-7 grid gap-4 sm:grid-cols-3">
          <div className="rounded-3xl border border-orange-100 bg-gradient-to-br from-orange-500 to-orange-600 p-5 text-white shadow-[0_16px_32px_-18px_rgba(234,88,12,0.5)] sm:p-6">
            <Users className="h-6 w-6 text-orange-100" aria-hidden="true" />
            <p className="mt-5 text-3xl font-extrabold">1,918+</p>
            <p className="mt-1 text-sm text-orange-50">ผู้ติดตามบน Facebook</p>
          </div>
          <div className="rounded-3xl border border-orange-100 bg-white p-5 shadow-sm sm:p-6">
            <MapPin className="h-6 w-6 text-orange-600" aria-hidden="true" />
            <p className="mt-5 text-2xl font-extrabold">ขอนแก่น</p>
            <p className="mt-1 text-sm text-neutral-500">ที่ตั้งสถาบัน</p>
          </div>
          <div className="rounded-3xl border border-orange-100 bg-white p-5 shadow-sm sm:p-6">
            <Award className="h-6 w-6 text-orange-600" aria-hidden="true" />
            <p className="mt-5 text-2xl font-extrabold">ติวจริง ติดจริง</p>
            <p className="mt-1 text-sm text-neutral-500">มีผลงานที่พิสูจน์ได้</p>
          </div>
        </div>

        <div className="mt-8 grid items-start gap-6 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
          <section className="rounded-3xl border border-orange-100 bg-gradient-to-br from-orange-50 via-white to-white p-6 shadow-sm sm:p-8">
            <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-orange-500 to-orange-600 text-white shadow-lg shadow-orange-500/20"><BookOpen className="h-6 w-6" aria-hidden="true" /></span>
            <h2 className="mt-5 text-2xl font-bold">เราคือใคร</h2>
            <p className="mt-3 text-base leading-8 text-neutral-600">ศรเสริม ติวเตอร์ (SornSerm Tutor) สถาบันกวดวิชาในจังหวัดขอนแก่น มุ่งเน้นการติวที่ให้ผลลัพธ์จริง พร้อมใส่ใจพัฒนาการของนักเรียนเป็นรายบุคคล</p>
          </section>

          <section className="rounded-3xl border border-orange-100 bg-white p-6 shadow-sm sm:p-8">
            <h2 className="text-2xl font-bold">ที่ตั้งและติดต่อ</h2>
            <div className="mt-6 space-y-5">
              <div className="flex items-start gap-3">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-orange-50 text-orange-600"><MapPin className="h-5 w-5" aria-hidden="true" /></span>
                <div className="min-w-0"><p className="font-semibold">ที่อยู่</p><a href="https://maps.app.goo.gl/yTtEz3r45TA1pA7aA" target="_blank" rel="noopener noreferrer" className="mt-1 inline-block text-sm leading-6 text-orange-700 hover:underline">ซอยศรีจันทร์ 4 (ซอย ยิ้มศิริ) ขอนแก่น ประเทศไทย</a></div>
              </div>
              <div className="flex items-start gap-3">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-orange-50 text-orange-600"><Phone className="h-5 w-5" aria-hidden="true" /></span>
                <div><p className="font-semibold">เบอร์โทรศัพท์</p><a href="tel:0826646551" className="mt-1 inline-block text-sm text-orange-700 hover:underline">082 664 6551</a></div>
              </div>
            </div>
          </section>
        </div>

        <section className="mt-6 rounded-3xl border border-orange-100 bg-white p-6 shadow-sm sm:p-8">
          <h2 className="text-2xl font-bold">ติดตามเรา</h2>
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <a href="https://web.facebook.com/SornSerm.tutor" target="_blank" rel="noopener noreferrer" className="group flex min-w-0 items-center gap-3 rounded-2xl border border-orange-200 bg-orange-50 px-4 py-4 transition hover:border-orange-400 hover:bg-orange-100">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-orange-500 text-white"><Facebook className="h-5 w-5" aria-hidden="true" /></span>
              <span className="min-w-0"><span className="block truncate text-sm font-semibold group-hover:text-orange-700">ศรเสริม ติวเตอร์ - SornSerm Tutor</span><span className="block truncate text-xs text-neutral-500">web.facebook.com/SornSerm.tutor</span></span>
            </a>
            {LINE_ID ? (
              <a href={`https://line.me/ti/p/${LINE_ID}`} target="_blank" rel="noopener noreferrer" className="flex min-w-0 items-center gap-3 rounded-2xl border border-orange-200 bg-orange-50 px-4 py-4 transition hover:bg-orange-100">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-orange-500 text-white"><MessageCircle className="h-5 w-5" aria-hidden="true" /></span>
                <span className="min-w-0"><span className="block text-sm font-semibold">LINE Official Account</span><span className="block truncate text-xs text-neutral-500">{LINE_ID}</span></span>
              </a>
            ) : (
              <div className="flex items-center gap-3 rounded-2xl border border-dashed border-neutral-200 bg-neutral-50 px-4 py-4 text-neutral-500">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-neutral-200"><MessageCircle className="h-5 w-5" aria-hidden="true" /></span>
                <span><span className="block text-sm font-semibold">LINE Official Account</span><span className="block text-xs">เร็ว ๆ นี้</span></span>
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
