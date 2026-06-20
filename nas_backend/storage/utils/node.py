from models import Node

def get_parent_folder(
    parent_id,
    user_id
):
    if not parent_id:
        return None

    try:
        parent = Node.objects.get(
            id=parent_id,
            owner_id=user_id
        )

    except Node.DoesNotExist:

        raise ValueError(
            "Parent folder not found"
        )

    if parent.type != "FOLDER":

        raise ValueError(
            "Parent must be a folder"
        )

    return parent