# Open Data Insights Portal

This project is a platform to explore and visualize open datasets. It allows users to:

*   Select a dataset from a predefined list.
*   Visualize the dataset as a line chart using D3.js.
*   See basic insights and trends from the data, such as trend direction, anomalies, and statistical summaries.
*   Control the time window of the data being displayed.
*   Export the data and the chart in various formats (CSV, JSON, PNG).
*   Bookmark interesting datasets and their configurations.
*   Share a link to a specific dataset view.

## How to run this project locally

The only requirement is having Node.js & npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

Follow these steps:

```sh
# Step 1: Clone the repository using the project's Git URL.
git clone <YOUR_GIT_URL>

# Step 2: Navigate to the project directory.
cd <YOUR_PROJECT_NAME>

# Step 3: Install the necessary dependencies.
npm i

# Step 4: Start the development server with auto-reloading and an instant preview.
npm run dev
```

## What technologies are used for this project?

This project is built with:

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS