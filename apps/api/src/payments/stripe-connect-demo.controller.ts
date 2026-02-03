import type { Request } from 'express';
import {
  Body,
  Controller,
  Get,
  Headers,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { JwtGuard } from '../auth/guards/jwt.guard';
import { createRoleGuard } from '../auth/guards/role.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { UserRole } from '../auth/entities/user.entity';
import { StripeService } from './services/stripe.service';
import { StripeConnectDemoService } from './stripe-connect-demo.service';

export interface JwtPayload {
  sub: string;
  email: string;
  role: string;
}

@ApiTags('stripe-connect-demo')
@Controller('stripe-connect-demo')
export class StripeConnectDemoController {
  constructor(
    private readonly stripeConnectDemoService: StripeConnectDemoService,
    private readonly stripeService: StripeService,
  ) {}

  @Post('admin/onboard')
  @UseGuards(JwtGuard, createRoleGuard([UserRole.ADMIN]))
  @ApiBearerAuth('JWT')
  @ApiOperation({
    summary:
      'Create (if missing) a V2 connected account and return onboarding URL',
    description:
      'This uses Stripe Connect V2 Accounts API + V2 Account Links API. It stores the account ID on the user record.',
  })
  @ApiResponse({ status: 200 })
  async createOnboardingLinkForAdmin(
    @CurrentUser() user: JwtPayload,
  ): Promise<{ url: string }> {
    return this.stripeConnectDemoService.createOnboardingLinkForAdmin(user.sub);
  }

  @Get('admin/status')
  @UseGuards(JwtGuard, createRoleGuard([UserRole.ADMIN]))
  @ApiBearerAuth('JWT')
  @ApiOperation({
    summary:
      'Get connected account onboarding + capability status (live from Stripe)',
  })
  @ApiResponse({ status: 200 })
  async getAdminStatus(@CurrentUser() user: JwtPayload) {
    return this.stripeConnectDemoService.getConnectedAccountStatusForAdmin(
      user.sub,
    );
  }

  @Post('admin/products')
  @UseGuards(JwtGuard, createRoleGuard([UserRole.ADMIN]))
  @ApiBearerAuth('JWT')
  @ApiOperation({
    summary: 'Create a product on the connected account',
    description:
      'Creates a Stripe Product (and default price) on the connected account using the Stripe-Account header.',
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        name: { type: 'string' },
        description: { type: 'string' },
        priceInCents: { type: 'number' },
        currency: { type: 'string' },
      },
      required: ['name', 'priceInCents', 'currency'],
    },
  })
  async createProductForAdmin(
    @CurrentUser() user: JwtPayload,
    @Body()
    body: {
      name: string;
      description?: string;
      priceInCents: number | string;
      currency: string;
    },
  ) {
    const priceInCents = Number((body as any).priceInCents);
    return this.stripeConnectDemoService.createProductForAdmin(user.sub, {
      name: body.name,
      description: body.description,
      priceInCents,
      currency: body.currency,
    });
  }

  @Get('admin/products')
  @UseGuards(JwtGuard, createRoleGuard([UserRole.ADMIN]))
  @ApiBearerAuth('JWT')
  @ApiOperation({
    summary: 'List products on the current admin connected account',
    description:
      'Lists products owned by the connected account using the Stripe-Account header.',
  })
  async listProductsForAdmin(@CurrentUser() user: JwtPayload) {
    const status =
      await this.stripeConnectDemoService.getConnectedAccountStatusForAdmin(
        user.sub,
      );

    return this.stripeConnectDemoService.listProductsForAccount(
      status.stripeConnectAccountId,
    );
  }

  @Get('storefront/products')
  @ApiOperation({
    summary: 'List products for a connected account storefront',
    description:
      'This is a public demo endpoint. It uses the connected account ID from the query string. In production, use a stable public identifier instead of the raw Stripe account ID.',
  })
  async listProductsForStorefront(
    @Query('accountId') accountId: string,
  ): Promise<any> {
    return this.stripeConnectDemoService.listProductsForAccount(accountId);
  }

  @Post('storefront/checkout')
  @ApiOperation({
    summary:
      'Create a hosted Checkout Session for a product (direct charge + app fee)',
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        accountId: { type: 'string' },
        priceId: { type: 'string' },
        quantity: { type: 'number' },
        successUrl: { type: 'string' },
        cancelUrl: { type: 'string' },
      },
      required: ['accountId', 'priceId', 'quantity', 'successUrl', 'cancelUrl'],
    },
  })
  async createStorefrontCheckout(
    @Body()
    body: {
      accountId: string;
      priceId: string;
      quantity: number | string;
      successUrl: string;
      cancelUrl: string;
    },
  ): Promise<{ url: string }> {
    const quantity = Number((body as any).quantity);
    const session =
      await this.stripeConnectDemoService.createStorefrontCheckoutSession({
        accountId: body.accountId,
        priceId: body.priceId,
        quantity,
        successUrl: body.successUrl,
        cancelUrl: body.cancelUrl,
      });

    return { url: session.url ?? '' };
  }

  @Post('admin/subscription/checkout')
  @UseGuards(JwtGuard, createRoleGuard([UserRole.ADMIN]))
  @ApiBearerAuth('JWT')
  @ApiOperation({
    summary:
      'Create a hosted Checkout Session to subscribe the connected account',
  })
  async createSubscriptionCheckout(@CurrentUser() user: JwtPayload) {
    const session =
      await this.stripeConnectDemoService.createSubscriptionCheckoutForAdmin(
        user.sub,
      );

    return { url: session.url ?? '' };
  }

  @Post('admin/subscription/billing-portal')
  @UseGuards(JwtGuard, createRoleGuard([UserRole.ADMIN]))
  @ApiBearerAuth('JWT')
  @ApiOperation({
    summary:
      'Create a billing portal session for the connected account subscription',
  })
  async createBillingPortal(@CurrentUser() user: JwtPayload) {
    const session =
      await this.stripeConnectDemoService.createBillingPortalForAdmin(user.sub);

    return { url: session.url };
  }

  /**
   * Thin webhooks (V2 events)
   *
   * Stripe event destinations can be configured to deliver "thin" events.
   * Thin events contain minimal payload; we verify + parse the notification,
   * then retrieve the full event from Stripe.
   *
   * Stripe CLI example:
   * stripe listen --thin-events 'v2.core.account[requirements].updated,v2.core.account[.recipient].capability_status_updated,v2.core.account[configuration.merchant].capability_status_updated,v2.core.account[configuration.customer].capability_status_updated' --forward-thin-to <YOUR_LOCAL_ENDPOINT>
   */
  @Post('webhooks/thin')
  @ApiOperation({
    summary:
      'Webhook receiver for Stripe thin events (V2 account requirement/capability updates)',
  })
  @ApiResponse({ status: 200 })
  async handleThinWebhook(
    @Req() request: Request,
    @Headers('stripe-signature') signature: string,
  ): Promise<{ received: boolean }> {
    // IMPORTANT: Nest is configured with `rawBody: true` in main.ts, so
    // (request as any).rawBody should contain the exact bytes sent by Stripe.
    const rawBody = (request as any).rawBody as Buffer;

    const thinEventNotification = this.stripeService.parseThinEvent(
      rawBody,
      signature,
    );

    // Fetch the full event data to understand the failure / requirements.
    const fullEvent = await this.stripeService.retrieveV2Event(
      thinEventNotification.id,
    );

    // Handle each event type explicitly.
    // NOTE: For this demo we only log; in production you would store updated
    // requirements in your DB and notify the user.
    switch (fullEvent.type) {
      case 'v2.core.account[requirements].updated':
        // TODO: Persist account requirements changes to your DB.
        break;
      case 'v2.core.account[.recipient].capability_status_updated':
        // TODO: Persist capability status changes to your DB.
        break;
      case 'v2.core.account[configuration.merchant].capability_status_updated':
        // TODO: Persist capability status changes to your DB.
        break;
      case 'v2.core.account[configuration.customer].capability_status_updated':
        // TODO: Persist capability status changes to your DB.
        break;
      default:
        break;
    }

    return { received: true };
  }

  /**
   * Snapshot webhooks (regular events, not thin)
   *
   * This endpoint is used for subscription lifecycle events.
   *
   * IMPORTANT:
   * - These webhooks do NOT use thin events.
   * - You must configure a normal webhook endpoint and use STRIPE_WEBHOOK_SECRET.
   */
  @Post('webhooks/subscriptions')
  @ApiOperation({
    summary:
      'Webhook receiver for subscription lifecycle events (snapshot events)',
  })
  @ApiResponse({ status: 200 })
  handleSubscriptionWebhook(
    @Req() request: Request,
    @Headers('stripe-signature') signature: string,
  ): { received: boolean } {
    const body = (request as any).rawBody || JSON.stringify(request.body);

    const event = this.stripeService.constructWebhookEvent(body, signature);

    // NOTE: With V2 accounts, do not rely on Customer IDs. Stripe recommends
    // using `subscription.customer_account` to identify the account.
    // Example: accountId = subscription.customer_account (acct_...)
    switch (event.type) {
      case 'customer.subscription.updated': {
        // TODO: Write subscription status to your database.
        // You can use:
        // - subscription.id
        // - subscription.customer_account (acct_...)
        // - subscription.items.data[0].price
        // - subscription.items.data[0].quantity
        // - subscription.cancel_at_period_end
        // - subscription.pause_collection
        break;
      }
      case 'customer.subscription.deleted': {
        // TODO: Revoke access for subscription.customer_account.
        break;
      }
      case 'payment_method.attached': {
        // TODO: Update billing info in your database.
        break;
      }
      case 'payment_method.detached': {
        // TODO: Update billing info in your database.
        break;
      }
      case 'customer.updated': {
        // TODO: Update billing information changes only.
        break;
      }
      case 'customer.tax_id.created':
      case 'customer.tax_id.deleted':
      case 'customer.tax_id.updated': {
        // TODO: Update stored tax ID / validation status in your database.
        break;
      }
      case 'billing_portal.configuration.created':
      case 'billing_portal.configuration.updated':
      case 'billing_portal.session.created': {
        // Optional: track portal usage.
        break;
      }
      default:
        break;
    }

    return { received: true };
  }
}
