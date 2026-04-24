import { useState, useEffect, useRef } from "react";
import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X, Globe } from "lucide-react";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";

const Navbar = ({ onLoginClick }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);

  const [isLangMenuOpen, setIsLangMenuOpen] = useState(false);
  const langMenuRef = useRef(null);

  const location = useLocation();
  const { t, i18n } = useTranslation();

  const isLandingPage = location.pathname === "/";
  const isTeamPage = location.pathname === "/team";

  useEffect(() => {
    setIsVisible(true);
    setIsOpen(false);
    setIsLangMenuOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (langMenuRef.current && !langMenuRef.current.contains(event.target)) {
        setIsLangMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    const controlNavbar = () => {
      if (typeof window !== "undefined") {
        if (Math.abs(window.scrollY - lastScrollY) < 15) return;

        if (window.scrollY > lastScrollY && window.scrollY > 80) {
          setIsVisible(false);
          setIsOpen(false);
          setIsLangMenuOpen(false);
        } else {
          setIsVisible(true);
        }
        setLastScrollY(window.scrollY);
      }
    };

    window.addEventListener("scroll", controlNavbar);
    return () => window.removeEventListener("scroll", controlNavbar);
  }, [lastScrollY]);

  const scrollTo = (id) => {
    setIsOpen(false);
    setTimeout(() => {
      document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
    }, 150);
  };

  const handleLoginClick = () => {
    setIsOpen(false);
    setTimeout(() => {
      window.scrollTo({
        top: 0,
        behavior: "smooth",
      });
    }, 100);

    if (onLoginClick) {
      onLoginClick((prev) => !prev);
    }
  };

  const languages = [
    { code: 'en', label: 'English' },
    { code: 'uk', label: 'Українська' },
    { code: 'ga', label: 'Галицька' },
    { code: 'de', label: 'Deutsch' },
    { code: 'fr', label: 'Français' },
    { code: 'es', label: 'Español' },
    { code: 'ja', label: '日本語' }
  ];

  const changeLang = (code) => {
    i18n.changeLanguage(code);
    setIsLangMenuOpen(false);
  };

  const DesktopLangSwitcher = () => (
    <div className="relative flex items-center" ref={langMenuRef}>
      <button
        onClick={() => setIsLangMenuOpen(!isLangMenuOpen)}
        className="flex items-center gap-1.5 p-2 rounded-lg hover:bg-muted transition-colors text-foreground font-medium"
      >
        <Globe size={18} className="text-muted-foreground" />
        <span className="uppercase text-sm font-bold">
          {i18n.language?.substring(0, 2) || 'en'}
        </span>
      </button>

      <AnimatePresence>
        {isLangMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute top-full right-0 mt-2 w-40 bg-card border border-border rounded-xl shadow-xl overflow-hidden z-50 py-1"
          >
            {languages.map((lang) => {
              const isActive = i18n.language?.startsWith(lang.code);
              return (
                <button
                  key={lang.code}
                  onClick={() => changeLang(lang.code)}
                  className={cn(
                    "w-full text-left px-4 py-2.5 text-sm transition-colors flex items-center justify-between",
                    isActive
                      ? "text-primary font-bold bg-primary/5"
                      : "text-foreground hover:bg-muted"
                  )}
                >
                  {lang.label}
                  {isActive && <span className="w-1.5 h-1.5 rounded-full bg-primary"></span>}
                </button>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );

  return (
    <motion.nav
      initial={{ y: 0 }}
      animate={{ y: isVisible ? 0 : "-100%" }}
      transition={{ duration: 0.3, ease: "easeInOut" }}
      className="fixed w-full top-0 z-50 bg-primary-foreground dark:bg-background border-b shadow-sm"
    >
      <div className="max-w-7xl mx-auto px-5 py-3 flex justify-between items-center">

        <div className="flex items-center gap-4">
          <Link to="/">
            <h1 className="leading-none flex items-center">
              <span className="text-3xl md:text-4xl text-transparent font-bold bg-gradient-to-bl dark:from-red-600 dark:to-chart-1 from-pink-400 to-gray-400 bg-clip-text">
                Spark
              </span>
            </h1>
          </Link>
        </div>

        {!isTeamPage && (
          <div className="hidden md:flex leading-none text-lg gap-8 items-center font-medium">
            <a
              href="#offers"
              onClick={(e) => {
                e.preventDefault();
                scrollTo("offers");
              }}
              className="cursor-pointer hover:text-primary transition-colors"
            >
              {t('navbar.offers', 'What we offer')}
            </a>
            <a
              href="#about"
              onClick={(e) => {
                e.preventDefault();
                scrollTo("about");
              }}
              className="cursor-pointer hover:text-primary transition-colors"
            >
              {t('navbar.about', 'About')}
            </a>
          </div>
        )}

        <div className="hidden md:flex gap-2 leading-none items-center">

          <DesktopLangSwitcher />

          <div className="mx-1 border-r border-border pr-3 h-6 flex items-center">
            <ThemeToggle isCollapsed={true} />
          </div>

          <Link to="/signup" className="ml-1">
            <Button variant="ghost">{t('navbar.signup', 'Sign up')}</Button>
          </Link>
          {isTeamPage
            ? (<Link to="/"><Button>{t('navbar.login', 'Login')}</Button></Link>)
            : (<Button onClick={handleLoginClick}>{t('navbar.login', 'Login')}</Button>)
          }
        </div>

        <div className="md:hidden flex items-center gap-2">
          <div className="flex items-center">
             <ThemeToggle isCollapsed={true} />
          </div>
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="text-foreground p-2 focus:outline-none ml-1 rounded-md hover:bg-muted"
          >
            {isOpen ? <X size={26} /> : <Menu size={26} />}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {isOpen && isLandingPage && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden border-t overflow-hidden bg-primary-foreground dark:bg-background"
          >
            <div className="flex flex-col px-5 py-6 gap-6 shadow-inner">
              <a
                href="#offers"
                onClick={(e) => {
                  e.preventDefault();
                  scrollTo("offers");
                }}
                className="text-xl font-medium cursor-pointer hover:text-primary transition-colors"
              >
                {t('navbar.offers', 'What we offer')}
              </a>
              <a
                href="#about"
                onClick={(e) => {
                  e.preventDefault();
                  scrollTo("about");
                }}
                className="text-xl font-medium cursor-pointer hover:text-primary transition-colors"
              >
                {t('navbar.about', 'About')}
              </a>

              <div className="flex flex-col gap-3 mt-2">
                <span className="text-sm text-muted-foreground font-semibold uppercase tracking-wider">
                  {t('navbar.language', 'Language')}
                </span>
                <div className="flex gap-2 p-1 bg-muted/50 rounded-xl border border-border/50">
                  {languages.map((lang) => {
                    const isActive = i18n.language?.startsWith(lang.code);
                    return (
                      <button
                        key={lang.code}
                        onClick={() => changeLang(lang.code)}
                        className={cn(
                          "flex-1 py-2.5 rounded-lg text-sm font-medium transition-all",
                          isActive
                            ? "bg-background shadow-sm text-primary"
                            : "text-muted-foreground hover:text-foreground"
                        )}
                      >
                        {lang.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="flex flex-col gap-3 mt-4 pt-6 border-t border-border">
                <Link to="/signup" className="w-full">
                  <Button variant="outline" className="w-full text-lg py-6" onClick={() => setIsOpen(false)}>
                    {t('navbar.signup', 'Sign up')}
                  </Button>
                </Link>
                <Button onClick={handleLoginClick} className="w-full text-lg py-6">
                  {t('navbar.login', 'Login')}
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.nav>
  );
};

export default Navbar;