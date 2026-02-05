import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Ambulance, Home } from "lucide-react";

const NotFound = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30">
      <div className="text-center">
        <div className="mx-auto p-4 bg-muted rounded-2xl w-fit mb-6">
          <Ambulance className="h-12 w-12 text-muted-foreground" />
        </div>
        <h1 className="font-display text-4xl font-bold mb-2">404</h1>
        <p className="text-muted-foreground mb-6">Page not found</p>
        <Link to="/">
          <Button>
            <Home className="h-4 w-4 mr-2" />
            Go Home
          </Button>
        </Link>
      </div>
    </div>
  );
};

export default NotFound;