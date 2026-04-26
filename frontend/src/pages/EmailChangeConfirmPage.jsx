import React, { useEffect, useState, useRef } from "react";
import { useSearchParams, Link } from "react-router-dom";
import api from "@/services/axios";
import { Loader2, CheckCircle2, XCircle, MailCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTranslation } from "react-i18next";
import {useTitle} from "@/hooks/useTitle.js";

const EmailChangeConfirmPage = () => {
  useTitle("confirm_email_change");
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");

  const { t } = useTranslation();

  const [status, setStatus] = useState("loading");
  const [message, setMessage] = useState(t('email_confirm_page.initial_message'));

  const hasFetched = useRef(false);

  useEffect(() => {
    if (hasFetched.current) return;
    hasFetched.current = true;

    const confirmEmail = async () => {
      try {
        await api.post("user/email/change/confirm/", { token });

        setStatus("success");
        setMessage(t('email_confirm_page.success_message'));
      } catch (error) {
        setStatus("error");
        setMessage(t('email_confirm_page.error_message'));
      }
    };

    if (token) {
      confirmEmail();
    } else {
      setStatus("error");
      setMessage(t('email_confirm_page.invalid_request'));
    }
  }, [token, t]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] px-4">
      <div className="bg-card border border-border shadow-2xl rounded-[2.5rem] p-8 md:p-12 w-full max-w-md text-center animate-in fade-in zoom-in-95 duration-500">

        <div className="flex justify-center mb-6">
          {status === "loading" && (
            <div className="p-4 bg-primary/10 rounded-full text-primary animate-pulse relative">
              <MailCheck className="w-12 h-12 absolute opacity-50" />
              <Loader2 className="w-12 h-12 animate-spin relative z-10" />
            </div>
          )}
          {status === "success" && (
            <div className="p-4 bg-green-500/10 rounded-full text-green-500">
              <CheckCircle2 className="w-12 h-12" />
            </div>
          )}
          {status === "error" && (
            <div className="p-4 bg-destructive/10 rounded-full text-destructive">
              <XCircle className="w-12 h-12" />
            </div>
          )}
        </div>

        <h1 className="text-2xl md:text-3xl font-bold mb-3">
          {status === "loading" && t('email_confirm_page.title_loading')}
          {status === "success" && t('email_confirm_page.title_success')}
          {status === "error" && t('email_confirm_page.title_error')}
        </h1>

        <p className="text-muted-foreground text-lg mb-8">
          {message}
        </p>

        {status === "loading" ? (
          <p className="text-sm text-muted-foreground/60 animate-pulse">
            {t('email_confirm_page.wait_message')}
          </p>
        ) : (
          <Button asChild className="w-full h-12 text-lg rounded-xl shadow-lg">
            <Link to={status === "success" ? "/settings" : "/"}>
              {status === "success" ? t('email_confirm_page.button_settings') : t('email_confirm_page.button_home')}
            </Link>
          </Button>
        )}

      </div>
    </div>
  );
};

export default EmailChangeConfirmPage;