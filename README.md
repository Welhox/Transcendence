# Transcendence
![Homepage](https://github.com/user-attachments/assets/7c0e21ab-4517-4db3-892f-a6c08ab1acc7)

A **full-stack** web project built around the iconic game of **PONG** with:

- **Fastify** + **Prisma/SQLite** on the backend  
- **React** (via **Vite**) + **TypeScript** on the frontend  
- **Nginx** as a reverse HTTPS proxy  
- **Docker Compose** orchestration  

> **Note:** full installation involves sensitive env vars (mailing creds, etc.), so see the provided `.env.example` files for details.

---

## Table of Contents

1. [What Is Transcendence?](#what-is-transcendence)  
2. [Component Deep-Dive](#component-deep-dive)  
3. [Data Flow](#data-flow)  
4. [Core Features](#core-features)  
5. [Visuals & Demos](#visuals--demos)  
6. [Contributors](#contributors)  
7. [License](#license)  

---

## What Is Transcendence?

Transcendence is a **full-stack ping-pong** web application template showcasing:

- **Single matches** (head-to-head) for guests or authenticated users  
- **Tournament brackets** with customizable rounds  
- **Single-player vs AI** opponent with adjustable difficulty  
- **Match customization**—multiple arenas/levels, variable ball speed, power-ups  
- **Multi-language support** (English, Swedish, Finnish)  
- **Full screen-reader accessibility**  
- **Multi-factor authentication (MFA)** via one-time passwords (OTP)  

It’s designed as a learning-friendly, production-style codebase you can explore, modify, or extend.

---

## Component Deep-Dive

### Backend (Fastify + Prisma/SQLite)

- **Fastify** for high-performance HTTP endpoints  
- **Prisma ORM** with SQLite for zero-config persistence  
- **User management**: registration, login, profiles, secure JWT auth + MFA via OTP  
- **Game logic**:  
  - Single matches & scorekeeping  
  - Tournament bracket generation and progression  
  - AI opponent routines with adjustable difficulty  
- **Notifications** via `nodemailer` (configure SMTP in `backend/.env`)

### Frontend (React + Vite + TypeScript)

- **Vite** for lightning-fast dev reloads  
- **React** + **TypeScript** for a strongly-typed SPA  
- **Tailwind CSS** & Forms plugin for UI  
- **i18next** for localization (EN, SV, FI)  
- **Accessibility**: ARIA roles, keyboard navigation, screen-reader support  
- **Game UI**:  
  - Match setup screen (mode, arena, speed, power-ups)  
  - Tournament bracket view  
  - Single-player vs AI arena  

### Nginx & SSL

- **Reverse HTTPS Proxy**  
  - Terminates SSL (self-signed by default via `make ssl`)  
  - Serves built React assets  
  - Proxies API requests (`/api/...`) to Fastify  

### Docker Compose Orchestration

- **Services**: `frontend`, `backend` (embedded SQLite)  
- **Makefile** helpers:  
  - `make ssl` → generate self-signed cert  
  - `make jwt-secret` → add `JWT_SECRET` to `backend/.env`  
  - `make up` / `make down` → control the stack  

---

## Data Flow

1. **Browser** → **Nginx** (HTTPS)  
2. **Nginx** serves React shell or proxies to Fastify API  
3. **React** uses **axios** to call REST endpoints only  
4. **Fastify** authenticates (incl. MFA), processes game actions, updates Prisma  
5. **Prisma** persists users, matches, tournaments, stats in SQLite  

---

## Core Features

- **Single Matches** (guest or logged-in)  
- **Tournament Mode** with bracket generation  
- **Single-Player vs AI** with difficulty levels  
- **Match Customization**: arenas/levels, ball speed, power-ups  
- **User Registration & Login** (JWT + secure cookies)  
- **Multi-Factor Authentication** via OTP  
- **Multi-Language Interface** (English, Swedish, Finnish)  
- **Full Screen-Reader Accessibility**  
- **File Upload** & image processing (e.g., avatars)  
- **Seed Script** (`run_extended_seed.sh`) for demo data  
- **Environment-driven Config** via provided `.env.example` files  

---

## Visuals & Demos

<details>
  <summary>▶️ Video Showcase</summary>

  🎬 **YouTube Demo:**  
  https://youtu.be/6TZGFZVT26I
</details>

<details>
  <summary>▶️ Homepage</summary>
  
  ![Homepage](https://github.com/user-attachments/assets/7c0e21ab-4517-4db3-892f-a6c08ab1acc7)
</details>

<details>
  <summary>▶️ Pong Game</summary>
  
  ![Pong Game](https://github.com/user-attachments/assets/6a405ab4-fe1f-4d0a-bf50-4b238300687d)
</details>

<details>
  <summary>▶️ Settings</summary>
  
  ![Settings](https://github.com/user-attachments/assets/a8180969-6ee9-4b3b-ab18-937c8b92eb1c)
</details>

<details>
  <summary>▶️ OTP</summary>
  
  ![OTP](https://github.com/user-attachments/assets/c61e4be8-2149-4174-a3b1-17788550962f)
</details>

<details>
  <summary>▶️ Stats</summary>
  
  ![Stats](https://github.com/user-attachments/assets/699144a9-1478-4d3f-9559-546c371c4eb5)
</details>

<details>
  <summary>▶️ Pong Pals</summary>
  
  ![Pong Pals](https://github.com/user-attachments/assets/45608c0f-ab1e-4517-aa29-8433619c061e)
</details>

---

## Contributors

- **Casimir Lundberg** ([Welhox](https://github.com/Welhox))  
- **Emmi Järvinen** ([ejarvinen](https://github.com/ejarvinen))  
- **Ryan Boudwin** ([KrolPolski](https://github.com/KrolPolski))  
- **Sahra Taskinen** ([staskine](https://github.com/staskine))  
- **Armin Kuburas** ([ArminKuburas](https://github.com/ArminKuburas))  

---

## License

Released under the **MIT License**. See [LICENSE](LICENSE) for details.  
