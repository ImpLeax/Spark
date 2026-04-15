import {React , useState} from "react";
import { Link , useLocation} from "react-router-dom";
import {Button} from "@/components/ui/button"
import { Menu,ArrowLeftToLineIcon } from "lucide-react";
import {motion} from "framer-motion";



const Navbar = ({ onMenuClick, state, onLoginClick,render}) => {

  return (
    <nav className="top-0 z-49 bg-primary-foreground dark:bg-background border">
      <div className="max-w-7xl mx-auto px-5 py-3 flex justify-between items-center">
          <div className="flex items-center gap-4">
          {!render && (
            <div>
              <Button variant="ghost" className="" onClick={() => onMenuClick(prev => !prev)}>
                  {state ? (
                      <ArrowLeftToLineIcon className="h-6 w-6" />
                    ) : (
                      <Menu className="h-6 w-6" />
                    )}
              </Button>
            </div>
          )}
            <motion.div initial={false}>
              <Link
                to="/"
                onClick={() => {
                    onLoginClick();
                }}
              >
                <h1 className="leading-none flex items-center">
                  <span className="text-4xl text-transparent font-bold bg-linear-to-bl dark:from-red-600 dark:to-chart-1 from-pink-400 to-gray-200 bg-clip-text translate-z-0 [backface-visibility:hidden]">
                    Spark
                  </span>
                </h1>
              </Link>
              </motion.div>
          </div>

          {render &&(
          <div className="leading-none flex text-lg gap-8 items-center">
            <a
              href="#offers"
              onClick={(e) => {
              e.preventDefault();
              document.getElementById('offers')?.scrollIntoView({ behavior: 'smooth' });
              }}
              className="cursor-pointer hover:text-primary transition-colors"
            >What we offer</a>
            <a href="#about"
              onClick={(e) =>{
                e.preventDefault();
                document.getElementById('about')?.scrollIntoView({behavior: 'smooth'});
              }}
              className="cursor-pointer hover:text-primary transition-colors"
            >About</a>
          </div>
          )}

          {render && (
            <div>
              <div className="flex gap-4 leading-none">
                <Link to="/signup"
                      className="cursor-pointer hover:text-primary transition-colors">
                  <Button variant="ghost">Sign up</Button>
                </Link>
                <Button onClick={() => onLoginClick(prev => !prev)}>Login</Button>
              </div>
            </div>
            
          )}
      </div>
    </nav>
  );
};

export default Navbar;