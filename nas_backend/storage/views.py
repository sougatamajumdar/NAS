import hashlib
import mimetypes
import os
from PIL import Image
from django.shortcuts import render

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.parsers import MultiPartParser

from .pagination import StandardResultsPagination
from .permissions import ensure_owner
from .utils.file import generate_thumbnail, is_image, get_mime_type, generate_video_thumbnail
from .models import BackupRecord, Node, Share, StorageDisk, UploadSession, UserStorageMapping
from .serializers import ( AdminCreateUserSerializer, AdminUserListSerializer, BackupCreateSerializer, CreateFolderSerializer, FileUploadSerializer, InitiateUploadSerializer, LoginSerializer, MySharedNodeSerializer, 
                          NodeListSerializer, ShareSerializer, SharedNodeSerializer, 
                          StorageDiskSerializer, StorageDiskListSerializer )
from rest_framework.permissions import AllowAny, IsAdminUser, IsAuthenticated
from .services import create_disk_backup, create_user_backup, delete_user_and_data, get_available_disk, delete_node_recursive, get_user_disk_status, is_descendant, is_disk_empty, refresh_disk_usage
from django.http import FileResponse, Http404, StreamingHttpResponse
from rest_framework.decorators import api_view, permission_classes
from django.contrib.auth import (
    get_user_model,
    login,
    logout
)
import uuid
from django.middleware.csrf import get_token
import psutil
import shutil
from collections import defaultdict
from mongoengine.queryset.visitor import Q
from mongoengine.errors import NotUniqueError
from io import BytesIO
from pathlib import Path
import re
import tempfile
import subprocess
# import logging


User = get_user_model()

# logger = logging.getLogger("storage")


from .mixins import (
    ResponseMixin,
    NodeMixin,
    UploadSessionMixin
)


class BaseAPIView(
    APIView,
    ResponseMixin,
    NodeMixin,
    UploadSessionMixin
):
    pass

class FileThumbnailView(
    BaseAPIView
):

    permission_classes = [
        IsAuthenticated
    ]

    def get(
        self,
        request,
        file_id
    ):

        node = self.get_node(
            file_id,
            node_type="FILE"
        )

        if not self.check_node_access(
            node,
            request.user
        ):
            return self.error(
                "Access denied",
                403
            )

        mime, _ = mimetypes.guess_type(
            node.name
        )

        # IMAGE
        if mime and mime.startswith("image/"):

            return generate_thumbnail(
                node.file_path
            )

        # VIDEO
        if (
            mime
            and
            mime.startswith("video/")
            and
            node.thumbnail_path
            and
            os.path.exists(
                node.thumbnail_path
            )
        ):

            return FileResponse(
                open(
                    node.thumbnail_path,
                    "rb"
                ),
                content_type="image/jpeg"
            )

        raise Http404(
            "Thumbnail unavailable"
        )

class NodeView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        parent_id = request.query_params.get("parent_id")

        query = {"owner_id": request.user.id}

        if parent_id:
            try:
                parent = Node.objects.get(id=parent_id, owner_id=request.user.id)

                # FAILSAFE
                if parent.type != "FOLDER":

                    query["parent"] = None

                else:

                    query["parent"] = parent

            except Exception as e:

                print("Invalid parent:", e)

                # FAILSAFE → fallback to root
                query["parent"] = None

        else:

            query["parent"] = None

        nodes = Node.objects.filter(**query).order_by("-created_at")

        paginator = StandardResultsPagination()

        page = paginator.paginate_queryset(
            nodes,
            request
        )

        serializer = NodeListSerializer(
            page,
            many=True,
            context={"request": request}
        )

        return paginator.get_paginated_response(
            serializer.data
        )

    def post(self, request):
        serializer = CreateFolderSerializer(data=request.data, context={"request": request})

        if not serializer.is_valid():
            return Response(serializer.errors, status=400)

        data = serializer.validated_data

        node = Node(
            name=data["name"],
            type="FOLDER",
            owner_id=request.user.id,
            parent=data["parent"]
        )
        node.save()

        return Response({
            "id": str(node.id),
            "name": node.name,
            "type": node.type
        }, status=201)
    

