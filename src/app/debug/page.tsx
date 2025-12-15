"use client";

import { useState } from "react";

/**
 * PM-OS Design System v3 - "Linear-inspired Modern"
 *
 * Inspired by: Linear, Notion, Monday.com
 * Key principles:
 * - Ultra-clean, minimal interface
 * - Generous whitespace
 * - Keyboard-first hints
 * - Subtle micro-interactions
 * - High contrast typography
 * - Glassmorphism accents
 */

const sampleTasks = [
  { id: "PM-101", title: "Implement user authentication flow", status: "in-progress", priority: "high", assignee: "AK", labels: ["backend", "security"], progress: 65 },
  { id: "PM-102", title: "Design settings page mockups", status: "todo", priority: "medium", assignee: "SR", labels: ["design"], progress: 0 },
  { id: "PM-103", title: "Write API documentation", status: "done", priority: "low", assignee: "JM", labels: ["docs"], progress: 100 },
  { id: "PM-104", title: "Setup CI/CD pipeline", status: "in-progress", priority: "urgent", assignee: "TY", labels: ["devops"], progress: 40 },
];

const teamMembers = [
  { initials: "AK", name: "Alex Kim", role: "Lead Engineer", status: "active" },
  { initials: "SR", name: "Sarah Rodriguez", role: "Designer", status: "active" },
  { initials: "JM", name: "James Miller", role: "Backend Dev", status: "away" },
  { initials: "TY", name: "Taylor Young", role: "DevOps", status: "active" },
];

