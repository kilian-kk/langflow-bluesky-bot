export interface MyGraphState {
  comment: string;
  sentiment_result?: Record<string, any> | null;
  intent_result?: string | null;
  like?: boolean | null;
  reply?: boolean | null;
  repost?: boolean | null;
  reply_text?: boolean | null;
  flag?: boolean | null;
  feedback?: boolean | null;
  question?: boolean | null;
  answer?: string | null;
  hitl_required: boolean;
  hitl_from_rag_failure: boolean;
  hitl_from_sentiment: boolean;
  hitl_from_intent: boolean;
  hitl_reviewed: boolean;
}