class FileUploadView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = FileUploadSerializer(data=request.data, context={"request": request})
        if not serializer.is_valid():
            return Response(serializer.errors, status=400)

        file = serializer.validated_data["file"]
        parent = serializer.validated_data["parent"]

        try:
            print(1)
            disk = get_available_disk(request.user.id, file.size)
            usage = shutil.disk_usage(disk.mount_path)

            if file.size > usage.free:
                return Response({
                    "error": "Not enough disk space"
                }, status=400)
        except Exception as e:
            return Response({"error": str(e)}, status=500)

        # generate unique filename
        ext = os.path.splitext(file.name)[1]
        unique_name = f"{uuid.uuid4()}{ext}"

        user_folder = f"user_{request.user.id}"
        # storage_path = os.path.join(disk.mount_path, user_folder)
        mapping = UserStorageMapping.objects.filter(
            user_id=request.user.id,
            disk=disk
        ).order_by("-created_at").first()
        if not mapping:
            return Response(
                {
                    "error": "User storage mapping not found"
                },
                status=400
            )

        storage_path = mapping.storage_path

        if not os.access(
            disk.mount_path,
            os.W_OK
        ):
            return Response({
                "error": "Disk is not writable"
            }, status=500)
        # ensure directory exists
        os.makedirs(storage_path, exist_ok=True)

        # file_path = os.path.join(storage_path, unique_name)
        file_path = os.path.abspath(
                os.path.join(storage_path, unique_name)
            )

        # save file to disk
        try:

            with open(file_path, "wb+") as destination:
                for chunk in file.chunks():
                    destination.write(chunk)

        except Exception:

            if os.path.exists(file_path):
                os.remove(file_path)

            return Response({
                "error": "File upload failed"
            }, status=500)

        # save metadata in MongoDB
        node = Node(
            name=file.name,
            type="FILE",
            owner_id=request.user.id,
            parent=parent,
            disk=disk,
            file_path=file_path,
            size=file.size
        )

        node.save()
        
        mime, _ = mimetypes.guess_type(
            file.name
        )

        if mime and mime.startswith("video/"):

            thumb_dir = os.path.join(
                disk.mount_path,
                "thumbnails"
            )

            os.makedirs(
                thumb_dir,
                exist_ok=True
            )

            thumb_path = os.path.join(
                thumb_dir,
                f"{node.id}.jpg"
            )

            generate_video_thumbnail(
                file_path,
                thumb_path
            )

            node.thumbnail_path = thumb_path
        node.save()

        # update disk usage
        # disk.used_space += file.size
        # disk.save()
        refresh_disk_usage(disk)

        return Response({
            "id": str(node.id),
            "name": node.name,
            "type": node.type,
            "size": node.size
        }, status=status.HTTP_201_CREATED)
    

# chunck upload view implement 
class InitiateUploadView(APIView):

    permission_classes = [IsAuthenticated]

    def post(self, request):

        serializer = InitiateUploadSerializer(
            data=request.data,
            context={"request": request}
        )

        serializer.is_valid(
            raise_exception=True
        )

        data = serializer.validated_data

        disk = get_available_disk(
            request.user.id,
            data["total_size"]
        )

        upload_id = str(uuid.uuid4())

        temp_path = os.path.abspath(
            os.path.join(
                disk.mount_path,
                "temp_uploads",
                upload_id
            )
        )

        os.makedirs(temp_path, exist_ok=True)

        parent = None

        if data.get("parent_id"):

            parent = Node.objects.get(
                id=data["parent_id"],
                owner_id=request.user.id
            )


        # existing = Node.objects.filter(
        #     owner_id=request.user.id,
        #     name=data["filename"],
        #     parent=parent,
        #     type="FILE"
        # ).first()  
        existing = Node.objects.filter(
            owner_id=request.user.id,
            parent=parent,
            type="FILE",
            name__iexact=data["filename"]
        ).first()
        if existing:
            return Response(
                {
                    "error": "File already exists"
                },
                status=400
            )
        session = UploadSession(
            upload_id=upload_id,
            owner_id=request.user.id,
            filename=data["filename"],
            total_size=data["total_size"],
            total_chunks=data["total_chunks"],
            chunk_size=data["chunk_size"],
            parent=parent,
            disk=disk,
            temp_path=temp_path,
            file_hash=data["file_hash"]
        )

        session.save()

        return Response({
            "upload_id": upload_id,
            "chunk_size": data["chunk_size"],
            "uploaded_chunks": [],
        })
    
