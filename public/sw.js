self.addEventListener("push", (event) => {
  if (!event.data) return;

  try {
    const payload = event.data.json();
    const title = payload.title || "Task Reminder";
    const options = {
      body: payload.body || "It's time to lock in.",
      icon: "/icon.png", // Assuming an icon exists or will fallback
      badge: "/badge.png", // Assuming a badge exists or will fallback
      requireInteraction: true,
      data: {
        taskId: payload.taskId,
      },
    };

    event.waitUntil(self.registration.showNotification(title, options));
  } catch (err) {
    console.error("Error parsing push payload", err);
  }
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  const taskId = event.notification.data?.taskId;
  const targetUrl = taskId ? `/tasks/${taskId}` : "/";

  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
      // Check if there's already a window open with this URL
      for (const client of clientList) {
        if (client.url.includes(targetUrl) && "focus" in client) {
          return client.focus();
        }
      }
      
      // If not exactly the URL but there is an app window open, focus and navigate
      for (const client of clientList) {
        if (client.url.startsWith(self.registration.scope) && "focus" in client) {
          client.navigate(targetUrl);
          return client.focus();
        }
      }

      // If no windows are open, open a new one
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    })
  );
});
