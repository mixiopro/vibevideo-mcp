# VibeVideo-MCP

## Overview

This monorepo contains an MCP server for agentic video editing. It also powers a front-end human user editor. It’s built and maintained by [HYE Partners](https://www.hyepartners.com).

---

## Installation

You’ll need **Node.js**, **npm** (or pnpm/yarn), and **Python 3.12+** (with `pip`).  
These instructions assume a Unix-like OS (Mac/Linux), but should be adaptable for Windows.
Docker instructions below. 

---

## Clone the Repo

- From your root coding project directory
- git clone https://github.com/hyepartners-gmail/vibevideo-mcp.git
- cd vibevideo-mcp

### Install the ffmpeg-backend components

- cd ffmpeg-backend
- python3 -m venv .venv
- source .venv/bin/activate
- pip install -r requirements.txt

### If you don't have ffmpeg installed
- pip install ffmpeg

### Install the ffmpeg-frontend components

- cd ffmpeg-frontend
- npm install


---
## Structure

The project includes **three main servers**:

### 1. React Front-End (Vite)
- **URL:** http://localhost:8080/
- **Dev:** Runs on Vite 
- **For:** User front-end that gives you access to all of the video editing tools
- **Run:** (This launches *both* the React front-end and Node back-end in dev mode) 
- npm run dev

---

### 2. Node.js Back-End (Express)
- **URL:** http://localhost:8300/
- **Dev:** MCP Server, handles API requests from Python agents
---

### 3. Python Back-End (FFmpeg Command Runner)
- **URL:** http://127.0.0.1:8200
- **For:** Flask App handles all ffmpeg-powered media processing jobs
- **Run:**  
- python main.py

---

### 4. Python Agent (Ollama Runner)
- A simple Ollama agent running locally, for making one request at a time, media edits in natural language
- **Run:**  
- python ollamarun.py

**Suggested Models (must have function calling/tools):**
- command-r7b:latest
- devstral:latest
- qwen3:latest
- phi4-mini:latest
- mistral-nemo:latest
- llama3.1:8b
- llama3.3:latest
- qwen2.5-coder:latest
- firefunction-v2:latest
- llama4:scout

---


## Running with Docker (Optional)

If you want everything to "just work" via Docker:

Build and run both back-end servers with Docker Compose (from repo root):

   docker-compose up --build

The following ports will be available:

Frontend (Vite): http://localhost:8080/
Node API server: http://localhost:8300/
Python FFmpeg backend: http://localhost:8200/

You can still use npm run dev/python main.py for local dev if you prefer.
Note: The Docker setup mounts local source code, so edits will live-reload in most setups.

---

## Roadmap Items

**June 3rd 2025**

1. Better Timeline editing, Get Render working
2. Dashboard Metrics / Run counts
3. Connector to CrewAI
4. MCP for some of the non-ffmpeg filters

---

## Usage

- Free for any use: personal, research, or commercial.
- **If you use this or build on top of it, a shout-out to [HYE Partners](https://www.hyepartners.com) is appreciated!**
- **If you fix bugs please submit PRs so everyone can benefit**

## License

Open use. Attribution requested, not required.

For issues, improvements, or collaboration, visit [www.hyepartners.com](https://www.hyepartners.com).

---