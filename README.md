# **EventHorizonAPI : Event Management System API Documentation**

The **Event Management System API** is a robust backend service designed for managing users, events, and their roles within an organization. It supports  **role-based access control (RBAC)** , secure authentication, and advanced input validation, enabling attendees, organizers, and co-organizers to efficiently manage events while ensuring permissions and data integrity.

---

## **Features**

### **1. User Management**

* **Sign-Up** : Register new users with hashed passwords for enhanced security.
* **Sign-In** : Authenticate users via JWT tokens.
* **Role Management** : Dynamically assign roles (e.g., attendee, organizer, co-organizer).

### **2. Event Management**

* **Create Events** : Allow organizers to create events with details such as name, description, date, price, and capacity.
* **Browse Events** : Enable attendees to view available events.
* **Assign Co-Organizers** : Allow organizers to delegate event management responsibilities to co-organizers.
* **Remove Co-Organizers** : Enable organizers to revoke co-organizer roles.
* **Cancel Events** : Cancel events and update associated user roles.
* **Delete Events** : Permanently delete events and reset associated roles.

### **3. Sales Reporting**

* Retrieve event sales data, including tickets sold and total revenue generated.

### **4. Security**

* Password hashing with `bcrypt`.
* JWT-based authentication with customizable expiration times.
* Token blacklisting during logout to prevent reuse.

---

## **Technologies Used**

* **Node.js** : JavaScript runtime for server-side development.
* **Express.js** : Framework for building RESTful APIs.
* **MongoDB** : Database for storing user and event data.
* **Mongoose** : ODM for MongoDB.
* **Zod** : Input validation library.
* **JWT** : Token-based authentication.
* **bcrypt** : Password hashing for secure storage.
* **dotenv** : Manage environment variables.

---

## **Installation**

1. **Clone the Repository** :

```bash
   https://github.com/HiLakshya/EventHorizonAPI.git
   cd EventHorizonAPI
```

1. **Install Dependencies** :

```bash
   npm install
```

1. **Set Up Environment Variables** :
   Create a `.env` file with the following details:

```env
    MONGO_URL=
    bcryptCost=10
    JWT_SECRET=your_secret_key_here
    BLACKLIST_WIPE_INTERVAL_MINUTES=1440
    TOKEN_EXPIRY_TIME_IN_MINUTES=1800

```

1. **Run the Application** :

```bash
   node index.js
```

---

## **API Endpoints Documentation**

The following sections detail the API endpoints, their purposes, required headers, and example responses.

---

### **1. Guest Routes**

#### **1.1 User Sign-Up**

* **Method** : `POST`
* **Endpoint** : `/signup`
* **Description** : Registers a new user with the default role of `Attendee`.

**Headers:**

| Key      | Value                                       |
| -------- | ------------------------------------------- |
| username | User's username (string, 5-30 characters).  |
| password | User's password (string, 5-100 characters). |

**Responses:**

| Status Code | Description                               |
| ----------- | ----------------------------------------- |
| 201         | User created successfully.                |
| 400         | Invalid input or username already exists. |
| 500         | Internal server error.                    |

 **Example Response** :

```json
{
  "message": "User created successfully with role 'Attendee'"
}
```

---

#### **1.2 Browse Events**

* **Method** : `GET`
* **Endpoint** : `/browse_events`
* **Description** : Retrieves a list of available events.

**Responses:**

| Status Code | Description                    |
| ----------- | ------------------------------ |
| 200         | Successfully retrieved events. |
| 500         | Internal server error.         |

 **Example Response** :

```json
[
  {
    "name": "Tech Conference 2024",
    "price": 150,
    "date": "2024-12-10"
  },
  {
    "name": "Music Fest",
    "price": 200,
    "date": "2024-12-15"
  }
]
```

---

### **2. Attendee Routes**

#### **2.1 User Login**

* **Method** : `POST`
* **Endpoint** : `/signin`
* **Description** : Authenticates a user and generates a JWT token.

