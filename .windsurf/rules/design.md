---
trigger: always_on
---

# Windsurf Design Rules for Car Rental System

This document outlines the design rules and conventions for the AI to follow when generating code for the Car Rental System project.

## Core Principles

- **Clarity and Simplicity:** Code should be easy to read, understand, and maintain. Prioritize clear and descriptive names for variables, functions, and components.
- **Structure:** Follow the existing project structure. New features should be organized logically within the `apps/web` directory.
- **Leverage Existing Components:** Before creating new components, check for existing ones in `apps/web/components` that can be reused or extended.
- **When to Generate Components:** Only generate new components when there is a clear need and no existing component can be reused or extended.
- **TypeScript and Next.js:** Use TypeScript and Next.js conventions throughout the project. Refer to `/apps/web/app/layout.tsx` for examples.
- **Imports:** Use relative imports for local files and absolute imports for shared utilities and components eg. `@/lib/utils`.

## Component Generation

- **Location:** All new React components should be placed in the `/apps/web/components` directory.
- **Naming Convention:** Component files should be named using Camel-case (e.g., `vehicleCard.tsx`).
- **Props:** Use TypeScript interfaces for component props to ensure type safety.
- **Styling:** Use Tailwind CSS for styling. Avoid inline styles unless absolutely necessary.

## API Interaction

- **Data Fetching:** Use the `@tanstack/react-query` library for data fetching. API routes are defined in `/apps/web/app/api`.
- **Mutations:** For creating, updating, or deleting data, use the appropriate HTTP methods (POST, PUT, DELETE) when making API requests.
- **Error Handling:** Implement robust error handling for all API requests. Display user-friendly error messages when an API call fails.

## Styling and Theming

- **Tailwind CSS:** All styling should be done using Tailwind CSS utility classes. Refer to the `tailwind.config.ts` file for the project's theme and custom classes.
- **Responsive Design:** Ensure that all new components and pages are fully responsive and work well on all screen sizes.
- **Consistency:** Maintain a consistent look and feel across the application by adhering to the established design system.

## Font Management

- **Local Fonts:** Use `next/font/local` for font management. This allows for better font optimization and loading performance.
- **Font Variables:** Define font variables in the Tailwind config and use them in your components for consistency.

## External Resources

- **Tailwind CSS Documentation:** [https://tailwindcss.com/docs](https://tailwindcss.com/docs)
- **Shadcn Documentation:** [https://ui.shadcn.com/docs/components](https://ui.shadcn.com/docs/components)
- **Cloudinary Documentation:** [https://next.cloudinary.dev/installation](https://next.cloudinary.dev/installation)
- **UI Design Inspiration:**
  - [Mobbin](https://mobbin.com)
  - [Page Flows](https://pageflows.com)
