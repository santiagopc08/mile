#ifndef PLATFORM_ENGINE_PLATFORM_WINDOW_HPP
#define PLATFORM_ENGINE_PLATFORM_WINDOW_HPP

#include <string>
#include <string_view>

struct SDL_Window;
union SDL_Event;

namespace platform
{
    class Window
    {
    public:
        Window();
        ~Window();

        bool Initialize(std::string_view title, int width, int height);
        void Shutdown();

        bool PollEvents(SDL_Event &event);
        void SetTitle(std::string_view title);
        void SetSize(int width, int height);

        [[nodiscard]] SDL_Window *GetNativeWindow() const { return m_window; }
        [[nodiscard]] int GetWidth() const { return m_width; }
        [[nodiscard]] int GetHeight() const { return m_height; }
        [[nodiscard]] std::string_view GetTitle() const { return m_title; }
        [[nodiscard]] bool IsClosed() const { return m_isClosed; }

        void RequestClose() { m_isClosed = true; }

    private:
        SDL_Window *m_window{nullptr};
        std::string m_title{"Platform Application"};
        int m_width{1280};
        int m_height{720};
        bool m_isClosed{false};
    };
}

#endif // PLATFORM_ENGINE_PLATFORM_WINDOW_HPP
