import React, { Dispatch, SetStateAction } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Card, CardContent, CardHeader, CardTitle } from "./card";
import LatexMarkdown from "../latex-markdown";
import Loader from "../loader";
import Image from "next/image";

interface Choice {
  a: string;
  b: string;
  c: string;
  d: string;
  e: string;
}

interface Question {
  question: string;
  choices: Choice;
}

interface Solution {
  question: string;
  solution: string;
  correctAnswer: string;
}

interface Problem {
  problem: string;
  questions: { [key: string]: Question };
  solution: { [key: string]: Solution };
}

export default function QuestionsDialog({
  aiResponse,
  images,
  open,
  setModal,
}: {
  aiResponse: Problem[];
  images: string;
  open: boolean;
  setModal: Dispatch<SetStateAction<boolean>>;
}) {
  return (
    <Dialog open={open} onOpenChange={setModal}>
      {/* <DialogTrigger asChild>
        <Button variant="outline">Generated Questions</Button>
      </DialogTrigger> */}

      <DialogContent className="sm:max-w-[425px] overflow-y-scroll max-h-screen">
        <DialogHeader>
          <DialogTitle>Generated Problems</DialogTitle>
        </DialogHeader>
        <div>
          <Image
            src={images}
            width={0}
            height={0}
            sizes="100vw"
            alt="Diagram / Figures"
            style={{ width: "100%", height: "auto" }}
          />
        </div>
        {aiResponse?.map((e, key) => (
          <div key={key} className="grid gap-4 py-4">
            <Card x-chunk="dashboard-01-chunk-0">
              <CardHeader className="flex flex-col  justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Problem</CardTitle>
                <p className="text-xs text-muted-foreground">
                  <LatexMarkdown lmd={e.problem} />
                </p>
              </CardHeader>

              {Object.entries(e.questions).map(([key, value]) => (
                <CardContent key={key}>
                  <CardTitle className="text-sm font-medium">Questions</CardTitle>
                  <div className="m-2">
                    <p className="text-xs">
                      {key}. {value.question}
                    </p>
                    <RadioGroup className="m-5">
                      {Object.entries(value.choices).map(([key, value]) => (
                        <div className="flex items-center space-x-2" key={key}>
                          <RadioGroupItem value={`option-${key}`} id={`option-${key}`} />
                          <Label htmlFor={`option-${key}`}>
                            {key}. {value}
                          </Label>
                        </div>
                      ))}
                    </RadioGroup>
                  </div>
                </CardContent>
              ))}
            </Card>
          </div>
        ))}
        <DialogFooter>
          <Button type="submit">Generate Again</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
