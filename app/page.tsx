import Footer from "@/components/layout/Footer";
import Header from "@/components/layout/Header";
import FAQ from "@/components/sections/FAQ";
import Features from "@/components/sections/Features";
import Hero from "@/components/sections/Hero";
import Pricing from "@/components/sections/Pricing";
import Image from "next/image";

export default function Home() {
  return (
    <div className="min-h-screen bg-dark-900">
      <Header />

      <main>
        <Hero />
        <Features />
        <Pricing />
        <FAQ />
      </main>

      <Footer />
    </div>
  );
}
