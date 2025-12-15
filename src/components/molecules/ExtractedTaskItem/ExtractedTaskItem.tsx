"use client";

import { useState } from "react";
import { Checkbox } from "@/atoms/Checkbox";
import { Input } from "@/atoms/Input";
import { cn } from "@/utils/cn";
import type { ExtractedTaskItemProps } from "./ExtractedTaskItem.types";

export function ExtractedTaskItem({
  task,
  onToggle,
  onEdit,
}: ExtractedTaskItemProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(task.title);

  const handleSave = () => {
    if (editValue.trim() && onEdit) {
      onEdit(task.id, editValue.trim());
    }
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSave();
    } else if (e.key === "Escape") {
      setEditValue(task.title);
      setIsEditing(false);
    }
  };

  return (
    <div
      className={cn(
        "flex items-center gap-3 p-2 rounded-md transition-colors",
        task.selected ? "bg-primary-50" : "hover:bg-secondary-50"
      )}
    >
      <Checkbox
        checked={task.selected}
        onChange={() => onToggle(task.id)}
        size="sm"
      />

      {isEditing ? (
        <Input
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onBlur={handleSave}
          onKeyDown={handleKeyDown}
          className="flex-1 py-1"
          autoFocus
        />
      ) : (
        <span
          className={cn(
            "flex-1 text-sm cursor-pointer",
            task.selected ? "text-secondary-800" : "text-secondary-600"
          )}
          onDoubleClick={() => onEdit && setIsEditing(true)}
        >
          {task.title}
        </span>
      )}
    </div>
  );
}