**Headers:**

| Key      | Value            |
| -------- | ---------------- |
| username | User's username. |
| password | User's password. |

**Responses:**

| Status Code | Description                   |
| ----------- | ----------------------------- |
| 200         | Login successful.             |
| 400         | Missing username or password. |
| 401         | Invalid username or password. |
| 500         | Internal server error.        |

 **Example Response** :

```json
{
  "message": "Login successful",
  "token": "<JWT_TOKEN>"
}
```

---

#### **2.2 Browse Events (Authenticated Access)**

* **Method** : `GET`
* **Endpoint** : `/browse_events`
* **Description** : Retrieve a list of available events for authenticated users.

**Headers:**

| Key           | Value                   |
| ------------- | ----------------------- |
| Authorization | Bearer `<JWT_TOKEN>`. |

**Responses:**

| Status Code | Description                    |
| ----------- | ------------------------------ |
| 200         | Successfully retrieved events. |
| 500         | Internal server error.         |

---

#### **2.3 Purchase Tickets**

* **Method** : `POST`
* **Endpoint** : `/purchase_tickets`
* **Description** : Allows attendees to purchase tickets for events.

**Headers:**

| Key           | Value                         |
| ------------- | ----------------------------- |
| Authorization | Bearer `<JWT_TOKEN>`.       |
| eventid       | The ID of the event (string). |

**Responses:**

| Status Code | Description                                |
| ----------- | ------------------------------------------ |
| 200         | Ticket purchased successfully.             |
| 400         | Event sold out or user already registered. |
| 404         | Event not found.                           |
| 500         | Internal server error.                     |

 **Example Response** :

```json
{
  "message": "Ticket purchased successfully"
}
```

---

#### **2.4 Cancel Tickets**

* **Method** : `POST`
* **Endpoint** : `/cancel_ticket`
* **Description** : Allows attendees to cancel their tickets.

**Headers:**

| Key           | Value                         |
| ------------- | ----------------------------- |
| Authorization | Bearer `<JWT_TOKEN>`.       |
| eventid       | The ID of the event (string). |

**Responses:**

| Status Code | Description                                |
| ----------- | ------------------------------------------ |
| 200         | Ticket canceled successfully.              |
| 400         | Ticket not registered or already canceled. |
| 404         | Event not found.                           |
| 500         | Internal server error.                     |

 **Example Response** :

```json
{
  "message": "Ticket canceled successfully"
}
```

---

#### **2.5 View My Tickets**

* **Method** : `GET`
* **Endpoint** : `/view_my_tickets`
* **Description** : Retrieve all tickets purchased by the user.

**Headers:**

| Key           | Value                   |
| ------------- | ----------------------- |
| Authorization | Bearer `<JWT_TOKEN>`. |

**Responses:**

| Status Code | Description                     |
| ----------- | ------------------------------- |
| 200         | Tickets retrieved successfully. |
| 500         | Internal server error.          |

 **Example Response** :

```json
[
  {
    "eventId": {
      "name": "Tech Conference 2024",
      "date": "2024-12-10",
      "price": 150
    }
  }
]
```

---

#### **2.6 User Logout**

* **Method** : `POST`
* **Endpoint** : `/signout`
* **Description** : Logs out the user and invalidates the JWT token.

**Headers:**

| Key           | Value                   |
| ------------- | ----------------------- |
| Authorization | Bearer `<JWT_TOKEN>`. |

**Responses:**

| Status Code | Description            |
| ----------- | ---------------------- |
| 200         | Logout successful.     |
| 500         | Internal server error. |

 **Example Response** :

```json
{
  "message": "Logout successful"
}
```

## **3. Organizer Routes**

### **3.1 Organizer Sign-In**

* **Method** : `POST`
* **Endpoint** : `/signin`
* **Description** : Authenticates an organizer and generates a JWT token.

**Headers:**

