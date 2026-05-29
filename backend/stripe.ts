import Stripe from 'stripe';
import * as dotenv from 'dotenv';
import { Hono } from 'hono';

dotenv.config();

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
  apiVersion: '2026-04-22.dahlia',
});

const stripeApp = new Hono();

// API endpoint to fetch all products and their prices
stripeApp.get("/products-with-prices", async (c) => {
  try {
    const products = await stripe.products.list({ active: true });
    const prices = await stripe.prices.list({ active: true, limit: 100 });

    const productsWithPrices = products.data.map((product) => {
      const productPrices = prices.data.filter(
        (price) => price.product === product.id
      );
      return { ...product, prices: productPrices };
    });

    return c.json(productsWithPrices);
  } catch (error: any) {
    return c.json({ error: error.message }, 400);
  }
});

// API endpoint to create a customer
stripeApp.post('/create-customer', async (c) => {
  try {
    const { email, name } = await c.req.json();
    const customer = await stripe.customers.create({
      email,
      name,
    });
    return c.json({ customerId: customer.id });
  } catch (error: any) {
    return c.json({ error: error.message }, 400);
  }
});

// API endpoint to create a subscription
stripeApp.post('/create-subscription', async (c) => {
  try {
    const { customerId, priceId } = await c.req.json();
    const subscription = await stripe.subscriptions.create({
      customer: customerId,
      items: [{ price: priceId }],
      payment_behavior: 'default_incomplete',
      expand: ['latest_invoice.payment_intent'],
    });
    return c.json({ subscriptionId: subscription.id, clientSecret: (subscription.latest_invoice as Stripe.Invoice).payment_intent?.client_secret });
  } catch (error: any) {
    return c.json({ error: error.message }, 400);
  }
});

// API endpoint to check usage (for metered billing)
stripeApp.get('/usage/:subscriptionItemId', async (c) => {
  try {
    const { subscriptionItemId } = c.req.param();
    // This is a placeholder. Actual usage reporting would be done via Stripe Usage Records API.
    // For now, we'll return a dummy usage.
    return c.json({ usage: Math.floor(Math.random() * 1000) });
  } catch (error: any) {
    return c.json({ error: error.message }, 400);
  }
});

// API endpoint to create a one-off invoice
stripeApp.post('/create-one-off-invoice', async (c) => {
  try {
    const { customerId, amount, description } = await c.req.json();
    const invoiceItem = await stripe.invoiceItems.create({
      customer: customerId,
      amount,
      currency: 'usd',
      description,
    });
    const invoice = await stripe.invoices.create({
      customer: customerId,
      collection_method: 'send_invoice',
      days_until_due: 7,
    });
    return c.json({ invoiceId: invoice.id });
  } catch (error: any) {
    return c.json({ error: error.message }, 400);
  }
});

// API endpoint to generate a payment link for custom projects
stripeApp.post('/create-payment-link', async (c) => {
  try {
    const { amount, description } = await c.req.json();
    const paymentLink = await stripe.paymentLinks.create({
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: description,
            },
            unit_amount: amount,
          },
          quantity: 1,
        },
      ],
    });
    return c.json({ paymentLinkUrl: paymentLink.url });
  } catch (error: any) {
    return c.json({ error: error.message }, 400);
  }
});

// Webhook endpoint to handle Stripe events
stripeApp.post('/webhook', async (c) => {
  const sig = c.req.header('stripe-signature');
  const body = await c.req.text();

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, sig!, process.env.STRIPE_WEBHOOK_SECRET as string);
  } catch (err: any) {
    return c.json({ error: `Webhook Error: ${err.message}` }, 400);
  }

  // Handle the event
  switch (event.type) {
    case 'customer.subscription.created':
      const subscriptionCreated = event.data.object as Stripe.Subscription;
      console.log(`Subscription created: ${subscriptionCreated.id}`);
      // Handle subscription creation (e.g., update your database)
      break;
    case 'customer.subscription.updated':
      const subscriptionUpdated = event.data.object as Stripe.Subscription;
      console.log(`Subscription updated: ${subscriptionUpdated.id}`);
      // Handle subscription updates (e.g., change of plan, payment method)
      break;
    case 'customer.subscription.deleted':
      const subscriptionDeleted = event.data.object as Stripe.Subscription;
      console.log(`Subscription deleted: ${subscriptionDeleted.id}`);
      // Handle subscription cancellation
      break;
    case 'invoice.payment_succeeded':
      const invoicePaid = event.data.object as Stripe.Invoice;
      console.log(`Invoice paid: ${invoicePaid.id}`);
      // Provision access to the product/service
      break;
    case 'invoice.payment_failed':
      const invoiceFailed = event.data.object as Stripe.Invoice;
      console.log(`Invoice payment failed: ${invoiceFailed.id}`);
      // Handle failed payments (e.g., send dunning emails)
      break;
    // ... handle other event types
    default:
      console.log(`Unhandled event type ${event.type}`);
  }

  return c.json({ received: true });
});

export default stripeApp;
