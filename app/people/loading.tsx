export default function PeopleLoading() {
  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div className="h-10 w-40 bg-muted rounded animate-pulse"></div>
        <div className="h-10 w-32 bg-muted rounded animate-pulse"></div>
      </div>
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {Array(9).fill(null).map((_, i) => (
          <div key={i} className="bg-card rounded-lg p-6 shadow-sm animate-pulse">
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 bg-muted rounded-full"></div>
                <div className="h-6 w-32 bg-muted rounded"></div>
              </div>
              <div className="h-4 w-3/4 bg-muted rounded"></div>
              <div className="h-4 w-1/2 bg-muted rounded"></div>
              <div className="h-8 w-24 bg-muted rounded"></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
