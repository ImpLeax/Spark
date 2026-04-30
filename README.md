# Spark - Dating Application 💖

<img width="1902" height="948" alt="image" src="https://github.com/user-attachments/assets/d2e3992e-7c9d-4283-8e62-9f512bb95ac2" />


## 📌 About the Project
Spark is a modern web-based dating application designed to connect people. This project was developed as a coursework assignment. It focuses on providing a secure, real-time interactive experience for users, utilizing a modern microservices-inspired architecture.

## ✨ Key Features
*   **Secure Authentication:** Implemented JWT (JSON Web Tokens) for robust user sessions and Cloudflare Turnstile for bot protection.
*   **Real-Time Chat:** Instant messaging between matched users utilizing WebSockets.
*   **User Profiles & Matching:** Customizable user profiles with photo uploads and preference settings.
*   **Geolocation Services:** Integrated with API for location-based matching and geocoding.
*   **Interactive UI:** Responsive and dynamic frontend built with React.

## 🛠 Tech Stack
**Frontend:**
*   React.js
*   Tailwind CSS

**Backend:**
*   Python & Django
*   Django REST Framework (DRF)
*   Django Channels (for WebSockets/Real-time chat)
*   PostgreSQL (with PostGIS) & Redis

**DevOps & Architecture:**
*   Docker & Docker Compose
*   Nginx (Reverse proxy & SSL)
*   Gunicorn & Uvicorn (ASGI server)

---

## 🚀 Getting Started (Local Development Setup)

We highly recommend running this project on a **Linux machine** (or via WSL for Windows users), as installing the necessary geospatial libraries (GeoDjango) for location matching is significantly easier on Linux.

### Prerequisites
Before you begin, ensure you have the following installed on your machine:
*   **Python (3.12+)** & **Node.js (18+)**
*   **Docker** & **Docker Compose**
*   **uv** package manager
*   **System Dependencies** (Required for GeoDjango). On Ubuntu/Debian, run:
    ```bash
    sudo apt-get update
    sudo apt-get install libpq-dev gcc gettext gdal-bin libgdal-dev libgeos-dev binutils
    ```

### 1. Clone and Configure
Clone the repository and set up your environment variables.
```bash
git clone https://github.com/ImpLeax/Spark.git
cd Spark
```

Create a `.env` file in the root directory. You can copy the variables below and replace the placeholders with your actual API keys:

```env
# ==========================================
# Django Core Settings
# ==========================================
SECRET_KEY=your_django_secret_key_here
DEBUG=True

# ==========================================
# URLs & Paths
# ==========================================
FRONTEND_URL=http://localhost:5173/
RESET_PASSWORD_PATH=reset-password/
CHANGE_EMAIL_PATH=confirm-email/

# ==========================================
# Security & CORS
# ==========================================
CORS_ALLOWED_ORIGINS=http://localhost:5173,http://localhost:8000
CSRF_TRUSTED_ORIGINS=http://localhost:5173,http://localhost:8000
ALLOWED_HOSTS=localhost,127.0.0.1,backend

# ==========================================
# Database & Redis (Docker config)
# ==========================================
POSTGRES_DB=spark
POSTGRES_USER=root
POSTGRES_PASSWORD=your_secure_db_password
POSTGRES_HOST=127.0.0.1
REDIS_HOST=127.0.0.1

# ==========================================
# Frontend (Vite) Environment Variables
# ==========================================
VITE_BACKEND_URL=http://127.0.0.1:8000
VITE_GOOGLE_CLIENT_ID=your_google_client_id_here.apps.googleusercontent.com
VITE_KLIPY_API_KEY=your_klipy_api_key_here
VITE_TURNSTILE_SITE_KEY=your_turnstile_site_key_here

# ==========================================
# Third-Party APIs & Services
# ==========================================
TURNSTILE_SECRET_KEY=your_turnstile_secret_key_here

# ==========================================
# Email Configuration (SMTP)
# ==========================================
EMAIL_HOST_USER=your_project_email@gmail.com
EMAIL_HOST_PASSWORD=your_app_specific_password
DEFAULT_FROM_EMAIL=your_project_email@gmail.com
```

### 2. Start Infrastructure (Database & Redis)
Start the isolated PostgreSQL (PostGIS) and Redis containers using the test environment compose file. This exposes ports `5432` and `6379` to your local machine.
```bash
docker-compose -f docker-compose.test.yml up -d
```

### 3. Set Up and Run the Backend
Navigate to the backend directory. Thanks to `uv`, you don't need to manually create a virtual environment or run pip install — it handles dependencies seamlessly during execution!

```bash
cd backend

# Apply database migrations
uv run manage.py migrate

# Load test data (optional but recommended for development)
uv run manage.py loaddata data.json

# Start the ASGI server using Gunicorn with Uvicorn workers
uv run gunicorn spark.asgi:application -k uvicorn.workers.UvicornWorker --workers 4 --bind 0.0.0.0:8000
```
*(Note: We recommend using 4 workers for local development. You can increase this for stress testing).*

### 4. Set Up and Run the Frontend
Open a new terminal window, navigate to the frontend directory, install dependencies, and start the Vite development server:
```bash
cd frontend
npm install
npm run dev
```

**The application is now up and running!**
*   **Frontend UI:** `http://localhost:5173/`
*   **Backend API:** `http://localhost:8000/`

---

## 🐳 Production Deployment

If you want to run the full production build (Backend, Frontend, and Nginx reverse proxy all containerized), simply use the main docker-compose file:
```bash
docker-compose up --build -d
```

## 👥 Team & Contributors
This project was built collaboratively by a team of 3 developers:

*   **TV-42 Bondarchuk Volodymyr** - *Auth & Profiles Backend/Frontend & DevOps* - Implemented authentication and user profiles and set up the network infrastructure, Dockerization, and Nginx setup. (GitHub: [@ImpLeax](https://github.com/ImpLeax))
*   **TV-43 Naidiuk Maksym** - *Recommendation Algorithm Backend/Frontend* - Implemented the recommendation algorithm on the backend and the recommendation feed on the frontend. (GitHub: [@naiduik-maxim](https://github.com/naiduik-maxim))
*   **TV-42 Kholonivets Nazar** - *Chats Backend/Frontend* - Implemented a real-time chat system. (GitHub: [@TV42Nazar](https://github.com/TV42Nazar))
