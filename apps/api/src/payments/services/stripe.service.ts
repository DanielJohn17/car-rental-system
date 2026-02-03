import Stripe from 'stripe';
import type { Stripe as StripeType } from 'stripe';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type {
  CreatePaymentIntentInput,
  PaymentIntentResult,
  StripeWebhookPayload,
} from '@car-rental/types';

type ThinEventNotification = {
  id: string;
  type: string;
};

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
  // IMPORTANT: This is the single Stripe Client instance that MUST be used for
  // all Stripe API requests in this application.
  //
  // The Stripe API version DOES NOT need to be set manually.
  // Stripe's SDK automatically pins a version and upgrades it when you upgrade
  // the SDK package.
  private stripeClient: StripeType;

  // Stored for webhook signature verification.
  private webhookSecret: string;

  // Stored for parsing Stripe "thin" events (API v2 event destinations).
  private thinWebhookSecret: string;

  private readonly logger = new Logger(StripeService.name);

  constructor(private configService: ConfigService) {
    const apiKey = this.configService.get<string>('STRIPE_API_KEY');
    const webhookSecret = this.configService.get<string>(
      'STRIPE_WEBHOOK_SECRET',
    );
    const thinWebhookSecret = this.configService.get<string>(
      'STRIPE_THIN_WEBHOOK_SECRET',
    );

    // NOTE: We intentionally DO NOT throw inside the constructor so the app can
    // boot even if Stripe isn't configured yet (for example in local dev).
    // Every Stripe entry-point method calls `assertStripeApiKeyConfigured()` and
    // returns a helpful error message.
    if (!apiKey) {
      this.logger.warn(
        'STRIPE_API_KEY is not configured. Stripe endpoints will fail until you set it.',
      );
    }

    if (!webhookSecret) {
      this.logger.warn(
        'STRIPE_WEBHOOK_SECRET is not configured. Snapshot webhooks will fail signature verification until you set it.',
      );
    }

    if (!thinWebhookSecret) {
      this.logger.warn(
        'STRIPE_THIN_WEBHOOK_SECRET is not configured. Thin webhooks will fail signature verification until you set it.',
      );
    }

    // Creating the client with an empty string is okay; we validate and throw a
    // more user-friendly error message at call-time.
    this.stripeClient = new Stripe(apiKey || '');
    this.webhookSecret = webhookSecret || '';
    this.thinWebhookSecret = thinWebhookSecret || '';
  }

  private assertStripeApiKeyConfigured(): void {
    // PLACEHOLDER: Set STRIPE_API_KEY in apps/api/.env (or repo root .env as configured).
    // Example: STRIPE_API_KEY=sk_test_...
    if (!this.configService.get<string>('STRIPE_API_KEY')) {
      throw new Error(
        'Missing STRIPE_API_KEY. Set STRIPE_API_KEY=sk_*** in your .env file before using Stripe endpoints.',
      );
    }
  }

  private assertSnapshotWebhookSecretConfigured(): void {
    // PLACEHOLDER: Set STRIPE_WEBHOOK_SECRET in .env
    if (!this.webhookSecret) {
      throw new Error(
        'Missing STRIPE_WEBHOOK_SECRET. Set STRIPE_WEBHOOK_SECRET=whsec_*** in your .env file before receiving Stripe snapshot webhooks.',
      );
    }
  }

  private assertThinWebhookSecretConfigured(): void {
    // PLACEHOLDER: Set STRIPE_THIN_WEBHOOK_SECRET in .env
    if (!this.thinWebhookSecret) {
      throw new Error(
        'Missing STRIPE_THIN_WEBHOOK_SECRET. Set STRIPE_THIN_WEBHOOK_SECRET=whsec_*** in your .env file before receiving Stripe thin webhooks.',
      );
    }
  }

  async createCheckoutSession(
    input: CreateCheckoutSessionInput,
  ): Promise<CheckoutSessionResult> {
    this.assertStripeApiKeyConfigured();
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
      ? await this.stripeClient.checkout.sessions.create(params, {
          stripeAccount: input.connectedAccountId,
        })
      : await this.stripeClient.checkout.sessions.create(params);

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

  /**
   * Create a Stripe Connect connected account using the *V2 Accounts API*.
   *
   * IMPORTANT: The user explicitly requested that we:
   * - Use ONLY the properties below.
   * - NEVER pass `type` at the top-level (no express/standard/custom).
   */
  async createConnectedAccountV2(input: {
    displayName: string;
    contactEmail: string;
  }): Promise<{ accountId: string }> {
    this.assertStripeApiKeyConfigured();

    const account = await this.stripeClient.v2.core.accounts.create({
      display_name: input.displayName,
      contact_email: input.contactEmail,
      identity: {
        country: 'us',
      },
      dashboard: 'full',
      defaults: {
        responsibilities: {
          fees_collector: 'stripe',
          losses_collector: 'stripe',
        },
      },
      configuration: {
        customer: {},
        merchant: {
          capabilities: {
            card_payments: {
              requested: true,
            },
          },
        },
      },
    });

    return { accountId: account.id };
  }

  /**
   * Create an account onboarding link (V2 Account Links API).
   *
   * The `refresh_url` and `return_url` should be routes in your web app.
   * - `refresh_url`: where Stripe sends the user if they abandon or fail onboarding.
   * - `return_url`: where Stripe sends the user after they complete onboarding.
   */
  async createAccountOnboardingLinkV2(input: {
    accountId: string;
    refreshUrl: string;
    returnUrl: string;
  }): Promise<{ url: string }> {
    this.assertStripeApiKeyConfigured();

    const accountLink = await this.stripeClient.v2.core.accountLinks.create({
      account: input.accountId,
      use_case: {
        type: 'account_onboarding',
        account_onboarding: {
          configurations: ['merchant', 'customer'],
          refresh_url: input.refreshUrl,
          return_url: input.returnUrl,
        },
      },
    });

    return { url: accountLink.url };
  }

  /**
   * Retrieve a connected account and compute onboarding / capability status.
   *
   * For this demo, we ALWAYS fetch from Stripe directly instead of storing the
   * status in the DB.
   */
  async getConnectedAccountStatusV2(input: { accountId: string }): Promise<{
    readyToProcessPayments: boolean;
    requirementsStatus: string | undefined;
    onboardingComplete: boolean;
  }> {
    this.assertStripeApiKeyConfigured();

    const account = await this.stripeClient.v2.core.accounts.retrieve(
      input.accountId,
      {
        include: ['configuration.merchant', 'requirements'],
      },
    );

    const readyToProcessPayments =
      account?.configuration?.merchant?.capabilities?.card_payments?.status ===
      'active';

    const requirementsStatus =
      account.requirements?.summary?.minimum_deadline?.status;

    const onboardingComplete =
      requirementsStatus !== 'currently_due' &&
      requirementsStatus !== 'past_due';

    return {
      readyToProcessPayments,
      requirementsStatus,
      onboardingComplete,
    };
  }

  /**
   * Create a product on a connected account (Stripe-Account header).
   */
  async createProductOnConnectedAccount(input: {
    accountId: string;
    name: string;
    description?: string;
    priceInCents: number;
    currency: string;
  }): Promise<Stripe.Product> {
    this.assertStripeApiKeyConfigured();

    return this.stripeClient.products.create(
      {
        name: input.name,
        description: input.description,
        default_price_data: {
          unit_amount: input.priceInCents,
          currency: input.currency,
        },
      },
      {
        // This sets the Stripe-Account header so the product is created ON the
        // connected account.
        stripeAccount: input.accountId,
      },
    );
  }

  /**
   * List products on a connected account (Stripe-Account header).
   */
  async listProductsOnConnectedAccount(input: {
    accountId: string;
  }): Promise<Stripe.ApiList<Stripe.Product>> {
    this.assertStripeApiKeyConfigured();

    return this.stripeClient.products.list(
      {
        limit: 20,
        active: true,
        expand: ['data.default_price'],
      },
      {
        stripeAccount: input.accountId,
      },
    );
  }

  /**
   * Create a hosted Checkout Session that creates a *Direct Charge* on the
   * connected account and collects an application fee for the platform.
   */
  async createDirectChargeCheckoutSession(input: {
    accountId: string;
    priceId: string;
    quantity: number;
    applicationFeeAmount: number;
    successUrl: string;
    cancelUrl: string;
  }): Promise<Stripe.Checkout.Session> {
    this.assertStripeApiKeyConfigured();

    return this.stripeClient.checkout.sessions.create(
      {
        mode: 'payment',
        line_items: [{ price: input.priceId, quantity: input.quantity }],
        payment_intent_data: {
          // Sample Application Fee (platform monetization)
          application_fee_amount: input.applicationFeeAmount,
        },
        success_url: input.successUrl,
        cancel_url: input.cancelUrl,
      },
      {
        // Create the Checkout Session *on the connected account*.
        stripeAccount: input.accountId,
      },
    );
  }

  /**
   * Create a subscription Checkout Session at the platform level.
   *
   * With V2 accounts we can use ONE ID for both:
   * - `customer_account` (the customer being billed)
   * - the connected account ID (acct_...)
   */
  async createSubscriptionCheckoutSession(input: {
    connectedAccountId: string;
    priceId: string;
    successUrl: string;
    cancelUrl: string;
  }): Promise<Stripe.Checkout.Session> {
    this.assertStripeApiKeyConfigured();

    return this.stripeClient.checkout.sessions.create({
      customer_account: input.connectedAccountId,
      mode: 'subscription',
      line_items: [{ price: input.priceId, quantity: 1 }],
      success_url: input.successUrl,
      cancel_url: input.cancelUrl,
    });
  }

  /**
   * Create a billing portal session for a connected account subscription.
   */
  async createBillingPortalSession(input: {
    connectedAccountId: string;
    returnUrl: string;
  }): Promise<Stripe.BillingPortal.Session> {
    this.assertStripeApiKeyConfigured();

    return this.stripeClient.billingPortal.sessions.create({
      customer_account: input.connectedAccountId,
      return_url: input.returnUrl,
    });
  }

  /**
   * Create a Stripe PaymentIntent for direct charge (connected account)
   * Customer pays admin account directly with platform commission
   */
  async createPaymentIntent(
    input: CreatePaymentIntentInput,
  ): Promise<PaymentIntentResult> {
    this.assertStripeApiKeyConfigured();
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
      ? await this.stripeClient.paymentIntents.create(params, {
          stripeAccount: input.connectedAccountId,
        })
      : await this.stripeClient.paymentIntents.create(params);

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
    this.assertStripeApiKeyConfigured();
    return this.stripeClient.paymentIntents.retrieve(paymentIntentId);
  }

  /**
   * Refund a payment
   */
  async refundPayment(
    paymentIntentId: string,
    amount?: number,
  ): Promise<Stripe.Refund> {
    this.assertStripeApiKeyConfigured();
    const refund = await this.stripeClient.refunds.create({
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
      this.assertSnapshotWebhookSecretConfigured();
      return this.stripeClient.webhooks.constructEvent(
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

  /**
   * Parse a Stripe *thin event* notification.
   *
   * Stripe's docs contain examples using either `parseThinEvent` or
   * `parseEventNotification` depending on SDK version. To keep this demo robust,
   * we support both.
   */
  parseThinEvent(body: Buffer, signature: string): ThinEventNotification {
    this.assertStripeApiKeyConfigured();
    this.assertThinWebhookSecretConfigured();

    const stripeWithThinParser = this.stripeClient as unknown as {
      parseThinEvent?: (
        rawBody: Buffer,
        sig: string,
        secret: string,
      ) => ThinEventNotification;
      parseEventNotification?: (
        rawBody: Buffer,
        sig: string,
        secret: string,
      ) => ThinEventNotification;
    };

    if (typeof stripeWithThinParser.parseThinEvent === 'function') {
      return stripeWithThinParser.parseThinEvent(
        body,
        signature,
        this.thinWebhookSecret,
      );
    }

    if (typeof stripeWithThinParser.parseEventNotification === 'function') {
      return stripeWithThinParser.parseEventNotification(
        body,
        signature,
        this.thinWebhookSecret,
      );
    }

    throw new Error(
      'Your Stripe SDK does not support thin event parsing. Upgrade the stripe package to a newer version.',
    );
  }

  /**
   * Fetch the full V2 event payload from Stripe after receiving a thin event.
   */
  retrieveV2Event(eventId: string): Promise<{ id: string; type: string }> {
    this.assertStripeApiKeyConfigured();
    return this.stripeClient.v2.core.events.retrieve(eventId);
  }
}
