export interface LoginFormValues {
  emailAddress: string;
  password: string;
}

export interface RegisterFormValues {
  fullName: string;
  emailAddress: string;
  password: string;
}

export type LoginFormFieldErrors = Partial<Record<keyof LoginFormValues, string>>;

export type RegisterFormFieldErrors = Partial<Record<keyof RegisterFormValues, string>>;
