import "./globals.css";

export const metadata = {
  title: "RL Inventory Control Tower — DRL Supply Chain Dashboard",
  description:
    "A production-grade web dashboard showcasing 7 evolutionary phases of a Deep Reinforcement Learning inventory management system. Built with FastAPI, Next.js, Tailwind CSS, and Recharts.",
  keywords: [
    "Reinforcement Learning",
    "Inventory Management",
    "Supply Chain",
    "Deep RL",
    "OpenAI Gym",
    "Stable Baselines",
    "Dashboard",
  ],
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
