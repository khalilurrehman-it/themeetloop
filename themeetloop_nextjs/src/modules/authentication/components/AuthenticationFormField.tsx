"use client";

import { EyeIcon, EyeOffIcon } from "lucide-react";
import { useState } from "react";

import { Field, FieldDescription, FieldError, FieldLabel } from "@/components/ui/field";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "@/components/ui/input-group";

interface AuthenticationFormFieldProps {
  fieldId: string;
  label: string;
  type: "text" | "email" | "password";
  autoComplete: string;
  placeholder: string;
  description: string;
  value: string;
  errorMessage?: string;
  isRequired: boolean;
  isDisabled: boolean;
  onValueChange: (nextValue: string) => void;
}

export function AuthenticationFormField({
  fieldId,
  label,
  type,
  autoComplete,
  placeholder,
  description,
  value,
  errorMessage,
  isRequired,
  isDisabled,
  onValueChange,
}: AuthenticationFormFieldProps) {
  const [isPasswordVisible, setIsPasswordVisible] = useState<boolean>(false);

  const isPasswordField = type === "password";
  const descriptionId = `${fieldId}-description`;
  const errorMessageId = `${fieldId}-error`;
  const resolvedInputType = isPasswordField && isPasswordVisible ? "text" : type;

  return (
    <Field>
      <FieldLabel htmlFor={fieldId}>
        {label}
        {isRequired && (
          <>
            <span aria-hidden="true" className="text-destructive">
              *
            </span>
            <span className="sr-only">(required)</span>
          </>
        )}
      </FieldLabel>

      <InputGroup className="h-11 rounded-xl border-neutral-300 bg-white">
        <InputGroupInput
          id={fieldId}
          name={fieldId}
          type={resolvedInputType}
          autoComplete={autoComplete}
          placeholder={placeholder}
          value={value}
          required={isRequired}
          disabled={isDisabled}
          aria-invalid={errorMessage !== undefined}
          aria-describedby={errorMessage ? `${descriptionId} ${errorMessageId}` : descriptionId}
          onChange={(changeEvent) => onValueChange(changeEvent.target.value)}
          className="authentication-form-input h-full px-3.5 text-sm"
        />
        {isPasswordField && (
          <InputGroupAddon align="inline-end">
            <InputGroupButton
              size="icon-sm"
              disabled={isDisabled}
              aria-label={isPasswordVisible ? "Hide password" : "Show password"}
              aria-pressed={isPasswordVisible}
              aria-controls={fieldId}
              onClick={() => setIsPasswordVisible((isVisible) => !isVisible)}
              className="rounded-lg text-neutral-500 hover:text-neutral-950"
            >
              {isPasswordVisible ? <EyeOffIcon /> : <EyeIcon />}
            </InputGroupButton>
          </InputGroupAddon>
        )}
      </InputGroup>

      <FieldDescription id={descriptionId} className="text-xs">
        {description}
      </FieldDescription>

      {errorMessage && (
        <FieldError id={errorMessageId} className="text-xs">
          {errorMessage}
        </FieldError>
      )}
    </Field>
  );
}
