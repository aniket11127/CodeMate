import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import {
  Code,
  ChevronDown,
  ExternalLink,
  GithubIcon,
  TwitterIcon,
  LinkedinIcon,
  Users,
  Terminal,
  Lightbulb,
  MessageSquare,
  Save
} from "lucide-react";

export default function LandingPage() {
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [email, setEmail] = useState("");

  const waitlistMutation = useMutation({
    mutationFn: async (email: string) => {
      const res = await apiRequest("POST", "/api/waitlist", { email });
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Joined waitlist",
        description: "Thanks for joining our waitlist! We'll notify you when we launch.",
      });
      setEmail("");
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to join waitlist",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleWaitlistSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      toast({
        title: "Email required",
        description: "Please enter your email address to join the waitlist.",
        variant: "destructive",
      });
      return;
    }
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      toast({
        title: "Invalid email",
        description: "Please enter a valid email address.",
        variant: "destructive",
      });
      return;
    }
    
    waitlistMutation.mutate(email);
  };

  return (
    <div className="min-h-screen bg-background font-sans">
      {/* Navbar */}
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <div className="flex-shrink-0 flex items-center">
                <Code className="h-6 w-6 mr-2 text-primary" />
                <span className="text-2xl font-bold text-primary">Code<span className="text-accent">Collab</span></span>
              </div>
              <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
                <a href="#features" className="inline-flex items-center px-1 pt-1 text-sm font-medium text-gray-500 hover:text-primary">Features</a>
                <a href="#how-it-works" className="inline-flex items-center px-1 pt-1 text-sm font-medium text-gray-500 hover:text-primary">How It Works</a>
                <a href="#faq" className="inline-flex items-center px-1 pt-1 text-sm font-medium text-gray-500 hover:text-primary">FAQ</a>
              </div>
            </div>
            <div className="flex items-center">
              {user ? (
                <Button 
                  className="inline-flex items-center justify-center px-4 py-2"
                  onClick={() => navigate("/home")}
                >
                  Go to Dashboard
                </Button>
              ) : (
                <Button 
                  className="inline-flex items-center justify-center px-4 py-2"
                  onClick={() => navigate("/auth")}
                >
                  Sign In
                </Button>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-20 pb-24 bg-gradient-to-b from-blue-50 to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="lg:grid lg:grid-cols-12 lg:gap-8">
            <div className="sm:text-center md:max-w-2xl md:mx-auto lg:col-span-6 lg:text-left">
              <h1>
                <span className="block text-sm font-semibold uppercase tracking-wide text-accent">Coming Soon</span>
                <span className="mt-1 block text-4xl tracking-tight font-extrabold sm:text-5xl xl:text-6xl">
                  <span className="block">Code Together.</span>
                  <span className="block bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">Learn Together.</span>
                </span>
              </h1>
              <p className="mt-3 text-base text-gray-500 sm:mt-5 sm:text-xl lg:text-lg xl:text-xl">
                A collaborative coding platform with real-time editing, multi-language support, and virtual meeting rooms. Perfect for pair programming, interviews, and learning.
              </p>
              <div className="mt-8 sm:max-w-lg sm:mx-auto sm:text-center lg:text-left lg:mx-0">
                {user ? (
                  <Button 
                    className="inline-flex items-center justify-center px-5 py-3"
                    size="lg"
                    onClick={() => navigate("/home")}
                  >
                    Go to Dashboard
                  </Button>
                ) : (
                  <>
                    <Button 
                      className="inline-flex items-center justify-center px-5 py-3"
                      size="lg"
                      onClick={() => navigate("/auth")}
                    >
                      Get Started
                    </Button>
                    <Button 
                      variant="outline" 
                      className="ml-4 inline-flex items-center justify-center px-5 py-3"
                      size="lg"
                      onClick={() => {
                        const featuresSection = document.getElementById("features");
                        if (featuresSection) {
                          featuresSection.scrollIntoView({ behavior: "smooth" });
                        }
                      }}
                    >
                      Learn More
                    </Button>
                  </>
                )}
              </div>
            </div>
            <div className="mt-12 relative sm:max-w-lg sm:mx-auto lg:mt-0 lg:max-w-none lg:mx-0 lg:col-span-6 lg:flex lg:items-center">
              <div className="relative mx-auto w-full lg:max-w-md">
                <div className="bg-dark rounded-lg shadow-xl overflow-hidden code-window">
                  <div className="flex items-center px-4 py-2 bg-black/70">
                    <div className="h-3 w-3 bg-red-500 rounded-full mr-1"></div>
                    <div className="h-3 w-3 bg-yellow-500 rounded-full mr-1"></div>
                    <div className="h-3 w-3 bg-green-500 rounded-full mr-2"></div>
                    <div className="text-xs text-gray-300">main.py</div>
                  </div>
                  <div className="p-4 font-mono text-sm text-gray-100 overflow-auto">
                    <pre className="whitespace-pre font-jetbrains-mono text-xs sm:text-sm">
{`def fibonacci(n):
    # Return Fibonacci series up to n
    result = []
    a, b = 0, 1
    while a < n:
        result.append(a)
        a, b = b, a + b
    return result

# Test the function
fib_sequence = fibonacci(100)
print("Fibonacci sequence:", fib_sequence)`}
                    </pre>
                  </div>
                </div>
                <div className="absolute top-10 -right-8 bg-white rounded-lg shadow-lg px-3 py-2 text-xs text-gray-700 border border-gray-200">
                  <div className="font-medium">User: Alex</div>
                  <div>We should add a docstring here!</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="lg:text-center">
            <h2 className="text-base text-primary font-semibold tracking-wide uppercase">Features</h2>
            <p className="mt-2 text-3xl leading-8 font-extrabold tracking-tight text-gray-900 sm:text-4xl">
              Everything you need for collaborative coding
            </p>
            <p className="mt-4 max-w-2xl text-xl text-gray-500 lg:mx-auto">
              A comprehensive suite of tools designed for seamless collaboration, learning, and productivity.
            </p>
          </div>

          <div className="mt-16">
            <div className="space-y-10 md:space-y-0 md:grid md:grid-cols-2 md:gap-x-8 md:gap-y-10 lg:grid-cols-3">
              {/* Feature 1 */}
              <div className="relative">
                <div className="absolute flex items-center justify-center h-12 w-12 rounded-md bg-primary text-white">
                  <Code className="h-5 w-5" />
                </div>
                <div className="ml-16">
                  <h3 className="text-lg leading-6 font-medium text-gray-900">Advanced Code Editor</h3>
                  <p className="mt-2 text-base text-gray-500">
                    Feature-rich Monaco editor with syntax highlighting for multiple languages including Java, Python, JavaScript, C++, C, C#, HTML, and CSS.
                  </p>
                </div>
              </div>

              {/* Feature 2 */}
              <div className="relative">
                <div className="absolute flex items-center justify-center h-12 w-12 rounded-md bg-primary text-white">
                  <Terminal className="h-5 w-5" />
                </div>
                <div className="ml-16">
                  <h3 className="text-lg leading-6 font-medium text-gray-900">Code Execution</h3>
                  <p className="mt-2 text-base text-gray-500">
                    Compile and run your code directly in the browser with instant output display for quick testing and debugging.
                  </p>
                </div>
              </div>

              {/* Feature 3 */}
              <div className="relative">
                <div className="absolute flex items-center justify-center h-12 w-12 rounded-md bg-primary text-white">
                  <Lightbulb className="h-5 w-5" />
                </div>
                <div className="ml-16">
                  <h3 className="text-lg leading-6 font-medium text-gray-900">Code Suggestions</h3>
                  <p className="mt-2 text-base text-gray-500">
                    Intelligent code suggestions that help you write better code faster and reduce errors while you type.
                  </p>
                </div>
              </div>

              {/* Feature 4 */}
              <div className="relative">
                <div className="absolute flex items-center justify-center h-12 w-12 rounded-md bg-primary text-white">
                  <Users className="h-5 w-5" />
                </div>
                <div className="ml-16">
                  <h3 className="text-lg leading-6 font-medium text-gray-900">Virtual Meeting Rooms</h3>
                  <p className="mt-2 text-base text-gray-500">
                    Create and join collaborative rooms with unique IDs for pair programming, interviews, or tutoring sessions.
                  </p>
                </div>
              </div>

              {/* Feature 5 */}
              <div className="relative">
                <div className="absolute flex items-center justify-center h-12 w-12 rounded-md bg-primary text-white">
                  <MessageSquare className="h-5 w-5" />
                </div>
                <div className="ml-16">
                  <h3 className="text-lg leading-6 font-medium text-gray-900">Text Chat</h3>
                  <p className="mt-2 text-base text-gray-500">
                    Integrated text-based chat functionality for seamless communication within collaborative rooms.
                  </p>
                </div>
              </div>

              {/* Feature 6 */}
              <div className="relative">
                <div className="absolute flex items-center justify-center h-12 w-12 rounded-md bg-primary text-white">
                  <Save className="h-5 w-5" />
                </div>
                <div className="ml-16">
                  <h3 className="text-lg leading-6 font-medium text-gray-900">Code Snippet Storage</h3>
                  <p className="mt-2 text-base text-gray-500">
                    Save and retrieve your code snippets for future reference or sharing with others.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="lg:text-center">
            <h2 className="text-base text-primary font-semibold tracking-wide uppercase">How It Works</h2>
            <p className="mt-2 text-3xl leading-8 font-extrabold tracking-tight text-gray-900 sm:text-4xl">
              Simple, powerful collaboration
            </p>
            <p className="mt-4 max-w-2xl text-xl text-gray-500 lg:mx-auto">
              See how CodeCollab makes coding together easier than ever before.
            </p>
          </div>

          <div className="mt-16">
            <div className="lg:grid lg:grid-cols-2 lg:gap-8 lg:items-center">
              <div className="relative">
                <div className="bg-dark rounded-lg shadow-xl overflow-hidden">
                  <div className="flex items-center px-4 py-2 bg-black/70">
                    <div className="h-3 w-3 bg-red-500 rounded-full mr-1"></div>
                    <div className="h-3 w-3 bg-yellow-500 rounded-full mr-1"></div>
                    <div className="h-3 w-3 bg-green-500 rounded-full mr-2"></div>
                    <div className="text-xs text-gray-300">Room: XYZ123 • main.js</div>
                  </div>
                  <div className="p-4 font-mono text-sm text-gray-100">
                    <pre className="whitespace-pre text-xs sm:text-sm">
{`function calculateArea(shape, ...args) {
  switch(shape.toLowerCase()) {
    case 'circle':
      const [radius] = args;
      return Math.PI * radius * radius;
    case 'rectangle':
      const [width, height] = args;
      return width * height;
    case 'triangle':
      const [base, height2] = args;
      return (base * height2) / 2;
    default:
      throw new Error('Unsupported shape');
  }
}`}
                    </pre>
                  </div>
                </div>
                <div className="absolute top-10 right-0 bg-white rounded-lg shadow-lg px-3 py-2 text-xs text-gray-700 border border-gray-200 -mr-8">
                  <div className="font-medium">User: Sarah</div>
                  <div>Let's add a square case too!</div>
                </div>
                <div className="mt-4 bg-white rounded-lg shadow-sm p-4 border border-gray-200">
                  <div className="text-sm font-medium">Chat</div>
                  <div className="mt-2 space-y-2">
                    <div className="flex items-start">
                      <div className="flex-shrink-0 h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
                        <span className="text-xs font-medium text-blue-800">JD</span>
                      </div>
                      <div className="ml-3">
                        <div className="text-xs text-gray-500">John Doe</div>
                        <div className="text-sm text-gray-700">I'll implement the square case, should be straightforward.</div>
                      </div>
                    </div>
                    <div className="flex items-start">
                      <div className="flex-shrink-0 h-8 w-8 rounded-full bg-purple-100 flex items-center justify-center">
                        <span className="text-xs font-medium text-purple-800">SW</span>
                      </div>
                      <div className="ml-3">
                        <div className="text-xs text-gray-500">Sarah Wilson</div>
                        <div className="text-sm text-gray-700">Great, I'll work on adding some test cases afterwards.</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="mt-10 -mx-4 relative lg:mt-0">
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg leading-6 font-medium text-gray-900 flex items-center">
                      <span className="flex-shrink-0 h-8 w-8 rounded-full bg-primary flex items-center justify-center text-white text-sm font-medium">1</span>
                      <span className="ml-4">Create or join a room</span>
                    </h3>
                    <p className="mt-2 text-base text-gray-500 ml-12">
                      Start a new collaborative session with a unique room ID or join an existing one with a shared code.
                    </p>
                  </div>
                  <div>
                    <h3 className="text-lg leading-6 font-medium text-gray-900 flex items-center">
                      <span className="flex-shrink-0 h-8 w-8 rounded-full bg-primary flex items-center justify-center text-white text-sm font-medium">2</span>
                      <span className="ml-4">Code together in real-time</span>
                    </h3>
                    <p className="mt-2 text-base text-gray-500 ml-12">
                      See each other's changes as they happen with real-time synchronization and collaborative editing.
                    </p>
                  </div>
                  <div>
                    <h3 className="text-lg leading-6 font-medium text-gray-900 flex items-center">
                      <span className="flex-shrink-0 h-8 w-8 rounded-full bg-primary flex items-center justify-center text-white text-sm font-medium">3</span>
                      <span className="ml-4">Communicate via text chat</span>
                    </h3>
                    <p className="mt-2 text-base text-gray-500 ml-12">
                      Discuss your code and share ideas through the integrated text chat without switching applications.
                    </p>
                  </div>
                  <div>
                    <h3 className="text-lg leading-6 font-medium text-gray-900 flex items-center">
                      <span className="flex-shrink-0 h-8 w-8 rounded-full bg-primary flex items-center justify-center text-white text-sm font-medium">4</span>
                      <span className="ml-4">Execute and test your code</span>
                    </h3>
                    <p className="mt-2 text-base text-gray-500 ml-12">
                      Run your code directly in the browser to see immediate results and debug together.
                    </p>
                  </div>
                  <div>
                    <h3 className="text-lg leading-6 font-medium text-gray-900 flex items-center">
                      <span className="flex-shrink-0 h-8 w-8 rounded-full bg-primary flex items-center justify-center text-white text-sm font-medium">5</span>
                      <span className="ml-4">Save and share your work</span>
                    </h3>
                    <p className="mt-2 text-base text-gray-500 ml-12">
                      Store your code snippets for future reference or share them with others.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Waitlist Section */}
      <section id="waitlist" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="lg:grid lg:grid-cols-2 lg:gap-8 lg:items-center">
            <div>
              <h2 className="text-3xl font-extrabold text-gray-900 sm:text-4xl">
                Join our waitlist
              </h2>
              <p className="mt-4 text-lg text-gray-500">
                Be among the first to experience CodeCollab when we launch. We'll notify you as soon as we're ready to welcome you aboard.
              </p>
              <div className="mt-8">
                <form className="sm:flex" onSubmit={handleWaitlistSubmit}>
                  <label htmlFor="email-address" className="sr-only">Email address</label>
                  <Input
                    id="email-address"
                    name="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your email"
                    className="w-full"
                  />
                  <div className="mt-3 rounded-md sm:mt-0 sm:ml-3 sm:flex-shrink-0">
                    <Button 
                      type="submit" 
                      className="w-full"
                      disabled={waitlistMutation.isPending}
                    >
                      {waitlistMutation.isPending ? (
                        <>
                          <span className="mr-2">Joining...</span>
                        </>
                      ) : (
                        "Join Waitlist"
                      )}
                    </Button>
                  </div>
                </form>
                <p className="mt-3 text-sm text-gray-500">
                  We care about your data. Read our 
                  <Button variant="link" className="px-1 py-0">Privacy Policy</Button>.
                </p>
              </div>
            </div>
            <div className="mt-10 lg:mt-0">
              <div className="bg-gray-50 rounded-lg p-8">
                <blockquote>
                  <div>
                    <svg className="h-12 w-12 text-gray-300 opacity-25" fill="currentColor" viewBox="0 0 32 32">
                      <path d="M9.352 4C4.456 7.456 1 13.12 1 19.36c0 5.088 3.072 8.064 6.624 8.064 3.36 0 5.856-2.688 5.856-5.856 0-3.168-2.208-5.472-5.088-5.472-.576 0-1.344.096-1.536.192.48-3.264 3.552-7.104 6.624-9.024L9.352 4zm16.512 0c-4.8 3.456-8.256 9.12-8.256 15.36 0 5.088 3.072 8.064 6.624 8.064 3.264 0 5.856-2.688 5.856-5.856 0-3.168-2.304-5.472-5.184-5.472-.576 0-1.248.096-1.44.192.48-3.264 3.456-7.104 6.528-9.024L25.864 4z" />
                    </svg>
                    <p className="mt-4 text-lg text-gray-700">
                      As a coding tutor, I've been looking for a tool that allows me to code alongside my students in real-time. CodeCollab seems like it will be the perfect solution for our online sessions!
                    </p>
                  </div>
                  <footer className="mt-6">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                          <span className="text-blue-800 font-medium">MP</span>
                        </div>
                      </div>
                      <div className="ml-3">
                        <p className="text-base font-medium text-gray-800">Michael Porter</p>
                        <p className="text-sm text-gray-500">Programming Instructor</p>
                      </div>
                    </div>
                  </footer>
                </blockquote>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq" className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="lg:text-center">
            <h2 className="text-base text-primary font-semibold tracking-wide uppercase">FAQ</h2>
            <p className="mt-2 text-3xl leading-8 font-extrabold tracking-tight text-gray-900 sm:text-4xl">
              Frequently asked questions
            </p>
            <p className="mt-4 max-w-2xl text-xl text-gray-500 lg:mx-auto">
              Everything you need to know about CodeCollab
            </p>
          </div>

          <div className="mt-12 max-w-3xl mx-auto">
            <Accordion type="single" collapsible className="w-full space-y-6 divide-y divide-gray-200">
              <AccordionItem value="item-1" className="pt-6">
                <AccordionTrigger className="text-left w-full flex justify-between items-start text-gray-400 focus:outline-none">
                  <span className="font-medium text-gray-900">When will CodeCollab be available?</span>
                </AccordionTrigger>
                <AccordionContent>
                  <p className="text-base text-gray-500">
                    We're currently in closed beta testing. We expect to launch a public beta in the next few months. Join our waitlist to be notified as soon as we're ready!
                  </p>
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="item-2" className="pt-6">
                <AccordionTrigger className="text-left w-full flex justify-between items-start text-gray-400 focus:outline-none">
                  <span className="font-medium text-gray-900">Will CodeCollab be free to use?</span>
                </AccordionTrigger>
                <AccordionContent>
                  <p className="text-base text-gray-500">
                    We plan to offer both free and premium tiers. The free tier will include core features like the code editor, basic execution, and limited collaboration. Premium features will include more advanced tools, longer code storage, and additional collaboration options.
                  </p>
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="item-3" className="pt-6">
                <AccordionTrigger className="text-left w-full flex justify-between items-start text-gray-400 focus:outline-none">
                  <span className="font-medium text-gray-900">Which programming languages will be supported?</span>
                </AccordionTrigger>
                <AccordionContent>
                  <p className="text-base text-gray-500">
                    At launch, we'll support Java, Python, JavaScript, C++, C, C#, HTML, and CSS. We plan to add more languages based on user feedback and demand.
                  </p>
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="item-4" className="pt-6">
                <AccordionTrigger className="text-left w-full flex justify-between items-start text-gray-400 focus:outline-none">
                  <span className="font-medium text-gray-900">How many people can collaborate in a room at once?</span>
                </AccordionTrigger>
                <AccordionContent>
                  <p className="text-base text-gray-500">
                    In the free tier, rooms will support up to 3 concurrent users. Premium plans will allow for larger groups, making it perfect for classrooms and team coding sessions.
                  </p>
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="item-5" className="pt-6">
                <AccordionTrigger className="text-left w-full flex justify-between items-start text-gray-400 focus:outline-none">
                  <span className="font-medium text-gray-900">Will there be video chat capabilities?</span>
                </AccordionTrigger>
                <AccordionContent>
                  <p className="text-base text-gray-500">
                    We're focusing on text chat for our initial release. Video and audio capabilities are on our roadmap for future updates.
                  </p>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white">
        <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
          <div className="xl:grid xl:grid-cols-3 xl:gap-8">
            <div className="space-y-8 xl:col-span-1">
              <div className="flex items-center">
                <Code className="h-6 w-6 mr-2 text-primary" />
                <span className="text-2xl font-bold text-primary">Code<span className="text-accent">Collab</span></span>
              </div>
              <p className="text-gray-500 text-base">
                A collaborative coding platform for pair programming, interviews, and learning.
              </p>
              <div className="flex space-x-6">
                <a href="#" className="text-gray-400 hover:text-gray-500">
                  <span className="sr-only">Twitter</span>
                  <TwitterIcon className="h-6 w-6" />
                </a>
                <a href="#" className="text-gray-400 hover:text-gray-500">
                  <span className="sr-only">GitHub</span>
                  <GithubIcon className="h-6 w-6" />
                </a>
                <a href="#" className="text-gray-400 hover:text-gray-500">
                  <span className="sr-only">LinkedIn</span>
                  <LinkedinIcon className="h-6 w-6" />
                </a>
              </div>
            </div>
            <div className="mt-12 grid grid-cols-2 gap-8 xl:mt-0 xl:col-span-2">
              <div className="md:grid md:grid-cols-2 md:gap-8">
                <div>
                  <h3 className="text-sm font-semibold text-gray-400 tracking-wider uppercase">
                    Product
                  </h3>
                  <ul className="mt-4 space-y-4">
                    <li>
                      <a href="#features" className="text-base text-gray-500 hover:text-gray-900">
                        Features
                      </a>
                    </li>
                    <li>
                      <a href="#" className="text-base text-gray-500 hover:text-gray-900">
                        Pricing
                      </a>
                    </li>
                    <li>
                      <a href="#faq" className="text-base text-gray-500 hover:text-gray-900">
                        FAQ
                      </a>
                    </li>
                  </ul>
                </div>
                <div className="mt-12 md:mt-0">
                  <h3 className="text-sm font-semibold text-gray-400 tracking-wider uppercase">
                    Company
                  </h3>
                  <ul className="mt-4 space-y-4">
                    <li>
                      <a href="#" className="text-base text-gray-500 hover:text-gray-900">
                        About
                      </a>
                    </li>
                    <li>
                      <a href="#" className="text-base text-gray-500 hover:text-gray-900">
                        Blog
                      </a>
                    </li>
                    <li>
                      <a href="#" className="text-base text-gray-500 hover:text-gray-900">
                        Careers
                      </a>
                    </li>
                  </ul>
                </div>
              </div>
              <div className="md:grid md:grid-cols-2 md:gap-8">
                <div>
                  <h3 className="text-sm font-semibold text-gray-400 tracking-wider uppercase">
                    Support
                  </h3>
                  <ul className="mt-4 space-y-4">
                    <li>
                      <a href="#" className="text-base text-gray-500 hover:text-gray-900">
                        Documentation
                      </a>
                    </li>
                    <li>
                      <a href="#" className="text-base text-gray-500 hover:text-gray-900">
                        Guides
                      </a>
                    </li>
                    <li>
                      <a href="#" className="text-base text-gray-500 hover:text-gray-900">
                        Contact Us
                      </a>
                    </li>
                  </ul>
                </div>
                <div className="mt-12 md:mt-0">
                  <h3 className="text-sm font-semibold text-gray-400 tracking-wider uppercase">
                    Legal
                  </h3>
                  <ul className="mt-4 space-y-4">
                    <li>
                      <a href="#" className="text-base text-gray-500 hover:text-gray-900">
                        Privacy
                      </a>
                    </li>
                    <li>
                      <a href="#" className="text-base text-gray-500 hover:text-gray-900">
                        Terms
                      </a>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
          <div className="mt-12 border-t border-gray-200 pt-8">
            <p className="text-base text-gray-400 text-center">&copy; 2023 CodeCollab. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
