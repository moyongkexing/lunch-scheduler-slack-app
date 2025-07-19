import { DefineWorkflow, Schema } from "deno-slack-sdk/mod.ts";
import { LunchParticipantsExtractorDefinition } from "@functions/lunch_participants_extractor.ts";
import { LunchBookingProcessorDefinition } from "@functions/lunch_booking_processor.ts";

/**
 * 統合ランチスケジューラーワークフロー
 * @lunch-scheduler @user1 @user2 メンションを処理してランチ予約を完了
 */
export const LunchMessageWorkflow = DefineWorkflow({
  callback_id: "lunch_message_workflow",
  title: "ランチスケジューラー（メンション版）",
  description:
    "@lunch-scheduler @user1 @user2 または @lunch-scheduler 2024-07-20 12:30 形式でランチを調整",
  input_parameters: {
    properties: {
      message_text: {
        type: Schema.types.string,
        description: "メッセージのテキスト",
      },
      channel_id: {
        type: Schema.slack.types.channel_id,
        description: "メッセージが投稿されたチャンネル",
      },
      user_id: {
        type: Schema.slack.types.user_id,
        description: "メッセージを投稿したユーザー",
      },
    },
    required: ["message_text", "channel_id", "user_id"],
  },
});

/**
 * Step 1: メッセージから参加者と日時を抽出
 */
const extractDataStep = LunchMessageWorkflow.addStep(
  LunchParticipantsExtractorDefinition,
  {
    message_text: LunchMessageWorkflow.inputs.message_text,
    channel_id: LunchMessageWorkflow.inputs.channel_id,
    user_id: LunchMessageWorkflow.inputs.user_id,
  },
);

/**
 * Step 2: ランチデータ処理
 */
const processLunchData = LunchMessageWorkflow.addStep(
  LunchBookingProcessorDefinition,
  {
    message: "ランチスケジューラー",
    user: LunchMessageWorkflow.inputs.user_id,
    lunchData: {
      purpose: "schedule_check", // 空き時間チェック用途
      datetime: extractDataStep.outputs.extracted_datetime,
      participants: extractDataStep.outputs.extracted_users,
      has_mentions: extractDataStep.outputs.has_mentions,
      has_datetime: extractDataStep.outputs.has_datetime,
    },
  },
);

/**
 * Step 3: 結果メッセージ送信
 */
LunchMessageWorkflow.addStep(
  Schema.slack.functions.SendMessage,
  {
    channel_id: LunchMessageWorkflow.inputs.channel_id,
    message: processLunchData.outputs.updatedMsg,
  },
);
