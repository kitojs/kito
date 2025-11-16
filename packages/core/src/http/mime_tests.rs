#[cfg(test)]
mod tests {
    use super::super::mime::get_mime_type;

    #[test]
    fn test_html_mime_types() {
        assert_eq!(get_mime_type("index.html"), "text/html");
        assert_eq!(get_mime_type("page.htm"), "text/html");
    }

    #[test]
    fn test_css_mime_type() {
        assert_eq!(get_mime_type("styles.css"), "text/css");
    }

    #[test]
    fn test_javascript_mime_types() {
        assert_eq!(get_mime_type("app.js"), "application/javascript");
        assert_eq!(get_mime_type("module.mjs"), "application/javascript");
    }

    #[test]
    fn test_json_mime_type() {
        assert_eq!(get_mime_type("data.json"), "application/json");
    }

    #[test]
    fn test_image_mime_types() {
        assert_eq!(get_mime_type("photo.png"), "image/png");
        assert_eq!(get_mime_type("photo.jpg"), "image/jpeg");
        assert_eq!(get_mime_type("photo.jpeg"), "image/jpeg");
        assert_eq!(get_mime_type("icon.gif"), "image/gif");
        assert_eq!(get_mime_type("logo.svg"), "image/svg+xml");
        assert_eq!(get_mime_type("image.webp"), "image/webp");
    }

    #[test]
    fn test_font_mime_types() {
        assert_eq!(get_mime_type("font.woff"), "font/woff2");
        assert_eq!(get_mime_type("font.woff2"), "font/woff2");
        assert_eq!(get_mime_type("font.ttf"), "font/ttf");
        assert_eq!(get_mime_type("font.otf"), "font/otf");
    }

    #[test]
    fn test_video_mime_types() {
        assert_eq!(get_mime_type("video.mp4"), "video/mp4");
        assert_eq!(get_mime_type("video.webm"), "video/webm");
    }

    #[test]
    fn test_audio_mime_types() {
        assert_eq!(get_mime_type("song.mp3"), "audio/mpeg");
        assert_eq!(get_mime_type("sound.wav"), "audio/wav");
    }

    #[test]
    fn test_default_mime_type() {
        assert_eq!(get_mime_type("file.unknown"), "application/octet-stream");
        assert_eq!(get_mime_type("no_extension"), "application/octet-stream");
    }

    #[test]
    fn test_case_insensitive() {
        assert_eq!(get_mime_type("FILE.HTML"), "text/html");
        assert_eq!(get_mime_type("IMAGE.PNG"), "image/png");
        assert_eq!(get_mime_type("Script.JS"), "application/javascript");
    }

    #[test]
    fn test_path_with_directories() {
        assert_eq!(get_mime_type("/path/to/file.html"), "text/html");
        assert_eq!(get_mime_type("../assets/image.png"), "image/png");
    }
}
