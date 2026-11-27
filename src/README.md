# Mergington High School Activities API

A super simple FastAPI application that allows students to view and sign up for extracurricular activities.

## Features

- View all available extracurricular activities
- Teacher-only student registration and unregistration
- Public activity and participant lists

## Getting Started

1. Install the dependencies:

   ```
   pip install fastapi uvicorn
   ```

2. Configure the teacher account in the environment. Keep these values out of
   source control:

   ```
   export TEACHER_USERNAME=teacher
   export TEACHER_PASSWORD='choose-a-strong-password'
   ```

3. Run the application:

   ```
   uvicorn app:app --app-dir src --reload
   ```

   Set `ENVIRONMENT=production` when serving over HTTPS so the session cookie
   uses the `Secure` attribute. The app keeps sessions in memory for one hour;
   teachers must log in again after a server restart.

4. Open your browser and go to:
   - API documentation: http://localhost:8000/docs
   - Alternative documentation: http://localhost:8000/redoc

## API Endpoints

| Method | Endpoint                                                          | Description                                                        |
| ------ | ----------------------------------------------------------------- | ------------------------------------------------------------------ |
| GET    | `/activities`                                                     | Public activity details and participant lists                      |
| POST   | `/auth/login`                                                     | Sign in with the configured teacher username and password          |
| GET    | `/auth/session`                                                   | Check whether the current browser has an active teacher session     |
| POST   | `/auth/logout`                                                    | End the current teacher session                                     |
| POST   | `/activities/{activity_name}/signup?email=student@mergington.edu` | Register a student (teacher session required)                       |
| DELETE | `/activities/{activity_name}/unregister?email=student@mergington.edu` | Unregister a student (teacher session required)                   |

## Data Model

The application uses a simple data model with meaningful identifiers:

1. **Activities** - Uses activity name as identifier:

   - Description
   - Schedule
   - Maximum number of participants allowed
   - List of student emails who are signed up

2. **Students** - Uses email as identifier:
   - Name
   - Grade level

All data is stored in memory, which means data will be reset when the server restarts.
