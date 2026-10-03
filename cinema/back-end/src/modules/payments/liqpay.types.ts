export interface LiqPayCallbackPayload {
  order_id: string;
  status: string;
  amount: number | string;
  currency: string;
  payment_id?: number | string;
  err_code?: string;
  err_description?: string;
}