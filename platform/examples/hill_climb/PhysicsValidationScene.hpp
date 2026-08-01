#ifndef PLATFORM_EXAMPLES_HILL_CLIMB_PHYSICS_VALIDATION_SCENE_HPP
#define PLATFORM_EXAMPLES_HILL_CLIMB_PHYSICS_VALIDATION_SCENE_HPP

#include "engine/scene/Scene.hpp"
#include "engine/physics/systems/PhysicsSystem.hpp"
#include "engine/physics/PhysicsDebugRenderer.hpp"
#include "engine/graphics/camera/CameraManager.hpp"
#include "engine/graphics/RenderSystem.hpp"
#include "engine/events/EventQueue.hpp"

namespace platform
{
    class PhysicsValidationScene : public Scene
    {
    public:
        PhysicsValidationScene();
        ~PhysicsValidationScene() override = default;

        void BindEventQueue(EventQueue *eventQueue) { m_eventQueue = eventQueue; }

        [[nodiscard]] PhysicsSystem &GetPhysicsSystem() { return m_physicsSystem; }
        [[nodiscard]] PhysicsDebugRenderer &GetDebugRenderer() { return m_debugRenderer; }
        [[nodiscard]] EntityID GetGroundEntity() const { return m_groundEntity; }
        [[nodiscard]] EntityID GetBoxEntity() const { return m_boxEntity; }
        [[nodiscard]] EntityID GetCircleEntity() const { return m_circleEntity; }

    protected:
        void OnInitialize() override;
        void OnUpdate(double dt) override;
        void OnShutdown() override;

    private:
        PhysicsSystem m_physicsSystem;
        PhysicsDebugRenderer m_debugRenderer;
        CameraManager m_cameraManager;
        RenderSystem m_renderSystem;

        EntityID m_groundEntity{kNullEntity};
        EntityID m_boxEntity{kNullEntity};
        EntityID m_circleEntity{kNullEntity};

        EventQueue *m_eventQueue{nullptr};
    };
}

#endif // PLATFORM_EXAMPLES_HILL_CLIMB_PHYSICS_VALIDATION_SCENE_HPP
