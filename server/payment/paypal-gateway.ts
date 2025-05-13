import { IPaymentGateway } from "./gateway";
import { 
  Client,
  Environment, 
  LogLevel,
  OAuthAuthorizationController,
  OrdersController 
} from "@paypal/paypal-server-sdk";

export class PayPalGateway implements IPaymentGateway {
  private client: Client;
  private ordersController: OrdersController;
  private oAuthAuthorizationController: OAuthAuthorizationController;
  private initialized: boolean = false;

  constructor() {
    const { PAYPAL_CLIENT_ID, PAYPAL_CLIENT_SECRET } = process.env;

    if (!PAYPAL_CLIENT_ID) {
      throw new Error("Missing PAYPAL_CLIENT_ID");
    }
    if (!PAYPAL_CLIENT_SECRET) {
      throw new Error("Missing PAYPAL_CLIENT_SECRET");
    }

    this.client = new Client({
      clientCredentialsAuthCredentials: {
        oAuthClientId: PAYPAL_CLIENT_ID,
        oAuthClientSecret: PAYPAL_CLIENT_SECRET,
      },
      timeout: 0,
      environment:
        process.env.NODE_ENV === "production"
          ? Environment.Production
          : Environment.Sandbox,
      logging: {
        logLevel: LogLevel.Info,
        logRequest: {
          logBody: true,
        },
        logResponse: {
          logHeaders: true,
        },
      },
    });

    this.ordersController = new OrdersController(this.client);
    this.oAuthAuthorizationController = new OAuthAuthorizationController(this.client);
  }

  async initialize(): Promise<void> {
    console.log("[DEBUG] PayPal Gateway Initialized");
    this.initialized = true;
  }

  async processPayment(amount: number, userId: string): Promise<{ success: boolean; transactionId?: string }> {
    try {
      if (!this.initialized) {
        await this.initialize();
      }

      const orderCreateRequest = {
        body: {
          intent: "CAPTURE",
          purchaseUnits: [
            {
              amount: {
                currencyCode: "USD",
                value: amount.toString(),
              },
              description: `GhostliAI Pro Subscription - User ${userId}`,
              customId: userId,
            },
          ],
        },
        prefer: "return=minimal",
      };

      const { body, ...httpResponse } = await this.ordersController.createOrder(orderCreateRequest);
      const jsonResponse = JSON.parse(String(body));
      
      if (httpResponse.statusCode >= 200 && httpResponse.statusCode < 300) {
        return { 
          success: true, 
          transactionId: jsonResponse.id 
        };
      } else {
        console.error("Error creating PayPal order:", jsonResponse);
        return { success: false };
      }
    } catch (error) {
      console.error("Failed to process PayPal payment:", error);
      return { success: false };
    }
  }

  async capturePayment(orderId: string): Promise<{ success: boolean, details?: any }> {
    try {
      if (!this.initialized) {
        await this.initialize();
      }

      const captureRequest = {
        id: orderId,
        prefer: "return=minimal",
      };

      const { body, ...httpResponse } = await this.ordersController.captureOrder(captureRequest);
      const jsonResponse = JSON.parse(String(body));
      
      if (httpResponse.statusCode >= 200 && httpResponse.statusCode < 300) {
        return { 
          success: true, 
          details: jsonResponse
        };
      } else {
        console.error("Error capturing PayPal order:", jsonResponse);
        return { success: false };
      }
    } catch (error) {
      console.error("Failed to capture PayPal payment:", error);
      return { success: false };
    }
  }

  async refund(transactionId: string): Promise<{ success: boolean }> {
    console.log(`[DEBUG] Refunding PayPal transaction ${transactionId}`);
    // For now, this is just a placeholder - actual PayPal refund implementation 
    // would need to use the PayPal Refund API
    return { success: true };
  }

  async getStatus(transactionId: string): Promise<string> {
    try {
      if (!this.initialized) {
        await this.initialize();
      }

      const orderRequest = {
        id: transactionId,
        prefer: "return=minimal",
      };

      const { body, ...httpResponse } = await this.ordersController.getOrder(orderRequest);
      const jsonResponse = JSON.parse(String(body));
      
      return jsonResponse.status || "UNKNOWN";
    } catch (error) {
      console.error("Failed to get PayPal payment status:", error);
      return "ERROR";
    }
  }

  async getClientToken(): Promise<string> {
    if (!this.initialized) {
      await this.initialize();
    }

    const { PAYPAL_CLIENT_ID, PAYPAL_CLIENT_SECRET } = process.env;
    const auth = Buffer.from(`${PAYPAL_CLIENT_ID}:${PAYPAL_CLIENT_SECRET}`).toString("base64");

    const { result } = await this.oAuthAuthorizationController.requestToken(
      {
        authorization: `Basic ${auth}`,
      },
      { intent: "sdk_init", response_type: "client_token" },
    );

    return result.accessToken;
  }
}