class UploadChunkView(BaseAPIView):

    permission_classes = [IsAuthenticated]

    parser_classes = [MultiPartParser]  

    def post(self, request):

        upload_id = request.data.get("upload_id")

        if not upload_id:
            return Response(
                {"error": "upload_id required"},
                status=400
            )

        try:
            chunk_index = int(
                request.data.get("chunk_index")
            )
        except:
            return Response(
                {"error": "Invalid chunk index"},
                status=400
            )

        chunk = request.FILES.get("chunk")

        if not chunk:
            return Response(
                {"error": "Chunk file required"},
                status=400
            )

        try:
            session = self.get_upload_session( 
                upload_id,
                request.user.id
            )
            if (
                chunk_index < 0
                or
                chunk_index >= session.total_chunks
            ):
                return Response(
                    {"error": "Invalid chunk index"},
                    status=400
                )

        except UploadSession.DoesNotExist:

            return Response({
                "error": "Upload session not found"
            }, status=404)

        chunk_path = os.path.join(
            session.temp_path,
            f"{chunk_index}.part"
        )

        if os.path.exists(chunk_path):

            return Response({
                "message": "Chunk already uploaded",
                "chunk_index": chunk_index
            }, status=200)

        with open(chunk_path, "wb+") as f:

            for c in chunk.chunks():

                f.write(c)

        if chunk_index not in session.uploaded_chunks:

            session.uploaded_chunks.append(
                chunk_index
            )

            session.save()

        return Response({
            "message": "Chunk uploaded",
            "chunk_index": chunk_index
        })
    
def calculate_file_hash(file_path):

    sha256 = hashlib.sha256()

    with open(file_path, "rb") as f:

        for chunk in iter(
            lambda: f.read(4096),
            b""
        ):
            sha256.update(chunk)

    return sha256.hexdigest()

class CompleteUploadView(BaseAPIView):
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        upload_id = request.data.get("upload_id")

        try:
            session = self.get_upload_session(upload_id, request.user.id)
        except UploadSession.DoesNotExist:
            return Response({"error": "Upload not found"}, status=404)

        # FIX 1: Prevent Race Conditions (Check status early)
        if session.is_completed:
            return Response({"error": "Upload already completed"}, status=400)

        if len(session.uploaded_chunks) != session.total_chunks:
            return Response({"error": "Missing chunks"}, status=400)

        ext = os.path.splitext(session.filename)[1]
        unique_name = f"{uuid.uuid4()}{ext}"

        mapping = UserStorageMapping.objects.filter(
            user_id=request.user.id,
            disk=session.disk
        ).first()
        
        if not mapping:
            return Response({"error": "Storage mapping not found"}, status=400)
        
        final_path = os.path.join(mapping.storage_path, unique_name)
        os.makedirs(mapping.storage_path, exist_ok=True)
        
        usage = shutil.disk_usage(session.disk.mount_path)
        if usage.free < session.total_size:
            return Response({"error": "Not enough disk space"}, status=400)

        try: 
            with open(final_path, "wb") as final_file:
                missing = []
                for i in range(session.total_chunks):
                    chunk_path = os.path.join(session.temp_path, f"{i}.part")

                    if not os.path.exists(chunk_path):
                        missing.append(i)
                        continue

                    with open(chunk_path, "rb") as chunk_file:
                        shutil.copyfileobj(chunk_file, final_file)
                        
            if missing:
                if os.path.exists(final_path):
                    os.remove(final_path)
                return Response({"error": "Missing chunks", "missing": missing}, status=400)

        except Exception as e:
            if os.path.exists(final_path):
                os.remove(final_path)
            return Response({"error": str(e)}, status=500)
            
        # Verify File Integrity
        uploaded_hash = calculate_file_hash(final_path)
        if uploaded_hash != session.file_hash:
            os.remove(final_path)
            # FIX 2: Clear chunks instantly on compromise/corruption to free space
            shutil.rmtree(session.temp_path, ignore_errors=True)
            session.delete()
            return Response({"error": "File integrity check failed. Session terminated."}, status=400)

        # Save Meta
        node = Node(
            name=session.filename,
            type="FILE",
            owner_id=request.user.id,
            parent=session.parent,
            disk=session.disk,
            file_path=final_path,
            size=session.total_size,
            file_hash=session.file_hash
        )
        node.save()

        # Handle Video Thumbnails
        mime, _ = mimetypes.guess_type(session.filename)
        if mime and mime.startswith("video/"):
            thumb_dir = os.path.join(session.disk.mount_path, "thumbnails")
            os.makedirs(thumb_dir, exist_ok=True)
            thumb_path = os.path.join(thumb_dir, f"{node.id}.jpg")
            generate_video_thumbnail(final_path, thumb_path)
            node.thumbnail_path = thumb_path
            node.save()

        # Clean up temporary resources safely
        shutil.rmtree(session.temp_path, ignore_errors=True)
        session.delete()
        refresh_disk_usage(session.disk)

        return Response({
            "message": "Upload completed",
            "node_id": str(node.id)
        })
    
 
