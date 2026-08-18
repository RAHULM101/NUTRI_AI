import { cn } from "../../lib/utils";

export function Card({ className, ...props }) {
  return <div className={cn("rounded-2xl border bg-white shadow-lg", className)} {...props} />;
}

export function CardContent({ className, ...props }) {
  return <div className={cn("p-8", className)} {...props} />;
}
