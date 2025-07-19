import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { drizzle } from 'drizzle-orm/postgres-js';
import { eq } from 'drizzle-orm';
import postgres from 'postgres';
import { task } from '@/lib/db/schema';

// Database connection
const client = postgres(process.env.POSTGRES_URL || '');
const db = drizzle(client);

// PATCH /api/todos/[listId]/tasks/[taskId] - Update a task
export async function PATCH(
    request: Request,
    { params }: { params: Promise<{ listId: string; taskId: string }> }
) {
    try {
        const session = await auth();

        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { taskId } = await params;
        const { completed } = await request.json();

        if (typeof completed !== 'boolean') {
            return NextResponse.json({ error: 'Completed must be a boolean' }, { status: 400 });
        }

        const updatedTask = await db
            .update(task)
            .set({ completed })
            .where(eq(task.id, taskId))
            .returning();

        if (updatedTask.length === 0) {
            return NextResponse.json({ error: 'Task not found' }, { status: 404 });
        }

        return NextResponse.json(updatedTask[0]);
    } catch (error) {
        console.error('Error updating task:', error);
        return NextResponse.json({ error: 'Failed to update task' }, { status: 500 });
    }
}

// DELETE /api/todos/[listId]/tasks/[taskId] - Delete a task
export async function DELETE(
    _request: Request,
    { params }: { params: Promise<{ listId: string; taskId: string }> }
) {
    try {
        const session = await auth();

        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { taskId } = await params;

        const deletedTask = await db
            .delete(task)
            .where(eq(task.id, taskId))
            .returning();

        if (deletedTask.length === 0) {
            return NextResponse.json({ error: 'Task not found' }, { status: 404 });
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error deleting task:', error);
        return NextResponse.json({ error: 'Failed to delete task' }, { status: 500 });
    }
}