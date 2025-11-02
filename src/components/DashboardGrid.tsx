import React, { useState, useEffect } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  rectSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical } from 'lucide-react';
import { cn } from '@/lib/utils';

interface DashboardCard {
  id: string;
  component: React.ReactNode;
}

interface DashboardGridProps {
  cards: DashboardCard[];
  className?: string;
}

interface SortableCardProps {
  id: string;
  children: React.ReactNode;
}

function SortableCard({ id, children }: SortableCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} className="relative group">
      <div
        {...attributes}
        {...listeners}
        className={cn(
          "absolute -left-8 top-4 p-1 rounded cursor-grab active:cursor-grabbing",
          "opacity-0 group-hover:opacity-100 transition-opacity",
          "hover:bg-accent z-10"
        )}
      >
        <GripVertical className="w-4 h-4 text-muted-foreground" />
      </div>
      {children}
    </div>
  );
}

export function DashboardGrid({ cards, className }: DashboardGridProps) {
  const [items, setItems] = useState(cards);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Load saved order from localStorage
  useEffect(() => {
    const savedOrder = localStorage.getItem('dashboardCardOrder');
    if (savedOrder) {
      try {
        const orderIds: string[] = JSON.parse(savedOrder);
        const orderedCards = orderIds
          .map(id => cards.find(card => card.id === id))
          .filter(Boolean) as DashboardCard[];
        
        // Add any new cards that aren't in the saved order
        const newCards = cards.filter(card => !orderIds.includes(card.id));
        setItems([...orderedCards, ...newCards]);
      } catch (e) {
        setItems(cards);
      }
    } else {
      setItems(cards);
    }
  }, []);

  // Update items when cards change
  useEffect(() => {
    setItems(prevItems => {
      const prevIds = prevItems.map(item => item.id);
      const newCards = cards.filter(card => !prevIds.includes(card.id));
      return [...prevItems, ...newCards];
    });
  }, [cards]);

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      setItems((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id);
        const newIndex = items.findIndex((item) => item.id === over.id);
        const newOrder = arrayMove(items, oldIndex, newIndex);
        
        // Save order to localStorage
        localStorage.setItem(
          'dashboardCardOrder',
          JSON.stringify(newOrder.map(item => item.id))
        );
        
        return newOrder;
      });
    }
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <SortableContext
        items={items.map(item => item.id)}
        strategy={rectSortingStrategy}
      >
        <div className={cn("space-y-4", className)}>
          {items.map((item) => (
            <SortableCard key={item.id} id={item.id}>
              {item.component}
            </SortableCard>
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
}
