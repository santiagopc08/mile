#include "engine/platform/SDLWindow.hpp"
#include "engine/platform/Platform.hpp"
#include "engine/core/Logger.hpp"
#include <SDL3/SDL.h>

namespace platform
{
    SDLWindow::SDLWindow() = default;

    SDLWindow::SDLWindow(const WindowConfig &config)
    {
        Create(config);
    }

    SDLWindow::~SDLWindow()
    {
        Destroy();
    }

    bool SDLWindow::Create(const WindowConfig &config)
    {
        if (m_window)
        {
            LOG_WARN("[Platform] Window already created.");
            return true;
        }

        if (!Platform::IsInitialized())
        {
            if (!Platform::Initialize())
            {
                LOG_ERROR("[Platform] Cannot create window: Platform initialization failed.");
                return false;
            }
        }

        m_config = config;

        SDL_WindowFlags flags = SDL_WINDOW_HIDDEN; // Hidden until initialization completes

        if (m_config.Resizable)
        {
            flags |= SDL_WINDOW_RESIZABLE;
        }
        if (m_config.HighDPI)
        {
            flags |= SDL_WINDOW_HIGH_PIXEL_DENSITY;
        }
        if (m_config.Fullscreen)
        {
            flags |= SDL_WINDOW_FULLSCREEN;
        }
        if (m_config.Borderless)
        {
            flags |= SDL_WINDOW_BORDERLESS;
        }

        m_window = SDL_CreateWindow(
            m_config.Title.c_str(),
            m_config.Width,
            m_config.Height,
            flags
        );

        if (!m_window)
        {
            LOG_ERROR("[Platform] Failed to create SDL window: {}", SDL_GetError());
            return false;
        }

        // Set minimum window size
        SDL_SetWindowMinimumSize(m_window, m_config.MinWidth, m_config.MinHeight);

        // Center window on screen
        SDL_SetWindowPosition(m_window, SDL_WINDOWPOS_CENTERED, SDL_WINDOWPOS_CENTERED);

        m_isOpen = true;
        LOG_INFO("[Platform] Window created successfully: '{}' ({}x{}).", m_config.Title, m_config.Width, m_config.Height);

        // Show window when creation succeeds
        Show();

        return true;
    }

    void SDLWindow::Destroy()
    {
        if (m_window)
        {
            LOG_INFO("[Platform] Destroying window...");
            SDL_DestroyWindow(m_window);
            m_window = nullptr;
            m_isOpen = false;
        }
    }

    void SDLWindow::Show()
    {
        if (m_window)
        {
            SDL_ShowWindow(m_window);
        }
    }

    void SDLWindow::Hide()
    {
        if (m_window)
        {
            SDL_HideWindow(m_window);
        }
    }

    void SDLWindow::Update()
    {
    }

    void SDLWindow::Resize(int width, int height)
    {
        if (m_window)
        {
            SDL_SetWindowSize(m_window, width, height);
            m_config.Width = width;
            m_config.Height = height;
        }
    }

    void SDLWindow::SetTitle(std::string_view title)
    {
        m_config.Title = std::string(title);
        if (m_window)
        {
            SDL_SetWindowTitle(m_window, m_config.Title.c_str());
        }
    }

    void SDLWindow::SetFullscreen(bool fullscreen)
    {
        m_config.Fullscreen = fullscreen;
        if (m_window)
        {
            SDL_SetWindowFullscreen(m_window, fullscreen);
        }
    }

    void SDLWindow::SetBorderless(bool borderless)
    {
        m_config.Borderless = borderless;
        if (m_window)
        {
            SDL_SetWindowBordered(m_window, !borderless);
        }
    }

    void SDLWindow::SetResizable(bool resizable)
    {
        m_config.Resizable = resizable;
        if (m_window)
        {
            SDL_SetWindowResizable(m_window, resizable);
        }
    }

    void SDLWindow::GetSize(int &width, int &height) const
    {
        if (m_window)
        {
            SDL_GetWindowSize(m_window, &width, &height);
        }
        else
        {
            width = m_config.Width;
            height = m_config.Height;
        }
    }

    void SDLWindow::GetFramebufferSize(int &width, int &height) const
    {
        if (m_window)
        {
            SDL_GetWindowSizeInPixels(m_window, &width, &height);
        }
        else
        {
            width = m_config.Width;
            height = m_config.Height;
        }
    }

    bool SDLWindow::IsOpen() const
    {
        return m_isOpen;
    }

    void SDLWindow::Close()
    {
        m_isOpen = false;
    }
}