export default function UIDebugPage() {
  const [darkMode, setDarkMode] = useState(true);
  const [selectedTab, setSelectedTab] = useState<"overview" | "components" | "dashboard">("overview");
  const [hoveredTask, setHoveredTask] = useState<string | null>(null);

  // Theme tokens - Linear inspired
  const t = {
    // Backgrounds
    bg: darkMode ? "#0a0a0b" : "#ffffff",
    bgSubtle: darkMode ? "#111113" : "#fafafa",
    bgMuted: darkMode ? "#18181b" : "#f4f4f5",
    bgElevated: darkMode ? "#1f1f23" : "#ffffff",
    bgHover: darkMode ? "#27272a" : "#f4f4f5",

    // Text
    text: darkMode ? "#fafafa" : "#09090b",
    textSecondary: darkMode ? "#a1a1aa" : "#71717a",
    textMuted: darkMode ? "#71717a" : "#a1a1aa",

    // Borders
    border: darkMode ? "#27272a" : "#e4e4e7",
    borderSubtle: darkMode ? "#1f1f23" : "#f4f4f5",

    // Brand
    accent: "#6366f1", // Indigo
    accentHover: "#818cf8",
    accentMuted: darkMode ? "rgba(99, 102, 241, 0.15)" : "rgba(99, 102, 241, 0.1)",
  };

  const statusColors = {
    "todo": { bg: darkMode ? "#27272a" : "#f4f4f5", text: darkMode ? "#a1a1aa" : "#71717a", dot: "#71717a" },
    "in-progress": { bg: darkMode ? "rgba(251, 191, 36, 0.1)" : "rgba(251, 191, 36, 0.1)", text: "#fbbf24", dot: "#fbbf24" },
    "done": { bg: darkMode ? "rgba(34, 197, 94, 0.1)" : "rgba(34, 197, 94, 0.1)", text: "#22c55e", dot: "#22c55e" },
  };

  const priorityColors = {
    "urgent": { bg: "linear-gradient(135deg, #ef4444, #f97316)", text: "#fff" },
    "high": { bg: "#ef4444", text: "#fff" },
    "medium": { bg: "#f59e0b", text: "#fff" },
    "low": { bg: darkMode ? "#3f3f46" : "#e4e4e7", text: darkMode ? "#a1a1aa" : "#71717a" },
  };

  const labelColors: Record<string, string> = {
    "backend": "#8b5cf6",
    "frontend": "#3b82f6",
    "design": "#ec4899",
    "docs": "#10b981",
    "devops": "#f59e0b",
    "security": "#ef4444",
  };

  return (
    <div
      className="min-h-screen transition-colors duration-300"
      style={{ backgroundColor: t.bg, color: t.text }}
    >
      {/* Command Palette Hint */}
      <div
        className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 px-4 py-2 rounded-full text-xs font-medium backdrop-blur-xl transition-all duration-300 hover:scale-105"
        style={{
          backgroundColor: darkMode ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.05)",
          border: `1px solid ${t.border}`,
          color: t.textMuted
        }}
      >
        <kbd className="px-1.5 py-0.5 rounded text-[10px] font-mono" style={{ backgroundColor: t.bgMuted }}>⌘</kbd>
        <kbd className="px-1.5 py-0.5 rounded text-[10px] font-mono" style={{ backgroundColor: t.bgMuted }}>K</kbd>
        <span>Quick actions</span>
      </div>

      {/* Header */}
      <header
        className="sticky top-0 z-40 backdrop-blur-xl border-b transition-colors"
        style={{
          backgroundColor: darkMode ? "rgba(10, 10, 11, 0.8)" : "rgba(255, 255, 255, 0.8)",
          borderColor: t.border
        }}
      >
        <div className="max-w-6xl mx-auto px-6">
          <div className="flex items-center justify-between h-14">
            {/* Logo */}
            <div className="flex items-center gap-3">
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center font-bold text-white text-sm"
                style={{ background: "linear-gradient(135deg, #6366f1, #8b5cf6)" }}
              >
                P
              </div>
              <span className="font-semibold tracking-tight">PM-OS</span>
              <span
                className="text-xs px-2 py-0.5 rounded-full font-medium"
                style={{ backgroundColor: t.accentMuted, color: t.accent }}
              >
                v3.0
              </span>
            </div>

            {/* Navigation */}
            <nav className="flex items-center gap-1">
              {(["overview", "components", "dashboard"] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setSelectedTab(tab)}
                  className="px-4 py-1.5 text-sm font-medium rounded-lg transition-all duration-200"
                  style={{
                    backgroundColor: selectedTab === tab ? t.accentMuted : "transparent",
                    color: selectedTab === tab ? t.accent : t.textSecondary,
                  }}
                >
                  {tab.charAt(0).toUpperCase() + tab.slice(1)}
                </button>
              ))}
            </nav>

            {/* Right side */}
            <div className="flex items-center gap-3">
              {/* Search */}
              <button
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm transition-colors"
                style={{ backgroundColor: t.bgMuted, color: t.textMuted }}
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <span>Search...</span>
                <kbd className="text-[10px] font-mono px-1 rounded" style={{ backgroundColor: t.bg }}>/</kbd>
              </button>

              {/* Theme toggle */}
              <button
                onClick={() => setDarkMode(!darkMode)}
                className="p-2 rounded-lg transition-colors"
                style={{ backgroundColor: t.bgMuted }}
              >
                {darkMode ? (
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                ) : (
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                  </svg>
                )}
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-10">
        {/* Overview Tab */}
        {selectedTab === "overview" && (
          <div className="space-y-16">
            {/* Hero */}
            <section className="text-center py-16">
              <div
                className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium mb-6"
                style={{ backgroundColor: t.accentMuted, color: t.accent }}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />
                Design System
              </div>
              <h1 className="text-5xl font-bold tracking-tight mb-4">
                Ship faster, together.
              </h1>
              <p className="text-lg max-w-xl mx-auto" style={{ color: t.textSecondary }}>
                A clean, focused interface inspired by the tools teams actually love using.
              </p>
            </section>

            {/* Design Principles */}
            <section>
              <h2 className="text-sm font-semibold uppercase tracking-wider mb-6" style={{ color: t.textMuted }}>
                Design Principles
              </h2>
              <div className="grid md:grid-cols-3 gap-4">
                {[
                  {
                    title: "Minimal & Focused",
                    desc: "Remove everything that doesn't help users accomplish their goals.",
                    icon: "M4 6h16M4 12h16m-7 6h7"
                  },
                  {
                    title: "Keyboard First",
                    desc: "Every action accessible via keyboard. Speed is a feature.",
                    icon: "M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                  },
                  {
                    title: "Instant Feedback",
                    desc: "Every interaction should feel immediate and responsive.",
                    icon: "M13 10V3L4 14h7v7l9-11h-7z"
                  },
                ].map((principle) => (
                  <div
                    key={principle.title}
                    className="p-5 rounded-xl border transition-all duration-200 hover:border-opacity-50 group"
                    style={{
                      backgroundColor: t.bgSubtle,
                      borderColor: t.border,
                    }}
                  >
                    <div
                      className="w-10 h-10 rounded-lg flex items-center justify-center mb-4 transition-colors group-hover:bg-opacity-100"
                      style={{ backgroundColor: t.accentMuted }}
                    >
                      <svg className="w-5 h-5" style={{ color: t.accent }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d={principle.icon} />
                      </svg>
                    </div>
                    <h3 className="font-semibold mb-2">{principle.title}</h3>
                    <p className="text-sm" style={{ color: t.textSecondary }}>{principle.desc}</p>
                  </div>
                ))}
              </div>
            </section>

            {/* Color Palette */}
            <section>
              <h2 className="text-sm font-semibold uppercase tracking-wider mb-6" style={{ color: t.textMuted }}>
                Color System
              </h2>
              <div className="grid gap-4">
                {/* Neutrals */}
                <div
                  className="p-5 rounded-xl border"
                  style={{ backgroundColor: t.bgSubtle, borderColor: t.border }}
                >
                  <h3 className="text-sm font-medium mb-4">Neutrals</h3>
                  <div className="flex gap-2">
                    {[
                      { name: "bg", light: "#ffffff", dark: "#0a0a0b" },
                      { name: "subtle", light: "#fafafa", dark: "#111113" },
                      { name: "muted", light: "#f4f4f5", dark: "#18181b" },
                      { name: "elevated", light: "#ffffff", dark: "#1f1f23" },
                      { name: "hover", light: "#f4f4f5", dark: "#27272a" },
                      { name: "border", light: "#e4e4e7", dark: "#27272a" },
                    ].map((color) => (
                      <div key={color.name} className="flex-1 text-center">
                        <div
                          className="h-12 rounded-lg mb-2 border"
                          style={{
                            backgroundColor: darkMode ? color.dark : color.light,
                            borderColor: darkMode ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.05)"
                          }}
                        />
                        <p className="text-xs font-medium">{color.name}</p>
                        <p className="text-[10px] font-mono" style={{ color: t.textMuted }}>
                          {darkMode ? color.dark : color.light}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Semantic */}
                <div className="grid md:grid-cols-2 gap-4">
                  <div
                    className="p-5 rounded-xl border"
                    style={{ backgroundColor: t.bgSubtle, borderColor: t.border }}
                  >
                    <h3 className="text-sm font-medium mb-4">Status</h3>
                    <div className="flex gap-3">
                      {[
                        { name: "Success", color: "#22c55e" },
                        { name: "Warning", color: "#fbbf24" },
                        { name: "Error", color: "#ef4444" },
                        { name: "Info", color: "#3b82f6" },
                      ].map((status) => (
                        <div key={status.name} className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-lg" style={{ backgroundColor: status.color }} />
                          <div>
                            <p className="text-xs font-medium">{status.name}</p>
                            <p className="text-[10px] font-mono" style={{ color: t.textMuted }}>{status.color}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div
                    className="p-5 rounded-xl border"
                    style={{ backgroundColor: t.bgSubtle, borderColor: t.border }}
                  >
                    <h3 className="text-sm font-medium mb-4">Labels</h3>
                    <div className="flex flex-wrap gap-2">
                      {Object.entries(labelColors).map(([name, color]) => (
                        <span
                          key={name}
                          className="px-2 py-1 rounded text-xs font-medium"
                          style={{ backgroundColor: `${color}20`, color }}
                        >
                          {name}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* Typography */}
            <section>
              <h2 className="text-sm font-semibold uppercase tracking-wider mb-6" style={{ color: t.textMuted }}>
                Typography
              </h2>
              <div
                className="p-6 rounded-xl border space-y-6"
                style={{ backgroundColor: t.bgSubtle, borderColor: t.border }}
              >
                <div className="flex items-baseline justify-between border-b pb-4" style={{ borderColor: t.border }}>
                  <span className="text-4xl font-bold tracking-tight">Display</span>
                  <span className="text-xs font-mono" style={{ color: t.textMuted }}>text-4xl / font-bold</span>
                </div>
                <div className="flex items-baseline justify-between border-b pb-4" style={{ borderColor: t.border }}>
                  <span className="text-2xl font-semibold">Heading</span>
                  <span className="text-xs font-mono" style={{ color: t.textMuted }}>text-2xl / font-semibold</span>
                </div>
                <div className="flex items-baseline justify-between border-b pb-4" style={{ borderColor: t.border }}>
                  <span className="text-lg font-medium">Subheading</span>
                  <span className="text-xs font-mono" style={{ color: t.textMuted }}>text-lg / font-medium</span>
                </div>
                <div className="flex items-baseline justify-between border-b pb-4" style={{ borderColor: t.border }}>
                  <span className="text-base">Body text for general content and descriptions.</span>
                  <span className="text-xs font-mono" style={{ color: t.textMuted }}>text-base</span>
                </div>
                <div className="flex items-baseline justify-between">
                  <span className="text-sm" style={{ color: t.textSecondary }}>Secondary text for metadata</span>
                  <span className="text-xs font-mono" style={{ color: t.textMuted }}>text-sm / secondary</span>
                </div>
              </div>
            </section>
          </div>
        )}

        {/* Components Tab */}
        {selectedTab === "components" && (
          <div className="space-y-12">
            {/* Buttons */}
            <section>
              <h2 className="text-sm font-semibold uppercase tracking-wider mb-6" style={{ color: t.textMuted }}>
                Buttons
              </h2>
              <div
                className="p-6 rounded-xl border space-y-8"
                style={{ backgroundColor: t.bgSubtle, borderColor: t.border }}
              >
                <div>
                  <h3 className="text-xs font-medium mb-4" style={{ color: t.textMuted }}>Primary</h3>
                  <div className="flex flex-wrap gap-3">
                    <button
                      className="px-4 py-2 rounded-lg text-sm font-medium text-white transition-all hover:opacity-90 active:scale-[0.98]"
                      style={{ backgroundColor: t.accent }}
                    >
                      Create project
                    </button>
                    <button
                      className="px-4 py-2 rounded-lg text-sm font-medium text-white transition-all hover:opacity-90 active:scale-[0.98] flex items-center gap-2"
                      style={{ backgroundColor: t.accent }}
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                      </svg>
                      New task
                    </button>
                  </div>
                </div>

                <div>
                  <h3 className="text-xs font-medium mb-4" style={{ color: t.textMuted }}>Secondary</h3>
                  <div className="flex flex-wrap gap-3">
                    <button
                      className="px-4 py-2 rounded-lg text-sm font-medium transition-all hover:opacity-80"
                      style={{ backgroundColor: t.bgMuted, color: t.text }}
                    >
                      Cancel
                    </button>
                    <button
                      className="px-4 py-2 rounded-lg text-sm font-medium border transition-all"
                      style={{ borderColor: t.border, color: t.text, backgroundColor: "transparent" }}
                    >
                      Export
                    </button>
                  </div>
                </div>

                <div>
                  <h3 className="text-xs font-medium mb-4" style={{ color: t.textMuted }}>Ghost & Danger</h3>
                  <div className="flex flex-wrap gap-3">
                    <button
                      className="px-4 py-2 rounded-lg text-sm font-medium transition-all"
                      style={{ color: t.accent, backgroundColor: "transparent" }}
                    >
                      View all
                    </button>
                    <button
                      className="px-4 py-2 rounded-lg text-sm font-medium transition-all hover:bg-red-500/10"
                      style={{ color: "#ef4444", backgroundColor: "transparent" }}
                    >
                      Delete
                    </button>
                  </div>
                </div>

                <div>
                  <h3 className="text-xs font-medium mb-4" style={{ color: t.textMuted }}>Icon buttons</h3>
                  <div className="flex flex-wrap gap-2">
                    {[
                      "M12 4v16m8-8H4",
                      "M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z",
                      "M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z",
                      "M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z",
                    ].map((icon, i) => (
                      <button
                        key={i}
                        className="p-2 rounded-lg transition-colors"
                        style={{ backgroundColor: t.bgMuted }}
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d={icon} />
                        </svg>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </section>

            {/* Status & Badges */}
            <section>
              <h2 className="text-sm font-semibold uppercase tracking-wider mb-6" style={{ color: t.textMuted }}>
                Status & Badges
              </h2>
              <div
                className="p-6 rounded-xl border space-y-8"
                style={{ backgroundColor: t.bgSubtle, borderColor: t.border }}
              >
                <div>
                  <h3 className="text-xs font-medium mb-4" style={{ color: t.textMuted }}>Task Status</h3>
                  <div className="flex flex-wrap gap-3">
                    {Object.entries(statusColors).map(([status, colors]) => (
                      <span
                        key={status}
                        className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium"
                        style={{ backgroundColor: colors.bg, color: colors.text }}
                      >
                        <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: colors.dot }} />
                        {status === "in-progress" ? "In Progress" : status.charAt(0).toUpperCase() + status.slice(1)}
                      </span>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="text-xs font-medium mb-4" style={{ color: t.textMuted }}>Priority</h3>
                  <div className="flex flex-wrap gap-3">
                    {Object.entries(priorityColors).map(([priority, colors]) => (
                      <span
                        key={priority}
                        className="px-2.5 py-1 rounded text-[11px] font-semibold uppercase tracking-wide"
                        style={{ background: colors.bg, color: colors.text }}
                      >
                        {priority}
                      </span>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="text-xs font-medium mb-4" style={{ color: t.textMuted }}>Labels</h3>
                  <div className="flex flex-wrap gap-2">
                    {Object.entries(labelColors).map(([label, color]) => (
                      <span
                        key={label}
                        className="px-2.5 py-1 rounded-full text-xs font-medium"
                        style={{ backgroundColor: `${color}15`, color, border: `1px solid ${color}30` }}
                      >
                        {label}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </section>

            {/* Task Card */}
            <section>
              <h2 className="text-sm font-semibold uppercase tracking-wider mb-6" style={{ color: t.textMuted }}>
                Task Cards
              </h2>
              <div className="grid md:grid-cols-2 gap-4">
                {sampleTasks.slice(0, 2).map((task) => (
                  <div
                    key={task.id}
                    className="p-4 rounded-xl border transition-all duration-200 cursor-pointer group"
                    style={{
                      backgroundColor: hoveredTask === task.id ? t.bgHover : t.bgSubtle,
                      borderColor: hoveredTask === task.id ? t.accent : t.border,
                    }}
                    onMouseEnter={() => setHoveredTask(task.id)}
                    onMouseLeave={() => setHoveredTask(null)}
                  >
                    {/* Header */}
                    <div className="flex items-start justify-between mb-3">
                      <span className="text-xs font-mono" style={{ color: t.textMuted }}>{task.id}</span>
                      <span
                        className="px-2 py-0.5 rounded text-[10px] font-semibold uppercase"
                        style={{
                          background: priorityColors[task.priority as keyof typeof priorityColors].bg,
                          color: priorityColors[task.priority as keyof typeof priorityColors].text
                        }}
                      >
                        {task.priority}
                      </span>
                    </div>

                    {/* Title */}
                    <h4 className="font-medium mb-3 leading-snug">{task.title}</h4>

                    {/* Labels */}
                    <div className="flex flex-wrap gap-1.5 mb-4">
                      {task.labels.map((label) => (
                        <span
                          key={label}
                          className="px-2 py-0.5 rounded text-[10px] font-medium"
                          style={{ backgroundColor: `${labelColors[label]}20`, color: labelColors[label] }}
                        >
                          {label}
                        </span>
                      ))}
                    </div>

                    {/* Footer */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span
                          className="inline-flex items-center gap-1.5 px-2 py-1 rounded text-[11px] font-medium"
                          style={{
                            backgroundColor: statusColors[task.status as keyof typeof statusColors].bg,
                            color: statusColors[task.status as keyof typeof statusColors].text
                          }}
                        >
                          <span
                            className="w-1.5 h-1.5 rounded-full"
                            style={{ backgroundColor: statusColors[task.status as keyof typeof statusColors].dot }}
                          />
                          {task.status === "in-progress" ? "In Progress" : task.status.charAt(0).toUpperCase() + task.status.slice(1)}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        {/* Progress */}
                        {task.status === "in-progress" && (
                          <div className="flex items-center gap-2">
                            <div className="w-16 h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: t.bgMuted }}>
                              <div
                                className="h-full rounded-full transition-all"
                                style={{ width: `${task.progress}%`, backgroundColor: "#fbbf24" }}
                              />
                            </div>
                            <span className="text-[10px] font-medium" style={{ color: t.textMuted }}>{task.progress}%</span>
                          </div>
                        )}

                        {/* Assignee */}
                        <div
                          className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold text-white"
                          style={{ background: "linear-gradient(135deg, #6366f1, #8b5cf6)" }}
                        >
                          {task.assignee}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* Form Elements */}
            <section>
              <h2 className="text-sm font-semibold uppercase tracking-wider mb-6" style={{ color: t.textMuted }}>
                Form Elements
              </h2>
              <div
                className="p-6 rounded-xl border"
                style={{ backgroundColor: t.bgSubtle, borderColor: t.border }}
              >
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium mb-2">Task name</label>
                    <input
                      type="text"
                      placeholder="Enter task name..."
                      className="w-full px-3 py-2 rounded-lg text-sm transition-colors focus:outline-none focus:ring-2"
                      style={{
                        backgroundColor: t.bgMuted,
                        border: `1px solid ${t.border}`,
                        color: t.text,
                      }}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Assignee</label>
                    <select
                      className="w-full px-3 py-2 rounded-lg text-sm transition-colors focus:outline-none focus:ring-2"
                      style={{
                        backgroundColor: t.bgMuted,
                        border: `1px solid ${t.border}`,
                        color: t.text,
                      }}
                    >
                      <option>Select assignee...</option>
                      {teamMembers.map((m) => (
                        <option key={m.initials}>{m.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium mb-2">Description</label>
                    <textarea
                      placeholder="Describe the task..."
                      rows={3}
                      className="w-full px-3 py-2 rounded-lg text-sm transition-colors focus:outline-none focus:ring-2 resize-none"
                      style={{
                        backgroundColor: t.bgMuted,
                        border: `1px solid ${t.border}`,
                        color: t.text,
                      }}
                    />
                  </div>
                </div>
              </div>
            </section>
          </div>
        )}

        {/* Dashboard Tab */}
        {selectedTab === "dashboard" && (
          <div className="space-y-8">
            {/* Stats */}
            <div className="grid grid-cols-4 gap-4">
              {[
                { label: "Total Tasks", value: "128", change: "+12", positive: true },
                { label: "Completed", value: "89", change: "+8", positive: true },
                { label: "In Progress", value: "24", change: "+3", positive: true },
                { label: "Overdue", value: "5", change: "-2", positive: true },
              ].map((stat) => (
                <div
                  key={stat.label}
                  className="p-5 rounded-xl border transition-colors"
                  style={{ backgroundColor: t.bgSubtle, borderColor: t.border }}
                >
                  <p className="text-xs font-medium mb-1" style={{ color: t.textMuted }}>{stat.label}</p>
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-bold tracking-tight">{stat.value}</span>
                    <span
                      className="text-xs font-medium"
                      style={{ color: stat.positive ? "#22c55e" : "#ef4444" }}
                    >
                      {stat.change}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* Main content */}
            <div className="grid lg:grid-cols-3 gap-6">
              {/* Task list */}
              <div
                className="lg:col-span-2 rounded-xl border overflow-hidden"
                style={{ backgroundColor: t.bgSubtle, borderColor: t.border }}
              >
                <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: t.border }}>
                  <h3 className="font-semibold">Active Tasks</h3>
                  <button
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
                    style={{ backgroundColor: t.accent, color: "#fff" }}
                  >
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                    </svg>
                    Add task
                  </button>
                </div>

                <div className="divide-y" style={{ borderColor: t.border }}>
                  {sampleTasks.map((task) => (
                    <div
                      key={task.id}
                      className="flex items-center gap-4 px-5 py-3 transition-colors cursor-pointer"
                      style={{ backgroundColor: hoveredTask === task.id ? t.bgHover : "transparent" }}
                      onMouseEnter={() => setHoveredTask(task.id)}
                      onMouseLeave={() => setHoveredTask(null)}
                    >
                      {/* Checkbox */}
                      <button
                        className="w-4 h-4 rounded border-2 flex items-center justify-center transition-colors"
                        style={{
                          borderColor: task.status === "done" ? "#22c55e" : t.border,
                          backgroundColor: task.status === "done" ? "#22c55e" : "transparent"
                        }}
                      >
                        {task.status === "done" && (
                          <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                      </button>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-mono" style={{ color: t.textMuted }}>{task.id}</span>
                          <span
                            className="px-1.5 py-0.5 rounded text-[9px] font-bold uppercase"
                            style={{
                              background: priorityColors[task.priority as keyof typeof priorityColors].bg,
                              color: priorityColors[task.priority as keyof typeof priorityColors].text
                            }}
                          >
                            {task.priority}
                          </span>
                        </div>
                        <p
                          className="text-sm font-medium truncate"
                          style={{
                            textDecoration: task.status === "done" ? "line-through" : "none",
                            color: task.status === "done" ? t.textMuted : t.text
                          }}
                        >
                          {task.title}
                        </p>
                      </div>

                      {/* Labels */}
                      <div className="hidden md:flex gap-1">
                        {task.labels.map((label) => (
                          <span
                            key={label}
                            className="w-2 h-2 rounded-full"
                            style={{ backgroundColor: labelColors[label] }}
                            title={label}
                          />
                        ))}
                      </div>

                      {/* Assignee */}
                      <div
                        className="w-6 h-6 rounded-full flex items-center justify-center text-[9px] font-bold text-white flex-shrink-0"
                        style={{ background: "linear-gradient(135deg, #6366f1, #8b5cf6)" }}
                      >
                        {task.assignee}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Team */}
              <div
                className="rounded-xl border"
                style={{ backgroundColor: t.bgSubtle, borderColor: t.border }}
              >
                <div className="px-5 py-4 border-b" style={{ borderColor: t.border }}>
                  <h3 className="font-semibold">Team</h3>
                </div>
                <div className="p-4 space-y-3">
                  {teamMembers.map((member) => (
                    <div key={member.initials} className="flex items-center gap-3">
                      <div className="relative">
                        <div
                          className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold text-white"
                          style={{ background: "linear-gradient(135deg, #6366f1, #8b5cf6)" }}
                        >
                          {member.initials}
                        </div>
                        <span
                          className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2"
                          style={{
                            backgroundColor: member.status === "active" ? "#22c55e" : "#fbbf24",
                            borderColor: t.bgSubtle
                          }}
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{member.name}</p>
                        <p className="text-xs truncate" style={{ color: t.textMuted }}>{member.role}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Sidebar preview */}
            <div
              className="rounded-xl border p-6"
              style={{ backgroundColor: t.bgSubtle, borderColor: t.border }}
            >
              <h3 className="font-semibold mb-6">Sidebar Navigation</h3>
              <div className="flex gap-8">
                <div
                  className="w-56 rounded-xl p-4"
                  style={{ backgroundColor: t.bg }}
                >
                  {/* Logo */}
                  <div className="flex items-center gap-2.5 mb-6">
                    <div
                      className="w-8 h-8 rounded-lg flex items-center justify-center font-bold text-white text-sm"
                      style={{ background: "linear-gradient(135deg, #6366f1, #8b5cf6)" }}
                    >
                      P
                    </div>
                    <div>
                      <p className="text-sm font-semibold">PM-OS</p>
                      <p className="text-[10px]" style={{ color: t.textMuted }}>Pro Plan</p>
                    </div>
                  </div>

                  {/* Nav */}
                  <nav className="space-y-1">
                    {[
                      { icon: "M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6", label: "Dashboard", active: true, shortcut: "G D" },
                      { icon: "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2", label: "Projects", shortcut: "G P" },
                      { icon: "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z", label: "My Tasks", shortcut: "G T" },
                      { icon: "M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z", label: "Team", shortcut: "G M" },
                    ].map((item) => (
                      <a
                        key={item.label}
                        href="#"
                        className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors"
                        style={{
                          backgroundColor: item.active ? t.accentMuted : "transparent",
                          color: item.active ? t.accent : t.textSecondary,
                        }}
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d={item.icon} />
                        </svg>
                        <span className="flex-1">{item.label}</span>
                        <kbd className="text-[9px] font-mono px-1 rounded" style={{ backgroundColor: t.bgMuted, color: t.textMuted }}>
                          {item.shortcut}
                        </kbd>
                      </a>
                    ))}
                  </nav>
                </div>

                <div className="flex-1">
                  <h4 className="text-sm font-medium mb-3">Key Features</h4>
                  <ul className="space-y-2 text-sm" style={{ color: t.textSecondary }}>
                    <li className="flex items-center gap-2">
                      <span className="w-1 h-1 rounded-full" style={{ backgroundColor: t.accent }} />
                      Keyboard shortcuts visible in nav
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="w-1 h-1 rounded-full" style={{ backgroundColor: t.accent }} />
                      Subtle active state with brand color
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="w-1 h-1 rounded-full" style={{ backgroundColor: t.accent }} />
                      Compact design - no wasted space
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="w-1 h-1 rounded-full" style={{ backgroundColor: t.accent }} />
                      User presence indicators in team
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t mt-16" style={{ borderColor: t.border }}>
        <div className="max-w-6xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-semibold text-sm">PM-OS Design System</p>
              <p className="text-xs" style={{ color: t.textMuted }}>Linear-inspired • v3.0</p>
            </div>
            <div className="flex gap-3">
              <button
                className="px-4 py-2 rounded-lg text-sm font-medium border transition-colors"
                style={{ borderColor: "#ef4444", color: "#ef4444", backgroundColor: "transparent" }}
              >
                Reject
              </button>
              <button
                className="px-4 py-2 rounded-lg text-sm font-medium text-white transition-all hover:opacity-90"
                style={{ backgroundColor: "#22c55e" }}
              >
                Approve Design
              </button>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
