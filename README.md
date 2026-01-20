# Church Talent Tree Project

## How to Run Locally

### Prerequisites
- Node.js and npm
- Python 3.8+
- Git

### 1. Backend Setup (Django)

The backend uses Django and includes a SQLite database for local development.

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```

2. Create and activate a virtual environment (recommended):
   ```bash
   python3 -m venv venv
   # Linux/macOS
   source venv/bin/activate
   # Windows
   venv\Scripts\activate
   ```

3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

4. Apply database migrations:
   ```bash
   python3 manage.py migrate
   ```

5. Run the development server:
   ```bash
   python3 manage.py runserver
   ```
   The backend will be available at [http://127.0.0.1:8000/](http://127.0.0.1:8000/).

### 2. Frontend Setup (React + Vite)

The frontend is a React application built with Vite.

1. Open a new terminal and navigate to the frontend directory:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Run the development server:
   ```bash
   npm run dev
   ```
   The frontend will be available at [http://localhost:5173/](http://localhost:5173/).

### Notes

- The backend is configured to use SQLite by default locally.
- CORS is configured to allow all origins in `settings.py`, so the frontend should satisfy requests to the backend.