class UploadStatusView(BaseAPIView):

    permission_classes = [IsAuthenticated]

    def get(self, request, upload_id):

        try:
            session = self.get_upload_session(
                upload_id,
                request.user.id
            )

        except UploadSession.DoesNotExist:

            return Response(
                {"error": "Upload not found"},
                status=404
            )

        return Response({
            "upload_id": session.upload_id,
            "filename": session.filename,
            "total_chunks": session.total_chunks,
            "uploaded_chunks": session.uploaded_chunks,
            "uploaded_count": len(session.uploaded_chunks),
            "is_completed": session.is_completed,
        })

class CancelUploadView(BaseAPIView):

    permission_classes = [IsAuthenticated]

    def delete(self, request, upload_id):

        try:

            session = self.get_upload_session(
                upload_id,
                request.user.id
            )

        except UploadSession.DoesNotExist:

            return Response(
                {"error": "Upload not found"},
                status=404
            )

        shutil.rmtree(
            session.temp_path,
            ignore_errors=True
        )

        session.delete()

        return Response({
            "message": "Upload cancelled"
        }) 
    
# chuck upload views end 

class FileDownloadView(
    BaseAPIView
):

    permission_classes = [
        IsAuthenticated
    ]

    def get(
        self,
        request,
        file_id
    ):

        node = self.get_node(
            file_id,
            node_type="FILE"
        )

        if not self.check_node_access(
            node,
            request.user
        ):
            return self.error(
                "Access denied",
                403
            )

        if not os.path.exists(
            node.file_path
        ):
            raise Http404(
                "File missing"
            )

        file_handle = open(node.file_path, "rb")

        return FileResponse(
            file_handle,
            as_attachment=True,
            filename=node.name
        )
    

class DeleteNodeView(
    BaseAPIView
):

    permission_classes = [
        IsAuthenticated
    ]

    def delete(
        self,
        request,
        node_id
    ):

        node = self.get_node(
            node_id
        )

        ensure_owner( 
            node,
            request.user
        )

        delete_node_recursive(
            node
        )

        return self.success(
            {
                "message":
                "Deleted successfully"
            }
        )
    

class ShareNodeView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = ShareSerializer(
            data=request.data,
            context={"request": request}
        )

        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        data = serializer.validated_data
        node = data["node"]

        # SECURITY CHECK: Ensure the current user actually owns the node they are sharing
        if node.owner_id != request.user.id:
            return Response(
                {"error": "You do not have permission to share this file."},
                status=status.HTTP_403_FORBIDDEN
            )

        try:
            # Build share object using the new schema structure
            share = Share(
                node=node,
                shared_by_id=request.user.id,     # Track who is sharing the file
                shared_with_id=data["shared_user"].id,
                permission="VIEW"                 # Change this to data.get("permission", "VIEW") if dynamic
            )
            share.save()

        except NotUniqueError: 
            # Gracefully catch the unique index constraint violation
            return Response(
                {"error": "This file is already shared with this user."},
                status=status.HTTP_400_BAD_REQUEST
            )

        return Response({
            "message": "Shared successfully"
        }, status=status.HTTP_201_CREATED)
    

class SharedWithMeView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        # Querying the database efficiently using your indexed field
        shares = Share.objects.filter(
            shared_with_id=request.user.id
        ).order_by("-created_at")

        paginator = StandardResultsPagination()
        
        # Paginate the MongoEngine QuerySet
        page = paginator.paginate_queryset(
            shares,
            request,
            view=self
        )

        serializer = SharedNodeSerializer(
            page,
            many=True,
            context={"request": request}
        )

        return paginator.get_paginated_response(
            serializer.data
        )

    
