# Application Route and Page Object Map

Source of truth for behavior: `docs/FRD-QADemo.md`.

| Feature | URL | Page object | Fixture | Spec |
| :--- | :--- | :--- | :--- | :--- |
| Home | `/` | `src/pages/HomePage.ts` | `homePage` | `tests/catalog.spec.ts` |
| Login | `/login` | `src/pages/LoginPage.ts` | `loginPage` | `tests/auth.spec.ts` |
| Signup | `/signup` | `src/pages/SignupPage.ts` | `signupPage` | `tests/auth.spec.ts` |
| Catalog | `/catalog` | `src/pages/CatalogPage.ts` | `catalogPage` | `tests/catalog.spec.ts` |
| Product | `/products/:slug` | `src/pages/ProductDetailPage.ts` | `productDetailPage` | `tests/catalog.spec.ts` |
| Cart | `/cart` | `src/pages/CartPage.ts` | `cartPage` | `tests/cart.spec.ts` |
| Checkout | `/checkout` | `src/pages/CheckoutPage.ts` | `checkoutPage` | `tests/checkout.spec.ts` |
| Orders | `/orders` | `src/pages/OrdersPage.ts` | `ordersPage` | `tests/orders.spec.ts` |
| Order detail | `/orders/:id` | `src/pages/OrderDetailPage.ts` | `orderDetailPage` | `tests/orders.spec.ts` |
| Admin | `/admin` | `src/pages/AdminPage.ts` | `adminPage` | `tests/admin.spec.ts` |
| Navbar | every page | `src/components/NavBar.ts` | `navBar` | `tests/navigation.spec.ts` |
| Footer | every page | `src/components/Footer.ts` | `footer` | `tests/navigation.spec.ts` |
| REST API | `/api/*` | none | `request` | `tests/api.spec.ts` |
| WebMCP | every page | `src/utils/webmcp.ts` | `page` | `tests/webmcp.spec.ts` |

Register a new page object in `src/fixtures/pomFixtures.ts` before a spec uses it. Specs import `{ test, expect }` from that fixture file.
