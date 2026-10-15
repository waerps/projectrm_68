import { isRouteErrorResponse, useRouteError } from "react-router-dom"

export default function RouteErrorPage() {
  const error = useRouteError()
  const notFound = isRouteErrorResponse(error) && error.status === 404

  return (
    <main className="flex min-h-screen items-center justify-center bg-orange-50 px-4 py-12 text-slate-800">
      <div role="alert" className="w-full max-w-md rounded-2xl border border-orange-100 bg-white p-8 text-center shadow-sm">
        <div aria-hidden="true" className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-orange-100 text-2xl text-orange-700">
          !
        </div>
        <h1 className="text-2xl font-semibold">
          {notFound ? "ไม่พบหน้าที่ต้องการ" : "หน้านี้ขัดข้องชั่วคราว"}
        </h1>
        <p className="mt-3 text-sm leading-6 text-slate-600">
          {notFound
            ? "กรุณาตรวจสอบที่อยู่ของหน้า หรือกลับไปหน้าหลัก"
            : "ขออภัย เกิดข้อผิดพลาดในการแสดงหน้านี้ กรุณาลองใหม่อีกครั้ง"}
        </p>
        <div className="mt-7 flex flex-wrap justify-center gap-3">
          {!notFound && (
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="rounded-lg bg-orange-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-orange-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-600"
            >
              ลองใหม่
            </button>
          )}
          <a
            href="/"
            className="rounded-lg border border-slate-300 px-5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-600"
          >
            กลับหน้าหลัก
          </a>
        </div>
      </div>
    </main>
  )
}