class ScanDisksView(APIView):

    permission_classes = [IsAdminUser]

    def get(self, request):

        partitions = psutil.disk_partitions()

        disks = []

        ignored_mounts = [
            "/System",
            "/private",
            "/dev",
            "/Volumes/Preboot",
            "/Volumes/Update",
            "/Volumes/VM",
            "/proc",
            "/sys",
            "/run"
        ]

        for partition in partitions:

            mount_path = partition.mountpoint

            # ignore system partitions
            if any(
                mount_path.startswith(x)
                for x in ignored_mounts
            ):
                continue

            # skip non-existing
            if not os.path.exists(mount_path):
                continue

            # skip non writable
            if not os.access(mount_path, os.W_OK):
                continue

            try:

                usage = shutil.disk_usage(
                    mount_path
                )

                disks.append({
                    "name": partition.device,
                    "mount_path": mount_path,
                    "total_space": usage.total,
                    "used_space": usage.used,
                    "free_space": usage.free,
                })

            except Exception:
                continue

        return Response(disks)

class StorageDiskView(APIView):
    permission_classes = [IsAdminUser]

    def get(self, request):
        disks = StorageDisk.objects.all().order_by("-created_at")

        paginator = StandardResultsPagination()

        page = paginator.paginate_queryset(
            disks,
            request
        )

        serializer = StorageDiskListSerializer(
            page,
            many=True
        )

        return paginator.get_paginated_response(
            serializer.data
        )

    def post(self, request):
        serializer = StorageDiskSerializer(
            data=request.data
        )

        if not serializer.is_valid():

            return Response(
                serializer.errors,
                status=400
            )

        mount_path = serializer.validated_data[
            "mount_path"
        ]

        existing = StorageDisk.objects.filter(
            mount_path=mount_path
        ).first()

        if existing:
            return Response({
                "error": "Disk already added"
            }, status=400)

        usage = shutil.disk_usage(
            mount_path
        )
        disk = StorageDisk.objects.create(
            name=os.path.basename(mount_path)
                or mount_path,

            mount_path=mount_path,

            total_space=usage.total,

            system_used_space=usage.used,

            nas_used_space=0
        )

        return Response({
            "id": str(disk.id),
            "name": disk.name,
            "mount_path": disk.mount_path,
        }, status=201)
    

@api_view(['PATCH'])
@permission_classes([IsAdminUser])
def disable_disk(request, disk_id):
    try:
        disk = StorageDisk.objects.get(id=disk_id)
    except StorageDisk.DoesNotExist:
        return Response({"error": "Disk not found"}, status=404)

    disk.is_active = False
    disk.save()

    return Response({"message": "Disk disabled"})


@api_view(["DELETE"])
@permission_classes([IsAdminUser])
def delete_disk(request, disk_id):

    try:
        disk = StorageDisk.objects.get(
            id=disk_id
        )

    except StorageDisk.DoesNotExist:

        return Response(
            {"error": "Disk not found"},
            status=404
        )

    disk_exists = Path(
        disk.mount_path
    ).exists()

    node_count = Node.objects(
        disk=disk
    ).count()

    mapping_count = UserStorageMapping.objects(
        disk=disk
    ).count()

    upload_count = UploadSession.objects(
        disk=disk,
        is_completed=False
    ).count()

    backup_count = BackupRecord.objects(
        disk=disk
    ).count()

    # -------------------------
    # DISK STILL EXISTS
    # -------------------------

    if disk_exists:

        blockers = []

        if node_count:
            blockers.append(
                f"{node_count} nodes"
            )

        if mapping_count:
            blockers.append(
                f"{mapping_count} user mappings"
            )

        if upload_count:
            blockers.append(
                f"{upload_count} active uploads"
            )

        if backup_count:
            blockers.append(
                f"{backup_count} backup records"
            )

        if blockers:

            return Response(
                {
                    "error":
                    "Disk still contains NAS data.",
                    "details":
                    blockers
                },
                status=400
            )

        disk.delete()

        return Response(
            {
                "message":
                "Disk deleted successfully."
            }
        )

    # -------------------------
    # DISK MISSING
    # CLEAN DATABASE
    # -------------------------

    UserStorageMapping.objects(
        disk=disk
    ).delete()

    UploadSession.objects(
        disk=disk
    ).delete()

    BackupRecord.objects(
        disk=disk
    ).delete()

    Node.objects(
        disk=disk
    ).delete()

    disk.delete()

    return Response(
        {
            "message":
            "Missing disk and all related metadata removed successfully."
        }
    )


