import { memo } from 'react';
import { Handle, Position } from '@xyflow/react';

export type CentralNodeData = {
  label: string;
};

export const CentralNode = memo(({ data }: { data: CentralNodeData }) => {
  return (
    <div className="relative">
      <div className="px-8 py-6 rounded-full border-4 border-primary bg-gradient-to-br from-primary/30 via-secondary/30 to-accent/30 shadow-2xl">
        <div className="text-center">
          <div className="font-bold text-lg text-foreground whitespace-nowrap">
            {data.label}
          </div>
        </div>
      </div>
      <Handle type="source" position={Position.Top} className="opacity-0" />
      <Handle type="source" position={Position.Right} className="opacity-0" />
      <Handle type="source" position={Position.Bottom} className="opacity-0" />
      <Handle type="source" position={Position.Left} className="opacity-0" />
    </div>
  );
});

CentralNode.displayName = 'CentralNode';
