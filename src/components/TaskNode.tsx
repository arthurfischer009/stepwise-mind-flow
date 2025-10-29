import { memo } from 'react';
import { Handle, Position } from '@xyflow/react';
import { CheckCircle2, Circle } from 'lucide-react';

export type TaskNodeData = {
  label: string;
  completed: boolean;
};

export const TaskNode = memo(({ data }: { data: TaskNodeData }) => {
  return (
    <div className="relative">
      <Handle type="target" position={Position.Top} className="opacity-0" />
      
      <div className={`
        px-4 py-2 rounded-md border transition-all
        ${data.completed 
          ? 'bg-accent/20 border-accent text-accent-foreground opacity-70' 
          : 'bg-card border-border hover:border-primary hover:shadow-md'
        }
      `}>
        <div className="flex items-center gap-2">
          {data.completed ? (
            <CheckCircle2 className="w-3 h-3 flex-shrink-0" />
          ) : (
            <Circle className="w-3 h-3 flex-shrink-0" />
          )}
          <div className="text-xs font-medium max-w-[150px] truncate">
            {data.label}
          </div>
        </div>
      </div>

      <Handle type="source" position={Position.Bottom} className="opacity-0" />
    </div>
  );
});

TaskNode.displayName = 'TaskNode';
