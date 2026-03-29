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
Creates a new User, an empty Info record, and a basic Profile. Sends an activation email to the console. Validates age (18+) and requires at least 2 interests.

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
      "birth_date": "2000-01-01",
      "location": "Kyiv",
      "interests": [1, 2],
      "gender_id": 1,
      "looking_for_id": 2
  }
  ```
* **Success Response (201 Created):** Returns the created user object data.
* **Error Response (400 Bad Request):** Returns validation errors (e.g., under 18, less than 2 interests, invalid ID).

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
* **Error Response (400 Bad Request):**
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
      "username": "email@spark.com", 
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
Gets a new Access Token when the current one expires (lasts 15 minutes). **Note:** This API rotates tokens, returning a NEW refresh token as well.

* **URL:** `/user/token/refresh/`
* **Method:** `POST`
* **Auth Required:** No
* **Request Body:**
  ```json
  {
      "refresh": "<your_current_refresh_token>"
  }
  ```

---

### 5. Get My Profile
Retrieves the full profile information of the currently authenticated user based on their JWT token. Prevents IDOR vulnerabilities.

* **URL:** `/user/profile/`
* **Method:** `GET`
* **Auth Required:** **Yes**
* **Success Response (200 OK):**
  ```json
  {
      "id": 1,
      "first_name": "Name",
      "last_name": "Name",
      "surname": "Name",
      "location": "Kyiv",
      "gender": "Male",
      "looking_for": "Female",
      "avatar": null,
      "additional_info": {
          "birth_date": "2000-01-01",
          "height": "",
          "weight": "",
          "bio": "",
          "education": ""
      },
      "interests": ["Sport", "Music"]
  }
  ```

### 6. Get Genders Directory
Retrieves a list of all available genders. Used to populate dropdowns during registration.

* **URL:** `/user/genders/`
* **Method:** `GET`
* **Auth Required:** No
* **Success Response (200 OK):**
  ```json
  [
      { "id": 1, "name": "Male" },
      { "id": 2, "name": "Female" }
  ]
  ```

### 7. Get Interests Directory (Paginated)
Retrieves a paginated list of available interests. Used to populate multiple-choice fields during registration.

* **URL:** `/user/interests/`
* **Method:** `GET`
* **Auth Required:** No
* **Query Parameters (Optional):**
  * `page`: Page number (default: 1)
  * `page_size`: Number of items per page (default: 50, max: 100). Example: `?page=2&page_size=20`
* **Success Response (200 OK):**
  ```json
  {
      "count": 150,
      "next": "[http://127.0.0.1:8000/api/v1/user/interests/?page=2](http://127.0.0.1:8000/api/v1/user/interests/?page=2)",
      "previous": null,
      "results": [
          { "id": 1, "name": "Sport" },
          { "id": 2, "name": "Music" }
      ]
  }
  ```