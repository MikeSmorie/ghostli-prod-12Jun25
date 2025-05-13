import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { useUser } from '@/hooks/use-user';

export interface Announcement {
  id: number;
  title: string;
  content: string;
  importance: 'normal' | 'important' | 'urgent';
  sender: {
    username: string;
  };
  createdAt: string;
  expiresAt?: string;
}

export interface Notification {
  id: number;
  announcementId: number;
  userId: number;
  read: boolean;
  readAt: string | null;
  announcement: Announcement;
}

/**
 * Hook for fetching and managing user notifications
 */
export function useNotifications() {
  const { user } = useUser();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Fetch notifications
  const { 
    data: notifications = [], 
    isLoading,
    error,
    refetch
  } = useQuery<Notification[]>({
    queryKey: ['/api/subscription-notification/notifications'],
    enabled: !!user,
  });

  // Get unread notifications
  const unreadNotifications = notifications.filter(
    notification => !notification.read
  );

  // Mark a notification as read
  const markAsReadMutation = useMutation({
    mutationFn: async (notificationId: number) => {
      const response = await fetch(
        `/api/subscription-notification/notifications/${notificationId}/read`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
        }
      );
      
      if (!response.ok) {
        throw new Error('Failed to mark notification as read');
      }
      
      return notificationId;
    },
    onSuccess: (notificationId) => {
      // Update the cache
      queryClient.setQueryData<Notification[]>(
        ['/api/subscription-notification/notifications'],
        (oldData) => {
          if (!oldData) return [];
          
          return oldData.map((notification) => {
            if (notification.id === notificationId) {
              return {
                ...notification,
                read: true,
                readAt: new Date().toISOString(),
              };
            }
            return notification;
          });
        }
      );
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: 'Failed to mark notification as read',
        variant: 'destructive',
      });
    },
  });

  // Trigger a welcome message
  const triggerWelcomeMutation = useMutation({
    mutationFn: async (subscriptionId: number) => {
      const response = await fetch(
        `/api/subscription-notification/subscription/${subscriptionId}/welcome`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
        }
      );
      
      if (!response.ok) {
        throw new Error('Failed to send welcome message');
      }
      
      return true;
    },
    onSuccess: () => {
      // Refresh notifications
      refetch();
      
      toast({
        title: 'Success',
        description: 'Welcome message sent successfully',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: 'Failed to send welcome message',
        variant: 'destructive',
      });
    },
  });

  // Trigger an upgrade reminder
  const triggerUpgradeReminderMutation = useMutation({
    mutationFn: async (featureTriggered: string) => {
      const response = await fetch(
        `/api/subscription-notification/subscription/upgrade-reminder`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ featureTriggered }),
          credentials: 'include',
        }
      );
      
      if (!response.ok) {
        throw new Error('Failed to send upgrade reminder');
      }
      
      return true;
    },
    onSuccess: () => {
      // Refresh notifications
      refetch();
    },
    onError: (error) => {
      // Don't show error toast as this is typically triggered automatically
      console.error('Failed to send upgrade reminder:', error);
    },
  });

  return {
    notifications,
    unreadNotifications,
    isLoading,
    error,
    refetch,
    markAsRead: markAsReadMutation.mutate,
    triggerWelcome: triggerWelcomeMutation.mutate,
    triggerUpgradeReminder: triggerUpgradeReminderMutation.mutate,
  };
}