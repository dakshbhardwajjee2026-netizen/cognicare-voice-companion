import ctypes
import ctypes.wintypes
import time
import pyautogui
from PIL import ImageGrab

user32 = ctypes.windll.user32
h_desktop = user32.OpenDesktopW("default", 0, False, 0x01FF)
user32.SetThreadDesktop(h_desktop)

clip_hwnd = None
def enum_cb(hwnd, lparam):
    global clip_hwnd
    if user32.IsWindowVisible(hwnd):
        buf = ctypes.create_unicode_buffer(512)
        user32.GetWindowTextW(hwnd, buf, 512)
        title = buf.value
        c_buf = ctypes.create_unicode_buffer(512)
        user32.GetClassNameW(hwnd, c_buf, 512)
        cname = c_buf.value
        if title == "Microsoft Clipchamp" or cname == "WinUIDesktopWin32WindowClass":
            clip_hwnd = hwnd
    return True

WNDENUMPROC = ctypes.WINFUNCTYPE(ctypes.wintypes.BOOL, ctypes.wintypes.HWND, ctypes.wintypes.LPARAM)
user32.EnumWindows(WNDENUMPROC(enum_cb), 0)

if clip_hwnd:
    user32.keybd_event(0x12, 0, 0, 0)
    user32.ShowWindow(clip_hwnd, 3)
    user32.SetForegroundWindow(clip_hwnd)
    user32.BringWindowToTop(clip_hwnd)
    user32.keybd_event(0x12, 0, 2, 0)

time.sleep(1)

# Step 1: Close any open dialogs like Open Dialog
print("Sending Escape to close any open file dialog...")
pyautogui.press('esc')
time.sleep(1)

# Step 2: Click on the sample.mp4 thumbnail to select it
print("Clicking sample.mp4 thumbnail at (150, 265)...")
pyautogui.click(150, 265)
time.sleep(1)

# Step 3: Click the green '+' (Add to timeline) button at (221, 188)
print("Clicking green '+' button at (221, 188)...")
pyautogui.click(221, 188)
time.sleep(1.5)

# Step 4: Also perform a drag-and-drop to guarantee placement
print("Performing drag-and-drop to timeline track...")
pyautogui.moveTo(150, 265)
time.sleep(0.2)
pyautogui.mouseDown()
time.sleep(0.3)
pyautogui.moveTo(450, 755, duration=0.8)
time.sleep(0.3)
pyautogui.mouseUp()

# Wait for timeline rendering
print("Waiting for timeline rendering...")
time.sleep(4)

im = ImageGrab.grab()
im.save(r"C:\Users\Daksh Bhardwaj\.gemini\antigravity\brain\543e62bf-5729-4722-bc74-64e709be5104\final_timeline_verification.png")
print("Saved final_timeline_verification.png successfully!")
