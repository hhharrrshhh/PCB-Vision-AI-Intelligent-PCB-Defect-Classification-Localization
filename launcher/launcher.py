import os
import sys
import time
import socket
import threading
import subprocess
import webbrowser
import urllib.request
import urllib.error
import tkinter as tk
from tkinter import ttk, messagebox


# ============================================================
# PCB VISION AI - LOCAL APPLICATION LAUNCHER
# ============================================================

PROJECT_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))

VENV_PYTHON = os.path.join(
    PROJECT_ROOT, ".venv", "Scripts", "python.exe"
)

BACKEND_DIR = os.path.join(PROJECT_ROOT, "backend")
FRONTEND_DIR = os.path.join(PROJECT_ROOT, "frontend")
MODEL_PATH = os.path.join(BACKEND_DIR, "weights", "best.pt")

BACKEND_HOST = "127.0.0.1"
BACKEND_PORT = 8000

FRONTEND_HOST = "127.0.0.1"
FRONTEND_PORT = 5173

BACKEND_URL = f"http://{BACKEND_HOST}:{BACKEND_PORT}"
FRONTEND_URL = f"http://{FRONTEND_HOST}:{FRONTEND_PORT}"

HEALTH_URL = f"{BACKEND_URL}/api/v1/inspection/health"

backend_process = None
frontend_process = None

launching = False


# ============================================================
# UTILITY FUNCTIONS
# ============================================================

def log(message):
    """Write a message to the GUI log."""
    timestamp = time.strftime("%H:%M:%S")

    def update():
        log_box.configure(state="normal")
        log_box.insert("end", f"[{timestamp}] {message}\n")
        log_box.see("end")
        log_box.configure(state="disabled")

    root.after(0, update)


def set_status(component, status, color):
    """Update backend/frontend status labels."""

    def update():
        if component == "backend":
            backend_status.config(text=status, foreground=color)
        elif component == "frontend":
            frontend_status.config(text=status, foreground=color)

    root.after(0, update)


def port_is_open(host, port):
    """Check whether a TCP port is accepting connections."""
    try:
        with socket.create_connection((host, port), timeout=1):
            return True
    except (OSError, ConnectionError):
        return False


def kill_process_on_port(port):
    """
    Find and terminate processes listening on a port.
    Windows-specific.
    """

    try:
        result = subprocess.run(
            ["netstat", "-ano"],
            capture_output=True,
            text=True,
            creationflags=subprocess.CREATE_NO_WINDOW
        )

        pids = set()

        for line in result.stdout.splitlines():
            parts = line.split()

            if len(parts) >= 5 and parts[0].upper() == "TCP":
                local_address = parts[1]
                state = parts[3]
                pid = parts[4]

                if (
                    local_address.endswith(f":{port}")
                    and state.upper() == "LISTENING"
                ):
                    try:
                        pids.add(int(pid))
                    except ValueError:
                        pass

        for pid in pids:
            log(f"Port {port} is occupied by PID {pid}. Terminating it...")

            subprocess.run(
                ["taskkill", "/PID", str(pid), "/F", "/T"],
                capture_output=True,
                text=True,
                creationflags=subprocess.CREATE_NO_WINDOW
            )

            time.sleep(1)

    except Exception as e:
        log(f"Could not clear port {port}: {e}")


def wait_for_port(host, port, timeout=30):
    """Wait until a TCP port becomes available."""
    start = time.time()

    while time.time() - start < timeout:
        if port_is_open(host, port):
            return True

        time.sleep(0.5)

    return False


def wait_for_backend(timeout=120):
    """
    Wait for FastAPI health endpoint.
    This gives YOLO time to load the model.
    """

    start = time.time()

    log("Waiting for backend health check...")

    while time.time() - start < timeout:

        try:
            with urllib.request.urlopen(
                HEALTH_URL,
                timeout=3
            ) as response:

                if response.status == 200:
                    log("Backend health check passed.")
                    return True

        except Exception:
            pass

        time.sleep(1)

    return False


# ============================================================
# VALIDATION
# ============================================================

