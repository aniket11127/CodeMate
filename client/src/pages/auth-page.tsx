import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { insertUserSchema } from "@shared/schema";
import { Redirect } from "wouter";
import { Loader2, Code } from "lucide-react";

const loginSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

const registerSchema = insertUserSchema.extend({
  confirmPassword: z.string().min(6, "Password must be at least 6 characters"),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

export default function AuthPage() {
  const { user, loginMutation, registerMutation } = useAuth();
  const [activeTab, setActiveTab] = useState<string>("login");

  const loginForm = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  });

  const registerForm = useForm<z.infer<typeof registerSchema>>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      username: "",
      password: "",
      confirmPassword: "",
    },
  });

  const onLoginSubmit = (values: z.infer<typeof loginSchema>) => {
    loginMutation.mutate(values);
  };

  const onRegisterSubmit = (values: z.infer<typeof registerSchema>) => {
    const { confirmPassword, ...userData } = values;
    registerMutation.mutate(userData);
  };

  // Redirect if user is already logged in
  if (user) {
    return <Redirect to="/home" />;
  }

  return (
    <div className="min-h-screen flex flex-col md:flex-row">
      {/* Left column - Form */}
      <div className="w-full md:w-1/2 p-6 md:p-10 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader className="space-y-1">
            <div className="flex items-center gap-2 mb-2">
              <Code className="h-6 w-6 text-primary" />
              <h2 className="text-2xl font-bold">
                Code<span className="text-accent">Collab</span>
              </h2>
            </div>
            <CardTitle className="text-2xl">Welcome back</CardTitle>
            <CardDescription>
              Login to your account or create a new one to start collaborating
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="login" value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-2 mb-4">
                <TabsTrigger value="login">Login</TabsTrigger>
                <TabsTrigger value="register">Register</TabsTrigger>
              </TabsList>
              
              {/* Login Form */}
              <TabsContent value="login">
                <Form {...loginForm}>
                  <form onSubmit={loginForm.handleSubmit(onLoginSubmit)} className="space-y-4">
                    <FormField
                      control={loginForm.control}
                      name="username"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Username</FormLabel>
                          <FormControl>
                            <Input placeholder="johndoe" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={loginForm.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Password</FormLabel>
                          <FormControl>
                            <Input type="password" placeholder="******" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <Button
                      type="submit"
                      className="w-full"
                      disabled={loginMutation.isPending}
                    >
                      {loginMutation.isPending ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Logging in...
                        </>
                      ) : (
                        "Login"
                      )}
                    </Button>
                  </form>
                </Form>
              </TabsContent>
              
              {/* Register Form */}
              <TabsContent value="register">
                <Form {...registerForm}>
                  <form onSubmit={registerForm.handleSubmit(onRegisterSubmit)} className="space-y-4">
                    <FormField
                      control={registerForm.control}
                      name="username"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Username</FormLabel>
                          <FormControl>
                            <Input placeholder="johndoe" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={registerForm.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Password</FormLabel>
                          <FormControl>
                            <Input type="password" placeholder="******" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={registerForm.control}
                      name="confirmPassword"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Confirm Password</FormLabel>
                          <FormControl>
                            <Input type="password" placeholder="******" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <Button
                      type="submit"
                      className="w-full"
                      disabled={registerMutation.isPending}
                    >
                      {registerMutation.isPending ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Registering...
                        </>
                      ) : (
                        "Register"
                      )}
                    </Button>
                  </form>
                </Form>
              </TabsContent>
            </Tabs>
          </CardContent>
          <CardFooter>
            <p className="text-center text-sm text-muted-foreground w-full">
              {activeTab === "login" ? (
                <>
                  Don't have an account?{" "}
                  <Button variant="link" className="p-0" onClick={() => setActiveTab("register")}>
                    Sign up
                  </Button>
                </>
              ) : (
                <>
                  Already have an account?{" "}
                  <Button variant="link" className="p-0" onClick={() => setActiveTab("login")}>
                    Sign in
                  </Button>
                </>
              )}
            </p>
          </CardFooter>
        </Card>
      </div>

      {/* Right column - Hero */}
      <div className="hidden md:flex w-1/2 bg-gradient-to-b from-blue-50 to-white p-10 flex-col justify-center">
        <div className="max-w-md mx-auto">
          <h1 className="text-4xl font-bold mb-4">
            <span className="block">Code Together.</span>
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary to-accent">
              Learn Together.
            </span>
          </h1>
          <p className="text-lg text-gray-600 mb-6">
            A collaborative coding platform with real-time editing, multi-language support, and
            virtual meeting rooms. Perfect for pair programming, interviews, and learning.
          </p>
          <div className="bg-dark rounded-lg p-4 text-white font-mono text-sm">
            <div className="flex items-center mb-2 border-b border-gray-700 pb-1">
              <div className="h-3 w-3 bg-red-500 rounded-full mr-1"></div>
              <div className="h-3 w-3 bg-yellow-500 rounded-full mr-1"></div>
              <div className="h-3 w-3 bg-green-500 rounded-full mr-2"></div>
              <span className="text-xs opacity-70">main.py</span>
            </div>
            <pre className="text-xs">
              <span className="text-purple-400">def</span>{" "}
              <span className="text-blue-400">fibonacci</span>(n):
              <br />
              {"    "}
              <span className="text-gray-400"># Return Fibonacci series up to n</span>
              <br />
              {"    "}result = []
              <br />
              {"    "}a, b = 0, 1
              <br />
              {"    "}
              <span className="text-purple-400">while</span> a {"<"} n:
              <br />
              {"        "}result.append(a)
              <br />
              {"        "}a, b = b, a + b
              <br />
              {"    "}
              <span className="text-purple-400">return</span> result
            </pre>
          </div>
          <ul className="mt-6 space-y-2">
            <li className="flex items-center">
              <div className="h-6 w-6 rounded-full bg-primary flex items-center justify-center text-white mr-2">
                ✓
              </div>
              <span>Real-time code collaboration</span>
            </li>
            <li className="flex items-center">
              <div className="h-6 w-6 rounded-full bg-primary flex items-center justify-center text-white mr-2">
                ✓
              </div>
              <span>Multi-language support</span>
            </li>
            <li className="flex items-center">
              <div className="h-6 w-6 rounded-full bg-primary flex items-center justify-center text-white mr-2">
                ✓
              </div>
              <span>Code execution and chat</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
