import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, Plus, X } from 'lucide-react';
import { useState } from 'react';
// Simple date formatting utility
const formatDate = (date: Date): string => {
  return date.toLocaleDateString('en-US', { 
    year: 'numeric',
    month: 'short', 
    day: 'numeric' 
  });
};

// Simple utility function for class names
function cn(...classes: (string | undefined | null | boolean)[]): string {
  return classes.filter(Boolean).join(' ');
}
import type { CreateTaskInput, Task, TaskPriority } from '../../../server/src/schema';

interface TaskFormProps {
  onSubmit: (data: CreateTaskInput) => Promise<void>;
  onCancel?: () => void;
  isLoading?: boolean;
  editTask?: Task | null;
  mode?: 'create' | 'edit';
}

export function TaskForm({ onSubmit, onCancel, isLoading = false, editTask, mode = 'create' }: TaskFormProps) {
  const [formData, setFormData] = useState<CreateTaskInput>({
    title: editTask?.title || '',
    description: editTask?.description || null,
    priority: editTask?.priority || 'medium',
    due_date: editTask?.due_date || null
  });

  const [showCalendar, setShowCalendar] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim()) return;
    
    await onSubmit(formData);
    
    if (mode === 'create') {
      // Reset form after successful creation
      setFormData({
        title: '',
        description: null,
        priority: 'medium',
        due_date: null
      });
    }
  };

  const handleDateSelect = (date: Date | undefined) => {
    setFormData((prev: CreateTaskInput) => ({
      ...prev,
      due_date: date || null
    }));
    setShowCalendar(false);
  };

  const clearDueDate = () => {
    setFormData((prev: CreateTaskInput) => ({
      ...prev,
      due_date: null
    }));
  };

  const priorityColors = {
    high: 'text-red-400',
    medium: 'text-yellow-400',
    low: 'text-green-400'
  };

  return (
    <div className="space-y-4 p-4 border border-border rounded-lg bg-card">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">
          {mode === 'create' ? '✨ Add New Task' : '📝 Edit Task'}
        </h3>
        {onCancel && (
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={onCancel}
            className="h-8 w-8 p-0"
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Input
            placeholder="What needs to be done? 🎯"
            value={formData.title}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              setFormData((prev: CreateTaskInput) => ({ ...prev, title: e.target.value }))
            }
            className="text-base"
            required
            disabled={isLoading}
          />
        </div>

        <div className="space-y-2">
          <Textarea
            placeholder="Add some notes... (optional) 📝"
            value={formData.description || ''}
            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
              setFormData((prev: CreateTaskInput) => ({
                ...prev,
                description: e.target.value || null
              }))
            }
            className="min-h-[80px] resize-none"
            disabled={isLoading}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Select
              value={formData.priority}
              onValueChange={(value: TaskPriority) =>
                setFormData((prev: CreateTaskInput) => ({ ...prev, priority: value }))
              }
              disabled={isLoading}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select priority" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="high">
                  <span className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-red-500"></span>
                    <span className={priorityColors.high}>🔥 High Priority</span>
                  </span>
                </SelectItem>
                <SelectItem value="medium">
                  <span className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-yellow-500"></span>
                    <span className={priorityColors.medium}>⚡ Medium Priority</span>
                  </span>
                </SelectItem>
                <SelectItem value="low">
                  <span className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-green-500"></span>
                    <span className={priorityColors.low}>🌱 Low Priority</span>
                  </span>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Popover open={showCalendar} onOpenChange={setShowCalendar}>
              <div className="flex gap-1">
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "flex-1 justify-start text-left font-normal",
                      !formData.due_date && "text-muted-foreground"
                    )}
                    disabled={isLoading}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {formData.due_date ? (
                      formatDate(formData.due_date)
                    ) : (
                      "📅 Due date (optional)"
                    )}
                  </Button>
                </PopoverTrigger>
                {formData.due_date && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={clearDueDate}
                    className="px-2"
                    disabled={isLoading}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                )}
              </div>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={formData.due_date || undefined}
                  onSelect={handleDateSelect}
                  initialFocus
                  disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                />
              </PopoverContent>
            </Popover>
          </div>
        </div>

        <div className="flex gap-2 pt-2">
          <Button 
            type="submit" 
            disabled={isLoading || !formData.title.trim()}
            className="flex-1"
          >
            {isLoading ? (
              <span className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
                {mode === 'create' ? 'Creating...' : 'Updating...'}
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                {mode === 'create' ? 'Add Task' : 'Update Task'}
              </span>
            )}
          </Button>
          
          {mode === 'edit' && onCancel && (
            <Button 
              type="button"
              variant="outline" 
              onClick={onCancel}
              disabled={isLoading}
            >
              Cancel
            </Button>
          )}
        </div>
      </form>
    </div>
  );
}