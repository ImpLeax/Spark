import React from 'react';
import { Link } from 'react-router-dom';
import { Ghost } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const NotFoundPage = () => {
  const { t } = useTranslation();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background text-center px-4">
      <Ghost className="w-24 h-24 text-muted-foreground mb-6 animate-bounce" />
      <h1 className="text-6xl font-black text-foreground mb-4">404</h1>
      <h2 className="text-2xl font-bold text-muted-foreground mb-8">
        {t('not_found.title')}
      </h2>
      <p className="text-muted-foreground mb-8 max-w-md">
        {t('not_found.description')}
      </p>
      <Link
        to="/"
        className="px-8 py-4 bg-primary text-primary-foreground rounded-2xl font-bold hover:bg-primary/90 transition-all"
      >
        {t('not_found.button')}
      </Link>
    </div>
  );
};

export default NotFoundPage;