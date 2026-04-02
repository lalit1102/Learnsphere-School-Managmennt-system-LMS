import { inngest } from "./client.js";
import {
  generateTimeTable,
  generateExam,
  handleExamSubmission,
} from "./functions.js";

export { inngest };

export const functions = [
  generateTimeTable,
  generateExam,
  handleExamSubmission,
];