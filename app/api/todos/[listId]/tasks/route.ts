import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { drizzle } from 'drizzle-orm/postgres-js';
import { eq } from 'drizzle-orm';
import postgres from 'postgres';
import { task } from '@/lib/db/schema';
import type { Task } from '@/lib/db/schema';

// Database connection
const client = postgres(process.env.POSTGRES_URL!);
const db = drizzle(client);

// GET /api/todos/[listId]/tasks - Get all tasks for a todo list
export async function GET(
    request: Request,
    { params }: { params: { listId: string } }
) {
    try {
        const session = await auth();

        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { listId } = params;

        const tasks = await db
            .select()
            .from(task)
            .where(eq(task.todoListId, listId));

        return NextResponse.json(tasks);
    } catch (error) {
        console.error('Error fetching tasks:', error);
        return NextResponse.json({ error: 'Failed to fetch tasks' }, { status: 500 });
    }
}

// POST /api/todos/[listId]/tasks - Create a new task
export async function POST(
    request: Request,
    { params }: { params: { listId: string } }
) {
    try {
        const session = await auth();

        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { listId } = params;
        const { title } = await request.json();

        if (!title || typeof title !== 'string' || title.trim().length === 0) {
            return NextResponse.json({ error: 'Title is required' }, { status: 400 });
        }

        const newTask = await db
            .insert(task)
            .values({
                title: title.trim(),
                todoListId: listId,
            })
            .returning();

        return NextResponse.json(newTask[0], { status: 201 });
    } catch (error) {
        console.error('Error creating task:', error);
        return NextResponse.json({ error: 'Failed to create task' }, { status: 500 });
    }
}