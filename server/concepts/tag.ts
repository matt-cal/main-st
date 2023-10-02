import { ObjectId } from "mongodb";
import { BaseDoc } from "../framework/doc";

export enum TagType {
  post = "post",
  account = "account",
}

export interface TagDoc extends BaseDoc {
  target: ObjectId;
  name: string;
}
