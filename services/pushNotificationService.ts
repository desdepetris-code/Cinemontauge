export const requestNotificationPermission = async (): Promise<NotificationPermission> => {
    if (!('Notification' in window)) {
        console.warn("This browser does not support desktop notification");
        return 'denied';
    }

    if (Notification.permission === 'granted') {
        return 'granted';
    }

    const permission = await Notification.requestPermission();
    return permission;
};

export const triggerLocalNotification = async (title: string, body: string, icon?: string, url?: string) => {
    if (!('Notification' in window) || Notification.permission !== 'granted') {
        // Fallback to alert if permission not granted
        console.info(`CineMontauge Notification: ${title} - ${body}`);
        return;
    }

    const options: any = {
        body: body,
        icon: icon || '/icon.svg',
        badge: '/icon.svg',
        vibrate: [200, 100, 200],
        tag: 'sceneit-reminder',
        renotify: true,
        requireInteraction: true, // Keep it visible until the user interacts
        data: {
            url: url || '/'
        }
    };

    try {
        const notification = new Notification(title, options);

        notification.onclick = (event) => {
            event.preventDefault();
            window.focus();
            if (url) {
                window.location.href = url;
            }
            notification.close();
        };
    } catch (e) {
        console.error("Local notification trigger failed", e);
    }
};