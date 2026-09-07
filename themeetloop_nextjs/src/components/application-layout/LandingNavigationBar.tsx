"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { useCallback, useEffect, useState } from "react";
import { HiArrowUpRight, HiOutlineBars2 } from "react-icons/hi2";

import { MeetLoopBrandMark } from "@/components/application-layout/MeetLoopBrandMark";
import { FullScreenLoadingOverlay } from "@/components/feedback/FullScreenLoadingOverlay";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { LANDING_NAVIGATION_ITEMS } from "@/constants/landingNavigationConstants";
import { cn } from "@/lib/utils";
import { useLogout } from "@/modules/authentication/hooks/useLogout";
import { authenticationClient } from "@/modules/authentication/services/authenticationClient";

/** Distance the page must travel before the bar switches to its elevated state. */
const PAGE_SCROLLED_THRESHOLD_IN_PIXELS = 12;

export function LandingNavigationBar() {
  const [activeSectionHref, setActiveSectionHref] = useState<string>("");
  const [isPageScrolled, setIsPageScrolled] = useState<boolean>(false);
  const [isMobileNavigationOpen, setIsMobileNavigationOpen] = useState<boolean>(false);
  const { data: authenticatedSession, isPending: isAuthenticationPending } =
    authenticationClient.useSession();
  const isAuthenticated = Boolean(authenticatedSession?.user);
  const { isLoggingOut, logout } = useLogout("/");

  const prefersReducedMotion = useReducedMotion();

  useEffect(() => {
    const sectionElements = LANDING_NAVIGATION_ITEMS.map((navigationItem) =>
      document.querySelector(navigationItem.href),
    ).filter((sectionElement): sectionElement is Element => sectionElement !== null);

    const sectionObserver = new IntersectionObserver(
      (entries) => {
        const visibleEntry = entries
          .filter((entry) => entry.isIntersecting)
          .sort(
            (firstEntry, secondEntry) =>
              secondEntry.intersectionRatio - firstEntry.intersectionRatio,
          )[0];
        if (visibleEntry?.target.id) setActiveSectionHref(`#${visibleEntry.target.id}`);
      },
      { rootMargin: "-25% 0px -60% 0px", threshold: [0, 0.1, 0.3] },
    );

    sectionElements.forEach((sectionElement) => sectionObserver.observe(sectionElement));
    return () => sectionObserver.disconnect();
  }, []);

  useEffect(() => {
    const handleWindowScrolled = (): void => {
      setIsPageScrolled(window.scrollY > PAGE_SCROLLED_THRESHOLD_IN_PIXELS);
    };

    handleWindowScrolled();
    window.addEventListener("scroll", handleWindowScrolled, { passive: true });
    return () => window.removeEventListener("scroll", handleWindowScrolled);
  }, []);

  const handleMobileNavigationItemSelected = useCallback((): void => {
    setIsMobileNavigationOpen(false);
  }, []);

  return (
    <>
      {isLoggingOut && (
        <FullScreenLoadingOverlay
          title="Signing you out…"
          description="Clearing this device before you go."
        />
      )}
      <header
        className={cn(
          // `w-full` and `shrink-0` are load-bearing: a sticky box is not stretched by its
          // containing block, so without them the bar collapses to its content width.
          "sticky top-0 z-50 w-full shrink-0 border-b transition-colors duration-300",
          isPageScrolled
            ? "border-neutral-200 bg-white/90 backdrop-blur-xl"
            : "border-transparent bg-white/70 backdrop-blur-sm",
        )}
      >
        <a
          href="#landing-main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-3 focus:z-10 focus:rounded-lg focus:bg-neutral-950 focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-white"
        >
          Skip to main content
        </a>

        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={prefersReducedMotion ? { duration: 0 } : { duration: 0.4, ease: "easeOut" }}
          className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between gap-4 px-5 sm:px-8"
        >
          <div className="shrink-0">
            <MeetLoopBrandMark />
          </div>

          {/* In-flow centring only — no absolute positioning, so the pill can never overlap
            the brand mark or the account actions at any width. */}
          <nav aria-label="Primary navigation" className="hidden flex-1 justify-center md:flex">
            <ul className="flex items-center gap-1 rounded-full border border-neutral-200 bg-neutral-100 p-1">
              {LANDING_NAVIGATION_ITEMS.map((navigationItem) => {
                const isActiveSection = activeSectionHref === navigationItem.href;
                return (
                  <li key={navigationItem.href}>
                    <Link
                      href={navigationItem.href}
                      aria-current={isActiveSection ? "location" : undefined}
                      className={cn(
                        "relative flex h-8 items-center whitespace-nowrap rounded-full px-3 text-xs font-semibold transition-colors lg:px-4 lg:text-sm",
                        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-950 focus-visible:ring-offset-2",
                        isActiveSection ? "text-white" : "text-neutral-600 hover:text-neutral-950",
                      )}
                    >
                      {isActiveSection && (
                        <motion.span
                          layoutId="landing-navigation-active-section-indicator"
                          aria-hidden="true"
                          className="absolute inset-0 rounded-full bg-neutral-950"
                          transition={
                            prefersReducedMotion
                              ? { duration: 0 }
                              : { type: "spring", stiffness: 420, damping: 34 }
                          }
                        />
                      )}
                      <span className="relative z-10">{navigationItem.label}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>

          <div className="flex shrink-0 items-center gap-2">
            {isAuthenticationPending ? (
              <div className="hidden h-9 w-36 animate-pulse rounded-xl bg-neutral-100 md:block" />
            ) : isAuthenticated ? (
              <>
                <Button
                  variant="outline"
                  disabled={isLoggingOut}
                  onClick={() => void logout()}
                  className="hidden h-9 rounded-xl border-neutral-300 bg-white px-3.5 md:inline-flex lg:px-4"
                >
                  {isLoggingOut ? "Logging out…" : "Log out"}
                </Button>
                <Link
                  href="/dashboard"
                  className={cn(
                    buttonVariants(),
                    "group hidden h-9 gap-1.5 rounded-xl px-4 md:inline-flex",
                  )}
                >
                  Dashboard
                  <HiArrowUpRight className="transition-transform duration-200 group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
                </Link>
              </>
            ) : (
              <>
                <Link
                  href="/login"
                  className={cn(
                    buttonVariants({ variant: "outline" }),
                    "hidden h-9 rounded-xl border-neutral-300 bg-white px-3.5 md:inline-flex lg:px-4",
                  )}
                >
                  Log in
                </Link>
                <Link
                  href="/register"
                  className={cn(
                    buttonVariants(),
                    "group hidden h-9 gap-1.5 rounded-xl px-4 md:inline-flex",
                  )}
                >
                  Get started
                  <HiArrowUpRight className="transition-transform duration-200 group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
                </Link>
              </>
            )}

            {/* Hidden by a wrapper rather than a class on the trigger, so the breakpoint
              cannot be lost to prop merging inside the primitive. */}
            <div className="md:hidden">
              <Sheet open={isMobileNavigationOpen} onOpenChange={setIsMobileNavigationOpen}>
                <SheetTrigger
                  aria-label="Open navigation menu"
                  className="grid size-11 place-items-center rounded-xl border border-neutral-200 bg-white text-neutral-950 transition-colors hover:bg-neutral-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-950 focus-visible:ring-offset-2"
                >
                  <HiOutlineBars2 className="size-6" />
                </SheetTrigger>

                <SheetContent
                  side="right"
                  showCloseButton
                  className="flex w-11/12 max-w-sm flex-col gap-0 border-l border-neutral-200 bg-white p-0 text-neutral-950"
                >
                  <SheetHeader className="shrink-0 border-b border-neutral-200 px-6 py-5 text-left">
                    <SheetTitle>
                      <MeetLoopBrandMark />
                    </SheetTitle>
                    <SheetDescription className="mt-2 text-neutral-500">
                      Meetings that remember what happens next.
                    </SheetDescription>
                  </SheetHeader>

                  {/* `min-h-0` lets this region shrink inside the flex column, which is what
                    allows it to scroll on short viewports instead of pushing the account
                    actions off-screen. */}
                  <nav
                    aria-label="Mobile navigation"
                    className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-4"
                  >
                    <ul className="flex flex-col gap-1">
                      {LANDING_NAVIGATION_ITEMS.map((navigationItem) => {
                        const isActiveSection = activeSectionHref === navigationItem.href;
                        return (
                          <li key={navigationItem.href}>
                            <Link
                              href={navigationItem.href}
                              onClick={handleMobileNavigationItemSelected}
                              aria-current={isActiveSection ? "location" : undefined}
                              className={cn(
                                "flex items-center rounded-xl px-4 py-3.5 text-base font-semibold transition-colors",
                                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-950 focus-visible:ring-offset-2",
                                isActiveSection
                                  ? "bg-neutral-950 text-white"
                                  : "text-neutral-700 hover:bg-neutral-100 hover:text-neutral-950",
                              )}
                            >
                              {navigationItem.label}
                            </Link>
                          </li>
                        );
                      })}
                    </ul>
                  </nav>

                  {!isAuthenticationPending && (
                    <SheetFooter className="shrink-0 gap-2 border-t border-neutral-200 bg-neutral-50 p-4">
                      {isAuthenticated ? (
                        <>
                          <Button
                            variant="outline"
                            disabled={isLoggingOut}
                            onClick={() => {
                              setIsMobileNavigationOpen(false);
                              void logout();
                            }}
                            className="h-11 rounded-xl border-neutral-300 bg-white"
                          >
                            {isLoggingOut ? "Logging out…" : "Log out"}
                          </Button>
                          <Link
                            href="/dashboard"
                            onClick={handleMobileNavigationItemSelected}
                            className={cn(buttonVariants(), "group h-11 gap-1.5 rounded-xl")}
                          >
                            Dashboard
                            <HiArrowUpRight className="transition-transform duration-200 group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
                          </Link>
                        </>
                      ) : (
                        <>
                          <Link
                            href="/login"
                            onClick={handleMobileNavigationItemSelected}
                            className={cn(
                              buttonVariants({ variant: "outline" }),
                              "h-11 rounded-xl border-neutral-300 bg-white",
                            )}
                          >
                            Log in
                          </Link>
                          <Link
                            href="/register"
                            onClick={handleMobileNavigationItemSelected}
                            className={cn(buttonVariants(), "group h-11 gap-1.5 rounded-xl")}
                          >
                            Get started
                            <HiArrowUpRight className="transition-transform duration-200 group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
                          </Link>
                        </>
                      )}
                    </SheetFooter>
                  )}
                </SheetContent>
              </Sheet>
            </div>
          </div>
        </motion.div>
      </header>
    </>
  );
}
