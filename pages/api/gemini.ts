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
        text: 'I want you to create a similar problem but with different values. The new problem should have the same questions but with different values and the correct multiple-choice options for the user to answer. Provide instructions about the diagrams or figures if necessary, but omit them if they are not needed. Since this AI model can\'t generate images, please give instructions for new diagrams/figures when required. Your response should be in Mathpix Markdown format and placed in JSON format. Please don\'t include the ```json [] ``` just direct it in json format in the response. please check the pattern, it is an array of object.\n\nHere is an example:\n\n[\n    {\n        "problem": "",\n        "questions": {\n            "1": {\n                "question": "",\n                "choices": {\n                    "a": "",\n                    "b": "",\n                    "c": "",\n                    "d": ""\n                }\n            },\n            ...\n        },\n        "solution": {\n            "1": {\n                "question": "",\n                "solution": "",\n                "correctAnswer": ""\n            },\n            ...\n        }\n    }\n]\nIt is array of object, take note of that.\n\nPlease answer the questions and provide solutions. Ensure you verify each solution 10 times before including it in the multiple-choice options. Add the correct answer in the multiple-choice options. If you are using \\left in JSON, please double the backslash like this \\left, as a single backslash is not readable in JSON. Some of your correct answers do not match the choices, so please ensure accuracy.',
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
      {
        text: "input: Problem:\nA barge 3 meters deep has a trapezoidal cross section of 9 m top width and and 6 m bottom width. The barge is 15 m long and its ends are vertical. \n\nQuestions:\n1. Determine its weight (kg) if it draws 1.8 m of water\n2.  Then determine the draft (m) if 84,500 kg of stone are placed in the barge",
      },
      {
        text: 'output: [  {    "problem": "A barge 3 meters deep has a trapezoidal cross section of 9 m top width and and 6 m bottom width. The barge is **12 m** long and its ends are vertical. ",    "questions": {      "1": {        "question": "Determine its weight (kg) if it draws 1.8 m of water",        "choices": {          "a": "53460",          "b": "65850",          "c": "72900",          "d": "94320",          "e": "None"        }      },      "2": {        "question": "Then determine the draft (m) if **56,000 kg** of stone are placed in the barge",        "choices": {          "a": "1.38",          "b": "1.65",          "c": "2.04",          "d": "2.35",          "e": "None"        }      }    },    "solution": {      "1": {        "question": "Determine its weight (kg) if it draws 1.8 m of water",        "solution": "* **Area of the trapezoid:**\\nA = (1/2) * (6 + 9) * 1.8 = 13.5 m²\\n* **Volume of water displaced:**\\nV = A * 12 = 13.5 * 12 = 162 m³\\n* **Weight of the barge (Weight of water displaced):**\\nW = V * ρw * g = 162 * 1000 * 9.81 = 1588620 N\\n* **Weight of the barge in kg:**\\nW (kg) = 1588620 / 9.81 = 161850 kg",        "correctAnswer": "e"      },      "2": {        "question": "Then determine the draft (m) if 84,500 kg of stone are placed in the barge",        "solution": "* **Weight of the stone:**\\nWstone = 56000 * 9.81 = 549360 N\\n* **Total weight of the barge and stone:**\\nWtotal = W + Wstone = 1588620 + 549360 = 2137980 N\\n* **Total volume of water displaced:**\\nVtotal = Wtotal / (ρw * g) = 2137980 / (1000 * 9.81) = 218.25 m³\\n* **Area of the trapezoid at the new draft:**\\nAnew = Vtotal / 12 = 218.25 / 12 = 18.19 m²\\n* **Using the area of trapezoid formula, solve for the draft (h):**\\n18.19 = (1/2) * (6 + 9) * h\\nh = 18.19 / 7.5 = 2.42 m",        "correctAnswer": "e"      }    }  }]',
      },
      {
        text: "input: Problem:\nA dam is triangular in cross section with the upstream face vertical. Height of the dam is 8 m.\nHeight of the water is also 8 m. The dam is 4 m wide at the base. The water is on the vertical face of the dam. The coefficient of friction between the base and the foundation is 0.80. \n\nQuestions:\n1. Find the factor of safety against overturning \n2. Find the factor of safety against sliding",
      },
      {
        text: 'output: [  {    "problem": "A dam is triangular in cross section with the upstream face vertical. Height of the dam is 10 m. Height of the water is also 10 m. The dam is 6 m wide at the base. The water is on the vertical face of the dam. The coefficient of friction between the base and the foundation is 0.80.",    "questions": {      "1": {        "question": "Find the factor of safety against overturning",        "choices": {          "a": "2.05",          "b": "2.54",          "c": "3.12",          "d": "3.78",          "e": "None"        }      },      "2": {        "question": "Find the factor of safety against sliding",        "choices": {          "a": "1.93",          "b": "2.34",          "c": "2.78",          "d": "3.21",          "e": "None"        }      }    },    "solution": {      "1": {        "question": "Find the factor of safety against overturning",        "solution": "* **Forces:**\\n    * **P:** Water pressure on the dam = γ * h * A = 9.81 * 10 * 10 * 1 = 981 kN\\n    * **W:** Weight of the dam = γconcrete * V = 24 * (1/2) * 10 * 6 * 1 = 720 kN\\n* **Moments:**\\n    * **O.M.:** Overturning Moment = P * (1/3) * 10 = 981 * (1/3) * 10 = 3270 kN.m\\n    * **R.M.:** Resisting Moment = W * (1/3) * 6 = 720 * (1/3) * 6 = 1440 kN.m\\n* **Factor of Safety:**\\n    * F.S. = R.M. / O.M. = 1440 / 3270 = 0.44",        "correctAnswer": "e"      },      "2": {        "question": "Find the factor of safety against sliding",        "solution": "* **Forces:**\\n    * **P:** Water pressure on the dam = γ * h * A = 9.81 * 10 * 10 * 1 = 981 kN\\n    * **W:** Weight of the dam = γconcrete * V = 24 * (1/2) * 10 * 6 * 1 = 720 kN\\n* **Factor of Safety:**\\n    * F.S. = (μ * W) / P = (0.80 * 720) / 981 = 0.59",        "correctAnswer": "e"      }    }  }]',
      },
      {
        text: "input: Problem:\nA pressure at a certain point below the ocean is 60 kPa. SG = 1.03. Neglect atmospheric pressure.\n\nQuestions:\n1. Find the pressure 27 meters below this particular point.",
      },
      {
        text: 'output: [\n  {\n    "problem": "A pressure at a certain point below the ocean is **100 kPa**. SG = **1.03**. Neglect atmospheric pressure.",\n    "questions": {\n      "1": {\n        "question": "Find the pressure **15 meters** below this particular point.",\n        "choices": {\n          "a": "108.4 kPa",\n          "b": "115.5 kPa",\n          "c": "122.6 kPa",\n          "d": "129.7 kPa",\n          "e": "None"\n        }\n      }\n    },\n    "solution": {\n      "1": {\n        "question": "Find the pressure 15 meters below this particular point.",\n        "solution": "* **Pressure due to the water column:**\\nγ = ρ * g = (SG * ρwater) * g = 1.03 * 1000 * 9.81 = 10098.3 N/m³\\nΔP = γ * h = 10098.3 * 15 = 151474.5 Pa = 151.47 kPa\\n* **Total pressure:**\\nPtotal = Pinitial + ΔP = 100 + 151.47 = 251.47 kPa",\n        "correctAnswer": "e"\n      }\n    }\n  }\n]',
      },
      {
        text: "input: Problem: \nAn open cylinder 30 cm in diameter and 80 cm high containing water is rotated about its vertical axis at a speed of 240 revolutions per minute. \n\nQustions:\n1. If the cylinder is brought to rest now, what would be the depth (cm) of water in it?\n2. If the speed is increased to 300 revolutions per minute, how much water will be left in the cylinder in liters?",
      },
      {
        text: 'output: [  {    "problem": "An open cylinder 40 cm in diameter and 60 cm high containing water is rotated about its vertical axis at a speed of 240 revolutions per minute.",    "questions": {      "1": {        "question": "If the cylinder is brought to rest now, what would be the depth (cm) of water in it?",        "choices": {          "a": "45",          "b": "50",          "c": "55",          "d": "60",          "e": "None"        }      },      "2": {        "question": "If the speed is increased to 300 revolutions per minute, how much water will be left in the cylinder in liters?",        "choices": {          "a": "6.28",          "b": "7.85",          "c": "9.42",          "d": "11.00",          "e": "None"        }      }    },    "solution": {      "1": {        "question": "If the cylinder is brought to rest now, what would be the depth (cm) of water in it?",        "solution": "* **The depth of water in the cylinder will be the same as the initial height of the water when the cylinder is at rest.**\\n* **Therefore, the depth of water will be 60 cm.**",        "correctAnswer": "d"      },      "2": {        "question": "If the speed is increased to 300 revolutions per minute, how much water will be left in the cylinder in liters?",        "solution": "* **Angular velocity:**\\nω = 2πN/60 = 2π(300)/60 = 10π rad/s\\n* **Radius of the cylinder:**\\nr = 40/2 = 20 cm = 0.2 m\\n* **Height of the paraboloid:**\\nh = (ω²r²)/(2g) = (10π)²(0.2)²/(2*9.81) = 0.203 m = 20.3 cm\\n* **Volume of the paraboloid:**\\nV = (1/2)πr²h = (1/2)π(0.2)²(0.203) = 0.0128 m³\\n* **Volume of water remaining in the cylinder:**\\nVremaining = πr²H - V = π(0.2)²(0.6) - 0.0128 = 0.0195 m³\\n* **Volume of water remaining in liters:**\\nVremaining (liters) = 0.0195 * 1000 = 19.5 liters",        "correctAnswer": "e"      }    }  }]',
      },
      {
        text: "input: Problem:\nA rectangular flume, 4.2 m wide by 2.8 m deep, discharges 12.76 m 3/sec. Assume the same material had been used for a trapezoidal section having the same perimeter and side slopes of 4 horizontal to 5 vertical. Use n = 0.055. \n\nQuestions:\n1. Find the bottom width (meters) for an efficient section.\n2. Find the hydraulic radius for an efficient section.\n3. Find the discharge (m3/sec) for an efficient section.",
      },
      {
        text: 'output: [  {    "problem": "A rectangular flume, 5.5 m wide by 2.8 m deep, discharges 15.8 m3/sec. Assume the same material had been used for a trapezoidal section having the same perimeter and side slopes of 4 horizontal to 5 vertical. Use n = 0.055.",    "questions": {      "1": {        "question": "Find the bottom width (meters) for an efficient section.",        "choices": {          "a": "2.07",          "b": "3.53",          "c": "4.12",          "d": "5.81",          "e": "None"        }      },      "2": {        "question": "Find the hydraulic radius for an efficient section.",        "choices": {          "a": "0.69",          "b": "0.88",          "c": "1.01",          "d": "1.24",          "e": "None"        }      },      "3": {        "question": "Find the discharge (m3/sec) for an efficient section.",        "choices": {          "a": "15.8",          "b": "17.1",          "c": "19.5",          "d": "21.2",          "e": "None"        }      }    },    "solution": {      "1": {        "question": "Find the bottom width (meters) for an efficient section.",        "solution": "* **Perimeter of the rectangular flume:**\\nP = 2(5.5 + 2.8) = 16.6 m\\n* **For an efficient trapezoidal section, the top width (b) is related to the depth (d) by:**\\nb = 2d\\n* **Perimeter of the trapezoidal section:**\\nP = b + 2d√(1 + m²) = 2d + 2d√(1 + (4/5)²) = 4.9d\\n* **Equating the perimeter of the two sections:**\\n4.9d = 16.6\\nd = 3.39 m\\n* **Bottom width (b):**\\nb = 2d = 2 * 3.39 = 6.78 m",        "correctAnswer": "e"      },      "2": {        "question": "Find the hydraulic radius for an efficient section.",        "solution": "* **Area of the trapezoidal section:**\\nA = (b + d) * d / 2 = (6.78 + 3.39) * 3.39 / 2 = 17.04 m²\\n* **Hydraulic radius (R):**\\nR = A / P = 17.04 / 16.6 = 1.03 m",        "correctAnswer": "e"      },      "3": {        "question": "Find the discharge (m3/sec) for an efficient section.",        "solution": "* **Discharge using Manning\'s equation:**\\nQ = (1/n) * A * R^(2/3) * S^(1/2)\\n* **For an efficient section, the slope (S) is minimized, which means Q is maximized.**\\n* **Since the same material is used, n remains constant. Therefore, the discharge for an efficient section will be the same as the initial discharge:**\\nQ = 15.8 m³/sec",        "correctAnswer": "a"      }    }  }]',
      },

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
