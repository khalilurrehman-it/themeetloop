"use client";

import { useState, type FormEvent } from "react";

import { Button } from "@/components/ui/button";
import { AuthenticationFormField } from "@/modules/authentication/components/AuthenticationFormField";
import { AuthenticationNotice } from "@/modules/authentication/components/AuthenticationNotice";
import { authenticationClient } from "@/modules/authentication/services/authenticationClient";

const EMAIL_ADDRESS_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function ForgotPasswordForm() {
  const [emailAddress, setEmailAddress] = useState<string>("");
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [isSubmitted, setIsSubmitted] = useState<boolean>(false);

  async function handleFormSubmitted(submitEvent: FormEvent<HTMLFormElement>): Promise<void> {
    submitEvent.preventDefault();
    const normalizedEmailAddress = emailAddress.trim().toLowerCase();
    if (!EMAIL_ADDRESS_PATTERN.test(normalizedEmailAddress)) {
      setErrorMessage("Enter a valid email address.");
      return;
    }
    setErrorMessage("");
    setIsSubmitting(true);
    await authenticationClient.requestPasswordReset({
      email: normalizedEmailAddress,
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setIsSubmitting(false);
    setIsSubmitted(true);
  }

  if (isSubmitted)
    return (
      <AuthenticationNotice
        tone="success"
        message="If an account exists for that address, a password reset link has been sent."
      />
    );

  return (
    <form noValidate onSubmit={handleFormSubmitted} className="flex flex-col gap-5">
      <AuthenticationFormField
        fieldId="emailAddress"
        label="Email address"
        type="email"
        autoComplete="email"
        placeholder="you@company.com"
        description="We will send a secure reset link if an account exists."
        value={emailAddress}
        errorMessage={errorMessage || undefined}
        isRequired
        isDisabled={isSubmitting}
        onValueChange={(nextValue) => {
          setEmailAddress(nextValue);
          setErrorMessage("");
        }}
      />
      <Button type="submit" disabled={isSubmitting} className="h-11 w-full rounded-xl text-sm">
        {isSubmitting ? "Sending reset link…" : "Send reset link"}
      </Button>
    </form>
  );
}
