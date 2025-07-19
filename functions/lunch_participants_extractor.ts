import { DefineFunction, Schema, SlackFunction } from "deno-slack-sdk/mod.ts";

/**
 * ランチ参加者抽出関数
 * @lunch-scheduler @user1 @user2 形式のメンションから参加者を抽出
 */
export const LunchParticipantsExtractorDefinition = DefineFunction({
  callback_id: "lunch_participants_extractor",
  title: "ランチ参加者抽出",
  description: "ランチアプリメンションから参加者のユーザーIDを抽出",
  source_file: "functions/lunch_participants_extractor.ts",
  input_parameters: {
    properties: {
      message_text: {
        type: Schema.types.string,
        description: "メッセージのテキスト部分",
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
  output_parameters: {
    properties: {
      extracted_users: {
        type: Schema.types.array,
        items: { type: Schema.slack.types.user_id },
        description: "抽出されたユーザーIDリスト",
      },
      extracted_datetime: {
        type: Schema.types.string,
        description: "抽出された日時文字列（YYYY-MM-DD HH:MM形式）",
      },
      has_mentions: {
        type: Schema.types.boolean,
        description: "メッセージにユーザーメンションが含まれているか",
      },
      has_datetime: {
        type: Schema.types.boolean,
        description: "メッセージに日時が含まれているか",
      },
      should_start_workflow: {
        type: Schema.types.boolean,
        description: "ワークフローを開始するかどうか",
      },
    },
    required: [
      "extracted_users",
      "extracted_datetime",
      "has_mentions",
      "has_datetime",
      "should_start_workflow",
    ],
  },
});

/**
 * 参加者抽出ロジック
 */
export const LunchParticipantsExtractor = SlackFunction(
  LunchParticipantsExtractorDefinition,
  async ({ inputs, client }) => {
    console.log("called");
    const { message_text } = inputs;

    // アプリメンションの場合は必ずアプリ自身へのメンションが含まれる
    // このチェックは不要（app_mentionedイベントで自動的にフィルタリングされる）

    // @文字列が含まれているかチェック
    const hasMentions = message_text.includes("@");

    // App自身のIDを取得
    const authResponse = await client.auth.test();
    const appUserId = authResponse.ok ? authResponse.user_id : null;
    console.log(`App User ID: ${appUserId}`);

    // ユーザーメンション抽出（@が含まれている場合のみ）
    let extractedUsers: string[] = [];
    if (hasMentions) {
      const mentionPattern = /<@(\w+)>/g;
      const mentions = message_text.match(mentionPattern);
      if (mentions) {
        // アプリ自身のメンションを除外
        extractedUsers = mentions
          .map((mention) => mention.replace(/<@|>/g, ""))
          .filter((userId) => {
            // App自身とBot/Appを除外
            return userId !== appUserId && !userId.startsWith("A");
          });
        console.log(`抽出されたユーザー: ${extractedUsers.join(", ")}`);
      }
    }

    // 日時パターン抽出
    // サポート形式: YYYY-MM-DD HH:MM, MM/DD HH:MM, MM-DD HH:MM
    const datetimePatterns = [
      /(\d{4}-\d{2}-\d{2}\s+\d{2}:\d{2})/, // 2024-07-20 12:30
      /(\d{1,2}\/\d{1,2}\s+\d{2}:\d{2})/, // 7/20 12:30
      /(\d{1,2}-\d{1,2}\s+\d{2}:\d{2})/, // 7-20 12:30
    ];

    let extractedDatetime = "";
    let hasDatetime = false;

    for (const pattern of datetimePatterns) {
      const match = message_text.match(pattern);
      if (match) {
        extractedDatetime = match[1];
        hasDatetime = true;
        break;
      }
    }

    // ワークフロー開始条件：日時またはメンションが存在する場合
    const shouldStartWorkflow = hasDatetime ||
      (hasMentions && extractedUsers.length > 0);

    return {
      outputs: {
        extracted_users: extractedUsers,
        extracted_datetime: extractedDatetime,
        has_mentions: hasMentions && extractedUsers.length > 0,
        has_datetime: hasDatetime,
        should_start_workflow: shouldStartWorkflow,
      },
    };
  },
);

export default LunchParticipantsExtractor;
