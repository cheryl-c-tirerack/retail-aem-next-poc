import { jsonpResponse } from '@/lib/java-contract/jsonp';
import { GUEST_USER, javaSuccess, type UserInfo } from '@/lib/java-contract/types';
import { getSession } from '@/lib/session/session';

// Contract 2: AEM reads loggedIn, name, email, uuid on every page load (JSONP).
// The token carries no name/email, so a signed-in user's profile fields are stubbed from the
// session until a BFF profile endpoint exists. Guest shape when there is no session.
export async function GET(request: Request): Promise<Response> {
  const session = await getSession();

  const user: UserInfo = session
    ? {
        ...GUEST_USER,
        loggedIn: true,
        name: session.displayName,
        firstName: session.displayName.split(' ')[0] ?? session.displayName,
        email: session.email,
        id: session.accountNumber,
      }
    : GUEST_USER;

  return jsonpResponse(request, javaSuccess(user));
}
