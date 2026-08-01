#ifndef PLATFORM_ENGINE_PLATFORM_IWINDOW_HPP
#define PLATFORM_ENGINE_PLATFORM_IWINDOW_HPP

#include "engine/platform/WindowConfig.hpp"
#include <string_view>

namespace platform
{
    class IWindow
    {
    public:
        virtual ~IWindow() = default;

        virtual bool Create(const WindowConfig &config) = 0;
        virtual void Destroy() = 0;
        virtual void Show() = 0;
        virtual void Hide() = 0;
        virtual void Update() = 0;
        virtual void Resize(int width, int height) = 0;
        virtual void SetTitle(std::string_view title) = 0;
        virtual void SetFullscreen(bool fullscreen) = 0;
        virtual void SetBorderless(bool borderless) = 0;
        virtual void SetResizable(bool resizable) = 0;
        virtual void GetSize(int &width, int &height) const = 0;
        virtual void GetFramebufferSize(int &width, int &height) const = 0;
        [[nodiscard]] virtual bool IsOpen() const = 0;
        virtual void Close() = 0;
    };
}

#endif // PLATFORM_ENGINE_PLATFORM_IWINDOW_HPP
