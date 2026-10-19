# Domain Glossary

## Personas

| Words in a case | Account | How a spec uses it |
| :--- | :--- | :--- |
| Shopper, customer, signed-in user, buyer | Shared customer from global setup | `loadSignedUpUser()` inside the test, then `loginPage.login` |
| New visitor, signup, create account | Fresh account | `createSignupAccount()`. Do not write `playwright/.auth/customer.json` |
| Standard user, seeded login | `standard_user` / `standard123` | Only the seeded login test |
| Locked user | `locked_user` / `locked123` | Locked-login rejection |
| Admin, administrator | `admin_user` | Password is `$Admin` plus the local date as `DDMMYYYY` (`getAdminPassword()`) |
| Guest, signed out | No account | Do not apply storage state. Chromium starts signed out |

Google sign-in and Google signup stay manual. Assert that the Google button is present. Do not complete the Google prompt.

One customer has one cart. Parallel tests that share the signed-up customer share that cart. A case that adds, changes, or checks out items and is not about the shared shopper should use `createSignupAccount()`.

## Words that mean a concrete action

| Phrase | Implementation |
| :--- | :--- |
| Sign in | Username or email, then password, then the main-content button `/^Sign in$/i` |
| Sign up | Email, phone, optional username, password, confirm password, then Create account. Click the heading after the password so blur does not swallow the click |
| Add to cart | `catalogPage.addToCart(name)` or `productDetailPage.addToCart()` |
| Place order | Signed in, cart has a line, `VALID_SHIPPING`, card `4242424242424242`, a future `MM/YY` expiry |
| View orders | Navbar link whose name matches `/View orders for/i`, or `/orders` |
| Admin dashboard | Navbar link `Admin dashboard`, then tabs Overview, Products, Orders |

## Qase

- Project code: `QADEMO`.
- Case page: `https://app.qase.io/case/QADEMO-<id>`.
- Results append to run 1: `https://app.qase.io/run/QADEMO/dashboard/1`.
- The case title stays unchanged. A title `FR-AUTH-001: Login page offers Google sign-in and a username or email form` needs `FR-AUTH-001` in the describe and that exact test title.
