import React from "react";
import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { BubbleBackground } from '@/components/index';
import { motion } from "framer-motion";
import { MailCheck, ArrowLeft, ShieldCheck } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useTheme } from "next-themes";


export function RegistrationSuccess() {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const location = useLocation();

  const userEmail = location.state?.email;

  const darkColors = {
    first: '210, 20, 45', second: '250, 210, 50', third: '140, 100, 255',
    fourth: '30, 30, 30', fifth: '200, 50, 50', sixth: '100, 100, 255',
  };

  const lightColors = {
    first: '255, 180, 190', second: '255, 240, 180', third: '220, 200, 255',
    fourth: '240, 240, 255', fifth: '255, 210, 210', sixth: '255, 183, 197',
  };

  const colors = theme === 'dark' ? darkColors : lightColors;

  return (
    <div className="bg-background text-foreground overflow-x-hidden relative min-h-screen flex items-center justify-center p-4">
      <div className="absolute inset-0 z-0">
        <BubbleBackground interactive={true} colors={colors} />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="relative z-10 w-full max-w-lg mx-auto"
      >
        <div className="flex flex-col items-center p-8 sm:p-12 shadow-2xl rounded-[2.5rem] bg-card/95 backdrop-blur-sm border border-border text-center">

          <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mb-6 relative">
            <MailCheck className="w-10 h-10 text-primary" />
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.4, type: "spring" }}
              className="absolute -bottom-2 -right-2 bg-background rounded-full p-1 shadow-sm"
            >
              <ShieldCheck className="w-6 h-6 text-green-500" />
            </motion.div>
          </div>

          <h1 className="text-3xl font-bold tracking-tight text-foreground mb-4">
            {t('success_page.title')}
          </h1>

          <div className="text-muted-foreground text-base leading-relaxed mb-8 space-y-4">
            <p>{t('success_page.description')}</p>
            {userEmail && (
              <p className="font-medium text-foreground px-4 py-2 bg-secondary/50 rounded-xl border border-border/50 inline-block">
                {userEmail}
              </p>
            )}
            <p className="text-sm">{t('success_page.spam_notice')}</p>
          </div>

          <div className="w-full space-y-4">

            <Button asChild className="w-full h-14 text-lg rounded-xl">
              <Link to="/">
                <ArrowLeft className="w-5 h-5 mr-2" />
                {t('success_page.back_to_home')}
              </Link>
            </Button>
          </div>

        </div>
      </motion.div>
    </div>
  );
}

export default RegistrationSuccess;