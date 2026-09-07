"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useState, type FormEvent } from "react";

import { Button } from "@/components/ui/button";
import { AuthenticationFormField } from "@/modules/authentication/components/AuthenticationFormField";
import { AuthenticationNotice } from "@/modules/authentication/components/AuthenticationNotice";
import { authenticationClient } from "@/modules/authentication/services/authenticationClient";

export function ResetPasswordForm() {
  const searchParameters = useSearchParams();
  const [newPassword, setNewPassword] = useState<string>("");
  const [confirmedPassword, setConfirmedPassword] = useState<string>("");
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [isComplete, setIsComplete] = useState<boolean>(false);
  const resetToken = searchParameters.get("token");

  async function handleFormSubmitted(submitEvent: FormEvent<HTMLFormElement>): Promise<void> {
    submitEvent.preventDefault();
    if (!resetToken) {
      setErrorMessage("This password reset link is invalid or incomplete.");
      return;
    }
    if (newPassword.length < 8 || newPassword.length > 128) {
      setErrorMessage("Use between 8 and 128 characters.");
      return;
    }
    if (newPassword !== confirmedPassword) {
      setErrorMessage("The passwords do not match.");
      return;
    }
    setErrorMessage("");
    setIsSubmitting(true);
    const { error } = await authenticationClient.resetPassword({ newPassword, token: resetToken });
    setIsSubmitting(false);
    if (error) {
      setErrorMessage("This reset link is invalid or expired. Request a new one.");
      return;
    }
    setIsComplete(true);
  }

  if (isComplete)
    return (
      <div className="space-y-5">
        <AuthenticationNotice
          tone="success"
          message="Your password has been changed, and you have been signed out on your other devices."
        />
        <Button render={<Link href="/login" />} className="h-11 w-full rounded-xl">
          Continue to login
        </Button>
      </div>
    );

  return (
    <form noValidate onSubmit={handleFormSubmitted} className="flex flex-col gap-5">
      <AuthenticationFormField
        fieldId="newPassword"
        label="New password"
        type="password"
        autoComplete="new-password"
        placeholder="At least 8 characters"
        description="Use between 8 and 128 characters."
        value={newPassword}
        isRequired
        isDisabled={isSubmitting}
        onValueChange={(nextValue) => {
          setNewPassword(nextValue);
          setErrorMessage("");
        }}
      />
      <AuthenticationFormField
        fieldId="confirmedPassword"
        label="Confirm password"
        type="password"
        autoComplete="new-password"
        placeholder="Enter the password again"
        description="Both passwords must match."
        value={confirmedPassword}
        isRequired
        isDisabled={isSubmitting}
        onValueChange={(nextValue) => {
          setConfirmedPassword(nextValue);
          setErrorMessage("");
        }}
      />
      {errorMessage && <AuthenticationNotice tone="error" message={errorMessage} />}
      <Button type="submit" disabled={isSubmitting} className="h-11 w-full rounded-xl text-sm">
        {isSubmitting ? "Updating password…" : "Update password"}
      </Button>
    </form>
  );
}
