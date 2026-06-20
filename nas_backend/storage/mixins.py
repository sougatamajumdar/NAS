from django.http import Http404
from rest_framework.response import Response

from .models import Node, UploadSession


class NodeMixin:

    def get_node(
        self,
        node_id,
        owner_id=None,
        node_type=None
    ):
        query = {"id": node_id}

        if owner_id:
            query["owner_id"] = owner_id

        if node_type:
            query["type"] = node_type

        try:
            return Node.objects.get(**query)

        except Node.DoesNotExist:
            raise Http404("Node not found")

    def check_node_access(
        self,
        node,
        user
    ):
        from .models import Share

        if node.owner_id == user.id:
            return True

        shared = Share.objects.filter(
            node=node,
            shared_with_id=user.id
        ).first()

        return bool(shared)


class UploadSessionMixin:

    def get_upload_session(
        self,
        upload_id,
        user_id
    ):
        try:
            return UploadSession.objects.get(
                upload_id=upload_id,
                owner_id=user_id
            )

        except UploadSession.DoesNotExist:
            raise Http404(
                "Upload session not found"
            )


class ResponseMixin:

    def success(
        self,
        data=None,
        status_code=200
    ):
        return Response(
            data or {},
            status=status_code
        )

    def error(
        self,
        message,
        status_code=400
    ):
        return Response(
            {"error": message},
            status=status_code
        )