import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Link } from "react-router-dom"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/Card"
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"

import { useState } from "react"

export function LoginForm({ className, ...props }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error429, setError429] = useState(false);

  return (
    <div className={cn("flex flex-col gap-6 w-full max-w-md mx-auto z-50 relative", className)} {...props}>
      <Card className="flex flex-col p-6 shadow-2xl bg-card/95 backdrop-blur-sm border-white/10 dark:border-white/5">
        <CardHeader>
          <CardTitle className="text-2xl text-foreground">Login to your account</CardTitle>
          <CardDescription className="text-muted-foreground">
            Enter your email below to login to your account
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={(e) => e.preventDefault()}>
            <FieldGroup>
              <Field className="space-y-2">
                <FieldLabel htmlFor="email">Email</FieldLabel>
                <Input
                  id="email"
                  type="email"
                  placeholder="m@example.com"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="bg-background"
                />
              </Field>
              <Field className="space-y-2 pt-2">
                <div className="flex items-center justify-between">
                  <FieldLabel htmlFor="password">Password</FieldLabel>
                  <a
                    href="#"
                    className="text-sm text-muted-foreground underline-offset-4 hover:underline hover:text-primary transition-colors"
                  >
                    Forgot password?
                  </a>
                </div>
                <Input
                  id="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="bg-background"
                />
              </Field>

              {error429 && (
                 <p className="text-sm text-destructive font-medium">
                   Too many attempts, try again in a minute
                 </p>
              )}

              <Field className="pt-4 space-y-4">
                <Button type="submit" className="w-full">Login</Button>
                <Button variant="outline" type="button" className="w-full">
                  Login with Google
                </Button>
                <div className="text-center text-sm text-muted-foreground pt-2">
                  Don&apos;t have an account? <Link to="/signup" className="text-primary hover:underline font-medium">Sign up</Link>
                </div>
              </Field>
            </FieldGroup>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}