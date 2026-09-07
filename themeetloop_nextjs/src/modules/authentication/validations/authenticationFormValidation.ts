import { z } from "zod";

export const MINIMUM_PASSWORD_LENGTH = 8;
export const MINIMUM_FULL_NAME_LENGTH = 2;

const emailAddressSchema = z
  .string()
  .trim()
  .min(1, "Enter your email address.")
  .email("Enter a valid email address.");

export const loginFormSchema = z.object({
  emailAddress: emailAddressSchema,
  password: z.string().min(1, "Enter your password."),
});

export const registerFormSchema = z.object({
  fullName: z.string().trim().min(MINIMUM_FULL_NAME_LENGTH, "Enter your name."),
  emailAddress: emailAddressSchema,
  password: z
    .string()
    .min(1, "Enter your password.")
    .min(MINIMUM_PASSWORD_LENGTH, `Use at least ${MINIMUM_PASSWORD_LENGTH} characters.`),
});