| Key      | Value                 |
| -------- | --------------------- |
| username | Organizer's username. |
| password | Organizer's password. |

**Responses:**

| Status Code | Description                   |
| ----------- | ----------------------------- |
| 200         | Login successful.             |
| 400         | Missing username or password. |
| 401         | Invalid username or password. |
| 500         | Internal server error.        |

 **Example Response** :

```json
{
  "message": "Login successful",
  "token": "<JWT_TOKEN>"
}
```

---

### **3.2 Create Event**

* **Method** : `POST`
* **Endpoint** : `/create_event`
* **Description** : Allows an organizer to create a new event.

**Headers:**

| Key           | Value                   |
| ------------- | ----------------------- |
| Authorization | Bearer `<JWT_TOKEN>`. |

 **Body Parameters** :

| Parameter   | Type   | Description                     |
| ----------- | ------ | ------------------------------- |
| name        | String | Event name.                     |
| description | String | Event description.              |
| date        | String | Event date (YYYY-MM-DD format). |
| price       | Number | Ticket price.                   |
| capacity    | Number | Maximum number of attendees.    |

**Responses:**

| Status Code | Description                 |
| ----------- | --------------------------- |
| 201         | Event created successfully. |
| 400         | Invalid input.              |
| 500         | Internal server error.      |

 **Example Response** :

```json
{
  "message": "Event created successfully",
  "eventId": "<event-id>"
}
```

---

### **3.3 Browse Events**

* **Method** : `GET`
* **Endpoint** : `/browse_events`
* **Description** : Retrieves a list of events created by the organizer.

**Headers:**

| Key           | Value                   |
| ------------- | ----------------------- |
| Authorization | Bearer `<JWT_TOKEN>`. |

 **Responses** :

| Status Code | Description                    |
| ----------- | ------------------------------ |
| 200         | Successfully retrieved events. |
| 500         | Internal server error.         |

 **Example Response** :

```json
[
  {
    "eventId": "<event-id>",
    "name": "Tech Conference 2024",
    "date": "2024-12-10",
    "capacity": 200,
    "sales": 150
  }
]
```

---

### **3.4 Cancel Event**

* **Method** : `POST`
* **Endpoint** : `/cancel_event`
* **Description** : Allows an organizer to cancel an event.

**Headers:**

| Key           | Value                         |
| ------------- | ----------------------------- |
| Authorization | Bearer `<JWT_TOKEN>`.       |
| eventid       | The ID of the event (string). |

 **Responses** :

| Status Code | Description                  |
| ----------- | ---------------------------- |
| 200         | Event canceled successfully. |
| 404         | Event not found.             |
| 500         | Internal server error.       |

 **Example Response** :

```json
{
  "message": "Event canceled successfully"
}
```

---

### **3.5 Assign Co-Organizer**

* **Method** : `POST`
* **Endpoint** : `/assign_coorganizer`
* **Description** : Allows an organizer to assign a co-organizer to an event.

**Headers:**

| Key           | Value                   |
| ------------- | ----------------------- |
| Authorization | Bearer `<JWT_TOKEN>`. |

 **Body Parameters** :

| Parameter | Type   | Description              |
| --------- | ------ | ------------------------ |
| eventid   | String | Event ID.                |
| username  | String | Co-organizer's username. |

 **Responses** :

| Status Code | Description              |
| ----------- | ------------------------ |
| 200         | Co-organizer assigned.   |
| 404         | Event or user not found. |
| 500         | Internal server error.   |

 **Example Response** :

```json
{
  "message": "Co-organizer assigned successfully"
}
```

---

### **3.6 Remove Co-Organizer**

* **Method** : `POST`
* **Endpoint** : `/remove_coorganizer`
* **Description** : Allows an organizer to revoke a co-organizer's role.

**Headers:**

| Key           | Value                   |
| ------------- | ----------------------- |
| Authorization | Bearer `<JWT_TOKEN>`. |

 **Body Parameters** :

