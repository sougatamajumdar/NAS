# NAS Cloud Storage Platform

A modern self-hosted cloud storage and NAS platform built with Django REST Framework and React. The application provides secure file storage, sharing, storage analytics, backup management, and multi-disk administration through a clean and responsive web interface.

## Features

### File Management
- Upload single or multiple files
- Drag-and-drop uploads
- Folder creation and organization
- File preview and download
- File deletion and management
- Breadcrumb navigation

### Sharing
- Share files with other users
- User search and selection
- Permission-based access control

### Storage Management
- Multi-disk support
- Disk discovery and registration
- Storage usage monitoring
- Free space tracking
- Disk enable/disable controls

### Analytics
- Storage utilization overview
- File and folder statistics
- Largest files tracking
- Recent uploads
- File type analytics

### Administration
- User management
- Role-based access control
- Storage administration
- Backup management
- System monitoring

## Technology Stack

### Backend
- Python
- Django
- Django REST Framework
- SQLite
- MongoDB

### Frontend
- React
- Vite
- Zustand
- Tailwind CSS
- ShadCN UI

## Architecture

```text
React Frontend
      │
      ▼
Django REST API
      │
      ▼
Database + Storage Layer
      │
      ▼
Multiple Storage Disks
```

## Installation

### Backend

```bash
git clone https://github.com/yourusername/nas-cloud-storage.git

cd backend

python -m venv venv

source venv/bin/activate
# Windows:
venv\Scripts\activate

pip install -r requirements.txt

python manage.py migrate

python manage.py createsuperuser

python manage.py runserver
```

### Frontend

```bash
cd frontend

npm install

npm run dev
```

## Environment Variables

### Backend

```env
SECRET_KEY=your-secret-key

MONGO_URI=.....
```

### Frontend

```env
VITE_API_URL=http://localhost:8000/api
```

## Roadmap

- Upload resume support
- Folder sharing
- Public share links
- File versioning
- Recycle bin
- Storage quotas
- S3 / MinIO integration
- Audit logging

## License

MIT License
