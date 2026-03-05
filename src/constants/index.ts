/** 最长录音时长（秒） */
export const MAX_RECORD_SECONDS = 60

/** 订单类型 */
export enum OrderType {
  SALES = 'SALES',
  PURCHASE = 'PURCHASE',
}

/** SSE 事件类型 */
export enum SseEventType {
  EXTRACTED = 'extracted',
  ORDER_CREATED = 'order_created',
  ERROR = 'error',
}

/** Agent SSE 事件类型 */
export enum AgentEventType {
  TRANSCRIBED = 'transcribed',
  THINKING = 'thinking',
  TOOL_CALL = 'tool_call',
  TOOL_RESULT = 'tool_result',
  ANSWER = 'answer',
  ERROR = 'error',
}

/** 录音状态 */
export enum RecordStatus {
  Idle = 'Idle',
  Recording = 'Recording',
  Streaming = 'Streaming',
  Done = 'Done',
  Error = 'Error',
}
