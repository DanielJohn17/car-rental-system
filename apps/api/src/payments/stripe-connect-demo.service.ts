import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User, UserRole } from '../auth/entities/user.entity';
import { StripeService } from './services/stripe.service';

@Injectable()
export class StripeConnectDemoService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly stripeService: StripeService,
    private readonly configService: ConfigService,
  ) {}

  /**
   * Get the current admin user and ensure they are authorized.
   *
   * NOTE: In this codebase, "ADMIN" represents the user that will be onboarded
   * to Stripe Connect to collect payments.
   */
  private async requireAdminUser(userId: string): Promise<User> {
    const user = await this.userRepository.findOne({ where: { id: userId } });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (user.role !== UserRole.ADMIN) {
      throw new ForbiddenException(
        'Only admins can use this Stripe Connect demo integration',
      );
    }

    if (!user.email) {
      throw new BadRequestException(
        'User email is required to create a Stripe connected account',
      );
    }

    if (!user.fullName) {
      throw new BadRequestException(
        'User full name is required to create a Stripe connected account display name',
      );
    }

    return user;
  }

  /**
   * Creates (if missing) and returns the Stripe Connect *connected account ID*
   * for the current admin.
   *
   * IMPORTANT:
   * - This uses Stripe Connect *V2 accounts* (NOT type=express/standard/custom).
   * - We store a mapping on the User record (`stripeConnectAccountId`).
   */
  async getOrCreateConnectedAccountForAdmin(userId: string): Promise<string> {
    const user = await this.requireAdminUser(userId);

    if (user.stripeConnectAccountId) {
      return user.stripeConnectAccountId;
    }

    const created = await this.stripeService.createConnectedAccountV2({
      displayName: user.fullName,
      contactEmail: user.email,
    });

    user.stripeConnectAccountId = created.accountId;
    await this.userRepository.save(user);

    return user.stripeConnectAccountId;
  }

  /**
   * Fetches the onboarding + capability status from Stripe directly.
   *
   * IMPORTANT: We purposely DO NOT store status in the DB for this demo.
   */
  async getConnectedAccountStatusForAdmin(userId: string): Promise<{
    stripeConnectAccountId: string;
    readyToProcessPayments: boolean;
    requirementsStatus: string | undefined;
    onboardingComplete: boolean;
  }> {
    const accountId = await this.getOrCreateConnectedAccountForAdmin(userId);

    const status = await this.stripeService.getConnectedAccountStatusV2({
      accountId,
    });

    return {
      stripeConnectAccountId: accountId,
      ...status,
    };
  }

  /**
   * Creates a Stripe Account Link (V2 API) to start or continue onboarding.
   */
  async createOnboardingLinkForAdmin(userId: string): Promise<{ url: string }> {
    const accountId = await this.getOrCreateConnectedAccountForAdmin(userId);

    // PLACEHOLDER: Set WEB_APP_URL in .env to the URL of your web app.
    // Example: WEB_APP_URL=http://localhost:3000
    const webAppUrl =
      this.configService.get<string>('WEB_APP_URL') || 'http://localhost:3000';

    // For a real product:
    // - You should likely send users to a dedicated page that can show
    //   onboarding status.
    // - The return URL should be a stable route.
    const refreshUrl = new URL(
      '/admin/stripe-connect-demo',
      webAppUrl,
    ).toString();
    const returnUrl = new URL(
      '/admin/stripe-connect-demo',
      webAppUrl,
    ).toString();

    return this.stripeService.createAccountOnboardingLinkV2({
      accountId,
      refreshUrl,
      returnUrl,
    });
  }

  /**
   * Creates a product (and its default price) ON the connected account.
   *
   * IMPORTANT:
   * - This uses the `Stripe-Account` header (via `stripeAccount` request option)
   *   so the product is owned by the connected account.
   */
  async createProductForAdmin(
    userId: string,
    input: {
      name: string;
      description?: string;
      priceInCents: number;
      currency: string;
    },
  ) {
    const accountId = await this.getOrCreateConnectedAccountForAdmin(userId);

    return this.stripeService.createProductOnConnectedAccount({
      accountId,
      name: input.name,
      description: input.description,
      priceInCents: input.priceInCents,
      currency: input.currency,
    });
  }

  /**
   * Lists products ON a connected account.
   */
  async listProductsForAccount(accountId: string) {
    return this.stripeService.listProductsOnConnectedAccount({ accountId });
  }

  /**
   * Creates a hosted Checkout Session for customers to purchase a product.
   *
   * This creates a *Direct Charge* on the connected account with an application
   * fee collected by the platform.
   */
  async createStorefrontCheckoutSession(input: {
    accountId: string;
    priceId: string;
    quantity: number;
    successUrl: string;
    cancelUrl: string;
  }) {
    // PLACEHOLDER: Configure an application fee amount in cents.
    // Example: STRIPE_STORE_APP_FEE_CENTS=123
    const applicationFeeAmount = Number(
      this.configService.get<string>('STRIPE_STORE_APP_FEE_CENTS') || 123,
    );

    if (!Number.isFinite(applicationFeeAmount) || applicationFeeAmount < 0) {
      throw new BadRequestException(
        'Invalid STRIPE_STORE_APP_FEE_CENTS. Set it to a non-negative integer number of cents.',
      );
    }

    return this.stripeService.createDirectChargeCheckoutSession({
      accountId: input.accountId,
      priceId: input.priceId,
      quantity: input.quantity,
      applicationFeeAmount,
      successUrl: input.successUrl,
      cancelUrl: input.cancelUrl,
    });
  }

  /**
   * Creates a hosted Checkout Session to subscribe the connected account.
   */
  async createSubscriptionCheckoutForAdmin(userId: string) {
    const connectedAccountId =
      await this.getOrCreateConnectedAccountForAdmin(userId);

    // PLACEHOLDER: Create a recurring Price in your Stripe Dashboard and put its
    // ID here.
    // Example: STRIPE_SUBSCRIPTION_PRICE_ID=price_...
    const priceId = this.configService.get<string>(
      'STRIPE_SUBSCRIPTION_PRICE_ID',
    );

    if (!priceId) {
      throw new BadRequestException(
        'Missing STRIPE_SUBSCRIPTION_PRICE_ID. Create a recurring Price in Stripe and set STRIPE_SUBSCRIPTION_PRICE_ID=price_*** in your .env file.',
      );
    }

    const webAppUrl =
      this.configService.get<string>('WEB_APP_URL') || 'http://localhost:3000';

    const successUrl = new URL(
      '/admin/stripe-connect-demo/subscription/success?session_id={CHECKOUT_SESSION_ID}',
      webAppUrl,
    ).toString();

    const cancelUrl = new URL(
      '/admin/stripe-connect-demo',
      webAppUrl,
    ).toString();

    return this.stripeService.createSubscriptionCheckoutSession({
      connectedAccountId,
      priceId,
      successUrl,
      cancelUrl,
    });
  }

  /**
   * Creates a Stripe Billing Portal session so the connected account can manage
   * their subscription.
   */
  async createBillingPortalForAdmin(userId: string) {
    const connectedAccountId =
      await this.getOrCreateConnectedAccountForAdmin(userId);

    const webAppUrl =
      this.configService.get<string>('WEB_APP_URL') || 'http://localhost:3000';

    const returnUrl = new URL(
      '/admin/stripe-connect-demo',
      webAppUrl,
    ).toString();

    return this.stripeService.createBillingPortalSession({
      connectedAccountId,
      returnUrl,
    });
  }
}
