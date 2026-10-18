import type { Page } from '@playwright/test';

type Json = null | boolean | number | string | Json[] | { [key: string]: Json };

/** Tools QADemo registers on document.modelContext for every store page. */
export const STORE_WEBMCP_TOOLS = [
  'add_to_cart',
  'clear_cart',
  'create_account',
  'get_cart',
  'get_order',
  'get_product',
  'get_session',
  'list_orders',
  'open_page',
  'place_order',
  'search_products',
  'set_cart_quantity',
  'sign_in',
  'sign_out',
] as const;

export interface WebMcpFailure {
  ok: false;
  error: {
    code: string;
    message: string;
  };
}

export interface WebMcpSuccess {
  ok: true;
  [key: string]: Json;
}

export type WebMcpResult = WebMcpSuccess | WebMcpFailure;

function isRecord(value: Json): value is { [key: string]: Json } {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/**
 * Call a QADemo WebMCP tool. A tool that rejects the input returns `{ ok: false }`.
 * An unknown tool name throws, because Playwright cannot reach an execute function.
 */
export async function callStoreTool(page: Page, name: string, input?: Json): Promise<WebMcpResult> {
  const result: Json = await page.webmcp.callTool(name, input);
  if (!isRecord(result) || typeof result.ok !== 'boolean') {
    throw new Error(`WebMCP tool ${name} returned an unexpected result.`);
  }
  return result as WebMcpResult;
}

/** Read the order id from a successful place_order or get_order result. */
export function orderIdFrom(result: WebMcpResult): number {
  if (!result.ok) {
    throw new Error('The WebMCP call did not succeed.');
  }
  const order = result.order;
  if (order === undefined || !isRecord(order) || typeof order.id !== 'number') {
    throw new Error('The WebMCP result did not include an order id.');
  }
  return order.id;
}

/** Card expiry far enough ahead that a checkout tool call stays in the future. */
export function futureCardExpiry(now: Date = new Date()): string {
  const expiry = new Date(now);
  expiry.setMonth(expiry.getMonth() + 14);
  const month = String(expiry.getMonth() + 1).padStart(2, '0');
  const year = String(expiry.getFullYear()).slice(-2);
  return `${month}/${year}`;
}
