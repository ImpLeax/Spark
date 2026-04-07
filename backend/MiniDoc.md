# Spark API Mini Documentation

## Base URL
All API requests should be prefixed with:
`http://127.0.0.1:8000/api/v1/`

## Authentication (JWT) & Security
This API uses JSON Web Tokens (JWT). For protected routes, include the Access Token in the HTTP Headers:
`Authorization: Bearer <your_access_token>`

> **Note:** Our Access Token contains custom claims. Decode it on the frontend (e.g., using `jwt-decode`) to instantly get the user's `profile_id`, `first_name`, and `last_name`.

> **⚠️ Rate Limiting (Throttling):** > To prevent brute-force attacks, authentication endpoints (Login, Registration, Password Reset) are strictly rate-limited. If the limit is exceeded, the API will return a `429 Too Many Requests` status code. The frontend should handle this by reading the `Retry-After` header and displaying a countdown timer to the user.

---

## Auth & Account Endpoints

### 1. User Registration
Creates a new User, Profile, and Gallery. Validates age (18+) and requires 2-4 photos and at least 2 interests.
* **URL:** `user/register/`
* **Method:** `POST`
* **Auth Required:** No
* **Content-Type:** `multipart/form-data` *(Important: Do not send JSON)*
* **FormData Example:**
  ```javascript
  username: "username"
  email: "email@spark.com"
  password: "SuperSecretPassword123!"
  first_name: "Name"
  last_name: "Name"
  surname: "Name"
  birth_date: "2000-01-01"
  longitude: 50.4501
  latitude: 30.5234
  gender: 1
  looking_for: 2
  intention: 1
  interests: 1     // append multiple times for multiple interests
  interests: 2
  photos: [file1]  // input type="file", min: 2, max: 4
  photos: [file2]
  ```
* **Success Response (201 Created):** Returns the created user object data.

### 2. Account Activation
Activates the user's account via email link.
* **URL:** `user/activate/<uidb64>/<token>/`
* **Method:** `GET`
* **Auth Required:** No
* **Success Response (200 OK):** `{"message": "Your account has been successfully activated! You can now log in."}`

### 3. Login (Obtain Tokens)
* **URL:** `user/login/`
* **Method:** `POST`
* **Auth Required:** No
* **Request Body (JSON):** `{"username": "email@spark.com", "password": "SecretPassword!"}`
* **Success Response (200 OK):** `{"access": "eyJhbGci...", "refresh": "eyJhbGci..."}`

### 4. Refresh Token
* **URL:** `user/token/refresh/`
* **Method:** `POST`
* **Auth Required:** No
* **Request Body (JSON):** `{"refresh": "<your_current_refresh_token>"}`
* **Success Response (200 OK):** Returns NEW `access` and NEW `refresh` tokens.

### 4.5. Logout (Blacklist Token)
Invalidates the user's refresh token so it can no longer be used. The frontend should also clear tokens from local storage.
* **URL:** `user/logout/`
* **Method:** `POST`
* **Auth Required:** **Yes**
* **Request Body (JSON):** `{"refresh": "<your_current_refresh_token>"}`
* **Success Response (205 Reset Content / 200 OK):** `{"message": "Successfully logged out."}`

### 4.6. Change Password
Allows an authenticated user to change their password.
* **URL:** `user/password/change/`
* **Method:** `PUT`
* **Auth Required:** **Yes**
* **Request Body (JSON):** 
* ```json
  {
      "old_password": "CurrentPassword123!",
      "new_password": "NewStrongPassword456!",
      "new_password_confirm": "NewStrongPassword456!"
  }
  ```
* **Success Response (200 OK):** `{"message": "Your password has been successfully changed."}`
> **Important for Frontend:** After receiving a `200 OK`, the frontend **MUST** call the Logout endpoint (to blacklist the old refresh token), clear local storage, and redirect the user to the login screen to re-authenticate with the new password.

### 4.7. Delete Account
Permanently deletes the user's account and all associated data (profile, photos, settings). Requires password confirmation.
* **URL:** `user/delete/`
* **Method:** `DELETE`
* **Auth Required:** **Yes**
* **Request Body (JSON):** 
* ```json
  {
      "password": "MySecretPassword123!"
  }
  ```  
* **Success Response (204 No Content):** Returns an empty body or `{"message": "Your account and all associated data have been successfully deleted."}`
> **Important for Frontend:** Frontend should clear local storage and redirect to the signup/login screen.

### 4.8. Password Reset Request
Initiates the password reset process by sending an email with a unique token to the user.
* **URL:** `user/password/reset/`
* **Method:** `POST`
* **Auth Required:** No
* **Request Body (JSON):**
  ```json
  {
      "email": "user@spark.com"
  }
  ```
* **Success Response (200 OK):** `{"message": "If this email address is registered, we have sent password reset instructions to it."}` *(Returns 200 even if the email does not exist to prevent enumeration).*

