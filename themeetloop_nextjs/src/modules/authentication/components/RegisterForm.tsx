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
import type { RegisterFormValues } from "@/modules/authentication/types/authentication.types";
import {
  MINIMUM_PASSWORD_LENGTH,
  registerFormSchema,
} from "@/modules/authentication/validations/authenticationFormValidation";

const EMPTY_FORM_VALUES: RegisterFormValues = { fullName: "", emailAddress: "", password: "" };

interface RegisterFormProps {
  redirectPath: string;
}

export function RegisterForm({ redirectPath }: RegisterFormProps) {
  const router = useRouter();
  const [noticeMessage, setNoticeMessage] = useState<string>("");
  const {
    control,
    formState: { errors: fieldErrors, isSubmitted, isSubmitting },
    handleSubmit,
    setValue,
  } = useForm<RegisterFormValues>({
    defaultValues: EMPTY_FORM_VALUES,
    mode: "onSubmit",
    reValidateMode: "onChange",
    resolver: zodResolver(registerFormSchema),
  });
  const fullName = useWatch({ control, name: "fullName" });
  const emailAddress = useWatch({ control, name: "emailAddress" });
  const password = useWatch({ control, name: "password" });

  function handleFieldChanged(fieldName: keyof RegisterFormValues, nextValue: string): void {
    setValue(fieldName, nextValue, { shouldDirty: true, shouldValidate: isSubmitted });
    setNoticeMessage("");
  }

  async function handleFormSubmitted(validatedFormValues: RegisterFormValues): Promise<void> {
    setNoticeMessage("");
    toast.dismiss();

    try {
      const { error } = await authenticationClient.signUp.email({
        name: validatedFormValues.fullName.trim(),
        email: validatedFormValues.emailAddress.trim().toLowerCase(),
        password: validatedFormValues.password,
      });
      if (error) {
        const errorMessage = "We could not create your account. Check your details and try again.";
        setNoticeMessage(errorMessage);
        toast.error(errorMessage);
        return;
      }
      toast.success("Account created. Welcome to MeetLoop.");
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
        fieldId="fullName"
        label="Full name"
        type="text"
        autoComplete="name"
        placeholder="Khalil Ur Rehman"
        description="Shown to teammates on meetings and commitments."
        value={fullName}
        errorMessage={fieldErrors.fullName?.message}
        isRequired
        isDisabled={isSubmitting}
        onValueChange={(nextValue) => handleFieldChanged("fullName", nextValue)}
      />

      <AuthenticationFormField
        fieldId="emailAddress"
        label="Email address"
        type="email"
        autoComplete="email"
        placeholder="you@company.com"
        description="Use your work address so teammates can find you."
        value={emailAddress}
        errorMessage={fieldErrors.emailAddress?.message}
        isRequired
        isDisabled={isSubmitting}
        onValueChange={(nextValue) => handleFieldChanged("emailAddress", nextValue)}
      />

      <AuthenticationFormField
        fieldId="password"
        label="Password"
        type="password"
        autoComplete="new-password"
        placeholder="At least 8 characters"
        description={`Use at least ${MINIMUM_PASSWORD_LENGTH} characters.`}
        value={password}
        errorMessage={fieldErrors.password?.message}
        isRequired
        isDisabled={isSubmitting}
        onValueChange={(nextValue) => handleFieldChanged("password", nextValue)}
      />

      {noticeMessage && <AuthenticationNotice tone="error" message={noticeMessage} />}

      <AuthenticationSubmitButton
        defaultLabel="Create account"
        loadingLabel="Creating account…"
        isSubmitting={isSubmitting}
      />

      <p className="text-center text-xs leading-5 text-neutral-500">
        By creating an account you agree to the{" "}
        <Link href="/terms" className="text-neutral-800 underline underline-offset-2">
          terms
        </Link>{" "}
        and{" "}
        <Link href="/privacy" className="text-neutral-800 underline underline-offset-2">
          privacy policy
        </Link>
        .
      </p>
    </form>
  );
}
