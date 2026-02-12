import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Ambulance, Phone, Clock, MapPin, Shield, Users } from 'lucide-react';

export default function HomePage() {
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
          <nav className="flex items-center gap-4">
            <Link to="/track">
              <Button variant="ghost" size="sm">Track Request</Button>
            </Link>
            <Link to="/login">
              <Button variant="outline" size="sm">Staff Login</Button>
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20 md:py-32">
        <div className="max-w-4xl mx-auto text-center animate-slide-up">
          <h1 className="font-display text-4xl md:text-6xl font-extrabold tracking-tight mb-6">
            Emergency Ambulance
            <span className="block text-primary">When Every Second Counts</span>
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground mb-10 max-w-2xl mx-auto">
            SwiftCare automatically dispatches the nearest available ambulance to your location. 
            Fast, reliable emergency response for Abuja, FCT.
          </p>
          
          <div className="flex flex-col items-center gap-4">
            <Link to="/about">
              <Button 
                size="lg" 
                variant="outline"
                className="text-lg px-10 py-6 rounded-xl font-semibold border-primary text-primary hover:bg-primary/5"
              >
                About Us
              </Button>
            </Link>
            <Link to="/request">
              <Button 
                size="lg" 
                className="emergency-gradient shadow-emergency animate-pulse-emergency text-lg px-10 py-7 rounded-xl font-semibold"
              >
                <Phone className="mr-2 h-5 w-5" />
                Request Ambulance Now
              </Button>
            </Link>
          </div>
          
          <p className="mt-6 text-sm text-muted-foreground">
            No login required • Available 24/7
          </p>
        </div>
      </section>

      {/* Features */}
      <section className="container mx-auto px-4 py-16">
        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          <FeatureCard 
            icon={<Clock className="h-8 w-8" />}
            title="Rapid Response"
            description="Our automated system instantly locates and dispatches the nearest available ambulance."
          />
          <FeatureCard 
            icon={<MapPin className="h-8 w-8" />}
            title="GPS Tracking"
            description="Track your ambulance in real-time from dispatch to arrival at your location."
          />
          <FeatureCard 
            icon={<Shield className="h-8 w-8" />}
            title="Professional Care"
            description="Trained paramedics and fully-equipped ambulances ready for any emergency."
          />
        </div>
      </section>

      {/* How It Works */}
      <section className="container mx-auto px-4 py-16 pb-24">
        <h2 className="font-display text-3xl font-bold text-center mb-12">
          How It Works
        </h2>
        <div className="grid md:grid-cols-4 gap-6 max-w-4xl mx-auto">
          <Step number={1} title="Request" description="Submit your location and emergency details" />
          <Step number={2} title="Dispatch" description="System auto-assigns nearest ambulance" />
          <Step number={3} title="Track" description="Monitor ambulance en route to you" />
          <Step number={4} title="Rescue" description="Professional help arrives quickly" />
        </div>
      </section>

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

function FeatureCard({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) {
  return (
    <div className="p-6 rounded-2xl bg-card border shadow-sm hover:shadow-md transition-shadow">
      <div className="p-3 rounded-xl bg-primary/10 text-primary w-fit mb-4">
        {icon}
      </div>
      <h3 className="font-display font-semibold text-lg mb-2">{title}</h3>
      <p className="text-muted-foreground text-sm">{description}</p>
    </div>
  );
}

function Step({ number, title, description }: { number: number; title: string; description: string }) {
  return (
    <div className="text-center">
      <div className="w-12 h-12 rounded-full emergency-gradient text-primary-foreground font-bold text-lg flex items-center justify-center mx-auto mb-4">
        {number}
      </div>
      <h3 className="font-display font-semibold mb-1">{title}</h3>
      <p className="text-sm text-muted-foreground">{description}</p>
    </div>
  );
}