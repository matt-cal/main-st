import FavoriteConcept from "./concepts/favorite";
import FriendConcept from "./concepts/friend";
import LikeConcept from "./concepts/like";
import PostConcept from "./concepts/post";
import TagConcept from "./concepts/tag";
import UserConcept from "./concepts/user";
import WebSessionConcept from "./concepts/websession";

// App Definition using concepts
export const WebSession = new WebSessionConcept();
export const User = new UserConcept();
export const Post = new PostConcept();
export const Friend = new FriendConcept();
export const Favorite = new FavoriteConcept();
export const Like = new LikeConcept();
export const Tag = new TagConcept();
