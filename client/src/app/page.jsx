"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  MessageCircle,
  Users,
  Shield,
  Zap,
  Video,
  Lock,
  Quote,
  HelpCircle,
} from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

export default function LandingPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  const testimonials = [
    {
      name: "Sarah Johnson",
      role: "Product Manager, NovaTech",
      image: "https://randomuser.me/api/portraits/women/68.jpg",
      text: "ChatFlow has completely transformed the way our team collaborates. The clean design and real-time updates make communication effortless!",
    },
    {
      name: "Michael Carter",
      role: "Founder, Pixelverse",
      image: "https://randomuser.me/api/portraits/men/32.jpg",
      text: "Absolutely love the experience! The interface feels modern and responsive — it’s like Slack but sleeker. Highly recommended for startups.",
    },
    {
      name: "Emily Davis",
      role: "UX Designer, CloudEdge",
      image: "https://randomuser.me/api/portraits/women/44.jpg",
      text: "A perfect balance of simplicity and power. I can seamlessly manage my client communications without switching tools all the time!",
    },
  ];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100">
        <div className="animate-pulse text-slate-600">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <nav className="sticky top-0 z-50 bg-white/70 backdrop-blur-md border-b border-slate-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo + Brand */}
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 shadow-md">
                <MessageCircle className="h-6 w-6 text-white" />
              </div>
              <span className="text-2xl font-extrabold bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent tracking-tight">
                ChatVerse
              </span>
            </div>

            {/* Nav Links */}
            <div className="hidden md:flex items-center gap-6">
              <Link
                href="/"
                className="text-slate-700 hover:text-blue-600 font-medium transition-colors duration-300"
              >
                Home
              </Link>
              <Link
                href="/features"
                className="text-slate-700 hover:text-blue-600 font-medium transition-colors duration-300"
              >
                Features
              </Link>
              <Link
                href="/about"
                className="text-slate-700 hover:text-blue-600 font-medium transition-colors duration-300"
              >
                About
              </Link>
            </div>

            {/* Auth Buttons */}
            <div className="flex items-center gap-3">
              <Link href={`${user ? "/chat" : "/login"}`}>
                {user ? (
                  <Button
                    variant="outline"
                    className="border-slate-300 hover:border-blue-500 hover:bg-blue-50 transition-all duration-300"
                  >
                    Chat
                  </Button>
                ) : (
                  <Button
                    variant="outline"
                    className="border-slate-300 hover:border-blue-500 hover:bg-blue-50 transition-all duration-300"
                  >
                    Sign In
                  </Button>
                )}
              </Link>
              {!user && (
                <Link href="/signup">
                  <Button className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-md hover:shadow-lg transition-all duration-300">
                    Get Started
                  </Button>
                </Link>
              )}
            </div>
          </div>
        </div>
      </nav>

      <main>
        {/* Hero Section */}
        <section className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-28 pb-32 overflow-hidden">
          {/* Background Glow */}
          <div className="absolute inset-0 -z-20 bg-gradient-to-b from-white via-blue-50 to-indigo-50"></div>
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[900px] h-[900px] bg-[radial-gradient(circle_at_center,rgba(99,102,241,0.15),transparent_70%)] blur-3xl"></div>
          <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-[conic-gradient(from_180deg_at_center,#60a5fa_0%,#818cf8_40%,transparent_100%)] blur-[120px] opacity-30"></div>
          <div className="absolute bottom-0 right-0 w-[600px] h-[600px] bg-[radial-gradient(circle_at_center,#a5b4fc_0%,transparent_70%)] blur-[140px] opacity-30"></div>

          {/* Main Content */}
          <div className="relative text-center z-10 space-y-10">
            {/* Headline */}
            <div className="space-y-6">
              <h1 className="text-5xl sm:text-6xl lg:text-7xl font-extrabold leading-tight tracking-tight">
                <span className="block text-slate-900">Chat Smarter,</span>
                <span className="block bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent">
                  Connect Effortlessly.
                </span>
              </h1>
              <p className="text-lg sm:text-xl text-slate-600 max-w-2xl mx-auto leading-relaxed">
                Elevate your communication with a clean, fast, and intelligent
                chat experience — built for seamless interaction, elegant
                design, and real-time magic.
              </p>
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-5 justify-center items-center">
              <Link href="/signup">
                <Button
                  size="lg"
                  className="px-10 py-6 text-lg font-semibold bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-700 hover:via-indigo-700 hover:to-purple-700 text-white rounded-2xl shadow-[0_0_30px_rgba(99,102,241,0.25)] hover:shadow-[0_0_50px_rgba(99,102,241,0.4)] transition-all duration-300"
                >
                  🚀 Start Chatting Free
                </Button>
              </Link>
              <Link href="/login">
                <Button
                  size="lg"
                  variant="outline"
                  className="px-10 py-6 text-lg font-semibold border-2 border-slate-300 hover:border-blue-400 hover:bg-blue-50 text-slate-700 hover:text-blue-700 rounded-2xl transition-all duration-300"
                >
                  Sign In
                </Button>
              </Link>
            </div>

            {/* Hero Mockup Preview */}
            <div className="relative mt-20">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-400/20 via-indigo-400/10 to-purple-400/20 blur-3xl rounded-[2rem]"></div>
              <div className="relative bg-white/80 backdrop-blur-2xl rounded-[2rem] border border-slate-200 shadow-2xl overflow-hidden">
                {/* Mock window header */}
                <div className="flex items-center gap-2 px-5 py-3 border-b border-slate-200 bg-slate-50">
                  <div className="w-3 h-3 rounded-full bg-red-400"></div>
                  <div className="w-3 h-3 rounded-full bg-yellow-400"></div>
                  <div className="w-3 h-3 rounded-full bg-green-400"></div>
                </div>

                {/* Mock Chat UI */}
                <div className="h-80 sm:h-[28rem] bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex flex-col items-center justify-center">
                  <MessageCircle className="h-20 w-20 sm:h-28 sm:w-28 text-indigo-400/40 animate-pulse" />
                  <h3 className="text-slate-600 text-lg mt-4 font-medium">
                    Beautiful, Fast, and Real-Time Messaging
                  </h3>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="relative bg-gradient-to-b from-white via-slate-50 to-white py-28 overflow-hidden">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            {/* Header */}
            <div className="text-center mb-20 space-y-5">
              <h2 className="text-5xl font-extrabold bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent">
                Everything You Need to Stay Connected
              </h2>
              <p className="text-xl text-slate-600 max-w-2xl mx-auto leading-relaxed">
                Experience seamless communication with next-gen features built
                for collaboration, privacy, and speed.
              </p>
            </div>

            {/* Features Grid */}
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-10">
              {[
                {
                  icon: <MessageCircle className="h-6 w-6 text-white" />,
                  title: "Instant Messaging",
                  desc: "Chat in real-time with delivery receipts, typing indicators, and beautifully smooth transitions.",
                  gradient: "from-blue-500 to-indigo-500",
                },
                {
                  icon: <Users className="h-6 w-6 text-white" />,
                  title: "Group Chats",
                  desc: "Collaborate effortlessly with modern group chats featuring mentions, reactions, and smart threads.",
                  gradient: "from-emerald-500 to-teal-500",
                },
                {
                  icon: <Shield className="h-6 w-6 text-white" />,
                  title: "Privacy First",
                  desc: "Built on privacy — every message is encrypted and protected with top-tier security measures.",
                  gradient: "from-purple-500 to-pink-500",
                },
                {
                  icon: <Zap className="h-6 w-6 text-white" />,
                  title: "Lightning Fast",
                  desc: "Engineered for speed — instant delivery, minimal lag, and buttery-smooth animations.",
                  gradient: "from-amber-500 to-orange-500",
                },
                {
                  icon: <Lock className="h-6 w-6 text-white" />,
                  title: "Secure Platform",
                  desc: "Multi-layered protection, 2FA support, and end-to-end encryption keep your data safe.",
                  gradient: "from-rose-500 to-red-500",
                },
                {
                  icon: <Video className="h-6 w-6 text-white" />,
                  title: "Rich Experience",
                  desc: "Modern, minimalist interface built for productivity with stunning visuals and fluid animations.",
                  gradient: "from-cyan-500 to-blue-500",
                },
              ].map((feature, i) => (
                <div
                  key={i}
                  className="group relative p-8 rounded-3xl bg-white border border-slate-200 shadow-sm hover:shadow-xl transition-all duration-500 hover:-translate-y-2 hover:bg-gradient-to-br hover:from-slate-50 hover:to-slate-100"
                >
                  {/* Gradient border animation */}
                  <div
                    className={`absolute inset-0 rounded-3xl border-[2px] border-transparent group-hover:border-${
                      feature.gradient.split(" ")[0]
                    } transition-all duration-500`}
                  ></div>

                  {/* Icon with ripple effect */}
                  <div
                    className={`relative z-10 h-14 w-14 bg-gradient-to-br ${feature.gradient} rounded-2xl flex items-center justify-center mb-6 overflow-hidden`}
                  >
                    <span className="absolute inset-0 bg-white/10 group-hover:scale-150 transition-transform duration-700 ease-out rounded-full"></span>
                    <span className="relative">{feature.icon}</span>
                  </div>

                  {/* Text */}
                  <div className="relative z-10">
                    <h3 className="text-2xl font-semibold text-slate-900 mb-3 group-hover:text-slate-800 transition-colors">
                      {feature.title}
                    </h3>
                    <p className="text-slate-600 leading-relaxed">
                      {feature.desc}
                    </p>
                  </div>

                  {/* Subtle bottom indicator */}
                  <div
                    className={`absolute bottom-0 left-1/2 -translate-x-1/2 w-0 group-hover:w-1/2 h-[3px] bg-gradient-to-r ${feature.gradient} rounded-full transition-all duration-500`}
                  ></div>
                </div>
              ))}
            </div>
          </div>
        </section>
        <section className="relative bg-gradient-to-b from-white via-slate-50 to-slate-100 py-24">
          {/* Subtle glow background */}
          <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_center,rgba(99,102,241,0.08),transparent_70%)]"></div>

          <div className="max-w-7xl mx-auto px-6 lg:px-8 text-center">
            {/* Heading */}
            <div className="space-y-4 mb-16">
              <h2 className="text-4xl sm:text-5xl font-extrabold text-slate-900">
                What Our Users Say
              </h2>
              <p className="text-slate-600 max-w-2xl mx-auto text-lg">
                Real stories from real people who love using ChatFlow every day.
              </p>
            </div>

            {/* Testimonials Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
              {testimonials.map((t, i) => (
                <Card
                  key={i}
                  className="border border-slate-200 bg-white/60 backdrop-blur-md shadow-lg hover:shadow-xl transition-all duration-300 rounded-2xl"
                >
                  <CardContent className="p-8 flex flex-col items-center text-center space-y-4">
                    <Quote className="h-8 w-8 text-blue-500 opacity-70" />
                    <p className="text-slate-700 text-base leading-relaxed italic">
                      “{t.text}”
                    </p>

                    {/* Profile */}
                    <div className="flex flex-col items-center mt-4 space-y-2">
                      <Avatar className="h-14 w-14 border-2 border-blue-500/50">
                        <AvatarImage src={t.image} alt={t.name} />
                        <AvatarFallback className="bg-blue-500 text-white font-semibold">
                          {t.name.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <h3 className="text-slate-900 font-semibold text-lg">
                          {t.name}
                        </h3>
                        <p className="text-slate-500 text-sm">{t.role}</p>
                      </div>

                      {/* Stars */}
                      <div className="flex items-center gap-1 pt-2">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <svg
                            key={i}
                            xmlns="http://www.w3.org/2000/svg"
                            className="w-4 h-4 text-yellow-400"
                            fill="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path d="M12 .587l3.668 7.425 8.2 1.192-5.934 5.781 1.402 8.168L12 18.897l-7.336 3.856 1.402-8.168L.132 9.204l8.2-1.192z" />
                          </svg>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>
        <section className="relative py-24 bg-gradient-to-b from-white via-slate-50 to-white">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
            {/* Header */}
            <div className="text-center mb-14 space-y-4">
              <div className="inline-flex items-center justify-center bg-blue-100 text-blue-700 px-3 py-1.5 rounded-full text-sm font-medium">
                <HelpCircle className="w-4 h-4 mr-1.5" /> Frequently Asked
                Questions
              </div>
              <h2 className="text-4xl font-extrabold text-slate-900 leading-tight">
                Your Questions, Answered.
              </h2>
              <p className="text-slate-600 max-w-2xl mx-auto text-lg">
                Everything you need to know about using our chat platform,
                managing your account, and staying connected.
              </p>
            </div>

            {/* FAQ List */}
            <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-6 sm:p-10">
              <Accordion type="single" collapsible className="space-y-3">
                <AccordionItem
                  value="item-1"
                  className="border border-slate-200 rounded-xl px-4 py-2 bg-slate-50 hover:bg-slate-100 transition-all duration-300"
                >
                  <AccordionTrigger className="text-lg font-semibold text-slate-800 hover:text-blue-600 transition-colors">
                    How do I create an account?
                  </AccordionTrigger>
                  <AccordionContent className="text-slate-600 leading-relaxed text-base">
                    To create an account, click on the{" "}
                    <strong>“Sign Up”</strong> button on the homepage, fill in
                    your details, and verify your email. Once done, you’ll be
                    able to start chatting instantly.
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem
                  value="item-2"
                  className="border border-slate-200 rounded-xl px-4 py-2 bg-slate-50 hover:bg-slate-100 transition-all duration-300"
                >
                  <AccordionTrigger className="text-lg font-semibold text-slate-800 hover:text-blue-600 transition-colors">
                    Can I use ChatFlow on my mobile device?
                  </AccordionTrigger>
                  <AccordionContent className="text-slate-600 leading-relaxed text-base">
                    Absolutely! ChatFlow is fully responsive and works
                    seamlessly on all devices, including smartphones, tablets,
                    and desktops.
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem
                  value="item-3"
                  className="border border-slate-200 rounded-xl px-4 py-2 bg-slate-50 hover:bg-slate-100 transition-all duration-300"
                >
                  <AccordionTrigger className="text-lg font-semibold text-slate-800 hover:text-blue-600 transition-colors">
                    Is my data and chat history secure?
                  </AccordionTrigger>
                  <AccordionContent className="text-slate-600 leading-relaxed text-base">
                    Yes. We use end-to-end encryption and secure cloud storage
                    to ensure your messages, files, and personal data remain
                    private and safe at all times.
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem
                  value="item-4"
                  className="border border-slate-200 rounded-xl px-4 py-2 bg-slate-50 hover:bg-slate-100 transition-all duration-300"
                >
                  <AccordionTrigger className="text-lg font-semibold text-slate-800 hover:text-blue-600 transition-colors">
                    Can I delete or edit my sent messages?
                  </AccordionTrigger>
                  <AccordionContent className="text-slate-600 leading-relaxed text-base">
                    Yes! You can easily edit or delete your messages within a
                    set time frame by simply hovering over the message and
                    choosing the desired action.
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem
                  value="item-5"
                  className="border border-slate-200 rounded-xl px-4 py-2 bg-slate-50 hover:bg-slate-100 transition-all duration-300"
                >
                  <AccordionTrigger className="text-lg font-semibold text-slate-800 hover:text-blue-600 transition-colors">
                    Do you offer customer support?
                  </AccordionTrigger>
                  <AccordionContent className="text-slate-600 leading-relaxed text-base">
                    Of course! Our support team is available 24/7 through live
                    chat and email to help with any issues or questions you
                    might have.
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </div>
          </div>
        </section>

        <section className="relative py-28 overflow-hidden bg-gradient-to-br from-blue-700 via-indigo-700 to-purple-700">
          {/* Background Glow Effects */}
          <div className="absolute inset-0">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-blue-400/30 blur-[160px] rounded-full"></div>
            <div className="absolute bottom-0 right-1/3 w-[600px] h-[600px] bg-purple-500/20 blur-[140px] rounded-full"></div>
          </div>

          {/* Floating Orbs for Subtle Motion */}
          <div className="absolute top-10 left-20 w-20 h-20 bg-blue-400/40 blur-2xl rounded-full animate-pulse"></div>
          <div className="absolute bottom-16 right-28 w-16 h-16 bg-indigo-400/30 blur-xl rounded-full animate-pulse"></div>

          {/* Main Content */}
          <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center flex flex-col gap-5">
            <h2 className="text-5xl sm:text-6xl font-extrabold text-white leading-tight">
              Ready to{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-300 to-cyan-300">
                Chat Smarter
              </span>
              ?
            </h2>

            <p className="text-lg sm:text-xl text-blue-100/90 max-w-2xl mx-auto leading-relaxed">
              Join thousands already connecting effortlessly on{" "}
              <span className="font-semibold text-white">ChatFlow</span>. Your
              conversations — faster, cleaner, and beautifully synced.
            </p>

            {/* CTA Button with Glow */}

            <Link
              href="/signup"
              size="lg"
              className="text-lg px-5 mt-5 py-4 bg-gradient-to-r from-white via-blue-50 w-fit mx-auto to-blue-100 text-blue-700 font-semibold hover:scale-105 shadow-[0_0_25px_rgba(255,255,255,0.3)] hover:shadow-[0_0_40px_rgba(255,255,255,0.5)] transition-all duration-300 rounded-full"
            >
              🚀 Create Free Account
            </Link>
          </div>

          {/* Decorative Wave at Bottom */}
          <div className="absolute bottom-0 left-0 w-full overflow-hidden leading-[0]">
            <svg
              className="relative block w-full h-[100px]"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 1200 120"
              preserveAspectRatio="none"
            >
              <path
                d="M985.66,83.29c-72.19,10.16-146.9,8.11-218.93-6.08C655.9,64,548.51,30,440.16,22.43,331.54,14.86,223.46,34,115.52,61.58,77.82,71.22,39.11,81.94,0,92.4V120H1200V95.8C1128.87,70.22,1057.85,73.14,985.66,83.29Z"
                fill="rgba(255,255,255,0.1)"
              ></path>
            </svg>
          </div>
        </section>
      </main>

      <footer className="relative bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-slate-400 pt-16 pb-10 border-t border-slate-800 overflow-hidden">
        {/* Background Glow Effects */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[700px] bg-gradient-to-r from-blue-600/20 via-indigo-600/20 to-purple-600/20 blur-3xl opacity-30 rounded-full"></div>

        <div className="relative z-10 max-w-7xl mx-auto px-6 sm:px-8">
          {/* Top Section */}
          <div className="flex flex-col md:flex-row justify-between items-center gap-8 pb-10 border-b border-slate-800">
            {/* Brand */}
            <div className="flex items-center gap-2">
              <div className="relative">
                <div className="absolute inset-0 blur-lg bg-blue-500/30 rounded-full"></div>
                <div className="relative bg-gradient-to-r from-blue-500 to-indigo-500 p-2 rounded-full">
                  <MessageCircle className="h-6 w-6 text-white" />
                </div>
              </div>
              <span className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">
                ChatFlow
              </span>
            </div>

            {/* Footer Links */}
            <div className="flex flex-wrap justify-center md:justify-end gap-6 text-sm font-medium">
              <a
                href="#features"
                className="hover:text-blue-400 transition-colors"
              >
                Features
              </a>
              <a
                href="#pricing"
                className="hover:text-blue-400 transition-colors"
              >
                Pricing
              </a>
              <a
                href="#about"
                className="hover:text-blue-400 transition-colors"
              >
                About
              </a>
              <a
                href="#contact"
                className="hover:text-blue-400 transition-colors"
              >
                Contact
              </a>
            </div>
          </div>

          {/* Bottom Section */}
          <div className="mt-8 flex flex-col sm:flex-row justify-between items-center gap-4">
            <p className="text-xs text-slate-500">
              © 2025 ChatFlow. All rights reserved.
            </p>

            {/* Social Icons */}
            <div className="flex items-center gap-4">
              {/* Facebook */}
              <a
                href="https://facebook.com"
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 rounded-full bg-slate-800/60 hover:bg-blue-600 transition-all duration-300 transform hover:-translate-y-0.5 hover:scale-105 text-slate-300 hover:text-white"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="w-5 h-5"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M12 2.04c-5.5 0-9.96 4.46-9.96 9.96 0 4.41 3.6 8.1 8.07 8.89v-6.28h-2.43V12h2.43v-1.9c0-2.4 1.43-3.72 3.62-3.72 1.05 0 2.15.19 2.15.19v2.37h-1.21c-1.19 0-1.56.74-1.56 1.5V12h2.66l-.43 2.61h-2.23v6.28c4.47-.79 8.07-4.48 8.07-8.89 0-5.5-4.46-9.96-9.96-9.96z" />
                </svg>
              </a>

              {/* Twitter (X) */}
              <a
                href="https://twitter.com"
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 rounded-full bg-slate-800/60 hover:bg-sky-500 transition-all duration-300 transform hover:-translate-y-0.5 hover:scale-105 text-slate-300 hover:text-white"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="w-5 h-5"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M22.46 6c-.77.35-1.5.58-2.25.69a4.07 4.07 0 0 0 1.79-2.24c-.82.49-1.7.84-2.62 1.03A4.09 4.09 0 0 0 16 4a4.1 4.1 0 0 0-4.1 4.1c0 .32.04.64.1.94A11.63 11.63 0 0 1 3 5.15a4.1 4.1 0 0 0 1.26 5.47 4.02 4.02 0 0 1-1.85-.5v.05A4.1 4.1 0 0 0 6.1 14a4.09 4.09 0 0 1-1.84.07A4.1 4.1 0 0 0 8.1 16a8.23 8.23 0 0 1-5.1 1.76A8.45 8.45 0 0 1 2 17.7a11.6 11.6 0 0 0 6.29 1.84c7.55 0 11.68-6.26 11.68-11.68v-.53A8.36 8.36 0 0 0 22.46 6z" />
                </svg>
              </a>

              {/* Instagram */}
              <a
                href="https://instagram.com"
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 rounded-full bg-slate-800/60 hover:bg-gradient-to-tr from-pink-500 via-red-500 to-yellow-500 transition-all duration-300 transform hover:-translate-y-0.5 hover:scale-105 text-slate-300 hover:text-white"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="w-5 h-5"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M7 2C4.24 2 2 4.24 2 7v10c0 2.76 2.24 5 5 5h10c2.76 0 5-2.24 5-5V7c0-2.76-2.24-5-5-5H7zm10 2c1.65 0 3 1.35 3 3v10c0 1.65-1.35 3-3 3H7c-1.65 0-3-1.35-3-3V7c0-1.65 1.35-3 3-3h10zm-5 4.5A5.5 5.5 0 1 0 17.5 14 5.5 5.5 0 0 0 12 8.5zm0 9A3.5 3.5 0 1 1 15.5 14 3.5 3.5 0 0 1 12 17.5zm4.75-9.88a1.12 1.12 0 1 1-1.12-1.12 1.12 1.12 0 0 1 1.12 1.12z" />
                </svg>
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
