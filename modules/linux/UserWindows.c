#include <stdlib.h>
#include <stdio.h>
#include <locale.h>
#include <unistd.h>

#define WNCK_I_KNOW_THIS_IS_UNSTABLE 1
#include <X11/Xlib.h>
#include <X11/Xutil.h>
#include <libwnck/libwnck.h>

#define MAXSTR 1000

const char* getWindowTitle(WnckWindow* window) {
  return wnck_window_get_name(window);
}

const char* getWindowApp(WnckWindow* window) {
  WnckClassGroup* classGroup = wnck_window_get_class_group(window);
  return wnck_class_group_get_res_class(classGroup);
}

const char* getWindowAppName(WnckWindow* window) {
  WnckApplication* app = wnck_window_get_application(window);
  return wnck_application_get_name(app);
}

int getWindowPid(WnckWindow* window) {
  return wnck_window_get_pid(window);
}

char* getWindowIconBase64(WnckWindow* window) {
  gboolean isFallbackIcon = wnck_window_get_icon_is_fallback(window);
  if (isFallbackIcon) {
    return "";
  }
  GdkPixbuf* pixbuf = wnck_window_get_icon(window);
  char* buffer;
  gsize size;
  GError* err = NULL;
  gdk_pixbuf_save_to_buffer(pixbuf, &buffer, &size, "png", &err, NULL);
  return g_base64_encode((const guchar*)buffer, size);
}

int main(int argc, char **argv) {
    gdk_init(&argc, &argv);
    WnckScreen* screen = wnck_screen_get_default();
    wnck_screen_force_update(screen);
    WnckWindow* window = wnck_screen_get_active_window(screen);
    int pid = getWindowPid(window);
    const char* app = getWindowApp(window);
    const char* title = getWindowTitle(window);
    const char* name = getWindowAppName(window);
    char* icon = getWindowIconBase64(window);
    printf("@{Id=%i; ProcessName=%s; AppTitle=%s; AppName=%s; Icon=%s; Error=}",
      pid, app, title, name, icon);
    return 0;
}
