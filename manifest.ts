import { Manifest } from "deno-slack-sdk/mod.ts";
import { LunchMessageWorkflow } from "@workflows/lunch_message_workflow.ts";
import { SampleObjectDatastore } from "@datastores/sample_datastore.ts";
import { LunchParticipantsExtractorDefinition } from "@functions/lunch_participants_extractor.ts";
import { LunchBookingProcessorDefinition } from "@functions/lunch_booking_processor.ts";
import { UserEmailExtractorDefinition } from "@functions/user_email_extractor.ts";
import { GoogleCalendarClientDefinition } from "@functions/google_calendar_client.ts";

/**
 * アプリマニフェストにはアプリの設定が含まれています。
 * このファイルではアプリ名や説明などの属性を定義します。
 * https://api.slack.com/automation/manifest
 */
export default Manifest({
  name: "lunch-scheduler-20250720",
  description: "ランチスケジューラー - ランチ予約アプリ",
  icon: "assets/default_new_app_icon.png",
  functions: [
    LunchParticipantsExtractorDefinition,
    LunchBookingProcessorDefinition,
    UserEmailExtractorDefinition,
    GoogleCalendarClientDefinition,
  ],
  workflows: [LunchMessageWorkflow],
  datastores: [SampleObjectDatastore],
  botScopes: [
    "commands",
    "chat:write",
    "chat:write.public",
    "datastore:read",
    "datastore:write",
    "channels:history",
    "groups:history",
    "im:history",
    "mpim:history",
    "app_mentions:read",
    "users:read",
    "users:read.email",
  ],
});
