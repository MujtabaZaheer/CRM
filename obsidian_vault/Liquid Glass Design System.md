---
tags:
  - ui/design-system
  - sidebar
  - glassmorphism
date: 2026-08-13
---

# 💎 Liquid Glass Design System & Sidebar Navigation

Sleek, modern liquid glass visual architecture and dynamic responsive layout engine implemented across EduCRM.

---

## 🎨 Liquid Glass Aesthetic Specification

- **Glassmorphism Backdrop Filter**: Uses `backdrop-filter: blur(24px) saturate(190%)` for a rich, frosted glass visual depth effect.
- **Translucent CSS Tokens**:
  - Dark Mode: `--bg-sidebar: rgba(18, 18, 22, 0.7)`, `--bg-sidebar-border: rgba(255, 255, 255, 0.08)`.
  - Light Mode: `--bg-sidebar: rgba(255, 255, 255, 0.75)`, `--bg-sidebar-border: rgba(0, 0, 0, 0.08)`.
- **Top Header**: Topbar header has matching `backdrop-blur-md` and `bg-[var(--bg-card)]/80` translucency.

---

## 📐 Dynamic Content Expansion & Contraction Layout Engine

- **Fixed Sidebar Positioning**: Sits in fixed spatial layer (`fixed top-0 left-0 z-50 h-screen glass-sidebar`).
- **Responsive Main Area Transition**:
  - `ProtectedLayout.tsx` wraps main content in `transition-all duration-300`.
  - When Sidebar expands (`collapsed = false`), main content automatically contracts (`lg:ml-64`).
  - When Sidebar collapses (`collapsed = true`), main content automatically expands (`lg:ml-16`).
- **Mobile View**: Slides out over content with backdrop overlay (`bg-[var(--backdrop)] backdrop-blur-sm lg:hidden`).
