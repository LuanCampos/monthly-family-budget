import React from 'react';
import { Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';

interface TriggerButtonProps extends React.ComponentPropsWithoutRef<typeof Button> {
  user?: any;
  myPendingInvitations?: Array<any>;
  getUserInitials?: () => string;
  getDisplayName?: () => string;
}

const TriggerButton = React.forwardRef<HTMLButtonElement, TriggerButtonProps>(
  ({ user, myPendingInvitations = [], getUserInitials, getDisplayName, className, children, ...props }, ref) => {
    return (
      <Button
        ref={ref}
        variant="ghost"
        size="icon"
        className={cn('h-9 w-9 sm:h-10 sm:w-10 rounded-full p-0 relative', className)}
        aria-label={props['aria-label'] ?? 'Open user menu'}
        {...props}
      >
        {user ? (
          <Avatar className="h-8 w-8">
            <AvatarImage src={user.user_metadata?.avatar_url} alt={getDisplayName ? getDisplayName() : ''} />
            <AvatarFallback className="bg-primary text-primary-foreground text-xs">{getUserInitials ? getUserInitials() : '?'}</AvatarFallback>
          </Avatar>
        ) : (
          <Settings className="h-4 w-4 sm:h-5 sm:w-5" />
        )}

        {myPendingInvitations.length > 0 && (
          <span className="absolute -top-1 -right-1 h-4 w-4 text-xs bg-destructive text-destructive-foreground rounded-full flex items-center justify-center">
            {myPendingInvitations.length}
          </span>
        )}

        {children}
      </Button>
    );
  }
);

TriggerButton.displayName = 'TriggerButton';

export default TriggerButton;