### 4.9. Password Reset Confirm
Sets a new password using the token and uid provided via the email link.
* **URL:** `user/password/reset/confirm/`
* **Method:** `POST`
* **Auth Required:** No
* **Request Body (JSON):**
  ```json
  {
      "uidb64": "...",
      "token": "...",
      "new_password": "NewPassword123!",
      "new_password_confirm": "NewPassword123!"
  }
  ```
* **Success Response (200 OK):** `{"message": "Your password has been successfully changed. You can now log in."}`

### 4.10. Change Email Request
Initiates the email change process by sending a confirmation link to the **new** email address. The email is NOT updated in the database yet.
* **URL:** `user/email/change/`
* **Method:** `POST`
* **Auth Required:** **Yes**
* **Request Body (JSON):**
  ```json
  {
      "new_email": "new_email@spark.com",
      "password": "MySecretPassword123!"
  }
  ```
* **Success Response (200 OK):** `{"message": "An email containing a confirmation link has been sent to your new address."}`

### 4.11. Change Email Confirm
Confirms and applies the new email address using the secure token from the email link.
* **URL:** `user/email/change/confirm/`
* **Method:** `POST`
* **Auth Required:** No
* **Request Body (JSON):**
  ```json
  {
      "token": "..."
  }
  ```
* **Success Response (200 OK):** `{"message": "Your email address has been successfully updated."}`
> **Important for Frontend:** If the user is currently logged in, you may need to log them out or update their local state to reflect the new email.

### 4.12. Google OAuth Authentication
Handles login or partial registration via Google.
* **URL:** `user/auth/google/`
* **Method:** `POST`
* **Auth Required:** No
* **Request Body (JSON):** 
  ```json
    {
        "access_token": "ya29.a0AfB_byC..." // Obtained from Google on frontend
    }
    ```
* **Success Response - Path A (User Exists) [200 OK]:** Returns the JWT tokens.
  ```json
  {
      "status": "login",
      "message": "Login successful.",
      "tokens": {
          "access": "eyJhb...",
          "refresh": "eyJhb..."
      }
  }
  ```
* **Success Response - Path B (New User) [200 OK]:** Returns user info to pre-fill the registration form.
  ```json
  {
      "status": "needs_registration",
      "message": "Account not found. Please complete registration.",
      "google_data": {
          "email": "user@gmail.com",
          "first_name": "John",
          "last_name": "Doe"
      }
  }
  ```
  > **Important for Frontend (Path B):** Route the user to the Signup screen. Pre-fill the email and name using `google_data`. Require the user to add age, gender, photos, and a password, then submit to the standard `/user/register/` endpoint.

---

## Profile Management

### 5. Get My Profile
Retrieves full profile info of the currently authenticated user.
* **URL:** `user/profile/`
* **Method:** `GET`
* **Auth Required:** **Yes**
* **Success Response (200 OK):**
  ```json
  {
      "id": 1,
      "avatar": null,
      "first_name": "Name",
      "last_name": "Name",
      "surname": "Name",
      "location": "SRID=4326;POINT (30.5234 50.4501)",
      "gender": "male",
      "looking_for": "female",
      "intention": {
          "id": 1,
          "name": "A long-lasting, strong relationship."
      },
      "additional_info": {
          "profile": 1,
          "birth_date": "2000-01-01",
          "height": "",
          "weight": "",
          "bio": "",
          "education": ""
      },
      "interests": [
          {
              "id": 1,
              "name": "Gym"
          },
          {
              "id": 2,
              "name": "Programming"
          }
      ]
  }
  ```
  
### 5.1. Update My Profile
Updates basic profile info and additional info (height, bio, etc.). You can send partial data using `PATCH`.
* **URL:** `user/profile/`
* **Method:** `PATCH` / `PUT`
* **Auth Required:** **Yes**
* **Request Body (JSON):** Flat structure (no nested objects required). Coordinates will be automatically converted to a GeoDjango `Point`.
  ```json
  {
      "first_name": "New Name",
      "bio": "Updated bio text",
      "height": 185,
      "weight": 80,
      "latitude": 50.4501,
      "longitude": 30.5234,
      "intention_id": 2
  }
  ```
* **Success Response (200 OK):** Returns the updated profile object.

### 5.2. Sync Interests
Completely replaces the user's current interests with the provided list.
* **URL:** `user/profile/interests/`
* **Method:** `PATCH` / `PUT`
* **Auth Required:** **Yes**
* **Request Body (JSON):** Must contain between 2 and 100 unique interest IDs.
  ```json
  {
      "interest_ids": [2, 5, 12, 18]
  }
  ```
* **Success Response (200 OK):** Returns the updated profile object with the new interests list.


### 6. Manage Avatar
Upload, replace, or delete the profile avatar.
* **URL:** `user/profile/avatar/`
* **Auth Required:** **Yes**
* **Methods:**
  * `PUT` / `POST` (Content-Type: `multipart/form-data`): Send `avatar: [file]` to upload/replace. Returns `200 OK`.
  * `DELETE`: Deletes the current avatar (sets to null). Returns `200 OK`.

