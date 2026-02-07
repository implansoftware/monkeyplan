import { storage } from "../storage";
import type { ExpoPushToken, PushNotificationLog } from "@shared/schema";

const EXPO_PUSH_URL = "https://exp.host/--/api/v2/push/send";
const EXPO_RECEIPTS_URL = "https://exp.host/--/api/v2/push/getReceipts";
const BATCH_SIZE = 100;
const MAX_RETRIES = 3;
const RETRY_DELAYS = [1000, 5000, 15000]; // 1s, 5s, 15s

interface ExpoPushMessage {
  to: string;
  title: string;
  body: string;
  data?: Record<string, unknown>;
  sound?: "default" | null;
  priority?: "default" | "normal" | "high";
  channelId?: string;
}

interface ExpoPushTicket {
  status: "ok" | "error";
  id?: string;
  message?: string;
  details?: { error?: string };
}

interface ExpoPushReceipt {
  status: "ok" | "error";
  message?: string;
  details?: { error?: string };
}

interface PushQueueItem {
  userId: string;
  title: string;
  body: string;
  data?: Record<string, unknown>;
  retryCount: number;
}

const pushQueue: PushQueueItem[] = [];
let isProcessing = false;

export async function enqueuePushNotification(
  userId: string,
  title: string,
  body: string,
  data?: Record<string, unknown>
): Promise<void> {
  const prefs = await storage.getNotificationPreferences(userId);
  if (prefs && !prefs.pushEnabled) {
    return;
  }

  const tokens = await storage.getPushTokensByUserId(userId);
  if (tokens.length === 0) {
    return;
  }

  pushQueue.push({ userId, title, body, data, retryCount: 0 });
  processQueue();
}

async function processQueue(): Promise<void> {
  if (isProcessing || pushQueue.length === 0) return;
  isProcessing = true;

  try {
    while (pushQueue.length > 0) {
      const item = pushQueue.shift()!;
      try {
        await sendPushToUser(item);
      } catch (err) {
        if (item.retryCount < MAX_RETRIES) {
          const delay = RETRY_DELAYS[item.retryCount] || RETRY_DELAYS[RETRY_DELAYS.length - 1];
          item.retryCount++;
          setTimeout(() => {
            pushQueue.push(item);
            processQueue();
          }, delay);
          console.error(`[ExpoPush] Send failed for user ${item.userId}, retry #${item.retryCount} in ${delay}ms:`, (err as Error).message);
        } else {
          console.error(`[ExpoPush] Send permanently failed for user ${item.userId} after ${MAX_RETRIES} retries:`, (err as Error).message);
        }
      }
    }
  } finally {
    isProcessing = false;
  }
}

async function sendPushToUser(item: PushQueueItem): Promise<void> {
  const tokens = await storage.getPushTokensByUserId(item.userId);
  if (tokens.length === 0) return;

  const messages: ExpoPushMessage[] = tokens.map((t) => ({
    to: t.token,
    title: item.title,
    body: item.body,
    data: item.data,
    sound: "default" as const,
    priority: "high" as const,
    channelId: "default",
  }));

  for (let i = 0; i < messages.length; i += BATCH_SIZE) {
    const batch = messages.slice(i, i + BATCH_SIZE);
    const batchTokens = tokens.slice(i, i + BATCH_SIZE);

    try {
      const response = await fetch(EXPO_PUSH_URL, {
        method: "POST",
        headers: {
          "Accept": "application/json",
          "Accept-Encoding": "gzip, deflate",
          "Content-Type": "application/json",
        },
        body: JSON.stringify(batch),
      });

      if (!response.ok) {
        throw new Error(`Expo Push API returned ${response.status}: ${await response.text()}`);
      }

      const result = await response.json() as { data: ExpoPushTicket[] };
      const tickets = result.data;

      for (let j = 0; j < tickets.length; j++) {
        const ticket = tickets[j];
        const token = batchTokens[j];

        const logEntry = await storage.createPushNotificationLog({
          userId: item.userId,
          tokenId: token.id,
          title: item.title,
          body: item.body,
          data: item.data ? JSON.stringify(item.data) : null,
          expoTicketId: ticket.id || null,
          status: ticket.status === "ok" ? "sent" : "failed",
          errorMessage: ticket.message || null,
          retryCount: item.retryCount,
          nextRetryAt: null,
          receiptCheckedAt: null,
        });

        if (ticket.status === "error" && ticket.details?.error === "DeviceNotRegistered") {
          await storage.removeExpiredPushToken(token.token);
          await storage.updatePushNotificationLog(logEntry.id, {
            status: "device_not_registered",
          });
          console.log(`[ExpoPush] Removed expired token for user ${item.userId}: ${token.token.substring(0, 20)}...`);
        }
      }
    } catch (err) {
      for (const token of batchTokens) {
        await storage.createPushNotificationLog({
          userId: item.userId,
          tokenId: token.id,
          title: item.title,
          body: item.body,
          data: item.data ? JSON.stringify(item.data) : null,
          expoTicketId: null,
          status: "failed",
          errorMessage: (err as Error).message,
          retryCount: item.retryCount,
          nextRetryAt: new Date(Date.now() + (RETRY_DELAYS[item.retryCount] || 15000)),
          receiptCheckedAt: null,
        });
      }
      throw err;
    }
  }
}