| Parameter | Type   | Description              |
| --------- | ------ | ------------------------ |
| eventid   | String | Event ID.                |
| username  | String | Co-organizer's username. |

 **Responses** :

| Status Code | Description              |
| ----------- | ------------------------ |
| 200         | Co-organizer removed.    |
| 404         | Event or user not found. |
| 500         | Internal server error.   |

 **Example Response** :

```json
{
  "message": "Co-organizer removed successfully"
}
```

---

### **3.7 View Sales**

* **Method** : `GET`
* **Endpoint** : `/view_sales`
* **Description** : Retrieves sales data for an event.

**Headers:**

| Key           | Value                         |
| ------------- | ----------------------------- |
| Authorization | Bearer `<JWT_TOKEN>`.       |
| eventid       | The ID of the event (string). |

 **Responses** :

| Status Code | Description            |
| ----------- | ---------------------- |
| 200         | Sales data retrieved.  |
| 404         | Event not found.       |
| 500         | Internal server error. |

 **Example Response** :

```json
{
  "eventId": "<event-id>",
  "sales": {
    "ticketsSold": 150,
    "revenue": 22500
  }
}
```

---

### **3.8 Delete Event**

* **Method** : `DELETE`
* **Endpoint** : `/delete_event`
* **Description** : Deletes an event permanently.

**Headers:**

| Key           | Value                         |
| ------------- | ----------------------------- |
| Authorization | Bearer `<JWT_TOKEN>`.       |
| eventid       | The ID of the event (string). |

 **Responses** :

| Status Code | Description                 |
| ----------- | --------------------------- |
| 200         | Event deleted successfully. |
| 404         | Event not found.            |
| 500         | Internal server error.      |

 **Example Response** :

```json
{
  "message": "Event deleted successfully"
}
```

---

### **3.9 Organizer Sign-Out**

* **Method** : `POST`
* **Endpoint** : `/signout`
* **Description** : Logs out the organizer and invalidates the JWT token.

**Headers:**

| Key           | Value                   |
| ------------- | ----------------------- |
| Authorization | Bearer `<JWT_TOKEN>`. |

 **Responses** :

| Status Code | Description            |
| ----------- | ---------------------- |
| 200         | Logout successful.     |
| 500         | Internal server error. |

 **Example Response** :

```json
{
  "message": "Logout successful"
}
```

---

## **4. Co-Organizer Routes**

### **4.1 Co-Organizer Sign-In**

* **Method** : `POST`
* **Endpoint** : `/signin`

( *Details similar to  **3.1 Organizer Sign-In** .* )

---

### **4.2 Browse Events**

* **Method** : `GET`
* **Endpoint** : `/browse_events`

( *Details similar to  **3.3 Browse Events** .* )

---

### **4.3 Update Event**

* **Method** : `PATCH`
* **Endpoint** : `/update_event`
* **Description** : Allows a co-organizer to update event details.

**Headers:**

| Key           | Value                   |
| ------------- | ----------------------- |
| Authorization | Bearer `<JWT_TOKEN>`. |

 **Body Parameters** :

| Parameter | Type   | Description                          |
| --------- | ------ | ------------------------------------ |
| eventid   | String | Event ID.                            |
| fields    | Object | Key-value pairs of fields to update. |

 **Responses** :

| Status Code | Description                 |
| ----------- | --------------------------- |
| 200         | Event updated successfully. |
| 400         | Invalid input.              |
| 404         | Event not found.            |
| 500         | Internal server error.      |

---

### **4.4 Co-Organizer Sign-Out**

* **Method** : `POST`
* **Endpoint** : `/signout`

## **Future Enhancements**

- Add support for event ticket booking.
- Implement email notifications for event updates.
- Integrate analytics for event performance tracking.
- Add OAuth support for third-party authentication.

---

## **Contributors**

- **Developer**: [Lakshya Kandpal](https://github.com/hiLakshya)

---

## **License**

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.
