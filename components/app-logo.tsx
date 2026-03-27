import { cn } from "@/lib/utils";

type AppLogoProps = {
  className?: string;
  size?: "sm" | "md";
};

/** Simple ISITS wordmark with a minimal monitor mark for the header. */
export function AppLogo({ className, size = "md" }: AppLogoProps) {
  const h = size === "sm" ? "h-7" : "h-9";
  return (
    <span className={cn("inline-flex items-center gap-2", className)}>
      <svg
        className={cn(h, "w-auto shrink-0 text-primary")}
        viewBox="0 0 40 32"
        aria-hidden
      >
        <rect
          x="2"
          y="4"
          width="36"
          height="22"
          rx="3"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        />
        <path
          d="M8 12h24M8 18h16"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        />
        <path
          d="M14 28h12"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        />
      </svg>
      <span
        className={cn(
          "font-semibold tracking-tight text-foreground",
          size === "sm" ? "text-base" : "text-lg",
        )}
      >
        ISITS
      </span>
    </span>
  );
}
