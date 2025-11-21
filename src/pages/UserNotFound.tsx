import { useLocation, Link } from "react-router-dom";
import { useEffect } from "react";
import { UserX } from "lucide-react";
import { Button } from "@/components/ui/button";

const UserNotFound = () => {
  const location = useLocation();
  const username = (location.state as { username?: string })?.username || location.pathname.slice(1);

  useEffect(() => {
    console.error("User not found:", username);
  }, [username]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="text-center max-w-md px-4">
        <UserX className="mx-auto h-24 w-24 text-muted-foreground mb-6" />
        <h1 className="mb-4 text-4xl font-bold">User Not Found</h1>
        <p className="mb-4 text-lg text-muted-foreground">
          The user <span className="font-semibold text-foreground">@{username}</span> doesn't exist or has been removed.
        </p>
        <div className="flex gap-3 justify-center">
          <Button asChild variant="default">
            <Link to="/">Go Home</Link>
          </Button>
          <Button asChild variant="outline">
            <Link to="/search">Search Users</Link>
          </Button>
        </div>
      </div>
    </div>
  );
};

export default UserNotFound;
