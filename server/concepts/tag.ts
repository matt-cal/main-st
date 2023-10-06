import { Filter, ObjectId } from "mongodb";
import DocCollection, { BaseDoc } from "../framework/doc";
import { BadValuesError, NotAllowedError, NotFoundError } from "./errors";

export interface TagDoc extends BaseDoc {
  targets: ObjectId[];
  name: string;
}

export default class TagConcept {
  public readonly tags = new DocCollection<TagDoc>("tags");

  async create(name: string) {
    if (!name) {
      throw new BadValuesError("Name must be non-empty!");
    }
    await this.isNameUnique(name);
    const _id = await this.tags.createOne({ targets: [], name });
    return { msg: "Tag created successfully!", tag: await this.tags.readOne({ _id }) };
  }

  async addItem(name: string, item: ObjectId) {
    const tag = await this.getByName(name);
    const newItemSet: ObjectId[] = [];

    // did not want to work with .concat()
    for (const item of tag.targets) {
      newItemSet.push(item);
    }
    newItemSet.push(item);

    await this.tags.updateOne({ _id: tag._id }, { targets: newItemSet });
    return { msg: "Applied tag successfully!" };
  }

  async removeItem(name: string, item: ObjectId) {
    const tag = await this.getByName(name);
    const newItemSet = tag.targets.filter((id) => id.toString() !== item.toString()); // keep all that are not item

    await this.tags.updateOne({ _id: tag._id }, { targets: newItemSet });
    return { msg: "Removed tag successfully!" };
  }

  async delete(_id: ObjectId) {
    await this.tags.deleteOne({ _id });
    return { msg: "Tag deleted!" };
  }

  async getTags(query: Filter<TagDoc>) {
    const tags = await this.tags.readMany(query, {
      sort: { dateUpdated: -1 },
    });
    return tags;
  }

  async getItemsByTag(name: string) {
    const tag = await this.getByName(name);
    return tag.targets;
  }

  async getByName(name: string) {
    const tag = await this.tags.readOne({ name });
    if (tag === null) {
      throw new NotFoundError(`Tag not found!`);
    }
    return tag;
  }

  private async isNameUnique(name: string) {
    if (await this.tags.readOne({ name })) {
      throw new NotAllowedError(`Tag with name ${name} already exists!`);
    }
  }
}
