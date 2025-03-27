import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import NotFound from "@/pages/not-found";
import HomePage from "@/pages/home-page";
import AuthPage from "@/pages/auth-page";
import CodeRoom from "@/pages/code-room";
import LandingPage from "@/pages/landing-page";
import { ProtectedRoute } from "./lib/protected-route";
import { AuthProvider } from "./hooks/use-auth";
import { RoomProvider } from "./hooks/use-room";
import { CodeExecutionProvider } from "./hooks/use-code-execution";
import { useParams } from "wouter";

// Wrapper for the CodeRoom component that provides room context
function CodeRoomWithProvider() {
  const { roomId } = useParams();
  return (
    <RoomProvider roomId={roomId}>
      <CodeExecutionProvider>
        <CodeRoom />
      </CodeExecutionProvider>
    </RoomProvider>
  );
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={LandingPage} />
      <ProtectedRoute path="/home" component={HomePage} />
      <ProtectedRoute path="/room/:roomId" component={CodeRoomWithProvider} />
      <Route path="/auth" component={AuthPage} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Router />
        <Toaster />
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
