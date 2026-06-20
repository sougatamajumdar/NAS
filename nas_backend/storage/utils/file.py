import mimetypes
from io import BytesIO
from django.http import FileResponse
from PIL import Image

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