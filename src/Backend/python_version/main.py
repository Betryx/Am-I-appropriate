from typing import Union
from fastapi import FastAPI,  File, UploadFile
from pydantic import BaseModel
import openai
import os
import json

app = FastAPI()
token = os.environ.get('TOKEN')
client = openai.OpenAI(api_key="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")

class ResumeData(BaseModel):
    JobURL: str

# Define the endpoint that processes the job URL and resume file
@app.post("/CheckResume")
async def checkResume(ResumeData: ResumeData, resumeFile: UploadFile = File(...)):
    # Read the resume file contents asynchronously
    resume_content = await resumeFile.read()
    resume_text = resume_content.decode("utf-8")

    # Prepare the input data for GPT, including the Job URL and resume text
    data = [
        {
            "role": "user",
            "content": (
                f"Analyze the compatibility between the resume provided "
                f"in terms of skills, experience, and overall requirements and "
                f"the job posting provided in this link: {ResumeData.JobURL}.\n"
                f"Resume content:\n{resume_text}\n\n"
                "Return a JSON object called `UserCompatibility` that contains:\n"
                "- `required_skills`\n"
                "- `skills_present`\n"
                "- `matched_skills`\n"
                "- `experience_present`\n"
                "- `required_experience`\n"
                "- `matched_experience`\n"
                "- `overall_matching`\n"
                "- `summary`\n"
                "Ensure the response is in valid JSON format."
            ),
        }
    ]

    # Call OpenAI API to get the response from GPT-4
    try:
        # Request GPT model to process the data
        response = openai.ChatCompletion.create(
            model="gpt-4",
            messages=data
        )

        # Get the output response from GPT
        gpt_response = response['choices'][0]['message']['content']
        
        # Try to parse the GPT response into a JSON object
        try:
            user_compatibility = json.loads(gpt_response)
        except json.JSONDecodeError:
            return {"error": "Failed to decode the response from GPT. Response is not in valid JSON format."}
        
        # Return the structured JSON response
        return user_compatibility
    
    except Exception as e:
        # If any error occurs while interacting with OpenAI API
        return {"error": f"An error occurred: {str(e)}"}
