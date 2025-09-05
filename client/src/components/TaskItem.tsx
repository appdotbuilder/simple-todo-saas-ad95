import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { MoreHorizontal, Edit, Trash2, Calendar, Clock } from 'lucide-react';
// Simple date utilities to avoid external dependencies
const formatDate = (date: Date): string => {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const targetDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const diffTime = targetDate.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Tomorrow';
  if (diffDays === -1) return 'Yesterday';
  
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

const isToday = (date: Date): boolean => {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const targetDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  return targetDate.getTime() === today.getTime();
};



const isPast = (date: Date): boolean => {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const targetDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  return targetDate.getTime() < today.getTime();
};

// Simple utility function for class names
function cn(...classes: (string | undefined | null | boolean)[]): string {
  return classes.filter(Boolean).join(' ');
}
import type { Task } from '../../../server/src/schema';

interface TaskItemProps {
  task: Task;
  onToggleStatus: (id: number) => Promise<void>;
  onEdit: (task: Task) => void;
  onDelete: (id: number) => Promise<void>;
  isLoading?: boolean;
}

export function TaskItem({ task, onToggleStatus, onEdit, onDelete, isLoading = false }: TaskItemProps) {
  const isCompleted = task.status === 'completed';

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-500/20 text-red-300 border-red-500/50';
      case 'medium': return 'bg-yellow-500/20 text-yellow-300 border-yellow-500/50';
      case 'low': return 'bg-green-500/20 text-green-300 border-green-500/50';
      default: return 'bg-gray-500/20 text-gray-300 border-gray-500/50';
    }
  };

  const getPriorityEmoji = (priority: string) => {
    switch (priority) {
      case 'high': return '🔥';
      case 'medium': return '⚡';
      case 'low': return '🌱';
      default: return '📝';
    }
  };

  const formatDueDate = (dueDate: Date) => {
    return formatDate(dueDate);
  };

  const getDueDateColor = (dueDate: Date) => {
    if (isPast(dueDate) && !isToday(dueDate)) return 'text-red-400';
    if (isToday(dueDate)) return 'text-yellow-400';
    return 'text-muted-foreground';
  };

  return (
    <div className={cn(
      "group task-fade-in border-l-4 bg-card border border-border rounded-lg p-4 transition-all duration-200 hover:shadow-md",
      task.priority === 'high' && 'priority-high',
      task.priority === 'medium' && 'priority-medium',
      task.priority === 'low' && 'priority-low',
      isCompleted && 'task-completed'
    )}>
      <div className="flex items-start gap-3">
        <Checkbox
          checked={isCompleted}
          onCheckedChange={() => onToggleStatus(task.id)}
          disabled={isLoading}
          className="mt-1 flex-shrink-0"
        />
        
        <div className="flex-1 min-w-0 space-y-2">
          <div className="flex items-start justify-between gap-3">
            <h3 className={cn(
              "font-medium text-base leading-relaxed",
              isCompleted && "line-through opacity-60"
            )}>
              {task.title}
            </h3>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem 
                  onClick={() => onEdit(task)}
                  className="cursor-pointer"
                >
                  <Edit className="mr-2 h-4 w-4" />
                  Edit
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <DropdownMenuItem 
                      onSelect={(e) => e.preventDefault()}
                      className="cursor-pointer text-destructive focus:text-destructive"
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete
                    </DropdownMenuItem>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete Task</AlertDialogTitle>
                      <AlertDialogDescription>
                        Are you sure you want to delete "{task.title}"? This action cannot be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction 
                        onClick={() => onDelete(task.id)}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      >
                        Delete
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {task.description && (
            <p className={cn(
              "text-sm text-muted-foreground leading-relaxed",
              isCompleted && "line-through opacity-50"
            )}>
              {task.description}
            </p>
          )}

          <div className="flex flex-wrap items-center gap-2 pt-1">
            <Badge 
              variant="outline" 
              className={cn(
                "text-xs font-medium",
                getPriorityColor(task.priority)
              )}
            >
              <span className="mr-1">{getPriorityEmoji(task.priority)}</span>
              {task.priority.charAt(0).toUpperCase() + task.priority.slice(1)}
            </Badge>

            {task.due_date && (
              <Badge 
                variant="outline"
                className={cn(
                  "text-xs font-medium",
                  getDueDateColor(task.due_date)
                )}
              >
                <Calendar className="mr-1 h-3 w-3" />
                {formatDueDate(task.due_date)}
              </Badge>
            )}

            <div className="flex items-center gap-1 text-xs text-muted-foreground ml-auto">
              <Clock className="h-3 w-3" />
              <span>
                {isCompleted ? 'Completed' : 'Created'} {formatDate(isCompleted ? task.updated_at : task.created_at)}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}