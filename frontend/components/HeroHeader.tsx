export function HeroHeader() {
  return (
    <section className="mx-auto max-w-6xl px-4 pb-8 pt-10 sm:px-6 lg:pb-10">
      <div className="max-w-3xl">
        <span className="inline-flex rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-600">
          PDF to structured study notes
        </span>
        <h1 className="mt-5 text-4xl font-black tracking-normal text-slate-950 sm:text-5xl">
          Turn uploaded PDFs into notes based on the actual document text.
        </h1>
        <p className="mt-5 text-lg leading-8 text-slate-600">
          Upload a text-based PDF, extract its contents, and generate clean revision notes with Gemini when configured or deterministic mock mode when it is not.
        </p>
      </div>
    </section>
  );
}
