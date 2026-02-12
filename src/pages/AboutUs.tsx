import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Ambulance, ArrowLeft, Heart, Target, AlertTriangle, Phone, Mail } from 'lucide-react';

export default function AboutUs() {
  return (
    <div className="min-h-screen hero-gradient">
      {/* Header */}
      <header className="border-b bg-background/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <div className="p-2 emergency-gradient rounded-lg">
              <Ambulance className="h-6 w-6 text-primary-foreground" />
            </div>
            <span className="font-display text-xl font-bold">SwiftCare</span>
          </Link>
          <Link to="/">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="mr-1 h-4 w-4" />
              Back Home
            </Button>
          </Link>
        </div>
      </header>

      <main className="container mx-auto px-4 py-12 max-w-3xl animate-slide-up">
        {/* Section 1: What is SwiftCare */}
        <section className="mb-14">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2.5 rounded-xl bg-primary/10 text-primary">
              <Ambulance className="h-6 w-6" />
            </div>
            <h2 className="font-display text-2xl font-bold">What is SwiftCare?</h2>
          </div>
          <p className="text-muted-foreground leading-relaxed">
            SwiftCare is an intelligent emergency ambulance dispatch system designed for Abuja, FCT. 
            It automates the process of locating, dispatching, and tracking the nearest available ambulance 
            to anyone in need — no login required. The platform connects citizens to life-saving help with 
            just a few taps, while giving drivers and administrators a real-time operational dashboard.
          </p>
        </section>

        {/* Section 2: The Problem */}
        <section className="mb-14">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2.5 rounded-xl bg-destructive/10 text-destructive">
              <AlertTriangle className="h-6 w-6" />
            </div>
            <h2 className="font-display text-2xl font-bold">The Problem We Solve</h2>
          </div>
          <p className="text-muted-foreground leading-relaxed">
            In many parts of Nigeria, getting an ambulance during an emergency is slow, unreliable, 
            and often depends on knowing the right phone number or hospital. Delays in emergency 
            response cost lives every day. SwiftCare eliminates this gap by providing a centralized, 
            automated dispatch system that ensures the closest ambulance reaches you as fast as possible — 
            no phone calls, no guesswork.
          </p>
        </section>

        {/* Section 3: Our Mission */}
        <section className="mb-14">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2.5 rounded-xl bg-accent/10 text-accent">
              <Target className="h-6 w-6" />
            </div>
            <h2 className="font-display text-2xl font-bold">Our Mission</h2>
          </div>
          <p className="text-muted-foreground leading-relaxed">
            Our mission is to ensure that no one in Abuja — or eventually, across Nigeria — 
            is ever more than minutes away from emergency medical care. We believe that access to 
            rapid emergency response should not be a privilege. SwiftCare is built with the vision of 
            making life-saving ambulance services accessible, transparent, and dependable for every citizen.
          </p>
        </section>

        {/* Section 4: Contact */}
        <section className="mb-16">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2.5 rounded-xl bg-primary/10 text-primary">
              <Heart className="h-6 w-6" />
            </div>
            <h2 className="font-display text-2xl font-bold">Contact / Admin</h2>
          </div>
          <p className="text-muted-foreground mb-6">
            Have questions, feedback, or need to reach the team? Get in touch below.
          </p>

          <div className="flex flex-col sm:flex-row gap-4">
            <a
              href="tel:+2347040653233"
              className="flex items-center gap-3 p-4 rounded-xl border bg-card hover:shadow-md transition-shadow group"
            >
              <div className="p-2.5 rounded-lg emergency-gradient text-primary-foreground group-hover:scale-110 transition-transform">
                <Phone className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Call us</p>
                <p className="font-medium text-sm">+234 (0) 704 065 3233</p>
              </div>
            </a>

            <a
              href="mailto:murtalaimam99@gmail.com"
              className="flex items-center gap-3 p-4 rounded-xl border bg-card hover:shadow-md transition-shadow group"
            >
              <div className="p-2.5 rounded-lg emergency-gradient text-primary-foreground group-hover:scale-110 transition-transform">
                <Mail className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Email us</p>
                <p className="font-medium text-sm">murtalaimam99@gmail.com</p>
              </div>
            </a>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t bg-background">
        <div className="container mx-auto px-4 py-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <Ambulance className="h-5 w-5 text-primary" />
              <span className="font-display font-semibold">SwiftCare</span>
              <span className="text-muted-foreground text-sm">• Abuja, FCT</span>
            </div>
            <p className="text-sm text-muted-foreground">
              © {new Date().getFullYear()} SwiftCare. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
