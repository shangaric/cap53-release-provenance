# ReleaseTrack

ReleaseTrack is a lightweight release management portal for recording software versions, deployment outcomes, approval decisions, and test evidence. It is an application-only project: it does not provision infrastructure, build artifacts, or automate deployments.

## Technology

- **Frontend:** React 18, Vite, JavaScript, React Router, Lucide React
- **Backend:** Java 21, Spring Boot 3.5, Spring Web, Spring Data JPA, Hibernate, Bean Validation
- **Database:** MySQL 8+

## Prerequisites

- JDK 21 (verify with `java -version`)
- Node.js 20+ and npm
- MySQL Server 8+ running on `localhost:3306`
- VS Code (recommended extensions: Extension Pack for Java and ES7+ React snippets)

The backend includes a Maven Wrapper, so a separate Maven installation is not required. The wrapper downloads Maven 3.10.0 the first time it is run.

## Database setup

1. Open `database/create_database.sql` in MySQL Workbench and execute it. It creates `releasetrack_db` and all four tables. Alternatively, from Command Prompt run:

   ```bat
   mysql -u root -p < database\create_database.sql
   ```

2. The backend defaults to the local MySQL `root` account with an empty password. Configure credentials in your terminal before starting it if your MySQL account uses a password:

   **PowerShell**

   ```powershell
   $env:DB_USERNAME = "root"
   $env:DB_PASSWORD = "your-local-mysql-password"
   ```

   **Command Prompt**

   ```bat
   set DB_USERNAME=root
   set DB_PASSWORD=your-local-mysql-password
   ```

   Optional settings are `DB_URL` (defaults to `jdbc:mysql://localhost:3306/releasetrack_db?useSSL=false&allowPublicKeyRetrieval=true&serverTimezone=UTC`) and `SERVER_PORT` (defaults to `8080`). Credentials are not stored in Java source.

3. Optional demo records are in `database/sample_data.sql`. Run this only once against a fresh database; it inserts example rows with fixed IDs. In MySQL Workbench, open and execute the script.

Hibernate uses `ddl-auto=update` to keep the schema aligned during local development. The SQL script remains the explicit schema setup.

## Run in VS Code

Open the repository folder in VS Code. Start a terminal for each service.

### Backend

```powershell
cd backend
.\mvnw.cmd spring-boot:run
```

The REST API listens at **http://localhost:8080**. In the Java Projects or Maven view in VS Code, you can also run `com.releasetrack.ReleaseTrackApplication`.

### Frontend

```powershell
cd frontend
npm install
npm run dev
```

Open **http://localhost:5173**. The Vite app calls `http://localhost:8080/api` by default. To use a different API URL, copy `frontend/.env.example` to `frontend/.env` and set `VITE_API_BASE_URL`, then restart Vite.

### Tests and production build

From `backend`, run `.\mvnw.cmd test`. Backend tests use an in-memory H2 database and do not require MySQL. From `frontend`, run `npm run build`.

## Application features

- **Dashboard:** Live release and deployment totals plus recent deployment activity, all loaded from the API.
- **Releases:** Create and search releases, inspect full release details, and delete releases only when they have no deployment history. Version numbers are unique.
- **Deployments:** Record `STAGING` or `PRODUCTION` deployments with `SUCCESS`, `FAILED`, or `PENDING` status. Production records require an approval with `APPROVED` status.
- **Approvals:** Create pending approval requests and record a named approval or rejection with comments. Decisions are final for each request.
- **Test evidence:** Record `PASSED`, `FAILED`, or `SKIPPED` test results and supporting details.
- **Release details:** Review release metadata alongside its deployments, approval requests, and test evidence.

## REST API

JSON endpoints are rooted at `/api`. Successful creates return **201**, successful deletes return **204**, invalid input returns **400**, missing resources return **404**, and conflicts such as duplicate versions or unapproved production deployment return **409**.

| Method | Endpoint | Purpose |
|---|---|---|
| `GET` | `/api/dashboard/stats` | Live summary metrics and recent activity |
| `GET` | `/api/releases` | List releases; optional `?q=` searches version and service |
| `GET` | `/api/releases/{id}` | Release details |
| `POST` | `/api/releases` | Create release |
| `DELETE` | `/api/releases/{id}` | Delete only if no deployments exist |
| `GET` | `/api/releases/{id}/deployments` | Deployments for a release |
| `GET` | `/api/deployments` | List deployment records |
| `POST` | `/api/deployments` | Record a deployment |
| `GET` | `/api/approvals` | List approval requests; optional `?releaseId=` filter |
| `POST` | `/api/approvals` | Create a pending approval request |
| `PATCH` | `/api/approvals/{id}/decision` | Approve or reject a pending request |
| `GET` | `/api/test-evidence` | List test evidence; optional `?releaseId=` filter |
| `POST` | `/api/test-evidence` | Record test evidence |

Example request bodies:

```json
POST /api/releases
{
  "version": "2.4.0",
  "serviceName": "Payments API",
  "gitCommit": "a82f4c1",
  "artifactName": "payments-api-2.4.0.jar",
  "checksum": "4e6f4a27f73c5b14c2b9c9b32a16f02c4e6f4a27f73c5b14c2b9c9b32a16f02c"
}
```

```json
POST /api/deployments
{
  "releaseId": 1,
  "environment": "STAGING",
  "status": "SUCCESS"
}
```

```json
POST /api/approvals
{
  "releaseId": 1,
  "approverName": "Alex Morgan",
  "comments": "Ready for review"
}
```

```json
PATCH /api/approvals/1/decision
{
  "approvalStatus": "APPROVED",
  "approverName": "Alex Morgan",
  "comments": "Reviewed and approved"
}
```

```json
POST /api/test-evidence
{
  "releaseId": 1,
  "testName": "API integration suite",
  "testStatus": "PASSED",
  "evidenceDetails": "All integration checks passed."
}
```

## Troubleshooting

- **`java` is not Java 21:** Install a JDK 21 distribution and ensure its `bin` directory is first on `PATH`. Open a new VS Code terminal after changing environment variables.
- **The Maven Wrapper cannot download Maven:** Check your internet connection and run `.\mvnw.cmd -version` again from the `backend` folder.
- **Cannot connect to MySQL:** Confirm MySQL is running on port 3306, the schema exists, and `DB_USERNAME` / `DB_PASSWORD` match your local account. Spring Boot creates or updates the tables when it connects.
- **Duplicate version conflict:** Release versions are unique; choose a different version or search the release catalog.
- **Production deployment conflict:** Create an approval request and approve it first. A pending or rejected request is not sufficient.
- **Frontend cannot reach the API:** Run the backend on port 8080 and confirm `VITE_API_BASE_URL` points to the API origin plus `/api`.
- **Port already in use:** Set `SERVER_PORT` for the backend. Vite uses port 5173; stop the process currently using it before starting the frontend.
