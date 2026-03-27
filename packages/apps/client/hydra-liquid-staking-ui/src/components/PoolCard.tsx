import type React from "react";

interface PoolCardProps {
  title: string;
  token: string;
  icon: React.ReactNode;
  disabled?: boolean;
}

export default function PoolCard({
  title,
  token,
  icon,
  disabled,
}: PoolCardProps) {
  return (
    <div
      className={`glass glass-hover rounded-2xl p-5 border border-border/50 group transition-all duration-300 w-full bg-white ${disabled ? "opacity-55 cursor-not-allowed" : "cursor-pointer"}`}
    >
      <div className="flex justify-between gap-4 mb-4">
        <div className="flex-1">
          <h3 className="text-muted-foreground text-sm mb-2">{token}</h3>
          <p className="text-2xl md:text-3xl font-bold text-foreground">
            {title}
          </p>
        </div>
        <div className="flex flex-col gap-2 justify-end items-end">
          <div className="p-2 rounded-lg bg-accent/10 group-hover:bg-accent/20 transition-all">
            {icon}
          </div>
          <p className="text-xs text-muted-foreground">
            {import.meta.env.VITE_CONTRACT_ADDRESS.substring(0, 10) + "***"}
          </p>
        </div>
      </div>
    </div>
  );
}
