# Sahas Code Studio: Online Coding Platform

Welcome to **Sahas Code Studio**, an online platform designed to empower users to write, execute, and compete in coding challenges. This project combines an interactive coding environment, problem-solving space, and competitive battleground into a single, user-friendly application.

---

## Features

### 1. Coding Playground
- Interactive **code editor** supporting at least one compiled language.
- Write and execute code with **custom inputs**.
- View **output**, **error messages**, and performance metrics such as execution time and memory usage.

### 2. Coding Arena
- Solve pre-loaded coding challenges or **upload your own problems** with constraints and test cases.

### 3. Coding Battleground
- Participate in live **coding contests** with real-time leaderboards.
- Host and customize your own contests.

---

## Tech Stack

### Frontend
- **React** for dynamic user interfaces.
- **Monaco Editor** for an enhanced coding experience.

### Backend
- **Node.js** with Express for API development.
- **Docker** for secure, isolated code execution.
- **MongoDB** with Mongoose for database operations.

---

## Installation

### Prerequisites
- Install **Node.js** (latest LTS version).
- Install **Docker Desktop** and ensure it is running.

---

### Frontend Setup

1. Navigate to the frontend directory:
   ```bash
   cd sahas-code-studio
2. Install dependencies:

      ```bash
      npm install
      npm install @monaco-editor/react bootstrap react-resizable react-router-dom ws
3. Start the frontend server:

    ```bash
    npm start
### Backend Setup
1. Navigate to the backend directory:

    ```bash
    cd Backend
2. Install dependencies:

    ```bash
    npm install
    npm install express bodyparser dockerode tar tar-stream cors mongodb mongoose dotenv
3. Build the Docker image: From the root sahas folder, run:

    ```bash 
    docker build -t cpp-executor .
    
  Ensure the Docker container is running on Docker Desktop.

1. Start the backend server:

    ```bash
      npm start

## How It Works
### Coding Playground:

Write and execute code in an interactive editor.
View real-time outputs, errors, and performance metrics.
### Coding Arena:

Practice coding with pre-loaded problems or create your own.
### Coding Battleground:

Participate in live contests and view real-time leaderboards.
Host your own contests with custom settings.
