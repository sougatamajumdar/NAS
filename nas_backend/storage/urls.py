from django.urls import path
from .views import  ( AdminUserView, BackupView, CSRFView, CheckUserDiskView, FileDownloadView, FileThumbnailView, FileUploadView, 
                     LoginView, LogoutView, MeView, NodeView, 
                     DeleteNodeView, SearchNodeView, SearchUsersView, ShareNodeView, SharedWithMeView, StorageDiskView, 
                     delete_disk, disable_disk, ScanDisksView, StorageStatsView )

urlpatterns = [
    path('nodes/', NodeView.as_view()),
    path('upload/', FileUploadView.as_view()),
    path('download/<str:file_id>/', FileDownloadView.as_view()),
    path('delete/<str:node_id>/', DeleteNodeView.as_view()),
    path('share/', ShareNodeView.as_view()),
    path('shared/', SharedWithMeView.as_view()),
    path("storage/stats/", StorageStatsView.as_view()),
    path("search/", SearchNodeView.as_view()),
    path("users/search/", SearchUsersView.as_view()),
    path("disk/status/", CheckUserDiskView),
    path("thumbnail/<str:file_id>/", FileThumbnailView.as_view()), 

    path('admin/disks/scan/', ScanDisksView.as_view()),
    path('admin/disks/', StorageDiskView.as_view()),
    path('admin/disks/<str:disk_id>/disable/', disable_disk),
    path('admin/disks/<str:disk_id>/', delete_disk),
    path('admin/users/', AdminUserView.as_view()),
    path('admin/users/<int:user_id>/', AdminUserView.as_view()),
    path('admin/backups/', BackupView.as_view()),

    path('auth/login/', LoginView.as_view()),
    path('auth/logout/', LogoutView.as_view()),
    path('auth/me/', MeView.as_view()),
    path("auth/csrf/", CSRFView.as_view()),
]