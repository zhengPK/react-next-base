"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm, type SubmitHandler } from "react-hook-form";
import { LogIn } from "lucide-react";
import * as z from "zod";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { apiFetch, notifyAuthChange, setAuthSession } from "@/lib/auth";

const inputClass =
  "h-11 w-full rounded-xl border border-[color-mix(in_oklch,var(--dream-ink)_12%,transparent)] bg-white/90 px-4 text-sm text-[var(--dream-ink)] shadow-inner outline-none transition placeholder:text-[color-mix(in_oklch,var(--dream-ink)_45%,transparent)] focus:border-[color-mix(in_oklch,var(--dream-teal)_55%,transparent)] focus:ring-2 focus:ring-[color-mix(in_oklch,var(--dream-teal)_25%,transparent)]";

const loginSchema = z.object({
  username: z
    .string()
    .refine((s) => s.trim().length > 0, { message: "请输入用户名" }),
  password: z
    .string()
    .refine((s) => s.trim().length > 0, { message: "请输入密码" }),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export default function SignInPage() {
  const router = useRouter();

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: "",
      password: "",
    },
    mode: "onSubmit",
  });

  const [wUsername, wPassword] = form.watch(["username", "password"]);

  const canSubmit = useMemo(
    () => wUsername.trim().length > 0 && wPassword.trim().length > 0,
    [wPassword, wUsername],
  );

  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const onSubmit: SubmitHandler<LoginFormValues> = async (values) => {
    setFormError(null);
    const username = values.username.trim();
    const password = values.password;
    try {
      setSubmitting(true);
      const res = await apiFetch("/login", {
        method: "POST",
        body: JSON.stringify({ username, password }),
      });
      const resData = (await res.json()) as {
        code?: number;
        message?: string;
        data?: {'token': string, 'user': { id: string; username: string }};
      };
      if (resData.code === 200 && resData.data) {
        const { token, user } = resData.data;
        setAuthSession({ token, user });
        notifyAuthChange();
        router.push("/textrag");
      } else {
        setFormError(resData.message ?? "登录失败");
      }
    } catch {
      setFormError("登录失败，请稍后重试");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="dream-grain relative min-h-[calc(100vh-56px)] px-4 pt-4 pb-12 sm:pt-6 sm:pb-16">
      <div className="relative z-10 mx-auto w-full max-w-md">
        <Card className="dream-animate-in w-full gap-0 py-0 overflow-hidden rounded-2xl border-[color-mix(in_oklch,var(--dream-ink)_10%,transparent)] bg-white/85 shadow-[0_32px_100px_-40px_rgba(20,17,15,0.45)] ring-1 ring-[color-mix(in_oklch,var(--dream-ink)_6%,transparent)] backdrop-blur-md">
          <CardHeader className="gap-0 border-b border-[color-mix(in_oklch,var(--dream-ink)_8%,transparent)] bg-gradient-to-br from-[#0d5c57] via-[#0a4542] to-[#062a28] p-0">
            <div className="flex items-center gap-3 px-6 py-4">
              <span className="flex size-10 items-center justify-center rounded-xl bg-white/15 ring-1 ring-white/20">
                <LogIn className="size-5 text-white" strokeWidth={1.75} />
              </span>
              <CardTitle className="font-[family-name:var(--font-syne)] text-lg font-semibold tracking-tight text-white">
                用户登录
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent className="px-6 pb-8 pt-5">
            <form
              className="flex flex-col gap-6"
              onSubmit={form.handleSubmit(onSubmit, () => setFormError(null))}
            >
              <FieldGroup className="gap-6">
                <Controller
                  name="username"
                  control={form.control}
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid}>
                      <FieldLabel
                        htmlFor="login-username"
                        className="text-sm font-medium text-[var(--dream-ink)]"
                      >
                        用户名
                      </FieldLabel>
                      <Input
                        {...field}
                        id="login-username"
                        className={inputClass}
                        placeholder="请输入用户名"
                        autoComplete="username"
                        aria-invalid={fieldState.invalid}
                      />
                      {fieldState.invalid ? (
                        <FieldError errors={[fieldState.error]} />
                      ) : null}
                    </Field>
                  )}
                />

                <Controller
                  name="password"
                  control={form.control}
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid}>
                      <FieldLabel
                        htmlFor="login-password"
                        className="text-sm font-medium text-[var(--dream-ink)]"
                      >
                        密码
                      </FieldLabel>
                      <Input
                        {...field}
                        id="login-password"
                        className={inputClass}
                        placeholder="请输入密码"
                        type="password"
                        autoComplete="current-password"
                        aria-invalid={fieldState.invalid}
                      />
                      {fieldState.invalid ? (
                        <FieldError errors={[fieldState.error]} />
                      ) : null}
                    </Field>
                  )}
                />
              </FieldGroup>

              {formError ? (
                <Alert
                  variant="destructive"
                  className="rounded-xl border border-red-200/80 bg-red-50/90 px-3 py-2.5 text-sm text-red-800"
                >
                  <AlertDescription className="text-red-800">
                    {formError}
                  </AlertDescription>
                </Alert>
              ) : null}

              <Button
                type="submit"
                disabled={submitting || !canSubmit}
                className="h-11 w-full rounded-xl bg-gradient-to-r from-[#0d5c57] to-[#0a4542] font-medium text-white shadow-lg shadow-[color-mix(in_oklch,var(--dream-teal)_35%,transparent)] transition hover:brightness-110 disabled:opacity-50"
              >
                <LogIn data-icon="inline-start" strokeWidth={1.75} />
                登录
              </Button>

              <Separator className="my-1 bg-[color-mix(in_oklch,var(--dream-ink)_8%,transparent)]" />

              <div className="text-center text-sm text-[color-mix(in_oklch,var(--dream-ink)_58%,transparent)]">
                还没有账号？
                <Link
                  href="/textrag/register"
                  className="ml-2 font-semibold text-[var(--dream-copper)] underline-offset-4 hover:underline"
                >
                  立即注册
                </Link>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
