export type PaymentRequest = {
  orderId: string;
  amountInPaise: number;
  currency: 'INR';
  method: 'upi' | 'cards' | 'netbanking';
};

export type PaymentIntent = {
  provider: string;
  providerOrderId: string;
  checkoutUrl: string;
};

export interface PaymentService {
  createIntent(input: PaymentRequest): Promise<PaymentIntent>;
  verifyWebhook(rawBody: string, signature: string): Promise<boolean>;
}

export class PaymentProviderUnavailableError extends Error {
  constructor() {
    super('Checkout is unavailable until a supported Indian payment provider and verified webhook are configured.');
    this.name = 'PaymentProviderUnavailableError';
  }
}

export const paymentService: PaymentService = {
  async createIntent() {
    throw new PaymentProviderUnavailableError();
  },
  async verifyWebhook() {
    throw new PaymentProviderUnavailableError();
  },
};
