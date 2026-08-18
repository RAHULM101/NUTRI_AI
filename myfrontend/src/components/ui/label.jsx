import { cn } from "../../lib/utils";

export function Label({ className, ...props }) {
  return (
    <label
      className={cn("block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1", className)}
      {...props}
    />
  );
}
