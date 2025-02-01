"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppController = void 0;
const common_1 = require("@nestjs/common");
const dotenv = require("dotenv");
dotenv.config();
const platform_express_1 = require("@nestjs/platform-express");
const multer_1 = require("multer");
const pdfParse = require("pdf-parse");
const fs = require("fs");
const path = require("path");
const mammoth = require("mammoth");
const openai_1 = require("openai");
const token = process.env.TOKEN;
let AppController = class AppController {
    constructor() {
        this.openai = new openai_1.OpenAI({ apiKey: token });
    }
    async readFile(file, req) {
        if (!file) {
            throw new common_1.BadRequestException('No file uploaded.');
        }
        const jobURL = req.body.JobURL;
        if (!jobURL || typeof jobURL !== 'string') {
            throw new common_1.BadRequestException('JobURL is required and must be a valid string.');
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
            }
            else {
                throw new common_1.BadRequestException('Unsupported file type.');
            }
            fs.unlinkSync(filePath);
            const chatGptResponse = await this.sendToChatGPT(fileContent, jobURL);
            return { fileName: file.originalname, JobURL: jobURL, content: fileContent, chatGptResponse };
        }
        catch (error) {
            if (error instanceof Error) {
                throw new common_1.BadRequestException(`Error reading file: ${error.message}`);
            }
            else {
                throw new common_1.BadRequestException('Unknown error occurred while reading the file.');
            }
        }
    }
    async sendToChatGPT(fileContent, jobURL) {
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
                throw new common_1.BadRequestException('Invalid response from OpenAI API');
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
        }
        catch (error) {
            throw new common_1.BadRequestException(`ChatGPT API error: ${error.message}`);
        }
    }
};
exports.AppController = AppController;
__decorate([
    (0, common_1.Post)(),
    (0, common_1.UseInterceptors)((0, platform_express_1.FileInterceptor)('file', {
        storage: (0, multer_1.diskStorage)({
            destination: './uploads',
            filename: (req, file, callback) => {
                const ext = path.extname(file.originalname);
                const filename = `${Date.now()}-${Math.random().toString(36).substring(7)}${ext}`;
                callback(null, filename);
            },
        }),
        fileFilter: (req, file, callback) => {
            if (!file.mimetype.match(/(pdf|msword|officedocument)/)) {
                return callback(new common_1.BadRequestException('Only PDF and DOCX files are allowed!'), false);
            }
            callback(null, true);
        },
    })),
    __param(0, (0, common_1.UploadedFile)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], AppController.prototype, "readFile", null);
exports.AppController = AppController = __decorate([
    (0, common_1.Controller)('CheckResume')
], AppController);
//# sourceMappingURL=app.controller.js.map