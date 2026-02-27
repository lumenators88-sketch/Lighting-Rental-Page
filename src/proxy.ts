import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function proxy(req: NextRequest) {
    const url = req.nextUrl;

    if (url.pathname.startsWith('/admin')) {
        const basicAuth = req.headers.get('authorization');

        if (basicAuth) {
            const authValue = basicAuth.split(' ')[1];
            const [user, pwd] = atob(authValue).split(':');

            const validUser = 'admin';
            const validPwd = process.env.ADMIN_PASSWORD || '1234'; // Default for local dev

            if (user === validUser && pwd === validPwd) {
                return NextResponse.next();
            }
        }

        return new NextResponse('Auth required', {
            status: 401,
            headers: {
                'WWW-Authenticate': 'Basic realm="Secure Area"',
            },
        });
    }

    return NextResponse.next();
}

export const config = {
    matcher: ['/admin/:path*'],
};
