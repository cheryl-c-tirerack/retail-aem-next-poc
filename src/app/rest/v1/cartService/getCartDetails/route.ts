import { jsonpResponse } from '@/lib/java-contract/jsonp';
import { type CartCount, javaSuccess } from '@/lib/java-contract/types';

// Contract 3: AEM writes data.count into the cart badge (JSONP). No cart service exists in the new
// stack (the cart lived in the Tomcat session), so the count is 0 for now. This keeps AEM's code on
// its success path and removes the 404-driven console error. See the plan, Phase 2.
export async function GET(request: Request): Promise<Response> {
  const cart: CartCount = { count: 0 };
  return jsonpResponse(request, javaSuccess(cart));
}
