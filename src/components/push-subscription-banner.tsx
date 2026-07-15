"use client";

import { useEffect, useState } from "react";
import { savePushSubscription } from "@/app/(app)/right-now-actions";

// Utility to convert Base64 URL safe VAPID key to Uint8Array
function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding)
    .replace(/\-/g, "+")
    .replace(/_/g, "/");

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export function PushSubscriptionBanner() {
  const [isSupported, setIsSupported] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(true); // default true to avoid flash
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if ("serviceWorker" in navigator && "PushManager" in window) {
      setIsSupported(true);
      
      // Check if already subscribed
      navigator.serviceWorker.register("/sw.js").then((registration) => {
        registration.pushManager.getSubscription().then((subscription) => {
          if (subscription) {
            setIsSubscribed(true);
          } else {
            setIsSubscribed(false);
          }
        });
      }).catch(err => console.error("SW Registration failed", err));
    }
  }, []);

  const subscribe = async () => {
    setIsLoading(true);
    try {
      const permission = await Notification.requestPermission();
      if (permission === "granted") {
        const registration = await navigator.serviceWorker.ready;
        const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
        if (!vapidPublicKey) {
          console.error("VAPID public key not found in env");
          setIsLoading(false);
          return;
        }

        const subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
        });

        // Send to server
        const { error } = await savePushSubscription(subscription.toJSON());
        if (!error) {
          setIsSubscribed(true);
        } else {
          console.error("Failed to save subscription:", error);
        }
      }
    } catch (err) {
      console.error("Error subscribing to push notifications:", err);
    }
    setIsLoading(false);
  };

  if (!isSupported || isSubscribed) {
    return null;
  }

  return (
    <div className="mb-6 rounded-xl border border-blue-500/20 bg-blue-500/5 px-5 py-4 flex items-center justify-between">
      <div>
        <p className="text-sm font-medium text-blue-400">Enable Notifications</p>
        <p className="mt-0.5 text-xs text-text-muted">
          Get pinged exactly when it's time to lock in.
        </p>
      </div>
      <button
        onClick={subscribe}
        disabled={isLoading}
        className="hover-border bg-card px-3 py-1.5 text-xs font-medium text-text-primary transition-colors hover:bg-card-alt disabled:opacity-50"
      >
        {isLoading ? "Enabling..." : "Enable"}
      </button>
    </div>
  );
}
