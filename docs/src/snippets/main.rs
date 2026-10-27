struct Post {
    title: &'static str,
    draft: bool,
}

// Print the titles of all published posts.
fn main() {
    let posts = [
        Post {
            title: "Hello world",
            draft: false,
        },
        Post {
            title: "Coming soon",
            draft: true,
        },
    ];

    for post in posts.iter().filter(|post| !post.draft) {
        println!("{}", post.title);
    }
}
