import { Button } from '@/components/ui/button';
import { Ambulance, LogOut } from 'lucide-react';

interface AdminHeaderProps {
  onSignOut: () => void;
}

export default function AdminHeader({ onSignOut }: AdminHeaderProps) {
  return (
    <header className="border-b bg-background sticky top-0 z-50">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 emergency-gradient rounded-lg">
            <Ambulance className="h-5 w-5 text-primary-foreground" />
          </div>
          <div>
            <span className="font-display font-bold block">SwiftCare</span>
            <span className="text-xs text-muted-foreground">Admin Dashboard</span>
          </div>
        </div>
        <Button variant="ghost" size="sm" onClick={onSignOut}>
          <LogOut className="h-4 w-4 mr-2" />
          Logout
        </Button>
      </div>
    </header>
  );
}
