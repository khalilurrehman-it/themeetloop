import { HiOutlineInformationCircle } from "react-icons/hi2";

interface AuthenticationNoticeProps {
  message: string;
  tone?: "information" | "error" | "success";
}

export function AuthenticationNotice({ message, tone = "information" }: AuthenticationNoticeProps) {
  return (
    <p
      role="status"
      className={`flex items-start gap-2.5 rounded-xl border px-3.5 py-3 text-xs leading-5 ${tone === "error" ? "border-red-200 bg-red-50 text-red-800" : tone === "success" ? "border-emerald-200 bg-emerald-50 text-emerald-800" : "border-neutral-300 bg-neutral-50 text-neutral-700"}`}
    >
      <HiOutlineInformationCircle aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
      {message}
    </p>
  );
}
