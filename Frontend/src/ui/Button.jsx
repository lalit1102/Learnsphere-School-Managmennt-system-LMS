import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cn } from "@/lib/utils";

function Button({
  className,
  variant = "default",
  size = "default",
  asChild = false,
  ...props
}) {
  const Comp = asChild ? Slot.Root : "button";

  return (
    <Comp
      data-slot="button"
      data-variant={variant}
      data-size={size}
      className={cn(
        "group/button inline-flex items-center justify-center rounded-lg text-sm font-medium transition-all select-none focus-visible:ring-2",
        className
      )}
      {...props}
    />
  );
}

export { Button };