import { memo } from 'react';
import { Handle, Position } from '@xyflow/react';
import { ChevronDown, ChevronRight } from 'lucide-react';

export type CategoryNodeData = {
  label: string;
  taskCount: number;
  isExpanded: boolean;
  onToggle: () => void;
};

export const CategoryNode = memo(({ data }: { data: CategoryNodeData }) => {
  return (
    <div className="relative">
      <Handle type="target" position={Position.Top} className="opacity-0" />
      
      <div 
        className="px-6 py-3 rounded-lg border-2 border-primary bg-gradient-to-r from-primary/20 to-secondary/20 cursor-pointer hover:shadow-lg transition-all"
        onClick={data.onToggle}
      >
        <div className="flex items-center gap-2">
          {data.isExpanded ? (
            <ChevronDown className="w-4 h-4 text-primary" />
          ) : (
            <ChevronRight className="w-4 h-4 text-primary" />
          )}
          <div>
            <div className="font-bold text-sm text-foreground">{data.label}</div>
            <div className="text-xs text-muted-foreground">{data.taskCount} tasks</div>
          </div>
        </div>
      </div>

      <Handle type="source" position={Position.Bottom} className="opacity-0" />
    </div>
  );
});

CategoryNode.displayName = 'CategoryNode';
