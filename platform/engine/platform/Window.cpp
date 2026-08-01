#include "engine/platform/Window.hpp"
#include "engine/core/Logger.hpp"
#include <SDL3/SDL.h>

namespace platform
{
    Window::Window() = default;

    Window::~Window()
    {
        Shutdown();
    }

    bool Window::Initialize(std::string_view title, int width, int height)
    {
        m_title = title;
        m_width = width;
        m_height = height;

        if (!SDL_Init(SDL_INIT_VIDEO))
        {
            Logger::Error("Failed to initialize SDL Video: {}", SDL_GetError());
            return false;
        }

        m_window = SDL_CreateWindow(
            m_title.c_str(),
            m_width,
            m_height,
            SDL_WINDOW_RESIZABLE | SDL_WINDOW_HIGH_PIXEL_DENSITY
        );

        if (!m_window)
        {
            Logger::Error("Failed to create SDL Window: {}", SDL_GetError());
            SDL_Quit();
            return false;
        }

        m_isClosed = false;
        Logger::Info("Window '{}' ({}x{}) created successfully.", m_title, m_width, m_height);
        return true;
    }

    void Window::Shutdown()
    {
        if (m_window)
        {
            SDL_DestroyWindow(m_window);
            m_window = nullptr;
            SDL_Quit();
            Logger::Info("Window destroyed.");
        }
    }

    bool Window::PollEvents(SDL_Event &event)
    {
        bool hasEvent = SDL_PollEvent(&event);
        if (hasEvent)
        {
            if (event.type == SDL_EVENT_QUIT)
            {
                m_isClosed = true;
            }
            else if (event.type == SDL_EVENT_WINDOW_RESIZED)
            {
                m_width = event.window.data1;
                m_height = event.window.data2;
            }
        }
        return hasEvent;
    }

    void Window::SetTitle(std::string_view title)
    {
        m_title = title;
        if (m_window)
        {
            SDL_SetWindowTitle(m_window, m_title.c_str());
        }
    }

    void Window::SetSize(int width, int height)
    {
        m_width = width;
        m_height = height;
        if (m_window)
        {
            SDL_SetWindowSize(m_window, m_width, m_height);
        }
    }
}
