

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
        // Fallback or silent return
        return;
    }

    // FIX: Cast options to 'any' to bypass TypeScript's restrictive NotificationOptions type which may lack 'vibrate' or 'badge'
    const options: any = {
        body: body,
        icon: icon || '/icon.svg',
        badge: '/icon.svg',
        vibrate: [200, 100, 200],
        tag: 'sceneit-broadcast',
        renotify: true,
        data: {
            url: url || '/'
        }
    };

    const notification = new Notification(title, options);

    notification.onclick = (event) => {
        event.preventDefault();
        window.focus();
        if (url) {
            window.location.href = url;
        }
        notification.close();
    };
};