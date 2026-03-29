import React from "react";
import { BubbleBackground } from '@/components/index';
import { motion } from "framer-motion";
import { useTheme } from "next-themes";
import { Link } from "react-router-dom";
import { Sparkles, Heart, MessageCircle, Shield, Users, TrendingUp } from "lucide-react";
import { LoginForm } from '@/components/login-form';

// Приймаємо state (для анімації видимості) та onClose (для закриття по кліку на фон)
function MainUnregistered({ state, onClose }) {
    const { theme } = useTheme();

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
        <div className="bg-background text-foreground overflow-x-hidden relative">
            
            {/* --- МОДАЛЬНЕ ВІКНО ЛОГІНА --- */}
            <motion.div 
                initial={false} 
                animate={{ 
                    opacity: state ? 1 : 0,
                    pointerEvents: state ? "auto" : "none" 
                }} 
                transition={{ duration: 0.3 }}
                onClick={onClose} // Закриваємо вікно при кліку на темний фон
                className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
            >
                <motion.div 
                    animate={{ scale: state ? 1 : 0.95 }}
                    onClick={(e) => e.stopPropagation()} 
                    // Використовуємо h-[600px] або min-h-[600px] + повертаємо bg-card
                    className="w-full max-w-md overflow-hidden p-6"
                >
                    <LoginForm />
                </motion.div>
            </motion.div>

            {/* --- HERO SECTION --- */}
            <div className="w-full h-[calc(100vh-66px)] relative">
                                <BubbleBackground interactive={true} colors={colors}>

                    <motion.div  initial={{opacity:0,x:-200,y:100}} animate={{opacity:1,x:50}} transition={{duration:0.8}}



                                className=" my-auto px-33 py-30 max-w-6xl text-8xl font-bold leading-tight z-48 relative text-white text-shadow-lg/20">



                                    DATING FOR EVERYONE EVERYWHERE ANYHOW



                    </motion.div>

                </BubbleBackground>
            </div>

            {/* --- STATS SECTION --- */}
            <div className="py-20 border-y border-border bg-card/50">
                <div className="max-w-7xl mx-auto px-6">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
                        {[
                            { val: "10K+", lab: "Active Users", color: "text-primary" },
                            { val: "5K+", lab: "Successful Matches", color: "text-chart-1" },
                            { val: "95%", lab: "Happy Couples", color: "text-chart-2" },
                            { val: "24/7", lab: "Live Support", color: "text-chart-3" }
                        ].map((stat, i) => (
                            <motion.div key={i} initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}>
                                <div className={`text-4xl font-black ${stat.color} mb-2`}>{stat.val}</div>
                                <div className="text-muted-foreground font-medium">{stat.lab}</div>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </div>
            
            {/* --- FEATURES SECTION --- */}
            <section id="offers" className="py-24 max-w-7xl mx-auto px-6">
                <div className="text-center mb-16">
                    <h2 className="text-4xl md:text-5xl font-bold mb-4">Why choose Spark?</h2>
                    <p className="text-xl text-muted-foreground">Innovation meets real connections.</p>
                </div>

                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {[
                        { icon: Heart, title: "Smart Matching", desc: "Our AI analyzes your interests to find the most compatible partners.", color: "text-red-500" },
                        { icon: Shield, title: "Secure & Private", desc: "Your data is encrypted. Chat only after a mutual match.", color: "text-blue-500" },
                        { icon: MessageCircle, title: "Real-time Chat", desc: "Instant notifications and smooth messaging experience.", color: "text-green-500" },
                        { icon: Users, title: "Shared Interests", desc: "Tag system helps you find people with the same hobbies.", color: "text-orange-500" },
                        { icon: TrendingUp, title: "Continuous Learning", desc: "The algorithm evolves based on your preferences.", color: "text-purple-500" },
                        { icon: Sparkles, title: "Match Magic", desc: "Get notified instantly when someone sparks with you.", color: "text-yellow-500" }
                    ].map((f, i) => (
                        <motion.div 
                            key={i}
                            whileHover={{ y: -10 }}
                            className="p-8 rounded-3xl bg-card border border-border hover:border-primary/50 transition-all shadow-sm"
                        >
                            <f.icon className={`w-12 h-12 ${f.color} mb-4`} />
                            <h3 className="text-2xl font-bold mb-2">{f.title}</h3>
                            <p className="text-muted-foreground leading-relaxed">{f.desc}</p>
                        </motion.div>
                    ))}
                </div>
            </section>

            {/* --- HOW IT WORKS --- */}
            <section id="about" className="py-24 bg-card/30 border-y border-border">
                <div className="max-w-7xl mx-auto px-6">
                    <h2 className="text-4xl font-bold text-center mb-16">How it works?</h2>
                    <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
                        {[
                            { step: "01", t: "Sign Up", d: "Create your account in minutes.", img: "https://images.unsplash.com/photo-1770894807442-108cc33c0a7a?w=400&q=80" },
                            { step: "02", t: "Profile", d: "Add photos and tell your story.", img: "https://images.unsplash.com/photo-1762522921456-cdfe882d36c3?w=400&q=80" },
                            { step: "03", t: "Explore", d: "Like profiles that catch your eye.", img: "https://images.unsplash.com/photo-1650911566261-5cb2db67c38a?w=400&q=80" },
                            { step: "04", t: "Chat", d: "Start talking after a match.", img: "https://images.unsplash.com/photo-1758525226150-ba35c1165a32?w=400&q=80" }
                        ].map((s, i) => (
                            <div key={i} className="group">
                                <div className="text-5xl font-black text-primary/10 mb-2 group-hover:text-primary/30 transition-colors">{s.step}</div>
                                <div className="rounded-2xl overflow-hidden border border-border mb-4 aspect-square">
                                    <img src={s.img} alt={s.t} className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-500" />
                                </div>
                                <h3 className="text-xl font-bold mb-1">{s.t}</h3>
                                <p className="text-muted-foreground text-sm">{s.d}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* --- FOOTER --- */}
            <footer className="py-16 border-t border-border">
                <div className="max-w-7xl mx-auto px-6 grid md:grid-cols-4 gap-12">
                    <div>
                        <div className="flex items-center gap-2 mb-6">
                            <Sparkles className="w-6 h-6 text-primary" />
                            <span className="text-2xl font-bold">Spark</span>
                        </div>
                        <p className="text-muted-foreground text-sm leading-loose">
                            Connecting hearts through technology. Find your spark anywhere, anytime.
                        </p>
                    </div>
                    <div>
                        <h4 className="font-bold mb-4">Company</h4>
                        <ul className="space-y-2 text-sm text-muted-foreground">
                            <li><button className="hover:text-primary transition-colors">About Us</button></li>
                            <li><button className="hover:text-primary transition-colors">Team</button></li>
                            <li><button className="hover:text-primary transition-colors">Careers</button></li>
                        </ul>
                    </div>
                    <div>
                        <h4 className="font-bold mb-4">Support</h4>
                        <ul className="space-y-2 text-sm text-muted-foreground">
                            <li><button className="hover:text-primary transition-colors">Help Center</button></li>
                            <li><button className="hover:text-primary transition-colors">Safety</button></li>
                            <li><button className="hover:text-primary transition-colors">Contact</button></li>
                        </ul>
                    </div>
                    <div>
                        <h4 className="font-bold mb-4">Legal</h4>
                        <ul className="space-y-2 text-sm text-muted-foreground">
                            <li><button className="hover:text-primary transition-colors">Terms of Use</button></li>
                            <li><button className="hover:text-primary transition-colors">Privacy Policy</button></li>
                            <li><button className="hover:text-primary transition-colors">Cookie Policy</button></li>
                        </ul>
                    </div>
                </div>
                <div className="text-center mt-16 text-sm text-muted-foreground">
                    © 2026 Spark. All rights reserved.
                </div>
            </footer>
        </div>
    );
}

export default MainUnregistered;