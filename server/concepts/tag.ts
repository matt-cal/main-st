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
    for (const target of tag.targets) {
      // item should not already be in tag's targets
      if (target.toString() === item.toString()) {
        throw new TagAlreadyAppliedError(item, name);
      }
      newItemSet.push(target);
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

  async getTagsWithItem(item: ObjectId) {
    const tags = await this.getTags({ targets: item });
    return tags;
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

export class TagAlreadyAppliedError extends NotAllowedError {
  constructor(
    public readonly item: ObjectId,
    public readonly tag: string,
  ) {
    super('{0} already has the tag  "{1}"!', item, tag);
  }
}
