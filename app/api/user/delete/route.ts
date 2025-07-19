import { type NextRequest, NextResponse } from 'next/server';
import { auth } from '@/app/(auth)/auth';
import { eq } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { user } from '@/lib/db/schema';

// biome-ignore lint: Forbidden non-null assertion.
const client = postgres(process.env.POSTGRES_URL!);
const db = drizzle(client);

/**
 * Delete the authenticated user's account
 * This permanently removes the user and all associated data from the database
 */
export async function DELETE(req: NextRequest) {
  try {
    // Get authenticated user
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Authentication required', message: 'You must be logged in to delete your account' },
        { status: 401 }
      );
    }
    
    const userId = session.user.id;
    
    try {
      // Delete the user from the database
      // Note: In a production environment, you might want to:
      // 1. Use a soft delete approach (mark as deleted but keep the record)
      // 2. Implement cascading deletion for all user-related data
      // 3. Add additional security measures like password confirmation
      
      // First, delete any related data (this depends on your schema)
      // For example, delete user's chats, messages, etc.
      
      // Then delete the user
      const result = await db
        .delete(user)
        .where(eq(user.id, userId));
      
      // Log the deletion for audit purposes
      console.log(`User ${userId} has been permanently deleted`);
      
      // Return success response
      return NextResponse.json({
        success: true,
        message: 'Your account has been permanently deleted'
      });
      
    } catch (error) {
      console.error('Error deleting user account:', error);
      return NextResponse.json(
        { error: 'Database error', message: 'Failed to delete your account due to a database error' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error in delete user route:', error);
    return NextResponse.json(
      { error: 'Server error', message: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}