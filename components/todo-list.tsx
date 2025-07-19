'use client';

import { useState, useEffect } from 'react';
import { Check, Plus, Trash2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import type { User } from 'next-auth';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';

type TodoList = {
  id: string;
  title: string;
  tasks: Task[];
};

type Task = {
  id: string;
  title: string;
  completed: boolean;
};

export function TodoListSidebar({ user }: { user: User | undefined }) {
  const [todoLists, setTodoLists] = useState<TodoList[]>([]);
  const [newListTitle, setNewListTitle] = useState('');
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [activeListId, setActiveListId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAddingList, setIsAddingList] = useState(false);
  const [isAddingTask, setIsAddingTask] = useState(false);

  // Fetch todo lists
  useEffect(() => {
    if (!user) return;

    const fetchTodoLists = async () => {
      try {
        const response = await fetch('/api/todos', {
          credentials: 'include',
        });
        if (!response.ok) throw new Error('Failed to fetch todo lists');
        const data = await response.json();
        setTodoLists(data);
        if (data.length > 0 && !activeListId) {
          setActiveListId(data[0].id);
        }
      } catch (error) {
        console.error('Error fetching todo lists:', error);
        toast.error('Failed to load todo lists');
      } finally {
        setIsLoading(false);
      }
    };

    fetchTodoLists();
  }, [user, activeListId]);

  const createTodoList = async () => {
    if (!newListTitle.trim() || !user) return;

    try {
      const response = await fetch('/api/todos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: newListTitle }),
        credentials: 'include',
      });

      if (!response.ok) throw new Error('Failed to create todo list');

      const newList = await response.json();
      setTodoLists([...todoLists, newList]);
      setActiveListId(newList.id);
      setNewListTitle('');
      setIsAddingList(false);
      toast.success('Todo list created');
    } catch (error) {
      console.error('Error creating todo list:', error);
      toast.error('Failed to create todo list');
    }
  };

  const createTask = async () => {
    if (!newTaskTitle.trim() || !activeListId || !user) return;

    try {
      const response = await fetch(`/api/todos/${activeListId}/tasks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: newTaskTitle }),
        credentials: 'include',
      });

      if (!response.ok) throw new Error('Failed to create task');

      const newTask = await response.json();

      setTodoLists(
        todoLists.map((list) =>
          list.id === activeListId
            ? { ...list, tasks: [...list.tasks, newTask] }
            : list,
        ),
      );

      setNewTaskTitle('');
      setIsAddingTask(false);
      toast.success('Task added');
    } catch (error) {
      console.error('Error creating task:', error);
      toast.error('Failed to create task');
    }
  };

  const toggleTaskCompletion = async (
    listId: string,
    taskId: string,
    completed: boolean,
  ) => {
    try {
      const response = await fetch(`/api/todos/${listId}/tasks/${taskId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ completed: !completed }),
        credentials: 'include',
      });

      if (!response.ok) throw new Error('Failed to update task');

      setTodoLists(
        todoLists.map((list) =>
          list.id === listId
            ? {
                ...list,
                tasks: list.tasks.map((task) =>
                  task.id === taskId
                    ? { ...task, completed: !completed }
                    : task,
                ),
              }
            : list,
        ),
      );
    } catch (error) {
      console.error('Error updating task:', error);
      toast.error('Failed to update task');
    }
  };

  const deleteTask = async (listId: string, taskId: string) => {
    try {
      const response = await fetch(`/api/todos/${listId}/tasks/${taskId}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      if (!response.ok) throw new Error('Failed to delete task');

      setTodoLists(
        todoLists.map((list) =>
          list.id === listId
            ? {
                ...list,
                tasks: list.tasks.filter((task) => task.id !== taskId),
              }
            : list,
        ),
      );

      toast.success('Task deleted');
    } catch (error) {
      console.error('Error deleting task:', error);
      toast.error('Failed to delete task');
    }
  };

  const deleteTodoList = async (listId: string) => {
    try {
      const response = await fetch(`/api/todos/${listId}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      if (!response.ok) throw new Error('Failed to delete todo list');

      setTodoLists(todoLists.filter((list) => list.id !== listId));

      if (activeListId === listId) {
        setActiveListId(todoLists.length > 1 ? todoLists[0].id : null);
      }

      toast.success('Todo list deleted');
    } catch (error) {
      console.error('Error deleting todo list:', error);
      toast.error('Failed to delete todo list');
    }
  };

  if (isLoading) {
    return (
      <div className="p-4">
        <div className="text-sm text-muted-foreground">Loading...</div>
      </div>
    );
  }

  return (
    <div className="size-full p-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold">Todo Lists</h2>
        <Button
          variant="ghost"
          size="sm"
          className="size-8 p-0"
          onClick={() => setIsAddingList(true)}
        >
          <Plus className="size-4" />
        </Button>
      </div>

      {isAddingList && (
        <div className="mb-4 space-y-2">
          <Input
            value={newListTitle}
            onChange={(e) => setNewListTitle(e.target.value)}
            placeholder="List name"
            className="h-8 text-sm"
            onKeyDown={(e) => {
              if (e.key === 'Enter') createTodoList();
              if (e.key === 'Escape') {
                setIsAddingList(false);
                setNewListTitle('');
              }
            }}
            autoFocus
          />
          <div className="flex gap-2">
            <Button size="sm" className="h-7" onClick={createTodoList}>
              Add
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="h-7"
              onClick={() => {
                setIsAddingList(false);
                setNewListTitle('');
              }}
            >
              Cancel
            </Button>
          </div>
        </div>
      )}

      {todoLists.length === 0 ? (
        <div className="text-sm text-muted-foreground text-center py-8">
          No todo lists yet. Create one to get started!
        </div>
      ) : (
        <Accordion type="single" collapsible className="w-full">
          {todoLists.map((list) => (
            <AccordionItem key={list.id} value={list.id} className="border-b">
              <div className="flex items-center">
                <AccordionTrigger className="flex-1 py-2">
                  <span className="text-sm font-medium">{list.title}</span>
                </AccordionTrigger>
                <Button
                  variant="ghost"
                  size="sm"
                  className="size-8 p-0 mr-2"
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteTodoList(list.id);
                  }}
                >
                  <Trash2 className="size-3" />
                </Button>
              </div>
              <AccordionContent className="pt-1 pb-2">
                <div className="space-y-1">
                  {list.tasks.map((task) => (
                    <div
                      key={task.id}
                      className="flex items-center justify-between px-4 py-1 group"
                    >
                      <div className="flex items-center gap-2">
                        <Checkbox
                          checked={task.completed}
                          onCheckedChange={() =>
                            toggleTaskCompletion(
                              list.id,
                              task.id,
                              task.completed,
                            )
                          }
                          className="size-4"
                        />
                        <span
                          className={`text-sm ${task.completed ? 'line-through text-muted-foreground' : ''}`}
                        >
                          {task.title}
                        </span>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="size-6 p-0 opacity-0 group-hover:opacity-100"
                        onClick={() => deleteTask(list.id, task.id)}
                      >
                        <Trash2 className="size-3" />
                      </Button>
                    </div>
                  ))}

                  {isAddingTask && activeListId === list.id ? (
                    <div className="flex items-center gap-1 px-4 py-1">
                      <Input
                        value={newTaskTitle}
                        onChange={(e) => setNewTaskTitle(e.target.value)}
                        placeholder="Task name"
                        className="h-7 text-sm"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') createTask();
                          if (e.key === 'Escape') {
                            setIsAddingTask(false);
                            setNewTaskTitle('');
                          }
                        }}
                        autoFocus
                      />
                      <Button
                        variant="ghost"
                        size="sm"
                        className="size-7 p-0"
                        onClick={createTask}
                      >
                        <Check className="size-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="size-7 p-0"
                        onClick={() => {
                          setIsAddingTask(false);
                          setNewTaskTitle('');
                        }}
                      >
                        <X className="size-3" />
                      </Button>
                    </div>
                  ) : (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="w-full justify-start pl-4 py-1 h-7 text-sm text-muted-foreground"
                      onClick={() => {
                        setActiveListId(list.id);
                        setIsAddingTask(true);
                      }}
                    >
                      <Plus className="size-3 mr-1" /> Add task
                    </Button>
                  )}
                </div>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      )}
    </div>
  );
}