def validate_project():

    log("Checking project configuration...")

    if not os.path.isdir(PROJECT_ROOT):
        log("ERROR: Project root not found.")
        return False

    if not os.path.isfile(VENV_PYTHON):
        log("ERROR: Python virtual environment not found.")
        log(f"Expected: {VENV_PYTHON}")
        return False

    log("✓ Python virtual environment found.")

    if not os.path.isdir(BACKEND_DIR):
        log("ERROR: Backend directory not found.")
        return False

    log("✓ Backend directory found.")

    if not os.path.isfile(
        os.path.join(BACKEND_DIR, "app.py")
    ):
        log("ERROR: backend/app.py not found.")
        return False

    log("✓ FastAPI application found.")

    if not os.path.isdir(FRONTEND_DIR):
        log("ERROR: Frontend directory not found.")
        return False

    log("✓ Frontend directory found.")

    if not os.path.isfile(
        os.path.join(FRONTEND_DIR, "package.json")
    ):
        log("ERROR: frontend/package.json not found.")
        return False

    log("✓ Frontend package.json found.")

    if not os.path.isfile(MODEL_PATH):
        log("WARNING: YOLO model best.pt was not found.")
        log(f"Expected: {MODEL_PATH}")
    else:
        log("✓ YOLO model found.")

    return True


# ============================================================
# BACKEND
# ============================================================

def start_backend():

    global backend_process

    set_status("backend", "STARTING...", "#d97706")

    log("Preparing backend...")

    if port_is_open(BACKEND_HOST, BACKEND_PORT):
        log(
            f"Port {BACKEND_PORT} is already in use. "
            "Clearing old process..."
        )

        kill_process_on_port(BACKEND_PORT)

        if port_is_open(BACKEND_HOST, BACKEND_PORT):
            log(
                f"ERROR: Port {BACKEND_PORT} could not be cleared."
            )
            set_status("backend", "ERROR", "#dc2626")
            return False

    log("Starting FastAPI backend...")

    command = [
        VENV_PYTHON,
        "-m",
        "uvicorn",
        "app:app",
        "--host",
        "0.0.0.0",
        "--port",
        str(BACKEND_PORT)
    ]

    try:

        backend_process = subprocess.Popen(
            command,
            cwd=BACKEND_DIR,
            stdout=subprocess.PIPE,
            stderr=subprocess.STDOUT,
            text=True,
            bufsize=1,
            creationflags=subprocess.CREATE_NO_WINDOW
        )

        threading.Thread(
            target=read_process_output,
            args=(backend_process, "BACKEND"),
            daemon=True
        ).start()

        log(
            f"FastAPI process started (PID {backend_process.pid})."
        )

        if not wait_for_port(
            BACKEND_HOST,
            BACKEND_PORT,
            timeout=30
        ):
            log("ERROR: Backend failed to open port 8000.")
            set_status("backend", "ERROR", "#dc2626")
            return False

        log("✓ Backend is listening on port 8000.")

        if not wait_for_backend(timeout=120):
            log(
                "ERROR: Backend health check failed."
            )
            set_status("backend", "ERROR", "#dc2626")
            return False

        set_status(
            "backend",
            "RUNNING",
            "#16a34a"
        )

        return True

    except Exception as e:

        log(f"ERROR starting backend: {e}")

        set_status(
            "backend",
            "ERROR",
            "#dc2626"
        )

        return False


# ============================================================
# FRONTEND
# ============================================================

