import {
  Controller,
  Post,
  UploadedFile,
  UseInterceptors,
  BadRequestException,
  Req,
} from '@nestjs/common';
import * as dotenv from 'dotenv';
dotenv.config();
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import * as pdfParse from 'pdf-parse';
import * as fs from 'fs';
import * as path from 'path';
import * as mammoth from 'mammoth';
import { Request } from 'express'; 
import {OpenAI} from "openai"

const token = process.env.TOKEN 

@Controller('CheckResume')
export class AppController {
  private openai = new OpenAI({ apiKey: token}); 
  
  @Post()
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: './uploads',
        filename: (req, file, callback) => {
          const ext = path.extname(file.originalname);
          const filename = `${Date.now()}-${Math.random().toString(36).substring(7)}${ext}`;
          callback(null, filename);
        },
      }),
      fileFilter: (req, file, callback) => {
        if (!file.mimetype.match(/(pdf|msword|officedocument)/)) {
          return callback(new BadRequestException('Only PDF and DOCX files are allowed!'), false);
        }
        callback(null, true);
      },
    }),
  )
  async readFile(@UploadedFile() file: Express.Multer.File, @Req() req: Request) {  
    if (!file) {
      throw new BadRequestException('No file uploaded.');
    }

    
    const jobURL = req.body.JobURL;
    if (!jobURL || typeof jobURL !== 'string') {
      throw new BadRequestException('JobURL is required and must be a valid string.');
    }

    const filePath = path.join(__dirname, '..', '..', 'uploads', file.filename);
    const ext = path.extname(file.originalname).toLowerCase();
    let fileContent = '';

    try {
      
      if (ext === '.pdf') {
        const data = await pdfParse(fs.readFileSync(filePath));
        fileContent = data.text;
      } 
     
      else if (ext === '.docx') {
        const data = await mammoth.extractRawText({ path: filePath });
        fileContent = data.value;
      } else {
        throw new BadRequestException('Unsupported file type.');
      }

      
      fs.unlinkSync(filePath);

      const chatGptResponse = await this.sendToChatGPT(fileContent, jobURL);

      return { fileName: file.originalname, JobURL: jobURL, content: fileContent, chatGptResponse };
    } catch (error) {
      if (error instanceof Error) {
        throw new BadRequestException(`Error reading file: ${error.message}`);
      } else {
        throw new BadRequestException('Unknown error occurred while reading the file.');
      }
    }
  }

  async sendToChatGPT(fileContent: string, jobURL: string) {
    try {
     
      const prompt = `Analyze the compatibility between the provided resume in terms of skills, experience, and overall requirements with the job posting at the following link: ${jobURL}

Resume content:
${fileContent}

Return a JSON object called \`UserCompatibility\` that contains:
- \`required_skills\` (list of required skills)
- \`skills_present\` (list of skills present in the resume)
- \`matched_skills\` (list of skills that match)
- \`experience_present\` (list of experiences present in the resume)
- \`required_experience\` (list of required experiences)
- \`matched_experience\` (list of experiences that match)
- \`overall_matching\` (calculated matching score between 0 and 100)
- \`summary\` (a brief summary of the match)

Ensure the response is in valid JSON format.`;

     
      const response = await this.openai.chat.completions.create({
        model: 'gpt-4',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.7,
      });

      const responseContent = response.choices[0]?.message.content;

      if (!responseContent) {
        throw new BadRequestException('Invalid response from OpenAI API');
      }

      const compatibilityData = JSON.parse(responseContent);

      
      const matchedSkillsCount = compatibilityData.matched_skills.length;
      const requiredSkillsCount = compatibilityData.required_skills.length;
      const matchedExperienceCount = compatibilityData.matched_experience.length;
      const requiredExperienceCount = compatibilityData.required_experience.length;

      const skillMatchPercentage = (matchedSkillsCount / requiredSkillsCount) * 100;
      const experienceMatchPercentage = (matchedExperienceCount / requiredExperienceCount) * 100;

      const overallMatching = (skillMatchPercentage + experienceMatchPercentage) / 2;

      return {
        ...compatibilityData,
        overall_matching: overallMatching.toFixed(2),

      };
      
    } catch (error) {
      throw new BadRequestException(`ChatGPT API error: ${error.message}`);
    }
  }
}
