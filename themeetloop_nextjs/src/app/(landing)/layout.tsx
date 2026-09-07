import { LandingFooter } from "@/components/application-layout/LandingFooter";
import { LandingNavigationBar } from "@/components/application-layout/LandingNavigationBar";

export default function LandingLayout({ children }: LayoutProps<"/">) {
  return (
    <div className="flex min-h-screen flex-col bg-white">
      <LandingNavigationBar />
      <main id="landing-main-content" className="w-full flex-1">
        {children}
      </main>
      <LandingFooter />
    </div>
  );
}
