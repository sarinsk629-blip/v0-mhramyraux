declare module '@paypal/checkout-server-sdk' {
  export namespace core {
    export interface Environment {
      baseUrl(): string;
    }
    
    export class PayPalHttpClient {
      constructor(environment: Environment);
      execute(request: any): Promise<{ result: any; statusCode: number }>;
    }
    
    export class SandboxEnvironment implements Environment {
      constructor(clientId: string, clientSecret: string);
      baseUrl(): string;
    }
    
    export class LiveEnvironment implements Environment {
      constructor(clientId: string, clientSecret: string);
      baseUrl(): string;
    }
  }
  
  export namespace orders {
    export interface OrderRequest {
      intent: 'CAPTURE' | 'AUTHORIZE';
      purchase_units: Array<{
        amount: {
          currency_code: string;
          value: string;
        };
        description?: string;
      }>;
    }
    
    export class OrdersCreateRequest {
      prefer(value: string): void;
      requestBody(body: OrderRequest): void;
    }
    
    export class OrdersCaptureRequest {
      constructor(orderId: string);
      requestBody(body: Record<string, any>): void;
    }
  }
}
