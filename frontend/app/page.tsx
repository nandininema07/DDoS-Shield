import type React from "react"
import Link from "next/link"
import { ArrowRight, CheckCircle, Shield, ShieldAlert, ShieldCheck, Zap } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col">
      {/* Navigation */}
      <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield className="h-6 w-6 text-primary" />
            <span className="text-xl font-bold">DDoS Shield</span>
          </div>
          <nav className="hidden gap-6 md:flex">
            <Link
              href="#features"
              className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              Features
            </Link>
            <Link
              href="#how-it-works"
              className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              How It Works
            </Link>
            <Link
              href="#pricing"
              className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              Pricing
            </Link>
          </nav>
          <div className="flex items-center gap-4">
            <Link href="/login">
              <Button variant="ghost" size="sm">
                Log in
              </Button>
            </Link>
            <Link href="/signup">
              <Button size="sm">Get Started</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container flex flex-col items-center justify-center gap-4 py-24 text-center md:py-32">
        <div className="space-y-4">
          <h1 className="text-4xl font-bold tracking-tighter sm:text-5xl md:text-6xl">
            Advanced DDoS Protection <br className="hidden sm:inline" />
            Powered by <span className="text-primary">Machine Learning</span>
          </h1>
          <p className="mx-auto max-w-[700px] text-lg text-muted-foreground md:text-xl">
            Protect your website from distributed denial-of-service attacks with our intelligent detection and alerting
            system.
          </p>
        </div>
        <div className="flex flex-col gap-4 sm:flex-row">
          <Link href="/signup">
            <Button size="lg" className="gap-1">
              Get Started <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
          <Link href="#how-it-works">
            <Button variant="outline" size="lg">
              Learn More
            </Button>
          </Link>
        </div>
        <div className="mt-12 w-full overflow-hidden rounded-lg border bg-muted/50 shadow-xl">
          <img
            src="/placeholder.svg?height=600&width=1200"
            alt="DDoS Shield Dashboard"
            className="w-full object-cover"
          />
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="container py-24">
        <div className="mb-12 text-center">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">Comprehensive Protection Features</h2>
          <p className="mt-4 text-lg text-muted-foreground">
            Our platform offers advanced tools to detect, prevent, and respond to DDoS attacks.
          </p>
        </div>
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          <FeatureCard
            icon={<ShieldAlert className="h-10 w-10 text-primary" />}
            title="Real-time Detection"
            description="Identify and analyze attack patterns as they happen with ML-powered traffic analysis."
          />
          <FeatureCard
            icon={<ShieldCheck className="h-10 w-10 text-primary" />}
            title="Automatic Mitigation"
            description="Block malicious traffic instantly with intelligent filtering and rate limiting."
          />
          <FeatureCard
            icon={<Zap className="h-10 w-10 text-primary" />}
            title="Instant Alerts"
            description="Receive notifications via email, SMS, or phone calls when attacks are detected."
          />
          <FeatureCard
            icon={<Shield className="h-10 w-10 text-primary" />}
            title="IP Blacklisting"
            description="Maintain a database of known malicious IPs and automatically block them."
          />
          <FeatureCard
            icon={<CheckCircle className="h-10 w-10 text-primary" />}
            title="Traffic Analysis"
            description="Visualize network traffic patterns and identify anomalies with detailed graphs."
          />
          <FeatureCard
            icon={<Shield className="h-10 w-10 text-primary" />}
            title="AI Assistant"
            description="Get insights and recommendations from our AI-powered chatbot assistant."
          />
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="bg-muted/50 py-24">
        <div className="container">
          <div className="mb-12 text-center">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">How It Works</h2>
            <p className="mt-4 text-lg text-muted-foreground">
              Our three-step approach to keeping your website safe from DDoS attacks
            </p>
          </div>
          <div className="grid gap-8 md:grid-cols-3">
            <StepCard
              number="01"
              title="Detection"
              description="Our ML algorithms continuously monitor your traffic patterns to identify potential DDoS attacks in real-time."
            />
            <StepCard
              number="02"
              title="Analysis"
              description="When suspicious activity is detected, our system analyzes the traffic to determine the type and severity of the attack."
            />
            <StepCard
              number="03"
              title="Response"
              description="Based on the analysis, we automatically block malicious traffic and notify you through your preferred channels."
            />
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="container py-24">
        <div className="mb-12 text-center">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">Simple, Transparent Pricing</h2>
          <p className="mt-4 text-lg text-muted-foreground">Choose the plan that fits your needs</p>
        </div>
        <div className="grid gap-8 md:grid-cols-3">
          <PricingCard
            title="Basic"
            price="$49"
            description="Essential protection for small websites"
            features={[
              "Up to 10,000 requests/minute",
              "Email notifications",
              "Basic traffic analysis",
              "24/7 monitoring",
              "Community support",
            ]}
            buttonText="Get Started"
            buttonVariant="outline"
          />
          <PricingCard
            title="Professional"
            price="$149"
            description="Advanced protection for growing businesses"
            features={[
              "Up to 50,000 requests/minute",
              "Email and SMS notifications",
              "Advanced traffic analysis",
              "24/7 monitoring with priority",
              "Email support with 24h response",
            ]}
            buttonText="Get Started"
            buttonVariant="default"
            highlighted={true}
          />
          <PricingCard
            title="Enterprise"
            price="$499"
            description="Maximum protection for high-traffic websites"
            features={[
              "Unlimited requests/minute",
              "Email, SMS, and phone notifications",
              "Custom ML model training",
              "24/7 monitoring with highest priority",
              "Dedicated support with 1h response",
            ]}
            buttonText="Contact Sales"
            buttonVariant="outline"
          />
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-primary text-primary-foreground">
        <div className="container py-16 md:py-24">
          <div className="flex flex-col items-center justify-between gap-8 md:flex-row">
            <div className="max-w-md space-y-4">
              <h2 className="text-3xl font-bold tracking-tight">Ready to protect your website?</h2>
              <p className="text-primary-foreground/80">
                Get started with DDoS Shield today and keep your online presence secure.
              </p>
            </div>
            <div className="flex flex-col gap-4 sm:flex-row">
              <Link href="/signup">
                <Button size="lg" variant="secondary" className="gap-1">
                  Get Started <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <Link href="/login">
                <Button
                  size="lg"
                  variant="outline"
                  className="border-primary-foreground/20 text-primary-foreground hover:bg-primary-foreground/10"
                >
                  Log In
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t bg-muted/50">
        <div className="container py-12">
          <div className="grid gap-8 md:grid-cols-4">
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Shield className="h-6 w-6 text-primary" />
                <span className="text-xl font-bold">DDoS Shield</span>
              </div>
              <p className="text-sm text-muted-foreground">Advanced DDoS protection powered by machine learning.</p>
            </div>
            <div>
              <h3 className="mb-4 text-sm font-semibold">Product</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>
                  <Link href="#features" className="hover:text-foreground">
                    Features
                  </Link>
                </li>
                <li>
                  <Link href="#how-it-works" className="hover:text-foreground">
                    How It Works
                  </Link>
                </li>
                <li>
                  <Link href="#pricing" className="hover:text-foreground">
                    Pricing
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="mb-4 text-sm font-semibold">Company</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>
                  <Link href="#" className="hover:text-foreground">
                    About Us
                  </Link>
                </li>
                <li>
                  <Link href="#" className="hover:text-foreground">
                    Blog
                  </Link>
                </li>
                <li>
                  <Link href="#" className="hover:text-foreground">
                    Careers
                  </Link>
                </li>
                <li>
                  <Link href="#" className="hover:text-foreground">
                    Contact
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="mb-4 text-sm font-semibold">Legal</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>
                  <Link href="#" className="hover:text-foreground">
                    Privacy Policy
                  </Link>
                </li>
                <li>
                  <Link href="#" className="hover:text-foreground">
                    Terms of Service
                  </Link>
                </li>
                <li>
                  <Link href="#" className="hover:text-foreground">
                    Cookie Policy
                  </Link>
                </li>
              </ul>
            </div>
          </div>
          <div className="mt-12 border-t pt-6 text-center text-sm text-muted-foreground">
            <p>© 2023 DDoS Shield. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}

