import { User } from "./app";
import { FavoriteDoc } from "./concepts/favorite";
import { AlreadyFriendsError, FriendNotFoundError, FriendRequestAlreadyExistsError, FriendRequestDoc, FriendRequestNotFoundError } from "./concepts/friend";
import { LikeDoc } from "./concepts/like";
import { PostAuthorNotMatchError, PostDoc } from "./concepts/post";
import { Router } from "./framework/router";

/**
 * This class does useful conversions for the frontend.
 * For example, it converts a {@link PostDoc} into a more readable format for the frontend.
 */
export default class Responses {
  /**
   * Convert PostDoc into more readable format for the frontend by converting the author id into a username.
   */
  static async post(post: PostDoc | null) {
    if (!post) {
      return post;
    }
    const author = await User.getUserById(post.author);
    return { ...post, author: author.username };
  }

  /**
   * Same as {@link post} but for an array of PostDoc for improved performance.
   */
  static async posts(posts: PostDoc[]) {
    const authors = await User.idsToUsernames(posts.map((post) => post.author));
    return posts.map((post, i) => ({ ...post, author: authors[i] }));
  }

  /**
   * Convert FriendRequestDoc into more readable format for the frontend
   * by converting the ids into usernames.
   */
  static async friendRequests(requests: FriendRequestDoc[]) {
    const from = requests.map((request) => request.from);
    const to = requests.map((request) => request.to);
    const usernames = await User.idsToUsernames(from.concat(to));
    return requests.map((request, i) => ({ ...request, from: usernames[i], to: usernames[i + requests.length] }));
  }

  /**
   * Convert FavoriteDoc into more readable format for the frontend by converting the owner id into username
   */
  static async favorite(favorite: FavoriteDoc | null) {
    if (!favorite) {
      return favorite;
    }
    const owner = await User.getUserById(favorite.owner);
    const target = await User.getUserById(favorite.target);
    return { ...favorite, owner: owner.username, target: target.username };
  }

  /**
   * Same as {@link favorite} but for an array of FavoriteDoc
   */
  static async favorites(favorites: FavoriteDoc[]) {
    const owners = await User.idsToUsernames(favorites.map((favorite) => favorite.owner));
    const targets = await User.idsToUsernames(favorites.map((favorite) => favorite.target));
    return favorites.map((favorite, i) => ({ ...favorite, owner: owners[i], target: targets[i] }));
  }

  /**
   * Convert LikeDoc into more readable format for the frontend by converting the owner id into username
   */
  static async like(like: LikeDoc | null) {
    if (!like) {
      return like;
    }
    const owner = await User.getUserById(like.owner);
    return { ...like, owner: owner.username };
  }

  /**
   * Same as {@link like} but for an array of FavoriteDoc
   */
  static async likes(likes: LikeDoc[]) {
    const owners = await User.idsToUsernames(likes.map((like) => like.owner));
    return likes.map((like, i) => ({ ...like, owner: owners[i] }));
  }
}

Router.registerError(PostAuthorNotMatchError, async (e) => {
  const username = (await User.getUserById(e.author)).username;
  return e.formatWith(username, e._id);
});

Router.registerError(FriendRequestAlreadyExistsError, async (e) => {
  const [user1, user2] = await Promise.all([User.getUserById(e.from), User.getUserById(e.to)]);
  return e.formatWith(user1.username, user2.username);
});

Router.registerError(FriendNotFoundError, async (e) => {
  const [user1, user2] = await Promise.all([User.getUserById(e.user1), User.getUserById(e.user2)]);
  return e.formatWith(user1.username, user2.username);
});

Router.registerError(FriendRequestNotFoundError, async (e) => {
  const [user1, user2] = await Promise.all([User.getUserById(e.from), User.getUserById(e.to)]);
  return e.formatWith(user1.username, user2.username);
});

Router.registerError(AlreadyFriendsError, async (e) => {
  const [user1, user2] = await Promise.all([User.getUserById(e.user1), User.getUserById(e.user2)]);
  return e.formatWith(user1.username, user2.username);
});