class AdminUserView(APIView):
    permission_classes = [IsAdminUser]

    def get(self, request):
        users = User.objects.all().order_by("-date_joined")

        paginator = StandardResultsPagination()

        page = paginator.paginate_queryset(
            users,
            request
        )

        serializer = AdminUserListSerializer(
            page,
            many=True
        )

        return paginator.get_paginated_response(
            serializer.data
        )

    def post(self, request):
        print("AdminUserView POST data:", request.data)  # Debugging line
        serializer = AdminCreateUserSerializer(data=request.data)

        if not serializer.is_valid():
            return Response(serializer.errors, status=400)

        data = serializer.validated_data

        user = User.objects.create_user(
            username=data["username"],
            email=data["email"],
            password=data["password"]
        )

        user.is_staff = data["is_staff"]
        user.is_superuser = data["is_superuser"]

        user.save()

        return Response({
            "id": user.id,
            "username": user.username,
            "email": user.email
        }, status=201)
    
    def patch(self, request, user_id):

        try:
            user = User.objects.get(id=user_id)

        except User.DoesNotExist:
            return Response(
                {"error": "User not found"},
                status=404
            )

        user.is_active = request.data.get(
            "is_active",
            user.is_active
        )

        user.is_staff = request.data.get(
            "is_staff",
            user.is_staff
        )

        user.is_superuser = request.data.get(
            "is_superuser",
            user.is_superuser
        )

        user.save()

        return Response({
            "message": "User updated"
        })

    def delete(self, request, user_id):

        # prevent self-delete
        if request.user.id == int(user_id):
            return Response({
                "error": "Cannot delete yourself"
            }, status=400)

        try:
            user = User.objects.get(id=user_id)
        except User.DoesNotExist:
            return Response({
                "error": "User not found"
            }, status=404)

        delete_user_and_data(user)

        return Response({
            "message": "User deleted successfully"
        })
    

class BackupView(APIView):
    permission_classes = [IsAdminUser]

    def get(self, request):
        backups = BackupRecord.objects.all().order_by("-created_at")
        paginator = StandardResultsPagination()
        page = paginator.paginate_queryset(backups, request)

        data = [{
            "id": str(backup.id),
            "backup_type": backup.backup_type,
            "user_id": backup.user_id,
            "backup_file": backup.backup_file,
            "created_by": backup.created_by,
            "created_at": backup.created_at
        } for backup in page]

        return paginator.get_paginated_response(data)

    def post(self, request):
        serializer = BackupCreateSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=400)

        data = serializer.validated_data

        if data["backup_type"] == "USER":
            zip_path = create_user_backup(data["user_id"])
            backup = BackupRecord(
                backup_type="USER",
                user_id=data["user_id"],
                backup_file=zip_path,
                created_by=request.user.id
            )
            backup.save()
        else:
            # FIX 3: Solved syntax termination cutoff
            try:
                disk = StorageDisk.objects.get(id=data["disk_id"])
                zip_path = create_disk_backup(disk)
                backup = BackupRecord(
                    backup_type="DISK",
                    disk=disk,
                    backup_file=zip_path,
                    created_by=request.user.id
                )
                backup.save()
            except StorageDisk.DoesNotExist:
                return Response({"error": "Disk track target not found"}, status=404)

        return Response({"message": "Backup created successfully"}, status=201)
    

class LoginView(APIView):

    permission_classes = [AllowAny] 

    def post(self, request):

        serializer = LoginSerializer(
            data=request.data
        )

        if not serializer.is_valid():

            return Response(
                serializer.errors,
                status=400
            )

        user = serializer.validated_data["user"]

        #  creates session
        login(request, user)

        return Response({
            "message": "Login successful",

            "user": {
                "id": user.id,
                "username": user.username,
                "email": user.email,
                "is_staff": user.is_staff,
                "is_superuser": user.is_superuser,
                "is_active": user.is_active
            }
        })


#  LOGOUT
class LogoutView(APIView):

    permission_classes = [IsAuthenticated]

    def post(self, request):

        logout(request) 

        return Response({
            "message": "Logout successful"
        })


#  CURRENT USER
class MeView(APIView):

    permission_classes = [IsAuthenticated]

    def get(self, request):

        user = request.user

        return Response({
            "id": user.id,
            "username": user.username,
            "email": user.email,
            "is_staff": user.is_staff,
            "is_superuser": user.is_superuser,
            "is_active": user.is_active
        })
    

class CSRFView(APIView):

    permission_classes = [AllowAny]

    def get(self, request):

        csrf_token = get_token(request) 

        return Response({
            "csrfToken": csrf_token
        })
    