def start_frontend():

    global frontend_process

    set_status(
        "frontend",
        "STARTING...",
        "#d97706"
    )

    log("Preparing frontend...")

    if port_is_open(
        FRONTEND_HOST,
        FRONTEND_PORT
    ):

        log(
            f"Frontend port {FRONTEND_PORT} is already in use."
        )

        log(
            "Assuming an existing Vite server is running."
        )

        set_status(
            "frontend",
            "RUNNING",
            "#16a34a"
        )

        return True

    log("Starting Vite frontend...")

    command = [
        "npm",
        "run",
        "dev",
        "--",
        "--host",
        FRONTEND_HOST,
        "--port",
        str(FRONTEND_PORT)
    ]

    try:

        frontend_process = subprocess.Popen(
            command,
            cwd=FRONTEND_DIR,
            stdout=subprocess.PIPE,
            stderr=subprocess.STDOUT,
            text=True,
            bufsize=1,
            shell=True,
            creationflags=subprocess.CREATE_NO_WINDOW
        )

        threading.Thread(
            target=read_process_output,
            args=(frontend_process, "FRONTEND"),
            daemon=True
        ).start()

        log(
            f"Vite process started (PID {frontend_process.pid})."
        )

        if not wait_for_port(
            FRONTEND_HOST,
            FRONTEND_PORT,
            timeout=60
        ):

            log(
                "ERROR: Frontend failed to open port 5173."
            )

            set_status(
                "frontend",
                "ERROR",
                "#dc2626"
            )

            return False

        log("✓ Frontend is listening on port 5173.")

        set_status(
            "frontend",
            "RUNNING",
            "#16a34a"
        )

        return True

    except Exception as e:

        log(f"ERROR starting frontend: {e}")

        set_status(
            "frontend",
            "ERROR",
            "#dc2626"
        )

        return False


# ============================================================
# PROCESS LOGGING
# ============================================================

def read_process_output(process, name):

    try:

        for line in iter(process.stdout.readline, ""):

            line = line.strip()

            if line:
                log(f"{name}: {line}")

    except Exception:
        pass


# ============================================================
# COMPLETE STARTUP
# ============================================================

def start_application():

    global launching

    if launching:
        return

    launching = True

    start_button.config(state="disabled")
    restart_button.config(state="disabled")

    def worker():

        global launching

        try:

            log("========================================")
            log("       PCB VISION AI STARTUP")
            log("========================================")

            if not validate_project():

                messagebox.showerror(
                    "PCB Vision AI",
                    "Project validation failed.\n\n"
                    "Check the launcher log."
                )

                return

            if not start_backend():

                messagebox.showerror(
                    "PCB Vision AI",
                    "Backend failed to start.\n\n"
                    "Check the launcher log."
                )

                return

            if not start_frontend():

                messagebox.showerror(
                    "PCB Vision AI",
                    "Frontend failed to start.\n\n"
                    "Check the launcher log."
                )

                return

            log("========================================")
            log("        PCB VISION AI READY")
            log("========================================")

            log(f"Backend:  {BACKEND_URL}")
            log(f"Frontend: {FRONTEND_URL}")

            root.after(
                1000,
                lambda: webbrowser.open(FRONTEND_URL)
            )

        finally:

            launching = False

            root.after(
                0,
                lambda: start_button.config(
                    state="normal"
                )
            )

            root.after(
                0,
                lambda: restart_button.config(
                    state="normal"
                )
            )

    threading.Thread(
        target=worker,
        daemon=True
    ).start()


# ============================================================
# STOP
# ============================================================

def stop_process(process, name):

    if process is None:
        return

    try:

        if process.poll() is None:

            log(f"Stopping {name}...")

            subprocess.run(
                [
                    "taskkill",
                    "/PID",
                    str(process.pid),
                    "/T",
                    "/F"
                ],
                capture_output=True,
                creationflags=subprocess.CREATE_NO_WINDOW
            )

            log(f"{name} stopped.")

    except Exception as e:

        log(
            f"Could not stop {name}: {e}"
        )


def stop_application():

    global backend_process
    global frontend_process

    stop_process(
        frontend_process,
        "Frontend"
    )

    stop_process(
        backend_process,
        "Backend"
    )

    backend_process = None
    frontend_process = None

    set_status(
        "backend",
        "STOPPED",
        "#6b7280"
    )

    set_status(
        "frontend",
        "STOPPED",
        "#6b7280"
    )


# ============================================================
# RESTART
# ============================================================

def restart_application():

    log("Restarting application...")

    stop_application()

    time.sleep(1)

    start_application()


# ============================================================
# OPEN APP
# ============================================================

