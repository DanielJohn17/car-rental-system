import Stripe from 'stripe';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type {
  CreatePaymentIntentInput,
  PaymentIntentResult,
  StripeWebhookPayload,
} from '@car-rental/types';

type CreateCheckoutSessionInput = {
  amount: number;
  currency: string;
  connectedAccountId?: string;
  applicationFeeAmount?: number;
  metadata: Record<string, string>;
  description: string;
  successUrl: string;
  cancelUrl: string;
  customerEmail?: string;
};

type CheckoutSessionResult = {
  url: string;
  sessionId: string;
  paymentIntentId: string;
};

@Injectable()
export class StripeService {
  private stripe: Stripe;
  private webhookSecret: string;
  private readonly logger = new Logger(StripeService.name);

  constructor(private configService: ConfigService) {
    const apiKey = this.configService.get<string>('STRIPE_API_KEY');
    const webhookSecret = this.configService.get<string>(
      'STRIPE_WEBHOOK_SECRET',
    );

    if (!apiKey || !webhookSecret) {
      this.logger.warn(
        'STRIPE_API_KEY or STRIPE_WEBHOOK_SECRET not configured',
      );
    }

    this.stripe = new Stripe(apiKey || '', {
      apiVersion: '2023-10-16',
    });
    this.webhookSecret = webhookSecret || '';
  }
  async createCheckoutSession(
    input: CreateCheckoutSessionInput,
  ): Promise<CheckoutSessionResult> {
    const params: Stripe.Checkout.SessionCreateParams = {
      mode: 'payment',
      success_url: input.successUrl,
      cancel_url: input.cancelUrl,
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: input.currency.toLowerCase(),
            unit_amount: input.amount,
            product_data: {
              name: input.description,
            },
          },
        },
      ],
      payment_intent_data: {
        description: input.description,
        metadata: input.metadata,
      },
    };

    if (input.customerEmail) {
      params.customer_email = input.customerEmail;
    }

    if (input.applicationFeeAmount) {
      params.payment_intent_data = {
        ...params.payment_intent_data,
        application_fee_amount: input.applicationFeeAmount,
      };
    }

    const session = input.connectedAccountId
      ? await this.stripe.checkout.sessions.create(params, {
          stripeAccount: input.connectedAccountId,
        })
      : await this.stripe.checkout.sessions.create(params);

    const paymentIntentId =
      typeof session.payment_intent === 'string'
        ? session.payment_intent
        : session.payment_intent?.id || '';

    return {
      url: session.url || '',
      sessionId: session.id,
      paymentIntentId,
    };
  }

  async createExpressConnectAccount(input: {
    email: string;
  }): Promise<{ accountId: string }> {
    const account = await this.stripe.accounts.create({
      type: 'express',
      email: input.email,
      capabilities: {
        card_payments: { requested: true },
        transfers: { requested: true },
      },
    });

    return { accountId: account.id };
  }

  async createConnectOnboardingLink(input: {
    accountId: string;
    refreshUrl: string;
    returnUrl: string;
  }): Promise<{ url: string }> {
    const link = await this.stripe.accountLinks.create({
      account: input.accountId,
      refresh_url: input.refreshUrl,
      return_url: input.returnUrl,
      type: 'account_onboarding',
    });

    return { url: link.url };
  }

  /**
   * Create a Stripe PaymentIntent for direct charge (connected account)
   * Customer pays admin account directly with platform commission
   */
  async createPaymentIntent(
    input: CreatePaymentIntentInput,
  ): Promise<PaymentIntentResult> {
    const params: Stripe.PaymentIntentCreateParams = {
      amount: input.amount,
      currency: input.currency.toLowerCase(),
      metadata: input.metadata,
      description: input.description,
      automatic_payment_methods: {
        enabled: true,
      },
    };

    // If connected account specified, create charge on that account with app fee
    if (input.connectedAccountId) {
      params.on_behalf_of = input.connectedAccountId;

      if (input.applicationFeeAmount) {
        params.application_fee_amount = input.applicationFeeAmount;
      }
    }

    const paymentIntent = input.connectedAccountId
      ? await this.stripe.paymentIntents.create(params, {
          stripeAccount: input.connectedAccountId,
        })
      : await this.stripe.paymentIntents.create(params);

    return {
      clientSecret: paymentIntent.client_secret || '',
      paymentIntentId: paymentIntent.id,
      amount: paymentIntent.amount,
      currency: paymentIntent.currency,
      status: paymentIntent.status,
    };
  }

  /**
   * Retrieve payment intent details
   */
  async getPaymentIntent(
    paymentIntentId: string,
  ): Promise<Stripe.PaymentIntent> {
    return this.stripe.paymentIntents.retrieve(paymentIntentId);
  }

  /**
   * Refund a payment
   */
  async refundPayment(
    paymentIntentId: string,
    amount?: number,
  ): Promise<Stripe.Refund> {
    const refund = await this.stripe.refunds.create({
      payment_intent: paymentIntentId,
      amount: amount,
    });

    return refund;
  }

  /**
   * Verify webhook signature
   */
  verifyWebhookSignature(
    body: string | Buffer,
    signature: string,
  ): StripeWebhookPayload {
    try {
      return this.stripe.webhooks.constructEvent(
        body,
        signature,
        this.webhookSecret,
      ) as StripeWebhookPayload;
    } catch (error) {
      throw new Error(`Webhook signature verification failed: ${error}`);
    }
  }

  /**
   * Construct event from raw body and signature
   */
  constructWebhookEvent(
    body: string | Buffer,
    signature: string,
  ): StripeWebhookPayload {
    return this.verifyWebhookSignature(body, signature);
  }
}
