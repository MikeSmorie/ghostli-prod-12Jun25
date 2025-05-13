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
        return (
          <div className="h-8 w-8 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
            <Crown className="h-5 w-5 text-amber-500" />
          </div>
        );
      case 'upgrade_reminder':
        return (
          <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
            <AlertCircle className="h-5 w-5 text-primary" />
          </div>
        );
      case 'expiration_notice':
        return (
          <div className="h-8 w-8 rounded-full bg-destructive/10 flex items-center justify-center">
            <AlertTriangle className="h-5 w-5 text-destructive" />
          </div>
        );
      default:
        return (
          <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center">
            <Info className="h-5 w-5 text-muted-foreground" />
          </div>
        );
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
        
        <div className="text-sm max-h-[400px] overflow-y-auto py-4">
          {messageType === 'welcome_pro' ? (
            <div className="space-y-4">
              <div className="bg-amber-50 dark:bg-amber-950/20 p-4 rounded-md border border-amber-100 dark:border-amber-800/30">
                <h3 className="font-medium text-amber-700 dark:text-amber-400 flex items-center gap-2 mb-2">
                  <Crown className="h-4 w-4" /> Welcome to GhostliAI Pro
                </h3>
                <p className="text-amber-700/80 dark:text-amber-400/80">
                  Your Pro subscription is now active! Enjoy all the premium features and benefits.
                </p>
              </div>
              {formattedContent}
            </div>
          ) : messageType === 'upgrade_reminder' ? (
            <div className="space-y-4">
              <div className="bg-primary/5 p-4 rounded-md border border-primary/10">
                <h3 className="font-medium text-primary flex items-center gap-2 mb-2">
                  <AlertCircle className="h-4 w-4" /> Premium Features Await
                </h3>
                <p className="text-primary/80">
                  Upgrade to GhostliAI Pro to unlock all the premium features and take your content generation to the next level.
                </p>
              </div>
              {formattedContent}
            </div>
          ) : messageType === 'expiration_notice' ? (
            <div className="space-y-4">
              <div className="bg-destructive/5 p-4 rounded-md border border-destructive/10">
                <h3 className="font-medium text-destructive flex items-center gap-2 mb-2">
                  <AlertTriangle className="h-4 w-4" /> Subscription Expiring Soon
                </h3>
                <p className="text-destructive/80">
                  Your Pro subscription is about to expire. Renew now to maintain uninterrupted access to premium features.
                </p>
              </div>
              {formattedContent}
            </div>
          ) : (
            formattedContent
          )}
        </div>
        
        <DialogFooter className="flex items-center gap-2 pt-3">
          <Button
            variant="ghost"
            onClick={() => onOpenChange(false)}
          >
            Dismiss
          </Button>
          
          {messageType === 'welcome_pro' && (
            <Button
              onClick={handleAction}
              className="gap-2 bg-amber-500 hover:bg-amber-600 text-white"
            >
              <Crown className="h-4 w-4" />
              {getActionButtonText()}
            </Button>
          )}
          
          {messageType === 'upgrade_reminder' && (
            <Button
              onClick={handleAction}
              className="gap-2 bg-primary hover:bg-primary/90 text-primary-foreground"
            >
              <AlertCircle className="h-4 w-4" />
              {getActionButtonText()}
            </Button>
          )}
          
          {messageType === 'expiration_notice' && (
            <Button
              onClick={handleAction}
              className="gap-2 bg-destructive hover:bg-destructive/90"
            >
              <CreditCard className="h-4 w-4" />
              {getActionButtonText()}
            </Button>
          )}
          
          {messageType === 'other' && (
            <Button onClick={handleAction} className="gap-2">
              {getActionButtonText()}
            </Button>
          )}
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