### 7. Manage Gallery (Photos)
Manage the profile's photo gallery (limit: 2 to 4 photos).
* **URL:** `user/profile/gallery/`
* **Auth Required:** **Yes**
* **Methods:**
  * `GET`: Retrieves list of photos.
    ```json
    [ {"id": 15, "photo": "http://.../media/.../img1.jpg"} ]
    ```
  * `POST` (Content-Type: `multipart/form-data`): Send `photos: [file]` to add photos. Enforces max limit (4).

### 8. Get user's Gallery (Photos)
Get a list of links to photos in a user's gallery.
* **URL:** `user/profile/gallery/<id>/`
* **Auth Required:** **Yes**
* **Method:`GET`**
  ```json
    [
        {
            "id": 5,
            "photo": "http://127.0.0.1:8000/media/users/user_3/photos/2717085.jpeg"
        },
        {
            "id": 6,
            "photo": "http://127.0.0.1:8000/media/users/user_3/photos/2717085_SlqLW0P.jpeg"
        }
    ]
  ```


### 9. Delete Gallery Photo
Delete a specific photo by its ID. Enforces min limit (2).
* **URL:** `user/profile/gallery/<id>/`
* **Method:** `DELETE`
* **Auth Required:** **Yes**
* **Success Response (200 OK):** `{"message": "Photo successfully deleted."}`

### 10. Manage Search Settings
View or update the matching filters (distance and age range).
* **URL:** `user/settings/`
* **Auth Required:** **Yes**
* **Methods:**
  * **`GET` (Retrieve Settings):**
    Returns the settings in a frontend-friendly format.
    ```json
    {
        "search_distance": 50,
        "age_range": {
            "min": 18,
            "max": 50
        }
    }
    ```
  * **`PATCH` / `PUT` (Update Settings):**
    Send `min_age` and `max_age` as separate integers. The backend will automatically validate and convert them to a database range.
    ```json
    {
        "search_distance": 25,
        "min_age": 20,
        "max_age": 35
    }
    ```
* **Success Response (200 OK):** Returns the updated settings.


---

## Directories (For Registration Forms)

### 11. Get Genders
* **URL:** `user/genders/`
* **Method:** `GET`
* **Success Response:** `[ {"id": 1, "name": "Male"} ]`

### 12. Get Intentions
* **URL:** `user/intentions/`
* **Method:** `GET`
* **Success Response:** `[ {"id": 1, "name": "Serious relationships"} ]`

### 13. Get Interests (Paginated)
* **URL:** `user/interests/`
* **Method:** `GET`
* **Query Params:** `?page=1&page_size=50`
* **Success Response:** `{"count": 150, "next": "...", "previous": null, "results": [ {"id": 1, "name": "Sport"} ]}`


## Recommendation & Feed Endpoints

### 14. Get Recommendations (The Feed)
Retrieves a paginated list of matching profiles for the authenticated user. The algorithm automatically excludes already swiped users, filters by user settings (gender, age range, max distance), and orders the results by a relevance score (shared interests), distance, and last login time.
* **URL:** `recommendation/list/`
* **Method:** `GET`
* **Auth Required:** **Yes**
* **Query Params:** `?page=1&size=10` *(Default size is 10, max is 20)*
* **Success Response (200 OK):**
  ```json
  {
      "count": 45,
      "next": "http://127.0.0.1:8000/api/v1/recommendation/list/?page=2",
      "previous": null,
      "results": [
          {
              "user_id": 14,
              "username": "olena_spark",
              "first_name": "Olena",
              "age": 22,
              "bio": "Love hiking and coffee.",
              "avatar": "http://127.0.0.1:8000/media/avatars/olena.jpg",
              "distance_km": 4.2
          },
          {
              "user_id": 27,
              "username": "max_dev",
              "first_name": "Max",
              "age": 25,
              "bio": "Software engineer looking for meaningful connections.",
              "avatar": null,
              "distance_km": 12.5
          }
      ]
  }
  ```

### 15. Swipe (Like or Pass)
Records a user's action (swipe right/like or swipe left/pass) on another profile. 
* **URL:** `recommendation/swipe/`
* **Method:** `POST`
* **Auth Required:** **Yes**
* **Request Body (JSON):**
  ```json
  {
      "receiver": 14,
      "is_like": true
  }
  ```
  *(Set `is_like: false` for a left swipe/pass)*
* **Success Response (201 Created):** Returns the action details along with an `is_match` boolean.
  ```json
  {
      "is_like": true,
      "receiver": 14,
      "is_match": true
  }
  ```
> **Important for Frontend:** Always check the `is_match` boolean in the response when sending a "Like" (`is_like: true`). If `is_match` comes back as `true`, it means the feelings are mutual! You should instantly interrupt the feed and show a "It's a Match!" celebration modal before letting the user continue swiping.