class StorageStatsView(APIView):

    permission_classes = [IsAuthenticated]

    def get(self, request):

        all_nodes = Node.objects.filter(
            owner_id=request.user.id
        )

        files = all_nodes.filter(type="FILE")
        folders = all_nodes.filter(type="FOLDER")

        total_storage = 0

        file_type_stats = defaultdict(lambda: {
            "count": 0,
            "size": 0
        })

        largest_files = []

        for file in files:

            total_storage += file.size or 0

            ext = os.path.splitext(file.name)[1].lower()

            # FILE TYPE GROUPING
            if ext in [".jpg", ".jpeg", ".png", ".gif", ".webp"]:
                category = "Images"

            elif ext in [".mp4", ".mkv", ".mov", ".avi"]:
                category = "Videos"

            elif ext in [".pdf", ".doc", ".docx", ".txt", ".ppt", ".pptx", ".xls", ".xlsx"]:
                category = "Documents"

            elif ext in [".zip", ".rar", ".7z", ".tar"]:
                category = "Archives"

            else:
                category = "Others"

            file_type_stats[category]["count"] += 1
            file_type_stats[category]["size"] += file.size or 0

            largest_files.append({
                "id": str(file.id),
                "name": file.name,
                "size": file.size,
                "created_at": file.created_at
            })

        largest_files = sorted(
            largest_files,
            key=lambda x: x["size"],
            reverse=True
        )[:5]

        root_folders = Node.objects.filter(
            owner_id=request.user.id,
            type="FOLDER",
            parent=None
        ).count()

        recent_uploads = files.order_by(
            "-created_at"
        )[:10]

        upload_data = []

        for file in recent_uploads:
            upload_data.append({
                "id": str(file.id),
                "name": file.name,
                "size": file.size,
                "created_at": file.created_at
            })

        return Response({
            "total_storage": total_storage,

            "total_files": files.count(),

            "total_folders": folders.count(),

            "root_folders": root_folders,

            "total_items":
                files.count() + folders.count(),

            "file_types": file_type_stats,

            "largest_files": largest_files,

            "recent_uploads": upload_data
        })
    
    
class SearchNodeView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        query = request.query_params.get("q", "").strip()
        node_type = request.query_params.get("type", None)
        parent_id = request.query_params.get("parent_id", None)

        if not query:
            return Response([])

        # Escape special regex characters to prevent query injection
        escaped_query = re.escape(query)
        
        # Start with owner filter
        filters = Q(owner_id=request.user.id)

        # Partial, case-insensitive match on the 'name' field (or change 'name' to your search field)
        filters &= Q(__raw__={"name": {"$regex": escaped_query, "$options": "i"}})
        
        if node_type:
            filters &= Q(type=node_type)

        if parent_id:
            try:
                parent = Node.objects.get(
                    id=parent_id,
                    owner_id=request.user.id
                )
                filters &= Q(parent=parent.id) 
            except Node.DoesNotExist:
                return Response(
                    {"error": "Folder not found"},
                    status=404
                )

        nodes = Node.objects.filter(filters).order_by("-created_at")

        paginator = StandardResultsPagination()
        page = paginator.paginate_queryset(nodes, request)

        serializer = NodeListSerializer(
            page,
            many=True,
            context={"request": request}
        )

        return paginator.get_paginated_response(serializer.data)
    

class SearchUsersView(APIView):

    permission_classes = [IsAuthenticated]

    def get(self, request):

        query = request.query_params.get(
            "q",
            ""
        ).strip()

        if not query:
            return Response([])

        users = User.objects.filter(
            username__icontains=query,
             is_active=True
        ).exclude(
            id=request.user.id
        )[:10]

        data = []

        for user in users:

            data.append({
                "id": user.id,
                "username": user.username,
                "email": user.email,
            })

        return Response(data)
    

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def CheckUserDiskView(request):

    data = get_user_disk_status(
        request.user.id
    )
    print("#####", data)
    return Response(data)

class RenameNodeView(BaseAPIView):

    permission_classes = [IsAuthenticated]

    def patch(
        self,
        request,
        node_id
    ):

        node = self.get_node(node_id)

        ensure_owner(
            node,
            request.user
        )

        new_name = request.data.get(
            "name"
        )

        if not new_name:
            return self.error(
                "Name required"
            )

        existing = Node.objects.filter(
            owner_id=request.user.id,
            parent=node.parent,
            name=new_name
        ).exclude(
            id=node.id
        ).first()

        if existing:
            return self.error(
                "Already exists"
            )

        node.name = new_name
        node.save()

        return self.success({
            "message": "Renamed"
        })
    

