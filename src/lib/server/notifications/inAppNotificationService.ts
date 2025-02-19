import type { NodePgDatabase } from "drizzle-orm/node-postgres";
import { inAppNotificationsTable } from "../database/schemas/notification";
import { and, eq, sql } from "drizzle-orm/sql";
import { desc } from "drizzle-orm";

type CreateNotificationParams = {
  userId: string;
  message: string;
  resourceUrl: string;
  batchId?: string;
};

type BatchNotificationParams = {
  userIds: string[];
  message: string;
  resourceUrl: string;
};

type GetNotificationsParams = {
  status?: 'UNREAD' | 'READ';
  limit?: number;
  offset?: number;
};

export class NotificationService {
  constructor(private db: NodePgDatabase<Record<string, never>>) { }

  async createNotification({
    userId,
    message,
    resourceUrl,
    batchId
  }: CreateNotificationParams) {
    const id = crypto.randomUUID();
    return await this.db.insert(inAppNotificationsTable).values({
      id,
      userId,
      message,
      resourceUrl,
      status: 'UNREAD',
      batchId
    }).returning();
  }

  async createBatchNotifications(notifications: BatchNotificationParams[]) {
    const batchId = crypto.randomUUID();

    return await this.db.transaction(async (tx) => {
      const results = await Promise.all(
        notifications.flatMap(notification =>
          notification.userIds.map(userId => {
            const id = crypto.randomUUID();

            return tx.insert(inAppNotificationsTable).values({
              id,
              userId,
              message: notification.message,
              resourceUrl: notification.resourceUrl,
              status: 'UNREAD',
              batchId
            }).returning()
          }
          )
        )
      );

      return {
        batchId,
        notifications: results.flat()
      };
    });
  }

  async markAsRead(notificationId: string) {
    return await this.db
      .update(inAppNotificationsTable)
      .set({
        status: 'READ',
        readAt: new Date()
      })
      .where(eq(inAppNotificationsTable.id, notificationId))
      .returning();
  }

  async markBatchAsRead(batchId: string, userId: string) {
    return await this.db.transaction(async (tx) => {
      const updatedNotifications = await tx
        .update(inAppNotificationsTable)
        .set({
          status: 'READ',
          readAt: new Date()
        })
        .where(
          and(
            eq(inAppNotificationsTable.batchId, batchId),
            eq(inAppNotificationsTable.userId, userId)
          )
        )
        .returning();

      const unreadCount = await tx
        .select({ count: sql<number>`count(*)` })
        .from(inAppNotificationsTable)
        .where(
          and(
            eq(inAppNotificationsTable.userId, userId),
            eq(inAppNotificationsTable.status, 'UNREAD')
          )
        );

      return {
        updatedNotifications,
        remainingUnread: unreadCount[0].count
      };
    });
  }

  async getUserNotifications(
    userId: string,
    { limit = 20, offset = 0 }: GetNotificationsParams
  ) {
    let query = this.db
      .select()
      .from(inAppNotificationsTable)
      .where(eq(inAppNotificationsTable.userId, userId))
      .orderBy(desc(inAppNotificationsTable.createdAt))
      .limit(limit)
      .offset(offset);

    return await query;
  }

  async getUnreadCount(userId: string) {
    const result = await this.db
      .select({ count: sql<number>`count(*)` })
      .from(inAppNotificationsTable)
      .where(
        and(
          eq(inAppNotificationsTable.userId, userId),
          eq(inAppNotificationsTable.status, 'UNREAD')
        )
      );

    return result[0].count;
  }

  async getBatchNotifications(batchId: string, userId: string) {
    return await this.db
      .select()
      .from(inAppNotificationsTable)
      .where(
        and(
          eq(inAppNotificationsTable.batchId, batchId),
          eq(inAppNotificationsTable.userId, userId)
        )
      )
      .orderBy(desc(inAppNotificationsTable.createdAt));
  }

  async getBatchUnreadCount(batchId: string, userId: string) {
    const result = await this.db
      .select({ count: sql<number>`count(*)` })
      .from(inAppNotificationsTable)
      .where(
        and(
          eq(inAppNotificationsTable.batchId, batchId),
          eq(inAppNotificationsTable.userId, userId),
          eq(inAppNotificationsTable.status, 'UNREAD')
        )
      );

    return result[0].count;
  }
}