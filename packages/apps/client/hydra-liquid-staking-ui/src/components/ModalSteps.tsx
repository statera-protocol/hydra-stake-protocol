import type React from "react";

interface ModalStepProps {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}

export default function ModalStep({
  title,
  children,
  subtitle,
}: ModalStepProps) {
  return (
    <div>
      <h3 className="text-lg font-semibold text-foreground mb-1">{title}</h3>
      <p className="text-sm text-muted-foreground mb-6">{subtitle}</p>
      {children}
    </div>
  );
}
