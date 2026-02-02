export interface CreatePaymentIntentInput {
  amount: number; // Amount in cents
  currency: string;
  metadata?: Record<string, string>;
  description?: string;
  connectedAccountId?: string; // Stripe Connect account ID for direct charges
  applicationFeeAmount?: number; // Commission amount in cents
}

export interface PaymentIntentResult {
  clientSecret: string;
  paymentIntentId: string;
  amount: number;
  currency: string;
  status: string;
}

export interface StripeWebhookPayload {
  id: string;
  object: string;
  api_version: string;
  created: number;
  data: {
    object: Record<string, any>;
    previous_attributes?: Record<string, any>;
  };
  livemode: boolean;
  pending_webhooks: number;
  request: {
    id: string | null;
    idempotency_key: string | null;
  };
  type: string;
}

export interface PaymentIntentSucceededPayload extends StripeWebhookPayload {
  type: "payment_intent.succeeded";
  data: {
    object: {
      id: string;
      object: "payment_intent";
      amount: number;
      amount_capturable: number;
      amount_details: {
        tip: number;
      };
      amount_received: number;
      application: string | null;
      application_fee_amount: number | null;
      automatic_payment_methods: any;
      canceled_at: number | null;
      cancellation_reason: string | null;
      capture_method: string;
      charges: {
        object: "list";
        data: Array<{
          id: string;
          object: "charge";
          [key: string]: any;
        }>;
        has_more: boolean;
        url: string;
      };
      client_secret: string;
      confirmation_method: string;
      created: number;
      currency: string;
      customer: string | null;
      description: string | null;
      last_payment_error: any;
      latest_charge: string;
      livemode: boolean;
      metadata: Record<string, string>;
      next_action: any;
      on_behalf_of: string | null;
      payment_method: string;
      payment_method_options: any;
      payment_method_types: string[];
      processing: any;
      receipt_email: string | null;
      review: string | null;
      setup_future_usage: string | null;
      shipping: any;
      source: any;
      statement_descriptor: string | null;
      statement_descriptor_suffix: string | null;
      status: "succeeded";
      transfer_data: any;
      transfer_group: string | null;
    };
  };
}
