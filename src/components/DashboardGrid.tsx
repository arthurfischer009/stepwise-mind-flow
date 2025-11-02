import React, { useState, useEffect } from 'react';
import {
  DndContext,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragOverEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical } from 'lucide-react';
import { cn } from '@/lib/utils';

interface DashboardCard {
  id: string;
  component: React.ReactNode;
  column: 'left' | 'right';
}

interface DashboardGridProps {
  cards: DashboardCard[];
  className?: string;
  storageKey?: string;
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
          "absolute right-2 top-2 p-1 rounded cursor-grab active:cursor-grabbing",
          "opacity-0 group-hover:opacity-100 transition-opacity",
          "bg-background/70 border border-border hover:bg-accent z-10"
        )}
      >
        <GripVertical className="w-4 h-4 text-muted-foreground" />
      </div>
      {children}
    </div>
  );
}

export function DashboardGrid({ cards, className, storageKey = 'dashboardCardOrder' }: DashboardGridProps) {
  const [items, setItems] = useState(cards);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Load saved order and columns from localStorage
  useEffect(() => {
    const savedData = localStorage.getItem(storageKey);
    if (savedData) {
      try {
        const saved: { id: string; column: 'left' | 'right' }[] = JSON.parse(savedData);
        const orderedCards = saved
          .map(({ id, column }) => {
            const card = cards.find(card => card.id === id);
            return card ? { ...card, column } : null;
          })
          .filter(Boolean) as DashboardCard[];
        
        // Add any new cards that aren't in the saved order
        const newCards = cards.filter(card => !saved.some(s => s.id === card.id));
        setItems([...orderedCards, ...newCards]);
      } catch (e) {
        setItems(cards);
      }
    } else {
      setItems(cards);
    }
  }, [storageKey]);

  const saveToLocalStorage = (items: DashboardCard[]) => {
    localStorage.setItem(
      storageKey,
      JSON.stringify(items.map(item => ({ id: item.id, column: item.column })))
    );
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    if (!over) return;

    const activeId = active.id;
    const overId = over.id;

    if (activeId === overId) return;

    setItems((items) => {
      const activeIndex = items.findIndex((item) => item.id === activeId);
      const overIndex = items.findIndex((item) => item.id === overId);

      if (activeIndex === -1 || overIndex === -1) return items;

      const activeItem = items[activeIndex];
      const overItem = items[overIndex];

      // If moving to a different column, update the column property
      if (activeItem.column !== overItem.column) {
        const newItems = [...items];
        newItems[activeIndex] = { ...activeItem, column: overItem.column };
        return arrayMove(newItems, activeIndex, overIndex);
      }

      return arrayMove(items, activeIndex, overIndex);
    });
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      setItems((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id);
        const newIndex = items.findIndex((item) => item.id === over.id);
        const newOrder = arrayMove(items, oldIndex, newIndex);
        
        saveToLocalStorage(newOrder);
        
        return newOrder;
      });
    } else {
      // Just save the current state (column might have changed in dragOver)
      saveToLocalStorage(items);
    }
  };

  const leftCards = items.filter(item => item.column === 'left');
  const rightCards = items.filter(item => item.column === 'right');

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      <div className={cn("grid lg:grid-cols-2 gap-4", className)}>
        <SortableContext
          items={leftCards.map(item => item.id)}
          strategy={verticalListSortingStrategy}
        >
          <div className="space-y-4">
            {leftCards.map((item) => (
              <SortableCard key={item.id} id={item.id}>
                {item.component}
              </SortableCard>
            ))}
          </div>
        </SortableContext>

        <SortableContext
          items={rightCards.map(item => item.id)}
          strategy={verticalListSortingStrategy}
        >
          <div className="space-y-4">
            {rightCards.map((item) => (
              <SortableCard key={item.id} id={item.id}>
                {item.component}
              </SortableCard>
            ))}
          </div>
        </SortableContext>
      </div>
    </DndContext>
  );
}
