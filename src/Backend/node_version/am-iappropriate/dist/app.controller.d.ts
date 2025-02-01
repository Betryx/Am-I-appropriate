import { Request } from 'express';
export declare class AppController {
    private openai;
    readFile(file: Express.Multer.File, req: Request): Promise<{
        fileName: string;
        JobURL: string;
        content: string;
        chatGptResponse: any;
    }>;
    sendToChatGPT(fileContent: string, jobURL: string): Promise<any>;
}