export async function checkPushReceipts(): Promise<void> {
  const pendingLogs = await storage.getPendingReceipts();
  if (pendingLogs.length === 0) return;

  const ticketIds = pendingLogs
    .filter((l) => l.expoTicketId)
    .map((l) => l.expoTicketId!);

  if (ticketIds.length === 0) return;

  try {
    const response = await fetch(EXPO_RECEIPTS_URL, {
      method: "POST",
      headers: {
        "Accept": "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ ids: ticketIds }),
    });

    if (!response.ok) {
      console.error(`[ExpoPush] Receipts API returned ${response.status}`);
      return;
    }

    const result = await response.json() as { data: Record<string, ExpoPushReceipt> };
    const receipts = result.data;

    for (const log of pendingLogs) {
      if (!log.expoTicketId || !receipts[log.expoTicketId]) continue;

      const receipt = receipts[log.expoTicketId];

      if (receipt.status === "ok") {
        await storage.updatePushNotificationLog(log.id, {
          status: "delivered",
          receiptCheckedAt: new Date(),
        });
      } else if (receipt.status === "error") {
        const newStatus = receipt.details?.error === "DeviceNotRegistered"
          ? "device_not_registered" as const
          : "failed" as const;

        await storage.updatePushNotificationLog(log.id, {
          status: newStatus,
          errorMessage: receipt.message || receipt.details?.error || "Unknown error",
          receiptCheckedAt: new Date(),
        });

        if (receipt.details?.error === "DeviceNotRegistered") {
          const tokenRecord = pendingLogs.find((l) => l.id === log.id);
          if (tokenRecord) {
            const tokens = await storage.getPushTokensByUserId(tokenRecord.userId);
            const matchingToken = tokens.find((t) => t.id === tokenRecord.tokenId);
            if (matchingToken) {
              await storage.removeExpiredPushToken(matchingToken.token);
              console.log(`[ExpoPush] Receipt: removed expired token ${matchingToken.token.substring(0, 20)}...`);
            }
          }
        }
      }
    }

    console.log(`[ExpoPush] Checked ${Object.keys(receipts).length} receipts`);
  } catch (err) {
    console.error("[ExpoPush] Failed to check receipts:", (err as Error).message);
  }
}

export async function retryFailedPushNotifications(): Promise<void> {
  const retryable = await storage.getRetryablePushNotifications();
  if (retryable.length === 0) return;

  for (const log of retryable) {
    const tokens = await storage.getPushTokensByUserId(log.userId);
    const token = tokens.find((t) => t.id === log.tokenId);
    if (!token) {
      await storage.updatePushNotificationLog(log.id, {
        status: "device_not_registered",
        errorMessage: "Token no longer exists",
      });
      continue;
    }

    try {
      const response = await fetch(EXPO_PUSH_URL, {
        method: "POST",
        headers: {
          "Accept": "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify([{
          to: token.token,
          title: log.title,
          body: log.body,
          data: log.data ? JSON.parse(log.data) : undefined,
          sound: "default",
          priority: "high",
          channelId: "default",
        }]),
      });

      if (!response.ok) {
        throw new Error(`Expo Push API returned ${response.status}`);
      }

      const result = await response.json() as { data: ExpoPushTicket[] };
      const ticket = result.data[0];

      await storage.updatePushNotificationLog(log.id, {
        expoTicketId: ticket.id || null,
        status: ticket.status === "ok" ? "sent" : "failed",
        errorMessage: ticket.message || null,
        retryCount: log.retryCount + 1,
        nextRetryAt: ticket.status === "ok"
          ? null
          : new Date(Date.now() + (RETRY_DELAYS[log.retryCount] || 15000)),
      });

      if (ticket.status === "error" && ticket.details?.error === "DeviceNotRegistered") {
        await storage.removeExpiredPushToken(token.token);
        await storage.updatePushNotificationLog(log.id, {
          status: "device_not_registered",
        });
      }
    } catch (err) {
      await storage.updatePushNotificationLog(log.id, {
        retryCount: log.retryCount + 1,
        nextRetryAt: log.retryCount + 1 < MAX_RETRIES
          ? new Date(Date.now() + (RETRY_DELAYS[log.retryCount] || 15000))
          : null,
        errorMessage: (err as Error).message,
      });
    }
  }

  console.log(`[ExpoPush] Retried ${retryable.length} failed notifications`);
}

let receiptsInterval: ReturnType<typeof setInterval> | null = null;
let retryInterval: ReturnType<typeof setInterval> | null = null;

export function startPushNotificationJobs(): void {
  receiptsInterval = setInterval(checkPushReceipts, 15 * 60 * 1000);
  retryInterval = setInterval(retryFailedPushNotifications, 5 * 60 * 1000);
  console.log("[ExpoPush] Started push notification jobs (receipts: 15min, retry: 5min)");
}

export function stopPushNotificationJobs(): void {
  if (receiptsInterval) clearInterval(receiptsInterval);
  if (retryInterval) clearInterval(retryInterval);
}
