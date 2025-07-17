import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { drizzle } from 'drizzle-orm/postgres-js';
import { eq, inArray } from 'drizzle-orm';
import postgres from 'postgres';
import { todoList, task } from '@/lib/db/schema';
import type { TodoList, Task } from '@/lib/db/schema';

// Database connection
const client = postgres(process.env.POSTGRES_URL!);
const db = drizzle(client);

// GET /api/todos - Get all todo lists for the current user
export async function GET() {
    try {
        const session = await auth();

        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Get all todo lists for the user
        const lists = await db.select().from(todoList).where(eq(todoList.userId, session.user.id));

        // Get all tasks for these lists
        let tasks: Task[] = [];
        if (lists.length > 0) {
            const listIds = lists.map(list => list.id);
            tasks = await db.select().from(task).where(inArray(task.todoListId, listIds));
        }

        // Combine lists with their tasks
        const listsWithTasks = lists.map(list => ({
            ...list,
            tasks: tasks.filter(t => t.todoListId === list.id)
        }));

        return NextResponse.json(listsWithTasks);
    } catch (error) {
        console.error('Error fetching todo lists:', error);
        return NextResponse.json({ error: 'Failed to fetch todo lists' }, { status: 500 });
    }
}

// POST /api/todos - Create a new todo list
export async function POST(request: Request) {
    try {
        const session = await auth();

        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { title } = await request.json();

        if (!title || typeof title !== 'string' || title.trim().length === 0) {
            return NextResponse.json({ error: 'Title is required' }, { status: 400 });
        }

        const newList = await db.insert(todoList).values({
            title: title.trim(),
            userId: session.user.id,
        }).returning();

        return NextResponse.json({ ...newList[0], tasks: [] }, { status: 201 });
    } catch (error) {
        console.error('Error creating todo list:', error);
        return NextResponse.json({ error: 'Failed to create todo list' }, { status: 500 });
    }
}