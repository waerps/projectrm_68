import { createElement } from "react";
export default function PublicPageHero({ eyebrow, title, highlight, description, icon, action, note }) {
  return (
    <section className="relative isolate overflow-hidden rounded-[28px] border border-orange-100 bg-gradient-to-br from-white via-orange-50 to-amber-100 shadow-[0_16px_48px_-28px_rgba(234,88,12,0.28)]">
      <div aria-hidden="true" className="pointer-events-none absolute -right-16 -top-24 h-72 w-72 rounded-full bg-orange-200/35 blur-3xl" />
      <div aria-hidden="true" className="pointer-events-none absolute -bottom-24 left-1/3 h-56 w-56 rounded-full bg-amber-200/30 blur-3xl" />
      <div className="relative grid items-center gap-5 px-5 py-8 sm:px-8 sm:py-10 lg:grid-cols-[minmax(0,1fr)_260px] lg:px-11">
        <div className="min-w-0">
          <span className="inline-flex max-w-full items-center gap-2 rounded-full border border-orange-200 bg-white/80 px-3.5 py-1.5 text-xs font-semibold text-orange-700 sm:text-sm">
             {createElement(icon, { className: "h-4 w-4 shrink-0", "aria-hidden": true })} {eyebrow}
          </span>
          <h1 className="mt-4 text-[30px] font-extrabold leading-tight tracking-tight text-neutral-900 sm:text-4xl lg:text-[42px]">
            {title} <span className="text-orange-600">{highlight}</span>
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-neutral-600 sm:text-base sm:leading-8">{description}</p>
          {action && <div className="mt-6">{action}</div>}
        </div>
        <div className="relative hidden h-44 items-center justify-center lg:flex" aria-hidden="true">
          <div className="absolute h-48 w-48 rounded-full border border-orange-200 bg-white/45" />
          <div className="absolute h-32 w-32 rounded-full border border-orange-200/80 bg-orange-100/65" />
          <div className="relative grid h-24 w-24 rotate-[-8deg] place-items-center rounded-[28px] bg-gradient-to-br from-orange-500 to-orange-600 text-white shadow-[0_20px_30px_-12px_rgba(234,88,12,0.5)]">
            {createElement(icon, { className: "h-12 w-12", strokeWidth: 1.6 })}
          </div>
          <span className="absolute right-2 top-2 h-4 w-4 rounded-full bg-orange-300" />
          <span className="absolute bottom-2 left-3 h-2.5 w-2.5 rounded-full bg-amber-400" />
        </div>
      </div>
      {note && <div className="relative border-t border-orange-100 bg-white/55 px-5 py-3 text-xs font-medium text-orange-800 sm:px-8 sm:text-sm lg:px-11">{note}</div>}
    </section>
  );
}
