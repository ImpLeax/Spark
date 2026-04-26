import React from "react";
import { BubbleBackground, LoginForm } from '@/components/index';
import { motion } from "framer-motion";
import { useTheme } from "next-themes";
import { Sparkles, Heart, MessageCircle, Shield, Users, TrendingUp } from "lucide-react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useTitle } from "@/hooks/useTitle.js"

function LandingPage() {
    useTitle();
    const { theme } = useTheme();
    const { t } = useTranslation();

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

            <div className="w-full min-h-[calc(100vh-66px)] relative flex items-center justify-center py-28 lg:py-0">
                <div className="absolute inset-0 z-0">
                    <BubbleBackground interactive={true} colors={colors} />
                </div>

                <div className="relative z-40 max-w-7xl mx-auto px-4 sm:px-6 flex flex-col lg:flex-row items-center justify-between w-full gap-12 h-full">
                    <motion.div
                        initial={{ opacity: 0, x: -100 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.8 }}
                        className="w-full text-center lg:text-left text-4xl sm:text-5xl md:text-6xl lg:text-7xl xl:text-8xl font-extrabold leading-tight tracking-tight break-words text-foreground lg:text-white drop-shadow-md lg:drop-shadow-2xl uppercase"
                    >
                        {t('landing.hero.title')}
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, y: 50 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, delay: 0.2 }}
                        className="w-full lg:w-1/2 flex justify-center lg:justify-end"
                    >
                        <LoginForm />
                    </motion.div>
                </div>
            </div>

            <div className="py-20 border-y border-border bg-card/50 relative z-10">
                <div className="max-w-7xl mx-auto px-6">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
                        {[
                            { val: "10K+", lab: t('landing.stats.active_users'), color: "text-primary" },
                            { val: "5K+", lab: t('landing.stats.matches'), color: "text-chart-1" },
                            { val: "95%", lab: t('landing.stats.couples'), color: "text-chart-2" },
                            { val: "24/7", lab: t('landing.stats.support'), color: "text-chart-3" }
                        ].map((stat, i) => (
                            <motion.div key={i} initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}>
                                <div className={`text-3xl md:text-4xl font-black ${stat.color} mb-2`}>{stat.val}</div>
                                <div className="text-sm md:text-base text-muted-foreground font-medium">{stat.lab}</div>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </div>

            <section id="offers" className="py-24 max-w-7xl mx-auto px-6">
                <div className="text-center mb-16">
                    <h2 className="text-4xl md:text-5xl font-bold mb-4">{t('landing.why_choose.title')}</h2>
                    <p className="text-lg md:text-xl text-muted-foreground">{t('landing.why_choose.subtitle')}</p>
                </div>

                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {[
                        { icon: Heart, title: t('landing.why_choose.f1.title'), desc: t('landing.why_choose.f1.desc'), color: "text-red-500" },
                        { icon: Shield, title: t('landing.why_choose.f2.title'), desc: t('landing.why_choose.f2.desc'), color: "text-blue-500" },
                        { icon: MessageCircle, title: t('landing.why_choose.f3.title'), desc: t('landing.why_choose.f3.desc'), color: "text-green-500" },
                        { icon: Users, title: t('landing.why_choose.f4.title'), desc: t('landing.why_choose.f4.desc'), color: "text-orange-500" },
                        { icon: TrendingUp, title: t('landing.why_choose.f5.title'), desc: t('landing.why_choose.f5.desc'), color: "text-purple-500" },
                        { icon: Sparkles, title: t('landing.why_choose.f6.title'), desc: t('landing.why_choose.f6.desc'), color: "text-yellow-500" }
                    ].map((FeatureIcon, i) => (
                        <motion.div
                            key={i}
                            whileHover={{ y: -10 }}
                            className="p-8 rounded-3xl bg-card border border-border hover:border-primary/50 transition-all shadow-sm"
                        >
                            <FeatureIcon.icon className={`w-12 h-12 ${FeatureIcon.color} mb-4`} />
                            <h3 className="text-xl md:text-2xl font-bold mb-2">{FeatureIcon.title}</h3>
                            <p className="text-muted-foreground leading-relaxed">{FeatureIcon.desc}</p>
                        </motion.div>
                    ))}
                </div>
            </section>

            <section id="about" className="py-24 bg-card/30 border-y border-border">
                <div className="max-w-7xl mx-auto px-6">
                    <h2 className="text-4xl font-bold text-center mb-16">{t('landing.how_it_works.title')}</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                        {[
                            { step: "01", t: t('landing.how_it_works.s1.title'), d: t('landing.how_it_works.s1.desc'), img: "/images/signup.avif" },
                            { step: "02", t: t('landing.how_it_works.s2.title'), d: t('landing.how_it_works.s2.desc'), img: "/images/profile.jpg" },
                            { step: "03", t: t('landing.how_it_works.s3.title'), d: t('landing.how_it_works.s3.desc'), img: "/images/recommendations.jpg" },
                            { step: "04", t: t('landing.how_it_works.s4.title'), d: t('landing.how_it_works.s4.desc'), img: "/images/chats.jpg" }
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

            <footer className="py-16 border-t border-border">
                <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-12">
                    <div>
                        <div className="flex items-center gap-2 mb-6">
                            <Sparkles className="w-6 h-6 text-primary" />
                            <span className="text-2xl font-bold">Spark</span>
                        </div>
                        <p className="text-muted-foreground text-sm leading-loose">
                            {t('landing.footer.desc')}
                        </p>
                    </div>
                    <div>
                        <h4 className="font-bold mb-4">{t('landing.footer.company.title')}</h4>
                        <ul className="space-y-2 text-sm text-muted-foreground">
                            <li><button className="hover:text-primary transition-colors">{t('landing.footer.company.about')}</button></li>
                            <li><Link to="/team" className="hover:text-primary transition-colors">{t('landing.footer.company.team')}</Link></li>
                            <li><button className="hover:text-primary transition-colors">{t('landing.footer.company.careers')}</button></li>
                        </ul>
                    </div>
                    <div>
                        <h4 className="font-bold mb-4">{t('landing.footer.support.title')}</h4>
                        <ul className="space-y-2 text-sm text-muted-foreground">
                            <li><button className="hover:text-primary transition-colors">{t('landing.footer.support.help')}</button></li>
                            <li><button className="hover:text-primary transition-colors">{t('landing.footer.support.safety')}</button></li>
                            <li><button className="hover:text-primary transition-colors">{t('landing.footer.support.contact')}</button></li>
                        </ul>
                    </div>
                    <div>
                        <h4 className="font-bold mb-4">{t('landing.footer.legal.title')}</h4>
                        <ul className="space-y-2 text-sm text-muted-foreground">
                            <li><button className="hover:text-primary transition-colors">{t('landing.footer.legal.terms')}</button></li>
                            <li><button className="hover:text-primary transition-colors">{t('landing.footer.legal.privacy')}</button></li>
                            <li><button className="hover:text-primary transition-colors">{t('landing.footer.legal.cookie')}</button></li>
                        </ul>
                    </div>
                </div>
                <div className="text-center mt-16 text-sm text-muted-foreground">
                    {t('landing.footer.copyright')}
                </div>
            </footer>
        </div>
    );
}

export default LandingPage;