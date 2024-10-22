#!/usr/bin/python3
import random
from datetime import datetime, timedelta
import uuid
import hashlib
from typing import List, Dict, Any

# Constants for data generation
NUM_USERS = 50
NUM_POSTS = 500
NUM_COMMENTS = 1000
NUM_LIKES = 1500
NUM_FOLLOWERS = 200
NUM_BOOKMARKS = 300
NUM_SERIES = 30

# Helper functions
def generate_uuid():
    return str(uuid.uuid4())

def generate_date(start_date: datetime, end_date: datetime) -> datetime:
    time_between_dates = end_date - start_date
    days_between_dates = time_between_dates.days
    random_number_of_days = random.randrange(days_between_dates)
    return start_date + timedelta(days=random_number_of_days)

def hash_password(password: str) -> str:
    return hashlib.sha256(password.encode()).hexdigest()

# Data generators
def generate_users(num_users: int) -> List[Dict[str, Any]]:
    users = []
    for i in range(num_users):
        user_id = generate_uuid()
        firstname = f"FirstName{i}"
        lastname = f"LastName{i}"
        username = f"user{i}"
        users.append({
            "id": user_id,
            "email": f"user{i}@example.com",
            "firstname": firstname,
            "lastname": lastname,
            "username": username,
            "password": hash_password(f"password{i}"),
            "avatarUrl": f"https://avatar.example.com/{i}.jpg" if random.random() > 0.5 else None,
            "facebookLink": f"https://facebook.com/{username}" if random.random() > 0.7 else None,
            "instagramLink": f"https://instagram.com/{username}" if random.random() > 0.7 else None,
            "xLink": f"https://x.com/{username}" if random.random() > 0.7 else None,
            "twitchLink": f"https://twitch.tv/{username}" if random.random() > 0.8 else None,
            "youtubeLink": f"https://youtube.com/{username}" if random.random() > 0.8 else None,
            "isValid": random.random() > 0.1,
            "createdAt": generate_date(datetime(2023, 1, 1), datetime(2024, 3, 1)),
        })
    return users

def generate_series(users: List[Dict[str, Any]], num_series: int) -> List[Dict[str, Any]]:
    series = []
    for i in range(num_series):
        owner = random.choice(users)
        series.append({
            "id": generate_uuid(),
            "title": f"Series {i}",
            "ownerId": owner["id"],
            "createdAt": generate_date(owner["createdAt"], datetime(2024, 3, 1)),
        })
    return series

def generate_posts(users: List[Dict[str, Any]], series: List[Dict[str, Any]], num_posts: int) -> List[Dict[str, Any]]:
    posts = []
    for i in range(num_posts):
        author = random.choice(users)
        series_entry = random.choice(series + [None] * 3)  # 25% chance of being in a series
        posts.append({
            "id": generate_uuid(),
            "authorId": author["id"],
            "bannerUrl": f"https://banner.example.com/{i}.jpg" if random.random() > 0.3 else None,
            "title": f"Post Title {i}",
            "content": f"This is the content for post {i}. It contains meaningful information...",
            "published": random.random() > 0.1,
            "readTime": random.randint(1, 20),
            "seriesId": series_entry["id"] if series_entry else None,
            "createdAt": generate_date(author["createdAt"], datetime(2024, 3, 1)),
        })
    return posts

def generate_comments(users: List[Dict[str, Any]], posts: List[Dict[str, Any]], num_comments: int) -> List[Dict[str, Any]]:
    comments = []
    base_comments = num_comments // 2  # Half will be base comments, half will be replies
    
    # Generate base comments
    for i in range(base_comments):
        user = random.choice(users)
        post = random.choice(posts)
        comments.append({
            "id": generate_uuid(),
            "userId": user["id"],
            "postId": post["id"],
            "comment": f"This is comment {i} on the post.",
            "parentId": None,
            "createdAt": generate_date(post["createdAt"], datetime(2024, 3, 1)),
        })
    
    # Generate reply comments
    for i in range(base_comments, num_comments):
        user = random.choice(users)
        parent_comment = random.choice(comments[:base_comments])
        comments.append({
            "id": generate_uuid(),
            "userId": user["id"],
            "postId": parent_comment["postId"],
            "comment": f"This is a reply to comment {i}.",
            "parentId": parent_comment["id"],
            "createdAt": generate_date(parent_comment["createdAt"], datetime(2024, 3, 1)),
        })
    
    return comments

