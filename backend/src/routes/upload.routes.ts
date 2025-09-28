import { Router, Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import * as XLSX from 'xlsx';
import { authMiddleware } from '../middleware/auth.middleware';
import { bigqueryService, bigquery } from '../services/bigquery.service';
import { geminiService } from '../services/gemini.service';
import { logger } from '../utils/logger';

const router = Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    const uploadDir = 'uploads';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (_req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE || '10485760'), // 10MB
  },
  fileFilter: (_req, file, cb) => {
    const allowedTypes = process.env.ALLOWED_FILE_TYPES?.split(',') || ['.csv', '.xlsx', '.xls'];
    const ext = path.extname(file.originalname).toLowerCase();
    
    if (allowedTypes.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error(`File type ${ext} not allowed. Allowed types: ${allowedTypes.join(', ')}`));
    }
  }
});

// Upload single file endpoint
router.post('/single',
  authMiddleware,
  upload.single('file'),
  async (req: Request, res: Response) => {
    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: 'No file uploaded',
        });
      }

      const user = (req as any).user;
      logger.info(`File uploaded by ${user.email}:`, req.file.filename);

      // Process the file
      const data = await processFile(req.file.path, req.file.mimetype);

      // Store in BigQuery
      const surveyData = data.map((row: any) => ({
        patientId: row.patientId || row.patient_id || 'unknown',
        eventName: row.eventName || row.event_name || 'survey',
        timestamp: new Date(row.timestamp || row.date || Date.now()),
        responses: row,
        metadata: {
          uploadedBy: user.email,
          fileName: uploadedFile.originalname,
          uploadDate: new Date(),
        },
      }));

      await bigqueryService.insertSurveyData(surveyData);

      // Generate insights with Gemini
      const insights = await geminiService.generateInsights({
        data: surveyData,
        context: 'New survey data upload',
      });

      // Clean up uploaded file
      fs.unlinkSync(uploadedFile.path);

      return res.json({
        success: true,
        message: 'File uploaded and processed successfully',
        data: {
          fileName: uploadedFile.originalname,
          recordsProcessed: data.length,
          insights: insights.insights,
          recommendations: insights.recommendations,
        },
      });
    } catch (error) {
      logger.error('Error processing upload:', error);
      
      // Clean up file on error
      if (req.file && fs.existsSync(req.file.path)) {
        fs.unlinkSync(uploadedFile.path);
      }
      
      return res.status(500).json({
        success: false,
        message: 'Failed to process uploaded file',
      });
    }
});

// Upload multiple files endpoint
router.post('/multiple',
  authMiddleware,
  upload.array('files', 10),
  async (req: Request, res: Response) => {
    try {
      const files = req.files as Express.Multer.File[];
      
      if (!files || files.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'No files uploaded',
        });
      }

      const user = (req as any).user;
      const results = [];

      for (const file of files) {
        try {
          logger.info(`Processing file ${file.filename} uploaded by ${user.email}`);
          
          const data = await processFile(file.path, file.mimetype);
          
          const surveyData = data.map((row: any) => ({
            patientId: row.patientId || row.patient_id || 'unknown',
            eventName: row.eventName || row.event_name || 'survey',
            timestamp: new Date(row.timestamp || row.date || Date.now()),
            responses: row,
            metadata: {
              uploadedBy: user.email,
              fileName: file.originalname,
              uploadDate: new Date(),
            },
          }));

          await bigqueryService.insertSurveyData(surveyData);
          
          results.push({
            fileName: file.originalname,
            recordsProcessed: data.length,
            status: 'success',
          });
          
          // Clean up file
          fs.unlinkSync(file.path);
        } catch (error) {
          logger.error(`Error processing file ${file.filename}:`, error);
          results.push({
            fileName: file.originalname,
            status: 'failed',
            error: (error as Error).message,
          });
          
          // Clean up file on error
          if (fs.existsSync(file.path)) {
            fs.unlinkSync(file.path);
          }
        }
      }

      // Generate overall insights
      const insights = await geminiService.generateInsights({
        data: results,
        context: 'Batch file upload results',
      });

      return res.json({
        success: true,
        message: `Processed ${files.length} files`,
        results,
        insights: insights.summary,
      });
    } catch (error) {
      logger.error('Error in multiple file upload:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to process uploaded files',
      });
    }
});

// Get upload history endpoint
router.get('/history',
  authMiddleware,
  async (req: Request, res: Response) => {
    try {
      const user = (req as any).user;
      
      // Query upload history from BigQuery
      const query = `
        SELECT 
          JSON_VALUE(metadata, '$.fileName') as fileName,
          JSON_VALUE(metadata, '$.uploadDate') as uploadDate,
          COUNT(*) as recordCount
        FROM \`${process.env.GCP_PROJECT_ID}.${process.env.BIGQUERY_DATASET}.survey_data\`
        WHERE JSON_VALUE(metadata, '$.uploadedBy') = @uploadedBy
        GROUP BY fileName, uploadDate
        ORDER BY uploadDate DESC
        LIMIT 100
      `;

      const [rows] = await bigquery.query({
        query,
        params: { uploadedBy: user.email },
      });

      return res.json({
        success: true,
        uploads: rows,
      });
    } catch (error) {
      logger.error('Error fetching upload history:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to fetch upload history',
      });
    }
});

// Process file based on type
async function processFile(filePath: string, _mimeType: string): Promise<any[]> {
  const ext = path.extname(filePath).toLowerCase();

  if (ext === '.csv') {
    return processCSV(filePath);
  } else if (ext === '.xlsx' || ext === '.xls') {
    return processExcel(filePath);
  } else {
    throw new Error(`Unsupported file type: ${ext}`);
  }
}

// Process CSV file
function processCSV(filePath: string): any[] {
  const workbook = XLSX.readFile(filePath);
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  return XLSX.utils.sheet_to_json(sheet);
}

// Process Excel file
function processExcel(filePath: string): any[] {
  const workbook = XLSX.readFile(filePath);
  let allData: any[] = [];

  // Process all sheets
  for (const sheetName of workbook.SheetNames) {
    const sheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(sheet);
    allData = allData.concat(data);
  }

  return allData;
}

export default router;
