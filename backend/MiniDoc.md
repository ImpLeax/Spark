# Spark API Mini Documentation

## Base URL
All API requests should be prefixed with:
`http://127.0.0.1:8000/api/v1/`

## Authentication (JWT)
This API uses JSON Web Tokens (JWT). For protected routes, you must include the Access Token in the HTTP Headers:
`Authorization: Bearer <your_access_token>`

> **Note:** Our Access Token contains custom claims. When you decode it on the frontend (e.g., using `jwt-decode`), you will instantly get the user's `profile_id`, `first_name`, and `last_name` without making extra requests.

---

## Endpoints

### 1. User Registration
Creates a new User, an empty Info record, and a basic Profile. Sends an activation email to the console.

* **URL:** `/user/register/`
* **Method:** `POST`
* **Auth Required:** No
* **Request Body Example:**
  ```json
  {
      "username": "username",
      "email": "email@spark.com",
      "password": "SuperSecretPassword123!",
      "first_name": "Name",
      "last_name": "Name",
      "surname": "Name",
      "location": "Kyiv",
      "gender_id": 1,
      "looking_for_id": 2
  }
  ```
* **Success Response (201 Created):**
  Returns the created user object data.

### 2. Account Activation
Activates the user's account. This is usually triggered by the user clicking the link sent to their email.

* **URL:** `/user/activate/<uidb64>/<token>/`
* **Method:** `GET`
* **Auth Required:** No
* **Success Response (200 OK):**
  ```json
  {
      "message": "Your account has been successfully activated! You can now log in."
  }
  ```
* **Unsuccess Response (400 Bad Request):**
  ```json
    {
        "error": "The link is invalid or has already been used."
    }
  ```

### 3. Login (Obtain Tokens)
Authenticates the user and returns Access and Refresh tokens.

* **URL:** `/user/login/`
* **Method:** `POST`
* **Auth Required:** No
* **Request Body:**
  *(Note: You can pass EITHER the `username` OR the `email` into the "username" field).*
  ```json
  {
      "username": "nazar@spark.com", 
      "password": "SuperSecretPassword123!"
  }
  ```
* **Success Response (200 OK):**
  ```json
  {
      "access": "eyJhbGciOiJIUzI1NiIsInR5cCI...",
      "refresh": "eyJhbGciOiJIUzI1NiIsInR5cCI..."
  }
  ```

### 4. Refresh Token
Gets a new Access Token when the current one expires (lasts 15 minutes). **Note:** This API rotates tokens, so it will return a NEW refresh token as well.

* **URL:** `/user/token/refresh/`
* **Method:** `POST`
* **Auth Required:** No
* **Request Body:**
  ```json
  {
      "refresh": "<your_current_refresh_token>"
  }
  ```
* **Success Response (200 OK):**
  ```json
  {
      "access": "<new_access_token>",
      "refresh": "<new_refresh_token>"
  }
  ```

