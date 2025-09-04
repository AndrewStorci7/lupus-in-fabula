import { Button } from "@types";

export const NOTIFICATIONS_TYPES = ['error', 'info', 'completed', 'warning'] as const;
export type NotificationsTypes = typeof NOTIFICATIONS_TYPES[number];

export const NOTIFICATIONS_PURPOSES = ['alert', 'notification'] as const;
export type NotificationPurpose = typeof NOTIFICATIONS_PURPOSES[number];

export type NotificationType = {
    show?: boolean;
    purpose?: NotificationPurpose;
    type?: NotificationsTypes;
    title?: string;
    message?: string | React.ReactNode | null;
    customIcon?: React.ReactNode;
    duration?: number;
    buttons?: Button[]
}

export type NotificationContent = {
    title?: string, 
    message?: string | React.ReactNode, 
    reactNode?: React.ReactNode | null, 
    customIcon?: React.ReactNode | null, 
    duration?: number
    buttons?: Button[]
}