using System;
using System.Xml.Linq;
using System.IO;
using System.Runtime.InteropServices;
using System.Diagnostics;
using System.Windows;
using System.Windows.Interop;
using System.Windows.Media.Imaging;

public class UserWindows
{
    private static Process _realProcess;
    private const UInt32 WM_GETICON = 0x007F;
    private const UInt32 IDI_APPLICATION = 0x7F00;
    private const int ICON_BIG = 1;
    private const int GCL_HICON = -14;

    [DllImport("user32.dll")]
    private static extern IntPtr GetForegroundWindow();

    [DllImport("user32.dll")]
    private static extern int GetWindowThreadProcessId(IntPtr hWnd, out int lpdwProcessId);
    private delegate bool WindowEnumProc(IntPtr hwnd, IntPtr lparam);

    [DllImport("user32.dll")]
    private static extern bool EnumChildWindows(IntPtr hwnd, WindowEnumProc callback, IntPtr lParam);

    [DllImport("user32.dll", CharSet = CharSet.Auto)]
    private static extern IntPtr SendMessage(IntPtr hWnd, UInt32 Msg, IntPtr wParam, IntPtr lParam);

    [DllImport("user32.dll", EntryPoint = "GetClassLong")]
    private static extern uint GetClassLongPtr32(IntPtr hWnd, int nIndex);

    [DllImport("user32.dll", EntryPoint = "GetClassLongPtr")]
    private static extern IntPtr GetClassLongPtr64(IntPtr hWnd, int nIndex);

    [DllImport("user32.dll")]
    private static extern IntPtr LoadIcon(IntPtr hInstance, IntPtr lpIconName);

    public class Response
    {
        public int Id;
        public string ProcessName;
        public string AppTitle;
        public string AppName;
        public string Icon;
        public string Error;

        public Response(string error)
        {
            Id = 0;
            ProcessName = "";
            AppTitle = "";
            AppName = "";
            Icon = "";
            Error = error;
        }

        public Response(Process process, string icon, string error)
        {
            Id = process.Id;
            ProcessName = process.ProcessName;
            AppTitle = process.MainWindowTitle;
            AppName = process.MainModule.FileVersionInfo.ProductName;
            Icon = icon;
            Error = error;
        }
    }

    private static bool IsModernAppProcess(Process process)
    {
        return process.ProcessName == "ApplicationFrameHost";
    }

    private static bool ChildWindowCallback(IntPtr hwnd, IntPtr lparam)
    {
        var process = Process.GetProcessById(GetWindowProcessId(hwnd));
        if (process.ProcessName != "ApplicationFrameHost")
        {
            _realProcess = process;
        }
        return true;
    }

    private static int GetWindowProcessId(IntPtr hwnd)
    {
        int pid;
        GetWindowThreadProcessId(hwnd, out pid);
        return pid;
    }

    private static IntPtr GetClassLongPtr(IntPtr hWnd, int nIndex)
    {
        if (IntPtr.Size > 4)
            return GetClassLongPtr64(hWnd, nIndex);
        else
            return new IntPtr(GetClassLongPtr32(hWnd, nIndex));
    }

    private static BitmapSource GetWindowIcon(IntPtr windowHandle)
    {
        var hIcon = default(IntPtr);
        hIcon = SendMessage(windowHandle, WM_GETICON, (IntPtr)ICON_BIG, IntPtr.Zero);

        if (hIcon == IntPtr.Zero)
            hIcon = GetClassLongPtr(windowHandle, GCL_HICON);

        var fallbackIconHandler = LoadIcon(IntPtr.Zero, (IntPtr)IDI_APPLICATION);

        if (hIcon != IntPtr.Zero && hIcon != fallbackIconHandler)
        {
            return Imaging.CreateBitmapSourceFromHIcon(hIcon, Int32Rect.Empty, BitmapSizeOptions.FromEmptyOptions());
        }
        else
        {
            return null;
        }
    }

    private static BitmapSource GetModernAppLogo(Process process)
    {
        var exePath = process.MainModule.FileName;
        var dir = Path.GetDirectoryName(exePath);
        var manifestPath = Path.Combine(dir, "AppxManifest.xml");
        if (File.Exists(manifestPath))
        {
            string pathToLogo;
            using (var fs = File.OpenRead(manifestPath))
            {
                var manifest = XDocument.Load(fs);
                const string ns = "http://schemas.microsoft.com/appx/manifest/foundation/windows10";
                pathToLogo = manifest.Root.Element(XName.Get("Properties", ns)).Element(XName.Get("Logo", ns)).Value;
            }
            string finalLogo = null;
            foreach (var logoFile in Directory.GetFiles(System.IO.Path.Combine(dir, System.IO.Path.GetDirectoryName(pathToLogo)),
                System.IO.Path.GetFileNameWithoutExtension(pathToLogo) + "*" + System.IO.Path.GetExtension(pathToLogo)))
            {
                finalLogo = logoFile;
                break;
            }

            if (System.IO.File.Exists(finalLogo))
            {
                using (var fs = File.OpenRead(finalLogo))
                {
                    var img = new BitmapImage()
                    {
                    };
                    img.BeginInit();
                    img.StreamSource = fs;
                    img.CacheOption = BitmapCacheOption.OnLoad;
                    img.EndInit();
                    return img;
                }
            }
        }
        else
        {
            return GetWindowIcon(process.MainWindowHandle);
        }
        return null;
    }

    private static string ImageToBase64(BitmapSource bitmap)
    {
        if (bitmap == null)
        {
            return "";
        }
        var encoder = new PngBitmapEncoder();
        var frame = BitmapFrame.Create(bitmap);
        encoder.Frames.Add(frame);
        using (var stream = new MemoryStream())
        {
            encoder.Save(stream);
            return Convert.ToBase64String(stream.ToArray());
        }
    }

    private static Response GetAppInfo(Process process)
    {
        string icon = "";
        string error = "";
        try
        {
            icon = ImageToBase64(GetModernAppLogo(process));
        }
        catch (Exception ex)
        {
            error = ex.Message;
        }
        return new Response(process, icon, error);
    }

    public static Response GetForegroundAppInfo()
    {
        try
        {
            var hwnd = GetForegroundWindow();
            var foregroundProcess = Process.GetProcessById(GetWindowProcessId(hwnd));
            if (IsModernAppProcess(foregroundProcess))
            {
                EnumChildWindows(foregroundProcess.MainWindowHandle, ChildWindowCallback, IntPtr.Zero);
                foregroundProcess = _realProcess;
            }
            return GetAppInfo(foregroundProcess);
        }
        catch (Exception ex)
        {
            return new Response(ex.Message);
        }
    }

    public static Response GetAppInfoByProcessName(string name)
    {
        Process[] processes = Process.GetProcessesByName(name);
        if (processes.Length > 0)
        {
            return GetAppInfo(processes[0]);
        }
        return new Response("No information");
    }
}
