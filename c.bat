@echo off
REM Create the unified backend directory structure with admin and student subfolders

REM Create common root-level directories
mkdir config
mkdir controllerFunctions
mkdir controllers
mkdir logs
mkdir middleware
mkdir models
mkdir routes
mkdir scripts
mkdir uploads
mkdir utils

REM Create subfolders for admin and student in key directories

REM Controllers: Separate admin and student endpoints
mkdir controllers\admin
mkdir controllers\student

REM Routes: Separate admin and student API routes
mkdir routes\admin
mkdir routes\student

REM Logs: Keep separate logs for admin and student functionalities
mkdir logs\admin
mkdir logs\student

REM Uploads: Store files separately if needed
mkdir uploads\admin
mkdir uploads\student

REM Controller Functions: Optionally separate functions if needed
mkdir controllerFunctions\admin
mkdir controllerFunctions\student

REM Middleware: If you have any admin/student specific middleware
mkdir middleware\admin
mkdir middleware\student

REM Utils: Optional subfolders if you decide to separate admin/student utilities
mkdir utils\admin
mkdir utils\student

REM Additional directories from the student backend
mkdir DashboardControllers
mkdir db

REM For email-related utilities in the utils folder (keeping mail subfolder intact)
mkdir utils\mail

echo Combined backend structure with admin and student subfolders created successfully.
pause
