import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X } from "lucide-react";
import { ThemeToggle } from "@/components/ui/ThemeToggle";

const Navbar = ({ onLoginClick }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  const location = useLocation();

  const isLandingPage = location.pathname === "/";
  const isTeamPage = location.pathname === "/team";

  useEffect(() => {
    setIsVisible(true);
    setIsOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    const controlNavbar = () => {
      if (typeof window !== "undefined") {
        if (Math.abs(window.scrollY - lastScrollY) < 15) return;

        if (window.scrollY > lastScrollY && window.scrollY > 80) {
          setIsVisible(false);
          setIsOpen(false);
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
              <span className="text-3xl md:text-4xl text-transparent font-bold bg-linear-to-bl dark:from-red-600 dark:to-chart-1 from-pink-400 to-gray-400 bg-clip-text">
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
            What we offer
          </a>
          <a
            href="#about"
            onClick={(e) => {
              e.preventDefault();
              scrollTo("about");
            }}
            className="cursor-pointer hover:text-primary transition-colors"
          >
            About
          </a>
        </div>
        )}

        <div className="hidden md:flex gap-4 leading-none items-center">
          <div className="mr-2 border-r pr-4">
            <ThemeToggle isCollapsed={true} />
          </div>

          <Link to="/signup">
            <Button variant="ghost">Sign up</Button>
          </Link>
          {isTeamPage
            ? (<Link to="/"><Button>Login</Button></Link>)
            : (<Button onClick={handleLoginClick}>Login</Button>)
          }
        </div>

        <div className="md:hidden flex items-center">
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="text-foreground p-2 focus:outline-none"
          >
            {isOpen ? <X size={28} /> : <Menu size={28} />}
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
                What we offer
              </a>
              <a
                href="#about"
                onClick={(e) => {
                  e.preventDefault();
                  scrollTo("about");
                }}
                className="text-xl font-medium cursor-pointer hover:text-primary transition-colors"
              >
                About
              </a>

              <div className="mt-2">
                 <ThemeToggle isCollapsed={false} />
              </div>

              <div className="flex flex-col gap-3 mt-4 pt-6 border-t border-border">
                <Link to="/signup" className="w-full">
                  <Button variant="outline" className="w-full text-lg py-6" onClick={() => setIsOpen(false)}>
                    Sign up
                  </Button>
                </Link>
                <Button onClick={handleLoginClick} className="w-full text-lg py-6">
                  Login
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