ALTER TABLE "User" ADD COLUMN "paid" varchar(1);--> statement-breakpoint
ALTER TABLE "User" ADD COLUMN "paypalSubscriptionId" varchar(255);--> statement-breakpoint
ALTER TABLE "User" ADD COLUMN "dailyConversationCount" integer DEFAULT 0;--> statement-breakpoint
ALTER TABLE "User" ADD COLUMN "lastConversationDate" date;