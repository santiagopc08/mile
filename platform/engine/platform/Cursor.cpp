#include "engine/platform/Cursor.hpp"
#include <SDL3/SDL.h>

namespace platform
{
    static bool s_cursorVisible = true;
    static bool s_cursorLocked = false;

    void Cursor::Show()
    {
        SDL_ShowCursor();
        s_cursorVisible = true;
    }

    void Cursor::Hide()
    {
        SDL_HideCursor();
        s_cursorVisible = false;
    }

    bool Cursor::IsVisible()
    {
        return s_cursorVisible;
    }

    void Cursor::Lock()
    {
        SDL_Window *window = SDL_GetKeyboardFocus();
        if (window)
        {
            SDL_SetWindowRelativeMouseMode(window, true);
        }
        s_cursorLocked = true;
    }

    void Cursor::Unlock()
    {
        SDL_Window *window = SDL_GetKeyboardFocus();
        if (window)
        {
            SDL_SetWindowRelativeMouseMode(window, false);
        }
        s_cursorLocked = false;
    }

    bool Cursor::IsLocked()
    {
        return s_cursorLocked;
    }

    void Cursor::SetSystemCursor(SystemCursor cursor)
    {
        SDL_SystemCursor sdlCursor = SDL_SYSTEM_CURSOR_DEFAULT;

        switch (cursor)
        {
        case SystemCursor::Text:
            sdlCursor = SDL_SYSTEM_CURSOR_TEXT;
            break;
        case SystemCursor::Wait:
            sdlCursor = SDL_SYSTEM_CURSOR_WAIT;
            break;
        case SystemCursor::Crosshair:
            sdlCursor = SDL_SYSTEM_CURSOR_CROSSHAIR;
            break;
        case SystemCursor::Hand:
            sdlCursor = SDL_SYSTEM_CURSOR_POINTER;
            break;
        case SystemCursor::NotAllowed:
            sdlCursor = SDL_SYSTEM_CURSOR_NOT_ALLOWED;
            break;
        case SystemCursor::ResizeNS:
            sdlCursor = SDL_SYSTEM_CURSOR_NS_RESIZE;
            break;
        case SystemCursor::ResizeEW:
            sdlCursor = SDL_SYSTEM_CURSOR_EW_RESIZE;
            break;
        default:
            sdlCursor = SDL_SYSTEM_CURSOR_DEFAULT;
            break;
        }

        SDL_Cursor *newCursor = SDL_CreateSystemCursor(sdlCursor);
        if (newCursor)
        {
            SDL_SetCursor(newCursor);
        }
    }
}
