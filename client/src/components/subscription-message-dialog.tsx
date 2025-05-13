import React from 'react';
import { useToast } from '@/hooks/use-toast';
import { useLocation } from 'wouter';
import { Notification } from '@/hooks/use-notifications';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, AlertTriangle, Info, Crown, CreditCard } from 'lucide-react';

interface SubscriptionMessageDialogProps {
  notification: Notification | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onMarkAsRead: (id: number) => void;
}

/**
 * Dialog component for displaying detailed subscription messages
 */
export function SubscriptionMessageDialog({
  notification,
  open,
  onOpenChange,
  onMarkAsRead,
}: SubscriptionMessageDialogProps) {
  const { toast } = useToast();
  const [, navigate] = useLocation();

  if (!notification) {
    return null;
  }

  // Determine if it's a subscription notification
  const messageType = getMessageType(notification.announcement.title);
  
  // Format the content for better readability
  const formattedContent = notification.announcement.content
    .split('\n\n')
    .map((paragraph, index) => (
      <p key={index} className="mb-3">
        {paragraph.includes('•') 
          ? paragraph.split('\n').map((line, i) => (
            <React.Fragment key={i}>
              {line}
              <br />
            </React.Fragment>
          ))
          : paragraph}
      </p>
    ));

  // Handle action button
  const handleAction = () => {
    // Mark as read
    if (!notification.read) {
      onMarkAsRead(notification.id);
    }
    
    // Navigate based on message type
    switch (messageType) {
      case 'welcome_pro':
        navigate('/dashboard');
        break;
      case 'upgrade_reminder':
        navigate('/subscription/plans');
        break;
      case 'expiration_notice':
        navigate('/subscription');
        break;
      default:
        // Close dialog if no specific action
        onOpenChange(false);
    }
  };

  // Get icon based on message type
  const getIcon = () => {
    switch (messageType) {
      case 'welcome_pro':
        return <Crown className="h-5 w-5 text-amber-500" />;
      case 'upgrade_reminder':
        return <AlertCircle className="h-5 w-5 text-primary" />;
      case 'expiration_notice':
        return <AlertTriangle className="h-5 w-5 text-destructive" />;
      default:
        return <Info className="h-5 w-5 text-muted-foreground" />;
    }
  };

  // Get action button text
  const getActionButtonText = () => {
    switch (messageType) {
      case 'welcome_pro':
        return 'Go to Dashboard';
      case 'upgrade_reminder':
        return 'View Subscription Plans';
      case 'expiration_notice':
        return 'Renew Subscription';
      default:
        return 'Close';
    }
  };

  // Get title without the type prefix
  const getDisplayTitle = () => {
    const title = notification.announcement.title;
    return title.replace(/\[(welcome_pro|upgrade_reminder|expiration_notice)\]/i, '').trim();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[525px]">
        <DialogHeader>
          <div className="flex items-center gap-2">
            {getIcon()}
            <DialogTitle>{getDisplayTitle()}</DialogTitle>
          </div>
          <div className="flex items-center justify-between mt-1">
            <DialogDescription>
              From {notification.announcement.sender.username} • {new Date(notification.announcement.createdAt).toLocaleDateString()}
            </DialogDescription>
            <Badge variant={
              notification.announcement.importance === 'urgent' 
                ? 'destructive' 
                : notification.announcement.importance === 'important'
                  ? 'default'
                  : 'secondary'
            }>
              {notification.announcement.importance}
            </Badge>
          </div>
        </DialogHeader>
        
        <Separator />
        
        <div className="text-sm max-h-[400px] overflow-y-auto py-2">
          {formattedContent}
        </div>
        
        <DialogFooter className="flex items-center gap-2 pt-2">
          <Button
            variant="ghost"
            onClick={() => onOpenChange(false)}
          >
            Close
          </Button>
          <Button
            onClick={handleAction}
            className="gap-2"
          >
            {messageType === 'expiration_notice' && <CreditCard className="h-4 w-4" />}
            {getActionButtonText()}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/**
 * Helper function to extract message type from notification title
 */
function getMessageType(title: string): 'welcome_pro' | 'upgrade_reminder' | 'expiration_notice' | 'other' {
  const typeMatch = title.match(/\[(welcome_pro|upgrade_reminder|expiration_notice)\]/i);
  if (typeMatch) {
    return typeMatch[1] as any;
  }
  
  // Try to detect by keywords
  if (title.toLowerCase().includes('welcome to ghostliai pro')) {
    return 'welcome_pro';
  } else if (title.toLowerCase().includes('upgrade to ghostliai pro')) {
    return 'upgrade_reminder';
  } else if (title.toLowerCase().includes('expiring') || title.toLowerCase().includes('subscription is expiring')) {
    return 'expiration_notice';
  }
  
  return 'other';
}