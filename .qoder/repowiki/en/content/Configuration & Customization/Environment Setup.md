# Environment Setup

<cite>
**Referenced Files in This Document**
- [package.json](file://package.json)
- [next.config.mjs](file://next.config.mjs)
- [tsconfig.json](file://tsconfig.json)
- [tailwind.config.ts](file://tailwind.config.ts)
- [postcss.config.mjs](file://postcss.config.mjs)
- [next-env.d.ts](file://next-env.d.ts)
- [lib/config.ts](file://lib/config.ts)
- [.qoder/settings.local.json](file://.qoder/settings.local.json)
- [lib/db/index.ts](file://lib/db/index.ts)
</cite>

## Table of Contents
1. [Introduction](#introduction)
2. [System Requirements](#system-requirements)
3. [Node.js Version Compatibility](#nodejs-version-compatibility)
4. [Dependency Installation](#dependency-installation)
5. [Next.js Configuration](#nextjs-configuration)
6. [TypeScript Compilation Settings](#typescript-compilation-settings)
7. [Tailwind CSS Setup](#tailwind-css-setup)
8. [Development Server](#development-server)
9. [Build Process](#build-process)
10. [Production Deployment](#production-deployment)
11. [Environment-Specific Considerations](#environment-specific-considerations)
12. [Troubleshooting Guide](#troubleshooting-guide)
13. [Conclusion](#conclusion)

## Introduction
This guide provides comprehensive environment setup instructions for VocabMaster. It covers system requirements, Node.js compatibility, dependency installation, Next.js configuration, TypeScript settings, Tailwind CSS setup, development and build workflows, production deployment considerations, environment-specific notes, and troubleshooting for common setup issues.

## System Requirements
- Operating systems: macOS, Linux, or Windows with WSL2 recommended for SQLite-native modules.
- Disk space: At least several hundred megabytes for dependencies and generated build artifacts.
- Network connectivity: Required for downloading dependencies and connecting to external APIs (when enabled).
- Optional hardware: Audio device and microphone for text-to-speech features (TTS).

## Node.js Version Compatibility
- Supported range: Node.js 18.x or later. The project targets modern runtime environments compatible with Next.js 14 and the latest package ecosystem.
- Recommendation: Use the latest LTS version of Node.js to benefit from performance improvements and security patches.

**Section sources**
- [package.json](file://package.json#L11-L21)

## Dependency Installation
Install dependencies using your preferred package manager (npm, yarn, pnpm). Run the install command in the project root directory.

- Install command: npm install
- Post-install: The project generates Next.js type declarations automatically during the build process.

Notes:
- The project uses a native module for server-side database operations. On some platforms, this may require additional build tools or prebuild steps depending on your environment.

**Section sources**
- [package.json](file://package.json#L5-L10)
- [package.json](file://package.json#L11-L31)

## Next.js Configuration
The application uses a minimal Next.js configuration optimized for server-side database operations and strict mode enforcement.

Key configuration highlights:
- Strict mode: Enabled globally for improved React development safety.
- Webpack externals: Excludes a native module from client-side bundling and ensures it runs server-side only in API routes.
- Type generation: Next.js automatically generates type declarations under the .next directory after builds.

**Section sources**
- [next.config.mjs](file://next.config.mjs#L1-L15)
- [next-env.d.ts](file://next-env.d.ts#L1-L6)

## TypeScript Compilation Settings
TypeScript is configured for modern ES modules, strict type checking, and Next.js app directory support.

Key compiler options:
- Target and libraries: Modern DOM and ESNext APIs.
- Strictness: Enabled for stricter type checks.
- Module resolution: Bundler-based resolution for optimal Next.js integration.
- JSX handling: Preserved for React components.
- Path aliases: Root alias (@/*) mapped to project root for clean imports.
- Includes/excludes: Types included via Next.js env d.ts and app directory sources; node_modules excluded.

**Section sources**
- [tsconfig.json](file://tsconfig.json#L2-L27)

## Tailwind CSS Setup
Tailwind CSS is integrated with PostCSS and configured for a component-driven design system.

Configuration overview:
- Dark mode strategy: Class-based dark mode.
- Content scanning: Scans pages, components, app directory, and src for class usage.
- Theme extensions: Container sizing, spacing, color palette, border radius, shadows, keyframes, and animations.
- Plugins: Includes a Tailwind plugin for enhanced animations.
- PostCSS pipeline: Tailwind and Autoprefixer are applied via PostCSS configuration.

**Section sources**
- [tailwind.config.ts](file://tailwind.config.ts#L1-L103)
- [postcss.config.mjs](file://postcss.config.mjs#L1-L10)

## Development Server
Start the development server using the Next.js CLI.

- Command: npm run dev
- Behavior: Launches the Next.js dev server with hot reloading and strict mode enabled.

**Section sources**
- [package.json](file://package.json#L5-L10)
- [next.config.mjs](file://next.config.mjs#L2-L4)

## Build Process
Build the application for production using the Next.js build command.

- Command: npm run build
- Output: Generates optimized static assets and server code under the .next directory. Next.js also generates type declarations for the app directory.

**Section sources**
- [package.json](file://package.json#L7-L7)
- [next.config.mjs](file://next.config.mjs#L14-L14)

## Production Deployment
Deploy the built application using the Next.js production server.

- Command: npm run start
- Behavior: Starts the Next.js production server serving the built application.

Notes:
- The native database module is intended for server-side use only. Ensure your hosting environment supports server-side Node.js execution and file system access for the database file.
- If deploying to platforms that restrict native modules, consider migrating the database backend abstraction to a cloud-hosted SQL service.

**Section sources**
- [package.json](file://package.json#L8-L8)
- [lib/db/index.ts](file://lib/db/index.ts#L1-L21)

## Environment-Specific Considerations
- AI configuration persistence: The application stores AI endpoint settings in browser local storage. This is relevant for development and testing but does not affect server-side operations.
- Local settings: Qoder local settings file exists for internal tooling and does not impact the web application’s runtime.

**Section sources**
- [lib/config.ts](file://lib/config.ts#L1-L63)
- [.qoder/settings.local.json](file://.qoder/settings.local.json#L1-L4)

## Troubleshooting Guide
Common setup issues and resolutions:

- Native module build errors on server-side dependencies:
  - Symptom: Errors related to building or bundling a native module during development or build.
  - Cause: The native module is intended for server-side use only and must be excluded from client-side bundling.
  - Resolution: Ensure the server-side exclusion is active in the Next.js webpack configuration and that the module is only imported in server-side contexts (e.g., API routes).

- TypeScript errors or missing types:
  - Symptom: Type errors or missing Next.js types in the editor.
  - Cause: Missing or outdated type declarations.
  - Resolution: Run a build to regenerate Next.js type declarations under .next/types, then restart your TypeScript server or editor.

- Tailwind CSS not generating styles:
  - Symptom: Tailwind classes have no effect.
  - Cause: Content paths or PostCSS pipeline misconfiguration.
  - Resolution: Verify content globs in the Tailwind config match your file locations and ensure PostCSS is configured to apply Tailwind and Autoprefixer.

- Database initialization failures:
  - Symptom: Application fails to initialize the database or access the database file.
  - Cause: File permissions or missing database file.
  - Resolution: Confirm the database file exists and is readable/writable by the Node.js process. Ensure the database abstraction is initialized before use.

- AI configuration not recognized:
  - Symptom: Features requiring an AI endpoint are disabled.
  - Cause: Missing or empty API key.
  - Resolution: Configure the AI endpoint settings in the application settings dialog and save the configuration. Verify the saved values are persisted in local storage.

**Section sources**
- [next.config.mjs](file://next.config.mjs#L6-L11)
- [tsconfig.json](file://tsconfig.json#L25-L27)
- [tailwind.config.ts](file://tailwind.config.ts#L5-L10)
- [postcss.config.mjs](file://postcss.config.mjs#L2-L7)
- [lib/db/index.ts](file://lib/db/index.ts#L12-L18)
- [lib/config.ts](file://lib/config.ts#L23-L37)

## Conclusion
You now have the essential steps to set up, develop, build, and deploy VocabMaster. Ensure your Node.js version meets the requirements, install dependencies, configure Next.js, TypeScript, and Tailwind CSS as outlined, and use the provided commands to run the development server, build the application, and start the production server. For persistent configuration and environment-specific adjustments, consult the troubleshooting section to resolve common issues efficiently.