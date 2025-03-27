import { cn } from "@/lib/utils";

interface CodeWindowProps {
  title?: string;
  language?: string;
  children: React.ReactNode;
  className?: string;
}

export function CodeWindow({
  title = "code.js",
  language = "javascript",
  children,
  className,
}: CodeWindowProps) {
  return (
    <div className={cn("rounded-lg overflow-hidden shadow-lg", className)}>
      <div className="bg-card border-b flex items-center p-2">
        <div className="flex space-x-2 mr-2">
          <div className="w-3 h-3 rounded-full bg-red-500"></div>
          <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
          <div className="w-3 h-3 rounded-full bg-green-500"></div>
        </div>
        <div className="text-xs font-mono text-muted-foreground">{title}</div>
      </div>
      <div className="bg-slate-900 text-slate-50 p-4 font-mono text-sm overflow-auto">
        {children}
      </div>
    </div>
  );
}
