import { NextResponse } from 'next/server';

// AEM's header calls getUser and getCartDetails as jQuery JSONP. Same-origin, so jQuery fetches by
// XHR and runs the body as JavaScript. The callback name is written into that script, so it is
// validated before use. Without a valid callback, plain JSON is returned.

const CALLBACK_PATTERN = /^[A-Za-z_$][\w$.]*$/;

/**
 * Returns a JSONP response (`callback(json);`) when the request has a valid `callback` query param,
 * or plain JSON otherwise.
 */
export function jsonpResponse(request: Request, payload: unknown): NextResponse {
  const callback = new URL(request.url).searchParams.get('callback');
  const json = JSON.stringify(payload);

  if (callback && CALLBACK_PATTERN.test(callback)) {
    return new NextResponse(`${callback}(${json});`, {
      headers: { 'Content-Type': 'application/javascript; charset=utf-8' },
    });
  }

  return NextResponse.json(payload);
}
