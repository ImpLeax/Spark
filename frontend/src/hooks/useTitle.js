import { useEffect } from "react";
import { useTranslation } from "react-i18next";

export function useTitle(key) {
  const { t, i18n } = useTranslation();

  useEffect(() => {
    document.title = "Spark";
    if (key !== undefined) document.title = `Spark - ${t(key)}`;
  }, [key, t, i18n.language]);
}