"use client";

import { useState, useEffect, useRef } from "react";
import { Avatar } from "@/atoms/Avatar";
import { usePermissions } from "@/hooks/usePermissions";
import type { InlineLeadSelectorProps, User } from "./InlineLeadSelector.types";

export function InlineLeadSelector({
  projectId,
  currentLead,
  onLeadChanged,
}: InlineLeadSelectorProps) {
  const { can } = usePermissions();
  const canAssignLead = can("projects:assign-lead");

  const [isOpen, setIsOpen] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [updating, setUpdating] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Fetch users when dropdown opens
  useEffect(() => {
    if (isOpen && users.length === 0) {
      fetchUsers();
    }
  }, [isOpen]);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [isOpen]);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/users");
      if (res.ok) {
        const data = await res.json();
        setUsers(data);
      }
    } catch (error) {
      console.error("Failed to fetch users:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectUser = async (user: User | null) => {
    setUpdating(true);
    try {
      const res = await fetch(`/api/projects/${projectId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ leadId: user?.id || null }),
      });

      if (res.ok) {
        onLeadChanged?.(user);
        setIsOpen(false);
      } else {
        const error = await res.json();
        alert(error.error || "Failed to update lead");
      }
    } catch (error) {
      console.error("Failed to update lead:", error);
    } finally {
      setUpdating(false);
    }
  };

  // Non-admin view: just show the lead info (not clickable)
  if (!canAssignLead) {
    if (currentLead) {
      return (
        <div className="flex items-center gap-2">
          <Avatar
            name={currentLead.name || currentLead.email}
            src={currentLead.image || undefined}
            size="sm"
          />
          <span className="text-sm text-secondary-600 dark:text-neutral-300">
            {currentLead.name || currentLead.email}
          </span>
        </div>
      );
    }
    return (
      <span className="text-sm text-secondary-400 dark:text-neutral-500">
        No lead assigned
      </span>
    );
  }

  // Admin view: clickable with dropdown
  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        disabled={updating}
        className="flex items-center gap-2 hover:bg-secondary-100 dark:hover:bg-neutral-800 rounded-md px-2 py-1 -mx-2 -my-1 transition-colors"
      >
        {currentLead ? (
          <>
            <Avatar
              name={currentLead.name || currentLead.email}
              src={currentLead.image || undefined}
              size="sm"
            />
            <span className="text-sm text-secondary-600 dark:text-neutral-300">
              {currentLead.name || currentLead.email}
            </span>
          </>
        ) : (
          <span className="text-sm text-primary-500 hover:text-primary-600 underline decoration-dashed">
            {updating ? "Updating..." : "Assign lead"}
          </span>
        )}
        <svg
          className={`w-4 h-4 text-secondary-400 transition-transform ${isOpen ? "rotate-180" : ""}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-1 w-64 bg-white dark:bg-neutral-800 border border-secondary-200 dark:border-neutral-700 rounded-lg shadow-lg z-50 overflow-hidden">
          {loading ? (
            <div className="p-4 text-center text-secondary-500 dark:text-neutral-400">
              Loading users...
            </div>
          ) : (
            <div className="max-h-64 overflow-y-auto">
              {/* Option to remove lead */}
              {currentLead && (
                <button
                  onClick={() => handleSelectUser(null)}
                  disabled={updating}
                  className="w-full px-4 py-2 text-left text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 border-b border-secondary-100 dark:border-neutral-700"
                >
                  Remove lead
                </button>
              )}

              {/* User list */}
              {users.map((user) => (
                <button
                  key={user.id}
                  onClick={() => handleSelectUser(user)}
                  disabled={updating || user.id === currentLead?.id}
                  className={`w-full px-4 py-2 text-left flex items-center gap-3 hover:bg-secondary-50 dark:hover:bg-neutral-700 transition-colors ${
                    user.id === currentLead?.id ? "bg-secondary-50 dark:bg-neutral-700" : ""
                  }`}
                >
                  <Avatar
                    name={user.name || user.email}
                    src={user.image || undefined}
                    size="sm"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-secondary-900 dark:text-neutral-100 truncate">
                      {user.name || user.email}
                    </p>
                    {user.name && (
                      <p className="text-xs text-secondary-500 dark:text-neutral-400 truncate">
                        {user.email}
                      </p>
                    )}
                  </div>
                  {user.id === currentLead?.id && (
                    <svg className="w-4 h-4 text-primary-500" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
