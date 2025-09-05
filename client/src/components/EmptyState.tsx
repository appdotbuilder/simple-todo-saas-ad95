import { Button } from '@/components/ui/button';
import { Plus, CheckCircle2, Filter } from 'lucide-react';

interface EmptyStateProps {
  hasFilters: boolean;
  onClearFilters: () => void;
  onAddTask: () => void;
}

export function EmptyState({ hasFilters, onClearFilters, onAddTask }: EmptyStateProps) {
  if (hasFilters) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-4 text-center space-y-6">
        <div className="relative">
          <div className="w-24 h-24 bg-muted/20 rounded-full flex items-center justify-center">
            <Filter className="w-10 h-10 text-muted-foreground" />
          </div>
          <div className="absolute -top-1 -right-1 w-8 h-8 bg-muted rounded-full flex items-center justify-center">
            <span className="text-lg">🔍</span>
          </div>
        </div>
        
        <div className="space-y-2">
          <h3 className="text-xl font-semibold">No tasks match your filters</h3>
          <p className="text-muted-foreground max-w-sm">
            Try adjusting your filters to see more tasks, or create a new one.
          </p>
        </div>

        <div className="flex gap-3">
          <Button onClick={onClearFilters} variant="outline">
            <Filter className="mr-2 h-4 w-4" />
            Clear Filters
          </Button>
          <Button onClick={onAddTask}>
            <Plus className="mr-2 h-4 w-4" />
            Add Task
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center space-y-6">
      <div className="relative">
        <div className="w-24 h-24 bg-primary/10 rounded-full flex items-center justify-center">
          <CheckCircle2 className="w-12 h-12 text-primary" />
        </div>
        <div className="absolute -top-2 -right-2 text-2xl">✨</div>
      </div>
      
      <div className="space-y-2">
        <h3 className="text-2xl font-bold">Ready to get things done?</h3>
        <p className="text-muted-foreground max-w-md">
          Start organizing your tasks and boost your productivity. 
          Add your first task to get started! 🚀
        </p>
      </div>

      <Button onClick={onAddTask} size="lg" className="gap-2">
        <Plus className="h-5 w-5" />
        Create Your First Task
      </Button>
    </div>
  );
}