#include "engine/ui/UIManager.hpp"
#include "engine/core/Logger.hpp"
#include <algorithm>

namespace platform
{
    UIManager::UIManager() = default;
    UIManager::~UIManager()
    {
        Shutdown();
    }

    bool UIManager::Initialize()
    {
        if (m_initialized)
        {
            return true;
        }

        m_initialized = true;
        LOG_INFO("[UIManager] UI Manager initialized successfully.");
        return true;
    }

    void UIManager::Shutdown()
    {
        if (!m_initialized)
        {
            return;
        }

        m_canvases.clear();
        m_initialized = false;
        LOG_INFO("[UIManager] UI Manager shutdown complete.");
    }

    void UIManager::Update(double dt)
    {
        if (!m_initialized)
        {
            return;
        }

        for (auto &canvas : m_canvases)
        {
            canvas->Update(dt);
        }
    }

    void UIManager::Render(Renderer &renderer)
    {
        if (!m_initialized)
        {
            return;
        }

        for (auto &canvas : m_canvases)
        {
            canvas->Render(renderer);
        }
    }

    Canvas *UIManager::CreateCanvas(std::string name, UILayer layer)
    {
        auto canvas = std::make_unique<Canvas>(std::move(name), layer);
        Canvas *ptr = canvas.get();

        m_canvases.push_back(std::move(canvas));

        // Keep canvases sorted by UILayer depth
        std::sort(m_canvases.begin(), m_canvases.end(), [](const std::unique_ptr<Canvas> &a, const std::unique_ptr<Canvas> &b) {
            return static_cast<uint8_t>(a->GetLayer()) < static_cast<uint8_t>(b->GetLayer());
        });

        return ptr;
    }

    void UIManager::DestroyCanvas(const std::string &name)
    {
        auto it = std::remove_if(m_canvases.begin(), m_canvases.end(), [&name](const std::unique_ptr<Canvas> &c) {
            return c->GetName() == name;
        });
        m_canvases.erase(it, m_canvases.end());
    }

    Canvas *UIManager::GetCanvas(const std::string &name)
    {
        for (auto &canvas : m_canvases)
        {
            if (canvas->GetName() == name)
            {
                return canvas.get();
            }
        }
        return nullptr;
    }

    size_t UIManager::GetTotalWidgetCount() const
    {
        size_t total = 0;
        for (const auto &canvas : m_canvases)
        {
            total += canvas->GetTotalWidgetCount();
        }
        return total;
    }
}
