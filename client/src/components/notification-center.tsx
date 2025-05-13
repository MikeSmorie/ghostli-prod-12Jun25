import React, { useState } from 'react';
import { Bell, Check, Info, AlertCircle, AlertTriangle } from 'lucide-react';
import { useNotifications, Notification } from '@/hooks/use-notifications';
import { SubscriptionMessageDialog } from '@/components/subscription-message-dialog';
import { 
  Popover, 
  PopoverContent, 
  PopoverTrigger 
} from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Card, 
  CardHeader, 
  CardTitle, 
  CardDescription, 
  CardContent, 
  CardFooter 
} from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';

/**
 * Helper function to check if a notification is subscription-related
 */
const isSubscriptionNotification = (title: string): boolean => {
  // Check for subscription message type identifiers in the title
  const subscriptionIdentifiers = [
    'welcome_pro',
    'upgrade_reminder',
    'expiration_notice',
  ];
  
  return subscriptionIdentifiers.some(identifier => 
    title.toLowerCase().includes(identifier)
  );
};

/**
 * Notification Center component that shows user notifications
 * with special handling for subscription-related messages
 */
export function NotificationCenter() {
  const [open, setOpen] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedNotification, setSelectedNotification] = useState<Notification | null>(null);
  const { 
    notifications, 
    unreadNotifications, 
    isLoading, 
    markAsRead 
  } = useNotifications();

  // Handle clicking on a notification
  const handleNotificationClick = (notification: Notification) => {
    // Mark it as read if it's not read yet
    if (!notification.read) {
      markAsRead(notification.id);
    }
    
    // Check if this is a subscription-related notification
    if (isSubscriptionNotification(notification.announcement.title)) {
      setSelectedNotification(notification);
      setDialogOpen(true);
      setOpen(false); // Close the popover
    }
  };

  // Get icon based on importance
  const getNotificationIcon = (importance: string) => {
    switch (importance) {
      case 'urgent':
        return <AlertCircle className="h-5 w-5 text-destructive" />;
      case 'important':
        return <AlertTriangle className="h-5 w-5 text-amber-500" />;
      default:
        return <Info className="h-5 w-5 text-muted-foreground" />;
    }
  };

  // Check if notification is related to subscriptions
  const isSubscriptionNotification = (title: string) => {
    const subscriptionKeywords = [
      'welcome_pro',
      'upgrade_reminder',
      'expiration_notice',
      'subscription',
      'pro',
      'premium',
      'plan',
      'payment'
    ];
    
    return subscriptionKeywords.some(keyword => 
      title.toLowerCase().includes(keyword)
    );
  };

  // Format notification date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <>
      <SubscriptionMessageDialog
        notification={selectedNotification}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onMarkAsRead={markAsRead}
      />
      
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button 
            variant="outline" 
            size="icon" 
            className="relative"
            aria-label="Notifications"
          >
          <Bell className="h-5 w-5" />
          {unreadNotifications.length > 0 && (
            <Badge 
              variant="destructive" 
              className="absolute -top-2 -right-2 px-1.5 min-w-5 h-5 flex items-center justify-center rounded-full text-[10px]"
            >
              {unreadNotifications.length}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent 
        align="end" 
        className="w-[380px] p-0"
      >
        <div className="p-4 border-b">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-medium">Notifications</h4>
            {unreadNotifications.length > 0 && (
              <Badge variant="secondary" className="ml-auto">
                {unreadNotifications.length} unread
              </Badge>
            )}
          </div>
        </div>
        
        <ScrollArea className="h-[calc(80vh-150px)] max-h-[500px]">
          <div className="py-2">
            {isLoading ? (
              <div className="flex justify-center items-center p-4">
                <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full"></div>
              </div>
            ) : notifications.length === 0 ? (
              <div className="text-center py-8 px-4">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                  <Bell className="h-6 w-6 text-muted-foreground" />
                </div>
                <h3 className="mt-4 text-sm font-medium">No notifications</h3>
                <p className="mt-2 text-xs text-muted-foreground">
                  When you receive notifications, they'll appear here.
                </p>
              </div>
            ) : (
              notifications.map((notification) => (
                <div 
                  key={notification.id} 
                  className="px-4 py-3 hover:bg-muted/50 transition-colors cursor-pointer"
                  onClick={() => handleNotificationClick(notification)}
                >
                  <div className="flex gap-3">
                    <div className="flex-shrink-0 pt-0.5">
                      {getNotificationIcon(notification.announcement.importance)}
                    </div>
                    <div className="flex-1 space-y-1">
                      <div className="flex items-start justify-between gap-2">
                        <p className={`text-sm font-medium leading-none ${notification.read ? 'text-muted-foreground' : 'text-foreground'}`}>
                          {notification.announcement.title.replace(/\[(welcome_pro|upgrade_reminder|expiration_notice)\]/i, '')}
                        </p>
                        {!notification.read && (
                          <div className="rounded-full w-2 h-2 bg-primary mt-1 flex-shrink-0"></div>
                        )}
                      </div>
                      
                      <p className="text-xs text-muted-foreground">
                        {formatDate(notification.announcement.createdAt)}
                      </p>
                      
                      {isSubscriptionNotification(notification.announcement.title) && (
                        <div className="mt-2">
                          <p className="text-xs whitespace-pre-wrap line-clamp-3">
                            {notification.announcement.content.split('\n\n')[0]}
                          </p>
                          
                          {!notification.read && (
                            <Button 
                              size="sm" 
                              variant="ghost" 
                              className="mt-2 h-8 text-xs"
                            >
                              <Check className="h-3.5 w-3.5 mr-1" />
                              Mark as read
                            </Button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </ScrollArea>
        
        {notifications.length > 0 && (
          <div className="p-4 border-t text-xs text-center text-muted-foreground">
            Click on a notification to mark it as read
          </div>
        )}
      </PopoverContent>
    </Popover>
    </>
  );
}