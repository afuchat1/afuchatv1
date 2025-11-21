import { useLocation, Link } from "react-router-dom";
import { useEffect } from "react";
import { FileQuestion } from "lucide-react";
import { Button } from "@/components/ui/button";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="text-center max-w-md px-4">
        <FileQuestion className="mx-auto h-24 w-24 text-muted-foreground mb-6" />
        <h1 className="mb-4 text-4xl font-bold">404</h1>
        <p className="mb-4 text-xl text-muted-foreground">
          The page you're looking for doesn't exist
        </p>
        <p className="mb-6 text-sm text-muted-foreground">
          The page at <span className="font-mono font-semibold text-foreground">{location.pathname}</span> could not be found.
        </p>
        <Button asChild variant="default">
          <Link to="/">Return to Home</Link>
        </Button>
      </div>
    </div>
  );
};

export default NotFound;
