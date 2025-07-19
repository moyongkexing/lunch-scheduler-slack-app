import { DefineFunction, Schema, SlackFunction } from "deno-slack-sdk/mod.ts";
import type { SampleObjectDatastore } from "@datastores/sample_datastore.ts";

export const LunchBookingProcessorDefinition = DefineFunction({
  callback_id: "lunch_booking_processor",
  title: "ランチ予約処理",
  description: "ランチ予約情報を処理する関数",
  source_file: "functions/lunch_booking_processor.ts",
  input_parameters: {
    properties: {
      message: {
        type: Schema.types.string,
        description: "予約メッセージ",
      },
      user: {
        type: Schema.slack.types.user_id,
        description: "予約したユーザー",
      },
      lunchData: {
        type: Schema.types.object,
        description: "ランチ予約データ",
        properties: {
          purpose: { type: Schema.types.string },
          datetime: { type: Schema.types.string },
          participants: {
            type: Schema.types.array,
            items: { type: Schema.slack.types.user_id },
          },
          has_mentions: { type: Schema.types.boolean },
          has_datetime: { type: Schema.types.boolean },
        },
      },
    },
    required: ["message", "user"],
  },
  output_parameters: {
    properties: {
      updatedMsg: {
        type: Schema.types.string,
        description: "整形された予約確認メッセージ",
      },
    },
    required: ["updatedMsg"],
  },
});

export const LunchBookingProcessor = SlackFunction(
  LunchBookingProcessorDefinition,
  async ({ inputs, client }) => {
    const uuid = crypto.randomUUID();
    const { lunchData } = inputs;
    const datetime = lunchData?.datetime || "";
    const participants = lunchData?.participants || [];
    const has_mentions = lunchData?.has_mentions || false;
    const has_datetime = lunchData?.has_datetime || false;

    let updatedMsg = "";

    // 無効なコマンドの場合
    if (!has_datetime && !has_mentions) {
      updatedMsg =
        "❌ 使用例: `/lunch @user1 @user2` または `/lunch 2024-07-20 12:30`";
    } // パターン1: 日時のみ指定 - その時刻に空いているユーザーを探す
    else if (has_datetime && !has_mentions) {
      updatedMsg = `🍽️ **ランチ参加者募集**

👤 **投稿者**: <@${inputs.user}>
📅 **日時**: ${datetime}
👥 **参加者**: 募集中

${datetime}にランチできる方はリアクションしてください！ 🎉`;
    } // パターン2: メンションのみ指定 - その人たちで空いている時間を探す
    else if (has_mentions && !has_datetime) {
      const participantsList = participants.map((p) => `<@${p}>`).join(", ");
      updatedMsg = `🍽️ **ランチ日程調整**

👤 **投稿者**: <@${inputs.user}>
👥 **参加者**: ${participantsList}
📅 **日時**: 調整中

みんなでランチしませんか？都合の良い日時を教えてください！ 🗓️`;
    } // パターン3: 日時とメンション両方指定 - その人たちがその時刻に参加可能かチェック
    else if (has_datetime && has_mentions) {
      const participantsList = participants.map((p) => `<@${p}>`).join(", ");
      updatedMsg = `🍽️ **ランチ参加確認**

👤 **投稿者**: <@${inputs.user}>
📅 **日時**: ${datetime}
👥 **参加者**: ${participantsList}

${datetime}のランチに参加できますか？\n参加可能な方はリアクションしてください！ ✅`;
    }

    const sampleObject = {
      booking_id: uuid,
      user_id: inputs.user,
      lunch_datetime: datetime,
      participants: participants.join(","),
      channel: "",
      created_at: new Date().toISOString(),
    };

    // 予約データをデータストアに保存
    const putResponse = await client.apps.datastore.put<
      typeof SampleObjectDatastore.definition
    >({
      datastore: "LunchBookings",
      item: sampleObject,
    });

    if (!putResponse.ok) {
      return {
        error: `データストアへの保存に失敗しました: ${putResponse.error}`,
      };
    }

    return { outputs: { updatedMsg } };
  },
);

export default LunchBookingProcessor;
