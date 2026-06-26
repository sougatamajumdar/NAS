from django.urls import path
from .views import  ( AdminDashboardStatsView, AdminUserView, BackupView, CSRFView, CheckUserDiskView, FileDownloadView, FilePreviewView, FileThumbnailView, FileUploadView, 
                     LoginView, LogoutView, MeView, MoveNodeView, MySharedFilesView, NodeView, 
                     DeleteNodeView, RenameNodeView, SearchNodeView, SearchUsersView, ShareNodeView, SharedWithMeView, StorageDiskView, UnshareNodeView, 
                     delete_disk, disable_disk, ScanDisksView, StorageStatsView, InitiateUploadView,
                     UploadChunkView, CompleteUploadView, UploadStatusView, CancelUploadView, VideoStreamView)

urlpatterns = [

    # FILES & FOLDERS
    path('nodes/', NodeView.as_view()),
    path('upload/', FileUploadView.as_view()),
    path('download/<str:file_id>/', FileDownloadView.as_view()),
    path('preview/<str:file_id>/', FilePreviewView.as_view()),
    path('thumbnail/<str:file_id>/', FileThumbnailView.as_view()),
    path('stream/<str:file_id>', VideoStreamView.as_view()),

    path('delete/<str:node_id>/', DeleteNodeView.as_view()),
    path('rename/<str:node_id>/', RenameNodeView.as_view()),
    path('move/<str:node_id>/', MoveNodeView.as_view()),

    # SHARING
    path('share/', ShareNodeView.as_view()),
    path('shared/', SharedWithMeView.as_view()),
    path('share/my/', MySharedFilesView.as_view()),
    path('share/<str:share_id>/', UnshareNodeView.as_view()),

    # SEARCH
    path('search/', SearchNodeView.as_view()),
    path('users/search/', SearchUsersView.as_view()),

    # STORAGE
    path('storage/stats/', StorageStatsView.as_view()),
    path('disk/status/', CheckUserDiskView),

    # CHUNK UPLOAD
    path('upload/initiate/', InitiateUploadView.as_view()),
    path('upload/chunk/', UploadChunkView.as_view()),
    path('upload/complete/', CompleteUploadView.as_view()),
    path('upload/status/<str:upload_id>/', UploadStatusView.as_view()),
    path('upload/cancel/<str:upload_id>/', CancelUploadView.as_view()),

    # ADMIN DISKS
    path('admin/disks/scan/', ScanDisksView.as_view()),
    path('admin/disks/', StorageDiskView.as_view()),
    path('admin/disks/<str:disk_id>/disable/', disable_disk),
    path('admin/disks/<str:disk_id>/', delete_disk),

    # ADMIN USERS
    path('admin/users/', AdminUserView.as_view()),
    path('admin/users/<int:user_id>/', AdminUserView.as_view()),

    # ADMIN DASHBOARD
    path('admin/dashboard/stats/', AdminDashboardStatsView.as_view()),

    # BACKUPS
    path('admin/backups/', BackupView.as_view()),

    # AUTH
    path('auth/login/', LoginView.as_view()),
    path('auth/logout/', LogoutView.as_view()),
    path('auth/me/', MeView.as_view()),
    path('auth/csrf/', CSRFView.as_view()),
]