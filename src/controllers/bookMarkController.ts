import { Request, Response } from "express";
import BookMarks from "../models/BookMarks.js";

export const getBookMark = async (
  req: Request,
  res: Response
): Promise<void> => {
  const bookMarks = await BookMarks.find();

  res.status(200).json(bookMarks);
};
