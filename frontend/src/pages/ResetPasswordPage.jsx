import React, { useState } from "react";
import { Link, useSearchParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { KeyRound, Loader2, CheckCircle2, AlertTriangle } from "lucide-react";
import api from "@/services/axios";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

const getErrorMessage = (error, defaultMessage) => {
  const data = error.response?.data;
  if (data) {
    const firstKey = Object.keys(data)[0];
    if (firstKey && Array.isArray(data[firstKey])) {
      return data[firstKey][0];
    } else if (firstKey && typeof data[firstKey] === "string") {
      return data[firstKey];
    }
  }
  return defaultMessage;
};

const ResetPasswordPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const uid = searchParams.get("uid");
  const token = searchParams.get("token");

  const [passwords, setPasswords] = useState({ new: "", confirm: "" });
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (passwords.new !== passwords.confirm) {
      return setMessage({ type: "error", text: "Passwords do not match." });
    }

    setIsLoading(true);
    setMessage(null);

    try {
      const response = await api.post("user/password/reset/confirm/", {
        uidb64: uid,
        token: token,
        new_password: passwords.new,
      });

      setMessage({ type: "success", text: response.data.message || "Password reset successfully!" });

      setTimeout(() => navigate("/"), 3000);

    } catch (error) {
      setMessage({ type: "error", text: getErrorMessage(error, "Failed to reset password. The link might be invalid or expired.") });
    } finally {
      setIsLoading(false);
    }
  };

  if (!uid || !token) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center px-4">
        <div className="text-center space-y-4">
          <AlertTriangle className="w-12 h-12 text-destructive mx-auto" />
          <h2 className="text-2xl font-bold">Invalid Reset Link</h2>
          <p className="text-muted-foreground">This link is missing required parameters.</p>
          <Button asChild variant="outline" className="mt-4">
            <Link to="/forgot-password">Request New Link</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md bg-card border border-border shadow-2xl rounded-[2.5rem] p-8 md:p-10"
      >
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 text-primary mb-4">
            <KeyRound size={32} />
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight">Set New Password</h1>
          <p className="text-muted-foreground mt-2">
            Please enter your new password below.
          </p>
        </div>

        <AnimatePresence mode="wait">
          {message?.type === "success" ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center space-y-6"
            >
              <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-2xl flex flex-col items-center gap-3">
                <CheckCircle2 className="w-8 h-8 text-green-500" />
                <p className="text-green-600 font-medium">{message.text}</p>
                <p className="text-sm text-green-600/80">Redirecting to login...</p>
              </div>
            </motion.div>
          ) : (
            <motion.form
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onSubmit={handleSubmit}
              className="space-y-5"
            >
              {message?.type === "error" && (
                <div className="p-3 bg-destructive/10 border border-destructive/20 text-destructive text-sm font-medium rounded-xl flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  {message.text}
                </div>
              )}

              <div className="space-y-2">
                <label className="text-sm font-semibold text-muted-foreground">New Password</label>
                <Input
                  type="password"
                  placeholder="Enter new password"
                  required
                  value={passwords.new}
                  onChange={(e) => setPasswords({...passwords, new: e.target.value})}
                  className="h-12"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-muted-foreground">Confirm New Password</label>
                <Input
                  type="password"
                  placeholder="Confirm new password"
                  required
                  value={passwords.confirm}
                  onChange={(e) => setPasswords({...passwords, confirm: e.target.value})}
                  className="h-12"
                />
              </div>

              <Button type="submit" disabled={isLoading || !passwords.new || !passwords.confirm} className="w-full h-12 rounded-xl text-lg font-bold mt-2">
                {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Reset Password"}
              </Button>
            </motion.form>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
};

export default ResetPasswordPage;