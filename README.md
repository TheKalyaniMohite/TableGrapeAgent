# TableGrape Agent

A web application for managing table grape farms (for table grapes eaten fresh, not wine grapes).

## Tech Stack

- **Frontend**: Next.js 14 (App Router) + TypeScript + Tailwind CSS
- **Backend**: FastAPI (Python) + SQLAlchemy + Pydantic
- **Database**: SQLite (file-based, stored in `/backend/tablegrape.db`)

## Prerequisites

- **Python 3.10+**
- **Node.js 18+** and npm
- **Windows** (instructions are for Windows)

## Setup Instructions

### Backend Setup

1. Navigate to the backend directory:
   ```powershell
   cd backend
   ```

2. Create a virtual environment:
   ```powershell
   python -m venv venv
   ```

3. Activate the virtual environment:
   ```powershell
   .\venv\Scripts\Activate.ps1
   ```
   (If you get an execution policy error, run: `Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser`)

4. Install dependencies:
   ```powershell
   pip install -r requirements.txt
   ```

5. Create a `.env` file in the `backend` directory:
   ```powershell
   copy .env.example .env
   ```
   Or manually create `.env` with:
   ```
   DATABASE_URL=sqlite:///./tablegrape.db
   FRONTEND_ORIGIN=http://localhost:3000
   OPENAI_API_KEY=your_api_key_here  # Optional: for AI Weekly Advisor
   OPENAI_MODEL=gpt-5.2  # Optional: model to use (default: gpt-5.2). Examples: gpt-5.2, gpt-4.1
   ```

6. Run the backend server:
   ```powershell
   uvicorn app.main:app --reload --port 8000
   ```

   The API will be available at `http://localhost:8000`
   - API docs: `http://localhost:8000/docs`
   - Health check: `http://localhost:8000/health`

### Frontend Setup

1. Open a new terminal and navigate to the frontend directory:
   ```powershell
   cd frontend
   ```

2. Install dependencies:
   ```powershell
   npm install
   ```

3. Run the development server:
   ```powershell
   npm run dev
   ```

   The frontend will be available at `http://localhost:3000`

## Usage

1. **Onboarding** (New users): When you first open the app, you'll be guided through a simple onboarding:
   - **Location Step**: Enter your farm location (Village/Town, District, State, Country)
   - Click "Find my location" to search and select from results
   - **Details Step**: Select grape variety and irrigation type
   - A default "Main Block" is created automatically
   - You'll be taken to the dashboard after completion
2. **Advanced Setup**: Visit `http://localhost:3000/setup` for advanced farm setup with manual coordinate entry
3. **Dashboard**: View today's plan and weather forecast
4. **Chat**: Placeholder page for AI chat (coming in Step 2)
5. **Scan**: Placeholder page for image scanning (coming in Step 3)

## Features

- **Farm Management**: Create farms with location (via city/state/country geocoding) and preferred language
- **Location Geocoding**: Search for locations by city, state, and country - coordinates are automatically resolved
- **Block Management**: Create multiple blocks per farm
- **Today's Plan**: Rule-based task generation based on weather and recent logs
- **Weather Forecast**: 7-day forecast using Open-Meteo API
- **Multi-language Support**: English, Hindi (हिंदी), and Spanish (Español)
- **Logging**: Support for scouting, irrigation, brix samples, and spray logs

## API Endpoints

- `GET /health` - Health check
- `GET /api/geocode?city=...&state=...&country=...&district=...&count=5` - Geocode location to coordinates
- `POST /api/farms` - Create farm
- `GET /api/farms/{farm_id}` - Get farm
- `POST /api/blocks` - Create block
- `GET /api/blocks?farm_id=...` - Get blocks
- `POST /api/logs/scouting` - Create scouting log
- `POST /api/logs/irrigation` - Create irrigation log
- `POST /api/logs/brix` - Create brix sample
- `POST /api/logs/spray` - Create spray log
- `GET /api/weather/forecast?lat=...&lon=...&days=7` - Get weather forecast
- `GET /api/plan/today?farm_id=...` - Get today's plan
- `POST /api/ai/weekly-advice?farm_id=...` - Get AI weekly advice (requires OPENAI_API_KEY)

## Database

The SQLite database file (`tablegrape.db`) is automatically created in the `backend` directory on first run. Tables are created automatically when the backend starts.

## Notes

- No authentication (single user mode)
- Farm ID is stored in browser localStorage
- Weather data is cached for 15 minutes
- Geocoding results are cached for 15 minutes
- AI Weekly Advisor advice is cached for 6 hours
- Location can be entered via city/state/country search or manually via coordinates
- AI Weekly Advisor: Set `OPENAI_API_KEY` in backend `.env` to enable AI-generated advice. Configure model with `OPENAI_MODEL` (default: `gpt-5.2`, examples: `gpt-5.2`, `gpt-4.1`). Falls back to rule-based advice if API key is missing or API fails.
- This is an MVP - AI features (chat and scan) are placeholders for future steps

## Troubleshooting

- **Backend won't start**: Make sure Python 3.10+ is installed and virtual environment is activated
- **Frontend won't start**: Make sure Node.js 18+ is installed and run `npm install`
- **Database errors**: Delete `backend/tablegrape.db` and restart the backend to recreate tables
- **CORS errors**: Make sure `FRONTEND_ORIGIN` in backend `.env` matches your frontend URL

