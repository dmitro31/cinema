const block = 'animate-pulse rounded-2xl bg-white/5';

export function HeroSkeleton() {
  return (
    <div className="mx-auto grid max-w-7xl gap-10 px-4 py-12 sm:px-6 lg:grid-cols-[1fr_340px] lg:py-20" aria-hidden="true">
      <div className="space-y-6">
        <div className={`${block} h-7 w-36`} />
        <div className={`${block} h-16 w-3/4`} />
        <div className={`${block} h-5 w-1/2`} />
        <div className={`${block} h-20 max-w-xl`} />
        <div className={`${block} h-12 w-48`} />
      </div>
      <div className={`${block} hidden aspect-[2/3] lg:block`} />
    </div>
  );
}

export function GridSkeleton() {
  return (
    <div className="mx-auto mt-14 max-w-7xl px-4 sm:px-6" aria-hidden="true">
      <div className={`${block} mb-8 h-9 w-40`} />
      <div className="grid grid-cols-2 gap-x-4 gap-y-9 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
        {Array.from({ length: 5 }, (_, index) => (
          <div key={index} className="space-y-3">
            <div className={`${block} aspect-[2/3]`} />
            <div className={`${block} h-5 w-3/4`} />
          </div>
        ))}
      </div>
    </div>
  );
}

export function SessionsSkeleton() {
  return (
    <div className="space-y-3" aria-hidden="true">
      <div className={`${block} h-11 w-80 max-w-full`} />
      <div className={`${block} h-72`} />
    </div>
  );
}
