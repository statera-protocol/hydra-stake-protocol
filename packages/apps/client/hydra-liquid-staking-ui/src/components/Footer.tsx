import { Github, Twitter, Mail } from "lucide-react";

const socialLinks = [
  {
    icon: Github,
    href: "https://github.com/TechMartins72/liquid-staking-protocol",
    label: "Github",
  },
  { icon: Twitter, href: "https://x.com/hydrastake", label: "Discord" },
  { icon: Mail, href: "mailto:hydrastake@gmail.com", label: "Email" },
];

const Footer = () => {
  return (
    <footer className="bg-black border-t border-border/50 mt-12">
      <div className="flex flex-col justify-center items-center gap-2 max-w-7xl mx-auto px-4 py-8 md:px-8">
        <div className="flex justify-center items-center flex-col gap-2 mb-8">
          <div className="flex justify-center items-center gap-3">
            <p>Powered by: </p>
            <div>
              <img
                src="/lucentlabs logo.png"
                alt="lucentlabs Logo"
                width={24}
                height={24}
              />
            </div>
            <h3 className="text-xl md:text-2xl font-semibold text-white mb-4">
              Lucent Labs
            </h3>
          </div>
          <div className="flex gap-4">
            {socialLinks.map((link, idx) => (
              <a
                key={idx}
                href={link.href}
                className="p-2 rounded-lg hover:bg-card transition-all"
              >
                <link.icon className="w-5 h-5 text-muted-foreground hover:text-accent transition-all" />
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
};
export default Footer;
