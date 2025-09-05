import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { CheckCircle, Circle, Plus, ListTodo, Sparkles } from 'lucide-react';
import { trpc } from '@/utils/trpc';

// Import components
import { TaskForm } from '@/components/TaskForm';
import { TaskItem } from '@/components/TaskItem';
import { TaskFilters } from '@/components/TaskFilters';
import { EmptyState } from '@/components/EmptyState';

// Import types
import type { Task, CreateTaskInput, TaskStatus, TaskPriority, UpdateTaskInput } from '../../server/src/schema';



function App() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [showForm, setShowForm] = useState(false);
  
  // Filter states
  const [statusFilter, setStatusFilter] = useState<TaskStatus | 'all'>('all');
  const [priorityFilter, setPriorityFilter] = useState<TaskPriority | 'all'>('all');

  // Load tasks from API
  const loadTasks = useCallback(async () => {
    try {
      const filter = {
        status: statusFilter !== 'all' ? statusFilter : undefined,
        priority: priorityFilter !== 'all' ? priorityFilter : undefined
      };
      
      const result = await trpc.getTasks.query(filter);
      setTasks(result);
    } catch (error) {
      console.error('Failed to load tasks:', error);
    }
  }, [statusFilter, priorityFilter]);

  useEffect(() => {
    loadTasks();
  }, [loadTasks]);

  // Calculate task counts for filters
  const taskCounts = {
    total: tasks.length,
    pending: tasks.filter((task: Task) => task.status === 'pending').length,
    completed: tasks.filter((task: Task) => task.status === 'completed').length,
    high: tasks.filter((task: Task) => task.priority === 'high').length,
    medium: tasks.filter((task: Task) => task.priority === 'medium').length,
    low: tasks.filter((task: Task) => task.priority === 'low').length,
  };

  // Create new task
  const handleCreateTask = async (data: CreateTaskInput) => {
    setIsLoading(true);
    try {
      const newTask = await trpc.createTask.mutate(data);
      setTasks((prev: Task[]) => [newTask, ...prev]);
      setShowForm(false);
    } catch (error) {
      console.error('Failed to create task:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Update existing task
  const handleUpdateTask = async (data: CreateTaskInput) => {
    if (!editingTask) return;
    
    setIsLoading(true);
    try {
      const updateData: UpdateTaskInput = {
        id: editingTask.id,
        ...data
      };
      const updatedTask = await trpc.updateTask.mutate(updateData);
      setTasks((prev: Task[]) => prev.map((task: Task) => 
        task.id === updatedTask.id ? updatedTask : task
      ));
      setEditingTask(null);
    } catch (error) {
      console.error('Failed to update task:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Toggle task status
  const handleToggleStatus = async (id: number) => {
    setIsLoading(true);
    try {
      const updatedTask = await trpc.toggleTaskStatus.mutate({ id });
      setTasks((prev: Task[]) => prev.map((task: Task) => 
        task.id === id ? updatedTask : task
      ));
    } catch (error) {
      console.error('Failed to toggle task status:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Delete task
  const handleDeleteTask = async (id: number) => {
    setIsLoading(true);
    try {
      await trpc.deleteTask.mutate({ id });
      setTasks((prev: Task[]) => prev.filter((task: Task) => task.id !== id));
    } catch (error) {
      console.error('Failed to delete task:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle edit mode
  const handleEditTask = (task: Task) => {
    setEditingTask(task);
    setShowForm(false);
  };

  const cancelEdit = () => {
    setEditingTask(null);
  };

  // Filter handlers
  const handleStatusChange = (status: TaskStatus | 'all') => {
    setStatusFilter(status);
  };

  const handlePriorityChange = (priority: TaskPriority | 'all') => {
    setPriorityFilter(priority);
  };

  const clearFilters = () => {
    setStatusFilter('all');
    setPriorityFilter('all');
  };

  const hasFilters = statusFilter !== 'all' || priorityFilter !== 'all';

  // Sort tasks: pending first, then by priority (high to low), then by creation date
  const sortedTasks = [...tasks].sort((a: Task, b: Task) => {
    // First, sort by status (pending first)
    if (a.status !== b.status) {
      return a.status === 'pending' ? -1 : 1;
    }
    
    // Then by priority
    const priorityOrder = { high: 3, medium: 2, low: 1 };
    const priorityDiff = priorityOrder[b.priority] - priorityOrder[a.priority];
    if (priorityDiff !== 0) return priorityDiff;
    
    // Finally by creation date (newest first)
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto py-8 px-4 max-w-4xl">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="relative">
              <ListTodo className="w-10 h-10 text-primary" />
              <Sparkles className="w-4 h-4 text-yellow-400 absolute -top-1 -right-1" />
            </div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-blue-400 bg-clip-text text-transparent">
              TaskMaster Pro
            </h1>
          </div>
          <p className="text-muted-foreground text-lg">
            Your modern, sleek task management solution ✨
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Card>
            <CardContent className="flex items-center justify-between p-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Tasks</p>
                <p className="text-2xl font-bold">{taskCounts.total}</p>
              </div>
              <ListTodo className="h-8 w-8 text-muted-foreground" />
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="flex items-center justify-between p-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Pending</p>
                <p className="text-2xl font-bold text-yellow-400">{taskCounts.pending}</p>
              </div>
              <Circle className="h-8 w-8 text-yellow-400" />
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="flex items-center justify-between p-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Completed</p>
                <p className="text-2xl font-bold text-green-400">{taskCounts.completed}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-400" />
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <span>📋 Task Management</span>
                </CardTitle>
                <CardDescription>
                  Organize, prioritize, and track your tasks efficiently
                </CardDescription>
              </div>
              
              {!showForm && !editingTask && (
                <Button onClick={() => setShowForm(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Task
                </Button>
              )}
            </div>
          </CardHeader>
          
          <CardContent className="space-y-6">
            {/* Task Form */}
            {(showForm || editingTask) && (
              <>
                <TaskForm
                  onSubmit={editingTask ? handleUpdateTask : handleCreateTask}
                  onCancel={editingTask ? cancelEdit : () => setShowForm(false)}
                  isLoading={isLoading}
                  editTask={editingTask}
                  mode={editingTask ? 'edit' : 'create'}
                />
                <Separator />
              </>
            )}

            {/* Filters */}
            {tasks.length > 0 && (
              <>
                <TaskFilters
                  statusFilter={statusFilter}
                  priorityFilter={priorityFilter}
                  onStatusChange={handleStatusChange}
                  onPriorityChange={handlePriorityChange}
                  taskCounts={taskCounts}
                />
                <Separator />
              </>
            )}

            {/* Tasks List */}
            {sortedTasks.length === 0 ? (
              <EmptyState
                hasFilters={hasFilters}
                onClearFilters={clearFilters}
                onAddTask={() => setShowForm(true)}
              />
            ) : (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-medium text-sm text-muted-foreground">
                    {hasFilters ? 'Filtered Tasks' : 'All Tasks'}
                    <Badge variant="outline" className="ml-2">
                      {sortedTasks.length}
                    </Badge>
                  </h3>
                  
                  {hasFilters && (
                    <Button variant="ghost" size="sm" onClick={clearFilters}>
                      Clear Filters
                    </Button>
                  )}
                </div>
                
                <div className="space-y-2">
                  {sortedTasks.map((task: Task) => (
                    <TaskItem
                      key={task.id}
                      task={task}
                      onToggleStatus={handleToggleStatus}
                      onEdit={handleEditTask}
                      onDelete={handleDeleteTask}
                      isLoading={isLoading}
                    />
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center mt-8 text-muted-foreground text-sm">
          <p>Built with ❤️ using React, TypeScript, and Shadcn UI</p>
          <p className="mt-1">Dark theme • Modern design • Production ready</p>
        </div>
      </div>
    </div>
  );
}

export default App;