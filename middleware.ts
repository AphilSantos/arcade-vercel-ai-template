import NextAuth from 'next-auth';
import { NextResponse } from 'next/server';
import { authConfig } from '@/app/(auth)/auth.config';

// Note: We're not using middleware for usage checks anymore
// Instead, we're checking usage directly in the chat API route
// This is more reliable and avoids issues with middleware execution order

export default NextAuth(authConfig).auth;

export const config = {
  matcher: ['/', '/:id', '/api/:path*', '/login', '/register'],
};
