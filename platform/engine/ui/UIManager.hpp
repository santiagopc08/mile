#ifndef PLATFORM_ENGINE_UI_UI_MANAGER_HPP
#define PLATFORM_ENGINE_UI_UI_MANAGER_HPP

#include "engine/ui/Canvas.hpp"
#include "engine/graphics/Renderer.hpp"
#include <vector>
#include <memory>

namespace platform
{
    class UIManager
    {
    public:
        UIManager();
        ~UIManager();

        bool Initialize();
        void Shutdown();

        void Update(double dt);
        void Render(Renderer &renderer);

        Canvas *CreateCanvas(std::string name, UILayer layer = UILayer::HUD);
        void DestroyCanvas(const std::string &name);
        Canvas *GetCanvas(const std::string &name);

        [[nodiscard]] const std::vector<std::unique_ptr<Canvas>> &GetCanvases() const { return m_canvases; }
        [[nodiscard]] size_t GetTotalWidgetCount() const;
        [[nodiscard]] bool IsInitialized() const { return m_initialized; }

    private:
        std::vector<std::unique_ptr<Canvas>> m_canvases;
        bool m_initialized{false};
    };
}

#endif // PLATFORM_ENGINE_UI_UI_MANAGER_HPP
