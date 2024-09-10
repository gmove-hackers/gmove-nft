import { OurTeamSection } from "@/pages/Mint/components/OurTeamSection";
import { Socials } from "@/pages/Mint/components/Socials";

import { Header } from "@/components/Header";
import { HeroSection } from "./components/HeroSection";

export function Mint() {
  return (
    <>
      <Header />
      <div style={{ overflow: "hidden" }} className="overflow-hidden">
        <main className="flex flex-col gap-8">
          <HeroSection />
          <OurTeamSection />
        </main>

        <footer className="footer-container px-4 pb-6 w-full max-w-screen-xl mx-auto mt-6 md:mt-16 flex items-center justify-between">
          <div></div>
          <Socials />
        </footer>
      </div>
    </>
  );
}
