import { LandingCallToActionSection } from "@/modules/landing/components/LandingCallToActionSection";
import { LandingContinuousRecordSection } from "@/modules/landing/components/LandingContinuousRecordSection";
import { LandingFrequentlyAskedQuestionsSection } from "@/modules/landing/components/LandingFrequentlyAskedQuestionsSection";
import { LandingHeroSection } from "@/modules/landing/components/LandingHeroSection";
import { LandingHowItWorksSection } from "@/modules/landing/components/LandingHowItWorksSection";
import { LandingMemorySection } from "@/modules/landing/components/LandingMemorySection";
import { LandingProductFeaturesSection } from "@/modules/landing/components/LandingProductFeaturesSection";

export function LandingPageView() {
  return (
    <>
      <LandingHeroSection />
      <LandingProductFeaturesSection />
      <LandingHowItWorksSection />
      <LandingContinuousRecordSection />
      <LandingMemorySection />
      <LandingFrequentlyAskedQuestionsSection />
      <LandingCallToActionSection />
    </>
  );
}
