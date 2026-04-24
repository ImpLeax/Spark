import React, { useState } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Mail, ArrowLeft, Loader2, CheckCircle2, AlertTriangle } from "lucide-react";
import api from "@/services/axios";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useTranslation } from "react-i18next";

const getErrorMessage = (error, defaultMessageKey) => {
  const data = error.response?.data;
  if (data) {
    const firstKey = Object.keys(data)[0];
    if (firstKey && Array.isArray(data[firstKey])) {
      return data[firstKey][0];
    } else if (firstKey && typeof data[firstKey] === "string") {
      return data[firstKey];
    }
  }
  return defaultMessageKey;
};

const ForgotPasswordPage = () => {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState(null);

  const { t } = useTranslation();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage(null);

    try {
      const response = await api.post("user/password/reset/", { email });
      setMessage({ type: "success", text: t(response.data.message) });
      setEmail("");
    } catch (error) {
      const errorKey = getErrorMessage(error, 'forgot_password.error_fallback');
      setMessage({
        type: "error",
        text: t(errorKey)
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md bg-card border border-border shadow-2xl rounded-[2.5rem] p-8 md:p-10"
      >
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 text-primary mb-4">
            <Mail size={32} />
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight">{t('forgot_password.title')}</h1>
          <p className="text-muted-foreground mt-2">
            {t('forgot_password.description')}
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
              </div>
              <Button asChild variant="outline" className="w-full h-12 rounded-xl">
                <Link to="/">{t('forgot_password.button_return_login')}</Link>
              </Button>
            </motion.div>
          ) : (
            <motion.form
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onSubmit={handleSubmit}
              className="space-y-6"
            >
              {message?.type === "error" && (
                <div className="p-3 bg-destructive/10 border border-destructive/20 text-destructive text-sm font-medium rounded-xl flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  {message.text}
                </div>
              )}

              <div className="space-y-2">
                <label className="text-sm font-semibold text-muted-foreground">{t('forgot_password.email_label')}</label>
                <Input
                  type="email"
                  placeholder={t('forgot_password.email_placeholder')}
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-12"
                />
              </div>

              <Button type="submit" disabled={isLoading || !email} className="w-full h-12 rounded-xl text-lg font-bold">
                {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : t('forgot_password.button_send')}
              </Button>

              <div className="text-center pt-2">
                <Link to="/" className="inline-flex items-center text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
                  <ArrowLeft className="w-4 h-4 mr-2" /> {t('forgot_password.back_to_login')}
                </Link>
              </div>
            </motion.form>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
};

export default ForgotPasswordPage;