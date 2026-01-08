/*
* Service Worker for Clair Push Notifications
*/

self.addEventListener('push', function(event) {
  console.log('[Service Worker] Push Received.');
  console.log(`[Service Worker] Push had this data: "${event.data.text()}"`);

  let data = {};
  try {
    data = event.data.json();
  } catch (e) {
    data = { title: 'Incoming Call', body: event.data.text() };
  }

  const title = data.title || 'Clair Call';
  const isMissedCall = data.notificationType === 'missed_call';
  
  const options = {
    body: data.body || 'Someone is calling you',
    icon: data.icon || '/favicon.ico',
    badge: '/favicon.ico',
    data: data.url || '/app/calls',
    actions: isMissedCall ? [
      { action: 'open', title: 'View' },
      { action: 'close', title: 'Dismiss' }
    ] : [
      { action: 'open', title: 'Answer' },
      { action: 'close', title: 'Dismiss' }
    ],
    vibrate: isMissedCall ? [100] : [200, 100, 200, 100, 200, 100, 200],
    tag: 'call-notification',
    renotify: true
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', function(event) {
  console.log('[Service Worker] Notification click Received.');

  event.notification.close();

  if (event.action === 'close') return;

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function(clientList) {
      for (let i = 0; i < clientList.length; i++) {
        let client = clientList[i];
        if (client.url === '/' && 'focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(event.notification.data);
      }
    })
  );
});
