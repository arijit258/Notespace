# NoteSpace

A modern, collaborative note-taking application built with FastAPI and Next.js. NoteSpace allows users to create, organize, and share notes with real-time collaboration features, version history, and activity tracking.

![NoteSpace](https://img.shields.io/badge/NoteSpace-v1.0.0-6366f1)
![FastAPI](https://img.shields.io/badge/FastAPI-0.100+-009688)
![Next.js](https://img.shields.io/badge/Next.js-15+-000000)
![License](https://img.shields.io/badge/License-MIT-green)

---

## Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Installation](#installation)
  - [Prerequisites](#prerequisites)
  - [Backend Setup](#backend-setup)
  - [Frontend Setup](#frontend-setup)
- [API Documentation](#api-documentation)
- [Usage](#usage)
- [Contributing](#contributing)
- [License](#license)

---

## Features

### Core Features

- **User Authentication**
  - Secure user registration and login
  - JWT-based authentication
  - Password hashing with bcrypt

- **Note Management**
  - Create, read, update, and delete notes
  - Rich text content support
  - Search notes by title or content

- **Collaboration**
  - Share notes with other users
  - Role-based access control (Viewer/Editor)
  - Real-time collaborator management

- **Version History**
  - Automatic version tracking on every edit
  - View previous versions
  - Restore notes to any previous version

- **Activity Logging**
  - Track all note activities (create, view, edit, delete, share)
  - View activity timeline for each note
  - User-specific activity history

### UI/UX Features

- **Modern Design**
  - Clean, minimalist interface
  - Gradient accents and glassmorphism effects
  - Responsive design for all devices

- **Smooth Animations**
  - Fade-in and scale animations
  - Hover effects on cards and buttons
  - Staggered loading animations

- **User-Friendly Experience**
  - Intuitive navigation
  - Loading skeletons for better perceived performance
  - Clear error messages and feedback

---

## Tech Stack

### Backend
| Technology | Purpose |
|------------|---------|
| **FastAPI** | Web framework for building APIs |
| **SQLAlchemy** | ORM for database operations |
| **SQLite** | Database (easily swappable to PostgreSQL) |
| **Alembic** | Database migrations |
| **Pydantic** | Data validation and serialization |
| **JWT** | Token-based authentication |
| **Bcrypt** | Password hashing |

### Frontend
| Technology | Purpose |
|------------|---------|
| **Next.js 15** | React framework with App Router |
| **TypeScript** | Type-safe JavaScript |
| **Tailwind CSS** | Utility-first CSS framework |
| **React Context** | State management for auth |

---

## Project Structure

```
notesapi_project/
├── app/                          # Backend (FastAPI)
│   ├── api/
│   │   ├── routes/
│   │   │   ├── auth.py          # Authentication endpoints
│   │   │   ├── notes.py         # Notes CRUD endpoints
│   │   │   └── users.py         # User management endpoints
│   │   └── router.py            # API router configuration
│   ├── core/
│   │   ├── config.py            # Application configuration
│   │   ├── deps.py              # Dependency injection
│   │   └── security.py          # JWT and password utilities
│   ├── crud/
│   │   ├── activity.py          # Activity log operations
│   │   ├── collaborator.py      # Collaboration operations
│   │   ├── note.py              # Note CRUD operations
│   │   └── user.py              # User operations
│   ├── db/
│   │   ├── base.py              # SQLAlchemy base
│   │   ├── init_db.py           # Database initialization
│   │   └── session.py           # Database session management
│   ├── models/
│   │   ├── activity_log.py      # Activity log model
│   │   ├── collaborator.py      # Collaborator model
│   │   ├── note.py              # Note model
│   │   ├── note_version.py      # Note version model
│   │   └── user.py              # User model
│   ├── schemas/
│   │   ├── activity.py          # Activity schemas
│   │   ├── auth.py              # Authentication schemas
│   │   ├── collaborator.py      # Collaborator schemas
│   │   ├── note.py              # Note schemas
│   │   ├── user.py              # User schemas
│   │   └── version.py           # Version schemas
│   └── main.py                  # FastAPI application entry
├── frontend/                     # Frontend (Next.js)
│   ├── src/
│   │   ├── app/
│   │   │   ├── login/           # Login page
│   │   │   ├── register/        # Registration page
│   │   │   ├── notes/
│   │   │   │   ├── new/         # Create note page
│   │   │   │   ├── view/        # View note page
│   │   │   │   ├── edit/        # Edit note page
│   │   │   │   └── page.tsx     # Notes dashboard
│   │   │   ├── globals.css      # Global styles & animations
│   │   │   ├── layout.tsx       # Root layout
│   │   │   └── page.tsx         # Homepage
│   │   ├── components/
│   │   │   ├── Navbar.tsx       # Navigation bar
│   │   │   └── NoteCard.tsx     # Note card component
│   │   ├── contexts/
│   │   │   └── AuthContext.tsx  # Authentication context
│   │   ├── lib/
│   │   │   └── api.ts           # API client
│   │   └── types/
│   │       └── index.ts         # TypeScript types
│   ├── package.json
│   └── next.config.ts
├── alembic/                      # Database migrations
├── tests/                        # Backend tests
└── README.md
```

---

## Installation

### Prerequisites

- Python 3.10+
- Node.js 18+
- npm or yarn

### Backend Setup

1. **Navigate to the project directory**
   ```bash
   cd notesapi_project
   ```

2. **Create a virtual environment**
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. **Install dependencies**
   ```bash
   pip install -r requirements.txt
   ```

4. **Initialize the database**
   ```bash
   alembic upgrade head
   ```

5. **Run the backend server**
   ```bash
   uvicorn app.main:app --reload
   ```

   The API will be available at `http://localhost:8000`

### Frontend Setup

1. **Navigate to the frontend directory**
   ```bash
   cd notesapi_project/frontend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Run the development server**
   ```bash
   npm run dev
   ```

   The frontend will be available at `http://localhost:3000`

---

## API Documentation

Once the backend is running, you can access the interactive API documentation:

- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc

### API Endpoints Overview

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/auth/register` | Register a new user |
| `POST` | `/auth/login` | Login and get access token |
| `GET` | `/users/me` | Get current user info |
| `GET` | `/users/` | List all users |
| `GET` | `/notes/` | List user's notes |
| `POST` | `/notes/` | Create a new note |
| `GET` | `/notes/{id}` | Get a specific note |
| `PUT` | `/notes/{id}` | Update a note |
| `DELETE` | `/notes/{id}` | Delete a note |
| `GET` | `/notes/shared` | List notes shared with user |
| `POST` | `/notes/{id}/share` | Share a note |
| `GET` | `/notes/{id}/collaborators` | List collaborators |
| `DELETE` | `/notes/{id}/share/{user_id}` | Remove collaborator |
| `GET` | `/notes/{id}/versions` | List note versions |
| `GET` | `/notes/{id}/activity` | Get note activity log |

---

## Usage

### Getting Started

1. **Register an account** - Create a new account with your email and password
2. **Create notes** - Click "New Note" to create your first note
3. **Organize** - Use the search feature to find notes quickly
4. **Collaborate** - Share notes with other users as Viewers or Editors
5. **Track changes** - View the activity log to see all changes made to a note

### Sharing Notes

1. Open a note you own
2. Click the "Share" button
3. Select a user from the dropdown
4. Choose their permission level:
   - **Viewer**: Can only read the note
   - **Editor**: Can read and edit the note
5. Click "Share Note"

### Version History

- Every time a note is edited, a new version is created automatically
- View the version number in the note header
- Access the activity log to see all changes

---

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## Author

**Matrix Agent**

---

## Acknowledgments

- [FastAPI](https://fastapi.tiangolo.com/) - Modern Python web framework
- [Next.js](https://nextjs.org/) - React framework for production
- [Tailwind CSS](https://tailwindcss.com/) - Utility-first CSS framework
- [Heroicons](https://heroicons.com/) - Beautiful hand-crafted SVG icons
