import Stripe from 'stripe';

export interface PaymentConfig {
  stripeSecretKey: string;
  webhookSecret: string;
}

export interface PaymentIntent {
  id: string;
  amount: number;
  currency: string;
  status: string;
  clientSecret: string;
}

export class PaymentGatewayService {
  private stripe: Stripe;

  constructor(private config: PaymentConfig) {
    this.stripe = new Stripe(config.stripeSecretKey, {
      apiVersion: '2023-10-16',
    });
  }

  async createPaymentIntent(
    amount: number,
    currency: string = 'brl',
    metadata: Record<string, string> = {}
  ): Promise<PaymentIntent> {
    try {
      const paymentIntent = await this.stripe.paymentIntents.create({
        amount: Math.round(amount * 100), // Convert to cents
        currency,
        metadata,
        automatic_payment_methods: {
          enabled: true,
        },
      });

      return {
        id: paymentIntent.id,
        amount: paymentIntent.amount / 100,
        currency: paymentIntent.currency,
        status: paymentIntent.status,
        clientSecret: paymentIntent.client_secret!,
      };
    } catch (error: any) {
      throw new Error(`Erro ao criar payment intent: ${error.message}`);
    }
  }

  async confirmPayment(paymentIntentId: string): Promise<PaymentIntent> {
    try {
      const paymentIntent = await this.stripe.paymentIntents.confirm(paymentIntentId);

      return {
        id: paymentIntent.id,
        amount: paymentIntent.amount / 100,
        currency: paymentIntent.currency,
        status: paymentIntent.status,
        clientSecret: paymentIntent.client_secret!,
      };
    } catch (error: any) {
      throw new Error(`Erro ao confirmar pagamento: ${error.message}`);
    }
  }

  async handleWebhook(payload: string, signature: string): Promise<any> {
    try {
      const event = this.stripe.webhooks.constructEvent(
        payload,
        signature,
        this.config.webhookSecret
      );

      return event;
    } catch (error: any) {
      throw new Error(`Erro ao processar webhook: ${error.message}`);
    }
  }
}
