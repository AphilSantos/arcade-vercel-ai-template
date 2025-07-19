import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { drizzle } from 'drizzle-orm/postgres-js';
import { eq } from 'drizzle-orm';
import postgres from 'postgres';
import { todoList } from '@/lib/db/schema';

// Database connection
const client = postgres(process.env.POSTGRES_URL || '');
const db = drizzle(client);

// DELETE /api/todos/[listId] - Delete a todo list
export async function DELETE(
    _request: Request,
    { params }: { params: Promise<{ listId: string }> }
) {
    try {
        const session = await auth();

        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { listId } = await params;

        const deletedList = await db
            .delete(todoList)
            .where(eq(todoList.id, listId))
            .returning();

        if (deletedList.length === 0) {
            return NextResponse.json({ error: 'Todo list not found' }, { status: 404 });
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error deleting todo list:', error);
        return NextResponse.json({ error: 'Failed to delete todo list' }, { status: 500 });
    }
}