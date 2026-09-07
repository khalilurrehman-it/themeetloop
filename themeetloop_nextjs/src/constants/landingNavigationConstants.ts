export interface LandingNavigationItem {
  label: string;
  href: string;
}

export interface LandingFooterLink {
  label: string;
  href: string;
}

export interface LandingFooterLinkGroup {
  title: string;
  links: readonly LandingFooterLink[];
}

export const LANDING_NAVIGATION_ITEMS: readonly LandingNavigationItem[] = [
  { label: "Product", href: "#product" },
  { label: "How it works", href: "#how-it-works" },
  { label: "Memory", href: "#memory" },
  { label: "FAQ", href: "#frequently-asked-questions" },
];

export const LANDING_FOOTER_LINK_GROUPS: readonly LandingFooterLinkGroup[] = [
  {
    title: "Product",
    links: [
      { label: "Live transcription", href: "#product" },
      { label: "Actionable notes", href: "#how-it-works" },
      { label: "Meeting memory", href: "#memory" },
    ],
  },
  {
    title: "Explore",
    links: [
      { label: "How it works", href: "#how-it-works" },
      { label: "FAQ", href: "#frequently-asked-questions" },
      { label: "Log in", href: "/login" },
    ],
  },
  {
    title: "Legal",
    links: [
      { label: "Privacy", href: "#" },
      { label: "Terms", href: "#" },
      { label: "Security", href: "#" },
    ],
  },
];
