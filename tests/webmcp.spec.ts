import { test, expect } from '../src/fixtures/pomFixtures';
import { createSignupAccount, VALID_PAYMENT, VALID_SHIPPING } from '../src/test-data';
import { callStoreTool, futureCardExpiry, orderIdFrom, STORE_WEBMCP_TOOLS } from '../src/utils/webmcp';

const HEADPHONES = {
  name: 'Wireless Headphones',
  slug: 'wireless-headphones',
};

test.describe('WebMCP store tools', () => {
  test.describe('@p1 FR-MCP-001: Registered store tools', () => {
    test('Home page registers the store WebMCP tools', async ({ page }) => {
      await test.step('Open the home page', async () => {
        await page.goto('/');
      });

      await test.step('Verify the store tools are registered', async () => {
        const tools = await page.webmcp.tools();
        expect(tools.map((tool) => tool.name)).toEqual([...STORE_WEBMCP_TOOLS]);
      });

      await test.step('Verify read-only and consequential hints', async () => {
        const tools = await page.webmcp.tools();
        expect(tools.find((tool) => tool.name === 'search_products')?.annotations).toMatchObject({ readOnly: true });
        expect(tools.find((tool) => tool.name === 'get_session')?.annotations).toMatchObject({ readOnly: true });
        expect(tools.find((tool) => tool.name === 'place_order')?.annotations).toMatchObject({ consequential: true });
      });
    });
  });

  test.describe('@p1 FR-MCP-002: Catalog lookup', () => {
    test('Search and load a catalog product', async ({ page }) => {
      await test.step('Open the home page', async () => {
        await page.goto('/');
      });

      await test.step('Search for headphones that are in stock', async () => {
        const result = await callStoreTool(page, 'search_products', { query: 'headphones', inStockOnly: true });
        expect(result).toMatchObject({
          ok: true,
          totalMatches: 1,
          products: [expect.objectContaining({ slug: HEADPHONES.slug, name: HEADPHONES.name, inStock: true })],
        });
      });

      await test.step('Load that product by slug', async () => {
        const result = await callStoreTool(page, 'get_product', { slug: HEADPHONES.slug });
        expect(result).toMatchObject({
          ok: true,
          product: expect.objectContaining({
            slug: HEADPHONES.slug,
            name: HEADPHONES.name,
            path: `/products/${HEADPHONES.slug}`,
          }),
        });
      });
    });
  });

  test.describe('@p1 FR-MCP-003: Shopper order through WebMCP', () => {
    test('Create an account, place an order, and open the order page', async ({ page, orderDetailPage }) => {
      const account = createSignupAccount();

      await test.step('Open the home page as a guest', async () => {
        await page.goto('/');
        const session = await callStoreTool(page, 'get_session');
        expect(session).toMatchObject({ ok: true, signedIn: false, user: null });
      });

      await test.step('Create an account and confirm the session', async () => {
        const created = await callStoreTool(page, 'create_account', {
          email: account.email,
          phone: account.phone,
          password: account.password,
          username: account.username,
        });
        expect(created).toMatchObject({
          ok: true,
          signedIn: true,
          user: expect.objectContaining({ username: account.username, userType: 'standard' }),
        });

        const session = await callStoreTool(page, 'get_session');
        expect(session).toMatchObject({
          ok: true,
          signedIn: true,
          user: expect.objectContaining({ username: account.username }),
        });
      });

      await test.step('Add Wireless Headphones to the cart', async () => {
        const added = await callStoreTool(page, 'add_to_cart', { slug: HEADPHONES.slug, quantity: 1 });
        expect(added).toMatchObject({
          ok: true,
          cart: expect.objectContaining({
            totalItems: 1,
            items: [expect.objectContaining({ slug: HEADPHONES.slug, quantity: 1 })],
          }),
        });
      });

      let orderId = 0;

      await test.step('Place the order with the published test card', async () => {
        const placed = await callStoreTool(page, 'place_order', {
          firstName: VALID_SHIPPING.firstName,
          lastName: VALID_SHIPPING.lastName,
          address: VALID_SHIPPING.address,
          cardNumber: VALID_PAYMENT.cardNumber,
          expiryDate: futureCardExpiry(),
          cvv: VALID_PAYMENT.cvv,
          cardholderName: VALID_PAYMENT.cardholderName,
        });
        expect(placed).toMatchObject({
          ok: true,
          order: expect.objectContaining({
            status: 'pending',
            paymentLastFour: '4242',
            shippingName: `${VALID_SHIPPING.firstName} ${VALID_SHIPPING.lastName}`,
          }),
        });
        orderId = orderIdFrom(placed);
      });

      await test.step('Verify the order is listed and can be loaded', async () => {
        const listed = await callStoreTool(page, 'list_orders');
        expect(listed).toMatchObject({
          ok: true,
          orders: expect.arrayContaining([expect.objectContaining({ id: orderId })]),
        });

        const loaded = await callStoreTool(page, 'get_order', { orderId });
        expect(loaded).toMatchObject({
          ok: true,
          order: expect.objectContaining({
            id: orderId,
            items: [expect.objectContaining({ name: HEADPHONES.name, quantity: 1 })],
          }),
        });
      });

      await test.step('Open the order page for the shopper', async () => {
        const opened = await callStoreTool(page, 'open_page', { page: 'order', orderId });
        expect(opened).toMatchObject({ ok: true, path: `/orders/${orderId}` });
        await expect(page).toHaveURL(new RegExp(`/orders/${orderId}$`));
        await expect(orderDetailPage.orderIdText).toBeVisible();
      });
    });
  });

  test.describe('@p2 FR-MCP-004: Rejected WebMCP calls', () => {
    test('Reject invalid sign-in, invalid signup, and a guest order list', async ({ page }) => {
      await test.step('Open the home page as a guest', async () => {
        await page.goto('/');
      });

      await test.step('Verify a guest cannot list orders', async () => {
        const listed = await callStoreTool(page, 'list_orders');
        expect(listed).toMatchObject({
          ok: false,
          error: expect.objectContaining({ code: 'AUTH_REQUIRED' }),
        });
      });

      await test.step('Verify unknown credentials are rejected', async () => {
        const signedIn = await callStoreTool(page, 'sign_in', {
          username: `nobody_${Date.now().toString(36)}`,
          password: 'WrongPass1!',
        });
        expect(signedIn).toMatchObject({
          ok: false,
          error: expect.objectContaining({ code: 'INVALID_CREDENTIALS' }),
        });
      });

      await test.step('Verify an invalid signup is rejected', async () => {
        const created = await callStoreTool(page, 'create_account', {
          email: 'bad',
          phone: '1',
          password: 'short',
        });
        expect(created).toMatchObject({
          ok: false,
          error: expect.objectContaining({ code: 'VALIDATION' }),
        });
      });
    });
  });

  test.describe('@p2 FR-MCP-005: Cart quantity tools', () => {
    test('Update a cart quantity and clear the cart', async ({ page }) => {
      const account = createSignupAccount();

      await test.step('Create an account', async () => {
        await page.goto('/');
        const created = await callStoreTool(page, 'create_account', {
          email: account.email,
          phone: account.phone,
          password: account.password,
          username: account.username,
        });
        expect(created).toMatchObject({ ok: true, signedIn: true });
      });

      await test.step('Add two headphones and then set the quantity to one', async () => {
        const added = await callStoreTool(page, 'add_to_cart', { name: HEADPHONES.name, quantity: 2 });
        expect(added).toMatchObject({
          ok: true,
          cart: expect.objectContaining({ totalItems: 2 }),
        });

        const updated = await callStoreTool(page, 'set_cart_quantity', { slug: HEADPHONES.slug, quantity: 1 });
        expect(updated).toMatchObject({
          ok: true,
          cart: expect.objectContaining({
            totalItems: 1,
            items: [expect.objectContaining({ slug: HEADPHONES.slug, quantity: 1 })],
          }),
        });
      });

      await test.step('Clear the cart and verify checkout is refused', async () => {
        const cleared = await callStoreTool(page, 'clear_cart');
        expect(cleared).toMatchObject({
          ok: true,
          cart: expect.objectContaining({ totalItems: 0, items: [] }),
        });

        const placed = await callStoreTool(page, 'place_order', {
          firstName: VALID_SHIPPING.firstName,
          lastName: VALID_SHIPPING.lastName,
          address: VALID_SHIPPING.address,
          cardNumber: VALID_PAYMENT.cardNumber,
          expiryDate: futureCardExpiry(),
          cvv: VALID_PAYMENT.cvv,
          cardholderName: VALID_PAYMENT.cardholderName,
        });
        expect(placed).toMatchObject({
          ok: false,
          error: expect.objectContaining({ code: 'CART_EMPTY' }),
        });
      });
    });
  });

  test.describe('@p2 FR-MCP-006: Open store pages', () => {
    test('Open the catalog and a product page for the shopper', async ({ page, catalogPage, productDetailPage }) => {
      await test.step('Open the home page', async () => {
        await page.goto('/');
      });

      await test.step('Open the catalog', async () => {
        const opened = await callStoreTool(page, 'open_page', { page: 'catalog' });
        expect(opened).toMatchObject({ ok: true, path: '/catalog' });
        await expect(page).toHaveURL(/\/catalog$/);
        await expect(catalogPage.pageHeading).toBeVisible();
      });

      await test.step('Open the Wireless Headphones product page', async () => {
        const opened = await callStoreTool(page, 'open_page', { page: 'product', slug: HEADPHONES.slug });
        expect(opened).toMatchObject({ ok: true, path: `/products/${HEADPHONES.slug}` });
        await expect(page).toHaveURL(new RegExp(`/products/${HEADPHONES.slug}$`));
        await expect(productDetailPage.productName).toHaveText(HEADPHONES.name);
      });
    });
  });

  test.describe('@p2 FR-MCP-007: Unknown tool', () => {
    test('Reject a tool the store did not register', async ({ page }) => {
      await test.step('Open the home page', async () => {
        await page.goto('/');
      });

      await test.step('Verify an unknown tool name is rejected', async () => {
        await expect(page.webmcp.callTool('not_a_store_tool')).rejects.toThrow(/No WebMCP tool named "not_a_store_tool"/);
      });
    });
  });
});
