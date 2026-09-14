import ctypes
import ctypes.wintypes
import time
from PIL import ImageGrab

user32 = ctypes.windll.user32
kernel32 = ctypes.windll.kernel32
h_desktop = user32.OpenDesktopW("default", 0, False, 0x01FF)
user32.SetThreadDesktop(h_desktop)

# Unlock foreground
user32.LockSetForegroundWindow(2) # LSFW_UNLOCK

clip_hwnd = None
anti_hwnd = None

def enum_cb(hwnd, lparam):
    global clip_hwnd, anti_hwnd
    if user32.IsWindowVisible(hwnd):
        buf = ctypes.create_unicode_buffer(512)
        user32.GetWindowTextW(hwnd, buf, 512)
        title = buf.value
        c_buf = ctypes.create_unicode_buffer(512)
        user32.GetClassNameW(hwnd, c_buf, 512)
        cname = c_buf.value
        if "Microsoft Clipchamp" in title or ("Clipchamp" in title and "Antigravity" not in title):
            clip_hwnd = hwnd
        if "Antigravity" in title:
            anti_hwnd = hwnd
    return True

WNDENUMPROC = ctypes.WINFUNCTYPE(ctypes.wintypes.BOOL, ctypes.wintypes.HWND, ctypes.wintypes.LPARAM)
user32.EnumWindows(WNDENUMPROC(enum_cb), 0)

print(f"Clipchamp hwnd: {clip_hwnd}, Antigravity hwnd: {anti_hwnd}")

if anti_hwnd:
    # Minimize Antigravity so Clipchamp is uncovered
    user32.ShowWindow(anti_hwnd, 6) # SW_MINIMIZE
    time.sleep(0.5)

if clip_hwnd:
    # Win32 Alt trick to bypass foreground lock
    user32.keybd_event(0x12, 0, 0, 0)
    user32.ShowWindow(clip_hwnd, 3) # SW_MAXIMIZE
    user32.SetForegroundWindow(clip_hwnd)
    user32.BringWindowToTop(clip_hwnd)
    user32.keybd_event(0x12, 0, 2, 0)

time.sleep(1.5)

im = ImageGrab.grab()
im.save(r"C:\Users\Daksh Bhardwaj\.gemini\antigravity\brain\543e62bf-5729-4722-bc74-64e709be5104\clip_front.png")
print("Saved clip_front.png")
