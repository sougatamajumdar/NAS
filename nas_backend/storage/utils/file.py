import mimetypes
from io import BytesIO
from django.http import FileResponse
from PIL import Image
from moviepy import VideoFileClip
import os

def get_mime_type(filename):

    mime, _ = mimetypes.guess_type(
        filename
    )

    return (
        mime
        or
        "application/octet-stream"
    )


def is_image(filename):

    mime = get_mime_type(
        filename
    )

    return mime.startswith(
        "image/"
    )


def generate_thumbnail(file_path):

    image = Image.open(file_path)

    image.thumbnail((400, 400))

    buffer = BytesIO()

    image.save(
        buffer,
        format="WEBP",
        quality=70
    )

    buffer.seek(0)

    response = FileResponse(
        buffer,
        content_type="image/webp"
    )

    response["Cache-Control"] = (
        "public,max-age=86400"
    )

    return response

def generate_video_thumbnail(
    video_path,
    thumbnail_path
):

    clip = VideoFileClip(video_path)

    frame = clip.get_frame(1)

    image = Image.fromarray(frame)

    image.thumbnail((300, 300))

    image.save(
        thumbnail_path,
        "JPEG",
        quality=85
    )

    clip.close()

    return thumbnail_path