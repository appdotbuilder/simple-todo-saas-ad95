import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

import { CheckCircle, Circle, Flame, Zap, Sprout, Filter, X } from 'lucide-react';

// Simple utility function for class names
function cn(...classes: (string | undefined | null | boolean)[]): string {
  return classes.filter(Boolean).join(' ');
}
import type { TaskStatus, TaskPriority } from '../../../server/src/schema';

interface TaskFiltersProps {
  statusFilter: TaskStatus | 'all';
  priorityFilter: TaskPriority | 'all';
  onStatusChange: (status: TaskStatus | 'all') => void;
  onPriorityChange: (priority: TaskPriority | 'all') => void;
  taskCounts: {
    total: number;
    pending: number;
    completed: number;
    high: number;
    medium: number;
    low: number;
  };
}

export function TaskFilters({ 
  statusFilter, 
  priorityFilter, 
  onStatusChange, 
  onPriorityChange,
  taskCounts 
}: TaskFiltersProps) {
  const hasActiveFilters = statusFilter !== 'all' || priorityFilter !== 'all';

  const clearFilters = () => {
    onStatusChange('all');
    onPriorityChange('all');
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium">Filters</span>
          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearFilters}
              className="h-6 px-2 text-xs"
            >
              <X className="h-3 w-3 mr-1" />
              Clear
            </Button>
          )}
        </div>
        
        <Badge variant="outline" className="text-xs">
          {taskCounts.total} {taskCounts.total === 1 ? 'task' : 'tasks'} total
        </Badge>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Status Filter */}
        <div className="space-y-2">
          <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            Status
          </label>
          <div className="flex flex-wrap gap-2">
            <Button
              variant={statusFilter === 'all' ? 'default' : 'outline'}
              size="sm"
              onClick={() => onStatusChange('all')}
              className={cn(
                "text-xs",
                statusFilter === 'all' && "bg-primary text-primary-foreground"
              )}
            >
              📋 All ({taskCounts.total})
            </Button>
            <Button
              variant={statusFilter === 'pending' ? 'default' : 'outline'}
              size="sm"
              onClick={() => onStatusChange('pending')}
              className={cn(
                "text-xs",
                statusFilter === 'pending' && "bg-primary text-primary-foreground"
              )}
            >
              <Circle className="mr-1 h-3 w-3" />
              Pending ({taskCounts.pending})
            </Button>
            <Button
              variant={statusFilter === 'completed' ? 'default' : 'outline'}
              size="sm"
              onClick={() => onStatusChange('completed')}
              className={cn(
                "text-xs",
                statusFilter === 'completed' && "bg-primary text-primary-foreground"
              )}
            >
              <CheckCircle className="mr-1 h-3 w-3" />
              Completed ({taskCounts.completed})
            </Button>
          </div>
        </div>

        {/* Priority Filter */}
        <div className="space-y-2">
          <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            Priority
          </label>
          <div className="flex flex-wrap gap-2">
            <Button
              variant={priorityFilter === 'all' ? 'default' : 'outline'}
              size="sm"
              onClick={() => onPriorityChange('all')}
              className={cn(
                "text-xs",
                priorityFilter === 'all' && "bg-primary text-primary-foreground"
              )}
            >
              🎯 All
            </Button>
            <Button
              variant={priorityFilter === 'high' ? 'default' : 'outline'}
              size="sm"
              onClick={() => onPriorityChange('high')}
              className={cn(
                "text-xs",
                priorityFilter === 'high' && "bg-primary text-primary-foreground"
              )}
            >
              <Flame className="mr-1 h-3 w-3 text-red-400" />
              High ({taskCounts.high})
            </Button>
            <Button
              variant={priorityFilter === 'medium' ? 'default' : 'outline'}
              size="sm"
              onClick={() => onPriorityChange('medium')}
              className={cn(
                "text-xs",
                priorityFilter === 'medium' && "bg-primary text-primary-foreground"
              )}
            >
              <Zap className="mr-1 h-3 w-3 text-yellow-400" />
              Medium ({taskCounts.medium})
            </Button>
            <Button
              variant={priorityFilter === 'low' ? 'default' : 'outline'}
              size="sm"
              onClick={() => onPriorityChange('low')}
              className={cn(
                "text-xs",
                priorityFilter === 'low' && "bg-primary text-primary-foreground"
              )}
            >
              <Sprout className="mr-1 h-3 w-3 text-green-400" />
              Low ({taskCounts.low})
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}