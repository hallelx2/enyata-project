import { AuraLogo } from "@/components/AuraLogo";

export default function RootLoading() {
  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6">
      <div className="flex flex-col items-center gap-6 animate-pulse">
        <AuraLogo className="w-16 h-16" />
        <p className="text-primary font-headline font-bold text-lg tracking-tight">
          AuraHealth
        </p>
      </div>
    </div>
  );
}