class MoveNodeView(BaseAPIView):

    permission_classes = [IsAuthenticated]

    def patch(
        self,
        request,
        node_id
    ):

        node = self.get_node(node_id)

        ensure_owner(
            node,
            request.user
        )

        parent_id = request.data.get(
            "parent_id"
        )

        parent = None

        if parent_id:
            parent = self.get_node(
                parent_id,
                "FOLDER"
            )

            if str(node.id) == str(parent.id):
                return self.error(
                    "Cannot move folder into itself"
                )
            
        if parent and node.type == "FOLDER":
            if is_descendant(node, parent):
                return self.error(
                    "Cannot move folder into its child"
                )

        node.parent = parent
        node.save()

        return self.success({
            "message": "Moved"
        })
    
class FilePreviewView(BaseAPIView):

    permission_classes = [IsAuthenticated]

    def get(self, request, file_id):
        print("get requesr##", file_id, request)
        node = self.get_node(
            file_id,
            node_type="FILE"
        )
        
        if not self.check_node_access(
            node,
            request.user
        ):
            return self.error(
                "Access denied",
                403
            )
        
        if not os.path.exists(node.file_path):
            raise Http404("File missing")
        
        mime = get_mime_type(
            node.file_path
        )
        if not os.path.exists(node.file_path):
            raise Http404("File missing")
        
        mime, _ = mimetypes.guess_type(node.name)

        if mime and mime.startswith("video/"):

            response = FileResponse(
                open(node.file_path, "rb"),
                content_type=mime
            )

            response["Accept-Ranges"] = "bytes"

            return response
        
        return FileResponse(
            open(node.file_path, "rb"),
            content_type=mime
        )
    
class VideoStreamView(BaseAPIView):

    permission_classes = [IsAuthenticated]

    def get(self, request, file_id):

        node = self.get_node(
            file_id,
            node_type="FILE"
        )

        ensure_owner(
            node,
            request.user
        )

        file_path = node.file_path

        file_size = os.path.getsize(file_path)

        range_header = request.headers.get("Range")

        if not range_header:

            response = StreamingHttpResponse(
                open(file_path, "rb"),
                content_type="video/mp4"
            )

            response["Content-Length"] = file_size

            return response

        match = re.match(
            r"bytes=(\d+)-(\d*)",
            range_header
        )

        if not match:
            return Response(status=416)

        start = int(match.group(1))

        end = (
            int(match.group(2))
            if match.group(2)
            else file_size - 1
        )

        length = end - start + 1

        file_obj = open(
            file_path,
            "rb"
        )

        file_obj.seek(start)

        response = StreamingHttpResponse(
            file_obj,
            status=206,
            content_type="video/mp4"
        )

        response["Content-Length"] = length
        response["Content-Range"] = (
            f"bytes {start}-{end}/{file_size}"
        )
        response["Accept-Ranges"] = "bytes"

        return response
    
class AdminDashboardStatsView(APIView):

    permission_classes = [IsAdminUser]

    def get(self, request):
        
        return Response({
            "users": User.objects.count(),
            "files": Node.objects.filter(
                type="FILE"
            ).count(),
            "folders": Node.objects.filter(
                type="FOLDER"
            ).count(),
            "active_disks": StorageDisk.objects.filter(
                is_active=True
            ).count(),
        })
    

class MySharedFilesView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        shares = Share.objects.filter(shared_by_id=request.user.id)
        
        paginator = StandardResultsPagination()
        
        page = paginator.paginate_queryset(
            shares,
            request,
            view=self
        )
    
        serializer = MySharedNodeSerializer(
            page,
            many=True,
            context={"request": request}
        )

        return paginator.get_paginated_response(
            serializer.data
        )

    
class UnshareNodeView(APIView):
    permission_classes = [IsAuthenticated]

    def delete(self, request, share_id):
        try:
            print("shred##", share_id)
            share = Share.objects.get(
                id=share_id,
                shared_by_id=request.user.id
            )
        except Share.DoesNotExist:
            # Returns 404 whether the ID is fake OR if it belongs to someone else
            return Response(
                {"error": "Share record not found or permission denied"},
                status=404
            )

        share.delete()

        return Response({
            "message": "File unshared successfully"
        })