def open_application():

    webbrowser.open(FRONTEND_URL)


# ============================================================
# GUI
# ============================================================

root = tk.Tk()

root.title("PCB Vision AI")
root.geometry("760x600")
root.minsize(700, 520)

root.configure(bg="#f5f5f5")


# Header

header = tk.Frame(
    root,
    bg="#111827",
    height=90
)

header.pack(
    fill="x"
)

title = tk.Label(
    header,
    text="PCB VISION AI",
    font=("Segoe UI", 22, "bold"),
    fg="white",
    bg="#111827"
)

title.pack(
    pady=(18, 0)
)

subtitle = tk.Label(
    header,
    text="Application Controller",
    font=("Segoe UI", 10),
    fg="#d1d5db",
    bg="#111827"
)

subtitle.pack()


# Status section

status_frame = tk.Frame(
    root,
    bg="#f5f5f5"
)

status_frame.pack(
    fill="x",
    padx=25,
    pady=20
)


tk.Label(
    status_frame,
    text="Backend",
    font=("Segoe UI", 11, "bold"),
    bg="#f5f5f5"
).grid(
    row=0,
    column=0,
    sticky="w",
    padx=(0, 10)
)

backend_status = tk.Label(
    status_frame,
    text="STOPPED",
    font=("Segoe UI", 11, "bold"),
    foreground="#6b7280",
    bg="#f5f5f5"
)

backend_status.grid(
    row=0,
    column=1,
    sticky="w"
)


tk.Label(
    status_frame,
    text="Frontend",
    font=("Segoe UI", 11, "bold"),
    bg="#f5f5f5"
).grid(
    row=1,
    column=0,
    sticky="w",
    padx=(0, 10),
    pady=(10, 0)
)

frontend_status = tk.Label(
    status_frame,
    text="STOPPED",
    font=("Segoe UI", 11, "bold"),
    foreground="#6b7280",
    bg="#f5f5f5"
)

frontend_status.grid(
    row=1,
    column=1,
    sticky="w",
    pady=(10, 0)
)


# Buttons

button_frame = tk.Frame(
    root,
    bg="#f5f5f5"
)

button_frame.pack(
    pady=5
)

start_button = ttk.Button(
    button_frame,
    text="START",
    command=start_application
)

start_button.grid(
    row=0,
    column=0,
    padx=5
)

stop_button = ttk.Button(
    button_frame,
    text="STOP",
    command=stop_application
)

stop_button.grid(
    row=0,
    column=1,
    padx=5
)

restart_button = ttk.Button(
    button_frame,
    text="RESTART",
    command=restart_application
)

restart_button.grid(
    row=0,
    column=2,
    padx=5
)

open_button = ttk.Button(
    button_frame,
    text="OPEN APP",
    command=open_application
)

open_button.grid(
    row=0,
    column=3,
    padx=5
)


# Log area

log_label = tk.Label(
    root,
    text="Startup Log",
    font=("Segoe UI", 11, "bold"),
    bg="#f5f5f5"
)

log_label.pack(
    anchor="w",
    padx=25,
    pady=(20, 5)
)


log_box = tk.Text(
    root,
    height=18,
    bg="#111827",
    fg="#e5e7eb",
    insertbackground="white",
    font=("Consolas", 9),
    relief="flat",
    padx=10,
    pady=10
)

log_box.pack(
    fill="both",
    expand=True,
    padx=25,
    pady=(0, 20)
)

log_box.configure(
    state="disabled"
)


# ============================================================
# CLOSE HANDLER
# ============================================================

def on_close():

    if backend_process or frontend_process:

        answer = messagebox.askyesno(
            "Exit PCB Vision AI",
            "Stop the backend and frontend before exiting?"
        )

        if not answer:
            return

        stop_application()

    root.destroy()


root.protocol(
    "WM_DELETE_WINDOW",
    on_close
)


# Initial log

log("PCB Vision AI launcher initialized.")
log(f"Project: {PROJECT_ROOT}")
log("Press START to launch the application.")


root.mainloop()