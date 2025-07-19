import { DefineDatastore, Schema } from "deno-slack-sdk/mod.ts";

/**
 * データストアはSlackがホストする場所で、
 * アプリのデータを保存・取得できます。
 * https://api.slack.com/automation/datastores
 */
export const SampleObjectDatastore = DefineDatastore({
  name: "LunchBookings",
  primary_key: "booking_id",
  attributes: {
    booking_id: {
      type: Schema.types.string,
    },
    user_id: {
      type: Schema.types.string,
    },
    lunch_datetime: {
      type: Schema.types.string,
    },
    participants: {
      type: Schema.types.string,
    },
    channel: {
      type: Schema.types.string,
    },
    created_at: {
      type: Schema.types.string,
    },
  },
});
