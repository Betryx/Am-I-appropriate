# Am I Appropriate API

## Overview

The **Am I Appropriate API** is designed to help job seekers determine whether their resume aligns with a specific job posting. The API utilizes **OpenAI's GPT-4** to analyze resumes and compare them to job postings, providing structured feedback on skills, experience, and overall compatibility.

## Technologies Used

- **NestJS** (Backend framework)
- **Multer** (File handling middleware for handling uploads)
- **pdf-parse** (For extracting text from PDF files)
- **mammoth** (For extracting text from DOCX files)
- **OpenAI API** (For resume-job compatibility analysis)
- **Express** ( The underlying Web framework for handling requests)
- **dotenv** (For handling environment variables)

## API Endpoint

**POST /CheckResume**

## Request Format

The API accepts a **multipart/form-data** request containing:

- `file` (Required): A **PDF** or **DOCX** file representing the resume.
- `JobURL` (Required, String): A URL linking to the job posting.

### Example Request (Using cURL)

```sh
curl -X POST http://localhost:3000/CheckResume \
  -F "file=@/path/to/resume.pdf" \
  -F "JobURL=https://example.com/job-posting"
```

## Response Format

The API returns a **JSON object** with the following fields:

```json
{
  "UserCompatability": {
    "required_skills": ["Skill1", "Skill2"],
    "skills_present": ["Skill1", "Skill3"],
    "matched_skills": ["Skill1"],
    "experience_present": ["Experience1", "Experience3"],
    "required_experience": ["Experience1", "Experience2"],
    "matched_experience": ["Experience1"],
    "overall_matching": "75.00",
    "summary": "The resume matches 75% of the job requirements."
  }
}
```

## How to Use

1. Ensure your resume is in **PDF** or **DOCX** format.
2. Send a `POST` request to `/CheckResume` with your resume file and the job posting URL.
3. Receive a structured JSON response detailing the compatibility of your resume with the job.
4. Use the `overall_matching` score and feedback to optimize your resume.

## How to Start the API

1. **Clone the repository** and navigate into the project directory:
   ```sh
   git clone <repository-url>
   cd <repository-folder>
   ```
2. **Install dependencies**:
   ```sh
   npm install
   ```
3. **Set up environment variables**:
   - Create a `.env` file in the project root.
   - Add your OpenAI API key:
     ```sh
     OPENAI_API_KEY=your_openai_api_key
     ```
4. **Start the NestJS application**:
   ```sh
   npm run start
   ```
5. The API will now be running at `http://localhost:3000/`

## Usage Notes

- Only **PDF** and **DOCX** formats are supported.
- The OpenAI API processes the resume and provides an **accuracy score**.
- **Frequent updates** are made to improve the accuracy and functionality of the API.

## Error Handling

The API returns appropriate HTTP status codes:

- **400 Bad Request**: If an invalid file type is uploaded or required fields are missing.
- **500 Internal Server Error**: If there is an issue processing the file or calling the AI API.

## Future Enhancements

- Support for additional file formats.
- Improved AI-based analysis and personalized feedback.
- Enhanced scoring methodology based on job market trends.

For more details, refer to the official documentation or reach out to the development team.

