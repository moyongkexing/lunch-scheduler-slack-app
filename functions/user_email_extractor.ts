import { DefineFunction, Schema, SlackFunction } from "deno-slack-sdk/mod.ts";

/**
 * ユーザーメールアドレス取得関数
 * ユーザーIDリストからメールアドレスを取得
 */
export const UserEmailExtractorDefinition = DefineFunction({
  callback_id: "user_email_extractor",
  title: "ユーザーメールアドレス抽出",
  description: "ユーザーIDからメールアドレスを取得",
  source_file: "functions/user_email_extractor.ts",
  input_parameters: {
    properties: {
      user_ids: {
        type: Schema.types.array,
        items: { type: Schema.slack.types.user_id },
        description: "メールアドレスを取得するユーザーIDリスト",
      },
    },
    required: ["user_ids"],
  },
  output_parameters: {
    properties: {
      user_emails_json: {
        type: Schema.types.string,
        description: "JSON文字列化されたユーザー情報リスト",
      },
      success: {
        type: Schema.types.boolean,
        description: "処理が成功したかどうか",
      },
      error_message: {
        type: Schema.types.string,
        description: "エラーメッセージ（エラー時のみ）",
      },
    },
    required: ["user_emails_json", "success"],
  },
});

/**
 * ユーザーメールアドレス取得ロジック
 */
export const UserEmailExtractor = SlackFunction(
  UserEmailExtractorDefinition,
  async ({ inputs, client }) => {
    const { user_ids } = inputs;
    const userEmails = [];
    let hasError = false;
    let errorMessage = "";

    console.log(`メールアドレス取得開始: ${user_ids.length}人のユーザー`);

    for (const userId of user_ids) {
      try {
        console.log(`ユーザー情報取得中: ${userId}`);
        
        // users.info APIを使用してユーザー情報とメールアドレスを取得
        const response = await client.users.info({
          user: userId,
          include_locale: true,
        });

        if (response.ok && response.user) {
          const user = response.user;
          const email = user.profile?.email;
          const name = user.profile?.display_name || user.profile?.real_name || user.name;

          if (email) {
            userEmails.push({
              user_id: userId,
              email: email,
              name: name || "Unknown",
            });
            console.log(`✅ メールアドレス取得成功: ${name} (${email})`);
          } else {
            console.log(`⚠️ メールアドレスなし: ${name || userId}`);
            // メールアドレスがない場合でもユーザー情報は追加
            userEmails.push({
              user_id: userId,
              email: "",
              name: name || "Unknown",
            });
          }
        } else {
          console.error(`❌ ユーザー情報取得失敗: ${userId}`, response.error);
          hasError = true;
          errorMessage += `ユーザー${userId}の情報取得に失敗。`;
        }
      } catch (error) {
        console.error(`❌ API呼び出しエラー: ${userId}`, error);
        hasError = true;
        const errorMsg = error instanceof Error ? error.message : String(error);
        errorMessage += `ユーザー${userId}のAPI呼び出しでエラー: ${errorMsg}。`;
      }
    }

    console.log(`メールアドレス取得完了: ${userEmails.length}人分`);

    return {
      outputs: {
        user_emails_json: JSON.stringify(userEmails),
        success: !hasError,
        error_message: errorMessage || undefined,
      },
    };
  },
);

export default UserEmailExtractor;