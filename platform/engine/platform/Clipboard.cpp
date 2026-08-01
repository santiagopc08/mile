#include "engine/platform/Clipboard.hpp"
#include <SDL3/SDL.h>

namespace platform
{
    bool Clipboard::SetText(std::string_view text)
    {
        std::string str(text);
        return SDL_SetClipboardText(str.c_str()) == 0;
    }

    std::string Clipboard::GetText()
    {
        char *text = SDL_GetClipboardText();
        if (!text)
        {
            return "";
        }
        std::string result(text);
        SDL_free(text);
        return result;
    }

    bool Clipboard::HasText()
    {
        return SDL_HasClipboardText() == true;
    }
}
