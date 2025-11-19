import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { ArrowLeft, Mail, MessageCircle, HelpCircle, Send, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import Logo from '@/components/Logo';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

const contactSchema = z.object({
  name: z.string().trim().min(1, { message: "Name is required" }).max(100, { message: "Name must be less than 100 characters" }),
  email: z.string().trim().email({ message: "Invalid email address" }).max(255, { message: "Email must be less than 255 characters" }),
  subject: z.string().trim().min(1, { message: "Subject is required" }).max(200, { message: "Subject must be less than 200 characters" }),
  message: z.string().trim().min(10, { message: "Message must be at least 10 characters" }).max(2000, { message: "Message must be less than 2000 characters" })
});

type ContactFormData = z.infer<typeof contactSchema>;

const Support = () => {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<ContactFormData>({
    resolver: zodResolver(contactSchema),
    defaultValues: {
      name: '',
      email: '',
      subject: '',
      message: ''
    }
  });

  const onSubmit = async (data: ContactFormData) => {
    setIsSubmitting(true);
    
    try {
      const { error } = await supabase.functions.invoke('send-support-email', {
        body: data
      });

      if (error) throw error;

      toast.success('Support request sent successfully! We\'ll get back to you soon.');
      form.reset();
    } catch (error: any) {
      console.error('Error sending support request:', error);
      toast.error('Failed to send support request. Please try emailing us directly at support@afuchat.com');
    } finally {
      setIsSubmitting(false);
    }
  };

  const faqs = [
    {
      question: "How do I create an account?",
      answer: "Click on the 'Sign Up' button on the welcome page. You can register using your email address or sign in with Google. Follow the verification steps to activate your account."
    },
    {
      question: "How do I reset my password?",
      answer: "Go to Settings > Account > Change Password, or click 'Forgot Password' on the login page. You'll receive a password reset email to your registered email address."
    },
    {
      question: "What is Business Mode?",
      answer: "Business Mode allows organizations to access additional features like affiliate management, business dashboard, and analytics. You can request business access through your account settings."
    },
    {
      question: "How does the XP and leveling system work?",
      answer: "You earn XP (experience points) by engaging with the platform - posting content, commenting, daily logins, and completing achievements. Your XP determines your grade level, which unlocks special features and accessories."
    },
    {
      question: "What are gifts and how do I send them?",
      answer: "Gifts are virtual items you can send to other users using your XP. Click on any user's profile, select the gift icon, choose a gift, and add an optional message. Seasonal gifts are available during special events."
    },
    {
      question: "How do I customize my owl avatar?",
      answer: "Go to your profile and click 'Edit Profile', then select 'Customize Avatar'. You can choose different eyes, emotions, accessories, and backgrounds. Some items unlock as you level up."
    },
    {
      question: "What are tips and how do they work?",
      answer: "Tips allow you to support content creators by sending them XP directly on their posts. Click the tip icon on any post, enter the amount, and add an optional message of appreciation."
    },
    {
      question: "Can I use AfuChat on mobile?",
      answer: "Yes! AfuChat is fully responsive and works great on mobile browsers. You can also install it as a Progressive Web App (PWA) for a native app-like experience. Visit /install for instructions."
    },
    {
      question: "How do I report inappropriate content?",
      answer: "Click the three dots menu on any post, select 'Report', choose a reason, and submit. Our moderation team reviews all reports promptly."
    },
    {
      question: "How do I enable push notifications?",
      answer: "Go to Settings > Notifications and click 'Enable Push Notifications'. Make sure you allow notifications when your browser prompts you."
    },
    {
      question: "What languages does AfuChat support?",
      answer: "AfuChat currently supports English, Spanish, French, Arabic, and Swahili. You can change your language preference in Settings > Language."
    },
    {
      question: "How do I become an affiliate?",
      answer: "Visit the Affiliate Request page through Settings. You'll need to be affiliated with a business account. Fill out the request form and wait for approval from the business."
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container max-w-6xl mx-auto px-4 sm:px-6">
          <div className="flex h-14 sm:h-16 items-center justify-between">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate(-1)}
              className="shrink-0"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="absolute left-1/2 -translate-x-1/2">
              <Logo size="sm" />
            </div>
            <div className="w-10" />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container max-w-6xl mx-auto px-4 sm:px-6 py-8 pb-24">
        <div className="text-center mb-12">
          <HelpCircle className="h-16 w-16 mx-auto mb-4 text-primary" />
          <h1 className="text-3xl sm:text-4xl font-bold mb-2">Support Center</h1>
          <p className="text-muted-foreground text-lg">
            We're here to help you get the most out of AfuChat
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8 mb-12">
          {/* Contact Form */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageCircle className="h-5 w-5" />
                Contact Us
              </CardTitle>
              <CardDescription>
                Send us a message and we'll respond within 24-48 hours
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Your name" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input type="email" placeholder="your@email.com" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="subject"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Subject</FormLabel>
                        <FormControl>
                          <Input placeholder="How can we help?" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="message"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Message</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Describe your issue or question in detail..."
                            className="min-h-[120px]"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Button type="submit" className="w-full" disabled={isSubmitting}>
                    {isSubmitting ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Sending...
                      </>
                    ) : (
                      <>
                        <Send className="h-4 w-4 mr-2" />
                        Send Message
                      </>
                    )}
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>

          {/* Quick Contact Info */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Mail className="h-5 w-5" />
                  Direct Email
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-3">
                  Prefer to email us directly? Send your inquiries to:
                </p>
                <a 
                  href="mailto:support@afuchat.com"
                  className="text-lg font-medium text-primary hover:underline"
                >
                  support@afuchat.com
                </a>
                <p className="text-xs text-muted-foreground mt-4">
                  Average response time: 24-48 hours
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Support Hours</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Monday - Friday</span>
                  <span className="font-medium">9:00 AM - 6:00 PM EST</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Saturday - Sunday</span>
                  <span className="font-medium">Limited Support</span>
                </div>
                <p className="text-xs text-muted-foreground mt-4">
                  Emergency issues are prioritized 24/7
                </p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* FAQ Section */}
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">Frequently Asked Questions</CardTitle>
            <CardDescription>
              Find quick answers to common questions
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Accordion type="single" collapsible className="w-full">
              {faqs.map((faq, index) => (
                <AccordionItem key={index} value={`item-${index}`}>
                  <AccordionTrigger className="text-left">
                    {faq.question}
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground">
                    {faq.answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </CardContent>
        </Card>

        {/* Additional Help */}
        <div className="mt-8 text-center">
          <p className="text-sm text-muted-foreground">
            Can't find what you're looking for?{' '}
            <a href="mailto:support@afuchat.com" className="text-primary hover:underline">
              Contact our support team
            </a>
          </p>
        </div>
      </main>
    </div>
  );
};

export default Support;
