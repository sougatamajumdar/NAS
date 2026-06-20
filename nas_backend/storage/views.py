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
from .utils.file import generate_thumbnail, is_image, get_mime_type
from .models import BackupRecord, Node, Share, StorageDisk, UploadSession, UserStorageMapping
from .serializers import ( AdminCreateUserSerializer, AdminUserListSerializer, BackupCreateSerializer, CreateFolderSerializer, FileUploadSerializer, InitiateUploadSerializer, LoginSerializer, 
                          NodeListSerializer, ShareSerializer, SharedNodeSerializer, 
                          StorageDiskSerializer, StorageDiskListSerializer )
from rest_framework.permissions import AllowAny, IsAdminUser, IsAuthenticated
from .services import create_disk_backup, create_user_backup, delete_user_and_data, get_available_disk, delete_node_recursive, get_user_disk_status, is_descendant, is_disk_empty, refresh_disk_usage
from django.http import FileResponse, Http404
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
from io import BytesIO
from pathlib import Path


User = get_user_model()

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

class FileThumbnailView(BaseAPIView):

    permission_classes = [IsAuthenticated]

    def get(self, request, file_id):

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

        if not is_image(node.name):
            raise Http404("Not image")

        return generate_thumbnail(node.file_path) 

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

        temp_path = os.path.join(
            disk.mount_path,
            "temp_uploads",
            upload_id
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

        upload_id = request.data.get(
            "upload_id"
        )

        try:

            session = self.get_upload_session(
                upload_id,
                request.user.id
            )

        except UploadSession.DoesNotExist:

            return Response({
                "error": "Upload not found"
            }, status=404)

        if len(session.uploaded_chunks) != session.total_chunks:

            return Response({
                "error": "Missing chunks"
            }, status=400)

        ext = os.path.splitext(
            session.filename
        )[1]

        unique_name = f"{uuid.uuid4()}{ext}"

        mapping = UserStorageMapping.objects.filter(
            user_id=request.user.id,
            disk=session.disk
        ).first()
        
        if not mapping:
            return Response(
                {
                    "error": "Storage mapping not found"
                },
                status=400
            )
        
        final_path = os.path.join(
            mapping.storage_path,
            unique_name
        )

        os.makedirs(
            mapping.storage_path,
            exist_ok=True
        )
        usage = shutil.disk_usage(
            session.disk.mount_path
        )

        if usage.free < session.total_size:
            return Response(
                {"error": "Not enough disk space"},
                status=400
            )
        try: 
            with open(final_path, "wb") as final_file:
                missing = []
                
                for i in range(session.total_chunks):

                    chunk_path = os.path.join(
                        session.temp_path,
                        f"{i}.part"
                    )

                    if not os.path.exists(chunk_path):
                        missing.append(i)
                        continue

                    with open(chunk_path, "rb") as chunk_file:
                        shutil.copyfileobj(
                            chunk_file,
                            final_file
                        )
            if missing:

                if os.path.exists(final_path):
                    os.remove(final_path)

                return Response(
                    {
                        "error": "Missing chunks",
                        "missing": missing
                    },
                    status=400
                )

        except Exception as e:

            if os.path.exists(final_path):
                os.remove(final_path)

            return Response(
                {
                    "error": str(e)
                },
                status=500
            )
        if session.is_completed:
            return Response({
                "message": "Already completed"
            }, status=200)
            
        uploaded_hash = calculate_file_hash(
            final_path
        )

        if uploaded_hash != session.file_hash:

            os.remove(final_path)

            return Response({
                "error": "File integrity check failed"
            }, status=400)

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

        shutil.rmtree(
            session.temp_path,
            ignore_errors=True
        )

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
            return Response(serializer.errors, status=400)

        data = serializer.validated_data

        share = Share(
            node=data["node"],
            shared_with_id=data["shared_user"].id,
            permission="VIEW"
        )
        share.save()

        return Response({
            "message": "Shared successfully"
        }, status=status.HTTP_201_CREATED)
    

class SharedWithMeView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        shares = Share.objects.filter(
            shared_with_id=request.user.id
        ).order_by("-created_at")

        paginator = StandardResultsPagination()

        page = paginator.paginate_queryset(
            shares,
            request
        )

        serializer = SharedNodeSerializer(
            page,
            many=True
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

    # LIST BACKUPS
    def get(self, request):

        backups = BackupRecord.objects.all().order_by(
            "-created_at"
        )

        paginator = StandardResultsPagination()

        page = paginator.paginate_queryset(
            backups,
            request
        )

        data = []

        for backup in page:

            data.append({
                "id": str(backup.id),
                "backup_type": backup.backup_type,
                "user_id": backup.user_id,
                "backup_file": backup.backup_file,
                "created_by": backup.created_by,
                "created_at": backup.created_at
            })

        return paginator.get_paginated_response(data)

    # CREATE BACKUP
    def post(self, request):

        serializer = BackupCreateSerializer(
            data=request.data
        )

        if not serializer.is_valid():
            return Response(
                serializer.errors,
                status=400
            )

        data = serializer.validated_data

        # USER BACKUP
        if data["backup_type"] == "USER":

            zip_path = create_user_backup(
                data["user_id"]
            )

            backup = BackupRecord(
                backup_type="USER",
                user_id=data["user_id"],
                backup_file=zip_path,
                created_by=request.user.id
            )

            backup.save()

        # DISK BACKUP
        else:

            try:
                disk = StorageDisk.objects.get(
                    id=data["disk_id"]
                )

            except StorageDisk.DoesNotExist:

                return Response({
                    "error": "Disk not found"
                }, status=404)

            zip_path = create_disk_backup(
                disk
            )

            backup = BackupRecord(
                backup_type="DISK",
                disk=disk,
                backup_file=zip_path,
                created_by=request.user.id
            )

            backup.save()

        return Response({
            "message": "Backup created",
            "backup_file": zip_path
        }, status=201)
    

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

            print("Search query:", query)
            
            filters = Q(owner_id=request.user.id)

            filters &= Q(__raw__={"$text": {"$search": query}})
            
            if node_type:
                filters &= Q(type=node_type)

            if parent_id:
                try:
                    parent = Node.objects.get(
                        id=parent_id,
                        owner_id=request.user.id
                    )
                    # Ensure we match the reference format stored in your DB
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
        
        if not os.path.exists(node.file_path):
            raise Http404("File missing")
        
        mime = get_mime_type(
            node.file_path
        )
        if not os.path.exists(node.file_path):
            raise Http404("File missing")
        
        return FileResponse(
            open(node.file_path, "rb"),
            content_type=mime
        )
    
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