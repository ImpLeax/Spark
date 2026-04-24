import { AlertTriangle } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export const GlobalErrorFallback = () => {
  const { t } = useTranslation();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4 text-center">
      <AlertTriangle className="w-16 h-16 text-destructive mb-4" />
      <h2 className="text-2xl font-bold mb-2">{t('global_error.title')}</h2>
      <p className="text-muted-foreground mb-6">{t('global_error.description')}</p>
      <button
        onClick={() => window.location.href = '/'}
        className="px-6 py-3 bg-primary text-white rounded-xl font-medium"
      >
        {t('global_error.button')}
      </button>
    </div>
  );
};