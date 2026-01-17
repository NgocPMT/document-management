import * as z from "zod";

export const SignUpSchema = z
  .object({
    email: z.email(),
    password: z.string().min(8),
    confirmPassword: z.string(),
    name: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Password do not match",
    path: ["confirmPassword"],
  });

export const SignInSchema = z.object({
  email: z.email(),
  password: z.string().min(8),
});

export type SignUpDTO = z.infer<typeof SignUpSchema>;
export type SignInDTO = z.infer<typeof SignInSchema>;
