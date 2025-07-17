import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';

// Database connection
const client = postgres(process.env.POSTGRES_URL!);
const db = drizzle(client);

// GET /api/debug - Get database schema information
export async function GET() {
    try {
        const session = await auth();

        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Query to get table information
        const tableInfo = await client`
      SELECT 
        table_name, 
        column_name, 
        data_type
      FROM 
        information_schema.columns
      WHERE 
        table_name IN ('TodoList', 'Task', 'TaskContext')
      ORDER BY 
        table_name, ordinal_position;
    `;

        return NextResponse.json({ tableInfo });
    } catch (error) {
        console.error('Error fetching debug info:', error);
        return NextResponse.json({ error: 'Failed to fetch debug info' }, { status: 500 });
    }
}