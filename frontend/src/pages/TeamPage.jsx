import React from "react";
import { motion } from "framer-motion";
import { Code2, Server, Cpu, ArrowLeft } from "lucide-react";

const teamMembers = [
  {
    name: "Volodymyr Bondarchuk",
    role: "Full-stack web developer, Auth & Profiles Systems",
    image: "/images/co-owner_Volodymyr.jpg",
    bio: "A specialist in secure infrastructure and user identity. Volodymyr architected the core authentication systems and dynamic profile management of Spark. With a focus on data integrity and seamless onboarding, he ensures that every user's journey starts with a secure, robust, and lightning-fast experience.",
    icon: Server,
    color: "text-blue-500",
    bg: "bg-blue-500/10"
  },
  {
    name: "Maxim Naiduik",
    role: "Full-stack web developer, Recommendation System",
    image: "/images/co-owner_Maxim.jpg",
    bio: "The algorithmic mastermind behind Spark's matching logic. Maxim specializes in developing complex recommendation engines that process user preferences into meaningful connections. By bridging the gap between data science and full-stack execution, he ensures our users find high-compatibility matches with pinpoint accuracy.",
    icon: Code2,
    color: "text-pink-500",
    bg: "bg-pink-500/10"
  },
  {
    name: "Nazar Kholonivets",
    role: "Full-stack web developer, Chats & Real-time Systems",
    image: "/images/co-owner_Nazar.jpg",
    bio: "The expert in low-latency communication and real-time interactivity. Nazar engineered the high-concurrency chat architecture and instant notification systems using advanced WebSocket technology. His work ensures that every interaction on the platform happens in real-time, making digital connections feel instant and alive.",
    icon: Cpu,
    color: "text-purple-500",
    bg: "bg-purple-500/10"
  }
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.2 }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: "easeOut" }
  }
};

const TeamPage = () => {
  return (
    <div className="min-h-screen bg-background text-foreground py-20 px-6 relative overflow-hidden">
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-[120px] -z-10 pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-500/20 rounded-full blur-[120px] -z-10 pointer-events-none" />

      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-20"
        >
          <h1 className="text-5xl md:text-7xl font-black mb-6 tracking-tight">
            Meet the <span className="text-transparent bg-clip-text bg-linear-to-r from-primary to-purple-500">Minds</span> Behind Spark
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            We are a trio of passionate engineers obsessed with clean code, scalable architecture, and building products that bring people together.
          </p>
        </motion.div>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-1 lg:grid-cols-3 gap-8"
        >
          {teamMembers.map((member, index) => (
            <motion.div
              key={index}
              variants={itemVariants}
              className="bg-card border border-border rounded-[2.5rem] p-8 flex flex-col items-center text-center hover:border-primary/50 transition-colors shadow-lg group relative overflow-hidden"
            >
              <div className={`absolute top-0 left-0 w-full h-1 ${member.bg} transition-transform origin-left scale-x-0 group-hover:scale-x-100 duration-500`} />

              <div className="relative w-48 h-48 mb-8">
                <div className="absolute inset-0 bg-gradient-to-tr from-primary to-purple-500 rounded-full blur-xl opacity-0 group-hover:opacity-40 transition-opacity duration-500" />
                <img
                  src={member.image}
                  alt={member.name}
                  className="w-full h-full object-cover rounded-full border-4 border-background relative z-10 shadow-xl"
                />
                <div className={`absolute -bottom-4 -right-4 w-14 h-14 rounded-full bg-card border-4 border-background flex items-center justify-center z-20 shadow-md ${member.color}`}>
                  <member.icon size={24} />
                </div>
              </div>

              <h3 className="text-2xl font-bold mb-2">{member.name}</h3>
              <div className={`text-sm font-bold uppercase tracking-wider mb-6 px-4 py-1.5 rounded-full ${member.bg} ${member.color}`}>
                {member.role}
              </div>

              <p className="text-muted-foreground leading-relaxed mb-8 flex-1">
                {member.bio}
              </p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </div>
  );
};

export default TeamPage;