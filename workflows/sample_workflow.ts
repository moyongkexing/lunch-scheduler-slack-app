import { DefineWorkflow, Schema } from "deno-slack-sdk/mod.ts";
import { SampleFunctionDefinition } from "@functions/sample_function.ts";

/**
 * ワークフローは順番に実行されるステップのセットです。
 * ワークフロー内の各ステップは関数です。
 * https://api.slack.com/automation/workflows
 *
 * このワークフローはインタラクティビティを使用します。詳細はこちら:
 * https://api.slack.com/automation/forms#add-interactivity
 */
export const SampleWorkflow = DefineWorkflow({
  callback_id: "sample_workflow",
  title: "Sample workflow",
  description: "A sample workflow",
  input_parameters: {
    properties: {
      interactivity: {
        type: Schema.slack.types.interactivity,
      },
      channel: {
        type: Schema.slack.types.channel_id,
      },
      user: {
        type: Schema.slack.types.user_id,
      },
    },
    required: ["interactivity", "channel", "user"],
  },
});

/**
 * ユーザーからの入力を収集するには、
 * 最初のステップとしてOpenForm Slack関数を推奨します。
 * https://api.slack.com/automation/functions#open-a-form
 */
const inputForm = SampleWorkflow.addStep(
  Schema.slack.functions.OpenForm,
  {
    title: "Send message to channel",
    interactivity: SampleWorkflow.inputs.interactivity,
    submit_label: "Send message",
    fields: {
      elements: [{
        name: "channel",
        title: "Channel to send message to",
        type: Schema.slack.types.channel_id,
        default: SampleWorkflow.inputs.channel,
      }, {
        name: "message",
        title: "Message",
        type: Schema.types.string,
        long: true,
      }],
      required: ["channel", "message"],
    },
  },
);

/**
 * カスタム関数は、Slackインフラストラクチャにデプロイされる
 * 自動化の再利用可能なビルディングブロックです。
 * 通常のプログラム関数と同様に、入力を受け取り、
 * 計算を実行し、出力を提供します。
 * https://api.slack.com/automation/functions/custom
 */
const sampleFunctionStep = SampleWorkflow.addStep(SampleFunctionDefinition, {
  message: inputForm.outputs.fields.message,
  user: SampleWorkflow.inputs.user,
});

/**
 * SendMessageはSlack関数です。これらは
 * チャンネルの作成やメッセージの送信などの
 * Slackネイティブアクションであり、ワークフロー内で
 * カスタム関数と一緒に使用できます。
 * https://api.slack.com/automation/functions
 */
SampleWorkflow.addStep(Schema.slack.functions.SendMessage, {
  channel_id: inputForm.outputs.fields.channel,
  message: sampleFunctionStep.outputs.updatedMsg,
});
