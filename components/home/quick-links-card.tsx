import Link from "next/link";
import {
  Activity,
  ArrowRight,
  ClipboardList,
  Settings,
  UserRound,
  Users,
} from "lucide-react";
import { buttonVariants } from "@/components/ui/button-variants";
import { cn } from "@/lib/utils";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

type Props = {
  isManager: boolean;
};

/** Floating sidebar quick links for the home page. */
export function QuickLinksCard({ isManager }: Props) {
  return (
    <aside className="lg:sticky lg:top-24 lg:self-start">
      <Card className="border-border/80 shadow-md ring-1 ring-black/5 dark:ring-white/10">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Quick access</CardTitle>
          <CardDescription>Jump to common areas</CardDescription>
        </CardHeader>
        <div className="flex flex-col gap-2 px-4 pb-2">
          <Link
            href="/records"
            className={cn(
              buttonVariants({ variant: "secondary", size: "sm" }),
              "w-full justify-between gap-2",
            )}
          >
            <span className="flex items-center gap-2">
              <ClipboardList className="size-4 opacity-80" aria-hidden />
              Records
            </span>
            <ArrowRight className="size-4 opacity-60" aria-hidden />
          </Link>
          <Link
            href="/profile"
            className={cn(
              buttonVariants({ variant: "outline", size: "sm" }),
              "w-full justify-between gap-2",
            )}
          >
            <span className="flex items-center gap-2">
              <UserRound className="size-4 opacity-80" aria-hidden />
              Profile
            </span>
            <ArrowRight className="size-4 opacity-60" aria-hidden />
          </Link>
          {isManager && (
            <>
              <Link
                href="/users"
                className={cn(
                  buttonVariants({ variant: "secondary", size: "sm" }),
                  "w-full justify-between gap-2",
                )}
              >
                <span className="flex items-center gap-2">
                  <Users className="size-4 opacity-80" aria-hidden />
                  Users
                </span>
                <ArrowRight className="size-4 opacity-60" aria-hidden />
              </Link>
              <Link
                href="/activity"
                className={cn(
                  buttonVariants({ variant: "outline", size: "sm" }),
                  "w-full justify-between gap-2",
                )}
              >
                <span className="flex items-center gap-2">
                  <Activity className="size-4 opacity-80" aria-hidden />
                  Activity
                </span>
                <ArrowRight className="size-4 opacity-60" aria-hidden />
              </Link>
              <Link
                href="/settings"
                className={cn(
                  buttonVariants({ variant: "outline", size: "sm" }),
                  "w-full justify-between gap-2",
                )}
              >
                <span className="flex items-center gap-2">
                  <Settings className="size-4 opacity-80" aria-hidden />
                  Settings
                </span>
                <ArrowRight className="size-4 opacity-60" aria-hidden />
              </Link>
            </>
          )}
        </div>
      </Card>
    </aside>
  );
}
