"use client";

import { Toaster } from "react-hot-toast";

export function ApplicationToastNotifications() {
  return (
    <Toaster
      position="top-right"
      gutter={10}
      toastOptions={{
        duration: 4000,
        style: {
          background: "#171717",
          border: "1px solid #262626",
          borderRadius: "12px",
          color: "#ffffff",
          fontSize: "14px",
          padding: "12px 14px",
        },
        success: { iconTheme: { primary: "#ffffff", secondary: "#171717" } },
        error: { iconTheme: { primary: "#f87171", secondary: "#171717" } },
      }}
    />
  );
}
