"use client";

import Link from "next/link";
import { useRouter } from "nextjs-toploader/app";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import toast from "react-hot-toast";

import { AuthenticationFormField } from "@/modules/authentication/components/AuthenticationFormField";
import { AuthenticationNotice } from "@/modules/authentication/components/AuthenticationNotice";
import { AuthenticationSubmitButton } from "@/modules/authentication/components/AuthenticationSubmitButton";
import { authenticationClient } from "@/modules/authentication/services/authenticationClient";
import type { LoginFormValues } from "@/modules/authentication/types/authentication.types";
import { loginFormSchema } from "@/modules/authentication/validations/authenticationFormValidation";

const EMPTY_FORM_VALUES: LoginFormValues = { emailAddress: "", password: "" };

interface LoginFormProps {
  redirectPath: string;
}

export function LoginForm({ redirectPath }: LoginFormProps) {
  const router = useRouter();
  const [noticeMessage, setNoticeMessage] = useState<string>("");
  const {
    control,
    formState: { errors: fieldErrors, isSubmitted, isSubmitting },
    handleSubmit,
    setValue,
  } = useForm<LoginFormValues>({
    defaultValues: EMPTY_FORM_VALUES,
    mode: "onSubmit",
    reValidateMode: "onChange",
    resolver: zodResolver(loginFormSchema),
  });
  const emailAddress = useWatch({ control, name: "emailAddress" });
  const password = useWatch({ control, name: "password" });

  function handleFieldChanged(fieldName: keyof LoginFormValues, nextValue: string): void {
    setValue(fieldName, nextValue, { shouldDirty: true, shouldValidate: isSubmitted });
    setNoticeMessage("");
  }

  async function handleFormSubmitted(validatedFormValues: LoginFormValues): Promise<void> {
    setNoticeMessage("");
    toast.dismiss();

    try {
      const { error } = await authenticationClient.signIn.email({
        email: validatedFormValues.emailAddress.trim().toLowerCase(),
        password: validatedFormValues.password,
        rememberMe: true,
      });
      if (error) {
        const errorMessage = "The email address or password is incorrect.";
        setNoticeMessage(errorMessage);
        toast.error(errorMessage);
        return;
      }
      toast.success("Welcome back. Opening your dashboard.");
      router.replace(redirectPath);
      router.refresh();
    } catch {
      const errorMessage = "MeetLoop can’t reach its server right now. Please try again.";
      setNoticeMessage(errorMessage);
      toast.error(errorMessage);
    }
  }

  return (
    <form
      noValidate
      onSubmit={handleSubmit(handleFormSubmitted, () => setNoticeMessage(""))}
      className="flex flex-col gap-5"
    >
      <AuthenticationFormField
        fieldId="emailAddress"
        label="Email address"
        type="email"
        autoComplete="email"
        placeholder="you@company.com"
        description="The address you signed up with."
        value={emailAddress}
        errorMessage={fieldErrors.emailAddress?.message}
        isRequired
        isDisabled={isSubmitting}
        onValueChange={(nextValue) => handleFieldChanged("emailAddress", nextValue)}
      />

      <div className="flex flex-col gap-2">
        <AuthenticationFormField
          fieldId="password"
          label="Password"
          type="password"
          autoComplete="current-password"
          placeholder="Your password"
          description="Passwords are case sensitive."
          value={password}
          errorMessage={fieldErrors.password?.message}
          isRequired
          isDisabled={isSubmitting}
          onValueChange={(nextValue) => handleFieldChanged("password", nextValue)}
        />
        <Link
          href="/forgot-password"
          className="self-end rounded-sm text-xs font-medium text-neutral-600 transition-colors hover:text-neutral-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-950 focus-visible:ring-offset-2"
        >
          Forgot password?
        </Link>
      </div>

      {noticeMessage && <AuthenticationNotice tone="error" message={noticeMessage} />}

      <AuthenticationSubmitButton
        defaultLabel="Log in"
        loadingLabel="Logging in…"
        isSubmitting={isSubmitting}
      />
    </form>
  );
}
