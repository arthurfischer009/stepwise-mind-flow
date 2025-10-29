import { memo } from 'react';
import { Handle, Position } from '@xyflow/react';
import { ChevronDown, ChevronRight } from 'lucide-react';

export type CategoryNodeData = {
  label: string;
  taskCount: number;
  isExpanded: boolean;
  onToggle: () => void;
  color: string;
};

export const CategoryNode = memo(({ data }: { data: CategoryNodeData }) => {
  return (
    <div className="relative">
      <Handle type="target" position={Position.Top} className="opacity-0" />
      
      <div 
        className="px-6 py-3 rounded-lg border-2 cursor-pointer hover:shadow-lg transition-all"
        style={{
          borderColor: data.color,
          background: `linear-gradient(135deg, ${data.color}20, ${data.color}10)`
        }}
        onClick={data.onToggle}
      >
        <div className="flex items-center gap-2">
          {data.isExpanded ? (
            <ChevronDown className="w-4 h-4" style={{ color: data.color }} />
          ) : (
            <ChevronRight className="w-4 h-4" style={{ color: data.color }} />
          )}
          <div>
            <div className="font-bold text-sm text-white">{data.label}</div>
            <div className="text-xs text-white/70">{data.taskCount} tasks</div>
          </div>
        </div>
      </div>

      <Handle type="source" position={Position.Bottom} className="opacity-0" />
    </div>
  );
});

CategoryNode.displayName = 'CategoryNode';
