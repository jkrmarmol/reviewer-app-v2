"use client";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { useState } from "react";
import axios, { AxiosError } from "axios";
import QuestionsDialog from "@/components/ui/questions-dialog";
import aiJson from "./aiResponse.json";
import { useForm } from "react-hook-form";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Loader from "@/components/loader";
import { Loader2 } from "lucide-react";

const formSchema = z.object({
  diagramFigure: z.any(),
  problem: z.string(),
  questions: z.string(),
});

export default function Home() {
  const [modal, setModal] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [data, setData] = useState<any>({
    data: [],
    images: "",
  });
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    try {
      setLoading(true);
      const formData = new FormData();
      formData.append("diagramFigure", values.diagramFigure);
      formData.append("problem", values.problem);
      formData.append("questions", values.questions);
      const response = await axios.post("/api/gemini", formData);
      const responseJson = await response.data;
      setLoading(false);
      setModal(true);
      setData((prev: any) => ({ ...prev, data: responseJson }));
    } catch (err) {
      if (AxiosError) {
      }
    }
  }

  return (
    <div className=" border border-red-500 h-screen flex justify-center items-center flex-col">
      <QuestionsDialog aiResponse={data.data} open={modal} setModal={setModal} images={data.images} />
      <Card className="w-[350px]">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <CardHeader>
              <CardTitle>Reviewer App</CardTitle>
              <CardDescription>Generate the same reviewer exam by simply inserting sample problem </CardDescription>
            </CardHeader>
            <CardContent>
              <FormField
                control={form.control}
                name="diagramFigure"
                render={({ field: { value, onChange, ...fieldProps } }) => (
                  <FormItem>
                    <FormLabel>Diagram/Figure</FormLabel>
                    <FormControl>
                      <Input
                        {...fieldProps}
                        placeholder="Picture"
                        type="file"
                        accept="image/*, application/pdf"
                        onChange={(e) => {
                          const files = (e.target as HTMLInputElement).files;
                          if (files && files.length > 0) {
                            const file = files[0];
                            const objectUrl = URL.createObjectURL(file);
                            console.log(objectUrl);
                            setData((prev: any) => ({ ...prev, images: objectUrl }));
                            // Use onChange to update the form value with the file
                            onChange(file);
                            // You can also store or display the objectUrl as needed
                          }
                        }}
                      />
                      {/* <Input type="image" placeholder="sdfsdf" onChange={(e) => console.log(e)} {...field} /> */}
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="problem"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Problem</FormLabel>
                    <FormControl>
                      {/* <Input placeholder="shadcn" {...field} /> */}
                      <Textarea placeholder="Type you problem here." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="questions"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Questions</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Type you questions here." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* <form>
            <div className="grid w-full items-center gap-4">
              <div className="flex flex-col space-y-1.5">
                <Label htmlFor="diagramFigure">Diagram/Figure</Label>
                <Input
                  id="diagramFigure"
                  type="file"
                  onChange={(e) => {
                    console.log(e.target.files);
                    setData((prev) => ({ ...prev, diagramFigure: e.target?.files }));
                  }}
                />
              </div>
              <div className="flex flex-col space-y-1.5">
                <Label htmlFor="problem">Problem</Label>
                <Input
                  id="problem"
                  placeholder=""
                  onChange={(e) => setData((prev) => ({ ...prev, problem: e.target?.value }))}
                />
              </div>
              <div className="flex flex-col space-y-1.5">
                <Label htmlFor="questions">Questions</Label>
                <Textarea
                  placeholder="Type you questions here."
                  onChange={(e) => setData((prev) => ({ ...prev, questions: e.target?.value }))}
                />
              </div>
            </div>
          </form> */}
            </CardContent>
            <CardFooter className="flex justify-between">
              {loading ? (
                <Button disabled>
                  <Loader2 className=" animate-spin" />
                </Button>
              ) : (
                <Button type="submit">Generate</Button>
              )}
            </CardFooter>
          </form>
        </Form>
      </Card>
    </div>
  );
}