function FeatureCard({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) {
  return (
    <Card>
      <CardHeader>
        <div className="mb-4">{icon}</div>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <CardDescription className="text-base">{description}</CardDescription>
      </CardContent>
    </Card>
  )
}

function StepCard({ number, title, description }: { number: string; title: string; description: string }) {
  return (
    <div className="flex flex-col items-center text-center">
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary text-2xl font-bold text-primary-foreground">
        {number}
      </div>
      <h3 className="mb-2 text-xl font-bold">{title}</h3>
      <p className="text-muted-foreground">{description}</p>
    </div>
  )
}

function PricingCard({
  title,
  price,
  description,
  features,
  buttonText,
  buttonVariant = "default",
  highlighted = false,
}: {
  title: string
  price: string
  description: string
  features: string[]
  buttonText: string
  buttonVariant?: "default" | "outline"
  highlighted?: boolean
}) {
  return (
    <Card className={`flex flex-col ${highlighted ? "border-primary shadow-lg" : ""}`}>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <div className="mt-4 flex items-baseline">
          <span className="text-4xl font-extrabold">{price}</span>
          <span className="ml-1 text-muted-foreground">/month</span>
        </div>
        <CardDescription className="mt-2">{description}</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col">
        <ul className="mb-6 space-y-3">
          {features.map((feature, index) => (
            <li key={index} className="flex items-center">
              <CheckCircle className="mr-2 h-4 w-4 text-primary" />
              <span className="text-sm">{feature}</span>
            </li>
          ))}
        </ul>
        <div className="mt-auto">
          <Button variant={buttonVariant} className="w-full">
            {buttonText}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
