import { Filter, ObjectId } from "mongodb";
import DocCollection, { BaseDoc } from "../framework/doc";
import { NotAllowedError, NotFoundError } from "./errors";

export enum LikeType {
  like = "like",
  dislike = "dislike",
}

export interface LikeDoc extends BaseDoc {
  owner: ObjectId;
  post: ObjectId;
  type: LikeType;
}

export default class LikeConcept {
  public readonly likes = new DocCollection<LikeDoc>("likes");

  async create(owner: ObjectId, post: ObjectId, type: LikeType) {
    const oldLikes = await this.getLikes({ owner, post });
    if (oldLikes.length !== 0) {
      throw new LikeExistsError(owner, post);
    }
    const _id = await this.likes.createOne({ owner, post, type });
    return { msg: "Liked successfully!", like: await this.likes.readOne({ _id }) };
  }

  async update(_id: ObjectId, newType: LikeType) {
    await this.likes.updateOne({ _id }, { type: newType });
    return { msg: "Like updated successfully!" };
  }

  async getLikes(query: Filter<LikeDoc>) {
    const likes = await this.likes.readMany(query, {
      sort: { dateUpdated: -1 },
    });
    return likes;
  }

  async getByOwner(owner: ObjectId, type: LikeType) {
    return await this.getLikes({ owner, type });
  }

  async getByPost(post: ObjectId, type: LikeType) {
    return await this.getLikes({ post, type });
  }

  /**
   * Return true if like (or dislike) exists on given post with given owner, false otherwise
   */
  async didUserLike(post: ObjectId, owner: ObjectId, type: LikeType) {
    const likes = await this.getLikes({ post, owner, type });
    return likes.length > 0;
  }

  async delete(_id: ObjectId) {
    await this.likes.deleteOne({ _id });
    return { msg: "Like deleted successfully!" };
  }

  // assert like with given id exists and the owner is given user
  async isOwner(user: ObjectId, _id: ObjectId) {
    const like = await this.likes.readOne({ _id });
    if (!like) {
      throw new NotFoundError(`Favorite ${_id} does not exist!`);
    }
    if (like.owner.toString() !== user.toString()) {
      throw new LikeOwnerNotMatchError(user, _id);
    }
  }
}

export class LikeExistsError extends NotAllowedError {
  constructor(
    public readonly owner: ObjectId,
    public readonly post: ObjectId,
  ) {
    super("{0} already liked post {1}!", owner, post);
  }
}

export class LikeOwnerNotMatchError extends NotAllowedError {
  constructor(
    public readonly owner: ObjectId,
    public readonly _id: ObjectId,
  ) {
    super("{0} is not the owner of like {1}!", owner, _id);
  }
}
