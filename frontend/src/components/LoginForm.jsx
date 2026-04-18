import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Link, useNavigate } from "react-router-dom"
import api, { setAccessToken } from "@/services/axios.js";
import { useAuth } from "@/context/AuthContext.jsx";
import { useGoogleLogin } from '@react-oauth/google';
import { Loader2 } from "lucide-react";
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

const GoogleIcon = () => (
  <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
  </svg>
);

export function LoginForm({ className, ...props }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error429, setError429] = useState(false);
  const [errorGeneral, setErrorGeneral] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError429(false);
    setErrorGeneral("");

    try {
      const response = await api.post('user/login/', { username, password });

      login(response.data.access);

      navigate('/recommendations');

    } catch (error) {
      if (error.response?.status === 429) {
        setError429(true);
      } else if (error.response?.status === 401) {
        setErrorGeneral("Incorrect username or password.");
      } else {
        setErrorGeneral("A server error has occurred.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleLogin = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      setIsGoogleLoading(true);
      setErrorGeneral("");

      try {
        const response = await api.post('user/auth/google/', {
          access_token: tokenResponse.access_token
        });

        if (response.data.status === 'login') {

          setAccessToken(response.data.access);

          login();

          navigate('/recommendations');
        } else if (response.data.status === 'needs_registration') {
          navigate('/signup', { state: { googleData: response.data.google_data } });
        }
      } catch (error) {
        setErrorGeneral("Google authentication failed.");
      } finally {
        setIsGoogleLoading(false);
      }
    },
  });

  return (
    <div className={cn("flex flex-col gap-6 w-full max-w-md mx-auto z-50 relative", className)} {...props}>
      <Card className="flex flex-col p-6 shadow-2xl bg-card/45 backdrop-blur-sm border-white/10 dark:border-white/5">
        <CardHeader>
          <CardTitle className="text-2xl text-foreground">Login to your account</CardTitle>
          <CardDescription className="text-muted-foreground">
            Enter your username or email below to login to your account
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin}>
            <FieldGroup>
              <Field className="space-y-2">
                <FieldLabel htmlFor="username">Username or Email</FieldLabel>
                <Input
                  id="username"
                  type="username"
                  placeholder="username or m@example.com"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="bg-card/45"
                />
              </Field>
              <Field className="space-y-2 pt-2">
                <div className="flex items-center justify-between">
                  <FieldLabel htmlFor="password">Password</FieldLabel>
                  <Link
                    to="forgot-password/"
                    className="text-sm text-muted-foreground underline-offset-4 hover:underline hover:text-primary transition-colors"
                  >Forgot password?</Link>
                </div>
                <Input
                  id="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="bg-card/45"
                />
              </Field>

              {error429 && <p className="text-sm text-destructive font-medium">Too many attempts, try again in a minute</p>}
              {errorGeneral && <p className="text-sm text-destructive font-medium">{errorGeneral}</p>}

              <Field className="pt-4 space-y-4">
                <Button type="submit" className="w-full">Login</Button>
                <Button
                  variant="outline"
                  type="button"
                  disabled={isSubmitting || isGoogleLoading}
                  onClick={() => handleGoogleLogin()}
                  className="w-full"
                >
                  {isGoogleLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : (
                    <>
                      <GoogleIcon />
                      Login with Google
                    </>
                  )}
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