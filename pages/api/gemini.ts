import type { NextApiRequest, NextApiResponse } from "next";
import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from "@google/generative-ai";
import { GoogleAIFileManager } from "@google/generative-ai/server";
import { Formidable, Files } from "formidable";
import path from "path";

export const config = {
  api: {
    bodyParser: false,
  },
};

const apiKey = "AIzaSyCzFsIF7j2iHQrc86241_95MBniMn8ZgnI";
const genAI = new GoogleGenerativeAI(apiKey);
const fileManager = new GoogleAIFileManager(apiKey);

async function uploadToGemini(path: any, mimeType: any) {
  const uploadResult = await fileManager.uploadFile(path, {
    mimeType,
    displayName: path,
  });
  const file = uploadResult.file;
  console.log(`Uploaded file ${file.displayName} as: ${file.name}`);
  return file;
}

const model = genAI.getGenerativeModel({
  model: "gemini-1.5-flash",
});

const generationConfig = {
  temperature: 1,
  topP: 0.95,
  topK: 64,
  maxOutputTokens: 8192,
  responseMimeType: "text/plain",
};

interface FieldFormidableType {
  problem: Array<string>;
  questions: Array<string>;
}

interface FileFormidableType {
  diagramFigure: Array<{
    size: string;
    newFilename: string;
    filepath: string;
    mimetype: string;
    mtime: Date;
    originalFilename: string;
  }>;
}
export const parseForm = async (
  req: NextApiRequest
): Promise<{ fields: FieldFormidableType; files: FileFormidableType | Files }> => {
  return await new Promise<{
    err: any;
    fields: any;
    files: FileFormidableType | Files;
  }>((resolve, reject) => {
    const form = new Formidable();

    return form.parse(req, (err, fields, files) => {
      if (err) reject({ err });
      resolve({ err, fields, files });
    });
  });
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { fields, files } = await parseForm(req);
  console.log(Object.keys(files).length);
  if (!fields.problem || !fields.questions)
    return res.status(404).json({ message: "All Field Required", statusCode: 404 });
  const problem = fields.problem[0];
  const questions = fields.questions[0];

  const diagramFigure = files.diagramFigure && files.diagramFigure[0];
  if (req.method === "POST") {
    console.log(path.resolve(process.cwd(), "assets/aa5fdaf7-3e1f-409b-8e41-eb2ecc62b3b6.png"));
    const aiFiles = [
      await uploadToGemini(path.resolve(process.cwd(), "assets/aa5fdaf7-3e1f-409b-8e41-eb2ecc62b3b6.png"), "image/png"),
      await uploadToGemini(path.resolve(process.cwd(), "assets/c72aebe0-fae7-45ef-a5aa-61cc95f85323.png"), "image/png"),
    ];
    if (diagramFigure) {
      aiFiles.push(await uploadToGemini(diagramFigure.filepath, diagramFigure.mimetype));
    }

    const parts = [
      {
        text: 'I want you to create a similar problem but with different values. The new problem should have the same questions but with different values and its correct multiple-choice options for the user to answer. Provide instructions for creating diagrams or figures if necessary, but omit them if they are not needed. Since this AI model can\'t generate images, please give instructions for new diagrams/figures when required. Your response should be in Mathpix Markdown format and placed in JSON format. Please don\\\'t include the ```json [] ``` just direct it in json format in the response, here is the example s shown below:\n[\n    {\n        "problem": "",\n        "questions": {\n            "1": {\n                "question": "",\n                "choices": {\n                    "a": "",\n                    "b": "",\n                    "c": "",\n                    "d": ""\n                }\n            },\n            ...\n        },\n        "solution": {\n            "1": {\n                "question": "",\n                "solution": "",\n                "correctAnswer": ""\n            },\n            ...\n        }\n    }\n]\n\n\nPlease answer the questions and provide solutions. Ensure you verify each solution 10 times before add it in the multiple-choice options. I want you to add the correct answer in the multiple choice. If you are using \\left in JSON, please double the backslash like this \\\\left, as a single backslash is not readable in JSON. Some of your correct answers do not match the choices, so please ensure accuracy.',
      },
      { text: "input: Diagram/Figures:\n" },
      {
        fileData: {
          mimeType: aiFiles[0].mimeType,
          fileUri: aiFiles[0].uri,
        },
      },
      {
        text: "\n\nProblem:\nA concrete dam retaining water is shown. If the specific weight of concrete is 23.5\nkN/m3.\n\nQuestions:\n1. Find the factor of safety against sliding.\n2. Find the factor of safety against overturning if the coeff. of friction is 0.48.\n3. Find the max. and min. pressure intensity",
      },
      {
        text: 'output: [  {    "problem": "A concrete dam retaining water is shown. If the specific weight of concrete is 23.5 kN/m3, change the water level to **4.5m**, and the width of the dam to **3.5 m**. ",    "questions": {      "1": {        "question": "Find the factor of safety against sliding.",        "choices": {          "a": "0.8",          "b": "1.34",          "c": "1.8",          "d": "2.4"        }      },      "2": {        "question": "Find the factor of safety against overturning if the coeff. of friction is 0.48.",        "choices": {          "a": "0.98",          "b": "1.25",          "c": "1.54",          "d": "3.42"        }      },      "3": {        "question": "Find the max. and min. pressure intensity (in kPa) at the base of the dam.",        "choices": {          "a": "39.67, 14.71",          "b": "44.14, 19.62",          "c": "58.85, 29.42",          "d": "73.4 kN/m2, 173.34 kN/m2."        }      }    },    "solution": {      "1": {        "question": "Find the factor of safety against sliding.",        "solution": "* **Forces:**\\n    * **P:** Water pressure on the dam = γ * h * A = 9.79 * 3 * 6 * 1 = 176.20 kN\\n    * **w1:** Weight of the concrete above the waterline = 2 * 7 * 1 * 23.5 = 164.5 kN\\n    * **w2:** Weight of the concrete below the waterline = 2 * 7 * 1 * 23.5 = 329 kN\\n    * **Ry:** Total vertical reaction force = w1 + w2 = 164.5 + 329 = 493.5 kN\\n* **Factor of Safety:**    * F.S. = (μ * Ry) / P = (0.48 * 493.5) / 176.20 = 1.34",        "correctAnswer": "b"      },      "2": {        "question": "Find the factor of safety against overturning if the coeff. of friction is 0.48.",        "solution": "* **Moments:**\\n    * **O.M.:** Overturning Moment = P * 2 = 176.20 * 2 = 352.4 kN.m\\n    * **R.M.:** Resisting Moment = w1 * 1.333 + w2 * 3 = 164.5 * 1.333 + 329 * 3 = 1206 kN.m\\n\\n* **Factor of Safety:**\\n    * F.S. = R.M. / O.M. = 1206 / 352.4 = 3.42",        "correctAnswer": "c"      },      "3": {        "question": "Find the max. and min. pressure intensity (in kPa) at the base of the dam.",        "solution": "* **Eccentricity:**\\n    * x = (R.M. - O.M.) / Ry = (1206 - 352.4) / 493.5 = 1.73\\n    * e = 2 - 1.73 = 0.27\\n\\n* **Minimum Pressure Intensity:**\\n    * Pmin = (Ry / B) * (1 - 6e/B) = (493.5 / 4) * (1 - 6 * 0.27 / 4) = 73.4 kN/m²\\n* **Maximum Pressure Intensity:**\\n    * Pmax = (Ry / B) * (1 + 6e/B) = (493.5 / 4) * (1 + 6 * 0.27 / 4) = 173.34 kN/m²\\n**Therefore:**\\n* The factor of safety against sliding is 1.34.\\n* The factor of safety against overturning is 3.42.\\n* The maximum pressure intensity is 173.34 kN/m².\\n* The minimum pressure intensity is 73.4 kN/m². ",        "correctAnswer": "d"      }    }  }]',
      },
      { text: "input: Diagram/Figures:\n" },
      {
        fileData: {
          mimeType: aiFiles[1].mimeType,
          fileUri: aiFiles[1].uri,
        },
      },
      {
        text: "\n\nProblem:\nA wooden block (Sg = 0.85) is 75 mm x 75 mm x 4 m long is made to float in sea water (Sg = 1.2). \n\nQuestions:\n1. Find the buoyant force (N) of the wood.\n  a.  0.23\n  b. 0.04\n  c. 1.12 \n  d. 2.80\n  e. None\n2. How many kN of Steel (Sg = 7.2) should be attached to the bottom of the block to make the wooden block float with exactly 0.55 m exposed above the sea water surface?\n  a.  0.008 \n  b. 0.78\n  c. 0.29\n  d. 0.05\n  e. None\n3. Find the total volume (m3) of the steel.\n  a.   0.002\n  b. 0.095\n  c. 0.0007\n  d. 0.00002 \n  e. None",
      },
      {
        text: 'output: [\n  {\n    "problem": "A wooden block (Sg = 0.85) is 75 mm x 75 mm x 4 m long is made to float in sea water (Sg = 1.2). Change the length of the wooden block to **2.5 m** and the Specific Gravity of the wooden block to **0.75**.",\n    "questions": {\n      "1": {\n        "question": "Find the buoyant force (N) of the wood.",\n        "choices": {\n          "a": "0.23",\n          "b": "0.04",\n          "c": "1.12",\n          "d": "2.80",\n          "e": "None"\n        }\n      },\n      "2": {\n        "question": "How many kN of Steel (Sg = 7.2) should be attached to the bottom of the block to make the wooden block float with exactly 0.55 m exposed above the sea water surface?",\n        "choices": {\n          "a": "0.008",\n          "b": "0.78",\n          "c": "0.29",\n          "d": "0.05",\n          "e": "None"\n        }\n      },\n      "3": {\n        "question": "Find the total volume (m3) of the steel.",\n        "choices": {\n          "a": "0.002",\n          "b": "0.095",\n          "c": "0.0007",\n          "d": "0.00002",\n          "e": "None"\n        }\n      }\n    },\n    "solution": {\n      "1": {\n        "question": "Find the buoyant force (N) of the wood.",\n        "solution": "* **Volume of the wooden block:**\\nV = (75/1000) * (75/1000) * 2.5 = 0.0140625 m³\\n* **Buoyant force:**\\nFB = V * ρw * g = 0.0140625 * (1.2 * 1000) * 9.81 = 165.22 N",\n        "correctAnswer": "e"\n      },\n      "2": {\n        "question": "How many kN of Steel (Sg = 7.2) should be attached to the bottom of the block to make the wooden block float with exactly 0.55 m exposed above the sea water surface?",\n        "solution": "* **Volume of the wooden block submerged:**\\nVsub = (2.5 - 0.55) * (75/1000) * (75/1000) = 0.0103125 m³\\n* **Weight of the wooden block:**\\nWwood = V * ρwood * g = 0.0140625 * (0.75 * 1000) * 9.81 = 103.12 N\\n* **Weight of the water displaced by the submerged block:**\\nWdisplaced = Vsub * ρwater * g = 0.0103125 * (1.2 * 1000) * 9.81 = 121.56 N\\n* **Weight of the steel required:**\\nWsteel = Wdisplaced - Wwood = 121.56 - 103.12 = 18.44 N\\n* **Weight of the steel in kN:**\\nWsteel (kN) = 18.44 / 1000 = 0.01844 kN",\n        "correctAnswer": "e"\n      },\n      "3": {\n        "question": "Find the total volume (m3) of the steel.",\n        "solution": "* **Volume of steel:**\\nVsteel = Wsteel / (ρsteel * g) = 18.44 / (7.2 * 1000 * 9.81) = 0.00026 m³",\n        "correctAnswer": "e"\n      }\n    }\n  }\n]',
      },
      { text: "input: Diagram/Figures:\n" },

      {
        text: `\n\nProblem:\n${problem} \n\nQuestions:\n${questions}.`,
      },
      { text: "output: " },
    ];

    if (diagramFigure) {
      parts.splice(10, 0, {
        fileData: {
          mimeType: aiFiles[2].mimeType,
          fileUri: aiFiles[2].uri,
        },
      });
    }

    const result = await model.generateContent({
      contents: [{ role: "user", parts }],
      generationConfig,
      // safetySettings: Adjust safety settings
      // See https://ai.google.dev/gemini-api/docs/safety-settings
    });
    // console.log(result.response.text());
    return res.json(JSON.parse(result.response.text()));
  }
}
