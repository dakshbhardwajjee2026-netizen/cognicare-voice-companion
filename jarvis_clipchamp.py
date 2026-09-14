"""
JARVIS Autonomous Laptop Controller - Microsoft Clipchamp Module
Author: JARVIS Agent
Description:
    Fully automated script to launch Microsoft Clipchamp, create a new video project,
    import a target video file from the Downloads folder, and insert it onto the timeline.
"""

import os
import sys
import time
import ctypes
import ctypes.wintypes
import pyautogui

def switch_to_interactive_desktop():
    """Binds current thread to the interactive user desktop station."""
    user32 = ctypes.windll.user32
    h_desktop = user32.OpenDesktopW("default", 0, False, 0x01FF)
    if h_desktop:
        user32.SetThreadDesktop(h_desktop)
    return user32

def find_windows(user32):
    """Finds Clipchamp host, WebView, and file dialog HWNDs."""
    hwnds = {'host': None, 'webview': None, 'dialog': None}
    def enum_cb(hwnd, lparam):
        if user32.IsWindowVisible(hwnd):
            buf = ctypes.create_unicode_buffer(512)
            user32.GetWindowTextW(hwnd, buf, 512)
            title = buf.value
            cbuf = ctypes.create_unicode_buffer(512)
            user32.GetClassNameW(hwnd, cbuf, 512)
            cname = cbuf.value
            
            if title == "Open" and cname == "#32770":
                hwnds['dialog'] = hwnd
            elif cname == "WinUIDesktopWin32WindowClass" or title == "Microsoft Clipchamp":
                hwnds['host'] = hwnd
            elif ("Video Project" in title or "Clipchamp - " in title) and cname == "Chrome_WidgetWin_1":
                hwnds['webview'] = hwnd
        return True
    
    WNDENUMPROC = ctypes.WINFUNCTYPE(ctypes.wintypes.BOOL, ctypes.wintypes.HWND, ctypes.wintypes.LPARAM)
    user32.EnumWindows(WNDENUMPROC(enum_cb), 0)
    return hwnds

def activate_window(user32, hwnd):
    """Bypasses Windows foreground lock and activates window."""
    if not hwnd:
        return
    user32.keybd_event(0x12, 0, 0, 0)
    user32.ShowWindow(hwnd, 3) # SW_MAXIMIZE
    user32.SetForegroundWindow(hwnd)
    user32.BringWindowToTop(hwnd)
    user32.keybd_event(0x12, 0, 2, 0)
    time.sleep(0.5)

def run_pipeline(video_path):
    print("=" * 60)
    print("JARVIS: Initializing Clipchamp Automation Pipeline")
    print("=" * 60)
    
    user32 = switch_to_interactive_desktop()
    
    # 1. Check if Clipchamp is open, otherwise launch it
    hwnds = find_windows(user32)
    if not hwnds['host'] and not hwnds['webview']:
        print("[JARVIS] Launching Microsoft Clipchamp via Windows App Protocol...")
        os.system("start clipchamp:")
        time.sleep(6)
        hwnds = find_windows(user32)
    
    target_hwnd = hwnds['webview'] or hwnds['host']
    activate_window(user32, target_hwnd)
    
    # 2. Check if already in an editor project or on home page
    if not hwnds['webview'] or "Video Project" not in (hwnds['webview'] and str(hwnds['webview']) or ""):
        print("[JARVIS] Navigating to Home and Creating a new project...")
        pyautogui.click(100, 105) # Home tab
        time.sleep(1.5)
        pyautogui.click(570, 254) # Create a new video
        time.sleep(8)
        hwnds = find_windows(user32)
        activate_window(user32, hwnds['webview'] or hwnds['host'])

    # 3. Import video file
    print(f"[JARVIS] Importing video: {video_path}...")
    pyautogui.click(250, 170) # Center of Import media button
    time.sleep(2)
    
    # Type filename in Open dialog
    pyautogui.write(os.path.basename(video_path), interval=0.05)
    time.sleep(0.5)
    pyautogui.press('enter')
    time.sleep(5)
    
    # 4. Add to timeline
    print("[JARVIS] Selecting video in 'My media' and adding to Timeline...")
    activate_window(user32, hwnds['webview'] or hwnds['host'])
    pyautogui.click(250, 320) # Click media thumbnail
    time.sleep(0.8)
    pyautogui.click(428, 220) # Click green '+' Add to timeline button
    time.sleep(2)
    
    print("[JARVIS] Task completed successfully. Video is live on the timeline.")
    print("=" * 60)

if __name__ == "__main__":
    downloads = os.path.join(os.environ['USERPROFILE'], 'Downloads')
    video = os.path.join(downloads, 'sample.mp4')
    run_pipeline(video)
