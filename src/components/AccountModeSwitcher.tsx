import React from 'react';
import { useAccountMode } from '@/contexts/AccountModeContext';
import { Button } from '@/components/ui/button';
import { Building2, User } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';

export function AccountModeSwitcher() {
  const { isBusinessMode, setBusinessMode, businessAccount, loading } = useAccountMode();

  if (loading || !businessAccount) return null;

  return (
    <Card className="p-4">
      <div className="space-y-3">
        <p className="text-sm font-medium text-foreground">Switch Account</p>
        
        <div className="flex gap-2">
          <Button
            variant={!isBusinessMode ? 'default' : 'outline'}
            className="flex-1 gap-2"
            onClick={() => setBusinessMode(false)}
          >
            <User className="h-4 w-4" />
            Personal
          </Button>
          
          <Button
            variant={isBusinessMode ? 'default' : 'outline'}
            className="flex-1 gap-2"
            onClick={() => setBusinessMode(true)}
          >
            <Building2 className="h-4 w-4" />
            Business
          </Button>
        </div>

        {isBusinessMode && businessAccount && (
          <div className="flex items-center gap-2 p-2 rounded-lg bg-muted">
            <Avatar className="h-8 w-8">
              <AvatarImage src={businessAccount.business_logo_url || undefined} />
              <AvatarFallback>
                <Building2 className="h-4 w-4" />
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{businessAccount.business_name}</p>
              <p className="text-xs text-muted-foreground">Business Account</p>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}
