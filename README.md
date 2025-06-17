# Instagram Insights Backend

This backend application is designed to fetch and process Instagram insights data. It serves as the API for the frontend application, providing endpoints to retrieve user profile information, recent media posts, and computed performance metrics.

## Features

- Fetch user profile basics including username, profile picture, biography, and follower counts.
- Retrieve recent media posts with details such as media type, caption, and engagement metrics.
- Calculate various performance metrics including engagement rates, follower ratios, and posting frequency.
- Support for environment variables to manage sensitive information securely.

## Setup Instructions

1. **Clone the repository:**
   ```bash
   git clone <repository-url>
   cd instagram-insights/backend
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure environment variables:**
   Create a `.env` file in the `backend` directory and add your Instagram API credentials:
   ```
   IG_ACCESS_TOKEN=your_access_token
   IG_BUSINESS_ID=your_business_id
   PORT=3001
   ```

4. **Run the server:**
   ```bash
   npm start
   ```

5. **Access the API:**
   The server will be running on `http://localhost:3001`. You can access the insights data by making GET requests to the appropriate endpoints.

## Usage

The backend provides endpoints to fetch Instagram insights data. Ensure that the frontend application is configured to communicate with this backend service for a seamless user experience.

## License

This project is licensed under the MIT License. See the LICENSE file for more details.