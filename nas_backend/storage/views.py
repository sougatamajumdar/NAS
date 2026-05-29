import mimetypes
import os
from PIL import Image
from django.shortcuts import render

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from .models import BackupRecord, Node, Share, StorageDisk, UserStorageMapping
from .serializers import ( AdminCreateUserSerializer, AdminUserListSerializer, BackupCreateSerializer, CreateFolderSerializer, FileUploadSerializer, LoginSerializer, 
                          NodeListSerializer, ShareSerializer, SharedNodeSerializer, 
                          StorageDiskSerializer, StorageDiskListSerializer )
from rest_framework.permissions import AllowAny, IsAdminUser, IsAuthenticated
from .services import create_disk_backup, create_user_backup, delete_user_and_data, get_available_disk, delete_node_recursive, get_user_disk_status, is_disk_empty, refresh_disk_usage
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


User = get_user_model()

class FileThumbnailView(APIView):

    permission_classes = [IsAuthenticated]

    def get(self, request, file_id):

        try:

            node = Node.objects.get(
                id=file_id,
                type="FILE"
            )

        except Node.DoesNotExist:

            raise Http404("File not found")

        # PERMISSION CHECK
        is_owner = (
            node.owner_id == request.user.id
        )

        is_shared = Share.objects.filter(
            node=node,
            shared_with_id=request.user.id
        ).first()

        if not is_owner and not is_shared:

            return Response(
                {"error": "Access denied"},
                status=403
            )

        if not os.path.exists(node.file_path):

            raise Http404("Missing file")

        mime, _ = mimetypes.guess_type(
            node.name
        )

        if not mime or not mime.startswith("image/"):

            raise Http404("Not image")

        try:

            image = Image.open(node.file_path)

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

            # CACHE
            response["Cache-Control"] = (
                "public, max-age=86400"
            )

            return response

        except Exception as e:

            print(e)

            raise Http404("Thumbnail failed")

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
        serializer = NodeListSerializer(
                                            nodes,
                                            many=True,
                                            context={
                                                "request": request
                                            }
                                        )
        print('serializer->', serializer.data)  # Debugging line to check serialized data
        return Response(serializer.data)

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
        print("FileUploadView POST data:", request.data)  # Debugging line
        if not serializer.is_valid():
            print("FileUploadView errors:", serializer.errors)  # Debugging line
            return Response(serializer.errors, status=400)

        file = serializer.validated_data["file"]
        parent = serializer.validated_data["parent"]
        print(f"Uploading file: {file.name}, size: {file.size} bytes")  # Debugging line

        try:
            print(1)
            disk = get_available_disk(request.user.id, file.size)
            print(f"Selected disk: {disk.name} with mount path {disk.mount_path}")  # Debugging line
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
    

class FileDownloadView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, file_id):
        try:
            node = Node.objects.get(id=file_id, type="FILE")
            print(f"Found node: {node.name} at path {node.file_path}")  # Debugging line
        except Node.DoesNotExist:
            raise Http404("File not found")

        #  Block folder download
        if node.type != "FILE":
            return Response({"error": "Not a file"}, status=400)

        # Permission check
        is_owner = node.owner_id == request.user.id

        is_shared = Share.objects.filter(
            node=node,
            shared_with_id=request.user.id
        ).first()
    
        if not is_owner and not is_shared:
            return Response({"error": "Access denied"}, status=403)

        # File existence check
        if not os.path.exists(node.file_path):
            raise Http404("File missing on disk")

        # Stream file
        response = FileResponse(
            open(node.file_path, 'rb'),
            as_attachment=True,
            filename=node.name
        )

        return response
    

class DeleteNodeView(APIView):
    permission_classes = [IsAuthenticated]

    def delete(self, request, node_id):
        try:
            node = Node.objects.get(id=node_id)
        except Node.DoesNotExist:
            return Response({"error": "Node not found"}, status=404)

        # Only owner can delete
        if node.owner_id != request.user.id:
            return Response({"error": "Permission denied"}, status=403)

        # delete logic
        delete_node_recursive(node)

        return Response({"message": "Deleted successfully"}, status=200)
    

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

        serializer = SharedNodeSerializer(shares, many=True)

        return Response(serializer.data)
    
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
        serializer = StorageDiskListSerializer(disks, many=True)
        return Response(serializer.data)

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


@api_view(['DELETE'])
@permission_classes([IsAdminUser])
def delete_disk(request, disk_id):
    try:
        disk = StorageDisk.objects.get(id=disk_id)
    except StorageDisk.DoesNotExist:
        return Response({"error": "Disk not found"}, status=404)

    # 🔥 Safety check
    if not is_disk_empty(disk):
        return Response({
            "error": "Disk is not empty. Cannot delete."
        }, status=400)

    # disk.delete()
    disk.is_active = False
    disk.save()

    return Response({"message": "Disk deleted"})


class AdminUserView(APIView):
    print("AdminUserView initialized")  # Debugging line
    permission_classes = [IsAdminUser]

    def get(self, request):
        users = User.objects.all().order_by("-date_joined")

        serializer = AdminUserListSerializer(users, many=True)

        return Response(serializer.data)

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

        backups = BackupRecord.objects.order_by(
            "-created_at"
        ).all()

        data = []

        for backup in backups:

            data.append({
                "id": str(backup.id),
                "backup_type": backup.backup_type,
                "user_id": backup.user_id,
                "backup_file": backup.backup_file,
                "created_by": backup.created_by,
                "created_at": backup.created_at
            })

        return Response(data)

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
                "is_superuser": user.is_superuser
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
            "is_superuser": user.is_superuser
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

        query = request.query_params.get(
            "q",
            ""
        ).strip()

        node_type = request.query_params.get(
            "type",
            None
        )

        parent_id = request.query_params.get(
            "parent_id",
            None
        )

        if not query:
            return Response([])

        filters = Q(owner_id=request.user.id)

        # SEARCH BY NAME
        filters &= Q(name__icontains=query)

        # FILTER TYPE
        if node_type:
            filters &= Q(type=node_type)

        # FILTER FOLDER
        if parent_id:

            try:

                parent = Node.objects.get(
                    id=parent_id,
                    owner_id=request.user.id
                )

                filters &= Q(parent=parent)

            except Node.DoesNotExist:

                return Response(
                    {"error": "Folder not found"},
                    status=404
                )

        nodes = Node.objects.filter(
            filters
        ).order_by("-created_at")[:50]

        serializer = NodeListSerializer(
            nodes,
            many=True,
            context={
                "request": request
            }
        )
        return Response(serializer.data)
    

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
            username__icontains=query
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