def generate_post_likes(users: List[Dict[str, Any]], posts: List[Dict[str, Any]], num_likes: int) -> List[Dict[str, Any]]:
    likes = []
    user_post_pairs = set()
    
    while len(likes) < num_likes:
        user = random.choice(users)
        post = random.choice(posts)
        pair = (user["id"], post["id"])
        
        if pair not in user_post_pairs:
            user_post_pairs.add(pair)
            likes.append({
                "id": generate_uuid(),
                "userId": user["id"],
                "postId": post["id"],
                "isLiked": True,
                "createdAt": generate_date(post["createdAt"], datetime(2024, 3, 1)),
            })
    
    return likes

def generate_comment_likes(users: List[Dict[str, Any]], comments: List[Dict[str, Any]], num_likes: int) -> List[Dict[str, Any]]:
    likes = []
    user_comment_pairs = set()
    
    while len(likes) < num_likes:
        user = random.choice(users)
        comment = random.choice(comments)
        pair = (user["id"], comment["id"])
        
        if pair not in user_comment_pairs:
            user_comment_pairs.add(pair)
            likes.append({
                "id": generate_uuid(),
                "userId": user["id"],
                "commentId": comment["id"],
                "isLiked": True,
                "createdAt": generate_date(comment["createdAt"], datetime(2024, 3, 1)),
            })
    
    return likes

def generate_followers(users: List[Dict[str, Any]], num_followers: int) -> List[Dict[str, Any]]:
    followers = []
    user_follower_pairs = set()
    
    while len(followers) < num_followers:
        user = random.choice(users)
        follower = random.choice(users)
        
        if user["id"] != follower["id"]:
            pair = (user["id"], follower["id"])
            if pair not in user_follower_pairs:
                user_follower_pairs.add(pair)
                followers.append({
                    "id": generate_uuid(),
                    "userId": user["id"],
                    "followingId": follower["id"],
                    "createdAt": generate_date(max(user["createdAt"], follower["createdAt"]), datetime(2024, 3, 1)),
                })
    
    return followers

def generate_bookmarks(users: List[Dict[str, Any]], posts: List[Dict[str, Any]], num_bookmarks: int) -> List[Dict[str, Any]]:
    bookmarks = []
    user_post_pairs = set()
    
    while len(bookmarks) < num_bookmarks:
        user = random.choice(users)
        post = random.choice(posts)
        pair = (user["id"], post["id"])
        
        if pair not in user_post_pairs:
            user_post_pairs.add(pair)
            bookmarks.append({
                "id": generate_uuid(),
                "userId": user["id"],
                "postId": post["id"],
                "createdAt": generate_date(post["createdAt"], datetime(2024, 3, 1)),
            })
    
    return bookmarks

# Generate all data
users = generate_users(NUM_USERS)
series = generate_series(users, NUM_SERIES)
posts = generate_posts(users, series, NUM_POSTS)
comments = generate_comments(users, posts, NUM_COMMENTS)
post_likes = generate_post_likes(users, posts, NUM_LIKES)
comment_likes = generate_comment_likes(users, comments, NUM_LIKES)
followers = generate_followers(users, NUM_FOLLOWERS)
bookmarks = generate_bookmarks(users, posts, NUM_BOOKMARKS)

# Create the final seed data dictionary
seed_data = {
    "users": users,
    "series": series,
    "posts": posts,
    "comments": comments,
    "post_likes": post_likes,
    "comment_likes": comment_likes,
    "followers": followers,
    "bookmarks": bookmarks,
}

# Optional: Print some statistics
print(f"Generated data statistics:")
for key, value in seed_data.items():
    print(f"{key}: {len(value)} records")

# Optional: Save to a file
import json
with open('seed_data.json', 'w') as f:
    json.dump(seed_data, f, default=str)  # default=str handles datetime serialization
