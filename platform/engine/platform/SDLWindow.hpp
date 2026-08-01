#ifndef PLATFORM_ENGINE_PLATFORM_SDL_WINDOW_HPP
#define PLATFORM_ENGINE_PLATFORM_SDL_WINDOW_HPP

#include "engine/platform/IWindow.hpp"

struct SDL_Window;

namespace platform
{
    class SDLWindow : public IWindow
    {
    public:
        SDLWindow();
        explicit SDLWindow(const WindowConfig &config);
        ~SDLWindow() override;

        bool Create(const WindowConfig &config) override;
        void Destroy() override;
        void Show() override;
        void Hide() override;
        void Update() override;
        void Resize(int width, int height) override;
        void SetTitle(std::string_view title) override;
        void SetFullscreen(bool fullscreen) override;
        void SetBorderless(bool borderless) override;
        void SetResizable(bool resizable) override;
        void GetSize(int &width, int &height) const override;
        void GetFramebufferSize(int &width, int &height) const override;
        [[nodiscard]] bool IsOpen() const override;
        void Close() override;

        [[nodiscard]] SDL_Window *GetNativeWindow() const { return m_window; }

    private:
        SDL_Window *m_window{nullptr};
        WindowConfig m_config{};
        bool m_isOpen{false};
    };
}

#endif // PLATFORM_ENGINE_PLATFORM_SDL_WINDOW_HPP
