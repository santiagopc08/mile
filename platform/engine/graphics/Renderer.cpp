#include "engine/graphics/Renderer.hpp"
#include "engine/platform/SDLWindow.hpp"
#include "engine/core/Logger.hpp"
#include <SDL3/SDL.h>

namespace platform
{
    Renderer::Renderer() = default;

    Renderer::~Renderer()
    {
        Shutdown();
    }

    bool Renderer::Initialize(IWindow *window)
    {
        if (m_initialized)
        {
            LOG_WARN("[Renderer] Already initialized.");
            return true;
        }

        if (!window)
        {
            LOG_ERROR("[Renderer] Cannot initialize renderer: Window pointer is null.");
            return false;
        }

        auto *sdlWindow = dynamic_cast<SDLWindow *>(window);
        if (!sdlWindow || !sdlWindow->GetNativeWindow())
        {
            LOG_ERROR("[Renderer] Cannot initialize renderer: Native SDL_Window handle unavailable.");
            return false;
        }

        m_renderer = SDL_CreateRenderer(sdlWindow->GetNativeWindow(), nullptr);
        if (!m_renderer)
        {
            LOG_ERROR("[Renderer] Failed to create SDL_Renderer: {}", SDL_GetError());
            return false;
        }

        int w = 0, h = 0;
        window->GetSize(w, h);
        SetLogicalSize(w, h);

        m_initialized = true;
        LOG_INFO("[Renderer] Renderer initialized successfully (Default Clear Color: RGB(25,25,25)).");
        return true;
    }

    void Renderer::SetLogicalSize(int width, int height)
    {
        if (width <= 0 || height <= 0)
        {
            return;
        }

        m_context.ViewportWidth = width;
        m_context.ViewportHeight = height;
        m_camera.SetViewport(static_cast<float>(width), static_cast<float>(height));

        if (m_renderer)
        {
            // Window size is expressed in points while the backbuffer is in pixels.
            // Without a logical presentation the whole UI collapses into the top-left
            // quarter of the window on Retina displays.
            SDL_SetRenderLogicalPresentation(m_renderer, width, height, SDL_LOGICAL_PRESENTATION_LETTERBOX);
        }
    }

    void Renderer::Shutdown()
    {
        if (m_renderer)
        {
            LOG_INFO("[Renderer] Shutting down renderer...");
            SDL_DestroyRenderer(m_renderer);
            m_renderer = nullptr;
            m_initialized = false;
        }
    }

    void Renderer::BeginFrame()
    {
        m_commandQueue.ClearQueue();
        Clear();
    }

    void Renderer::Clear()
    {
        Clear(m_context.ClearColor.r, m_context.ClearColor.g, m_context.ClearColor.b, m_context.ClearColor.a);
    }

    void Renderer::Clear(float r, float g, float b, float a)
    {
        SubmitCommand(std::make_unique<ClearCommand>(r, g, b, a));
    }

    void Renderer::SubmitCommand(std::unique_ptr<RenderCommand> command)
    {
        m_commandQueue.Enqueue(std::move(command));
    }

    void Renderer::ExecuteCommands()
    {
        m_commandQueue.Flush(m_renderer);
    }

    void Renderer::Present()
    {
        SubmitCommand(std::make_unique<PresentCommand>());
        ExecuteCommands();
    }

    bool Renderer::SaveScreenshot(const std::string &filePath) const
    {
        if (!m_renderer)
        {
            LOG_ERROR("[Renderer] Cannot capture screenshot: renderer not initialized.");
            return false;
        }

        SDL_Surface *surface = SDL_RenderReadPixels(m_renderer, nullptr);
        if (!surface)
        {
            LOG_ERROR("[Renderer] Screenshot capture failed: {}", SDL_GetError());
            return false;
        }

        const bool saved = SDL_SaveBMP(surface, filePath.c_str());
        SDL_DestroySurface(surface);

        if (!saved)
        {
            LOG_ERROR("[Renderer] Could not write screenshot '{}': {}", filePath, SDL_GetError());
            return false;
        }

        LOG_INFO("[Renderer] Screenshot written to '{}'.", filePath);
        return true;
    }
}
