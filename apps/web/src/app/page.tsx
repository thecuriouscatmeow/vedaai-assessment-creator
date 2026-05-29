import copy from '@/content/copy.json';

export default function HomePage() {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-8 p-8">
      <div className="flex flex-col items-center gap-2">
        <h1 className="text-4xl font-semibold tracking-tight text-heading">
          {copy.home.heading}
        </h1>
        <p className="text-muted">{copy.home.subheading}</p>
      </div>
    </main>
  );
}
