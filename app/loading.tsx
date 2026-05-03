'use client';

export default function Loading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-purple-950">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 border-4 border-purple-300 border-t-transparent rounded-full animate-spin" />
        <p className="text-purple-200 text-sm font-medium">Loading...</p>
      </div>
    </div>
  );
}