#ifndef PLATFORM_ENGINE_SCENE_SCENE_HPP
#define PLATFORM_ENGINE_SCENE_SCENE_HPP

#include "engine/scene/SceneMetadata.hpp"
#include "engine/scene/Registry.hpp"
#include "engine/scene/systems/TransformSystem.hpp"
#include <string_view>

namespace platform { class Camera2D; class Renderer; }

namespace platform
{
    enum class SceneState : uint8_t
    {
        Created = 0,
        Initialized,
        Active,
        Inactive,
        Shutdown
    };

    class Scene
    {
    public:
        Scene();
        explicit Scene(std::string_view name);
        virtual ~Scene();

        // Lifecycle Contract
        bool Initialize();
        void Activate();
        void Update(double dt);
        void FixedUpdate(double fixedDt);
        void PrepareRender();
        void Render(Renderer &renderer);
        void Deactivate();
        void Shutdown();

        [[nodiscard]] Registry &GetRegistry() { return m_registry; }
        [[nodiscard]] const Registry &GetRegistry() const { return m_registry; }
        [[nodiscard]] const SceneMetadata &GetMetadata() const { return m_metadata; }
        [[nodiscard]] SceneState GetState() const { return m_state; }
        [[nodiscard]] bool IsActive() const { return m_state == SceneState::Active; }
        [[nodiscard]] virtual Camera2D *GetActiveCamera() { return nullptr; }

        EntityID CreateEntity(const std::string &name = "Entity");
        void DestroyEntity(EntityID entity);

    protected:
        virtual void OnInitialize() {}
        virtual void OnActivate() {}
        virtual void OnUpdate(double dt) { (void)dt; }
        virtual void OnFixedUpdate(double fixedDt) { (void)fixedDt; }
        virtual void OnRender(Renderer &renderer) { (void)renderer; }
        virtual void OnDeactivate() {}
        virtual void OnShutdown() {}

    private:
        Registry m_registry;
        TransformSystem m_transformSystem;
        SceneMetadata m_metadata;
        SceneState m_state{SceneState::Created};
    };
}

#endif // PLATFORM_ENGINE_SCENE_SCENE_HPP
