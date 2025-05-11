## My boilerplate

## Tech Stack

The technologies used include:

 - Typescript : For readability and maitainability
 - Next.js: Leveraged for server-side rendering and static-generation
 - Express.js : Flexible backend framework for handling API routes and server-side logic
 - PostgreSQL: Reliable, scalable and strong relational database support 
 - Prisma : ORM to simplify database queries, schemas migrations and security
 - Zod : Ensures runtime validation of API inputs and data structures
 - Axios : Used for efficient and easy to manage HTTP requests
 - TailwindCSS : CSS framework used for rapid and responsive UI design
    

## Folder structure

```
├── components/       # Non reusable components that could be called in differents places or placed here for better readability
├── context/          # To keep datas while navigating through pages
├── functions/        # Backend side
  └─ prisma /         # Orm files
  └─ src             
   └─ controllers     # Filter the entry from the route, pick up only what we need and set first errors if req does not containt what we want
   └─ respositories   # Calls to db using prisma
   └─ routes          # Routes
   └─ schemas         # Schemas done using Zod
   └─ services        # Following the controller, it's where we insert logic before entering the repository
├── lib/              # For reusable components of the application
├── pages/            # Contains pages of the application
├── public/           # For pictures, icons and translation using i18n
├── schemas/          # Schemas done using Zod
├── services/         # To call the backend using Axios
├── styles/           # for the CSS files
```

## Setup

### Prerequisites

Ensure you have the following installed:

- **Node.js** (version 18.x or later)
- **npm** (version 6.x or later)

### Installation

1. Clone the repository to your local machine:

```bash
git clone git@github.com:neolink78/Boilerplate.git
```

2. Navigate into the project directory:

```bash
cd boilerplate
```

3. Install the project dependencies in the frontend and backend:

```bash
npm install
```

```bash
cd functions
npm install
```

4. Create a .env file and refer to the .env.sample to see what needs to be entered on both the frontend and the backend
   
6. Start the development server for local development
   
   On your terminal run 
```bash
npm run dev
```
Open a new one at the same time, go to the functions folder and run the same command.

