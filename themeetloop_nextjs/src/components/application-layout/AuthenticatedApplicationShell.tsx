"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import {
  CalendarDaysIcon,
  CaptionsIcon,
  LayoutDashboardIcon,
  LogOutIcon,
  MenuIcon,
  PanelLeftCloseIcon,
  PanelLeftOpenIcon,
  RefreshCwIcon,
  SettingsIcon,
} from "lucide-react";
import { MeetLoopBrandMark } from "@/components/application-layout/MeetLoopBrandMark";
import { ApplicationStatusPanel } from "@/components/feedback/ApplicationStatusPanel";
import { FullScreenLoadingOverlay } from "@/components/feedback/FullScreenLoadingOverlay";
import { LoadingSpinner } from "@/components/feedback/LoadingSpinner";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { useLogout } from "@/modules/authentication/hooks/useLogout";
import { authenticationClient } from "@/modules/authentication/services/authenticationClient";
import { AutomaticMeetingCaptureCoordinator } from "@/modules/meetings/components/AutomaticMeetingCaptureCoordinator";

const APPLICATION_NAVIGATION_ITEMS = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboardIcon },
  { href: "/live-meeting", label: "Live meeting", icon: CaptionsIcon },
  { href: "/meetings", label: "Meetings", icon: CalendarDaysIcon },
  { href: "/settings", label: "Settings", icon: SettingsIcon },
] as const;

const SIDEBAR_COLLAPSED_STORAGE_KEY = "meetloop.sidebar-collapsed";

function ApplicationNavigation({
  isCollapsed = false,
  onNavigate,
}: {
  isCollapsed?: boolean;
  onNavigate?: () => void;
}) {
  const pathname = usePathname();
  return (
    <nav aria-label="Application navigation">
      <ul className="flex flex-col gap-1">
        {APPLICATION_NAVIGATION_ITEMS.map((navigationItem) => {
          const isActive =
            pathname === navigationItem.href || pathname.startsWith(`${navigationItem.href}/`);
          const NavigationIcon = navigationItem.icon;
          const navigationLink = (
            <Link
              href={navigationItem.href}
              onClick={onNavigate}
              aria-current={isActive ? "page" : undefined}
              className={cn(
                buttonVariants({ variant: isActive ? "default" : "ghost" }),
                "h-10 w-full justify-start rounded-xl px-3",
                isCollapsed && "justify-center px-0",
              )}
            >
              <NavigationIcon aria-hidden="true" />
              <span className={cn(isCollapsed && "sr-only")}>{navigationItem.label}</span>
            </Link>
          );

          return (
            <li key={navigationItem.href}>
              {isCollapsed ? (
                <Tooltip>
                  <TooltipTrigger render={navigationLink} />
                  <TooltipContent>{navigationItem.label}</TooltipContent>
                </Tooltip>
              ) : (
                navigationLink
              )}
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

export function AuthenticatedApplicationShell({ children }: { children: ReactNode }) {
  const router = useRouter();
  const {
    data: session,
    isPending,
    isRefetching,
    error,
    refetch,
  } = authenticationClient.useSession();
  const { isLoggingOut, logout } = useLogout("/login");
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileNavigationOpen, setIsMobileNavigationOpen] = useState(false);

  useEffect(() => {
    const readPreferenceTimer = window.setTimeout(() => {
      try {
        setIsSidebarCollapsed(
          localStorage.getItem(SIDEBAR_COLLAPSED_STORAGE_KEY) === "true",
        );
      } catch {
        setIsSidebarCollapsed(false);
      }
    }, 0);
    return () => window.clearTimeout(readPreferenceTimer);
  }, []);

  useEffect(() => {
    if (!isPending && !session && !error)
      router.replace(
        `/login?redirect=${encodeURIComponent(window.location.pathname + window.location.search)}`,
      );
  }, [error, isPending, router, session]);

  function toggleSidebar(): void {
    setIsSidebarCollapsed((currentValue) => {
      const nextValue = !currentValue;
      try {
        localStorage.setItem(SIDEBAR_COLLAPSED_STORAGE_KEY, String(nextValue));
      } catch {
        // A blocked storage API only costs the preference, not the interaction.
      }
      return nextValue;
    });
  }

  if (error)
    return (
      <ApplicationStatusPanel
        statusCode="Can't connect"
        title="MeetLoop can't reach its server."
        description="This is a connection problem, not a problem with your account. Nothing has been lost — any captions still waiting to be sent are saved on this device."
        actions={
          <>
            <Button
              disabled={isRefetching}
              onClick={() => void refetch()}
              className="h-11 w-full rounded-xl px-6 sm:w-auto"
            >
              {isRefetching ? (
                <LoadingSpinner size="sm" className="text-white" />
              ) : (
                <RefreshCwIcon aria-hidden="true" />
              )}
              {isRefetching ? "Trying…" : "Try again"}
            </Button>
            {/* Without this a signed-out user whose first request fails has no way forward. */}
            <Link
              href="/login"
              className={cn(
                buttonVariants({ variant: "outline" }),
                "h-11 w-full rounded-xl border-neutral-300 px-6 sm:w-auto",
              )}
            >
              Go to sign in
            </Link>
          </>
        }
      />
    );

  const collapseSidebarButton = (
    <Button
      variant="ghost"
      onClick={toggleSidebar}
      className={cn(
        "h-10 w-full justify-start rounded-xl",
        isSidebarCollapsed && "justify-center px-0",
      )}
      aria-label={isSidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
    >
      {isSidebarCollapsed ? (
        <PanelLeftOpenIcon aria-hidden="true" />
      ) : (
        <PanelLeftCloseIcon aria-hidden="true" />
      )}
      <span className={cn(isSidebarCollapsed && "sr-only")}>Collapse sidebar</span>
    </Button>
  );

  return (
    <div className="min-h-screen bg-neutral-50">
      <AutomaticMeetingCaptureCoordinator />
      {isLoggingOut && (
        <FullScreenLoadingOverlay
          title="Signing you out…"
          description="Clearing this device before you go."
        />
      )}

      {/* The chrome renders immediately and never waits on the session request, so a slow
          API delays only the content region rather than the whole page. */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 hidden border-r border-neutral-200 bg-white transition-[width] lg:flex lg:flex-col",
          isSidebarCollapsed ? "w-20" : "w-64",
        )}
      >
        <div
          className={cn(
            "flex h-16 items-center border-b border-neutral-200",
            isSidebarCollapsed ? "justify-center px-3 [&_span]:sr-only" : "px-5",
          )}
        >
          <MeetLoopBrandMark />
        </div>
        <div className="flex-1 px-3 py-5">
          <ApplicationNavigation isCollapsed={isSidebarCollapsed} />
        </div>
        <div className="border-t border-neutral-200 p-3">
          {isSidebarCollapsed ? (
            <Tooltip>
              <TooltipTrigger render={collapseSidebarButton} />
              <TooltipContent>Expand sidebar</TooltipContent>
            </Tooltip>
          ) : (
            collapseSidebarButton
          )}
        </div>
      </aside>

      <div className={cn("transition-[padding]", isSidebarCollapsed ? "lg:pl-20" : "lg:pl-64")}>
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-neutral-200 bg-white/90 px-4 backdrop-blur-xl sm:px-6 lg:px-8">
          <div className="lg:hidden">
            <Sheet open={isMobileNavigationOpen} onOpenChange={setIsMobileNavigationOpen}>
              <Tooltip>
                <TooltipTrigger
                  render={
                    <SheetTrigger
                      aria-label="Open application navigation"
                      className={cn(
                        buttonVariants({ variant: "outline", size: "icon" }),
                        "rounded-xl",
                      )}
                    />
                  }
                >
                  <MenuIcon aria-hidden="true" />
                </TooltipTrigger>
                <TooltipContent>Open navigation</TooltipContent>
              </Tooltip>
              <SheetContent side="left" className="w-72 bg-white p-0">
                <SheetHeader className="border-b border-neutral-200 p-5 text-left">
                  <SheetTitle>
                    <MeetLoopBrandMark />
                  </SheetTitle>
                  <SheetDescription>Meeting memory workspace</SheetDescription>
                </SheetHeader>
                <div className="p-4">
                  <ApplicationNavigation onNavigate={() => setIsMobileNavigationOpen(false)} />
                </div>
              </SheetContent>
            </Sheet>
          </div>

          <div className="ml-auto flex min-w-0 items-center gap-3">
            {isPending ? (
              <div className="hidden min-w-0 items-end gap-2 sm:flex sm:flex-col">
                <Skeleton className="h-4 w-28" />
                <Skeleton className="h-3 w-40" />
              </div>
            ) : (
              session && (
                <div className="hidden min-w-0 text-right sm:block">
                  <p className="truncate text-sm font-semibold">{session.user.name}</p>
                  <p className="truncate text-xs text-neutral-500">{session.user.email}</p>
                </div>
              )
            )}
            <Button
              variant="outline"
              disabled={isLoggingOut || isPending || !session}
              onClick={() => void logout()}
              className="h-9 rounded-xl"
            >
              <LogOutIcon aria-hidden="true" />
              {isLoggingOut ? "Logging out…" : "Log out"}
            </Button>
          </div>
        </header>

        <main className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          {isPending || !session ? (
            <div
              role="status"
              aria-live="polite"
              className="grid min-h-[60vh] place-items-center text-center"
            >
              <div>
                <LoadingSpinner size="lg" className="mx-auto" />
                <p className="mt-4 text-sm font-medium text-neutral-900">
                  {isPending ? "Getting your workspace ready…" : "Taking you to sign in…"}
                </p>
                <p className="mt-1 text-xs text-neutral-500">This usually takes a moment.</p>
              </div>
            </div>
          ) : (
            children
          )}
        </main>
      </div>
    </div>
  );
}
