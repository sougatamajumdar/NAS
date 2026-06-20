from rest_framework.exceptions import PermissionDenied


def ensure_owner(node, user):

    if node.owner_id != user.id:

        raise PermissionDenied(
            "Permission denied"
        )