import { Trigger } from "deno-slack-sdk/types.ts";
import { LunchParticipantsExtractorDefinition } from "@functions/lunch_participants_extractor.ts";
import {
  TriggerContextData,
  TriggerEventTypes,
  TriggerTypes,
} from "deno-slack-api/mod.ts";

/**
 * アプリメンションイベントトリガー
 * @lunch-scheduler @user1 @user2 形式のメンションでランチスケジューラーを起動
 */
const LunchMessageTrigger: Trigger<
  typeof LunchParticipantsExtractorDefinition.definition
> = {
  type: TriggerTypes.Event,
  name: "ランチスケジューラー",
  description:
    "@lunch-scheduler @user1 @user2 または @lunch-scheduler 2024-07-20 12:30 でランチ調整",
  workflow: "#/workflows/lunch_message_workflow",
  event: {
    event_type: TriggerEventTypes.AppMentioned,
    // 同じワークスペース内のすべてのチャンネルで使用可能
    all_resources: true,
  },
  inputs: {
    message_text: {
      value: TriggerContextData.Event.AppMentioned.text,
    },
    channel_id: {
      value: TriggerContextData.Event.AppMentioned.channel_id,
    },
    user_id: {
      value: TriggerContextData.Event.AppMentioned.user_id,
    },
  },
};

export default LunchMessageTrigger;
