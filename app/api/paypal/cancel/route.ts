import { NextRequest, NextResponse } from 'next/server';

/**
 * Handle cancelled PayPal subscription approval
 * 
 * This endpoint is called when the user cancels the subscription approval process
 */
export async function GET(req: NextRequest) {
  try {
    console.log('User cancelled PayPal subscription approval');
    
    // Redirect back to subscription page with cancellation message
    return NextResponse.redirect(new URL('/subscription?cancelled=true', req.url));
    
  } catch (error) {
    console.error('Error processing PayPal cancel callback:', error);
    return NextResponse.redirect(new URL('/subscription?error=processing_failed', req.url));
  }
}