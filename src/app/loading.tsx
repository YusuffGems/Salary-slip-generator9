export default function Loading() {
  return (
    <div
      className="flex h-[60vh] items-center justify-center"
      style={{ animation: "loadingFadeIn 0.15s ease-out 0.2s both" }}
    >
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-brand-500 border-t-transparent" />
    </div>
  );
} 