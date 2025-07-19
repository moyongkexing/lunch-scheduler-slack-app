import { DefineFunction, Schema, SlackFunction } from "deno-slack-sdk/mod.ts";

/**
 * Google Calendar API クライアント関数
 * ユーザーのカレンダー情報を取得
 */
export const GoogleCalendarClientDefinition = DefineFunction({
  callback_id: "google_calendar_client",
  title: "Google Calendar API クライアント",
  description: "指定したメールアドレスのユーザーのGoogle Calendarにアクセス",
  source_file: "functions/google_calendar_client.ts",
  input_parameters: {
    properties: {
      user_email: {
        type: Schema.types.string,
        description: "カレンダーにアクセスするユーザーのメールアドレス",
      },
      start_time: {
        type: Schema.types.string,
        description: "取得開始時刻 (ISO 8601形式)",
      },
      end_time: {
        type: Schema.types.string,
        description: "取得終了時刻 (ISO 8601形式)",
      },
    },
    required: ["user_email", "start_time", "end_time"],
  },
  output_parameters: {
    properties: {
      events_json: {
        type: Schema.types.string,
        description: "JSON文字列化されたカレンダーイベントリスト",
      },
      free_time_slots_json: {
        type: Schema.types.string,
        description: "JSON文字列化された空き時間スロット",
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
    required: ["events_json", "free_time_slots_json", "success"],
  },
});

/**
 * Google Calendar API アクセス
 */
export const GoogleCalendarClient = SlackFunction(
  GoogleCalendarClientDefinition,
  async ({ inputs, env }) => {
    const { user_email, start_time, end_time } = inputs;
    
    console.log(`Google Calendar API呼び出し開始: ${user_email}`);
    console.log(`期間: ${start_time} - ${end_time}`);

    // 環境変数から認証情報を取得
    const clientId = env.GOOGLE_CLIENT_ID;
    const clientSecret = env.GOOGLE_CLIENT_SECRET;
    
    if (!clientId || !clientSecret) {
      console.error("❌ Google OAuth認証情報が設定されていません");
      return {
        outputs: {
          events_json: JSON.stringify([]),
          free_time_slots_json: JSON.stringify([]),
          success: false,
          error_message: "Google OAuth認証情報が設定されていません。GOOGLE_CLIENT_IDとGOOGLE_CLIENT_SECRETを設定してください。",
        },
      };
    }

    try {
      // TODO: 実際のGoogle Calendar API実装
      // 現在はモックデータを返す
      console.log("🚧 Google Calendar API実装中...");
      
      const mockEvents = [
        {
          id: "mock1",
          summary: "既存の会議",
          start: "2024-07-20T10:00:00Z",
          end: "2024-07-20T11:00:00Z",
          status: "confirmed",
        },
        {
          id: "mock2", 
          summary: "ランチミーティング",
          start: "2024-07-20T12:00:00Z",
          end: "2024-07-20T13:00:00Z",
          status: "confirmed",
        },
      ];

      const mockFreeSlots = [
        {
          start: "2024-07-20T11:00:00Z",
          end: "2024-07-20T12:00:00Z",
        },
        {
          start: "2024-07-20T13:00:00Z", 
          end: "2024-07-20T14:00:00Z",
        },
      ];

      console.log(`✅ カレンダー情報取得成功: ${mockEvents.length}件のイベント`);

      return {
        outputs: {
          events_json: JSON.stringify(mockEvents),
          free_time_slots_json: JSON.stringify(mockFreeSlots),
          success: true,
          error_message: undefined,
        },
      };
      
    } catch (error) {
      console.error("❌ Google Calendar API呼び出しエラー:", error);
      const errorMsg = error instanceof Error ? error.message : String(error);
      
      return {
        outputs: {
          events_json: JSON.stringify([]),
          free_time_slots_json: JSON.stringify([]),
          success: false,
          error_message: `Google Calendar API呼び出しエラー: ${errorMsg}`,
        },
      };
    }
  },
);

export default GoogleCalendarClient;