import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Upload, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";

export default function VerificationRequest() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    accountType: "business" as "business" | "influencer",
    fullName: "",
    email: "",
    phone: "",
    websiteUrl: "",
    socialLinks: "",
    verificationReason: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast.error("You must be logged in to apply for verification");
      return;
    }

    setLoading(true);

    try {
      // Parse social links (comma-separated)
      const socialLinksArray = formData.socialLinks
        .split(",")
        .map(link => link.trim())
        .filter(link => link.length > 0);

      const { error } = await supabase
        .from("verification_requests")
        .insert({
          user_id: user.id,
          account_type: formData.accountType,
          full_name: formData.fullName,
          email: formData.email,
          phone: formData.phone || null,
          website_url: formData.websiteUrl || null,
          social_links: socialLinksArray,
          verification_reason: formData.verificationReason,
          status: "pending",
        });

      if (error) throw error;

      toast.success("Verification request submitted successfully!");
      navigate(-1);
    } catch (error: any) {
      console.error("Error submitting verification request:", error);
      toast.error(error.message || "Failed to submit verification request");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
        <div className="flex items-center gap-4 p-4">
          <Button
            variant="ghost"
            size="icon"
            className="rounded-full"
            onClick={() => navigate(-1)}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-xl font-bold">Verification Request</h1>
            <p className="text-sm text-muted-foreground">Apply to get your account verified</p>
          </div>
        </div>
      </div>

      {/* Form Content */}
      <div className="max-w-2xl mx-auto p-4 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Account Verification</CardTitle>
            <CardDescription>
              Fill out this form to apply for account verification. Our team will review your application within 3-5 business days.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Account Type */}
              <div className="space-y-3">
                <Label>Account Type *</Label>
                <RadioGroup
                  value={formData.accountType}
                  onValueChange={(value: "business" | "influencer") =>
                    setFormData({ ...formData, accountType: value })
                  }
                >
                  <div className="flex items-center space-x-2 border rounded-lg p-4 cursor-pointer hover:bg-accent">
                    <RadioGroupItem value="business" id="business" />
                    <Label htmlFor="business" className="flex-1 cursor-pointer">
                      <div className="font-semibold">Business / Organization</div>
                      <div className="text-sm text-muted-foreground">
                        Official business accounts, brands, or organizations
                      </div>
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2 border rounded-lg p-4 cursor-pointer hover:bg-accent">
                    <RadioGroupItem value="influencer" id="influencer" />
                    <Label htmlFor="influencer" className="flex-1 cursor-pointer">
                      <div className="font-semibold">Influencer / Creator</div>
                      <div className="text-sm text-muted-foreground">
                        Content creators, public figures, or influencers
                      </div>
                    </Label>
                  </div>
                </RadioGroup>
              </div>

              {/* Full Name */}
              <div className="space-y-2">
                <Label htmlFor="fullName">Full Name / Business Name *</Label>
                <Input
                  id="fullName"
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  placeholder="Enter your full name or business name"
                  required
                />
              </div>

              {/* Email */}
              <div className="space-y-2">
                <Label htmlFor="email">Email Address *</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="your@email.com"
                  required
                />
              </div>

              {/* Phone */}
              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number (Optional)</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="+1234567890"
                />
              </div>

              {/* Website */}
              <div className="space-y-2">
                <Label htmlFor="website">Website URL (Optional)</Label>
                <Input
                  id="website"
                  type="url"
                  value={formData.websiteUrl}
                  onChange={(e) => setFormData({ ...formData, websiteUrl: e.target.value })}
                  placeholder="https://yourwebsite.com"
                />
              </div>

              {/* Social Links */}
              <div className="space-y-2">
                <Label htmlFor="socialLinks">Social Media Links (Optional)</Label>
                <Textarea
                  id="socialLinks"
                  value={formData.socialLinks}
                  onChange={(e) => setFormData({ ...formData, socialLinks: e.target.value })}
                  placeholder="Enter social media profile URLs, separated by commas
Example: https://twitter.com/yourprofile, https://instagram.com/yourprofile"
                  rows={3}
                />
                <p className="text-xs text-muted-foreground">
                  Provide links to your social media profiles to help us verify your identity
                </p>
              </div>

              {/* Verification Reason */}
              <div className="space-y-2">
                <Label htmlFor="reason">Why do you want to get verified? *</Label>
                <Textarea
                  id="reason"
                  value={formData.verificationReason}
                  onChange={(e) => setFormData({ ...formData, verificationReason: e.target.value })}
                  placeholder="Explain why your account should be verified. Include details about your business, influence, or notable achievements."
                  rows={4}
                  required
                />
                <p className="text-xs text-muted-foreground">
                  Minimum 50 characters. Be specific about your accomplishments and why verification would benefit the community.
                </p>
              </div>

              {/* Supporting Documents Note */}
              <div className="bg-muted/50 border rounded-lg p-4 space-y-2">
                <div className="flex gap-2 items-start">
                  <Upload className="w-5 h-5 text-primary mt-0.5" />
                  <div>
                    <p className="font-semibold text-sm">Supporting Documents</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      After submitting this form, our team may contact you to request additional documents such as:
                    </p>
                    <ul className="text-xs text-muted-foreground mt-2 space-y-1 ml-4">
                      <li>• Business registration documents</li>
                      <li>• Government-issued ID</li>
                      <li>• Proof of social media following</li>
                      <li>• Media coverage or press mentions</li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                className="w-full"
                size="lg"
                disabled={loading || !formData.fullName || !formData.email || !formData.verificationReason || formData.verificationReason.length < 50}
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  "Submit Verification Request"
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
