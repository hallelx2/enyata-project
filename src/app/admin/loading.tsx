export default function AdminLoading() {
  return (
    <div className="min-h-screen bg-[#0f172a] flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
        <p className="text-slate-400 font-headline font-bold text-sm tracking-widest uppercase">
          Initializing Control Panel...
        </p>
      </div>
    </div>
  );
}
