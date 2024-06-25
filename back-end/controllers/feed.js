const { validationResult } = require("express-validator");
const Post = require("../models/post");
const User = require("../models/user");
const path = require("path");
const fs = require("fs");
const mongoose = require("mongoose");

exports.getPosts = async (req, res, next) => {
  try {
    const currentPage = req.query.page;
    const perPage = 2;
    const totalItems = await Post.countDocuments();

    const posts = await Post.find()
      .skip((currentPage - 1) * perPage)
      .limit(perPage);

    res.status(200).json({
      message: "Fetched posts successfully.",
      posts: posts,
      totalItems: totalItems,
    });
  } catch (err) {
    if (!err.statusCode) {
      err.statusCode = 500;
    }
    next(err);
  }
};

exports.createPost = async (req, res, next) => {
  try {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      return res.status(422).json({
        message: "Validation faild, your entered data is invalid",
        errors: errors.array(),
      });
    }

    if (!req.file) {
      const error = new Error("Please upload a file");
      error.statusCode = 422;
      throw error;
    }

    const title = req.body.title;
    const content = req.body.content;

    const post = new Post({
      title: title,
      content: content,
      imageUrl: req.file.path,
      creator: req.userId,
    });

    const postResult = await post.save();

    const user = await User.findById(req.userId);

    user.posts.push(postResult);

    const creator = await user.save();

    res.status(201).json({
      message: "Post Created Successfully",
      post: postResult,
      creator: creator,
    });
  } catch (err) {
    if (!err.statusCode) {
      err.statusCode = 500;
    }
    next(err);
  }
};

exports.getPost = async (req, res, next) => {
  try {
    const postId = req.params.postId;
    const post = await Post.findById(postId).populate("creator", "name");

    if (!post) {
      const error = new Error("Could not find post.");
      error.statusCode = 404;
      throw error;
    }
    res.status(200).json({ message: "Post fetched.", post: post });
  } catch (err) {
    if (!err.statusCode) {
      err.statusCode = 500;
    }
    next(err);
  }
};

exports.updatePost = async (req, res, next) => {
  try {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      return res.status(422).json({
        message: "Validation faild, your entered data is invalid",
        errors: errors.array(),
      });
    }

    const postId = req.params.postId;
    const title = req.body.title;
    const content = req.body.content;
    let imageUrl = req.body.image;

    if (req.file) {
      imageUrl = req.file.path;
    }

    // if (!imageUrl || imageUrl == 'undefined') {

    //   const error = new Error("Please upload a imageFile");
    //   error.statusCode = 422;
    //   throw error;
    // }

    const post = await Post.findById(postId);

    if (!post) {
      const error = new Error("Could not find post.");
      error.statusCode = 404;
      throw error;
    }

    if (post.creator.toString() != req.userId) {
      const error = new Error("not authorized");
      error.statusCode = 403;
      throw error;
    }

    if (imageUrl != post.imageUrl && imageUrl != "undefined") {
      clearImage(post.imageUrl);
      post.imageUrl = imageUrl;
    }

    post.title = title;
    post.content = content;

    await post.save();
    res.status(200).json({
      message: "Post Updated Successfully",
      post: post,
    });
  } catch (err) {
    if (!err.statusCode) {
      err.statusCode = 500;
    }
    next(err);
  }
};

exports.deletePost = async (req, res, next) => {
  try {
    const postId = req.params.postId;

    const post = await Post.findById(postId);

    if (!post) {
      const error = new Error("Could not find post.");
      error.statusCode = 404;
      throw error;
    }

    if (post.creator.toString() != req.userId) {
      const error = new Error("not authorized");
      error.statusCode = 403;
      throw error;
    }

    clearImage(post.imageUrl);

    await post.remove();

    const user = await User.findById(req.userId);

    user.posts.pull(mongoose.Types.ObjectId(postId));

    await user.save();

    //  const deletedPost = await Post.findByIdAndDelete(postId);

    return res.status(200).json({ message: "Post deleted successfully." });
  } catch (err) {
    if (!err.statusCode) {
      err.statusCode = 500;
    }
    next(err);
  }
};

const clearImage = (filePath) => {
  filepath = path.join(__dirname, "..", filePath);

  if (fs.existsSync(filepath)) {
    fs.unlinkSync(filepath);

    console.log("Image deleted successfully");
  } else {
    console.log("Image not found");
  }
};
