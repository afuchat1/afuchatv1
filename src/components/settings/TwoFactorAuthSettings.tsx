import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Shield, Smartphone, Key, Copy, Check, Loader2, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Alert, AlertDescription } from '@/components/ui/alert';

export const TwoFactorAuthSettings = () => {
  const { user } = useAuth();
  const [isEnrolled, setIsEnrolled] = useState(false);
  const [isEnrolling, setIsEnrolling] = useState(false);
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [secret, setSecret] = useState<string | null>(null);
  const [verificationCode, setVerificationCode] = useState('');
  const [factorId, setFactorId] = useState<string | null>(null);
  const [showDisableConfirm, setShowDisableConfirm] = useState(false);
  const [isDisabling, setIsDisabling] = useState(false);
  const [copiedSecret, setCopiedSecret] = useState(false);

  useEffect(() => {
    if (user) {
      checkEnrollmentStatus();
    }
  }, [user]);

  const checkEnrollmentStatus = async () => {
    try {
      const { data, error } = await supabase.auth.mfa.listFactors();
      if (error) throw error;

      const totpFactors = data?.totp || [];
      
      // Find verified factor - check the friendly_name pattern
      const verifiedFactor = totpFactors.find(f => f.friendly_name?.includes('Authenticator App'));
      setIsEnrolled(!!verifiedFactor);
      if (verifiedFactor) {
        setFactorId(verifiedFactor.id);
      }

      // Clean up any old factors with similar names
      const oldFactors = totpFactors.filter(f => 
        f.friendly_name?.includes('Authenticator App') && !verifiedFactor
      );
      for (const factor of oldFactors) {
        try {
          await supabase.auth.mfa.unenroll({ factorId: factor.id });
        } catch (err) {
          console.error('Error cleaning up old factor:', err);
        }
      }
    } catch (error) {
      console.error('Error checking MFA status:', error);
    }
  };

  const handleEnroll = async () => {
    setIsEnrolling(true);
    try {
      // First, clean up any existing factors with similar names
      const { data: factorsData } = await supabase.auth.mfa.listFactors();
      const existingFactors = factorsData?.totp?.filter(f => 
        f.friendly_name?.includes('Authenticator App')
      ) || [];
      
      for (const factor of existingFactors) {
        try {
          await supabase.auth.mfa.unenroll({ factorId: factor.id });
        } catch (err) {
          console.error('Error cleaning up old factor:', err);
        }
      }

      // Now enroll with a unique friendly name
      const timestamp = Date.now();
      const { data, error } = await supabase.auth.mfa.enroll({
        factorType: 'totp',
        friendlyName: `Authenticator App ${timestamp}`
      });

      if (error) throw error;

      setQrCode(data.totp.qr_code);
      setSecret(data.totp.secret);
      setFactorId(data.id);
    } catch (error: any) {
      console.error('Error enrolling in 2FA:', error);
      toast.error(error.message || 'Failed to set up 2FA');
      setIsEnrolling(false);
    }
  };

  const handleVerify = async () => {
    if (!factorId || !verificationCode) {
      toast.error('Please enter the verification code');
      return;
    }

    try {
      const { data, error } = await supabase.auth.mfa.challengeAndVerify({
        factorId,
        code: verificationCode
      });

      if (error) throw error;

      setIsEnrolled(true);
      setIsEnrolling(false);
      setQrCode(null);
      setSecret(null);
      setVerificationCode('');
      toast.success('Two-factor authentication enabled successfully!');
      checkEnrollmentStatus();
    } catch (error: any) {
      console.error('Error verifying 2FA:', error);
      toast.error(error.message || 'Invalid verification code');
    }
  };

  const handleDisable = async () => {
    if (!factorId) return;

    setIsDisabling(true);
    try {
      const { error } = await supabase.auth.mfa.unenroll({ factorId });
      if (error) throw error;

      setIsEnrolled(false);
      setFactorId(null);
      setShowDisableConfirm(false);
      toast.success('Two-factor authentication disabled');
    } catch (error: any) {
      console.error('Error disabling 2FA:', error);
      toast.error(error.message || 'Failed to disable 2FA');
    } finally {
      setIsDisabling(false);
    }
  };

  const handleCopySecret = () => {
    if (secret) {
      navigator.clipboard.writeText(secret);
      setCopiedSecret(true);
      toast.success('Secret copied to clipboard');
      setTimeout(() => setCopiedSecret(false), 2000);
    }
  };

  const handleCancelEnrollment = () => {
    setIsEnrolling(false);
    setQrCode(null);
    setSecret(null);
    setVerificationCode('');
    setFactorId(null);
  };

  if (isEnrolling) {
    return (
      <div className="space-y-6">
        <Card className="p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Smartphone className="h-5 w-5 text-primary" />
            </div>
            <h3 className="text-xl font-semibold">Set Up Authenticator App</h3>
          </div>

          <div className="space-y-6">
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Scan the QR code with your authenticator app (Google Authenticator, Authy, etc.)
              </AlertDescription>
            </Alert>

            {qrCode && (
              <div className="flex flex-col items-center gap-4">
                <div className="p-4 bg-white rounded-lg">
                  <img src={qrCode} alt="QR Code" className="w-64 h-64" />
                </div>
                
                <div className="w-full">
                  <p className="text-sm font-medium mb-2">Or enter this code manually:</p>
                  <div className="flex gap-2">
                    <Input
                      value={secret || ''}
                      readOnly
                      className="font-mono text-sm"
                    />
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={handleCopySecret}
                    >
                      {copiedSecret ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">
                  Enter the 6-digit code from your app
                </label>
                <Input
                  type="text"
                  placeholder="000000"
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  className="text-center text-2xl tracking-widest font-mono"
                  maxLength={6}
                />
              </div>

              <div className="flex gap-3">
                <Button
                  onClick={handleVerify}
                  disabled={verificationCode.length !== 6}
                  className="flex-1"
                >
                  Verify & Enable
                </Button>
                <Button
                  variant="outline"
                  onClick={handleCancelEnrollment}
                >
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-primary/10 rounded-lg">
            <Shield className="h-5 w-5 text-primary" />
          </div>
          <h3 className="text-xl font-semibold">Two-Factor Authentication</h3>
        </div>

        <div className="space-y-6">
          <div className="flex items-start justify-between p-4 rounded-lg bg-muted/30">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <Smartphone className="h-5 w-5 text-muted-foreground" />
                <p className="font-semibold">Authenticator App</p>
              </div>
              <p className="text-sm text-muted-foreground mb-4">
                {isEnrolled 
                  ? 'Two-factor authentication is currently enabled on your account'
                  : 'Add an extra layer of security by requiring a code from your authenticator app'}
              </p>
              {isEnrolled ? (
                <div className="flex items-center gap-2 text-sm text-green-600 dark:text-green-400">
                  <Check className="h-4 w-4" />
                  <span>Enabled</span>
                </div>
              ) : null}
            </div>
            <Button
              variant={isEnrolled ? "outline" : "default"}
              onClick={isEnrolled ? () => setShowDisableConfirm(true) : handleEnroll}
            >
              {isEnrolled ? 'Disable' : 'Enable'}
            </Button>
          </div>
        </div>
      </Card>

      <Card className="p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-primary/10 rounded-lg">
            <Key className="h-5 w-5 text-primary" />
          </div>
          <h3 className="text-xl font-semibold">How it Works</h3>
        </div>
        <div className="space-y-4 text-sm text-muted-foreground">
          <p>Two-factor authentication adds an extra layer of security to your account:</p>
          <ol className="list-decimal list-inside space-y-2 ml-4">
            <li>Download an authenticator app like Google Authenticator or Authy</li>
            <li>Scan the QR code or enter the secret key</li>
            <li>Enter the 6-digit code from your app to verify</li>
            <li>You'll need this code every time you sign in</li>
          </ol>
        </div>
      </Card>

      <AlertDialog open={showDisableConfirm} onOpenChange={setShowDisableConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Disable Two-Factor Authentication?</AlertDialogTitle>
            <AlertDialogDescription>
              Your account will be less secure without two-factor authentication. You can always enable it again later.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDisable}
              disabled={isDisabling}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDisabling ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Disabling...
                </>
              ) : (
                'Disable 2FA'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
