import {
    Star,
    Phone,
    Pencil,
    AlertTriangle,
    Camera,
    Users,
    Clock,
} from "lucide-react"

export default function TutorProfile() {
    return (
        <div className="min-h-screen">
            <div className="mx-auto max-w-6xl px-4 py-12 md:px-6 md:py-16 lg:py-20">
                {/* ===== Header Profile ===== */}
                <div className="mb-8 overflow-hidden rounded-xl shadow-xl">
                    <div className="bg-linear-to-br from-orange-500/90 via-orange-300 to-orange-500/80 p-8 md:p-10">
                        <div className="flex flex-col gap-8 md:flex-row md:items-start md:gap-10">

                            {/* รูปโปรไฟล์ */}
                            <div className="relative shrink-0">
                                <div className="relative h-36 w-36 overflow-hidden rounded-2xl border-4 border-white shadow-2xl md:h-40 md:w-40">
                                    <img
                                        src="/tutor.jpeg"
                                        alt="ครูผู้สอน"
                                        className="h-full w-full object-cover"
                                    />
                                </div>
                                <button className="absolute -bottom-2 -right-2 flex h-12 w-12 items-center justify-center rounded-full bg-white text-orange-600 shadow-lg hover:scale-105 transition-transform">
                                    <Camera className="h-5 w-5" />
                                </button>
                            </div>

                            {/* ข้อมูลหลัก */}
                            <div className="flex-1 space-y-4">
                                <div>
                                    <h1 className="text-3xl font-bold text-white md:text-2xl">
                                        กมลทิพย์ กงเพชร
                                    </h1>
                                    <p className="mt-1 text-m text-white/90">ครูเป้ว</p>
                                </div>

                                <div className="flex flex-wrap gap-2">
                                    <span className="inline-block rounded-full bg-white px-3 py-1 text-orange-600 text-sm font-medium">
                                        คณิตศาสตร์
                                    </span>
                                    <span className="inline-block rounded-full bg-white px-3 py-1 text-orange-600 text-sm font-medium">
                                        ภาษาไทย
                                    </span>
                                </div>

                                <div className="flex flex-wrap items-center gap-6 text-sm text-white">

                                    <div className="flex items-center gap-2">
                                        <Users className="h-4 w-4" />
                                        127 นักเรียน
                                    </div>

                                    <div className="flex items-center gap-2">
                                        <Clock className="h-4 w-4" />
                                        ประสบการณ์ 5 ปี
                                    </div>
                                </div>
                            </div>

                            {/* ปุ่มแก้ไข */}
                            <button className="flex items-center gap-2 rounded-lg bg-white px-4 py-2 text-orange-600 font-medium hover:bg-gray-100 transition-colors">
                                <Pencil className="h-4 w-4" />
                                แก้ไขข้อมูล
                            </button>
                        </div>
                    </div>
                </div>

                {/* ===== Detail Cards ===== */}
                <div className="grid gap-6 md:grid-cols-2">
                    {/* ข้อมูลส่วนตัว */}
                    <div className="rounded-xl bg-white shadow-md">
                        <div className="border-b px-4 py-3">
                            <h2 className="text-lg font-semibold">ข้อมูลส่วนตัว</h2>
                        </div>
                        <div className="p-4 space-y-2">
                            <InfoRow label="ชื่อ" value="กมลทิพย์" />
                            <InfoRow label="นามสกุล" value="กงเพชร" />
                            <InfoRow label="ชื่อเล่น" value="ครูเป้ว" />
                            <InfoRow label="วันเกิด" value="26 กรกฎาคม 2547" />
                            <InfoRow label="อาชีพ" value="นักศึกษา" />
                        </div>
                    </div>

                    {/* ข้อมูลติดต่อ */}
                    <div className="rounded-xl bg-white shadow-md">
                        <div className="border-b px-4 py-3 flex items-center gap-2">
                            <Phone className="h-5 w-5" />
                            <h2 className="text-lg font-semibold">ข้อมูลติดต่อ</h2>
                        </div>
                        <div className="p-4 space-y-2">
                            <InfoRow label="เบอร์โทร" value="098-610-8600" />
                            <InfoRow label="Line ID" value="p.gamontip" />
                        </div>
                    </div>

                    {/* เรทค่าสอน */}
                    <div className="rounded-xl bg-white shadow-md">
                        <div className="border-b px-4 py-3">
                            <h2 className="text-lg font-semibold">เรทค่าสอน</h2>
                        </div>
                        <div className="p-4 space-y-3">
                            <PriceCard level="ระดับประถม" price="180–300 บาท / 1.5 ชม." />
                            <PriceCard level="ระดับมัธยม" price="210–330 บาท / 1.5 ชม." />
                        </div>
                    </div>

                    {/* ผู้ติดต่อฉุกเฉิน */}
                    <div className="rounded-xl bg-white shadow-md">
                        <div className="border-b px-4 py-3 flex items-center gap-2">
                            <AlertTriangle className="h-5 w-5 text-red-600" />
                            <h2 className="text-lg font-semibold">ผู้ติดต่อฉุกเฉิน</h2>
                        </div>
                        <div className="p-4 space-y-2">
                            <InfoRow label="ชื่อ" value="นายณัฐวุฒิ พัดไธสง" />
                            <InfoRow label="เบอร์โทร" value="081-987-6543" />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

/* ===== Components ===== */

function InfoRow({ label, value }) {
    return (
        <>
            <div className="flex justify-between py-3 text-sm">
                <span className="text-gray-500">{label}</span>
                <span className="font-semibold text-gray-900">{value}</span>
            </div>
            <div className="border-t border-gray-200" />
        </>
    )
}

function PriceCard({ level, price }) {
    return (
        <div className="flex justify-between rounded-lg border border-gray-200 p-4">
            <span>{level}</span>
            <span className="font-semibold text-orange-600">{price}</span>
        </div>
    )
}
