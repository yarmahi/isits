import { SettingsNav } from "@/components/settings/settings-nav";

/** Chapter 2: shared shell with floating sidebar for all settings sub-routes. */
export default function SettingsLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
        <p className="text-sm text-muted-foreground">
          Lookups, delivery options, and record field rules.
        </p>
      </div>
      <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
        <SettingsNav />
        <div className="min-w-0 flex-1">{children}</div>
      </div>
    </div>
  );
}
