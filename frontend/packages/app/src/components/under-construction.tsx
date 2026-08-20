export function UnderConstruction() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] text-center p-8">
      <div className="text-6xl mb-4">🚧</div>
      <h1 className="text-2xl font-semibold text-gray-800 mb-2">
        Under Construction
      </h1>
      <p className="text-gray-500 max-w-md">
        This page is currently being built. Please check back soon!
      </p>
    </div>
  );
}
